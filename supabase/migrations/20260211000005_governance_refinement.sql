-- Migration: Governance Refinement & Replay Protection
-- Description: Refines state machine with rank-based regressive protection and relaxes admin_actions constraints.

-- 1. Create status rank function for regressive protection
CREATE OR REPLACE FUNCTION public.get_status_rank(p_status TEXT) 
RETURNS INTEGER AS $$
BEGIN
    RETURN CASE p_status
        WHEN 'unpaid' THEN 1
        WHEN 'paid' THEN 2
        WHEN 'pending_review' THEN 3
        WHEN 'approved' THEN 4
        WHEN 'declined' THEN 4
        WHEN 'scheduled' THEN 5
        WHEN 'published' THEN 6
        WHEN 'archived' THEN 7
        ELSE 0
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Relax action_type check on admin_actions to allow dynamic events
ALTER TABLE public.admin_actions DROP CONSTRAINT IF EXISTS admin_actions_action_type_check;

-- 3. Update update_submission_status with rank-based replay protection
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

    -- 1. Idempotency Check
    IF v_current_status = p_new_status THEN
        RETURN;
    END IF;

    -- 2. Regressive Transition / Replay Protection
    -- Only Admins can move a submission "backwards" in the lifecycle (e.g. from approved back to pending_review)
    IF NOT v_is_admin AND public.get_status_rank(v_current_status) >= public.get_status_rank(p_new_status) THEN
        -- If it's the same rank (e.g. approved vs declined), we allow the change if they are editor/admin
        -- But if the current rank is strictly higher, we block/ignore for non-admins
        IF public.get_status_rank(v_current_status) > public.get_status_rank(p_new_status) THEN
            RETURN;
        END IF;
    END IF;

    -- 3. Validation Logic (State Machine Transitions & Role Guards)

    -- Transition: unpaid -> paid
    IF v_current_status = 'unpaid' AND p_new_status = 'paid' THEN
        IF NOT (v_is_system OR v_is_admin) THEN
            RAISE EXCEPTION 'Unauthorized: Only system or admin can confirm payment.';
        END IF;
    END IF;

    -- Transition: paid -> pending_review
    IF v_current_status = 'paid' AND p_new_status = 'pending_review' THEN
        IF NOT (v_is_system OR v_is_admin) THEN
             RAISE EXCEPTION 'Unauthorized: Only system or admin can move paid submissions to review queue.';
        END IF;
    END IF;

    -- Transition: pending_review -> approved/declined
    IF v_current_status = 'pending_review' AND p_new_status IN ('approved', 'declined') THEN
        IF NOT v_is_editor THEN
            RAISE EXCEPTION 'Unauthorized: Only editors or admins can review submissions.';
        END IF;
    END IF;

    -- Transition: approved -> scheduled
    IF v_current_status = 'approved' AND p_new_status = 'scheduled' THEN
        IF NOT v_is_admin THEN
            RAISE EXCEPTION 'Unauthorized: Only admins can schedule placements.';
        END IF;
    END IF;

    -- Transition: scheduled -> published
    IF v_current_status = 'scheduled' AND p_new_status = 'published' THEN
        IF NOT (v_is_system OR v_is_admin) THEN
            RAISE EXCEPTION 'Unauthorized: Only system or admin can publish scheduled content.';
        END IF;
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
        admin_user_id, 
        action_type, 
        target_type, 
        target_id, 
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
