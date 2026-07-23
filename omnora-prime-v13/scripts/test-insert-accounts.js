const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const businessId = 'b4a497b4-7fb5-4c92-b019-bdafc4c4d6de'; // Omnora
  
  console.log("Attempting to insert a single test account...");
  const { data, error } = await supabase
    .from('accounts')
    .insert({
      business_id: businessId,
      account_code: '1001',
      name: 'Cash in Hand Test',
      type: 'asset',
      is_active: true
    })
    .select('*');
    
  if (error) {
    console.error("Test insert failed:", error);
  } else {
    console.log("Test insert succeeded:", data);
  }
}

run();
