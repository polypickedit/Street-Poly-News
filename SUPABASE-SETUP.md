# Supabase backend readiness for admin workflows

This repo ships a full Supabase schema (see `supabase/migrations/*.sql`). The admin UI, monetization flows, and `AdminRoute` guard rely on those tables/policies, so the goal is to ensure the migrations are applied in order and that at least one `admin` user exists before spinning up the admin portal.

## 1. Key tables & policies that must exist

| Concept | Migration | Why it matters |
| --- | --- | --- |
| `roles` / `user_roles` | `20260128210000_music_system_foundation.sql` | foundation for `admin`/`editor` gating; seeds the three roles. |
| `admin_actions` | same file + `20260203000001_content_placements.sql` trigger | dashboard activity feed relies on this log when admins approve submissions or update content placements. |
| `artists`, `submissions`, `playlists`, `placements`, `payments` | same file + `20260129040000_monetization_wiring.sql` | queue/dashboard widgets query these tables directly. |
| `content_placements` | `20260203000001_content_placements.sql` | admin placement editor (control room) reads/writes this table via the UI. |
| `slots`, `slot_entitlements`, `credit_packs`, `account_ledger` | `20260128204858_create_slot_system.sql`, `20260129040000_monetization_wiring.sql`, `20260130000001_submissions_accounts_credits.sql` | monetization + entitlement flows depend on these tables (Stripe checkout, entitlements, credits). |
| `accounts`, `account_members`, `billing_plans`, `account_billing`, `stripe_customers` | `20260130000000_accounts_billing.sql` | used by the billing/account dashboards and for credit/placement attribution. |
| `contact_submissions` policies & `profiles.admin_walkthrough_completed_at` | `20260129020000_tighten_rls.sql`, `20260203000003_admin_onboarding.sql` | Admin Contact Messages tab + walkthrough rely on the RLS adjustments + extra profile column. |

## 2. RPCs / helper functions

- `public.is_admin_or_editor()` + `public.is_admin_or_editor_safe(target_user_id)` (defined in `20260128210000_music_system_foundation.sql` and re-created in `20260202000000_master_fix.sql` / `MASTER_FIX.sql`). The React context calls `supabase.rpc("is_admin_or_editor")` and the admin provider uses the `_safe` version before touching policies.  
- `public.is_admin_safe`, `public.is_account_member_safe`, `public.is_account_manager_safe`, and related policy-safe helpers (from the master fix) ensure RLS doesn’t recurse when the RPC is invoked from `auth.uid()`.  
- Triggers such as `log_content_placement_action` and `log_payment_status_change` insert rows into `admin_actions`, keeping the dashboard feed alive.

Verify the RPCs by running:

```sql
SELECT public.is_admin_or_editor_safe('<your-user-id>');
SELECT public.is_admin_or_editor();
```

If they return `true` for your admin user, the guard used by `AdminRoute`/`AuthProvider` will allow the `/admin` shell to render.

## 3. Running migrations & seeding admins

1. **Apply the schema** (order matters because some scripts drop/recreate policies):
   ```sh
   supabase db push --project-ref <your-project> --schema public
   ```
   This executes everything under `supabase/migrations` and ensures the `MASTER_FIX` scripts re-create the safe policy functions last.

2. **Check required roles**:
   ```sql
   SELECT name FROM public.roles;
   ```
   Confirm `admin`, `editor`, `viewer` exist; the foundation migration seeds them if absent.

3. **Seed at least one admin user** (the existing migrations gift admin roles to `wr3ckdowwt@gmail.com`, `polypickedit@gmail.com`, and `nunnagiel@gmail.com`). To add your own admin, run:
   ```sql
   WITH target_user AS (
     SELECT id FROM auth.users WHERE email = 'you@example.com'
   ), admin_role AS (
     SELECT id FROM public.roles WHERE name = 'admin'
   )
   INSERT INTO public.user_roles (user_id, role_id)
   SELECT target_user.id, admin_role.id
   FROM target_user, admin_role
   ON CONFLICT (user_id, role_id) DO NOTHING;
   ```
   If you also need to give this user an `accounts` owner/manager membership (the nunnagiel migration shows one way), insert rows into `public.accounts`/`public.account_members` for the same user.

4. **Verify entitlements & credits** (optional):
   * `SELECT * FROM slot_entitlements WHERE user_id = '<admin-user-id>';`
   * `SELECT * FROM credit_packs;`

5. **Confirm contact submissions**:
   ```sql
   SELECT * FROM contact_submissions LIMIT 5;
   ```
   Admins should be able to select/insert via the policies defined in `20260129020000_tighten_rls.sql`.

## 4. Checklist before launching admin flows

- `supabase db push` ran since the last migration commit (run again each time the SQL changes).  
- The RPC `public.is_admin_or_editor()` exists and is accessible from the project (use the Supabase SQL editor to test).  
- At least one admin user has a row in `public.user_roles` with `admin` role and `auth.users` entry (create the user via Supabase Auth first).  
- `slot_entitlements` and `payments` entries exist for test data (Stripe webhook will populate them when `checkout.session.completed` fires).  
- `credit_packs`, `accounts`, and `account_members` contain seed data so monetization UI doesn’t crash when it queries them.  
- `content_placements` has the expected RLS (active/published filtering) so the admin placement editor can read/write to the control room table.

## 5. If something fails

- **`public.is_admin_or_editor` is missing**: rerun the master fix migration (`supabase db push` with `20260202000000_master_fix.sql` or `MASTER_FIX.sql`).  
- **`user_roles` lacks admin row**: insert via SQL as shown above or create a simple SQL script that accepts an email.  
- **Accounts/credits misbehaving**: run the accounts migration manually to ensure `public.accounts`, `public.account_members`, and `public.account_ledger` exist before `submissions` claims them.
- **`profiles.admin_walkthrough_completed_at` missing**: reapply `20260203000003_admin_onboarding.sql` so the admin provider can track walkthrough completion and the SQL render doesn’t fail when reading that column.
