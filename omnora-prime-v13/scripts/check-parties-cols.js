import { resolve } from 'path'
require('dotenv').config({ path: resolve(__dirname, '../.env.local') })
import { createClient } from '@supabase/supabase-js'

async function check() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const { data, error } = await supabase
    .from('parties')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error fetching parties:', error)
  } else {
    console.log('Parties columns:', data.length > 0 ? Object.keys(data[0]) : 'No records')
  }
}
check()
