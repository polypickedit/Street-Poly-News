-- Fix for update_submission_status RPC (removed non-existent updated_at column)
-- and manual restoration of admin role for the primary test user.

CREATE OR REPLACE FUNCTION public.update_submission_status(
    p_submission_id uuid,
    p_new_status text,
    p_user_id uuid DEFAULT NULL,
    p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_current_status text;
    v_is_admin boolean;
    v_is_editor boolean;
    v_is_system boolean;
    v_final_user_id uuid;
BEGIN
    -- 1. Get current status and context
    SELECT status INTO v_current_status
    FROM public.submissions
    WHERE id = p_submission_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Submission % not found', p_submission_id;
    END IF;

    -- 2. Determine Actor Identity
    v_is_system := (auth.role() = 'service_role' OR auth.uid() IS NULL);
    
    IF NOT v_is_system THEN
        v_is_admin := public.is_admin();
        v_is_editor := public.is_editor();
    ELSE
        v_is_admin := false;
        v_is_editor := false;
    END IF;

    -- 3. Perform Update (Fixed: removed updated_at column)
    UPDATE public.submissions 
    SET status = p_new_status,
        reviewed_at = CASE WHEN p_new_status IN ('approved', 'declined') THEN now() ELSE reviewed_at END
    WHERE id = p_submission_id;

    -- 4. Record History (Ledger)
    v_final_user_id := COALESCE(auth.uid(), p_user_id);

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

    -- 5. Log to Admin Actions
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
$$;

-- Ensure the primary test user has admin privileges (if they exist)
-- User ID: 66a61b1f-2121-45c0-94ad-b973df35d2e8
DO $$
DECLARE
    v_admin_role_id uuid;
    v_user_id uuid := '66a61b1f-2121-45c0-94ad-b973df35d2e8';
BEGIN
    SELECT id INTO v_admin_role_id FROM public.roles WHERE name = 'admin';
    
    -- Only insert if the user exists in auth.users
    IF v_admin_role_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role_id)
        SELECT v_user_id, v_admin_role_id
        FROM auth.users
        WHERE id = v_user_id
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
