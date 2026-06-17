const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase
    .from('business_profiles')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching business profiles:', error);
  } else {
    console.log('Record keys:', data.length > 0 ? Object.keys(data[0]) : 'No records found');
  }
}

main().catch(console.error);
