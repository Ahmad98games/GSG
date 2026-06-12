const { Client } = require('pg');

const host = 'zgxmvwxzjmpmesqliwxl.supabase.co';
const ports = [5432, 6543];

async function tryConnect() {
  for (const port of ports) {
    console.log(`Trying port ${port}...`);
    const client = new Client({
      host,
      port,
      user: 'postgres',
      password: 'noxis2026',
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000
    });
    try {
      await client.connect();
      console.log(`Success on port ${port}!`);
      await client.end();
      return;
    } catch (e) {
      console.error(`Failed on port ${port}:`, e.message);
    }
  }
}

tryConnect();
