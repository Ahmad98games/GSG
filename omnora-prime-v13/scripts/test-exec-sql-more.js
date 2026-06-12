const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') })
const { createClient } = require('@supabase/supabase-js')

async function test() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const queries = [
    { name: 'query', params: { query: 'SELECT 1' } },
    { name: 'execute', params: { sql: 'SELECT 1' } },
    { name: 'run', params: { sql: 'SELECT 1' } }
  ]
  for (const q of queries) {
    const { data, error } = await supabase.rpc(q.name, q.params)
    console.log(`RPC ${q.name}:`, { data, error })
  }
}
test()
