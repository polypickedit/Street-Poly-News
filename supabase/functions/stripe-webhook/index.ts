import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import Stripe from "https://esm.sh/stripe@13.10.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  try {
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      endpointSecret
    );

    console.log(`🔔 Webhook received: ${event.type}`);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const { userId, slotId, slotSlug } = session.metadata || {};

      if (!userId || !slotId) {
        console.error("❌ Missing metadata in checkout session");
        return new Response("Missing metadata", { status: 400 });
      }

      // 1. Grant entitlement
      const { error: entitlementError } = await supabase
        .from("slot_entitlements")
        .insert({
          user_id: userId,
          slot_id: slotId,
          source: session.mode === "subscription" ? "subscription" : "purchase",
          is_active: true,
          granted_at: new Date().toISOString(),
          // For subscriptions, we might set expires_at based on the period
          // For one-time purchases, it might be null (forever)
          expires_at: null, 
        });

      if (entitlementError) {
        console.error("❌ Error granting entitlement:", entitlementError);
        return new Response("Database error", { status: 500 });
      }

      console.log(`✅ Entitlement granted to user ${userId} for slot ${slotSlug}`);
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata.userId;
      const slotId = subscription.metadata.slotId;

      if (userId && slotId) {
        // Revoke entitlement
        const { error: revokeError } = await supabase
          .from("slot_entitlements")
          .update({ is_active: false })
          .match({ user_id: userId, slot_id: slotId });

        if (revokeError) {
          console.error("❌ Error revoking entitlement:", revokeError);
        } else {
          console.log(`🚫 Entitlement revoked for user ${userId} on slot ${slotId}`);
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error(`❌ Webhook Error: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});
