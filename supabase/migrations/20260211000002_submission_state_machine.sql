-- Migration: Submission State Machine & Granular Logging
-- Description: Implements a database-level state machine and enriches event logging.

-- 1. Update submissions table constraints to support more states
ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_status_check;
ALTER TABLE public.submissions ADD CONSTRAINT submissions_status_check 
CHECK (status IN ('unpaid', 'paid', 'pending_review', 'approved', 'declined', 'scheduled', 'published', 'archived'));

-- 2. Create Submission Status History for audit trails
CREATE TABLE IF NOT EXISTS public.submission_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    from_status TEXT NOT NULL,
    to_status TEXT NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on history
ALTER TABLE public.submission_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins and Editors can view history" ON public.submission_status_history
    FOR SELECT USING (public.is_admin_or_editor());

-- 3. Expand admin_actions check constraint
ALTER TABLE public.admin_actions DROP CONSTRAINT IF EXISTS admin_actions_action_type_check;
ALTER TABLE public.admin_actions ADD CONSTRAINT admin_actions_action_type_check 
CHECK (action_type IN (
    'submission.created', 
    'submission.paid', 
    'submission.approved', 
    'submission.declined', 
    'submission.scheduled', 
    'submission.published',
    'submission.archived',
    'create_placement', 
    'refund_payment',
    'approve_submission', -- legacy
    'decline_submission'  -- legacy
));

-- 4. RPC: update_submission_status with validation
CREATE OR REPLACE FUNCTION public.update_submission_status(
    p_submission_id UUID,
    p_new_status TEXT,
    p_user_id UUID,
    p_reason TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_current_status TEXT;
BEGIN
    -- Get current status
    SELECT status INTO v_current_status FROM public.submissions WHERE id = p_submission_id;
    
    -- Validation Logic (State Machine Transitions)
    IF v_current_status = p_new_status THEN
        RETURN;
    END IF;

    -- Basic Rules
    IF v_current_status = 'unpaid' AND p_new_status NOT IN ('paid', 'archived') THEN
        RAISE EXCEPTION 'Cannot transition from unpaid to % without payment', p_new_status;
    END IF;

    -- Update Submission
    UPDATE public.submissions 
    SET status = p_new_status,
        reviewed_at = CASE WHEN p_new_status IN ('approved', 'declined') THEN now() ELSE reviewed_at END
    WHERE id = p_submission_id;

    -- Log to History
    INSERT INTO public.submission_status_history (submission_id, from_status, to_status, changed_by, reason)
    VALUES (p_submission_id, v_current_status, p_new_status, p_user_id, p_reason);

    -- Log to Admin Actions
    INSERT INTO public.admin_actions (user_id, action_type, entity_type, entity_id, metadata)
    VALUES (
        p_user_id, 
        'submission.' || p_new_status, 
        'submission', 
        p_submission_id, 
        jsonb_build_object('from_status', v_current_status, 'reason', p_reason)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
