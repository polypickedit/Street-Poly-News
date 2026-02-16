DO $$
DECLARE
    v_user_id UUID;
    v_account_count INT;
    v_account_status TEXT;
    v_owner_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'nunnagiel@gmail.com';
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'User NOT found!';
        RETURN;
    END IF;

    SELECT count(*), status, owner_user_id 
    INTO v_account_count, v_account_status, v_owner_id
    FROM public.accounts 
    WHERE owner_user_id = v_user_id
    GROUP BY status, owner_user_id;

    IF v_account_count > 0 THEN
        RAISE NOTICE 'Account FOUND. Count: %, Status: %, Owner Match: %', v_account_count, v_account_status, (v_owner_id = v_user_id);
    ELSE
        RAISE NOTICE 'Account NOT FOUND for user %', v_user_id;
    END IF;

    -- Check account_members
    DECLARE
        v_member_role TEXT;
    BEGIN
        SELECT role INTO v_member_role
        FROM public.account_members
        WHERE user_id = v_user_id
        LIMIT 1;
        
        IF v_member_role IS NOT NULL THEN
            RAISE NOTICE 'Account Member Role: %', v_member_role;
        ELSE
            RAISE NOTICE 'User is NOT in account_members table!';
        END IF;
    END;
END $$;
