const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const { Client } = require('pg');

async function main() {
  const poolUrl = process.env.SUPABASE_DB_POOL_URL;
  if (!poolUrl) {
    console.error('No SUPABASE_DB_POOL_URL found.');
    return;
  }

  // Parse credentials
  // Format: postgresql://postgres:password@host:port/database
  const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
  const match = poolUrl.match(regex);
  if (!match) {
    console.error('Could not parse connection string format.');
    return;
  }

  const [_, username, password, host, port, dbname] = match;
  
  // Use direct Supabase host
  const directHost = 'db.zgxmvwxzjmpmesqliwxl.supabase.co';
  const connectionString = `postgresql://${username}:${password}@${directHost}:5432/${dbname}`;

  console.log(`Attempting connection to direct host: ${directHost}...`);
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 10000,
    ssl: { rejectUnauthorized: false } // Supabase requires SSL
  });

  await client.connect();
  console.log('Connected directly to Supabase Postgres!');

  const migrationSql = `
    ALTER TABLE business_profiles
    ADD COLUMN IF NOT EXISTS onboarding_complete boolean DEFAULT false;
  `;

  console.log('Running DDL migration...');
  const res = await client.query(migrationSql);
  console.log('Success!', res);

  await client.end();
}

main().catch(console.error);
