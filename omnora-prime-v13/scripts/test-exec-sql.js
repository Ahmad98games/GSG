const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') })
const { createClient } = require('@supabase/supabase-js')

async function test() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const queries = [
    { name: 'exec_sql', params: { query: 'SELECT 1' } },
    { name: 'run_sql', params: { sql: 'SELECT 1' } },
    { name: 'execute_sql', params: { sql: 'SELECT 1' } },
    { name: 'sql', params: { query: 'SELECT 1' } }
  ]
  for (const q of queries) {
    const { data, error } = await supabase.rpc(q.name, q.params)
    console.log(`RPC ${q.name}:`, { data, error })
  }
}
test()
