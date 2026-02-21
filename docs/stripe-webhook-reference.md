# Stripe Webhook Reference

This document outlines the Stripe webhooks used in the Violet Obsidian commerce architecture and their corresponding handlers.

## Endpoint

**Path:** `/functions/v1/stripe-webhook`  
**Handler File:** `supabase/functions/stripe-webhook/handler.ts`

## Supported Events

### 1. `checkout.session.completed`
Triggered when a Checkout Session has been successfully completed.

**Actions:**
- **Merch Orders:**
  - Updates `merch_orders` status to `paid`.
  - Grants `user_entitlements` for purchased products (via `merch_order_items` link).
  - Metadata required: `merchOrderId`, `userId`.
  
- **Listening Session Tiers:**
  - Records purchase in `listening_session_purchases`.
  - Links to `payments` table.
  - Metadata required: `type="listening_tier"`, `listeningSessionId`, `listeningTierId`, `userId`.

- **Submissions (Bookings):**
  - Updates `submissions` status to `paid` then auto-transitions to `pending_review`.
  - Creates `submission_distribution` rows if `selectedOutlets` provided.
  - Metadata required: `submissionId` OR `items` array with `id: "booking-{id}"`.

- **Slot Subscriptions:**
  - Creates/Upserts `slot_entitlements`.
  - Metadata required: `slotId`, `userId`.

### 2. `payment_intent.succeeded`
Triggered when a PaymentIntent has succeeded.

**Actions:**
- **Ledger Update:**
  - Upserts record in `payments` table.
  - Metadata mapped: `userId`, `submissionId`, `shipping_address`.

- **Quick Payments:**
  - Logs to `admin_actions` as `quick_payment_received`.
  - Metadata required: `type="quick_payment"`.

### 3. `customer.subscription.deleted`
Triggered when a subscription ends.

**Actions:**
- **Entitlement Revocation:**
  - Sets `is_active=false` in `slot_entitlements`.
  - Metadata required: `userId`, `slotId`.

## Metadata Schema

The following metadata fields are critical for proper routing:

| Field | Type | Description |
|-------|------|-------------|
| `userId` | UUID | Supabase User ID (Required for entitlements) |
| `type` | String | Discriminator: `merch`, `listening_tier`, `quick_payment` |
| `merchOrderId` | UUID | Links to `merch_orders` table |
| `submissionId` | UUID | Links to `submissions` table |
| `listeningSessionId`| UUID | Links to `listening_sessions` table |
| `listeningTierId` | UUID | Links to `listening_session_tiers` table |
| `slotId` | UUID | ID of the slot being subscribed to |
| `items` | JSON | Array of purchased items (for cart/mixed orders) |

## Ledger & Audit

All events are logged to the `commerce_events` table for audit purposes:
- `webhook_received`: Raw event payload.
- `entitlement_granted`: Outcome of the entitlement logic.
- `error`: Capture of any processing failures.

## Testing

Use the `scripts/validate-commerce-integrity.sql` script to verify data consistency after webhook execution.
