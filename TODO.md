# Project TODOs

## Production Auth Hotfix (2026-02-26)


- [ ] **CRITICAL: Align deployed Supabase project with local/project-of-record**
  - Finding: live bundle at `streetpolynews.com` is currently compiled with old project ID.
  - Expected: production should use same project as local `.env.local`.
  - Risk: users may be authenticating against a different auth user base than intended.
- [ ] Update Vercel Production env vars and redeploy:
  - `VITE_SUPABASE_URL=https://<your-project-id>.supabase.co`
  - `VITE_SUPABASE_ANON_KEY=<your-anon-key>`
  - Confirm canonical settings still correct:
    - `VITE_CANONICAL_HOST=streetpolynews.com`
    - `VITE_CANONICAL_PROTOCOL=https`
  - **CRITICAL**: Use "Redeploy" -> Enable "Clear Build Cache" to ensure new env vars are baked in.
- [ ] Ensure Preview/Development envs are intentional (no accidental cross-project config drift).
- [ ] Validate deployed JS no longer references old project (`duldhllwapsjytdzpjfz`).
  - Run: `./scripts/verify_prod_bundle.sh`
- [ ] Run login smoke checks on production after deploy:
  - Email/password sign-in succeeds for known prod user.
  - Google OAuth returns to `/login?redirectTo=...` and completes session.
  - Password reset email flow returns to `/login?type=recovery`.
- [ ] Re-run auth verification tooling locally after key sync:
  - Fix local `SUPABASE_SERVICE_ROLE_KEY` validity (current seed path fails with `401 Invalid API key`).
  - Run `npm run seed:test`.
  - Run `npm run test:e2e -- tests/e2e/auth.spec.ts`.
- [x] Verification harness fixes committed locally:
  - `playwright.config.ts`: maps `SUPABASE_*` and `VITE_SUPABASE_*` for web server + tests.
  - `tests/helpers/run-seed.ts` and `tests/helpers/seed.ts`: ESM import extension fixes (`.ts`).

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

## YouTube Feed Sovereignty – Phase 1/2

### Phase 1 (Completed in code)

- [x] Create Supabase Edge Function `youtube-feed` for normalized YouTube responses.
  - File: `supabase/functions/youtube-feed/index.ts`
  - Supports `videoIds` lookup mode using `videos?part=snippet,statistics`.
  - Supports channel pipeline mode using:
    1. `channels?part=contentDetails` -> uploads playlist
    2. `playlistItems?part=snippet,contentDetails`
- [x] Clamp long descriptions server-side (240 chars) to protect infinite-scroll layout stability.
- [x] Wire frontend feed hydration to consume backend metadata only (no direct YouTube fetches in React).
  - File: `src/hooks/usePosts.ts`
  - Hydrates missing `subtitle`, `thumbnail_url`, and `view_count`.
- [x] Keep current feed architecture stable (existing `posts` query + metadata hydration fallback).

### Phase 2 (Team Execution Queue)

- [ ] Add Supabase Edge secret:
  - `YOUTUBE_API_KEY` for function `youtube-feed-refresh`.
- [ ] Deploy function:
  - `supabase functions deploy youtube-feed`
  - `supabase functions deploy youtube-feed-refresh`
- [ ] Add/confirm feed-source config (channel IDs for StreetPoly sources) in env or DB.
- [x] Consolidate to one ingestion worker + one cache-read API:
  - Canonical migration: `20260225143000_youtube_feed_cache_and_sources.sql`
  - Removed overlap migration: `20260225000000_youtube_feed_cache.sql`
  - Kept ingestion worker: `supabase/functions/youtube-feed-refresh/`
  - Refactored `youtube-feed` to cache-read only
- [x] Build cache table `youtube_feed_cache` and indexes.
  - Required columns: `channel_id`, `video_id`, `title`, `description`, `thumbnail`, `published_at`, `fetched_at`.
- [x] Add refresh function to fetch channel uploads and upsert cache rows.
- [ ] Schedule cron refresh every 30-60 minutes.
  - Prepared script: `supabase/scripts/youtube_feed_cron.sql`
- [x] Add cache-first read path so frontend hits StreetPoly API only, never YouTube directly.
- [ ] Add failure safeguards:
  - Keep last known cache on API failure/quota exhaustion.
  - Emit structured logs for quota/call errors.
- [ ] Add acceptance checks:
  - Cards always show `title`, `thumbnail`, and `publishedAt`.
  - Descriptions are clamped in UI and/or API.
  - Infinite scroll remains stable under long text payloads.
- [x] Add manual editor-mode sync action to pull fresh YouTube metadata on demand.
  - File: `src/components/admin/VideoSlotEditor.tsx`

### Ownership Split Suggestion

- [ ] Backend owner: cache table + cron refresh + API hardening.
- [ ] Frontend owner: card mapping verification + UI clamp + scroll regression checks.
- [ ] Ops owner: secrets + deploy + quota monitoring.
