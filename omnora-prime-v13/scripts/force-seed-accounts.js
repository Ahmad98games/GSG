// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials in .env file!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const businesses = [
  '69467ff4-1b8b-4741-9485-51b6e6fcb575', // dhanraj and ahmad bhai
  'b4a497b4-7fb5-4c92-b019-bdafc4c4d6de'  // Omnora
];

async function run() {
  for (const businessId of businesses) {
    console.log(`Seeding business: ${businessId}`);
    
    const { data, error } = await supabase.rpc('seed_default_accounts', {
      p_business_id: businessId
    });

    if (error) {
      console.error(`Failed to seed accounts for ${businessId}:`, error);
    } else {
      console.log(`Successfully executed seed_default_accounts RPC for ${businessId}`);
      
      const { data: accounts } = await supabase
        .from('accounts')
        .select('account_code, name')
        .eq('business_id', businessId);
      console.log(`Now has ${accounts ? accounts.length : 0} accounts in DB.`);
    }
  }
}

run();
