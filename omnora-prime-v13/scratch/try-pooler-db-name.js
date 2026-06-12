const { Client } = require('pg');

const host = 'aws-0-eu-central-1.pooler.supabase.com';
const password = 'noxis2026';

const configs = [
  { user: 'postgres', database: 'zgxmvwxzjmpmesqliwxl' },
  { user: 'postgres.zgxmvwxzjmpmesqliwxl', database: 'postgres' },
  { user: 'postgres', database: 'postgres' }
];

async function tryConfigs() {
  for (const cfg of configs) {
    console.log(`Trying config: user=${cfg.user}, database=${cfg.database}...`);
    const client = new Client({
      host,
      port: 5432,
      user: cfg.user,
      password,
      database: cfg.database,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000
    });
    try {
      await client.connect();
      console.log(`SUCCESS with user=${cfg.user}, database=${cfg.database}!`);
      const res = await client.query('SELECT version()');
      console.log('Result:', res.rows[0]);
      await client.end();
      return;
    } catch (e) {
      console.error(`Failed:`, e.message);
    }
  }
}

tryConfigs();
