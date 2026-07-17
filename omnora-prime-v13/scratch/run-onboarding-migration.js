const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const migrationSql = `
    -- Create feedback table if it doesn't exist
    CREATE TABLE IF NOT EXISTS feedback (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
      message text NOT NULL,
      name text NOT NULL,
      business_type text,
      city text,
      share_publicly boolean DEFAULT false,
      submitted_at timestamp with time zone DEFAULT now()
    );

    -- Create testimonials table if it doesn't exist
    CREATE TABLE IF NOT EXISTS testimonials (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id uuid REFERENCES business_profiles(id) ON DELETE SET NULL,
      feedback_text text NOT NULL,
      display_name text NOT NULL,
      business_type text,
      city text,
      country_code text DEFAULT 'PK',
      rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
      tier text DEFAULT 'Starter',
      status text DEFAULT 'pending',
      created_at timestamp with time zone DEFAULT now()
    );

    -- Drop legacy status check constraint if it exists to allow approved/private statuses
    ALTER TABLE testimonials DROP CONSTRAINT IF EXISTS testimonials_status_check;
    ALTER TABLE testimonials ADD CONSTRAINT testimonials_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'private'));

    -- Enable RLS
    ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
    ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

    -- Drop legacy insert policies to avoid duplicates
    DROP POLICY IF EXISTS "Allow public anonymous inserts into feedback" ON feedback;
    DROP POLICY IF EXISTS "Allow public anonymous inserts into testimonials" ON testimonials;
    DROP POLICY IF EXISTS "anyone_can_submit" ON testimonials;

    -- Create public insert policies
    CREATE POLICY "Allow public anonymous inserts into feedback" ON feedback FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow public anonymous inserts into testimonials" ON testimonials FOR INSERT WITH CHECK (true);
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
    try {
      const { data, error } = await supabase.rpc(q.name, q.params);
      if (!error) {
        console.log(`RPC ${q.name} Succeeded! Result:`, data);
        success = true;
        break;
      } else {
        console.error(`RPC ${q.name} failed:`, error.message);
      }
    } catch (e) {
      console.error(`RPC ${q.name} threw exception:`, e.message);
    }
  }

  if (success) {
    console.log('Database migration completed successfully.');
  } else {
    console.error('All RPC methods failed to execute the SQL query.');
  }
}

main().catch(console.error);
