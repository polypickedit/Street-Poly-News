-- Final fix for account and account_members RLS recursion
-- This migration uses SECURITY DEFINER functions to break the circular dependency between accounts and account_members

-- 1. Helper function to check account membership
CREATE OR REPLACE FUNCTION public.is_account_member(p_account_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.account_members
        WHERE account_id = p_account_id
          AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Helper function to check account ownership
CREATE OR REPLACE FUNCTION public.is_account_owner(p_account_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.accounts
        WHERE id = p_account_id
          AND owner_user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update account_members policies
DROP POLICY IF EXISTS "account_members_owner_manage" ON public.account_members;
DROP POLICY IF EXISTS "account_members_self_read" ON public.account_members;
DROP POLICY IF EXISTS "account_members_member_read" ON public.account_members;
DROP POLICY IF EXISTS "account_members_owner_all" ON public.account_members;

-- Users can always see their own memberships
CREATE POLICY "account_members_select_self" ON public.account_members
    FOR SELECT USING (user_id = auth.uid());

-- Owners can manage all members of their account
CREATE POLICY "account_members_manage_owner" ON public.account_members
    FOR ALL USING (public.is_account_owner(account_id));

-- Admins can manage all account members
CREATE POLICY "account_members_manage_admin" ON public.account_members
    FOR ALL USING (public.is_admin());

-- 4. Update accounts policies
DROP POLICY IF EXISTS "accounts_owner_all" ON public.accounts;
DROP POLICY IF EXISTS "accounts_member_select" ON public.accounts;
DROP POLICY IF EXISTS "account_owner_write" ON public.accounts;
DROP POLICY IF EXISTS "account_member_read" ON public.accounts;

-- Owners can do anything with their account
CREATE POLICY "accounts_owner_all" ON public.accounts
    FOR ALL USING (owner_user_id = auth.uid());

-- Members can view the account
CREATE POLICY "accounts_member_select" ON public.accounts
    FOR SELECT USING (public.is_account_member(id));

-- Admins can view and manage all accounts
CREATE POLICY "accounts_admin_all" ON public.accounts
    FOR ALL USING (public.is_admin());

-- 5. Update submissions policies to use these non-recursive helpers
DROP POLICY IF EXISTS "Account members can view submissions" ON public.submissions;
DROP POLICY IF EXISTS "Account members can update their own submissions" ON public.submissions;

CREATE POLICY "submissions_member_select" ON public.submissions
    FOR SELECT USING (
        public.is_account_member(account_id) OR public.is_admin_or_editor()
    );

CREATE POLICY "submissions_member_update" ON public.submissions
    FOR UPDATE USING (
        (public.is_account_member(account_id) AND EXISTS (
            SELECT 1 FROM public.account_members 
            WHERE account_id = submissions.account_id 
            AND user_id = auth.uid() 
            AND role IN ('owner', 'manager')
        )) OR public.is_admin_or_editor()
    );

-- 6. Update account_ledger policies
DROP POLICY IF EXISTS "Members can view their account ledger" ON public.account_ledger;
CREATE POLICY "account_ledger_member_select" ON public.account_ledger
    FOR SELECT USING (public.is_account_member(account_id) OR public.is_admin());

-- 7. Update stripe_customers policies
DROP POLICY IF EXISTS "stripe_customers_account_all" ON public.stripe_customers;
DROP POLICY IF EXISTS "stripe_customers_insert_default" ON public.stripe_customers;

CREATE POLICY "stripe_customers_member_select" ON public.stripe_customers
    FOR SELECT USING (public.is_account_member(account_id) OR public.is_admin());

CREATE POLICY "stripe_customers_owner_manage" ON public.stripe_customers
    FOR ALL USING (public.is_account_owner(account_id) OR public.is_admin());

-- 8. Update account_billing policies
DROP POLICY IF EXISTS "account_billing_member_all" ON public.account_billing;
DROP POLICY IF EXISTS "account_billing_owner_all" ON public.account_billing;

CREATE POLICY "account_billing_member_select" ON public.account_billing
    FOR SELECT USING (public.is_account_member(account_id) OR public.is_admin());

CREATE POLICY "account_billing_owner_manage" ON public.account_billing
    FOR ALL USING (public.is_account_owner(account_id) OR public.is_admin());

-- 9. Update invoices policies
DROP POLICY IF EXISTS "invoices_member_read" ON public.invoices;
DROP POLICY IF EXISTS "invoices_owner_all" ON public.invoices;

CREATE POLICY "invoices_member_select" ON public.invoices
    FOR SELECT USING (public.is_account_member(account_id) OR public.is_admin());

-- Force reload
NOTIFY pgrst, 'reload schema';
