import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.18.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2022-11-15",
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { slotId, slotSlug, userId, userEmail, returnUrl } = await req.json();

    // 1. Fetch slot details from Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: slot, error: slotError } = await supabaseClient
      .from("slots")
      .select("*")
      .eq("id", slotId)
      .single();

    if (slotError || !slot) throw new Error("Slot not found");

    // 2. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: slot.name,
              description: slot.description || undefined,
            },
            unit_amount: Math.round(slot.price * 100), // convert to cents
            recurring: slot.monetization_model === "subscription" 
              ? { interval: slot.billing_interval || "month" } 
              : undefined,
          },
          quantity: 1,
        },
      ],
      mode: slot.monetization_model === "subscription" ? "subscription" : "payment",
      success_url: returnUrl,
      cancel_url: returnUrl,
      metadata: {
        userId,
        slotId,
        slotSlug,
      },
    });

    return new Response(JSON.stringify({ sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
