-- Fix RLS recursion in account_members and accounts
-- This happens because the policies were circular (account_members checking accounts which checks account_members)

-- 1. Drop existing problematic policies
DROP POLICY IF EXISTS "Members can view their own account memberships" ON account_members;
DROP POLICY IF EXISTS "Owners can view their own accounts" ON accounts;
DROP POLICY IF EXISTS "Members can view their accounts" ON accounts;

-- 2. Create non-recursive policies for account_members
-- Use a subquery that doesn't trigger the same policy
CREATE POLICY "account_members_select_policy" ON account_members
FOR SELECT USING (
  user_id = auth.uid()
);

-- 3. Create non-recursive policies for accounts
-- Owners can always see their own accounts (direct check on owner_user_id)
CREATE POLICY "accounts_owner_select" ON accounts
FOR SELECT USING (
  owner_user_id = auth.uid()
);

-- Members can see accounts they belong to
-- We use a subquery on account_members which now has a simple non-recursive policy
CREATE POLICY "accounts_member_select" ON accounts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM account_members
    WHERE account_members.account_id = accounts.id
    AND account_members.user_id = auth.uid()
  )
);

-- 4. Ensure user_capabilities table exists and is correctly configured
CREATE TABLE IF NOT EXISTS public.user_capabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    capability TEXT NOT NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on user_capabilities
ALTER TABLE public.user_capabilities ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own capabilities
DROP POLICY IF EXISTS "Users can view own capabilities" ON public.user_capabilities;
CREATE POLICY "Users can view own capabilities" ON public.user_capabilities
FOR SELECT USING (auth.uid() = user_id);

-- 5. Force schema cache reload
NOTIFY pgrst, 'reload schema';
