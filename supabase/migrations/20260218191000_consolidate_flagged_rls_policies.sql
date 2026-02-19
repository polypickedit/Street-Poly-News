-- Governance consolidation: normalize policy shape across flagged tables.
-- Intent:
-- 1) remove drift from duplicate permissive policies,
-- 2) standardize auth checks to (SELECT auth.uid()),
-- 3) enforce explicit TO authenticated for user-facing policies,
-- 4) preserve service-role workflows where required.
--
-- Reversibility notes:
-- Old policy names are listed per table below so rollback migrations can recreate prior names/logic if needed.

BEGIN;

-- -----------------------------------------------------------------------------
-- Utility sweep: drop all existing policies on flagged tables (idempotent).
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  r record;
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles',
    'user_roles',
    'accounts',
    'account_members',
    'payments',
    'placements',
    'merch_inventory',
    'merch_orders',
    'merch_order_items',
    'commerce_events',
    'listening_session_purchases',
    'listening_submissions'
  ]
  LOOP
    IF to_regclass(format('public.%s', t)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      FOR r IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = t
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, t);
      END LOOP;
    END IF;
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- profiles
-- Old names observed: profiles_public_read, profiles_owner_write,
-- "Public profiles are viewable by everyone", "Users can update their own profile",
-- profiles_read_master, profiles_write_master.
-- -----------------------------------------------------------------------------
CREATE POLICY profiles_select_authenticated
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = (SELECT auth.uid())
  OR public.is_admin_or_editor()
);

CREATE POLICY profiles_update_authenticated
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  id = (SELECT auth.uid())
  OR public.is_admin_or_editor()
)
WITH CHECK (
  id = (SELECT auth.uid())
  OR public.is_admin_or_editor()
);

-- -----------------------------------------------------------------------------
-- user_roles
-- Old names observed: "Admins can manage user_roles", user_roles_read_master,
-- user_roles_write_master, "Users can read own roles".
-- -----------------------------------------------------------------------------
CREATE POLICY user_roles_select_authenticated
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR public.is_admin_or_editor()
);

CREATE POLICY user_roles_insert_authenticated
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_editor());

CREATE POLICY user_roles_update_authenticated
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

CREATE POLICY user_roles_delete_authenticated
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.is_admin_or_editor());

-- -----------------------------------------------------------------------------
-- accounts
-- Old names observed: account_member_read, account_owner_write,
-- accounts_read_master, accounts_write_master,
-- accounts_owner_select, accounts_member_select,
-- accounts_owner_select_v2, accounts_member_select_v2,
-- "Owners can view their own accounts", "Members can view their accounts".
-- -----------------------------------------------------------------------------
CREATE POLICY accounts_select_authenticated
ON public.accounts
FOR SELECT
TO authenticated
USING (
  owner_user_id = (SELECT auth.uid())
  OR public.is_account_member_safe(id, (SELECT auth.uid()))
  OR public.is_admin_or_editor()
);

CREATE POLICY accounts_insert_authenticated
ON public.accounts
FOR INSERT
TO authenticated
WITH CHECK (
  owner_user_id = (SELECT auth.uid())
  OR public.is_admin_or_editor()
);

CREATE POLICY accounts_update_authenticated
ON public.accounts
FOR UPDATE
TO authenticated
USING (
  owner_user_id = (SELECT auth.uid())
  OR public.is_admin_or_editor()
)
WITH CHECK (
  owner_user_id = (SELECT auth.uid())
  OR public.is_admin_or_editor()
);

CREATE POLICY accounts_delete_authenticated
ON public.accounts
FOR DELETE
TO authenticated
USING (
  owner_user_id = (SELECT auth.uid())
  OR public.is_admin_or_editor()
);

-- -----------------------------------------------------------------------------
-- account_members
-- Old names observed: account_members_member_read, account_members_owner_all,
-- account_members_read_master, account_members_write_master,
-- account_members_select_policy, account_members_select_simple,
-- "Members can view their own account memberships".
-- -----------------------------------------------------------------------------
CREATE POLICY account_members_select_authenticated
ON public.account_members
FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.accounts a
    WHERE a.id = account_members.account_id
      AND a.owner_user_id = (SELECT auth.uid())
  )
  OR public.is_account_manager_safe(account_id, (SELECT auth.uid()))
  OR public.is_admin_or_editor()
);

CREATE POLICY account_members_insert_authenticated
ON public.account_members
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_account_manager_safe(account_id, (SELECT auth.uid()))
  OR public.is_admin_or_editor()
);

CREATE POLICY account_members_update_authenticated
ON public.account_members
FOR UPDATE
TO authenticated
USING (
  public.is_account_manager_safe(account_id, (SELECT auth.uid()))
  OR public.is_admin_or_editor()
)
WITH CHECK (
  public.is_account_manager_safe(account_id, (SELECT auth.uid()))
  OR public.is_admin_or_editor()
);

CREATE POLICY account_members_delete_authenticated
ON public.account_members
FOR DELETE
TO authenticated
USING (
  public.is_account_manager_safe(account_id, (SELECT auth.uid()))
  OR public.is_admin_or_editor()
);

-- -----------------------------------------------------------------------------
-- payments
-- Old names observed: "Users can view own payments",
-- "Admins can manage all payments".
-- -----------------------------------------------------------------------------
CREATE POLICY payments_select_authenticated
ON public.payments
FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR public.is_admin_or_editor()
);

CREATE POLICY payments_update_authenticated
ON public.payments
FOR UPDATE
TO authenticated
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

