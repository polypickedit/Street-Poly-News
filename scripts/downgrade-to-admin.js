
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Get email from command line arg, or default to specific user if needed (though explicit is better)
const TARGET_EMAIL = process.argv[2];

if (!TARGET_EMAIL) {
  console.error('Usage: node scripts/downgrade-to-admin.js <email>');
  process.exit(1);
}

async function main() {
  console.log(`Downgrading user from Owner to Admin: ${TARGET_EMAIL}...`);

  // 1. Find user
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('Error listing users:', listError);
    process.exit(1);
  }

  const user = users.find(u => u.email === TARGET_EMAIL);

  if (!user) {
    console.error(`User ${TARGET_EMAIL} not found!`);
    process.exit(1);
  }

  console.log(`Found user: ${user.id}`);

  // 2. Remove from admin_users (Owner)
  console.log('Removing from public.admin_users (Owner Table)...');
  const { error: deleteError } = await supabase
    .from('admin_users')
    .delete()
    .eq('user_id', user.id);

  if (deleteError) {
    console.error('Error removing owner status:', deleteError);
    process.exit(1);
  } else {
    console.log('Successfully removed owner status.');
  }

  // 3. Find 'admin' role ID
  console.log('Finding "admin" role ID...');
  const { data: roles, error: roleError } = await supabase
    .from('roles')
    .select('id, name')
    .eq('name', 'admin')
    .single();

  if (roleError || !roles) {
    console.error('Error finding admin role:', roleError);
    process.exit(1);
  }

  const adminRoleId = roles.id;
  console.log(`Admin Role ID: ${adminRoleId}`);

  // 4. Assign 'admin' role in user_roles
  console.log('Assigning "admin" role in user_roles...');
  const { error: insertError } = await supabase
    .from('user_roles')
    .upsert([{ user_id: user.id, role_id: adminRoleId }], { onConflict: 'user_id, role_id' });

  if (insertError) {
    console.error('Error assigning admin role:', insertError);
    process.exit(1);
  }

  console.log(`Successfully assigned Admin role to ${TARGET_EMAIL}.`);
}

main();
