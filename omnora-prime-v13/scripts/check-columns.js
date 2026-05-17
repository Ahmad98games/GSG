const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') })
const { createClient } = require('@supabase/supabase-js')

async function checkColumns() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data, error } = await supabase
    .from('licenses')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error fetching from licenses:', error)
  } else {
    console.log('Successfully fetched license. Record keys:', data.length > 0 ? Object.keys(data[0]) : 'No records found')
  }
}

checkColumns()
