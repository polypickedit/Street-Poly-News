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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("Missing Authorization header");
      throw new Error("Authentication required");
    }

    const body = await req.json();
    console.log("Request received with body:", JSON.stringify(body));

    const { 
      slotId, 
      slotSlug, 
      listeningSessionId,
      listeningTierId,
      userId: _userId, 
      userEmail, 
      returnUrl, 
      submissionId, 
      selectedOutlets,
      type = 'slot', // default type
      packId, // for credits
      amount, // for quick payment
      description, // for quick payment
      items, // for merch
      shippingAddress,
      contactMethod,
      contactValue
    } = body;

    console.log(`Processing checkout type: ${type} for user: ${userEmail}`);

    // 1. Initialize Supabase Client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase environment variables");
      throw new Error("Server configuration error: Missing Supabase keys");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // 1.5 Verify Auth Session
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      console.error("Auth error:", authError);
      throw new Error("Invalid session. Please sign in again.");
    }

    // Use the verified user ID and email
    const verifiedUserId = user.id;
    const verifiedUserEmail = user.email;

    // Strict check: if a submissionId is provided, verify it belongs to this user
    if (submissionId) {
      const { data: submission, error: subError } = await supabaseClient
        .from("submissions")
        .select("user_id")
        .eq("id", submissionId)
        .single();
      
      if (subError || !submission) {
        throw new Error("Submission not found");
      }
      
      if (submission.user_id !== verifiedUserId) {
        throw new Error("Unauthorized: This submission belongs to another user");
      }
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
    console.log(`Stripe Key status: ${stripeKey ? 'Present (starts with ' + stripeKey.substring(0, 7) + '...)' : 'MISSING'}`);
    if (!stripeKey) {
      console.error("Missing STRIPE_SECRET_KEY");
      throw new Error("Server configuration error: Missing Stripe key");
    }

    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let mode: "payment" | "subscription" = "payment";
    let metadata: Record<string, string> = {
      userId: verifiedUserId,
      type: type || "",
    };
    let merchOrderId: string | null = null;

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
            unit_amount: Math.round((Number(amount) || 0) * 100), // convert to cents
          },
          quantity: 1,
        },
      ];

      metadata = {
        ...metadata,
        description: description || "Quick Payment",
        amount: amount.toString(),
      };

    } else if (type === 'merch') {
      console.log("Merch checkout items:", JSON.stringify(items));
      if (!items || !Array.isArray(items) || items.length === 0) {
        throw new Error("No items provided for merch checkout");
      }

      interface MerchItem {
        id: string | number;
        name: string;
        price: number;
        quantity: number;
        image?: string;
        size?: string;
        color?: string;
      }

      // Extract IDs to fetch trusted prices
      // Handle both numeric and string IDs (some might be "booking-uuid")
      const productIds = (items as MerchItem[])
        .filter(i => typeof i.id === 'string' && !i.id.startsWith('booking-'))
        .map(i => i.id);

      // Fetch products from DB to get trusted prices
      interface DbProduct {
        id: string | number;
        price: number;
        title: string;
        status: string;
      }

      let dbProducts: DbProduct[] = [];
      if (productIds.length > 0) {
        const { data, error } = await supabaseClient
          .from('products')
          .select('id, price, title, status')
          .in('id', productIds)
          .eq('status', 'active');
        
        if (error) {
          console.error("Error fetching products for price verification:", error);
          throw new Error("Failed to verify product prices");
        }
        dbProducts = data || [];
      }

      const normalizedItems = (items as MerchItem[]).map((item) => {
        let unitAmount = 0;
        let itemName = item.name;

        // If it's a booking, we trust the client for now (legacy) or should we verify booking price?
        // Ideally we verify booking price too, but let's stick to products table for now.
        // The booking logic is complex and might be handled separately.
        // For now, if it's NOT a booking, we enforce DB price.
        if (typeof item.id === 'string' && item.id.startsWith('booking-')) {
           unitAmount = Math.round((typeof item.price === 'number' ? item.price : parseFloat(String(item.price || 0))) * 100);
        } else {
           // Find the product in DB results
           const dbProduct = dbProducts.find(p => String(p.id) === String(item.id));
           if (!dbProduct) {
             console.error(`Product not found or inactive: ${item.id}`);
             throw new Error(`Product ${item.name} is not available`);
           }
           // Trust the DB price (it's in cents)
           unitAmount = dbProduct.price;
           itemName = dbProduct.title; // Use official title
        }

        const quantity = item.quantity || 1;

        // Ensure images is only populated with valid absolute URLs
        const images: string[] = [];
        if (item.image && typeof item.image === 'string' && item.image.startsWith('http')) {
          images.push(item.image);
        }

        return {
          item: { ...item, name: itemName }, // Use trusted name
          unitAmount,
          quantity,
          images,
        };
      });

      lineItems = normalizedItems.map(({ item, unitAmount, quantity, images }) => {
        console.log(`Processing item: ${item.name}, Price: ${item.price}, Qty: ${quantity}`);
        return {
          price_data: {
            currency: "usd",
            product_data: {
              name: item.name,
              images: images.length > 0 ? images : undefined,
            },
            unit_amount: unitAmount,
          },
          quantity,
        };
      });

      const totalAmount = normalizedItems.reduce((sum, current) => sum + current.unitAmount * current.quantity, 0);

      const { data: merchOrder, error: merchOrderError } = await supabaseClient
        .from('merch_orders')
        .insert({
          user_id: verifiedUserId,
          contact_email: verifiedUserEmail || null,
          contact_phone: contactMethod === 'phone' ? contactValue || null : null,
          shipping_address: shippingAddress || null,
          preferred_contact_method: contactMethod || null,
          preferred_contact_value: contactValue || null,
          status: 'pending',
          total_amount_cents: totalAmount,
          currency: 'usd',
        })
        .select('id')
        .single();

      if (merchOrderError || !merchOrder) {
        console.error('Failed to create merch order:', merchOrderError);
        throw new Error('Failed to create merch order');
      }

      merchOrderId = merchOrder.id;
      const orderItemsPayload = normalizedItems.map(({ item, unitAmount, quantity }) => ({
        order_id: merchOrderId,
        item_name: item.name,
        size: item.size || null,
        color: item.color || null,
        quantity,
        price_cents: unitAmount,
        product_id: (typeof item.id === 'string' && !item.id.startsWith('booking-')) ? item.id : null,
      }));

      const { error: orderItemsError } = await supabaseClient.from('merch_order_items').insert(orderItemsPayload);
      if (orderItemsError) {
        console.error('Failed to insert merch order items:', orderItemsError);
        throw orderItemsError;
      }

      metadata = {
        ...metadata,
        items: JSON.stringify(items.map((i: MerchItem) => ({ id: i.id, q: i.quantity }))),
        shippingAddress: shippingAddress || '',
        contactMethod: contactMethod || '',
        contactValue: contactValue || '',
        merchOrderId: merchOrderId || '',
      };

      // Promotion: if there's exactly one booking in the cart, promote its ID to top-level metadata
      // for easier processing in simple webhook handlers.
      const bookingItems = items.filter((i: MerchItem) => typeof i.id === 'string' && i.id.startsWith('booking-'));
      if (bookingItems.length === 1) {
        metadata.submissionId = (bookingItems[0].id as string).replace('booking-', '');
      }
    } else if (type === "listening_tier") {
      if (!listeningSessionId || !listeningTierId) {
        throw new Error("Missing listening session or tier");
      }

      const { data: listeningSession, error: sessionError } = await supabaseClient
        .from("listening_sessions")
        .select("id, title, status, scheduled_at")
        .eq("id", listeningSessionId)
        .single();

      if (sessionError || !listeningSession) {
        throw new Error("Listening session not found");
      }

      if (listeningSession.status !== "open") {
        throw new Error("Listening session is not accepting submissions");
      }

      const { data: listeningTier, error: tierError } = await supabaseClient
        .from("listening_session_tiers")
        .select("id, tier_name, price_cents, description, slot_limit, slots_filled, manually_closed")
        .eq("id", listeningTierId)
        .eq("session_id", listeningSessionId)
        .single();

      if (tierError || !listeningTier) {
        throw new Error("Listening tier not found");
      }

      if (listeningTier.manually_closed) {
        throw new Error("This tier is currently closed");
      }

      if ((listeningTier.slots_filled || 0) >= listeningTier.slot_limit) {
        throw new Error("This tier is sold out");
      }

      lineItems = [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${listeningSession.title} - ${listeningTier.tier_name}`,
              description: listeningTier.description || undefined,
            },
            unit_amount: listeningTier.price_cents,
          },
          quantity: 1,
        },
      ];

      mode = "payment";
      metadata = {
        ...metadata,
        listeningSessionId,
        listeningTierId,
      };
    } else {
      // Fetch slot details
      const { data: slot, error: slotError } = await supabaseClient
        .from("slots")
        .select("*")
        .eq("id", slotId)
        .single();

      if (slotError || !slot) throw new Error("Slot not found");

      // Verify slot slug matches for extra integrity
      if (slot.slug !== slotSlug) {
        console.warn(`Mismatch: Requested slug ${slotSlug} but slot ${slotId} has slug ${slot.slug}`);
      }

      lineItems = [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: slot.name,
              description: slot.description || undefined,
            },
            unit_amount: Math.round((Number(slot.price) || 0) * 100), // convert to cents (Server-side price authority)
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
                unit_amount: outlet.price_cents, // Server-side price authority
              },
              quantity: 1,
            });
          }
        }
      }

      // Add payment link metadata if it's a subscription mode to help with success page
      if (mode === "subscription") {
        metadata.is_subscription = "true";
      }
    }

    // 4. Log Commerce Event (Ledger) - PRE-CREATION
    // We create a record of intent before calling Stripe to ensure we have a trace even if Stripe fails
    let commerceEventId: string | null = null;
    try {
      const { data: eventData, error: eventError } = await supabaseClient.from("commerce_events").insert({
        user_id: verifiedUserId || null,
        stripe_session_id: null, // Will be updated after creation
        type: "checkout_intent",
        status: "initializing",
        amount_total: lineItems.reduce((sum, item) => sum + (item.price_data?.unit_amount || 0) * (item.quantity || 1), 0),
        currency: lineItems[0]?.price_data?.currency || 'usd',
        metadata: metadata,
        raw_payload: { line_items: lineItems, mode },
      }).select('id').single();

      if (eventError) {
        console.error("Failed to log commerce event intent:", eventError);
      } else {
        commerceEventId = eventData.id;
        console.log("Logged commerce event intent:", commerceEventId);
      }
    } catch (logError) {
      console.error("Failed to log commerce event intent (exception):", logError);
    }

    // 5. Create Stripe Checkout Session
    console.log("Creating Stripe session with lineItems:", JSON.stringify(lineItems));
    console.log("Metadata:", JSON.stringify(metadata));

    let session;
    try {
      session = await stripe.checkout.sessions.create({
        customer_email: verifiedUserEmail || undefined,
        line_items: lineItems,
        mode: mode,
        allow_promotion_codes: true,
        shipping_address_collection: {
          allowed_countries: ["US", "CA", "GB"], // Add more as needed
        },
        billing_address_collection: 'required',
        phone_number_collection: {
          enabled: true,
        },
        success_url: `${returnUrl || (req.headers.get("origin") + "/booking")}?session_id={CHECKOUT_SESSION_ID}&submissionId=${submissionId || ""}&slotType=${type}${slotSlug ? `&slot=${slotSlug}` : ""}${listeningSessionId ? `&listeningSessionId=${listeningSessionId}` : ""}${listeningTierId ? `&listeningTierId=${listeningTierId}` : ""}`,
        cancel_url: `${req.headers.get("origin")}/booking?status=cancelled`,
        payment_intent_data: mode === "payment" ? {
          metadata: metadata,
        } : undefined,
        metadata: {
          ...metadata,
          commerceEventId: commerceEventId || "", // Link back to our ledger
        },
      });
    } catch (stripeError) {
      const err = stripeError as Error & { message?: string };
      console.error("Stripe Session Creation Error:", err);
      
      // Update ledger to failed
      if (commerceEventId) {
        await supabaseClient.from("commerce_events").update({
          status: 'failed',
          metadata: { ...metadata, error: err.message }
        }).eq('id', commerceEventId);
      }

      throw new Error(`Stripe error: ${err.message || "Unknown Stripe error"}`);
    }

    console.log("Stripe session created successfully:", session.id);

    // 6. Update Ledger with Session ID
    if (commerceEventId) {
      try {
        await supabaseClient.from("commerce_events").update({
          stripe_session_id: session.id,
          status: 'pending', // Now waiting for webhook
          type: 'checkout_created', // Upgrade type
          raw_payload: session
        }).eq('id', commerceEventId);
      } catch (updateError) {
        console.error("Failed to update commerce event with session ID:", updateError);
      }
    } else {
      // Fallback: If intent creation failed, try to insert now (legacy behavior)
      try {
        await supabaseClient.from("commerce_events").insert({
          user_id: verifiedUserId || null,
          stripe_session_id: session.id,
          type: "checkout_created",
          status: "pending",
          amount_total: session.amount_total,
          currency: session.currency,
          metadata: metadata,
          raw_payload: session,
        });
      } catch (logError) {
        console.error("Failed to log commerce event (fallback):", logError);
      }
    }

    if (merchOrderId) {
      try {
        await supabaseClient.from('merch_orders').update({
          stripe_session_id: session.id,
          currency: session.currency ?? 'usd'
        }).eq('id', merchOrderId);
      } catch (orderUpdateError) {
        console.error('Failed to update merch order session ID:', orderUpdateError);
      }
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Error creating checkout session:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
