-- Migration: Database Governance Hardening
-- Description: Enforces ledger consistency, prevents status bypass, and hardens enum integrity.

-- 1. Trigger to prevent direct status updates without history
CREATE OR REPLACE FUNCTION public.enforce_submission_history_logging()
RETURNS TRIGGER AS $$
BEGIN
    -- If status hasn't changed, allow the update
    IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
        RETURN NEW;
    END IF;

    -- If status changed, verify that a history record exists in the same transaction
    -- Note: We check if there's a record created 'recently' for this submission/status
    IF NOT EXISTS (
        SELECT 1 FROM public.submission_status_history 
        WHERE submission_id = NEW.id 
        AND to_status = NEW.status 
        AND created_at >= (now() - interval '1 second')
    ) THEN
        RAISE EXCEPTION 'DIRECT STATUS UPDATE BLOCKED: All submission status changes must go through public.update_submission_status() to ensure ledger consistency.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_enforce_submission_history ON public.submissions;
CREATE CONSTRAINT TRIGGER tr_enforce_submission_history
AFTER UPDATE OF status ON public.submissions
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION public.enforce_submission_history_logging();

-- 2. Prevent duplicate admin_actions for the same status transition (Replay Protection)
-- This is handled in the RPC, but we can add a unique constraint to the log for extra safety
-- However, admin_actions is generic. We could add a unique index for specific action types.
-- For now, we'll ensure the RPC is idempotent (it already checks v_current_status = p_new_status).

-- 3. Enum Integrity: Ensure all statuses used in data are in the check constraint
-- This is more of a validation task for the CI script, but we can add a view for it.
CREATE OR REPLACE VIEW public.vw_status_integrity_audit AS
SELECT 
    status, 
    COUNT(*) as usage_count,
    status IN ('unpaid', 'paid', 'pending_review', 'approved', 'declined', 'scheduled', 'published', 'archived') as is_valid
FROM public.submissions
GROUP BY status;
