
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "http://127.0.0.1:54321";
const supabaseKey = "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSlots() {
  console.log('Fetching slots from:', supabaseUrl);
  const { data, error } = await supabase
    .from('slots')
    .select('name, slug, price, type, is_active');

  if (error) {
    console.error('Error fetching slots:', error);
    return;
  }

  console.log('--- SLOTS DATA ---');
  console.table(data);
  console.log('------------------');
}

checkSlots();
