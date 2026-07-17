const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(url, key);

  console.log('Querying all licenses using service role key...');
  const { data, error } = await supabase
    .from('licenses')
    .select('*');

  if (error) {
    console.error('Error:', error.message || error);
  } else {
    console.log(`Success! Total licenses found: ${data.length}`);
    data.forEach(lic => {
      console.log(`- ID: ${lic.id}, Key: ${lic.license_key}, Active: ${lic.is_active}, Deactivated: ${lic.is_deactivated}, Email: ${lic.customer_email}, Created: ${lic.created_at}`);
    });
  }
}

main().catch(console.error);
