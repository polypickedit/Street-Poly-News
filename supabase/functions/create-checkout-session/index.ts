import { serve } from "std/server";
import Stripe from "stripe";
import { createClient } from "supabase";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { 
      slotId, 
      slotSlug, 
      userId, 
      userEmail, 
      returnUrl, 
      submissionId, 
      selectedOutlets,
      type = 'slot', // default type
      packId, // for credits
      amount, // for quick payment
      description, // for quick payment
    } = await req.json();

    // 1. Initialize Supabase Client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let lineItems: any[] = [];
    let mode: "payment" | "subscription" = "payment";
    let metadata: Record<string, string> = {
      userId: userId || "",
      type: type || "",
    };

    if (type === 'credits') {
      // Fetch credit pack details
      const { data: pack, error: packError } = await supabaseClient
        .from("credit_packs")
        .select("*")
        .eq("id", packId)
        .single();

      if (packError || !pack) throw new Error("Credit pack not found");

      lineItems = [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: pack.name,
              description: pack.description || `${pack.credit_amount} Distribution Credits`,
            },
            unit_amount: pack.price_cents,
          },
          quantity: 1,
        },
      ];
      
      metadata = {
        ...metadata,
        packId: packId || "",
        creditAmount: pack.credit_amount.toString(),
      };

    } else if (type === 'quick_payment') {
      if (!amount || amount <= 0) throw new Error("Invalid amount for quick payment");

      lineItems = [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: description || "Quick Payment",
              description: "Custom service or offline item payment",
            },
            unit_amount: Math.round(amount * 100), // convert to cents
          },
          quantity: 1,
        },
      ];

      metadata = {
        ...metadata,
        description: description || "Quick Payment",
        amount: amount.toString(),
      };

    } else {
      // Fetch slot details
      const { data: slot, error: slotError } = await supabaseClient
        .from("slots")
        .select("*")
        .eq("id", slotId)
        .single();

      if (slotError || !slot) throw new Error("Slot not found");

      lineItems = [
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
      ];

      mode = slot.monetization_model === "subscription" ? "subscription" : "payment";
      
      metadata = {
        ...metadata,
        slotId: slotId || "",
        slotSlug: slotSlug || "",
        submissionId: submissionId || "",
        selectedOutlets: selectedOutlets ? selectedOutlets.join(",") : "",
      };

      if (selectedOutlets && selectedOutlets.length > 0) {
        const { data: outlets, error: outletsError } = await supabaseClient
          .from("media_outlets")
          .select("*")
          .in("id", selectedOutlets);

        if (outletsError) throw outletsError;

        for (const outlet of (outlets || [])) {
          if (outlet.price_cents > 0) {
            lineItems.push({
              price_data: {
                currency: "usd",
                product_data: {
                  name: `Syndication: ${outlet.name}`,
                  description: outlet.description || undefined,
                },
                unit_amount: outlet.price_cents,
              },
              quantity: 1,
            });
          }
        }
      }
    }

    // 4. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      line_items: lineItems,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mode: mode as any,
      success_url: returnUrl,
      cancel_url: returnUrl,
      payment_intent_data: mode === "payment" ? {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata: metadata as any,
      } : undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      metadata: metadata as any,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
