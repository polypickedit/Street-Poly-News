# StreetPoly Platform Diagnostics & Problems

## 1. Environment & Infrastructure

- **Docker Daemon:** ❌ Disconnected.
  - *Impact:* `supabase status` and local database management commands fail.
  - *Action:* Ensure Docker Desktop is running on the host machine.
- **Supabase CLI Credentials:** ⚠️ Not found in `~/.supabase/credentials.json`.
  - *Action:* Run `supabase login` to re-authenticate if CLI management is needed.
- **Email Verification:** ℹ️ Disabled for local development.
  - *Status:* `[auth.email] enable_confirmations = false` in `supabase/config.toml`. Users are automatically confirmed upon signup.

## 2. Security & Auth

- **Admin Access:** ✅ Verified.
  - Admin email `wr3ckdowwt@gmail.com` is assigned the `admin` role in `user_roles`.
- **Row Level Security (RLS):** ✅ Tightened.
  - Public access restricted for `posts`, `categories`, `people`, `submissions`, and `payments`.
  - Helper function `public.is_admin_or_editor()` is the source of truth for RBAC.
- **Intent-Aware Redirects:** ✅ Implemented.
  - `AdminRoute.tsx` captures the attempted URL and `Login.tsx` redirects back after successful auth.

## 3. Monetization Layer

- **Schema:** ✅ Complete.
  - Tables: `slots`, `submissions`, `payments`, `placements`.
  - `submissions` and `placements` are linked to `payments`.
- **Enforcement:** ✅ Database-level.
  - Trigger `check_payment_before_approval` prevents approving unpaid submissions.
- **Frontend Gaps:** ✅ Resolved.
  - Stripe checkout redirect is implemented in `BookingForm.tsx`.
  - Submission success now initiates real Stripe Checkout sessions.
- **Stripe Webhooks:** ✅ Implemented & Schema Synced.
  - Supabase Edge Function `stripe-webhook` handles `checkout.session.completed` and `payment_intent.succeeded`.
  - Logic automatically marks submissions as `paid` and grants entitlements.
  - **Note:** Schema cache was refreshed to ensure `user_capabilities` table is visible to Edge Functions.
- **Offer Abstraction:** ✅ Normalized.
  - `slots` table extended with `entitlement_code` and `duration_days` to unify monetization routes.
- **User Dashboard:** ✅ Live.
  - `/dashboard` provides users with a unified view of their Submissions, Placements, and Payment history.
  - RLS policies updated to allow secure user access to their own data.

## 4. Pending Actions

- [x] Implement admin-side "Unified Queue" to normalize operator workflows.
- [x] Implement Stripe Checkout redirect in `BookingForm.tsx`.
- [ ] Resolve Docker daemon connection to verify local Supabase state.

## 5. Production Go-Live Checklist (Operator Mode)

Before switching to live payments, ensure these four gates are open simultaneously:

- **Stripe Mode:** 
  - [ ] Set `VITE_STRIPE_PUBLISHABLE_KEY = pk_live_...` in production environment variables.
  - [ ] Set `STRIPE_SECRET_KEY = sk_live_...` in production environment variables.
  - [ ] Rotate local keys if live keys were ever exposed in `.env`.
  - [ ] **Critical:** Update `supabase/functions/stripe-webhook/pricing.ts` with your actual Stripe Price IDs to ensure capability grants work.
- **Infrastructure:**
  - [ ] Verify site is served over **HTTPS** (Stripe requirement for real payments).
  - [ ] Confirm production domain matches the `returnUrl` logic in `lib/stripe.ts`.
- **Webhooks:**
  - [ ] Register live webhook endpoint in Stripe Dashboard: `https://your-domain.supabase.co/functions/v1/stripe-webhook`.
  - [ ] Configure live signing secret (`whsec_...`) in Supabase Edge Function secrets.
  - [ ] Subscribe to `checkout.session.completed` and `payment_intent.succeeded`.
- **Operational Verification:**
  - [ ] Perform one real $1–$5 payment as a test user.
  - [ ] Confirm `submissions.payment_status` updates to `paid` automatically.
  - [ ] Verify admin "Unified Queue" reflects the paid status and unlocks approval.

### Operational Warnings
- Expect Stripe fraud review delays for first payouts.
- Do not refund manually outside the Stripe dashboard to maintain DB integrity.
- Monitor Stripe Radar for early production traffic.
