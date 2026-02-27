# Supabase Production Checklist

## 🔐 Security & Access Control

### Row Level Security (RLS)
- [x] **Audit Tables**: Ensure all tables have RLS enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
- [x] **Review Policies**: Verify `profiles`, `accounts`, and commerce tables have strict ownership policies.
- [ ] **Manual Verification**: Test policies with a non-admin user to confirm data isolation.

### Authentication
- [ ] **MFA Enforcement**: Enable Multi-Factor Authentication for the Supabase Dashboard (Organization level).
- [ ] **SMTP Configuration**: Switch from Supabase's default SMTP to a custom provider (SendGrid, Resend, AWS SES) to bypass the 30 emails/hour limit.
  - Go to: `Project Settings > Authentication > SMTP Settings`.
- [ ] **Redirect URLs**: Ensure only production URLs are in the allowlist.
  - Go to: `Authentication > URL Configuration`.
  - Remove `localhost` entries from production project settings.

## 🚀 Performance & Reliability

### Database
- [x] **Indices**: Verified indices on foreign keys and frequently queried columns (e.g., `youtube_feed_cache`).
- [ ] **Point-in-Time Recovery (PITR)**: Consider enabling for granular backups (Paid Add-on).
- [ ] **Vacuuming**: Ensure auto-vacuum settings are appropriate for your write volume.

### Edge Functions
- [x] **Secrets**: Ensure `YOUTUBE_API_KEY`, `STRIPE_SECRET_KEY`, etc., are set in production.
- [ ] **Logs**: Monitor Edge Function logs for timeouts or memory limits.

## 🛡️ Operational Readiness

### Monitoring
- [ ] **Error Tracking**: Set up Sentry or similar for frontend error monitoring.
- [ ] **Supabase Logs**: Familiarize yourself with the `Logs > API` and `Logs > Postgres` sections.

### Backups
- [ ] **Nightly Backups**: Confirm they are running (available on Pro plan).
- [ ] **Manual Dump**: Perform a `pg_dump` before major launches.

## 💳 Billing
- [ ] **Spend Cap**: Check if "Spend Cap" is enabled or disabled to prevent service interruptions during traffic spikes.
