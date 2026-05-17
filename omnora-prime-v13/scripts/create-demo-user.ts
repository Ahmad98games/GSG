import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createDemoUser() {
  const email = 'admin@noxis.app';
  const password = 'noxis2026';

  console.log(`🚀 Creating/Checking demo user: ${email}...`);

  // 1. Create the user in Auth
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (userError) {
    if (userError.message.includes('already registered')) {
      console.log('ℹ️ User already exists in Auth.');
    } else {
      console.error('❌ Error creating user:', userError.message);
      return;
    }
  } else {
    console.log('✅ User created successfully.');
  }

  // 2. Get the user ID (even if already exists)
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('❌ Error listing users:', listError.message);
    return;
  }

  const user = users.find(u => u.email === email);
  if (!user) {
    console.error('❌ Could not find user after creation.');
    return;
  }

  console.log(`👤 User ID: ${user.id}`);

  // 3. Create a dummy business profile if it doesn't exist
  const { data: profile, error: profileError } = await supabase
    .from('business_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (profileError && profileError.code === 'PGRST116') {
    console.log('🏢 Creating default business profile...');
    const { error: insertError } = await supabase
      .from('business_profiles')
      .insert({
        user_id: user.id,
        business_name: 'Noxis Demo Hub',
        owner_name: 'Admin',
        onboarding_done: false // This will trigger the onboarding flow we just enabled!
      });

    if (insertError) {
      console.error('❌ Error creating profile:', insertError.message);
    } else {
      console.log('✅ Default business profile created.');
    }
  } else if (profile) {
    console.log('ℹ️ Business profile already exists.');
  }

  console.log('\n✨ Setup complete! You can now log in with:');
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Password: ${password}`);
}

createDemoUser().catch(console.error);
