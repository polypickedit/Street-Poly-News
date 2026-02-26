
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
- [x] Clamp long descriptions server-side (160 chars) to protect infinite-scroll layout stability.
- [x] Wire frontend feed hydration to consume backend metadata only (no direct YouTube fetches in React).
  - File: `src/hooks/usePosts.ts`
  - Hydrates missing `subtitle`, `thumbnail_url`, and `view_count`.
- [x] Keep current feed architecture stable (existing `posts` query + metadata hydration fallback).

### Phase 2 (Team Execution Queue)

- [ ] Add Supabase Edge secret:
  - `YOUTUBE_API_KEY` for function `youtube-feed`.
- [ ] Deploy function:
  - `supabase functions deploy youtube-feed`
- [ ] Add/confirm feed-source config (channel IDs for StreetPoly sources) in env or DB.
- [ ] Build cache table `youtube_feed_cache` and indexes.
  - Required columns: `channel_id`, `video_id`, `title`, `description`, `thumbnail`, `published_at`, `fetched_at`.
- [ ] Add refresh function to fetch channel uploads and upsert cache rows.
- [ ] Schedule cron refresh every 30-60 minutes.
- [ ] Add cache-first read path so frontend hits StreetPoly API only, never YouTube directly.
- [ ] Add failure safeguards:
  - Keep last known cache on API failure/quota exhaustion.
  - Emit structured logs for quota/call errors.
- [ ] Add acceptance checks:
  - Cards always show `title`, `thumbnail`, and `publishedAt`.
  - Descriptions are clamped in UI and/or API.
  - Infinite scroll remains stable under long text payloads.

### Ownership Split Suggestion

- [ ] Backend owner: cache table + cron refresh + API hardening.
- [ ] Frontend owner: card mapping verification + UI clamp + scroll regression checks.
- [ ] Ops owner: secrets + deploy + quota monitoring.
