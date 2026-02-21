# Commerce Spine Testing Checklist

Use this checklist to verify the integrity of the commerce architecture before and after any deployment.

## 1. Data Model Verification
- [ ] **Schema Validation:** Run `supabase db diff` to ensure no drift.
- [ ] **Constraint Check:** Verify `products` table has `entitlement_key` and `price_cents` NOT NULL.
- [ ] **Seed Data:** Confirm `products` table has valid test data (Book, Join, Learn, Shop categories).

## 2. UI Component Safety
- [ ] **Store Layout:** Verify canonical category order (Join -> Book -> Learn -> Shop).
- [ ] **Product Card:** 
  - [ ] Loading state activates on click.
  - [ ] Error boundary catches purchase failures.
  - [ ] Images load lazily (`loading="lazy"`).
- [ ] **Payment Success:**
  - [ ] Redirects to `/payment/success`.
  - [ ] Polls for `paid` status (max 10 attempts).
  - [ ] Displays purchased items list.

## 3. Payment Flow (Stripe)
- [ ] **Checkout Session:**
  - [ ] `create-checkout-session` function uses server-side prices.
  - [ ] Metadata includes `userId` and `merchOrderId`.
- [ ] **Webhook Handling:**
  - [ ] `checkout.session.completed` updates `merch_orders` to `paid`.
  - [ ] `merch_order_items` triggers `user_entitlements` grant.
  - [ ] `commerce_events` logs `webhook_received` and `entitlement_granted`.

## 4. Fulfillment (Ecwid/Manual)
- [ ] **Order Status:** `merch_orders` status transitions from `pending` -> `paid`.
- [ ] **Shipping Info:** Address captured in `merch_orders` (if applicable).

## 5. Automated Validation
- [ ] **Unit Tests:** Run `deno test tests/unit/merch-webhook.test.ts`.
- [ ] **Integration Script:** Run `npx ts-node scripts/test-merch-purchase.ts` (Requires valid `.env.local`).
- [ ] **SQL Integrity:** Run `scripts/validate-commerce-integrity.sql` against production DB.

## 6. Rollback Procedure
If any critical check fails:
1. Revert to previous migration version.
2. Restore `supabase/functions/stripe-webhook` from backup.
3. Notify stakeholders of commerce pause.
