import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local');
}

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
