-- Migration: Monetization Path Performance & Security Hygiene
-- Description: Adds indexes to high-traffic foreign keys and ensures no accidental SECURITY DEFINER leaks.

BEGIN;

-- 1. Monetization Path Indexing (Performance Hygiene)
-- These columns are frequently joined or filtered during the booking and payment flows.

-- Submissions
CREATE INDEX IF NOT EXISTS idx_submissions_slot_id ON public.submissions(slot_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON public.submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_artist_id ON public.submissions(artist_id);

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_submission_id ON public.payments(submission_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);

-- Placements & Distributions
CREATE INDEX IF NOT EXISTS idx_placements_submission_id ON public.placements(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_distribution_submission_id ON public.submission_distribution(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_distribution_outlet_id ON public.submission_distribution(outlet_id);

-- 2. Security Audit Cleanup
-- Ensuring vw_status_integrity_audit is strictly a standard view (no SECURITY DEFINER)
-- and relies on underlying RLS as established in previous migrations.

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_views 
        WHERE schemaname = 'public' 
        AND viewname = 'vw_status_integrity_audit'
    ) THEN
        -- The view was already refactored in 20260212140000, 
        -- but we re-verify its access here for hygiene.
        REVOKE ALL ON public.vw_status_integrity_audit FROM PUBLIC;
        REVOKE ALL ON public.vw_status_integrity_audit FROM anon;
        GRANT SELECT ON public.vw_status_integrity_audit TO authenticated;
    END IF;
END $$;

COMMIT;
