/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from "vitest";
import { checkoutSessionCompleted, paymentIntentSucceeded } from "../helpers/stripe";
import { processStripeWebhookEvent } from "../../supabase/functions/stripe-webhook/handler";

const tableResponses: Record<string, any> = {
  accounts: { single: { data: { id: "account-id" }, error: null } },
  account_ledger: { insert: { error: null } },
  payments: { upsert: { error: null } },
  submission_distribution: { upsert: { error: null } },
  submissions: { update: { error: null } },
  slot_entitlements: { insert: { error: null } },
  admin_actions: { insert: { error: null } },
  user_capabilities: { insert: { error: null } },
};

function buildChain(table: string) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    match: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(tableResponses[table]?.single ?? { data: null, error: null }),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockResolvedValue(tableResponses[table]?.upsert ?? { error: null }),
  };
  
  // Ensure common methods work as promises or chains
  const _promiseResult = (resp: any) => Promise.resolve(resp ?? { error: null });

  chain.insert.mockImplementation(() => {
    const insertChain = {
      catch: vi.fn().mockResolvedValue({ error: null }),
      then: (resolve: (value: any) => void) => resolve(tableResponses[table]?.insert ?? { error: null })
    };
    return insertChain;
  });

  // Ensure .update().eq() works
  chain.update.mockReturnValue(chain);
  
  // Also ensure it resolves correctly if called as a promise
  Object.defineProperty(chain.eq, 'then', {
    value: (resolve: (value: any) => void) => resolve(tableResponses[table]?.update ?? { error: null })
  });
  Object.defineProperty(chain.match, 'then', {
    value: (resolve: (value: any) => void) => resolve(tableResponses[table]?.update ?? { error: null })
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
  const tableChains: Record<string, any> = {};

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
  });

  it("grants user capabilities on checkout session completion", async () => {
    const mockSupabase = createMockSupabase();

    await processStripeWebhookEvent(checkoutSessionCompleted, mockSupabase as any);

    expect(mockSupabase.from).toHaveBeenCalledWith("user_capabilities");
    expect(mockSupabase.tableChains.user_capabilities.insert).toHaveBeenCalled();
  });

  it("handles payment_intent.succeeded events gracefully", async () => {
    const mockSupabase = createMockSupabase();

    await processStripeWebhookEvent(paymentIntentSucceeded, mockSupabase as any);

    expect(mockSupabase.tableChains.payments.upsert).toHaveBeenCalled();
  });
});
