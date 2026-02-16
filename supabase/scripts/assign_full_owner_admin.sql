DO $$
DECLARE
    v_user_id UUID;
    v_admin_role_id UUID;
    v_editor_role_id UUID;
    v_account_id UUID;
BEGIN
    -- 1. Get User ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'nunnagiel@gmail.com';
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'User nunnagiel@gmail.com not found. Please ask the user to sign up first.';
        RETURN;
    END IF;

    -- 2. Get Role IDs (Ensure they exist)
    INSERT INTO public.roles (name) VALUES ('admin'), ('editor') ON CONFLICT (name) DO NOTHING;
    
    SELECT id INTO v_admin_role_id FROM public.roles WHERE name = 'admin';
    SELECT id INTO v_editor_role_id FROM public.roles WHERE name = 'editor';

    -- 3. Assign ADMIN Role
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (v_user_id, v_admin_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
    RAISE NOTICE 'Assigned ADMIN role to nunnagiel@gmail.com';

    -- 4. Assign EDITOR Role (Explicitly, though Admin usually implies it)
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (v_user_id, v_editor_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
    RAISE NOTICE 'Assigned EDITOR role to nunnagiel@gmail.com';

    -- 5. Handle Account Ownership
    -- Check if they already own an account
    SELECT id INTO v_account_id FROM public.accounts WHERE owner_user_id = v_user_id LIMIT 1;

    IF v_account_id IS NULL THEN
        -- Create new individual account
        INSERT INTO public.accounts (name, type, owner_user_id, status)
        VALUES ('Nunnagiel Admin', 'individual', v_user_id, 'active')
        RETURNING id INTO v_account_id;
        RAISE NOTICE 'Created new account for nunnagiel@gmail.com';
    ELSE
        RAISE NOTICE 'User already owns account %', v_account_id;
    END IF;

    -- 6. Ensure Account Membership is set to OWNER
    INSERT INTO public.account_members (account_id, user_id, role)
    VALUES (v_account_id, v_user_id, 'owner')
    ON CONFLICT (account_id, user_id) DO UPDATE SET role = 'owner';
    
    RAISE NOTICE 'Confirmed OWNER status in account_members for nunnagiel@gmail.com';

END $$;
