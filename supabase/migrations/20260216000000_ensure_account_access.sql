-- Fix RLS policies to ensure no recursion and proper access for owners/admins

-- 1. Ensure RLS is enabled on accounts
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to start fresh and avoid conflicts
DROP POLICY IF EXISTS "accounts_owner_select" ON public.accounts;
DROP POLICY IF EXISTS "accounts_member_select" ON public.accounts;
DROP POLICY IF EXISTS "Owners can view their own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Members can view their accounts" ON public.accounts;

-- 3. Create a simple, direct policy for owners
-- This does NOT query other tables, so it cannot cause recursion
CREATE POLICY "accounts_owner_select_v2" ON public.accounts
FOR SELECT
USING (
  auth.uid() = owner_user_id
);

-- 4. Create a policy for members
-- This queries account_members, so we must ensure account_members policies are simple
CREATE POLICY "accounts_member_select_v2" ON public.accounts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.account_members
    WHERE account_members.account_id = accounts.id
    AND account_members.user_id = auth.uid()
  )
);

-- 5. Ensure account_members policies are simple
ALTER TABLE public.account_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "account_members_select_policy" ON public.account_members;
DROP POLICY IF EXISTS "Members can view their own account memberships" ON public.account_members;

-- Simple policy: users can see rows where they are the user
CREATE POLICY "account_members_select_simple" ON public.account_members
FOR SELECT
USING (
  auth.uid() = user_id
);

-- 6. Grant necessary permissions to authenticated users
GRANT SELECT ON public.accounts TO authenticated;
GRANT SELECT ON public.account_members TO authenticated;

-- 7. Force schema cache reload
NOTIFY pgrst, 'reload schema';
