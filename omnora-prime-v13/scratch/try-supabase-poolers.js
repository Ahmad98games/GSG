const { Client } = require('pg');
const dns = require('dns');

const regions = [
  'ap-south-1',       // Mumbai (Very common for PK/SA)
  'ap-southeast-1',   // Singapore
  'eu-central-1',     // Frankfurt
  'eu-west-1',        // Ireland
  'us-east-1',        // N. Virginia
  'us-east-2',        // Ohio
  'us-west-1',        // N. California
  'us-west-2',        // Oregon
  'ap-northeast-1',   // Tokyo
  'ap-northeast-2',   // Seoul
  'ap-southeast-2',   // Sydney
  'ca-central-1',     // Canada
  'eu-west-2',        // London
  'eu-west-3',        // Paris
  'sa-east-1',        // São Paulo
];

const projectRef = 'zgxmvwxzjmpmesqliwxl';
const password = 'noxis2026';

async function testRegions() {
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    console.log(`Checking host: ${host}...`);
    
    // First, resolve host to see if it exists
    const ip = await new Promise((resolve) => {
      dns.lookup(host, (err, address) => {
        if (err) resolve(null);
        else resolve(address);
      });
    });
    
    if (!ip) {
      console.log(`  DNS lookup failed for ${host}`);
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
      connectionTimeoutMillis: 5000
    });
    
    try {
      await client.connect();
      console.log(`SUCCESSFUL CONNECTION to ${host}!`);
      const res = await client.query('SELECT current_database(), version()');
      console.log('Database Info:', res.rows[0]);
      await client.end();
      return; // Stop on first success
    } catch (e) {
      console.error(`  Connection failed for ${host}:`, e.message);
    }
  }
  console.log('All regions tested.');
}

testRegions();
