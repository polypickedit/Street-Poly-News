-- Assign Admin role to nunnagiel@gmail.com and ensure they have an account
DO $$
DECLARE
    target_user_id UUID;
    admin_role_id UUID;
    new_account_id UUID;
BEGIN
    -- 1. Get the user ID from auth.users
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'nunnagiel@gmail.com';
    
    -- 2. Get the admin role ID
    SELECT id INTO admin_role_id FROM public.roles WHERE name = 'admin';

    -- 3. If user exists, proceed with role and account setup
    IF target_user_id IS NOT NULL THEN
        -- Assign Admin Role
        IF admin_role_id IS NOT NULL THEN
            INSERT INTO public.user_roles (user_id, role_id)
            VALUES (target_user_id, admin_role_id)
            ON CONFLICT (user_id, role_id) DO NOTHING;
            RAISE NOTICE 'Admin role assigned to nunnagiel@gmail.com';
        ELSE
            RAISE WARNING 'Admin role not found in public.roles';
        END IF;

        -- Create Account if none exists
        IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE owner_user_id = target_user_id) THEN
            INSERT INTO public.accounts (name, type, owner_user_id, status)
            VALUES ('Nunnagiel Admin', 'individual', target_user_id, 'active')
            RETURNING id INTO new_account_id;

            -- Add as Owner in account_members
            INSERT INTO public.account_members (account_id, user_id, role)
            VALUES (new_account_id, target_user_id, 'owner');
            
            RAISE NOTICE 'Created individual account and assigned ownership for nunnagiel@gmail.com';
        ELSE
            -- Ensure they are at least an owner of their existing accounts in account_members
            INSERT INTO public.account_members (account_id, user_id, role)
            SELECT id, owner_user_id, 'owner'
            FROM public.accounts
            WHERE owner_user_id = target_user_id
            ON CONFLICT (account_id, user_id) DO UPDATE SET role = 'owner';
            
            RAISE NOTICE 'Updated existing account memberships to owner for nunnagiel@gmail.com';
        END IF;
    ELSE
        RAISE WARNING 'User nunnagiel@gmail.com not found in auth.users. Please sign up first.';
    END IF;
END $$;
