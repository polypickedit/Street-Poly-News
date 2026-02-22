# Stripe Event Reference & Webhook Handlers

This document serves as the authoritative reference for Stripe webhook events handled by the Commerce Spine.

## Webhook Endpoint: `/stripe-webhook`

**Handler File**: `supabase/functions/stripe-webhook/index.ts` -> `handler.ts`

### Handled Events

| Event Type | Handler Action | Criticality |
| :--- | :--- | :--- |
| `checkout.session.completed` | Triggers fulfillment (Entitlements, Merch, Slots) | **CRITICAL** |
| `payment_intent.succeeded` | Records payment (Idempotent backup) | HIGH |
| `customer.subscription.deleted` | Revokes slot entitlements | HIGH |

---

## Detailed Event Logic

### 1. `checkout.session.completed`
**Trigger**: Successful checkout (Subscription, One-time payment, Merch).
**Logic**:
1.  **Extract Metadata**: `userId`, `slotId`, `submissionId`, `type`, `items`, `merchOrderId`.
2.  **Listening Tier Purchase**:
    *   Verifies `listeningSessionId` and `listeningTierId`.
    *   RPC: `record_listening_tier_purchase`.
    *   Updates `listening_session_purchases` to `paid`.
3.  **Submission Payment (Slot/Placement)**:
    *   RPC: `update_submission_status` -> `paid`.
    *   RPC: `update_submission_status` -> `pending_review` (Auto-transition).
    *   Updates `submission_distribution` rows if outlets selected.
4.  **Slot Entitlement**:
    *   Upserts `slot_entitlements` with `is_active=true`.
5.  **Merch Orders**:
    *   Updates `merch_orders` status to `paid`.
    *   **Entitlement Granting**: Scans order items for linked products with `entitlement_key`.
    *   Upserts `user_entitlements` for each applicable item.
6.  **Quick Payment**:
    *   Logs to `admin_actions` as `quick_payment_received`.

### 2. `payment_intent.succeeded`
**Trigger**: Successful payment intent (often accompanies checkout session).
**Logic**:
*   Upserts into `payments` table.
*   Serves as an immutable record of revenue.
*   **Note**: Does not trigger fulfillment logic to avoid double-processing, unless specific metadata flags are present (legacy).

### 3. `customer.subscription.deleted`
**Trigger**: Subscription cancellation or non-payment.
**Logic**:
*   Revokes entitlement by setting `is_active=false` in `slot_entitlements`.
*   Logs `entitlement_revoked` event.

---

## Architecture & Safety

### Idempotency
*   All DB operations use `upsert` or check for existence before inserting.
*   `commerce_events` table tracks every webhook ID to prevent duplicate processing.

### Error Handling
*   **Retry Policy**: The handler **throws an error** if critical processing fails. This forces Stripe to retry the webhook (exponential backoff).
*   **Logging**: All events (success and failure) are logged to `commerce_events` table for audit trails.
*   **Partial Failures**: If `merch_orders` updates but `user_entitlements` fails, the transaction logs the error. The retry mechanism will attempt to re-run the logic. Idempotency ensures the successful parts don't duplicate side effects.

### Testing
*   Use `npm run test:subscription` to validate the full loop locally.
*   Use `validate-commerce-integrity.sql` to audit production data for inconsistencies.
