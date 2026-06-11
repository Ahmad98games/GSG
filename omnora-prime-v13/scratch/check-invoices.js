const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') })
const { createClient } = require('@supabase/supabase-js')

async function check() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error fetching from invoices:', error)
  } else {
    console.log('Successfully fetched invoice. Record keys:', data.length > 0 ? Object.keys(data[0]) : 'No records found')
  }
}

check()
