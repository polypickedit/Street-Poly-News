
import { describe, expect, it, vi } from "vitest";
import { processStripeWebhookEvent } from "../../supabase/functions/stripe-webhook/handler";

// Mock event
const merchEvent = {
  id: "evt_merch_123",
  type: "checkout.session.completed",
  data: {
    object: {
      id: "cs_merch_123",
      amount_total: 1000,
      currency: "usd",
      payment_status: "paid",
      metadata: {
        merchOrderId: "order_123",
        userId: "user_123",
        type: "merch"
      },
      customer_details: { email: "test@example.com" }
    }
  }
};

describe("Merch Webhook Handler", () => {
  it("grants entitlements for paid merch orders", async () => {
    // Setup Mock Supabase
    const mockSupabase = {
      from: vi.fn(),
      rpc: vi.fn().mockResolvedValue({ error: null })
    };

    // Chain mocks
    const merchOrdersChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null })
    };

    const merchOrderItemsChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockResolvedValue({ 
        data: [
          { product_id: "prod_A", products: { entitlement_key: "key_A" } },
          { product_id: "prod_B", products: { entitlement_key: "key_B" } }
        ], 
        error: null 
      })
    };

    const userEntitlementsChain = {
      upsert: vi.fn().mockResolvedValue({ error: null })
    };

    const commerceEventsChain = {
      upsert: vi.fn().mockResolvedValue({ error: null })
    };

    // Wire up the mocks
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "merch_orders") return merchOrdersChain;
      if (table === "merch_order_items") return merchOrderItemsChain;
      if (table === "user_entitlements") return userEntitlementsChain;
      if (table === "commerce_events") return commerceEventsChain;
      return {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        match: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: {}, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null })
      };
    });

    // Run Handler
    await processStripeWebhookEvent(
      merchEvent,
      mockSupabase as unknown as Parameters<typeof processStripeWebhookEvent>[1]
    );

    // Verify
    // 1. Check merch_orders update
    expect(mockSupabase.from).toHaveBeenCalledWith("merch_orders");
    expect(merchOrdersChain.update).toHaveBeenCalledWith(expect.objectContaining({
      status: "paid",
      stripe_session_id: "cs_merch_123"
    }));
    expect(merchOrdersChain.eq).toHaveBeenCalledWith("id", "order_123");

    // 2. Check merch_order_items fetch
    expect(mockSupabase.from).toHaveBeenCalledWith("merch_order_items");
    expect(merchOrderItemsChain.eq).toHaveBeenCalledWith("order_id", "order_123");
    expect(merchOrderItemsChain.not).toHaveBeenCalledWith("product_id", "is", null);

    // 3. Check user_entitlements upsert
    expect(mockSupabase.from).toHaveBeenCalledWith("user_entitlements");
    expect(userEntitlementsChain.upsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          user_id: "user_123",
          product_id: "prod_A",
          entitlement_key: "key_A",
          is_active: true
        }),
        expect.objectContaining({
          user_id: "user_123",
          product_id: "prod_B",
          entitlement_key: "key_B",
          is_active: true
        })
      ]),
      expect.any(Object)
    );
  });
});
