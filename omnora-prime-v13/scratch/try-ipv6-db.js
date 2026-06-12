const { Client } = require('pg');

const host = '2406:da14:271:9922:25ef:398:a4ee:8518';
const port = 5432;

async function tryConnect() {
  console.log(`Connecting to [${host}]:${port} directly...`);
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
    console.log(`Success on direct IPv6 IP!`);
    const res = await client.query('SELECT version()');
    console.log('Version:', res.rows[0]);
    await client.end();
  } catch (e) {
    console.error(`Failed on direct IPv6 IP:`, e.message);
  }
}

tryConnect();
