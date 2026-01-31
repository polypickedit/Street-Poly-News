import { describe, expect, it, vi } from "vitest";
import { checkoutSessionCompleted, paymentIntentSucceeded } from "../helpers/stripe";
import { processStripeWebhookEvent } from "../../supabase/functions/stripe-webhook/handler";

const tableResponses = {
  accounts: { single: { data: { id: "account-id" }, error: null } },
  account_ledger: { insert: { error: null } },
  payments: { upsert: { error: null } },
  submission_distribution: { upsert: { error: null } },
  submissions: { update: { error: null } },
  slot_entitlements: { insert: { error: null } },
  admin_actions: { insert: { error: null } },
};

function buildChain(table: string) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    match: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(tableResponses[table]?.single ?? { data: null, error: null }),
    insert: vi.fn().mockResolvedValue(tableResponses[table]?.insert ?? { error: null }),
    update: vi.fn().mockResolvedValue(tableResponses[table]?.update ?? { error: null }),
    upsert: vi.fn().mockResolvedValue(tableResponses[table]?.upsert ?? { error: null }),
  };
}

function createMockSupabase() {
  const tableChains: Record<string, ReturnType<typeof buildChain>> = {};
  const predefinedTables = Object.keys(tableResponses);

  const from = vi.fn((table: string) => {
    if (!tableChains[table]) {
      tableChains[table] = buildChain(table);
    }
    return tableChains[table];
  });

  const auth = {
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: "admin-id" } }, error: null }),
  };

  return { from, auth, tableChains };
}

describe("Stripe webhook handler", () => {
  it("upserts payment, submission, distribution, and entitlement on checkout events", async () => {
    const mockSupabase = createMockSupabase();

    await processStripeWebhookEvent(checkoutSessionCompleted, mockSupabase as any);

    expect(mockSupabase.from).toHaveBeenCalledWith("accounts");
    expect(mockSupabase.tableChains.payments.upsert).toHaveBeenCalled();
    expect(mockSupabase.tableChains.submissions.update).toHaveBeenCalled();
    expect(mockSupabase.tableChains.submission_distribution.upsert).toHaveBeenCalled();
    expect(mockSupabase.tableChains.slot_entitlements.insert).toHaveBeenCalled();
  });

  it("handles payment_intent.succeeded events gracefully", async () => {
    const mockSupabase = createMockSupabase();

    await processStripeWebhookEvent(paymentIntentSucceeded, mockSupabase as any);

    expect(mockSupabase.tableChains.payments.upsert).toHaveBeenCalled();
  });
});
