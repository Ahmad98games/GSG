const { Client } = require('pg');

const client = new Client({
  host: 'aws-0-eu-central-1.pooler.supabase.com',
  port: 5432,
  user: 'postgres',
  password: 'noxis2026',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

const migrationSql = `
  ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS onboarding_complete boolean DEFAULT false;
`;

async function run() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected! Executing query...');
    const res = await client.query(migrationSql);
    console.log('Query executed successfully!', res);
    await client.end();
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
