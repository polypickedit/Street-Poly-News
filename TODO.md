# Production Readiness Checklist

## ✅ Recently Completed (Live Logistics & Admin Overhaul)

- [x] **Conduction Mode Overhaul**: Implemented a visual "Booth" overlay for real-time site layout management.
- [x] **Temporal Scheduling**: Added support for `starts_at` and `ends_at` in content placements, allowing for future-dated or expiring content.
- [x] **Device-Specific Targeting**: Added the ability to serve different content for Mobile vs. Desktop users within the same slot.
- [x] **Realtime Booth Presence**: Integrated Supabase Presence to allow admins to see other active conductors in real-time.
- [x] **Inventory Virtualization**: Converted hardcoded YouTube grid on the homepage to a dynamic `home.clips` slot.
- [x] **Admin UX Polish**: Increased tap targets to 96px for mobile efficiency, added visible text labels, and ensured slot tags are always visible in edit mode.
- [x] **Technical Debt**: Refactored hooks for React Fast Refresh and implemented strict typing for the Supabase service layer.

## ✅ Recently Completed (Auth Hardening Follow-up)

- [x] **Fail-closed slot access**: `useSlotAccess` now denies access on lookup/check failures instead of default-allow.
- [x] **Admin role source-of-truth alignment**: `SubmissionQueue` and `AdminProvider` now consume `useAuth` role/session state instead of duplicating `getUser` + role RPC checks.
- [x] **User-scoped query keys**: dashboard user data queries (`submissions`, `placements`, `payments`) are now keyed by `userId` to avoid cross-session cache bleed.
- [x] **Checkout/session consistency**: checkout flow now uses auth context state; Stripe helpers use centralized session fetch guard (`fetchSession`) with timeout.
- [x] **Admin access parity in mobile nav**: bottom nav now treats `admin` and `editor` as valid admin-menu access and exposes `/admin` entry consistently.
- [x] **Top/bottom overlay coordination**: opening top overlays (mobile menu/search/user dropdown) now suppresses bottom nav rendering to prevent blocked taps in dropdown lower regions.
- [x] **Conduction drawer UX simplification (first pass)**: `ConductDrawer` now prioritizes current live preview + replacement flow, moves advanced scheduling/targeting into an accordion, removes internal IDs, and keeps save/invalidate behavior intact.
- [x] **Identity model hardening**: added profile identity migration with username normalization (`username_normalized`), case-insensitive unique index, strict username regex checks, profile type (`artist`/`viewer`), and username change audit fields.
- [x] **Profile lifecycle RPCs**: added `check_username_availability`, `complete_profile_setup`, and `update_username` (30-day cooldown enforced server-side).
- [x] **Signup UX + validation upgrade**: signup now requires username and profile type, requires artist display name for artist signup, and shows real-time username availability checks.
- [x] **Artist profile completion gate**: authenticated artists missing `display_name` are redirected to `/complete-profile` before browsing/submission surfaces.
- [x] **Profile settings username cooldown UI**: added `/settings/profile` with username availability checks and cooldown countdown messaging.

## 🔄 Auth/System Gaps Remaining

- [ ] Remove/guard runtime debug logs in production paths (`src/integrations/supabase/client.ts`, dashboard/admin debug logs).
- [ ] Normalize role hydration typing in `roleService` (remove `any` cast from `get_user_roles` response).
- [ ] Migrate remaining direct `supabase.auth.getUser/getSession` usage in non-admin hooks/components to auth-context-backed flows where applicable.
- [ ] Add e2e coverage for OAuth redirect + role hydration timing (post-redirect auth transition, admin route gating while roles load).
- [ ] Remove transient role resets for same-user auth events (avoid setting `isAdmin/isEditor` to false during re-auth/refresh before hydration completes).
- [ ] Add DB-side role observability checks (`get_user_roles` contract, RLS visibility, seeded `user_roles`) to quickly diagnose "admin fades" reports.
- [ ] Add e2e coverage for new identity flows: signup username uniqueness, artist completion redirect, and pre/post 30-day username change attempts.
- [ ] Replace placeholder OAuth usernames (`user_<id-prefix>`) with a mandatory first-login username capture flow for brand-new OAuth users.

