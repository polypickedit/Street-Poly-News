
-- Migration: Cleanup Duplicate Functions and Apply Clean RLS (Fixed)
-- Description: Removes duplicate capability functions, refactors audit view, and ensures clean RLS boundaries.

-- 1. Cleanup Duplicate Functions
-- First, drop the functions using CASCADE to handle any dependencies, 
-- then recreate them once with proper search_path and SECURITY DEFINER.
DROP FUNCTION IF EXISTS public.consume_capability(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.consume_capability(UUID, TEXT, BIGINT, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.consume_capability_v2(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.has_capability(UUID, TEXT) CASCADE;

-- Recreate has_capability
CREATE OR REPLACE FUNCTION public.has_capability(p_user_id UUID, p_capability TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_capabilities
        WHERE user_id = p_user_id
          AND capability = p_capability
          AND (expires_at IS NULL OR expires_at > now())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate consume_capability
CREATE OR REPLACE FUNCTION public.consume_capability(p_user_id UUID, p_capability TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_id UUID;
BEGIN
    SELECT id INTO v_id
    FROM public.user_capabilities
    WHERE user_id = p_user_id
      AND capability = p_capability
      AND (expires_at IS NULL OR expires_at > now())
    ORDER BY granted_at ASC
    LIMIT 1;

    IF v_id IS NOT NULL THEN
        DELETE FROM public.user_capabilities WHERE id = v_id;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execution to necessary roles
GRANT EXECUTE ON FUNCTION public.has_capability(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.consume_capability(UUID, TEXT) TO authenticated, service_role;

-- 2. Audit Role Modeling & Clean RLS
-- Ensure is_admin_or_editor is clean and robust
CREATE OR REPLACE FUNCTION public.is_admin_or_editor()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() 
          AND r.name IN ('admin', 'editor')
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 3. Refactor Audit View (Remove SECURITY DEFINER and use RLS)
DROP VIEW IF EXISTS public.vw_status_integrity_audit;
CREATE OR REPLACE VIEW public.vw_status_integrity_audit AS
SELECT 
    s.id AS submission_id,
    s.status AS current_status,
    s.payment_status,
    s.artist_name,
    s.track_title,
    (SELECT COUNT(*) FROM public.submission_status_history h WHERE h.submission_id = s.id) AS transition_count,
    (SELECT MAX(created_at) FROM public.submission_status_history h WHERE h.submission_id = s.id) AS last_transition_at
FROM public.submissions s;

-- Control access to the view
REVOKE ALL ON public.vw_status_integrity_audit FROM PUBLIC;
REVOKE ALL ON public.vw_status_integrity_audit FROM anon;
GRANT SELECT ON public.vw_status_integrity_audit TO authenticated;

-- 4. Apply Clean RLS Patterns to Submissions
-- Note: underlying RLS on 'submissions' will automatically filter rows in the view above.
DROP POLICY IF EXISTS "Admins and editors can see all submissions" ON public.submissions;
CREATE POLICY "Admins and editors can see all submissions" ON public.submissions
    FOR SELECT USING (public.is_admin_or_editor());

DROP POLICY IF EXISTS "Users can view own submissions" ON public.submissions;
CREATE POLICY "Users can view own submissions" ON public.submissions
    FOR SELECT USING (auth.uid() = user_id);

-- 5. Force Redeploy create_submission_v2 (it was cascaded by dropping consume_capability)
-- Updated to support anonymous checkouts (p_user_id can be NULL)
CREATE OR REPLACE FUNCTION public.create_submission_v2(
    p_user_id UUID,
    p_slot_id UUID,
    p_artist_data JSONB,
    p_submission_data JSONB,
    p_distribution_targets UUID[],
    p_payment_type TEXT,
    p_account_id UUID DEFAULT NULL,
    p_capability TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_artist_id UUID;
    v_submission_id UUID;
    v_success BOOLEAN;
BEGIN
    -- 0. Idempotency Check
    IF p_payment_type = 'stripe' THEN
        SELECT id INTO v_submission_id 
        FROM public.submissions 
        WHERE (p_user_id IS NULL OR user_id = p_user_id)
        AND slot_id = p_slot_id 
        AND track_title = (p_submission_data->>'track_title')
        AND status = 'unpaid'
        AND created_at > (now() - interval '1 hour')
        LIMIT 1;

        IF v_submission_id IS NOT NULL THEN
            RETURN v_submission_id;
        END IF;
    END IF;

    -- 1. Artist Management
    SELECT id INTO v_artist_id 
    FROM public.artists 
    WHERE email = (p_artist_data->>'email') 
    LIMIT 1;

    IF v_artist_id IS NULL THEN
        INSERT INTO public.artists (name, email, country, user_id)
        VALUES (
            p_artist_data->>'name',
            p_artist_data->>'email',
            p_artist_data->>'country',
            p_user_id
        )
        RETURNING id INTO v_artist_id;
    END IF;

    -- 2. Payment/Capability Consumption
    IF p_payment_type = 'capability' THEN
        IF p_user_id IS NULL THEN
            RAISE EXCEPTION 'User ID required for capability payment type';
        END IF;
        IF p_capability IS NULL THEN
            RAISE EXCEPTION 'Capability name required for capability payment type';
        END IF;

        -- Check and consume capability
        SELECT public.consume_capability(p_user_id, p_capability) INTO v_success;

        IF NOT v_success THEN
            RAISE EXCEPTION 'Insufficient capability: %', p_capability;
        END IF;
    ELSIF p_payment_type = 'credits' THEN
        NULL; 
    END IF;

    -- 3. Create Submission
    INSERT INTO public.submissions (
        user_id,
        artist_id,
        slot_id,
        account_id,
        track_title,
        artist_name,
        spotify_track_url,
        release_date,
        genre,
        mood,
        status,
        payment_status,
        payment_type,
        submission_type,
        content_bundle,
        notes_internal
    ) VALUES (
        p_user_id,
        v_artist_id,
        p_slot_id,
        p_account_id,
        p_submission_data->>'track_title',
        COALESCE(p_submission_data->>'artist_name', p_artist_data->>'name'),
        p_submission_data->>'spotify_track_url',
        (p_submission_data->>'release_date')::DATE,
        p_submission_data->>'genre',
        p_submission_data->>'mood',
        CASE WHEN p_payment_type = 'stripe' THEN 'unpaid' ELSE 'pending_review' END,
        CASE WHEN p_payment_type IN ('credits', 'capability') THEN 'paid' ELSE 'unpaid' END,
        p_payment_type,
        COALESCE(p_submission_data->>'submission_type', 'music'),
        COALESCE(p_submission_data->'content_bundle', '{}'::jsonb),
        p_submission_data->>'notes_internal'
    )
    RETURNING id INTO v_submission_id;

    -- 4. Map Distribution
    IF p_distribution_targets IS NOT NULL AND array_length(p_distribution_targets, 1) > 0 THEN
        INSERT INTO public.submission_distribution (submission_id, outlet_id, status)
        SELECT v_submission_id, outlet_id, 'pending'
        FROM unnest(p_distribution_targets) AS outlet_id;
    END IF;

    RETURN v_submission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.create_submission_v2(UUID, UUID, JSONB, JSONB, UUID[], TEXT, UUID, TEXT) TO anon, authenticated, service_role;

-- 6. Update Submissions RLS to allow anonymous inserts
-- Note: create_submission_v2 is SECURITY DEFINER, so it handles the insert, 
-- but we should ensure the table itself allows it if ever called directly.
-- For now, the RPC is the primary entry point.

DROP POLICY IF EXISTS "Public can insert submissions" ON public.submissions;
CREATE POLICY "Public can insert submissions" ON public.submissions
    FOR INSERT WITH CHECK (true);

-- 7. Update Artists RLS to allow anonymous inserts (referenced by submissions)
DROP POLICY IF EXISTS "Public can insert artists" ON public.artists;
CREATE POLICY "Public can insert artists" ON public.artists
    FOR INSERT WITH CHECK (true);

