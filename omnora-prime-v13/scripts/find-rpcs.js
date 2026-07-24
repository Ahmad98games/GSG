const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') })
const { createClient } = require('@supabase/supabase-js')

async function findRpcs() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Query database catalog for procedures
  const { data, error } = await supabase
    .from('pg_catalog.pg_proc')
    .select('proname')
    .ilike('proname', '%sql%')

  console.log('SQL functions:', { data, error })
}
findRpcs()
