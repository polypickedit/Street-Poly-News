# Production Readiness Checklist

This project currently wires up the front-end routes, Supabase RPCs/policies, and Stripe hooks, but a few outstanding moves are still needed before the newsroom and admin portal are fully functional in a deployed environment.

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
