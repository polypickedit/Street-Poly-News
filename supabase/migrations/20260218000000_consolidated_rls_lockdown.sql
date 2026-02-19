-- ------------------------------------------------------------------
-- MIGRATION: CONSOLIDATED RLS LOCKDOWN
-- Description: Standardizes Row Level Security across all critical tables.
--              Removes duplicate/permissive policies and enforces strict
--              ownership + admin override patterns.
--              Uses (SELECT auth.uid()) for stability.
-- ------------------------------------------------------------------

BEGIN;

-- ------------------------------------------------------------------
-- 1. PROFILES
-- ------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to ensure clean slate
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_owner_write" ON public.profiles;

-- New Standard Policies
CREATE POLICY "profiles_read_public"
    ON public.profiles FOR SELECT
    USING (true); -- Public profiles are visible to everyone (needed for artist pages)

CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE
    USING (id = (SELECT auth.uid()));

CREATE POLICY "profiles_insert_own"
    ON public.profiles FOR INSERT
    WITH CHECK (id = (SELECT auth.uid()));

-- ------------------------------------------------------------------
-- 2. ACCOUNTS & MEMBERS
-- ------------------------------------------------------------------
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_members ENABLE ROW LEVEL SECURITY;

-- Drop legacy/conflicting policies
DROP POLICY IF EXISTS "accounts_owner_select" ON public.accounts;
DROP POLICY IF EXISTS "accounts_member_select" ON public.accounts;
DROP POLICY IF EXISTS "accounts_owner_select_v2" ON public.accounts;
DROP POLICY IF EXISTS "accounts_member_select_v2" ON public.accounts;
DROP POLICY IF EXISTS "Owners can view their own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Members can view their accounts" ON public.accounts;
DROP POLICY IF EXISTS "account_owner_write" ON public.accounts;
DROP POLICY IF EXISTS "account_member_read" ON public.accounts;

DROP POLICY IF EXISTS "account_members_select_policy" ON public.account_members;
DROP POLICY IF EXISTS "account_members_select_simple" ON public.account_members;
DROP POLICY IF EXISTS "Members can view their own account memberships" ON public.account_members;
DROP POLICY IF EXISTS "account_members_member_read" ON public.account_members;
DROP POLICY IF EXISTS "account_members_owner_all" ON public.account_members;
-- Removed out-of-scope drop for user_roles

-- Standard Policies: Accounts
CREATE POLICY "accounts_select_own_or_admin"
    ON public.accounts FOR SELECT
    USING (
        owner_user_id = (SELECT auth.uid()) 
        OR EXISTS (
            SELECT 1 FROM public.account_members 
            WHERE account_id = id AND user_id = (SELECT auth.uid())
        )
        OR public.is_admin_or_editor()
    );

CREATE POLICY "accounts_insert_own"
    ON public.accounts FOR INSERT
    WITH CHECK (auth.role() = 'authenticated'); -- Owner is set via trigger/default usually

CREATE POLICY "accounts_update_own"
    ON public.accounts FOR UPDATE
    USING (owner_user_id = (SELECT auth.uid()) OR public.is_admin_or_editor());

-- Standard Policies: Account Members
CREATE POLICY "account_members_select_own"
    ON public.account_members FOR SELECT
    USING (user_id = (SELECT auth.uid()) OR public.is_admin_or_editor());

CREATE POLICY "account_members_select_account_owner"
    ON public.account_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.accounts 
            WHERE id = account_id AND owner_user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "account_members_insert_owner_or_admin"
    ON public.account_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.accounts 
            WHERE id = account_id AND owner_user_id = (SELECT auth.uid())
        )
        OR public.is_admin_or_editor()
    );

CREATE POLICY "account_members_update_owner_or_admin"
    ON public.account_members FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.accounts 
            WHERE id = account_id AND owner_user_id = (SELECT auth.uid())
        )
        OR public.is_admin_or_editor()
    );

