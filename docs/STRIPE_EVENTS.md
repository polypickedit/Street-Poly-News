
# Stripe Event Reference & Webhook Handlers

This document outlines the Stripe events handled by the Commerce Spine and their corresponding actions in the system.

## Critical Payment Events

### `checkout.session.completed`
**Source:** Stripe Checkout
**Handler:** `supabase/functions/stripe-webhook/index.ts` (or equivalent Edge Function)
**Action:**
1.  **Retrieve Session:** Fetches full session details including line items.
2.  **Identify User:** Matches `client_reference_id` or `customer_email` to Supabase user.
3.  **Grant Entitlements:**
    *   **Booking:** Updates `submissions` table status to `paid`.
    *   **Merch:** Creates order record (if applicable) and triggers fulfillment workflow (e.g., Ecwid sync).
    *   **Listening Session:** Adds user to `listening_session_participants`.
4.  **Idempotency:** Checks if `payment_intent` was already processed to prevent duplicate entitlements.

### `payment_intent.succeeded`
**Source:** Stripe Payment Intent (Direct)
**Handler:** `supabase/functions/stripe-webhook/index.ts`
**Action:**
*   Secondary confirmation of payment success.
*   Often redundant if `checkout.session.completed` is handled, but useful for async payment methods (e.g., SEPA, ACH).
*   **Audit:** Logs successful payment for reconciliation.

### `payment_intent.payment_failed`
**Source:** Stripe Payment Intent
**Handler:** `supabase/functions/stripe-webhook/index.ts`
**Action:**
*   **Notification:** Optionally emails user about failed payment.
*   **State:** Ensures no entitlements are granted.
*   **Logging:** Records failure reason (e.g., insufficient funds, card declined) for support.

## Subscription Events (If Applicable)

### `customer.subscription.created`
**Action:** Logs new subscription start.

### `customer.subscription.updated`
**Action:** Updates subscription status (e.g., `active` -> `past_due`).

### `customer.subscription.deleted`
**Action:** Revokes access/entitlements immediately.

## Webhook Security & Best Practices
1.  **Signature Verification:** All webhooks must verify the `Stripe-Signature` header using the `STRIPE_WEBHOOK_SECRET`.
2.  **Idempotency:** Handlers must be idempotent. Use `event.id` or `payment_intent.id` to track processed events.
3.  **Order of Operations:** Do not assume events arrive in order. `checkout.session.completed` might arrive before `payment_intent.succeeded`.
4.  **Retry Logic:** Stripe retries webhooks for up to 3 days. Handlers must handle potential delays.

## PayPal Stabilizer Interaction
*   **No Webhooks:** The temporary PayPal flow **does not** use webhooks.
*   **Manual Reconciliation:** Admin manually verifies payment on PayPal dashboard and updates status in `PayPalOrdersPage`.
*   **Isolation:** Stripe webhooks **must not** attempt to process PayPal `placement_orders`.

## Debugging
*   **Stripe Dashboard:** Use the "Events" tab to view raw JSON and delivery logs.
*   **Supabase Logs:** Check Edge Function logs for `stripe-webhook` execution details.
