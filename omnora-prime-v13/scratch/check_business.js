const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Service Role Key in .env.local!");
  process.exit(1);
}

const s = createClient(supabaseUrl, supabaseKey);

s.from('business_profiles')
  .select('id, business_name, user_id')
  .then(r => {
    if (r.error) {
      console.error('Error fetching business profiles:', r.error.message);
    } else {
      console.log('Business Profiles:', r.data);
    }
  })
  .catch(console.error);
