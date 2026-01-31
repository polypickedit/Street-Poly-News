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
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    match: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(tableResponses[table]?.single ?? { data: null, error: null }),
    insert: vi.fn().mockResolvedValue(tableResponses[table]?.insert ?? { error: null }),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockResolvedValue(tableResponses[table]?.upsert ?? { error: null }),
  };
  // Ensure .update().eq() works
  chain.update.mockReturnValue(chain);
  // Also ensure it resolves correctly if called as a promise
  Object.defineProperty(chain.eq, 'then', {
    value: (resolve: any) => resolve(tableResponses[table]?.update ?? { error: null })
  });
  Object.defineProperty(chain.match, 'then', {
    value: (resolve: any) => resolve(tableResponses[table]?.update ?? { error: null })
  });
  chain.eq.mockReturnValue({
    ...chain,
    catch: vi.fn().mockResolvedValue({ error: null })
  });
  chain.match.mockReturnValue({
    ...chain,
    catch: vi.fn().mockResolvedValue({ error: null })
  });
  return chain;
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

    expect(mockSupabase.from).toHaveBeenCalledWith("payments");
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
