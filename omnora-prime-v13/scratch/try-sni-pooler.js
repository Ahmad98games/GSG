const { Client } = require('pg');

const host = 'aws-0-eu-central-1.pooler.supabase.com';
const password = 'noxis2026';

const sniHosts = [
  'db.zgxmvwxzjmpmesqliwxl.supabase.co',
  'zgxmvwxzjmpmesqliwxl.supabase.co',
  'zgxmvwxzjmpmesqliwxl.supabase.in',
  'aws-0-eu-central-1.pooler.supabase.com'
];

async function trySni() {
  for (const sni of sniHosts) {
    console.log(`Trying SNI servername: ${sni}...`);
    const client = new Client({
      host,
      port: 5432,
      user: 'postgres',
      password,
      database: 'postgres',
      ssl: {
        rejectUnauthorized: false,
        servername: sni
      },
      connectionTimeoutMillis: 5000
    });
    try {
      await client.connect();
      console.log(`SUCCESS with SNI servername: ${sni}!`);
      const res = await client.query('SELECT version()');
      console.log('Result:', res.rows[0]);
      await client.end();
      return;
    } catch (e) {
      console.error(`Failed:`, e.message);
    }
  }
}

trySni();
