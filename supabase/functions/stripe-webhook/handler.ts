import { getProductByPriceId } from "./pricing.ts";

export type StripeEventLike = {
  type: string;
  data: {
    object: Record<string, unknown>;
  };
};

export type SupabaseLikeClient = {
  from: (table: string) => {
    insert: (data: unknown) => {
      catch: (callback: (err: unknown) => void) => Promise<{ error: unknown }>;
    } & Promise<{ error: unknown }>;
    upsert: (data: unknown, options?: unknown) => {
      catch: (callback: (err: unknown) => void) => Promise<{ error: unknown }>;
    } & Promise<{ error: unknown }>;
    update: (data: unknown) => {
      eq: (column: string, value: unknown) => {
        catch: (callback: (err: unknown) => void) => Promise<{ error: unknown }>;
      } & Promise<{ error: unknown }>;
      match: (filter: unknown) => {
        catch: (callback: (err: unknown) => void) => Promise<{ error: unknown }>;
      } & Promise<{ error: unknown }>;
    };
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
    const submissionId = metadata?.["submissionId"] as string | undefined;
    const selectedOutlets = parseSelectedOutlets(metadata?.["selectedOutlets"]);
    const priceId = (session?.["amount_total"] ? (session as Record<string, any>).line_items?.data?.[0]?.price?.id : null) 
      || (event.data.object as Record<string, any>).price?.id 
      || (event.data.object as Record<string, any>).items?.data?.[0]?.price?.id;

    if (!userId) {
      console.warn("⚠️ Missing userId in webhook event, skipping...");
      return;
    }

    // 1. Grant Capabilities based on Product/Price ID
    if (priceId) {
      const product = getProductByPriceId(priceId);
      if (product) {
        console.log(`🔓 Granting capabilities for user ${userId}: ${product.grants.join(", ")}`);
        const capabilityRows = product.grants.map(cap => ({
          user_id: userId,
          capability: cap,
          granted_at: new Date().toISOString()
        }));

        await supabase.from("user_capabilities").insert(capabilityRows).catch((err: unknown) => {
          console.error("❌ Error granting capabilities:", err);
        });
      }
    }

    // 2. Legacy/Specific logic for submissions and slots
    const piId = typeof paymentIntent === "string" ? paymentIntent : Array.isArray(paymentIntent) ? String(paymentIntent[0]) : (paymentIntent as Record<string, unknown>)?.["id"];
    const amount = typeof session?.["amount_total"] === "number"
      ? session.amount_total
      : (event.data.object as Record<string, unknown>)["amount"];
    const currency = typeof session?.["currency"] === "string"
      ? session.currency
      : (event.data.object as Record<string, unknown>)["currency"];

    if (piId) {
      await supabase.from("payments").upsert({
        user_id: userId,
        submission_id: submissionId ?? null,
        stripe_payment_intent_id: piId,
        amount_cents: amount,
        currency: currency ?? "usd",
        status: "succeeded",
      }, { onConflict: "stripe_payment_intent_id" }).catch((err: unknown) => {
        console.error("❌ Error recording payment:", err);
      });
    }

    if (submissionId) {
      await supabase.from("submissions").update({
        payment_status: "paid",
        paid_at: new Date().toISOString(),
      }).eq("id", submissionId).catch((err: unknown) => {
        console.error("❌ Error updating submission payment status:", err);
      });

      if (selectedOutlets?.length) {
        const distributionRows = selectedOutlets.map((outletId) => ({
          submission_id: submissionId,
          outlet_id: outletId,
          status: "pending",
          paid: true,
        }));

        await supabase.from("submission_distribution").upsert(distributionRows, { onConflict: "submission_id,outlet_id" }).catch((err: unknown) => {
          console.error("❌ Error creating distribution rows:", err);
        });
      }
    }

    if (slotId) {
      await supabase.from("slot_entitlements").insert({
        user_id: userId,
        slot_id: slotId,
        source: session?.["mode"] === "subscription" ? "subscription" : "purchase",
        is_active: true,
        granted_at: new Date().toISOString(),
        expires_at: null,
      }).catch((err: unknown) => {
        console.error("❌ Error granting entitlement:", err);
      });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Record<string, any>;
    const userId = subscription.metadata?.userId as string | undefined;
    const slotId = subscription.metadata?.slotId as string | undefined;

    if (userId && slotId) {
      await supabase.from("slot_entitlements").update({ is_active: false }).match({ user_id: userId, slot_id: slotId }).catch((err: unknown) => {
        console.error("❌ Error revoking entitlement:", err);
      });
    }
  }
}

