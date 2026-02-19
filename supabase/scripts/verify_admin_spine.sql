-- Verify admin spine after migration push.
-- Replace the UUID below with your target user id.

-- 1) Confirm function exists and is SECURITY DEFINER with search_path = public.
SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS args,
  p.prosecdef AS is_security_definer,
  p.proconfig AS function_config
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'is_admin_or_editor'
  AND pg_get_function_identity_arguments(p.oid) = '';

-- 2) Upsert target UID into admin_users.
INSERT INTO public.admin_users (user_id)
VALUES ('00000000-0000-0000-0000-000000000000'::uuid)
ON CONFLICT (user_id) DO NOTHING;

-- 3) Confirm row exists.
SELECT user_id, created_at
FROM public.admin_users
WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid;

-- 4) If available, use uid-parameter helper for deterministic check from SQL editor.
SELECT
  CASE
    WHEN to_regprocedure('public.is_admin_or_editor_safe(uuid)') IS NOT NULL
      THEN public.is_admin_or_editor_safe('00000000-0000-0000-0000-000000000000'::uuid)
    ELSE NULL
  END AS is_admin_or_editor_safe_result,
  to_regprocedure('public.is_admin_or_editor_safe(uuid)') IS NOT NULL AS has_safe_helper;

-- 5) Fallback deterministic check (role/admin table only), independent of auth.uid().
SELECT (
  EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = '00000000-0000-0000-0000-000000000000'::uuid
  )
  OR EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = '00000000-0000-0000-0000-000000000000'::uuid
      AND r.name IN ('admin', 'editor')
  )
) AS deterministic_admin_or_editor;