-- -----------------------------------------------------------------------------
-- placements
-- Old names observed: "Users can view own placements",
-- "Admins and Editors can manage placements".
-- -----------------------------------------------------------------------------
CREATE POLICY placements_select_authenticated
ON public.placements
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.submissions s
    WHERE s.id = placements.submission_id
      AND s.user_id = (SELECT auth.uid())
  )
  OR public.is_admin_or_editor()
);

CREATE POLICY placements_insert_authenticated
ON public.placements
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_editor());

CREATE POLICY placements_update_authenticated
ON public.placements
FOR UPDATE
TO authenticated
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

CREATE POLICY placements_delete_authenticated
ON public.placements
FOR DELETE
TO authenticated
USING (public.is_admin_or_editor());

-- -----------------------------------------------------------------------------
-- merch_inventory
-- Old names observed: "Merch inventory admin only".
-- -----------------------------------------------------------------------------
CREATE POLICY merch_inventory_select_authenticated
ON public.merch_inventory
FOR SELECT
TO authenticated
USING (public.is_admin_or_editor());

CREATE POLICY merch_inventory_insert_authenticated
ON public.merch_inventory
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_editor());

CREATE POLICY merch_inventory_update_authenticated
ON public.merch_inventory
FOR UPDATE
TO authenticated
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

CREATE POLICY merch_inventory_delete_authenticated
ON public.merch_inventory
FOR DELETE
TO authenticated
USING (public.is_admin_or_editor());

-- -----------------------------------------------------------------------------
-- merch_orders
-- Old names observed: "Merch orders: owner can select",
-- "Merch orders: users can insert own", "Merch orders: admins can update".
-- -----------------------------------------------------------------------------
CREATE POLICY merch_orders_select_authenticated
ON public.merch_orders
FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR public.is_admin_or_editor()
);

CREATE POLICY merch_orders_insert_authenticated
ON public.merch_orders
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  OR public.is_admin_or_editor()
);

CREATE POLICY merch_orders_update_authenticated
ON public.merch_orders
FOR UPDATE
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR public.is_admin_or_editor()
)
WITH CHECK (
  user_id = (SELECT auth.uid())
  OR public.is_admin_or_editor()
);

CREATE POLICY merch_orders_delete_authenticated
ON public.merch_orders
FOR DELETE
TO authenticated
USING (public.is_admin_or_editor());

-- -----------------------------------------------------------------------------
-- merch_order_items
-- Old names observed: "Merch order items: owner view",
-- "Merch order items: admins can manage".
-- -----------------------------------------------------------------------------
CREATE POLICY merch_order_items_select_authenticated
ON public.merch_order_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.merch_orders mo
    WHERE mo.id = merch_order_items.order_id
      AND (
        mo.user_id = (SELECT auth.uid())
        OR public.is_admin_or_editor()
      )
  )
);

CREATE POLICY merch_order_items_insert_authenticated
ON public.merch_order_items
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_editor());

CREATE POLICY merch_order_items_update_authenticated
ON public.merch_order_items
FOR UPDATE
TO authenticated
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

CREATE POLICY merch_order_items_delete_authenticated
ON public.merch_order_items
FOR DELETE
TO authenticated
USING (public.is_admin_or_editor());

-- -----------------------------------------------------------------------------
-- commerce_events
-- Old names observed: "Admins can view all commerce events",
-- "Users can view own commerce events".
-- -----------------------------------------------------------------------------
CREATE POLICY commerce_events_select_authenticated
ON public.commerce_events
FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR public.is_admin_or_editor()
);

CREATE POLICY commerce_events_insert_authenticated
ON public.commerce_events
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_editor());

CREATE POLICY commerce_events_update_authenticated
ON public.commerce_events
FOR UPDATE
TO authenticated
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

CREATE POLICY commerce_events_delete_authenticated
ON public.commerce_events
FOR DELETE
TO authenticated
USING (public.is_admin_or_editor());

-- -----------------------------------------------------------------------------
-- listening_session_purchases
-- Old names observed: "Users read own listening purchases",
-- "Service role insert listening purchases", "Service role update listening purchases".
-- -----------------------------------------------------------------------------
CREATE POLICY listening_session_purchases_select_authenticated
ON public.listening_session_purchases
FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR public.is_admin_or_editor()
);

CREATE POLICY listening_session_purchases_insert_service_role
ON public.listening_session_purchases
FOR INSERT
TO service_role
WITH CHECK ((SELECT auth.role()) = 'service_role');

CREATE POLICY listening_session_purchases_update_service_role
ON public.listening_session_purchases
FOR UPDATE
TO service_role
USING ((SELECT auth.role()) = 'service_role')
WITH CHECK ((SELECT auth.role()) = 'service_role');

-- -----------------------------------------------------------------------------
-- listening_submissions
-- Old names observed: "Users read own listening submissions",
-- "Users create own listening submissions", "Admins manage listening submissions".
-- -----------------------------------------------------------------------------
CREATE POLICY listening_submissions_select_authenticated
ON public.listening_submissions
FOR SELECT
TO authenticated
USING (
  artist_id = (SELECT auth.uid())
  OR public.is_admin_or_editor()
);

CREATE POLICY listening_submissions_insert_authenticated
ON public.listening_submissions
FOR INSERT
TO authenticated
WITH CHECK (
  artist_id = (SELECT auth.uid())
  OR public.is_admin_or_editor()
);

CREATE POLICY listening_submissions_update_authenticated
ON public.listening_submissions
FOR UPDATE
TO authenticated
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

CREATE POLICY listening_submissions_delete_authenticated
ON public.listening_submissions
FOR DELETE
TO authenticated
USING (public.is_admin_or_editor());

NOTIFY pgrst, 'reload schema';

COMMIT;