---

## Top Priorities (work in order)

1. **Fix the Stripe booking/payment flow** (edge function + cart) so the checkout session is created and returns a URL.
2. **Clean up secrets/ env hygiene**: remove the tracked `.env`, document/journal where `VITE_*`, `SUPABASE_*`, and `STRIPE_*` keys live, and ensure production secrets are set in Lovable/Vercel/Supabase and rotated if anything leaked.
3. **Rebuild schema & policies**: run all Supabase migrations, confirm helpers (`public.is_admin_or_editor()`, etc.) exist, and seed roles/admins so the `/admin` UI actually renders.
4. **Authenticate safely**: finish the Google OAuth setup (redirects + secrets) and verify `Login`/`AdminRoute` remain locked behind `auth.uid()` + the new `admin_users` identity.
5. **Document the launch & observability checklist** once the above are stable.

---

## 1. Secrets & Runtime Config

- Remove the tracked `.env` file (it currently exposes `STRIPE_SECRET_KEY` and Supabase keys) and add it to `.gitignore`; keep real secrets in `.env.local` or, better, in the deployment platform’s secret store, then rotate any leaked credentials.
- Populate every required env var: the client needs `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY`, while the Supabase functions and server-side hooks also require `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET`.
- Keep production site URLs and OIDC redirect entries updated (see `supabase/config.toml`) so auth flows redirect to the live domain instead of `http://localhost:5173`.

## 2. Supabase Backend & Roles

- Run `supabase db push` (or equivalent migrations) so `roles`, `user_roles`, `slots`, `slot_entitlements`, `admin_actions`, and other tables/policies defined in `supabase/migrations/*.sql` exist before the UI needs them.
- Ensure the helper RPC `public.is_admin_or_editor()` and its dependent policies are in place; the client relies on this RPC in `AdminRoute`/`Navbar`/`BottomNav`.
- Seed at least one admin user, assign them the `admin` role (see `20260129014210_assign_admin_wr3ckdowwt.sql`), and document how to add additional admins so the `/admin` section is reachable.

## 3. Authentication & Admin Guard

- Decide whether open sign-ups (currently enabled with no confirmation in `config.toml`) are acceptable; if not, require email confirmations, disable public sign-up, or add an invite-only gate before someone can reach `supabase.auth.signUp`.
- Double-check that the admin login form and session handling (`src/pages/Login.tsx`) surface clear errors, and that `AdminRoute` fails closed if the RPC fails or the user lacks `admin/editor` roles.

## 4. Monetization / Stripe Flows

- Deploy the Supabase Edge Functions `create-checkout-session` and `stripe-webhook` with the correct secrets so checkout calls can be created and payouts reconcile with the `slot_entitlements` table.
- Register the webhook endpoint in Stripe and copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`; the function currently logs events and gives entitlements based on `metadata`.
- Verify the `slots` pricing seed (see `20260129040000_monetization_wiring.sql`) matches the UI, and that `slot_entitlements` enforcement (via triggers on `payments`/`submissions`) is aligned with what admins expect.

## 5. Validation & Launch Checklist

- Run `npm run dev` (and `npm run build` if needed) to ensure the public pages and admin dashboard render across breakpoints and the login redirect works.
- Confirm Supabase migrations and functions deploy without errors, the Stripe webhook is receiving events, and admins can manage submissions/slots via the dashboard.
- Once everything is wired up, document (or script) the deploy steps so future maintainers can reproduce the environment in Lovable/Vercel/Supabase.

- [x] **Address `net::ERR_ABORTED` logs**: 
    - Optimized AdminDashboard and Dashboard queries by moving them to a higher level in the component tree.
    - Explicitly disabled `abortSignal` for lightweight background queries (stats, activities) to prevent browser console noise during component unmounts.
- [x] **Sign-out Auth Requests**: Added error handling to sign-out flows to ensure requests complete before redirection.

## 7. Action Plan

### Fix the Stripe booking/payment flow
- [ ] Reproduce the checkout failure locally and capture the `create-checkout-session` logs.
- [ ] Confirm server env vars (`STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are available to the function and logged payloads are complete.
- [ ] Adjust the edge function or client payload so Stripe can create the session and the response includes `{ url }`.
- [ ] Step through booking form → cart → `/checkout` → webhook and ensure submissions transition `unpaid` → `paid` → `pending_review`.

