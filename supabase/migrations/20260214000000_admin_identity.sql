-- Migration: Admin Identity & Secure Audit View
-- Date: 2026-02-14
-- This migration replaces the old SECURITY DEFINER audit view,
-- introduces a durable admin_users table, and makes owner-aware
-- RLS checks explicit via the new public.is_owner_admin() helper.

BEGIN;

-- ------------------------------------------------------------------
-- Step 1: Recreate the audit view without SECURITY DEFINER.
-- ------------------------------------------------------------------
DROP VIEW IF EXISTS public.vw_status_integrity_audit;
CREATE VIEW public.vw_status_integrity_audit AS
SELECT 
    s.id AS submission_id,
    s.status AS current_status,
    s.payment_status,
    s.artist_name,
    s.track_title,
    (SELECT COUNT(*) FROM public.submission_status_history h WHERE h.submission_id = s.id) AS transition_count,
    (SELECT MAX(h.created_at) FROM public.submission_status_history h WHERE h.submission_id = s.id) AS last_transition_at
FROM public.submissions s;

REVOKE ALL ON public.vw_status_integrity_audit FROM PUBLIC;
REVOKE ALL ON public.vw_status_integrity_audit FROM anon;
GRANT SELECT ON public.vw_status_integrity_audit TO authenticated;

-- ------------------------------------------------------------------
-- Step 2: Durable owner/admin identity anchored on auth.uid().
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_users_can_see_their_own_record"
    ON public.admin_users
    FOR SELECT USING (auth.uid() = user_id);

-- INSERT INTO public.admin_users (user_id)
-- SELECT id FROM auth.users WHERE email = 'nunnagiel@gmail.com';

-- ------------------------------------------------------------------
-- Step 3: Owner check helper (no SECURITY DEFINER required).
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_owner_admin()
RETURNS BOOLEAN
LANGUAGE SQL STABLE
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
);
$$;

-- ------------------------------------------------------------------
-- Step 4: Backfill is_admin_or_editor with owner check.
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin_or_editor()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role_count INTEGER;
BEGIN
    IF public.is_owner_admin() THEN
        RETURN TRUE;
    END IF;

    SELECT COUNT(*) INTO v_role_count
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'editor');

    RETURN v_role_count > 0;
END;
$$;

-- ------------------------------------------------------------------
-- Step 5: Optional owner-aware admin-only audit view (delegated to RLS).
-- ------------------------------------------------------------------
DROP VIEW IF EXISTS public.vw_status_integrity_audit_admin;
CREATE VIEW public.vw_status_integrity_audit_admin AS
SELECT * FROM public.vw_status_integrity_audit
WHERE public.is_owner_admin();

REVOKE ALL ON public.vw_status_integrity_audit_admin FROM PUBLIC;
REVOKE ALL ON public.vw_status_integrity_audit_admin FROM anon;
GRANT SELECT ON public.vw_status_integrity_audit_admin TO authenticated;

COMMIT;
