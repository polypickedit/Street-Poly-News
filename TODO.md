
## PayPal Stabilizer (Temporary)
- [x] Create placement_orders table
- [x] Implement Intake Modal (Booking & Merch)
- [x] Redirect to PayPal hosted checkout
- [x] Create Payment Success Page with Order ID recovery
- [x] Build Admin Reconciliation Dashboard
- [x] Add lightweight analytics (funnel tracking)
- [ ] **CRITICAL: 30-Day Review (Due: 2026-03-22)**
  - Evaluate PayPal usage volume.
  - Decide: Formalize with Webhooks OR Revert to Stripe.
  - If keeping: Implement proper webhook handlers for `payment.capture.completed`.
  - If reverting: Remove `ENABLE_PAYPAL_STABILIZER` flag.

## RLS Sovereignty Lockdown – Phase Final

### Pre-Execution Audit

- [ ] Confirm all tables in migration exist (`profiles`, `accounts`, `submissions`, `payments`, `artists`, `merch_orders`, `listening_sessions`).
- [ ] Confirm RLS is enabled on each table.
- [ ] List existing policies per table using:
  ```sql
  SELECT schemaname, tablename, policyname 
  FROM pg_policies 
  WHERE tablename IN ('profiles','accounts','submissions','payments','artists','merch_orders','listening_sessions'); 
  ```

### Policy Diff Snapshot

- [ ] Dump current policy definitions for archival reference.
- [ ] Save snapshot to `docs/rls_snapshot_before_lockdown.sql`.

### Execution

- [ ] **Manual Step**: Execute `supabase/migrations/20260218000000_consolidated_rls_lockdown.sql` in Supabase SQL Editor.
  - *Note: Do not attempt CLI push unless token confirmed.*
- [ ] **Reminder**: Close/Pause the application or put in maintenance mode before execution if possible.

### Post-Execution Verification

- [ ] **Admin Visibility Test**: Log in as admin, verify visibility of all records in `submissions` or `accounts`.
- [ ] **User Restriction Test**: Log in as standard user, verify only own records are visible.
- [ ] **Admin Removal Test**: Remove `admin` role/user from `admin_users` and confirm immediate lockout from admin views.
