const { Client } = require('pg');

const client = new Client({
  host: 'aws-0-eu-central-1.pooler.supabase.com',
  port: 5432,
  user: 'postgres.zgxmvwxzjmpmesqliwxl',
  password: 'noxis2026',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log('Connecting to 5432...');
    await client.connect();
    console.log('Connected to 5432!');
    const res = await client.query('SELECT version()');
    console.log('Result:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('Connection to 5432 failed:', err.message);
  }
}

run();