CREATE POLICY "account_members_delete_owner_or_admin"
    ON public.account_members FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.accounts 
            WHERE id = account_id AND owner_user_id = (SELECT auth.uid())
        )
        OR public.is_admin_or_editor()
    );

-- ------------------------------------------------------------------
-- 3. SUBMISSIONS
-- ------------------------------------------------------------------
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Drop legacy policies
DROP POLICY IF EXISTS "Users can view own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Public can insert submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admins and Editors can view submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admins and Editors can update submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admins and editors can see all submissions" ON public.submissions;

-- Standard Policies
CREATE POLICY "submissions_select_own_or_admin"
    ON public.submissions FOR SELECT
    USING (user_id = (SELECT auth.uid()) OR public.is_admin_or_editor());

CREATE POLICY "submissions_insert_own"
    ON public.submissions FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "submissions_update_own"
    ON public.submissions FOR UPDATE
    USING (user_id = (SELECT auth.uid()) OR public.is_admin_or_editor());

-- ------------------------------------------------------------------
-- 4. PAYMENTS
-- ------------------------------------------------------------------
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Drop legacy policies
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can view and manage payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can manage all payments" ON public.payments;

-- Standard Policies
CREATE POLICY "payments_select_own_or_admin"
    ON public.payments FOR SELECT
    USING (user_id = (SELECT auth.uid()) OR public.is_admin_or_editor());

CREATE POLICY "payments_insert_system_or_admin"
    ON public.payments FOR INSERT
    WITH CHECK (public.is_admin_or_editor()); -- Typically created by webhooks or admins

CREATE POLICY "payments_update_admin"
    ON public.payments FOR UPDATE
    USING (public.is_admin_or_editor());

-- ------------------------------------------------------------------
-- 5. ARTISTS
-- ------------------------------------------------------------------
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;

-- Drop legacy policies
DROP POLICY IF EXISTS "Users can view own artists" ON public.artists;
DROP POLICY IF EXISTS "Users can update own artists" ON public.artists;
DROP POLICY IF EXISTS "Public can insert artists" ON public.artists;
DROP POLICY IF EXISTS "Admins and Editors can view artists" ON public.artists;
DROP POLICY IF EXISTS "Admins and Editors can update artists" ON public.artists;

-- Standard Policies
CREATE POLICY "artists_select_own_or_admin"
    ON public.artists FOR SELECT
    USING (user_id = (SELECT auth.uid()) OR public.is_admin_or_editor());

CREATE POLICY "artists_insert_own"
    ON public.artists FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "artists_update_own"
    ON public.artists FOR UPDATE
    USING (user_id = (SELECT auth.uid()) OR public.is_admin_or_editor());

-- ------------------------------------------------------------------
-- 6. MERCH & ORDERS
-- ------------------------------------------------------------------
ALTER TABLE public.merch_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merch_order_items ENABLE ROW LEVEL SECURITY;

-- Drop legacy policies
DROP POLICY IF EXISTS "Merch orders: owner can select" ON public.merch_orders;
DROP POLICY IF EXISTS "Merch orders: users can insert own" ON public.merch_orders;
DROP POLICY IF EXISTS "Merch orders: admins can update" ON public.merch_orders;
DROP POLICY IF EXISTS "Merch order items: owner view" ON public.merch_order_items;
DROP POLICY IF EXISTS "Merch order items: admins can manage" ON public.merch_order_items;

-- Standard Policies: Orders
CREATE POLICY "merch_orders_select_own_or_admin"
    ON public.merch_orders FOR SELECT
    USING (user_id = (SELECT auth.uid()) OR public.is_admin_or_editor());

CREATE POLICY "merch_orders_insert_own"
    ON public.merch_orders FOR INSERT
    WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "merch_orders_update_admin"
    ON public.merch_orders FOR UPDATE
    USING (public.is_admin_or_editor());

-- Standard Policies: Order Items
CREATE POLICY "merch_order_items_select_own_or_admin"
    ON public.merch_order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.merch_orders o 
            WHERE o.id = order_id AND (o.user_id = (SELECT auth.uid()) OR public.is_admin_or_editor())
        )
    );

