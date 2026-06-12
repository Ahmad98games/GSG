const dns = require('dns');
const { Client } = require('pg');

const hosts = [
  'aws-0.pooler.supabase.com',
  'pooler.supabase.com',
  'db.pooler.supabase.com'
];

async function checkHosts() {
  for (const host of hosts) {
    console.log(`Checking host: ${host}...`);
    const ip = await new Promise((resolve) => {
      dns.lookup(host, (err, address) => {
        resolve(address || null);
      });
    });
    if (!ip) {
      console.log(`  DNS lookup failed.`);
      continue;
    }
    console.log(`  Resolved to: ${ip}`);
  }
}

checkHosts();
