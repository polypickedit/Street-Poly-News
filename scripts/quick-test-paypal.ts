
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPayPalFlow() {
  console.log('🚀 Starting PayPal Stabilizer Flow Test...');

  // 1. Check if table exists
  const { error: tableCheckError } = await supabase
    .from('placement_orders')
    .select('id')
    .limit(1);

  if (tableCheckError && tableCheckError.code === 'PGRST205') { // Table not found
    console.error('❌ Table "placement_orders" does not exist.');
    console.error('Please apply the migration: supabase/migrations/20260220150000_create_placement_orders.sql');
    console.error('You can run this SQL in your Supabase Dashboard SQL Editor.');
    process.exit(1);
  }

  // 2. Create a test order
  const testOrder = {
    order_id: `test_${Date.now()}`,
    slot_type: 'test_slot',
    artist_name: 'Test Artist',
    email: 'test@example.com',
    release_link: 'https://example.com/release',
    notes: 'Automated test order',
    status: 'pending_paypal',
    payment_method: 'paypal',
    created_at: new Date().toISOString(),
  };

  console.log(`📝 Inserting test order: ${testOrder.order_id}...`);

  const { error } = await supabase
    .from('placement_orders')
    .insert([testOrder]);

  if (error) {
    console.error('❌ Insertion Failed:', error.message);
    console.error('Details:', error);
    process.exit(1);
  }

  console.log('✅ Insertion Verified (No data returned due to RLS - expected for public intake).');

  // 3. Test Event Tracking
  console.log('\n📝 Testing Analytics Event Tracking...');
  
  const testEvent = {
    order_id: testOrder.order_id,
    event_type: 'intake_created',
    metadata: { source: 'test_script' }
  };

  const { error: eventError } = await supabase
    .from('placement_order_events')
    .insert([testEvent]);

  if (eventError) {
    if (eventError.code === '42P01') { // Table undefined
       console.error('❌ Analytics Table "placement_order_events" missing.');
       console.error('Run migration: supabase/migrations/20260220160000_create_placement_order_events.sql');
    } else {
       console.error('❌ Event Tracking Failed:', eventError.message);
    }
  } else {
    console.log('✅ Analytics Event Inserted: intake_created');
  }

  console.log('\n--- Verification Steps ---');
  console.log(`1. Go to the Admin Dashboard > PayPal Orders.`);
  console.log(`2. Look for Order ID: ${testOrder.order_id}`);
  console.log(`3. Verify details match: Artist '${testOrder.artist_name}', Email '${testOrder.email}'.`);
  console.log('4. (Optional) Mark as Paid to test the update flow.');
  console.log('--------------------------\n');
  
  console.log('🎉 Test Script Completed Successfully.');
}

testPayPalFlow().catch((err) => {
  console.error('❌ Unexpected Error:', err);
  process.exit(1);
});
