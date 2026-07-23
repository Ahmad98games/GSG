const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials in .env file! URL:", supabaseUrl, "Key:", !!supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: businesses, error: busError } = await supabase
    .from('business_profiles')
    .select('*');
  
  if (busError) {
    console.error("Error fetching businesses:", busError);
    return;
  }
  
  console.log("Businesses in DB:", businesses);
  
  for (const bus of businesses) {
    const { data: accounts, error: accError } = await supabase
      .from('accounts')
      .select('*')
      .eq('business_id', bus.id);
      
    if (accError) {
      console.error(`Error fetching accounts for ${bus.company_name || bus.id}:`, accError);
    } else {
      console.log(`Accounts for business "${bus.company_name || bus.id}" (${bus.id}) count: ${accounts.length}`);
      if (accounts.length > 0) {
        console.log("First account keys:", Object.keys(accounts[0]));
        console.log("Account codes list:", accounts.map(a => `${a.account_code}: ${a.name} (${a.type})`));
      }
    }
  }
}

run();
