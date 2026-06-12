const { Client } = require('pg');

const host = 'aws-0-eu-central-1.pooler.supabase.com';
const password = 'noxis2026';
const projectRef = 'zgxmvwxzjmpmesqliwxl';

const connectionStrings = [
  `postgresql://postgres:${password}@${host}:5432/postgres?options=reference%3D${projectRef}`,
  `postgresql://postgres:${password}@${host}:6543/postgres?options=reference%3D${projectRef}`
];

async function tryConns() {
  for (const connStr of connectionStrings) {
    console.log(`Trying connection string: ${connStr.replace(password, 'REDACTED')}...`);
    const client = new Client({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000
    });
    try {
      await client.connect();
      console.log(`SUCCESS!`);
      const res = await client.query('SELECT version()');
      console.log('Result:', res.rows[0]);
      await client.end();
      return;
    } catch (e) {
      console.error(`Failed:`, e.message);
    }
  }
}

tryConns();
