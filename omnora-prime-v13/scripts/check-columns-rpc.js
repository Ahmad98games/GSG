import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
dotenv.config({ path: '.env.local' })

async function checkColumnsRPC() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: cols, error: cError } = await supabase.rpc('get_table_columns', { table_name: 'licenses' })

  if (cError) {
    console.error('Error fetching columns via RPC:', cError)
  } else {
    console.log('Columns for licenses:', cols)
  }
}

checkColumnsRPC()
