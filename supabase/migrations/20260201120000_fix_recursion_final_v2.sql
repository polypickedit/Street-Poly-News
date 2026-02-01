-- FINAL RECURSION FIX
-- This migration drops and recreates all problematic policies with a focus on breaking circular dependencies.

-- 1. Ensure helper functions are robust and SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  -- SECURITY DEFINER bypasses RLS on user_roles
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_or_editor()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('admin', 'editor')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. User Roles Policies (Non-recursive)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_roles_select_self" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_all" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;

CREATE POLICY "user_roles_select_self" ON public.user_roles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_roles_admin_all" ON public.user_roles
    FOR ALL USING (public.is_admin());

-- 3. Account Members Policies (Non-recursive)
ALTER TABLE public.account_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "account_members_select_self" ON public.account_members;
DROP POLICY IF EXISTS "account_members_manage_owner" ON public.account_members;
DROP POLICY IF EXISTS "account_members_manage_admin" ON public.account_members;
DROP POLICY IF EXISTS "account_members_owner_all" ON public.account_members;
DROP POLICY IF EXISTS "account_members_member_read" ON public.account_members;

CREATE POLICY "account_members_select" ON public.account_members
    FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "account_members_manage" ON public.account_members
    FOR ALL USING (
        public.is_admin() OR 
        EXISTS (
            -- Direct check on accounts table (bypasses account_members RLS)
            SELECT 1 FROM public.accounts a
            WHERE a.id = account_members.account_id
            AND a.owner_user_id = auth.uid()
        )
    );

-- 4. Accounts Policies (Non-recursive)
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "accounts_owner_all" ON public.accounts;
DROP POLICY IF EXISTS "accounts_member_select" ON public.accounts;
DROP POLICY IF EXISTS "accounts_admin_all" ON public.accounts;
DROP POLICY IF EXISTS "account_owner_write" ON public.accounts;
DROP POLICY IF EXISTS "account_member_read" ON public.accounts;

CREATE POLICY "accounts_select" ON public.accounts
    FOR SELECT USING (
        owner_user_id = auth.uid() OR 
        public.is_admin() OR
        EXISTS (
            -- Direct check on account_members table
            SELECT 1 FROM public.account_members m
            WHERE m.account_id = accounts.id
            AND m.user_id = auth.uid()
        )
    );

CREATE POLICY "accounts_manage" ON public.accounts
    FOR ALL USING (owner_user_id = auth.uid() OR public.is_admin());

-- 5. Submissions Policies
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "submissions_member_select" ON public.submissions;
DROP POLICY IF EXISTS "submissions_member_update" ON public.submissions;
DROP POLICY IF EXISTS "Account members can view submissions" ON public.submissions;
DROP POLICY IF EXISTS "Account members can update their own submissions" ON public.submissions;

CREATE POLICY "submissions_select" ON public.submissions
    FOR SELECT USING (
        public.is_admin_or_editor() OR
        EXISTS (
            SELECT 1 FROM public.account_members m
            WHERE m.account_id = submissions.account_id
            AND m.user_id = auth.uid()
        )
    );

CREATE POLICY "submissions_manage" ON public.submissions
    FOR ALL USING (
        public.is_admin_or_editor() OR
        EXISTS (
            SELECT 1 FROM public.account_members m
            WHERE m.account_id = submissions.account_id
            AND m.user_id = auth.uid()
            AND m.role IN ('owner', 'manager')
        )
    );

-- 6. Ensure FK for AdminSettings.tsx is clean
-- We want to make sure PostgREST sees the relationship to profiles clearly.
-- If there are multiple FKs, we might need to be careful.
-- Let's just make sure our current one is named clearly.
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_profiles_fkey;

ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Force reload schema cache
NOTIFY pgrst, 'reload schema';
