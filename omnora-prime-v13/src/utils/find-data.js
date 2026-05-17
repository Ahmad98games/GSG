const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') })
const { createClient } = require('@supabase/supabase-js')

async function findData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zgxmvwxzjmpmesqliwxl.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  const { data: parties, error } = await supabase.from('parties').select('*').limit(5)
  console.log('Parties:', parties || error)
}

findData()

