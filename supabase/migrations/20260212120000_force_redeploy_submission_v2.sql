
-- Migration: Force Redeploy Submission V2
-- Description: Redeploys create_submission_v2 with explicit payment type handling.

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
        WHERE user_id = p_user_id 
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

    -- 5. Admin Logging
    INSERT INTO public.admin_actions (admin_user_id, action_type, target_type, target_id, metadata)
    VALUES (p_user_id, 'submission.created', 'submission', v_submission_id, jsonb_build_object('payment_type', p_payment_type));

    RETURN v_submission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.create_submission_v2(UUID, UUID, JSONB, JSONB, UUID[], TEXT, UUID, TEXT) TO anon, authenticated, service_role;