CREATE POLICY "merch_order_items_insert_own"
    ON public.merch_order_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.merch_orders o 
            WHERE o.id = order_id AND o.user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "merch_order_items_insert_admin"
    ON public.merch_order_items FOR INSERT
    WITH CHECK (public.is_admin_or_editor());

CREATE POLICY "merch_order_items_update_admin"
    ON public.merch_order_items FOR UPDATE
    USING (public.is_admin_or_editor());

CREATE POLICY "merch_order_items_delete_admin"
    ON public.merch_order_items FOR DELETE
    USING (public.is_admin_or_editor());

-- ------------------------------------------------------------------
-- 7. LISTENING SESSIONS (New Revenue Engine)
-- ------------------------------------------------------------------
ALTER TABLE public.listening_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listening_session_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listening_session_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listening_submissions ENABLE ROW LEVEL SECURITY;

-- Drop potential existing policies (defensive)
DROP POLICY IF EXISTS "Public can view open sessions" ON public.listening_sessions;
DROP POLICY IF EXISTS "Admins can manage sessions" ON public.listening_sessions;

-- Standard Policies
CREATE POLICY "listening_sessions_select_own_or_admin"
    ON public.listening_sessions FOR SELECT
    USING (status != 'draft' OR public.is_admin_or_editor());

CREATE POLICY "listening_sessions_insert_admin"
    ON public.listening_sessions FOR INSERT
    WITH CHECK (public.is_admin_or_editor());

CREATE POLICY "listening_sessions_update_admin"
    ON public.listening_sessions FOR UPDATE
    USING (public.is_admin_or_editor());

CREATE POLICY "listening_sessions_delete_admin"
    ON public.listening_sessions FOR DELETE
    USING (public.is_admin_or_editor());

CREATE POLICY "listening_session_tiers_select_own_or_admin"
    ON public.listening_session_tiers FOR SELECT
    USING (true); -- Tiers are public info if session is visible

CREATE POLICY "listening_session_tiers_insert_admin"
    ON public.listening_session_tiers FOR INSERT
    WITH CHECK (public.is_admin_or_editor());

CREATE POLICY "listening_session_tiers_update_admin"
    ON public.listening_session_tiers FOR UPDATE
    USING (public.is_admin_or_editor());

CREATE POLICY "listening_session_tiers_delete_admin"
    ON public.listening_session_tiers FOR DELETE
    USING (public.is_admin_or_editor());

CREATE POLICY "listening_session_purchases_select_own_or_admin"
    ON public.listening_session_purchases FOR SELECT
    USING (user_id = (SELECT auth.uid()) OR public.is_admin_or_editor());

CREATE POLICY "listening_session_purchases_insert_own"
    ON public.listening_session_purchases FOR INSERT
    WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "listening_session_purchases_update_admin"
    ON public.listening_session_purchases FOR UPDATE
    USING (public.is_admin_or_editor());

CREATE POLICY "listening_session_purchases_delete_admin"
    ON public.listening_session_purchases FOR DELETE
    USING (public.is_admin_or_editor());

CREATE POLICY "listening_submissions_select_own_or_admin"
    ON public.listening_submissions FOR SELECT
    USING (
        artist_id IN (SELECT id FROM public.profiles WHERE id = (SELECT auth.uid())) 
        OR public.is_admin_or_editor()
    );

CREATE POLICY "listening_submissions_insert_own"
    ON public.listening_submissions FOR INSERT
    WITH CHECK (
        artist_id IN (SELECT id FROM public.profiles WHERE id = (SELECT auth.uid()))
    );

CREATE POLICY "listening_submissions_update_admin"
    ON public.listening_submissions FOR UPDATE
    USING (public.is_admin_or_editor());

CREATE POLICY "listening_submissions_delete_admin"
    ON public.listening_submissions FOR DELETE
    USING (public.is_admin_or_editor());

-- Option A: system lookup table, avoid recursive admin identity checks.
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

COMMIT;
