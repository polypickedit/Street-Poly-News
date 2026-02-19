-- ------------------------------------------------------------------
-- MANUAL LOCKDOWN & ADMIN IDENTITY SCRIPT
-- Run this in the Supabase SQL Editor to finalize the admin system.
-- ------------------------------------------------------------------

BEGIN;

-- 1. Recreate the audit view without SECURITY DEFINER (Fixes recursion/permission issues)
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

-- 2. Durable owner/admin identity anchored on auth.uid()
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 2a. Policy for admin_users (Using CREATE OR REPLACE workaround via DROP)
DROP POLICY IF EXISTS "admin_users_can_see_their_own_record" ON public.admin_users;
CREATE POLICY "admin_users_can_see_their_own_record"
    ON public.admin_users
    FOR SELECT USING (auth.uid() = user_id);

-- 3. Owner check helper (no SECURITY DEFINER required)
CREATE OR REPLACE FUNCTION public.is_owner_admin()
RETURNS BOOLEAN
LANGUAGE SQL STABLE
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
);
$$;

-- 4. Backfill is_admin_or_editor with owner check
-- This ensures existing RLS policies using this function will now respect admin_users
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

-- 5. CRITICAL: Frontend Hydration Helper
-- This function is required for useAuth / roleService.ts to see the admin status
CREATE OR REPLACE FUNCTION public.get_user_roles()
RETURNS SETOF text
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- If user is in admin_users, they get 'admin' role
  SELECT 'admin'::text WHERE public.is_owner_admin()
  UNION
  -- Also include any roles from the legacy user_roles table
  SELECT r.name::text
  FROM public.user_roles ur
  JOIN public.roles r ON ur.role_id = r.id
  WHERE ur.user_id = auth.uid();
$$;

-- 6. Optional owner-aware admin-only audit view (delegated to RLS)
DROP VIEW IF EXISTS public.vw_status_integrity_audit_admin;
CREATE VIEW public.vw_status_integrity_audit_admin AS
SELECT * FROM public.vw_status_integrity_audit
WHERE public.is_owner_admin();

REVOKE ALL ON public.vw_status_integrity_audit_admin FROM PUBLIC;
REVOKE ALL ON public.vw_status_integrity_audit_admin FROM anon;
GRANT SELECT ON public.vw_status_integrity_audit_admin TO authenticated;

COMMIT;

-- ------------------------------------------------------------------
-- VERIFICATION & INSERTION GUIDE
-- ------------------------------------------------------------------

/*
STEP 1: GET YOUR UUID
Run this query to find your user ID (replace email):

SELECT id, email FROM auth.users WHERE email = 'YOUR_EMAIL_HERE';
*/

/*
STEP 2: INSERT YOURSELF AS ADMIN
Replace 'YOUR_UUID_HERE' with the ID you copied from Step 1.

INSERT INTO public.admin_users (user_id)
VALUES ('YOUR_UUID_HERE')
ON CONFLICT (user_id) DO NOTHING;
*/

/*
STEP 3: VERIFY ACCESS
Run these queries to confirm the system is locked and you have keys.

-- Should return TRUE
SELECT public.is_admin_or_editor();

-- Should return 'admin' (and possibly others)
SELECT * FROM public.get_user_roles();
*/
