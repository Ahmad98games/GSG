const dns = require('dns');
const { Client } = require('pg');

const extraRegions = [
  'ap-southeast-3', // Jakarta
  'ap-south-2',     // Hyderabad
  'eu-central-2',   // Zurich
  'eu-south-1',     // Milan
  'eu-south-2',     // Spain
  'me-central-1',   // UAE
  'me-south-1',     // Bahrain
  'il-central-1'    // Israel
];

const projectRef = 'zgxmvwxzjmpmesqliwxl';
const password = 'noxis2026';

async function checkExtra() {
  for (const region of extraRegions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    console.log(`Checking extra region: ${region} (${host})...`);
    
    // Resolve DNS
    const ip = await new Promise((resolve) => {
      dns.lookup(host, (err, address) => {
        resolve(address || null);
      });
    });
    
    if (!ip) {
      console.log(`  DNS lookup failed.`);
      continue;
    }
    
    console.log(`  Resolved to: ${ip}. Attempting connection...`);
    const client = new Client({
      host,
      port: 6543,
      user: `postgres.${projectRef}`,
      password: password,
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 3000
    });
    
    try {
      await client.connect();
      console.log(`SUCCESS connection to ${host}!`);
      await client.end();
      return;
    } catch (e) {
      console.error(`  Connection failed:`, e.message);
    }
  }
  console.log('All extra regions checked.');
}

checkExtra();
