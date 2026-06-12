const { Client } = require('pg');
const dns = require('dns');

const regions = [
  'ap-south-1',
  'ap-southeast-1',
  'eu-central-1',
  'eu-west-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-southeast-2',
  'ca-central-1',
  'eu-west-2',
  'eu-west-3',
  'sa-east-1',
];

const projectRef = 'zgxmvwxzjmpmesqliwxl';
const password = 'noxis2026';

async function findRegion() {
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    
    // Resolve DNS
    const ip = await new Promise((resolve) => {
      dns.lookup(host, (err, address) => {
        resolve(address || null);
      });
    });
    
    if (!ip) continue;
    
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
      console.log(`[${region}] SUCCESS! Connected to ${host}`);
      await client.end();
      return;
    } catch (err) {
      console.log(`[${region}] Error: ${err.message}`);
    }
  }
}

findRegion();
