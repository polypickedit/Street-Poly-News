export type StripeEventLike = {
  type: string;
  data: {
    object: Record<string, unknown>;
  };
};

export type SupabaseLikeClient = {
  from: (table: string) => {
    select: (...args: any[]) => any;
    eq: (...args: any[]) => any;
    order: (...args: any[]) => any;
    single: () => Promise<{ data: any; error: any }>;
    update: (...args: any[]) => { 
      eq: (...args: any[]) => Promise<{ error: any }>;
      match: (...args: any[]) => Promise<{ error: any }>;
    };
    insert: (...args: any[]) => Promise<{ error: any }>;
    upsert: (...args: any[]) => Promise<{ error: any }>;
    match: (...args: any[]) => any;
    onConflict: (...args: any[]) => any;
  };
  auth: {
    getUser: () => Promise<{ data: { user: { id: string } | null }; error: any }>;
  };
};

const parseSelectedOutlets = (value: unknown): string[] | undefined => {
  if (!value) return undefined;
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean).map(String);
      }
    } catch (_error) {
      return [value];
    }
    return [value];
  }
  return undefined;
};

export async function processStripeWebhookEvent(event: StripeEventLike, supabase: SupabaseLikeClient) {
  if (event.type === "checkout.session.completed" || event.type === "payment_intent.succeeded") {
    const session = event.type === "checkout.session.completed" ? event.data.object : null;
    const paymentIntent = event.type === "payment_intent.succeeded"
      ? event.data.object
      : (session?.["payment_intent"] as string | Record<string, unknown> | undefined);

    const metadata = (session?.["metadata"] ?? (event.data.object as Record<string, unknown>)["metadata"]) as Record<string, unknown>;

    const userId = metadata?.["userId"] as string | undefined;
    const slotId = metadata?.["slotId"] as string | undefined;
    const slotSlug = metadata?.["slotSlug"] as string | undefined;
    const submissionId = metadata?.["submissionId"] as string | undefined;
    const selectedOutlets = parseSelectedOutlets(metadata?.["selectedOutlets"]);
    const packId = metadata?.["packId"] as string | undefined;
    const creditAmount = metadata?.["creditAmount"] as string | undefined;
    const type = metadata?.["type"] as string | undefined;

    if (type === "credits") {
      if (!userId || !packId || !creditAmount) {
        console.warn("⚠️ Missing credit pack metadata in webhook event, skipping...");
        return;
      }

      console.log(`💳 Credit pack purchase detected for user ${userId}: ${creditAmount} credits`);

      const { data: account, error: accountError } = await supabase
        .from("accounts")
        .select("id")
        .eq("owner_user_id", userId)
        .single();

      if (accountError || !account) {
        console.error("❌ Error finding account for user:", accountError);
        return;
      }

      await supabase.from("account_ledger").insert({
        account_id: (account as Record<string, unknown>).id,
        amount: parseInt(creditAmount, 10),
        description: `Credit Pack Purchase: ${packId}`,
        transaction_type: "purchase",
        reference_id: session?.["id"] ?? (event.data.object as Record<string, unknown>)["id"],
      }).catch((err) => {
        console.error("❌ Error recording credit purchase in ledger:", err);
      });

      return;
    }

    if (!userId || !slotId) {
      console.warn("⚠️ Missing metadata in webhook event, skipping...");
      return;
    }

    const piId = typeof paymentIntent === "string" ? paymentIntent : Array.isArray(paymentIntent) ? String(paymentIntent[0]) : paymentIntent?.["id"];
    const amount = typeof session?.["amount_total"] === "number"
      ? session.amount_total
      : (event.data.object as Record<string, unknown>)["amount"];
    const currency = typeof session?.["currency"] === "string"
      ? session.currency
      : (event.data.object as Record<string, unknown>)["currency"];

    await supabase.from("payments").upsert({
      user_id: userId,
      submission_id: submissionId ?? null,
      stripe_payment_intent_id: piId,
      amount_cents: amount,
      currency: currency ?? "usd",
      status: "succeeded",
    }, { onConflict: "stripe_payment_intent_id" }).catch((err) => {
      console.error("❌ Error recording payment:", err);
    });

    if (submissionId) {
      await supabase.from("submissions").update({
        payment_status: "paid",
        paid_at: new Date().toISOString(),
      }).eq("id", submissionId).catch((err) => {
        console.error("❌ Error updating submission payment status:", err);
      });

      if (selectedOutlets?.length) {
        const distributionRows = selectedOutlets.map((outletId) => ({
          submission_id: submissionId,
          outlet_id: outletId,
          status: "pending",
          paid: true,
        }));

        await supabase.from("submission_distribution").upsert(distributionRows, { onConflict: "submission_id,outlet_id" }).catch((err) => {
          console.error("❌ Error creating distribution rows:", err);
        });
      }
    }

    await supabase.from("slot_entitlements").insert({
      user_id: userId,
      slot_id: slotId,
      source: session?.["mode"] === "subscription" ? "subscription" : "purchase",
      is_active: true,
      granted_at: new Date().toISOString(),
      expires_at: null,
    }).catch((err) => {
      console.error("❌ Error granting entitlement:", err);
    });
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as any;
    const userId = subscription.metadata?.userId as string | undefined;
    const slotId = subscription.metadata?.slotId as string | undefined;

    if (userId && slotId) {
      await supabase.from("slot_entitlements").update({ is_active: false }).match({ user_id: userId, slot_id: slotId }).catch((err) => {
        console.error("❌ Error revoking entitlement:", err);
      });
    }
  }
}
