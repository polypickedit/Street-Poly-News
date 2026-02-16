
-- pgTAP Validation: RLS and Audit View Access
BEGIN;
SELECT plan(8);

-- 1. Setup Test Personas
INSERT INTO public.roles (name) VALUES ('admin') ON CONFLICT (name) DO NOTHING;

-- Mock Users
-- Note: auth.users is managed by Supabase, we just need IDs for JWT simulation
SELECT tests.create_supabase_user('user_persona');
SELECT tests.create_supabase_user('admin_persona');

-- Assign Admin Role
INSERT INTO public.user_roles (user_id, role_id)
SELECT tests.get_supabase_uid('admin_persona'), id FROM public.roles WHERE name = 'admin'
ON CONFLICT DO NOTHING;

-- 2. Create Test Data
INSERT INTO public.submissions (user_id, artist_name, track_title, status)
VALUES (tests.get_supabase_uid('user_persona'), 'User Artist', 'User Track', 'unpaid');

INSERT INTO public.submissions (user_id, artist_name, track_title, status)
VALUES (tests.get_supabase_uid('admin_persona'), 'Admin Artist', 'Admin Track', 'paid');

-- 3. TEST: Anonymous Access
SELECT tests.authenticate_as_anon();
SELECT results_eq(
    'SELECT COUNT(*)::INTEGER FROM public.submissions',
    ARRAY[0],
    'Anonymous should see 0 submissions'
);

-- Check view access for anon (should fail/see nothing due to REVOKE)
-- Since pgTAP catches errors, we can test if they can SELECT
SELECT is_empty(
    'SELECT * FROM public.vw_status_integrity_audit',
    'Anonymous should see 0 rows in audit view'
);

-- 4. TEST: Regular Authenticated User Access
SELECT tests.authenticate_as('user_persona');
SELECT results_eq(
    'SELECT COUNT(*)::INTEGER FROM public.submissions',
    ARRAY[1],
    'User should see exactly 1 submission (their own)'
);

SELECT results_eq(
    'SELECT COUNT(*)::INTEGER FROM public.vw_status_integrity_audit',
    ARRAY[1],
    'User should see exactly 1 row in audit view'
);

-- 5. TEST: Admin Access
SELECT tests.authenticate_as('admin_persona');
SELECT cmp_ok(
    (SELECT COUNT(*)::INTEGER FROM public.submissions),
    '>=',
    2,
    'Admin should see at least 2 submissions'
);

SELECT cmp_ok(
    (SELECT COUNT(*)::INTEGER FROM public.vw_status_integrity_audit),
    '>=',
    2,
    'Admin should see at least 2 rows in audit view'
);

-- 6. Verify View Columns
SELECT has_column(
    'public',
    'vw_status_integrity_audit',
    'last_transition_at',
    'View should have last_transition_at column'
);

SELECT has_column(
    'public',
    'vw_status_integrity_audit',
    'transition_count',
    'View should have transition_count column'
);

SELECT * FROM finish();
ROLLBACK;
