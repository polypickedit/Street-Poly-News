# Testing Handbook

## Stack-specific philosophy
1. **Fast layer (Vitest):** run `npm run test` locally to exercise unit and component tests that mock React, utils, and the Stripe webhook handler.
2. **Medium layer (Vitest integration):** spin up **Supabase Local**, seed the fixtures, and re-run the webhook/rls assertions that trust the database.
3. **Slow layer (Playwright e2e):** drive the UI through login → booking → admin queue to make sure the frontend reflects supabase state.

We follow the golden rule: **"Webhook = truth, DB = memory, UI = reflection."** All payments and status changes are verified through seeded data, webhook logic, and UI flows.

---

## Local prerequisites
1. Install `supabase` CLI and run `supabase start` in the repo root; copy the runtime `.env` values from `supabase/.env.local` (or the CLI output) and export them:
   ```sh
   export SUPABASE_URL=http://localhost:54321
   export SUPABASE_ANON_KEY=...
   export SUPABASE_SERVICE_ROLE_KEY=...
   export VITE_SUPABASE_URL=$SUPABASE_URL
   export VITE_SUPABASE_PUBLISHABLE_KEY=...
   ```
2. (Optional) Run `supabase functions serve` if you need to exercise Edge Functions locally. The tests do not hit Stripe directly, but the CLI still requires valid `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` when functions are invoked outside the mock path.
3. Seed the system objects once with:
   ```sh
   npm run seed:test
   ```
   This command uses the service role key and publishes the permanent emails `test-framework-user@streetpoly.local` and `test-framework-admin@streetpoly.local` (password `Test1234!`).
4. Keep the CLI running while integration/e2e tests execute, then stop it with `supabase stop` when you are done.

---

## Running the layers
| Command | Description |
| --- | --- |
| `npm run test:unit` | Fast Vitest coverage for utils, React components (SubmissionQueue), and the webhook handler. |
| `npm run test:integration` | Supabase-backed RLS + heartbeat tests (requires `supabase start` and the env vars above). |
| `npm run test:e2e` | Playwright drives login (admin + normal), booking modal, and admin queue. Playwright starts `npm run dev` automatically; keep Supabase running. |
| `npm run test` | Vitest in watch mode (fast feedback). |
| `npm run test:all` | Runs unit → integration → e2e sequentially; suitable for nightly smoke runs. |
| `npm run test:e2e:ui` | Launch the Playwright UI runner for interactive debugging. |
| `npm run seed:test` | Rebuilds the seeded fixtures (submissions, payments, distributions, user roles) via `ts-node tests/helpers/run-seed.ts`. |

> **TIP:** The integration tests call the helper RPC `submission_health(submission_id)` built in `supabase/migrations/20260130010000_testing_helpers.sql`. That function is your new system heartbeat.

---

## Environment variables for CI and local shells
| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Point Vitest and Playwright at your local Supabase stack. |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | Required by the Vite frontend; reuse the same values. |
| `TEST_SUPABASE_EMAIL`, `TEST_SUPABASE_PASSWORD` | Optional overrides for the seeded credentials (otherwise use `test-framework-user@streetpoly.local` / `Test1234!`). |
| `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | Required only if you exercise Edge Functions that talk to Stripe. For CI we rely on stubbed events so they can stay empty. |

Set them once (e.g. via `direnv`, `.env.local`, or your CI workflow) before running `npm run test:integration` or `npm run test:e2e`.

---

## GitHub Actions guidance
Create a job that:
1. Checks out the repo and installs dependencies (`npm ci`).
2. Starts `supabase start` (or `supabase start --no-telemetry`) and exports the CLI-generated env vars.
3. Seeds the data via `npm run seed:test`.
4. Runs `npm run test:all` (or the specific layers you want).
5. Stops Supabase (`supabase stop`).

This ensures the slow layer always has an up-to-date heartbeat and the golden rule stays intact.
