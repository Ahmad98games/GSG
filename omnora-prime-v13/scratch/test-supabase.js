const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(url, key);

  console.log('Querying licenses...');
  const { data, error } = await supabase
    .from('licenses')
    .select('*')
    .limit(1);

  if (error) {
    console.log('Error querying licenses:', error.message || error);
  } else {
    console.log('licenses exists! Data:', data);
  }
}

main().catch(console.error);
