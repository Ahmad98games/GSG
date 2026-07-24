const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') })
const { createClient } = require('@supabase/supabase-js')

async function runMigration() {
  console.log('Connecting to Supabase...');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const query = `
    ALTER TABLE skus ADD COLUMN IF NOT EXISTS oem_number text;
    ALTER TABLE skus ADD COLUMN IF NOT EXISTS compatible_vehicles text;
    ALTER TABLE skus ADD COLUMN IF NOT EXISTS commission_rate numeric DEFAULT 0;
  `;

  console.log('Executing SQL Migration on Supabase...');
  const { data, error } = await supabase.rpc('exec_sql', { query })

  if (error) {
    console.error('Migration failed:', error.message, error.details);
    process.exit(1);
  } else {
    console.log('Migration executed successfully! Result:', data);
    process.exit(0);
  }
}

runMigration().catch(err => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
