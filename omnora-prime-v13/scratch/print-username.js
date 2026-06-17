const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const poolUrl = process.env.SUPABASE_DB_POOL_URL;
if (!poolUrl) {
  console.error('No SUPABASE_DB_POOL_URL.');
  return;
}

const parts = poolUrl.split('://')[1].split('@')[0].split(':');
console.log('Username:', parts[0]);
