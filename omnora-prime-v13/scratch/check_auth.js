const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Service Role Key in .env.local!");
  process.exit(1);
}

// Service role client bypasses RLS and can query the auth schema
const s = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

s.auth.admin.listUsers().then(r => {
  if (r.error) {
    console.error('Error listing users:', r.error.message);
  } else {
    console.log('Auth Users:');
    r.data.users.forEach(u => {
      console.log(`- ID: ${u.id}, Email: ${u.email}, Created At: ${u.created_at}`);
    });
  }
}).catch(console.error);
