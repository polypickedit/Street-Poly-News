-- Fix infinite recursion in user_roles and account_members policies

-- 1. Create a dedicated is_admin function if not exists, ensuring it's SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.name = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix user_roles policies
DROP POLICY IF EXISTS "Admins can manage user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_self_select" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_all" ON public.user_roles;

CREATE POLICY "user_roles_self_select" ON public.user_roles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_roles_admin_all" ON public.user_roles
    FOR ALL USING (public.is_admin());

-- 3. Fix roles policies
DROP POLICY IF EXISTS "Admins can manage roles" ON public.roles;
CREATE POLICY "roles_read_all" ON public.roles FOR SELECT USING (true);
CREATE POLICY "roles_admin_all" ON public.roles FOR ALL USING (public.is_admin());

-- 4. Fix account_members recursion (Cleanup old policies from 20260130000000_accounts_billing.sql)
DROP POLICY IF EXISTS account_members_owner_all ON public.account_members;
DROP POLICY IF EXISTS account_members_member_read ON public.account_members;

-- Use the non-recursive select policy we created in the previous fix
-- and add a proper owner policy that checks the account table instead of self
CREATE POLICY "account_members_owner_manage" ON public.account_members
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.accounts a
        WHERE a.id = account_members.account_id
        AND a.owner_user_id = auth.uid()
    )
);

-- 5. Fix accounts policies (Ensure they are non-recursive)
DROP POLICY IF EXISTS account_owner_write ON public.accounts;
DROP POLICY IF EXISTS account_member_read ON public.accounts;

CREATE POLICY "accounts_owner_all" ON public.accounts
FOR ALL USING (owner_user_id = auth.uid());

CREATE POLICY "accounts_member_select" ON public.accounts
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.account_members
        WHERE account_members.account_id = accounts.id
        AND account_members.user_id = auth.uid()
    )
);

-- 6. Add foreign key to profiles to enable PostgREST joins
ALTER TABLE public.user_roles
DROP CONSTRAINT IF EXISTS user_roles_user_id_profiles_fkey,
ADD CONSTRAINT user_roles_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 7. Force reload
NOTIFY pgrst, 'reload schema';
