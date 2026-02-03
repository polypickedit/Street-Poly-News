-- MASTER RECURSION & AUTH FIX
-- This script consolidates all previous fixes to resolve:
-- 1. Infinite recursion in account_members (42P17)
-- 2. Infinite recursion in user_roles (42P17)
-- 3. Relationship errors in Admin Settings (PGRST200)
-- 4. Auth role check timeouts

-- ==========================================
-- 1. CLEANUP: Drop all existing policies
-- ==========================================
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('user_roles', 'roles', 'account_members', 'accounts', 'submissions', 'artists', 'placements', 'slots', 'profiles')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- ==========================================
-- 2. SAFE FUNCTIONS: SECURITY DEFINER Bypass
-- ==========================================

-- Check Admin status without triggering RLS
CREATE OR REPLACE FUNCTION public.is_admin_safe(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = target_user_id
        AND r.name = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Check Admin or Editor status
CREATE OR REPLACE FUNCTION public.is_admin_or_editor_safe(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = target_user_id
        AND r.name IN ('admin', 'editor')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Standardized Admin check for policies
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.is_admin_safe(auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Standardized Admin/Editor check for policies
CREATE OR REPLACE FUNCTION public.is_admin_or_editor()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.is_admin_or_editor_safe(auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Check account membership safely
CREATE OR REPLACE FUNCTION public.is_account_member_safe(target_account_id UUID, target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.account_members
        WHERE account_id = target_account_id
          AND user_id = target_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Check account manager/owner safely
CREATE OR REPLACE FUNCTION public.is_account_manager_safe(target_account_id UUID, target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.account_members
        WHERE account_id = target_account_id
          AND user_id = target_user_id
          AND role IN ('owner', 'manager')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==========================================
-- 3. CORE TABLE POLICIES (Non-Recursive)
-- ==========================================

-- ROLES
CREATE POLICY "roles_read_master" ON public.roles FOR SELECT USING (true);
CREATE POLICY "roles_write_master" ON public.roles FOR ALL USING (public.is_admin_safe(auth.uid()));

-- USER_ROLES
CREATE POLICY "user_roles_read_master" ON public.user_roles FOR SELECT USING (user_id = auth.uid() OR public.is_admin_safe(auth.uid()));
CREATE POLICY "user_roles_write_master" ON public.user_roles FOR ALL USING (public.is_admin_safe(auth.uid()));

-- PROFILES
CREATE POLICY "profiles_read_master" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_write_master" ON public.profiles FOR ALL USING (id = auth.uid() OR public.is_admin_safe(auth.uid()));

-- ACCOUNTS
CREATE POLICY "accounts_read_master" ON public.accounts FOR SELECT USING (
    owner_user_id = auth.uid() OR 
    public.is_account_member_safe(id, auth.uid()) OR 
    public.is_admin_safe(auth.uid())
);
CREATE POLICY "accounts_write_master" ON public.accounts FOR ALL USING (
    owner_user_id = auth.uid() OR 
    public.is_admin_safe(auth.uid())
);

-- ACCOUNT_MEMBERS
CREATE POLICY "account_members_read_master" ON public.account_members FOR SELECT USING (
    user_id = auth.uid() OR 
    public.is_account_manager_safe(account_id, auth.uid()) OR 
    public.is_admin_safe(auth.uid())
);
CREATE POLICY "account_members_write_master" ON public.account_members FOR ALL USING (
    public.is_account_manager_safe(account_id, auth.uid()) OR 
    public.is_admin_safe(auth.uid())
);

-- SUBMISSIONS
CREATE POLICY "submissions_read_master" ON public.submissions FOR SELECT USING (
    public.is_account_member_safe(account_id, auth.uid()) OR 
    public.is_admin_or_editor_safe(auth.uid())
);
CREATE POLICY "submissions_write_master" ON public.submissions FOR ALL USING (
    public.is_admin_or_editor_safe(auth.uid())
);

-- ==========================================
-- 4. RELATIONSHIP FIXES
-- ==========================================

-- Ensure user_roles points to profiles to fix PGRST200
ALTER TABLE public.user_roles
DROP CONSTRAINT IF EXISTS user_roles_user_id_profiles_fkey,
ADD CONSTRAINT user_roles_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- ==========================================
-- 5. FINISH
-- ==========================================
NOTIFY pgrst, 'reload schema';
