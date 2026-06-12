const { Client } = require('pg');

const host = 'aws-0-eu-central-1.pooler.supabase.com';
const password = 'noxis2026';
const projectRef = 'zgxmvwxzjmpmesqliwxl';

const users = [
  `supabase_admin.${projectRef}`,
  `authenticator.${projectRef}`,
  `postgres.${projectRef}`
];

async function tryUsers() {
  for (const user of users) {
    console.log(`Trying user: ${user}...`);
    const client = new Client({
      host,
      port: 5432,
      user,
      password,
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000
    });
    try {
      await client.connect();
      console.log(`SUCCESS with user: ${user}!`);
      const res = await client.query('SELECT version()');
      console.log('Result:', res.rows[0]);
      await client.end();
      return;
    } catch (e) {
      console.error(`Failed for user ${user}:`, e.message);
    }
  }
}

tryUsers();
