
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { processStripeWebhookEvent } from "../supabase/functions/stripe-webhook/handler.ts";

type StripeEventLike = {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
};

// Load environment variables
dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runTest() {
  const runId = Math.random().toString(36).substring(7);
  const testEmail = `test-sub-${runId}@example.com`;
  const testPassword = "test-password-123";
  let userId: string | null = null;
  let sessionId: string | null = null;
  let tierId: string | null = null;

  console.log(`🚀 Starting Quick Test Subscription (Run ID: ${runId})`);

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
    
    // Assign admin role to create session (or use service role to create session directly)
    // We'll create session using service role client, so we don't strictly need admin role on user,
    // but the session needs a `created_by` profile.
    
    // Create Profile if trigger didn't catch it (it should have)
    // Wait a moment for trigger
    await new Promise(r => setTimeout(r, 1000));

    // 2. Create Listening Session
    console.log("2️⃣ Creating Listening Session...");
    const { data: sessionData, error: sessionError } = await supabase
      .from("listening_sessions")
      .insert({
        title: `Test Session ${runId}`,
        description: "Automated test session",
        scheduled_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        status: "open",
        created_by: userId, // The test user owns it
      })
      .select()
      .single();

    if (sessionError) throw new Error(`Session create failed: ${sessionError.message}`);
    sessionId = sessionData.id;
    console.log(`   ✅ Session created: ${sessionId}`);

    // 3. Create Tier
    console.log("3️⃣ Creating Listening Session Tier...");
    const { data: tierData, error: tierError } = await supabase
      .from("listening_session_tiers")
      .insert({
        session_id: sessionId,
        tier_name: "VIP Test",
        price_cents: 1000,
        slot_limit: 10,
        slots_filled: 0,
      })
      .select()
      .single();

    if (tierError) throw new Error(`Tier create failed: ${tierError.message}`);
    tierId = tierData.id;
    console.log(`   ✅ Tier created: ${tierId}`);

    // 4. Simulate Stripe Webhook
    console.log("4️⃣ Simulating Stripe Checkout Webhook...");
    const stripeSessionId = `cs_test_${runId}`;
    const stripeEvent = {
      id: `evt_test_${runId}`,
      type: "checkout.session.completed",
      data: {
        object: {
          id: stripeSessionId,
          amount_total: 1000,
          currency: "usd",
          metadata: {
            userId: userId,
            type: "listening_tier",
            listeningSessionId: sessionId,
            listeningTierId: tierId,
          },
          payment_status: "paid",
        },
      },
    };

    // Call the handler directly
    await processStripeWebhookEvent(stripeEvent as unknown as StripeEventLike, supabase);
    console.log("   ✅ Webhook processed");

    // 5. Verify Purchase Record
    console.log("5️⃣ Verifying Database State...");
    // Give it a moment for async operations (though we awaited the handler)
    await new Promise(r => setTimeout(r, 1000));

    const { data: purchaseData, error: purchaseError } = await supabase
      .from("listening_session_purchases")
      .select("*")
      .eq("stripe_session_id", stripeSessionId)
      .single();

    if (purchaseError) throw new Error(`Purchase verification failed: ${purchaseError.message}`);
    
    if (purchaseData.status === "paid") {
      console.log(`   ✅ Purchase found and PAID: ${purchaseData.id}`);
    } else {
      throw new Error(`Purchase found but status is ${purchaseData.status}`);
    }

    // 6. Verify Commerce Event Log
    const { data: eventData, error: eventError } = await supabase
      .from("commerce_events")
      .select("*")
      .eq("stripe_event_id", stripeEvent.id)
      .eq("type", "entitlement_granted")
      .single();

    if (eventError && eventError.code !== 'PGRST116') {
       console.warn(`   ⚠️ Could not verify commerce_events log: ${eventError.message}`);
    } else if (eventData) {
       console.log(`   ✅ Commerce event logged: ${eventData.id}`);
    } else {
       console.warn(`   ⚠️ Commerce event not found (might be async or error in logging)`);
    }

    console.log("\n✨ TEST PASSED: Complete payment loop verified successfully!");

  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("\n❌ TEST FAILED:", err.message);
      if ('cause' in err) console.error("Cause:", (err as { cause?: unknown }).cause);
    } else {
      console.error("\n❌ TEST FAILED:", String(err));
    }
    process.exit(1);
  } finally {
    // Cleanup
    console.log("\n🧹 Cleaning up...");
    if (userId) {
      await supabase.auth.admin.deleteUser(userId);
      console.log("   ✅ Test user deleted");
    }
    // Session and Tier cascade delete if user is deleted? 
    // Usually user delete cascades to profile, but maybe not sessions created by them if not strict.
    // Let's delete session explicitly to be safe.
    if (sessionId) {
      await supabase.from("listening_sessions").delete().eq("id", sessionId);
      console.log("   ✅ Test session deleted");
    }
  }
}

runTest();
