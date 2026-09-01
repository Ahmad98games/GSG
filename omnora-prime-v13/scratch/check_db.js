const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function check() {
  const pool = new Pool({
    connectionString: process.env.SUPABASE_DB_POOL_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const resGrants = await pool.query(`
      SELECT grantee, privilege_type 
      FROM information_schema.role_table_grants 
      WHERE table_name = 'karigars';
    `);
    console.log('Grants on karigars:', resGrants.rows);

    const resRLS = await pool.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE tablename = 'karigars';
    `);
    console.log('RLS status:', resRLS.rows);

    const resPolicies = await pool.query(`
      SELECT policyname, permissive, roles, cmd, qual, with_check 
      FROM pg_policies 
      WHERE tablename = 'karigars';
    `);
    console.log('Policies on karigars:', resPolicies.rows);
  } catch (err) {
    console.error('DB Error:', err);
  } finally {
    await pool.end();
  }
}

check();
