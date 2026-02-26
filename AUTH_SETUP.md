# Authentication Setup & Configuration Guide

## Overview

This document outlines the authentication configuration for Street Politics Feed, using Supabase Auth.

## 1. Supabase Project Configuration

Ensure your Supabase project is configured correctly in the dashboard:

### Email Auth

- [ ] **Enable Email Provider**: Go to Authentication -> Providers -> Email
- [ ] **Confirm Email**: Disable "Confirm email" for development if desired, or ensure SMTP is set up.
- [ ] **Secure Password**: Ensure "Secure password" policy is enabled.

### External Providers (Google)

- [ ] **Enable Google Provider**: Go to Authentication -> Providers -> Google
- [ ] **Client ID**: Add your Google Client ID
- [ ] **Client Secret**: Add your Google Client Secret
- [ ] **Callback URL**: Add `https://cjodbnsjggslngnzwxsv.supabase.co/auth/v1/callback` to your Google Cloud Console "Authorized redirect URIs".

### URL Configuration

Go to Authentication -> URL Configuration:

- [ ] **Site URL**: Set to your production URL (e.g., `https://street-politics-feed.vercel.app` or your custom domain)
- [ ] **Canonical Domain**: Pick one production hostname (`www` or non-`www`) and keep it consistent across DNS, app hosting redirects, and Supabase URL config.
- [ ] **Redirect URLs**: Add all valid redirect URLs. This is CRITICAL for production auth to work:
  - `http://localhost:8080` (Local Dev)
  - `http://localhost:8080/admin`
  - `http://localhost:8080/auth/callback`
  - `https://cjodbnsjggslngnzwxsv.supabase.co`
  - `https://street-politics-feed.vercel.app` (Production Root)
  - `https://street-politics-feed.vercel.app/**` (Wildcard for production subpaths)

If the frontend enforces a canonical host via `VITE_CANONICAL_HOST`, this value should match the same hostname used in Site URL/Redirect URLs.

## 2. Environment Variables (.env.local)

Your local environment must match the remote project configuration.

```bash
VITE_SUPABASE_URL="https://cjodbnsjggslngnzwxsv.supabase.co"
VITE_SUPABASE_ANON_KEY="<your-anon-key>"
VITE_AUTH_GOOGLE_ENABLED="true"
VITE_CANONICAL_HOST="streetpolynews.com"
VITE_CANONICAL_PROTOCOL="https"
SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>" # Required for admin scripts/tests
```

**Important**:

- Do not commit `.env.local` to git.
- `SUPABASE_SERVICE_ROLE_KEY` is for backend/scripts only. Never expose it in client-side code (Vite).

## 3. CLI & Local Development

To run migrations and sync schema:

1. **Login to CLI**:

   ```bash
   supabase login
   ```

2. **Link Project**:

   ```bash
   supabase link --project-ref cjodbnsjggslngnzwxsv
   ```

   (You will need your Database Password. If lost, reset it in Supabase Dashboard -> Settings -> Database).

3. **Push Migrations**:

   ```bash
   supabase db push
   ```

## 4. Auth Context & Hooks

We use a strict `appReady` state to prevent race conditions.

- **useAuth()**: Returns `{ session, user, appReady, ... }`
  - `appReady` is true only when:
    - Auth is initialized
    - If logged in, User Roles are loaded
    - If not logged in, Guest state is settled

- **useProfile()**, **useEntitlements()**, **useSlotAccess()**:
  - All gated by `appReady`.
  - Use `safeFetch` to handle request cancellations (AbortError).

## 5. Troubleshooting

- **"Unsupported provider"**: Check Supabase Dashboard -> Providers.
  - If you intentionally don't use Google OAuth in an environment, set `VITE_AUTH_GOOGLE_ENABLED=false` so the Google button is hidden.
- **"Auth session missing"**: Check `VITE_SUPABASE_URL` matches the project you are logging into.
- **Infinite Loading**: Check `appReady` state in `DebugAuth` component.
- **400/404 Errors**: Likely Schema Drift. Run `supabase db push`.
- **Login Redirects Failing**: Ensure your Production URL is in the "Redirect URLs" list in Supabase Dashboard.

## 6. Role Management

Roles are managed via `user_roles` table and `get_user_roles` RPC.
