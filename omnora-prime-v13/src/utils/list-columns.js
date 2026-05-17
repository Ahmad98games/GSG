const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') })
const { createClient } = require('@supabase/supabase-js')

async function listColumns() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zgxmvwxzjmpmesqliwxl.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'parties' })
  // If RPC doesn't exist, try a raw query via a temporary function if possible, 
  // or just try common names.

  console.log('Columns for parties:', data || error)
}

listColumns()