### Secrets & runtime config
- [ ] Remove tracked `.env` (or any file exposing live secrets) and ensure `.gitignore` covers all `.env*` entries.
- [ ] Create a `.env.local` copy of `.env.example` with placeholder keys for local dev.
- [ ] Document the required `VITE_*`, `SUPABASE_*`, and `STRIPE_*` env vars in `ENVIRONMENT.md` (and any deployment docs).
- [ ] Set secrets in deployment platforms (Lovable/Vercel/Supabase) and redeploy the Supabase functions so they pick them up.
- [ ] Update `supabase/config.toml` redirect entries to match the actual origins (localhost ports, staging/prod) and redeploy the config.

### Rebuild schema & policies
- [ ] Run all migrations (`supabase db reset/push`) so `supabase/migrations/*.sql` and the new `20260214000000_admin_identity.sql` are applied.
- [ ] Insert your UID into `public.admin_users` and verify `public.is_owner_admin()` returns true for you.
- [ ] Confirm `public.is_admin_or_editor()` now references `public.is_owner_admin()` so RLS policies automatically honor the new admin identity.
- [ ] Optionally run `scripts/sql/generate_policy_diffs.sql` to compare the current policies to `OR public.is_owner_admin()` variants and apply the selected diffs (start with SELECT policies).

### Authenticate safely
- [ ] Reconfigure the Google OAuth provider (client ID/secret + redirect URLs) in Supabase Auth and ensure the same URLs are listed in `supabase/config.toml`.
- [ ] Exercise email/password and OAuth login flows locally; watch the `useAuth` logs to confirm the session resolves and `AdminRoute` redirects appropriately.
- [ ] Test accessing `/admin` as a normal user (should be denied) and as the owner (should load fully).

### Launch & observability
- [ ] Run `npm run build` and the relevant test suites (`test:unit`, and optionally `test:integration/test:e2e`) after the above changes.
- [ ] Complete an end-to-end booking → Stripe payment → webhook run and verify `submissions`, `payments`, `slot_entitlements`, and `submission_distribution` rows update as expected.
- [ ] Capture a deployment checklist (extend `RELEASE_CHECKLIST.md` or `TODO.md`) that lists secrets/migrations/function deploys/webhook checks and a quick admin verification step.
- [ ] Confirm admin-only UI (Control Room, audit view) is gated behind `public.is_owner_admin()` so only the explicit owner sees it.

## 8. Security Validation Checklist
- [ ] Log in as a standard user and confirm `/admin` is blocked while normal pages still render (AdminRoute is UX only).
- [ ] As that same user, run `supabase.from('merch_orders').select('*')` and verify you either get 0 rows or a policy rejection.
- [ ] Run the same query as an admin; you should see real merch orders with shipping/contact details.
- [ ] Confirm `merch_orders`, `merch_inventory`, and admin-oriented views/policies explicitly include `auth.uid() = user_id` or `public.is_owner_admin()` guards.
- [ ] Ensure no `anon` access is granted to admin tables—`merch_inventory` and audit views should only be readable through the owner check.
- [ ] If any direct SQL returns rows for a non-admin, fix the policy / view filter immediately.
