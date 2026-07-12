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

async function createTestUsers() {
  const users = [
    { email: 'noxistester1@gmail.com', password: 'noxistest2026' },
    { email: 'noxistester2@gmail.com', password: 'noxistest2026' },
    { email: 'noxistester3@gmail.com', password: 'noxistest2026' },
    { email: 'noxistester4@gmail.com', password: 'noxistest2026' },
    { email: 'noxistester5@gmail.com', password: 'noxistest2026' },
  ];

  console.log('🚀 Creating 5 Tester Accounts in Supabase...');

  for (const u of users) {
    console.log(`👤 Creating user: ${u.email}...`);

    // Delete existing user if any to start fresh
    const { data: listData } = await supabase.auth.admin.listUsers();
    const existingUser = listData?.users.find(usr => usr.email === u.email);
    if (existingUser) {
      await supabase.auth.admin.deleteUser(existingUser.id);
      console.log(`🗑️ Deleted existing user with id: ${existingUser.id}`);
      
      // Also delete any existing business profiles for this user
      const { error: profileDelError } = await supabase
        .from('business_profiles')
        .delete()
        .eq('user_id', existingUser.id);
      if (profileDelError) {
        console.log(`⚠️ Profile deletion warning: ${profileDelError.message}`);
      }
    }

    // Create the user in Auth
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true
    });

    if (userError) {
      console.error(`❌ Error creating ${u.email}:`, userError.message);
    } else {
      console.log(`✅ User ${u.email} created successfully.`);
    }
  }

  console.log('\n✨ Tester creation completed!');
}

createTestUsers().catch(console.error);
