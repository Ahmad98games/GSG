import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
dotenv.config({ path: '.env.local' })

async function listTables() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Try to query common tables to see what works
  const tables = ['business_profiles', 'parties', 'licenses', 'skus', 'ledger_entries']
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1)
    if (error) {
      console.log(`Table '${table}': FAILED - ${error.message} (${error.code})`)
    } else {
      console.log(`Table '${table}': SUCCESS - found ${data.length} records`)
    }
  }
}

listTables()
