import { resolve } from 'path';
require('dotenv').config({ path: resolve(__dirname, '../.env.local') });
import { createClient } from '@supabase/supabase-js';

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const migrationSql = `
    ALTER TABLE business_profiles
    ADD COLUMN IF NOT EXISTS onboarding_complete boolean DEFAULT false;
  `;

  const queries = [
    { name: 'exec_sql', params: { query: migrationSql } },
    { name: 'run_sql', params: { sql: migrationSql } },
    { name: 'execute_sql', params: { sql: migrationSql } },
    { name: 'sql', params: { query: migrationSql } }
  ];

  let success = false;
  for (const q of queries) {
    console.log(`Attempting RPC ${q.name}...`);
    const { data, error } = await supabase.rpc(q.name, q.params);
    if (!error) {
      console.log(`RPC ${q.name} Succeeded! Result:`, data);
      success = true;
      break;
    } else {
      console.error(`RPC ${q.name} failed:`, error.message);
    }
  }

  if (success) {
    console.log('Database migration completed successfully.');
  } else {
    console.error('All RPC methods failed to execute the SQL query. Please apply manually.');
  }
}

main().catch(console.error);
