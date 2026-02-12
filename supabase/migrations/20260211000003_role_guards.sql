-- Migration: Role-Based Submission State Machine Guards
-- Description: Enforces role-based permissions for submission state transitions and adds forensic metadata.

-- 1. Add metadata column to history if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='submission_status_history' AND column_name='metadata') THEN
        ALTER TABLE public.submission_status_history ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 2. Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.name = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update update_submission_status RPC with role guards
CREATE OR REPLACE FUNCTION public.update_submission_status(
    p_submission_id UUID,
    p_new_status TEXT,
    p_user_id UUID DEFAULT NULL,
    p_reason TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_current_status TEXT;
    v_is_admin BOOLEAN;
    v_is_editor BOOLEAN;
    v_is_system BOOLEAN;
    v_final_user_id UUID;
BEGIN
    -- Get current status
    SELECT status INTO v_current_status FROM public.submissions WHERE id = p_submission_id;
    
    -- Identifiers for system/admin roles
    v_is_system := (auth.role() = 'service_role');
    v_is_admin := public.is_admin();
    v_is_editor := public.is_admin_or_editor(); -- includes admin
    v_final_user_id := COALESCE(p_user_id, auth.uid());

    -- Validation Logic (State Machine Transitions & Role Guards)
    IF v_current_status = p_new_status THEN
        RETURN;
    END IF;

    -- Transition: unpaid -> paid
    -- Allowed for: System (webhooks) or Admin (manual override)
    IF v_current_status = 'unpaid' AND p_new_status = 'paid' THEN
        IF NOT (v_is_system OR v_is_admin) THEN
            RAISE EXCEPTION 'Unauthorized: Only system or admin can confirm payment.';
        END IF;
    END IF;

    -- Transition: paid -> pending_review
    -- This is usually an automatic or system-driven transition after payment processing
    IF v_current_status = 'paid' AND p_new_status = 'pending_review' THEN
        -- Allow system or admin to move it to queue
        IF NOT (v_is_system OR v_is_admin) THEN
             RAISE EXCEPTION 'Unauthorized: Only system or admin can move paid submissions to review queue.';
        END IF;
    END IF;

    -- Transition: pending_review -> approved/declined
    -- Allowed for: Editor or Admin
    IF v_current_status = 'pending_review' AND p_new_status IN ('approved', 'declined') THEN
        IF NOT v_is_editor THEN
            RAISE EXCEPTION 'Unauthorized: Only editors or admins can review submissions.';
        END IF;
    END IF;

    -- Transition: approved -> scheduled
    -- Allowed for: Admin only
    IF v_current_status = 'approved' AND p_new_status = 'scheduled' THEN
        IF NOT v_is_admin THEN
            RAISE EXCEPTION 'Unauthorized: Only admins can schedule placements.';
        END IF;
    END IF;

    -- Transition: scheduled -> published
    -- Allowed for: System (auto-publish) or Admin
    IF v_current_status = 'scheduled' AND p_new_status = 'published' THEN
        IF NOT (v_is_system OR v_is_admin) THEN
            RAISE EXCEPTION 'Unauthorized: Only system or admin can publish scheduled content.';
        END IF;
    END IF;

    -- General Safety Rule: Cannot move backwards from published unless Admin
    IF v_current_status = 'published' AND p_new_status NOT IN ('archived') AND NOT v_is_admin THEN
        RAISE EXCEPTION 'Unauthorized: Published content can only be archived or modified by admin.';
    END IF;

    -- Update Submission
    UPDATE public.submissions 
    SET status = p_new_status,
        reviewed_at = CASE WHEN p_new_status IN ('approved', 'declined') THEN now() ELSE reviewed_at END,
        updated_at = now()
    WHERE id = p_submission_id;

    -- Log to History (forensic timeline)
    INSERT INTO public.submission_status_history (
        submission_id, 
        from_status, 
        to_status, 
        changed_by, 
        reason,
        metadata
    )
    VALUES (
        p_submission_id, 
        v_current_status, 
        p_new_status, 
        v_final_user_id, 
        p_reason,
        jsonb_build_object(
            'auth_role', auth.role(),
            'is_system', v_is_system,
            'is_admin', v_is_admin,
            'client_user_id', p_user_id
        )
    );

    -- Log to Admin Actions (event stream)
    INSERT INTO public.admin_actions (
        user_id, 
        action_type, 
        entity_type, 
        entity_id, 
        metadata
    )
    VALUES (
        v_final_user_id, 
        'submission.' || p_new_status, 
        'submission', 
        p_submission_id, 
        jsonb_build_object(
            'from_status', v_current_status, 
            'reason', p_reason,
            'role_context', CASE 
                WHEN v_is_system THEN 'system'
                WHEN v_is_admin THEN 'admin'
                WHEN v_is_editor THEN 'editor'
                ELSE 'user'
            END
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
