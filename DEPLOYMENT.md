# Deployment + verification checklist for Supabase functions & Stripe

This repo already wires the admin UI to Supabase functions (`create-checkout-session`, `stripe-webhook`, `track-click`). Before we can call the `/admin` workflows production-ready, the following steps must be completed and verified.

## 1. Prerequisites (see also `ENVIRONMENT.md` / `SUPABASE-SETUP.md`)

- Confirm the client environment has `VITE_SUPABASE_*` + `VITE_STRIPE_PUBLISHABLE_KEY`.  
- Register `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET` with Supabase Secrets / Lovable / Vercel before deploying functions.  
- Run `supabase db push --project-ref <proj>` so the schema/policies (including `public.is_admin_or_editor`) match the UI expectations.  
- Seed at least one `admin` user via `public.user_roles` (per `SUPABASE-SETUP.md`).

## 2. Deploy Supabase functions

Each function requires the service role key (and for Stripe functions, the Stripe secrets). Deploy them in order whenever you change the code:

```sh
supabase functions deploy create-checkout-session --project-ref <proj> --env-file supabase/functions/.env
supabase functions deploy stripe-webhook --project-ref <proj> --env-file supabase/functions/.env
supabase functions deploy track-click --project-ref <proj> --env-file supabase/functions/.env
```

*The functions folder doesn’t actually contain `.env` (the CLI injects secrets from the project settings), but the `--env-file` flag shows where you would point to a secret manifest if needed.*  
After any deploy, confirm the Supabase dashboard shows a `CREATE_CHECKOUT_SESSION`/`stripe-webhook` function with timestampped deploy events.

## 3. Register Stripe webhook

1. Run `stripe login` from a machine with the right Stripe account.  
2. Determine the public webhook endpoint once the Supabase function is deployed: `https://<project>.functions.supabase.co/stripe-webhook`.  
3. Start the Stripe CLI to forward events while capturing the signing secret:
   ```sh
   stripe listen --forward-to https://<project>.functions.supabase.co/stripe-webhook
   ```
4. Copy the `Signing secret` from the CLI output and paste it into the Supabase secret store as `STRIPE_WEBHOOK_SECRET`.  
5. Verify Stripe sees a `GET` to `/stripe-webhook` by checking the Stripe Dashboard > Webhooks > Event Logs.

## 4. Verify monetization & admin flows

1. **Test a checkout flow**: from the UI call `createSlotCheckoutSession` (via the client) or simulate via Postman. After `checkout.session.completed`, confirm:
   - `slot_entitlements` has a row for the user.  
   - `payments` contains the Stripe Payment Intent ID and status `succeeded`.  
   - `submission_distribution` rows appear if `selectedOutlets` was supplied.  
   - `admin_actions` contains a log entry from the Stripe webhook trigger.
2. **Visit `/admin/queue`, `/admin/placements`, `/admin/settings`** after logging in as an admin. The admin shell should respect `AdminRoute` and the layout should load.  
3. **Check admin activity**: `admin_actions` should reflect the quick actions (approvals + placement edits).  
4. **Verify `content_placements`**: ensure the control room UI can fetch the active rows (RLS ensures only `active`+non-expired rows show).  
5. **Monitor the webhook**: Confirm the Supabase functions logs (from the project dashboard) show `stripe-webhook` handling `checkout.session.completed` events without errors.

## 5. Launch checklist (run before cutting a release)

1. `npm run dev` locally with `.env.local` set (exercise admin path + wallet checkout).  
2. `npm run build` (ensures Vite sees the `VITE_` env vars).  
3. `supabase db push` + `supabase functions deploy *` ran within the same deploy window (so schema + runtime stay in sync).  
4. Stripe webhook secret is up-to-date and still valid (if you rotate `stripe listen`, copy the new secret).  
5. `slot_entitlements`/`payments` tables look normal after a test purchase; the admin dashboard should surface the new counts.  
6. Document the exact environment variable values + rotation date in internal runbooks so the next deploy preserves them.

## 6. Optional: track-click analytics

- Deploy `track-click` if you need to funnel affiliate clicks through Supabase (it uses the same service role key).  
- Keep `SUPABASE_SERVICE_ROLE_KEY` in the Supabase secrets because the function inserts rows into `affiliate_clicks` / updates `affiliate_links`.  
- The function logs each click and redirects to the affiliate destination for extra tracing.
