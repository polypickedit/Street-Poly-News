# Environment & secrets (dev + production)

This project splits configuration between the browser (Vite) bundle and Supabase/Stripe server-side pieces. The goal is to keep *only* non-sensitive placeholders committed (see `.env.example`) and store real keys in `.env.local` for local work and in your deployment platform’s secret store (Lovable, Vercel, Supabase, etc.).

## 1. Client-side (Vite) variables

The browser bundle reads `import.meta.env.VITE_*` variables directly, so the required keys are:

| Env | Source | Notes |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Supabase project | Public URL (e.g., `https://xxx.supabase.co`). |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase project | The anon/public key. |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project | Used only for tooling (e.g., Lovable). |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe dashboard | Public publishable key for redirecting to checkout. |
| `REACT_APP_*` (legacy) | Supabase project | Included in `.env`/`.env.local` for compatibility with tooling that expects `REACT_APP_` prefixes, but the app itself relies on the `VITE_` values above. |

Create a local `.env.local` (or `.env.development.local`) file that mirrors `.env.example` and never check it in. Example:

```
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_xxx"
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_xxx"
# Optional compatibility entries
REACT_APP_SUPABASE_URL="https://..."
REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY="sb_publishable_xxx"
```

Vite/hot-reload picks up `.env.local` automatically. You can keep secrets per-environment by creating `.env.production.local`, `.env.staging.local`, etc.

## 2. Supabase Edge functions & server processes

The server-side code and Supabase Edge Functions must never run with client keys. They rely on the following environment variables:

| Env | Usage |
| --- | --- |
| `SUPABASE_URL` | Used by every Edge Function when creating a Supabase client (`create-checkout-session`, `stripe-webhook`, `track-click`, etc.). |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key with full database access, required by all functions to bypass RLS and grant entitlements. |
| `STRIPE_SECRET_KEY` | Needed by `create-checkout-session` and `stripe-webhook` to interact with Stripe APIs securely. |
| `STRIPE_WEBHOOK_SECRET` | Stripe’s webhook signing secret (from stripe CLI or dashboard) that `stripe-webhook` uses to validate incoming events. |

These are **server-only** variables. Store them in:

* The Supabase project’s Environment Variables (Settings > API > Project API keys).
* The Supabase Functions secrets if you use `supabase secrets` or reference them in Lovable’s deployment pipeline.
* Your hosting platform (Vercel/Lovable) secrets for builds/deploys so the same named envs exist during `npm run build` and function deploys.

## 3. Stripe webhook & deployment reminders

1. Deploy the Edge Functions with the full set of vars:
   ```sh
   supabase functions deploy create-checkout-session --project-ref <project>
   supabase functions deploy stripe-webhook --project-ref <project>
   supabase functions deploy track-click --project-ref <project>
   ```
2. Register the webhook in Stripe and copy the generated `STRIPE_WEBHOOK_SECRET` into the Supabase secret store.
3. Verify `stripe-webhook` logs show checkout/session events, update `slot_entitlements`, `payments`, and `user_capabilities` per the handler logic.

## 4. Secrets hygiene checklist

- `.env`, `.env.local`, `.env.*.local`, `.env.production`, etc., are already excluded in `.gitignore`; double-check you never `git add` them.  
- If a file with real keys ever gets committed, rotate those keys immediately (Supabase service role + Stripe secrets) and update the environment docs accordingly.  
- Use the `.env.example` file as the template when onboarding new developers; update it only with non-sensitive defaults.  
- For production bundles, set the same `VITE_*` variables in Lovable/Vercel/Supabase so the client and server share the correct endpoints and keys.

## 5. Next actions before launch

1. Confirm the secrets listed above exist in your deployment platform (Lovable project settings, Vercel environment vars, Supabase project secrets).  
2. Run `npm run dev`/`npm run build` after populating `.env.local` to ensure the admin routes and Stripe integration can initialize locally.  
3. When deploying Supabase migrations or functions, double-check you deploy with the same `SUPABASE_*` and `STRIPE_*` envs to avoid runtime `null` errors (`createClient` would otherwise throw).  
4. Document the values you rotated so future maintainers can reproduce the environment without leaking secrets.
