DO $$
BEGIN
    -- Drop old policies if they exist to avoid conflicts with new ones
    -- We use IF EXISTS to prevent errors
    
    -- Policies on accounts
    DROP POLICY IF EXISTS "accounts_owner_select" ON public.accounts;
    DROP POLICY IF EXISTS "accounts_member_select" ON public.accounts;
    DROP POLICY IF EXISTS "Owners can view their own accounts" ON public.accounts;
    DROP POLICY IF EXISTS "Members can view their accounts" ON public.accounts;
    
    -- Policies on account_members
    DROP POLICY IF EXISTS "account_members_select_policy" ON public.account_members;
    DROP POLICY IF EXISTS "Members can view their own account memberships" ON public.account_members;
    
    -- Ensure user_roles has basic policies
    ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
    
    -- Allow users to read their own roles
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_roles' 
        AND policyname = 'Users can read own roles'
    ) THEN
        CREATE POLICY "Users can read own roles" ON public.user_roles
        FOR SELECT USING (auth.uid() = user_id);
    END IF;

    -- Allow admins to read all roles (optional, but good for management)
    -- This assumes an is_admin function exists, otherwise skip or simplify
    
END $$;
