export type StripeEventLike = {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
};

const parseSelectedOutlets = (value: unknown): string[] | undefined => {
  if (!value) return undefined;
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === "string") {
    // Try parsing as JSON first (for legacy or complex arrays)
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean).map(String);
      }
    } catch (_error) {
      // If not JSON, check if it's a comma-separated list
      if (value.includes(",")) {
        return value.split(",").filter(Boolean).map(s => s.trim());
      }
    }
    return [value];
  }
  return undefined;
};

// deno-lint-ignore no-explicit-any
export async function processStripeWebhookEvent(event: StripeEventLike, supabase: any) {
  const metadata = (event.data.object as Record<string, unknown>)["metadata"] as Record<string, unknown>;
  const userId = metadata?.["userId"] as string | undefined;
  const stripeSessionId = (event.data.object as Record<string, unknown>)["id"] as string | undefined;

  // 0. Log Webhook Received (Ledger)
  try {
    const object = event.data.object as Record<string, unknown>;
    // Upsert to handle retries idempotently
    await supabase.from("commerce_events").upsert({
      stripe_event_id: event.id,
      type: "webhook_received",
      user_id: userId || null,
      stripe_session_id: stripeSessionId,
      status: "completed",
      amount_total: object["amount_total"] || object["amount"],
      currency: object["currency"],
      metadata: metadata,
      raw_payload: event,
    }, { onConflict: "stripe_event_id,type" });
  } catch (logError) {
    console.error("Failed to log webhook_received event:", logError);
  }

  if (event.type === "checkout.session.completed" || event.type === "payment_intent.succeeded") {
    const session = event.type === "checkout.session.completed" ? event.data.object : null;
    const paymentIntent = event.type === "payment_intent.succeeded"
      ? event.data.object
      : (session?.["payment_intent"] as string | Record<string, unknown> | undefined);

    const slotId = metadata?.["slotId"] as string | undefined;
    const submissionId = metadata?.["submissionId"] as string | undefined;
    const type = metadata?.["type"] as string | undefined;
    const description = metadata?.["description"] as string | undefined;
    const amountMetadata = metadata?.["amount"] as string | undefined;
    const selectedOutlets = parseSelectedOutlets(metadata?.["selectedOutlets"]);
    const merchOrderId = metadata?.["merchOrderId"] as string | undefined;
    const listeningSessionId = metadata?.["listeningSessionId"] as string | undefined;
    const listeningTierId = metadata?.["listeningTierId"] as string | undefined;

    // For anonymous checkouts, userId might be missing.
    // We only enforce userId for specific payment types that require account association.
    if (!userId) {
      console.warn("⚠️ No userId in metadata. Proceeding as anonymous checkout.");
    }

    const shipping = session?.["shipping_details"] as Record<string, unknown> | undefined;
    const customerDetails = session?.["customer_details"] as Record<string, unknown> | undefined;
    const shippingAddressObj = shipping?.["address"] as Record<string, unknown> | undefined;

    // Format shipping address as a single string for the database
    let shippingAddressString = "";
    if (shippingAddressObj) {
      const line1 = shippingAddressObj["line1"] || "";
      const line2 = shippingAddressObj["line2"] || "";
      const city = shippingAddressObj["city"] || "";
      const state = shippingAddressObj["state"] || "";
      const postalCode = shippingAddressObj["postal_code"] || "";
      const country = shippingAddressObj["country"] || "";
      
      shippingAddressString = `${shipping?.["name"] || ""}\n${line1}${line2 ? `, ${line2}` : ""}\n${city}, ${state} ${postalCode}\n${country}`;
    }

    // 1. Legacy/Specific logic for submissions and slots
    const piId = typeof paymentIntent === "string" ? paymentIntent : Array.isArray(paymentIntent) ? String(paymentIntent[0]) : (paymentIntent as Record<string, unknown>)?.["id"];
    const amount = typeof session?.["amount_total"] === "number"
      ? session.amount_total
      : (event.data.object as Record<string, unknown>)["amount"];
    const currency = typeof session?.["currency"] === "string"
      ? session.currency
      : (event.data.object as Record<string, unknown>)["currency"];
    const paymentStatus = typeof session?.["payment_status"] === "string"
      ? session.payment_status
      : (event.data.object as Record<string, unknown>)["payment_status"] as string | undefined;

    let processingError = null;
    let paymentRecordId: string | null = null;

    try {
      if (piId) {
        // Idempotent payment recording
        const { data: paymentRow, error: payError } = await supabase.from("payments").upsert({
          user_id: userId || null,
          submission_id: submissionId ?? null,
          stripe_payment_intent_id: piId,
          amount_cents: amount,
          currency: currency ?? "usd",
          status: "succeeded",
          metadata: {
            ...metadata,
            shipping_name: shipping?.["name"],
            shipping_address: shippingAddressObj,
            customer_phone: customerDetails?.["phone"],
            customer_email: customerDetails?.["email"]
          }
        }, { onConflict: "stripe_payment_intent_id" }).select("id").single();
        
        if (payError) {
          console.error("❌ Error recording payment:", payError);
          processingError = payError;
        } else {
          paymentRecordId = paymentRow?.id || null;
        }
      }

      if (type === "listening_tier" && userId && listeningSessionId && listeningTierId && stripeSessionId) {
        const { data: purchaseId, error: purchaseError } = await supabase.rpc("record_listening_tier_purchase", {
          p_user_id: userId,
          p_session_id: listeningSessionId,
          p_tier_id: listeningTierId,
          p_stripe_session_id: stripeSessionId,
          p_status: "paid"
        });

        if (purchaseError) {
          console.error("❌ Error recording listening tier purchase:", purchaseError);
          processingError = purchaseError;
        } else if (purchaseId && paymentRecordId) {
          const { error: purchaseLinkError } = await supabase
            .from("listening_session_purchases")
            .update({
              payment_id: paymentRecordId,
              status: "paid",
              paid_at: new Date().toISOString(),
            })
            .eq("id", purchaseId);

          if (purchaseLinkError) {
            console.error("❌ Error linking payment to listening purchase:", purchaseLinkError);
            processingError = purchaseLinkError;
          }
        }
      }

      if (submissionId) {
        // 1. Move to paid (This will update status to 'paid')
        const { error: paidError } = await supabase.rpc("update_submission_status", {
          p_submission_id: submissionId,
          p_new_status: "paid",
          p_user_id: userId || null, // Allow null for system/anon transitions
          p_reason: "Stripe payment confirmation"
        });

        if (paidError) {
          console.error("❌ Error updating submission to 'paid':", paidError);
          processingError = paidError;
        } else {
          // 2. Auto-transition to pending_review
          const { error: reviewError } = await supabase.rpc("update_submission_status", {
            p_submission_id: submissionId,
            p_new_status: "pending_review",
            p_user_id: userId || null,
            p_reason: "Auto-transition after payment"
          });
          
          if (reviewError) {
            console.error("❌ Error auto-transitioning to 'pending_review':", reviewError);
            processingError = reviewError;
          }
        }

        // 3. Update specific payment fields
        await supabase.from("submissions").update({
          payment_status: "paid",
          paid_at: new Date().toISOString(),
        }).eq("id", submissionId);
        
        if (selectedOutlets?.length) {
          const distributionRows = selectedOutlets.map((outletId: string) => ({
            submission_id: submissionId,
            outlet_id: outletId,
            status: "pending",
            paid: true,
          }));

          const { error: distError } = await supabase.from("submission_distribution").upsert(distributionRows, { onConflict: "submission_id,outlet_id" });
          if (distError) {
            console.error("❌ Error creating distribution rows:", distError);
            processingError = distError;
          }
        }
      }

      if (slotId) {
        const { error: slotError } = await supabase.from("slot_entitlements").upsert({
          user_id: userId,
          slot_id: slotId,
          source: session?.["mode"] === "subscription" ? "subscription" : "purchase",
          is_active: true,
          granted_at: new Date().toISOString(),
          expires_at: null,
        }, { onConflict: "user_id,slot_id" });
        
        if (slotError) {
          console.error("❌ Error granting entitlement:", slotError);
          processingError = slotError;
        }
      }

      // 3. Handle Quick Payments
      if (type === "quick_payment") {
        // Idempotency check for quick payments
        const { data: existingAction } = await supabase
          .from("admin_actions")
          .select("id")
          .eq("action_type", "quick_payment_received")
          .eq("metadata->>payment_intent_id", piId)
          .maybeSingle();

        if (!existingAction) {
          const { error: logError } = await supabase.from("admin_actions").insert({
            admin_user_id: userId, // In this context, userId is the payer
            action_type: "quick_payment_received",
            target_type: "payment",
            target_id: piId,
            metadata: {
              amount: amountMetadata || (typeof amount === "number" ? (amount / 100).toString() : "0"),
              description: description || "Quick Payment",
              payment_intent_id: piId,
            }
          });

          if (logError) {
            console.error("❌ Error logging quick payment:", logError);
            processingError = logError;
          }
        }
      }

      // 4. Handle Merch / Cart Items (including multiple bookings)
      if (type === "merch" || metadata?.["items"]) {
        try {
          const items = JSON.parse((metadata?.["items"] as string) || "[]");
          for (const item of items) {
            const itemId = String(item.id);
            if (itemId.startsWith("booking-")) {
              const bSubmissionId = itemId.replace("booking-", "");
              
              // Mark submission as paid
              await supabase.rpc("update_submission_status", {
                p_submission_id: bSubmissionId,
                p_new_status: "paid",
                p_user_id: userId || null,
                p_reason: "Stripe cart payment confirmation"
              });

              // Auto-transition to pending_review
              await supabase.rpc("update_submission_status", {
                p_submission_id: bSubmissionId,
                p_new_status: "pending_review",
                p_user_id: userId || null,
                p_reason: "Auto-transition after cart payment"
              });

              await supabase.from("submissions").update({
                payment_status: "paid",
                paid_at: new Date().toISOString(),
              }).eq("id", bSubmissionId);

              console.log(`✅ Marked cart-booked submission ${bSubmissionId} as paid`);
            }
          }
        } catch (err) {
          console.error("❌ Error processing merch items in webhook:", err);
          processingError = err;
        }
      }

      if (merchOrderId) {
        const { error: merchOrderError } = await supabase.from("merch_orders").update({
          status: paymentStatus === "paid" ? "paid" : "pending",
          stripe_session_id: session?.id ?? stripeSessionId,
          stripe_payment_intent_id: piId ?? undefined,
          currency: currency ?? "usd",
          shipping_address: shippingAddressString || undefined,
          contact_email: customerDetails?.["email"] || undefined,
          contact_phone: customerDetails?.["phone"] || undefined,
          updated_at: new Date().toISOString(),
        }).eq("id", merchOrderId);

        if (merchOrderError) {
          console.error("❌ Error updating merch order status:", merchOrderError);
          processingError = merchOrderError;
        } else if (paymentStatus === "paid") {
          // Grant entitlements for products in this order
          try {
            const { data: orderItems, error: itemsError } = await supabase
              .from("merch_order_items")
              .select("product_id, products(entitlement_key)")
              .eq("order_id", merchOrderId)
              .not("product_id", "is", null);

            if (itemsError) {
              console.error("❌ Error fetching order items for entitlements:", itemsError);
            } else if (orderItems && orderItems.length > 0) {
              interface OrderItemWithProduct {
                product_id: string;
                products: {
                  entitlement_key: string;
                } | null;
              }
              const entitlementsToGrant = (orderItems as unknown as OrderItemWithProduct[])
                .filter((item) => item.products?.entitlement_key)
                .map((item) => ({
                  user_id: userId,
                  product_id: item.product_id,
                  entitlement_key: item.products!.entitlement_key,
                  source_type: "purchase",
                  source_id: merchOrderId,
                  granted_at: new Date().toISOString(),
                  is_active: true
                }));

              if (entitlementsToGrant.length > 0) {
                const { error: grantError } = await supabase
                  .from("user_entitlements")
                  .upsert(entitlementsToGrant, { onConflict: "user_id,entitlement_key,is_active" }); // Adjust constraint if needed

                if (grantError) {
                  console.error("❌ Error granting user entitlements:", grantError);
                } else {
                  console.log(`✅ Granted ${entitlementsToGrant.length} entitlements for order ${merchOrderId}`);
                }
              }
            }
          } catch (entError) {
            console.error("❌ Unexpected error granting entitlements:", entError);
          }
        }
      }

      // Log Entitlement Granted (Ledger)
      try {
        await supabase.from("commerce_events").upsert({
          stripe_event_id: event.id,
          type: "entitlement_granted",
          user_id: userId,
          stripe_session_id: stripeSessionId,
          status: processingError ? "failed" : "completed",
          metadata: { ...metadata, error: processingError },
        }, { onConflict: "stripe_event_id,type" });
      } catch (logError) {
        console.error("Failed to log entitlement_granted event:", logError);
      }

    } catch (globalError) {
      console.error("❌ Global error in webhook processing:", globalError);
      // Log Global Error (Ledger)
      try {
        await supabase.from("commerce_events").upsert({
          stripe_event_id: event.id,
          type: "error",
          user_id: userId,
          stripe_session_id: stripeSessionId,
          status: "failed",
          metadata: { ...metadata, error: globalError },
        }, { onConflict: "stripe_event_id,type" });
      } catch (logError) {
        console.error("Failed to log global error event:", logError);
      }
    }
  }

  if (event.type === "customer.subscription.deleted") {
    // deno-lint-ignore no-explicit-any
    const subscription = event.data.object as Record<string, any>;
    const userId = subscription.metadata?.userId as string | undefined;
    const slotId = subscription.metadata?.slotId as string | undefined;

    if (userId && slotId) {
      const { error: revokeError } = await supabase.from("slot_entitlements").update({ is_active: false }).match({ user_id: userId, slot_id: slotId });
      if (revokeError) {
        console.error("❌ Error revoking entitlement:", revokeError);
      }

      // Log Revocation (Ledger)
      try {
        await supabase.from("commerce_events").upsert({
          stripe_event_id: event.id,
          type: "entitlement_revoked",
          user_id: userId,
          status: revokeError ? "failed" : "completed",
          metadata: { ...subscription.metadata, subscription_id: subscription.id, error: revokeError },
        }, { onConflict: "stripe_event_id,type" });
      } catch (logError) {
        console.error("Failed to log entitlement_revoked event:", logError);
      }
    }
  }
}
