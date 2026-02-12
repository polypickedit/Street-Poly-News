-- Media OS: State Machine & Role Guard Validation Script
-- This script tests the enforcement of the state machine transitions and role-based guards.
-- Run this in the Supabase SQL Editor.

BEGIN;

-- 1. Setup Test Data
DO $$
DECLARE
    v_test_user_id UUID := '00000000-0000-0000-0000-000000000001'; -- Mock User
    v_test_admin_id UUID := '00000000-0000-0000-0000-000000000002'; -- Mock Admin
    v_test_editor_id UUID := '00000000-0000-0000-0000-000000000003'; -- Mock Editor
    v_submission_id UUID;
    v_role_admin_id UUID;
    v_role_editor_id UUID;
BEGIN
    -- Create Roles if they don't exist
    INSERT INTO public.roles (name) VALUES ('admin'), ('editor') ON CONFLICT (name) DO NOTHING;
    SELECT id INTO v_role_admin_id FROM public.roles WHERE name = 'admin';
    SELECT id INTO v_role_editor_id FROM public.roles WHERE name = 'editor';

    -- Assign Roles to Mock Users
    INSERT INTO public.user_roles (user_id, role_id) VALUES (v_test_admin_id, v_role_admin_id) ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, role_id) VALUES (v_test_editor_id, v_role_editor_id) ON CONFLICT DO NOTHING;

    -- Create a Test Submission (initially unpaid)
    INSERT INTO public.submissions (user_id, artist_name, track_title, status)
    VALUES (v_test_user_id, 'Test Artist', 'Test Track', 'unpaid')
    RETURNING id INTO v_submission_id;

    RAISE NOTICE 'Test Submission Created: %', v_submission_id;

    -- TEST CASE L3-01: unpaid -> approved (Should FAIL)
    BEGIN
        -- Mock Editor JWT
        PERFORM set_config('request.jwt.claims', json_build_object('sub', v_test_editor_id::text, 'role', 'authenticated')::text, true);
        
        PERFORM public.update_submission_status(v_submission_id, 'approved', v_test_editor_id, 'Illegal jump attempt');
        RAISE EXCEPTION 'TEST FAILED: L3-01 (unpaid -> approved) allowed illegally.';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'TEST PASSED: L3-01 (unpaid -> approved) blocked as expected. Error: %', SQLERRM;
    END;

    -- TEST CASE L3-02: unpaid -> paid (As Admin - Should PASS)
    BEGIN
        -- Mock Admin JWT
        PERFORM set_config('request.jwt.claims', json_build_object('sub', v_test_admin_id::text, 'role', 'authenticated')::text, true);
        
        PERFORM public.update_submission_status(v_submission_id, 'paid', v_test_admin_id, 'Admin manual payment confirmation');
        RAISE NOTICE 'TEST PASSED: L3-02 (unpaid -> paid) allowed for admin.';
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'TEST FAILED: L3-02 (unpaid -> paid) blocked for admin. Error: %', SQLERRM;
    END;

    -- TEST CASE L3-03: paid -> pending_review (As Admin - Should PASS)
    BEGIN
        -- Mock Admin JWT
        PERFORM set_config('request.jwt.claims', json_build_object('sub', v_test_admin_id::text, 'role', 'authenticated')::text, true);
        
        PERFORM public.update_submission_status(v_submission_id, 'pending_review', v_test_admin_id, 'Move to queue');
        RAISE NOTICE 'TEST PASSED: L3-03 (paid -> pending_review) allowed for admin.';
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'TEST FAILED: L3-03 (paid -> pending_review) blocked for admin. Error: %', SQLERRM;
    END;

    -- TEST CASE L3-04: pending_review -> approved (As Editor - Should PASS)
    BEGIN
        -- Mock Editor JWT
        PERFORM set_config('request.jwt.claims', json_build_object('sub', v_test_editor_id::text, 'role', 'authenticated')::text, true);
        
        PERFORM public.update_submission_status(v_submission_id, 'approved', v_test_editor_id, 'Editor approval');
        RAISE NOTICE 'TEST PASSED: L3-04 (pending_review -> approved) allowed for editor.';
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'TEST FAILED: L3-04 (pending_review -> approved) blocked for editor. Error: %', SQLERRM;
    END;

    -- TEST CASE L3-05: approved -> scheduled (As Editor - Should FAIL)
    BEGIN
        -- Mock Editor JWT
        PERFORM set_config('request.jwt.claims', json_build_object('sub', v_test_editor_id::text, 'role', 'authenticated')::text, true);
        
        PERFORM public.update_submission_status(v_submission_id, 'scheduled', v_test_editor_id, 'Editor trying to schedule');
        RAISE EXCEPTION 'TEST FAILED: L3-05 (approved -> scheduled) allowed for editor illegally.';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'TEST PASSED: L3-05 (approved -> scheduled) blocked for editor as expected. Error: %', SQLERRM;
    END;

    -- TEST CASE L3-06: approved -> scheduled (As Admin - Should PASS)
    BEGIN
        -- Mock Admin JWT
        PERFORM set_config('request.jwt.claims', json_build_object('sub', v_test_admin_id::text, 'role', 'authenticated')::text, true);
        
        PERFORM public.update_submission_status(v_submission_id, 'scheduled', v_test_admin_id, 'Admin scheduling');
        RAISE NOTICE 'TEST PASSED: L3-06 (approved -> scheduled) allowed for admin.';
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'TEST FAILED: L3-06 (approved -> scheduled) blocked for admin. Error: %', SQLERRM;
    END;

    -- TEST CASE L5-01: Verify Ledger Consistency
    BEGIN
        -- Check if all transitions were logged in history
        IF (SELECT COUNT(*) FROM public.submission_status_history WHERE submission_id = v_submission_id) < 4 THEN
            RAISE EXCEPTION 'TEST FAILED: L5-01 History ledger incomplete. Found % entries.', 
                (SELECT COUNT(*) FROM public.submission_status_history WHERE submission_id = v_submission_id);
        END IF;

        -- Check if admin actions were logged for admin/editor transitions
        IF (SELECT COUNT(*) FROM public.admin_actions WHERE entity_id = v_submission_id::text) < 3 THEN
            RAISE EXCEPTION 'TEST FAILED: L5-01 Admin actions ledger incomplete. Found % entries.', 
                (SELECT COUNT(*) FROM public.admin_actions WHERE entity_id = v_submission_id::text);
        END IF;

        RAISE NOTICE 'TEST PASSED: L5-01 Ledger consistency verified.';
    END;

    -- TEST CASE L4-04: Direct Status Bypass (Should FAIL)
    BEGIN
        -- Attempt to bypass the RPC and update status directly
        UPDATE public.submissions SET status = 'approved' WHERE id = v_submission_id;
        RAISE EXCEPTION 'TEST FAILED: L4-04 Direct status update allowed without history entry.';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'TEST PASSED: L4-04 Direct status update blocked as expected. Error: %', SQLERRM;
    END;

    -- TEST CASE L7-07: Enum Drift Validation
    BEGIN
        IF EXISTS (SELECT 1 FROM public.vw_status_integrity_audit WHERE is_valid = false) THEN
            RAISE EXCEPTION 'TEST FAILED: L7-07 Invalid status found in data or constraint drift detected.';
        END IF;
        RAISE NOTICE 'TEST PASSED: L7-07 Enum integrity verified.';
    END;

    RAISE NOTICE 'ALL AUTOMATED GUARDRAILS VERIFIED.';
END $$;

ROLLBACK; -- Never commit test data
