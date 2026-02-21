
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { processStripeWebhookEvent } from "../supabase/functions/stripe-webhook/handler.ts";

// Load environment variables
dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

console.log(`Debug: URL=${SUPABASE_URL}`);
console.log(`Debug: Key Length=${SERVICE_ROLE_KEY.length}`);
console.log(`Debug: Key Prefix=${SERVICE_ROLE_KEY.substring(0, 5)}`);

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runTest() {
  const runId = Math.random().toString(36).substring(7);
  const testEmail = `test-merch-${runId}@example.com`;
  const testPassword = "test-password-123";
  let userId: string | null = null;
  let productId: string | null = null;
  let orderId: string | null = null;

  console.log(`🚀 Starting Merch Purchase Test (Run ID: ${runId})`);

  try {
    // 1. Create Test User
    console.log("1️⃣ Creating test user...");
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    });

    if (authError) throw new Error(`Auth create failed: ${authError.message}`);
    userId = authData.user.id;
    console.log(`   ✅ User created: ${userId}`);

    // 2. Create Test Product
    console.log("2️⃣ Creating Test Product...");
    const { data: productData, error: productError } = await supabase
      .from("products")
      .insert({
        title: `Test Product ${runId}`,
        description: "Automated test product",
        price: 1000, // $10.00
        category: "shop",
        status: "active",
        entitlement_key: `test_entitlement_${runId}`,
        source: "stripe",
      })
      .select()
      .single();

    if (productError) throw new Error(`Product create failed: ${productError.message}`);
    productId = productData.id;
    console.log(`   ✅ Product created: ${productId} (Key: ${productData.entitlement_key})`);

    // 3. Create Merch Order
    console.log("3️⃣ Creating Merch Order...");
    const { data: orderData, error: orderError } = await supabase
      .from("merch_orders")
      .insert({
        user_id: userId,
        status: "pending",
        total_cents: 1000,
        currency: "usd",
      })
      .select()
      .single();

    if (orderError) throw new Error(`Order create failed: ${orderError.message}`);
    orderId = orderData.id;
    console.log(`   ✅ Order created: ${orderId}`);

    // 4. Create Order Item
    console.log("4️⃣ Creating Order Item...");
    const { error: itemError } = await supabase
      .from("merch_order_items")
      .insert({
        order_id: orderId,
        product_id: productId,
        item_name: productData.title,
        quantity: 1,
        price_cents: 1000,
      });

    if (itemError) throw new Error(`Item create failed: ${itemError.message}`);
    console.log(`   ✅ Order Item created linked to product`);

    // 5. Simulate Stripe Webhook
    console.log("5️⃣ Simulating Stripe Checkout Webhook...");
    
    const mockEvent = {
      id: `evt_test_${runId}`,
      type: "checkout.session.completed",
      data: {
        object: {
          id: `cs_test_${runId}`,
          object: "checkout.session",
          amount_total: 1000,
          currency: "usd",
          payment_status: "paid",
          status: "complete",
          metadata: {
            merchOrderId: orderId,
            userId: userId,
            type: "merch",
          },
          customer_details: {
            email: testEmail,
            name: "Test User",
          },
        },
      },
    };

    // Invoke the handler logic
    await processStripeWebhookEvent(mockEvent, supabase);
    console.log("   ✅ Webhook processed");

    // 6. Verify Results
    console.log("6️⃣ Verifying Results...");

    // Check Order Status
    const { data: updatedOrder, error: checkOrderError } = await supabase
      .from("merch_orders")
      .select("status")
      .eq("id", orderId)
      .single();

    if (checkOrderError) throw new Error(`Order check failed: ${checkOrderError.message}`);
    
    if (updatedOrder.status !== "paid") {
      throw new Error(`❌ Order status mismatch. Expected 'paid', got '${updatedOrder.status}'`);
    }
    console.log(`   ✅ Order status is 'paid'`);

    // Check Entitlements
    const { data: entitlements, error: checkEntError } = await supabase
      .from("user_entitlements")
      .select("*")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .eq("is_active", true);

    if (checkEntError) throw new Error(`Entitlement check failed: ${checkEntError.message}`);

    if (entitlements.length !== 1) {
      throw new Error(`❌ Entitlement count mismatch. Expected 1, got ${entitlements.length}`);
    }

    const ent = entitlements[0];
    if (ent.entitlement_key !== productData.entitlement_key) {
      throw new Error(`❌ Entitlement key mismatch. Expected '${productData.entitlement_key}', got '${ent.entitlement_key}'`);
    }

    console.log(`   ✅ Entitlement verified: ${ent.id}`);
    console.log(`\n🎉 TEST PASSED! Commerce flow verified.`);

  } catch (err) {
    console.error("\n❌ TEST FAILED:", err);
  } finally {
    // Cleanup (optional, maybe keep for debugging)
    if (userId) {
       console.log("\n🧹 Cleaning up test user...");
       // await supabase.auth.admin.deleteUser(userId);
       // We might want to keep data to inspect it manually if needed
    }
  }
}

runTest();
