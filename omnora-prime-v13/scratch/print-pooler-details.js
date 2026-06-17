const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const poolUrl = process.env.SUPABASE_DB_POOL_URL;
if (!poolUrl) {
  console.error('No SUPABASE_DB_POOL_URL.');
  return;
}

console.log('Real pool URL in env:', poolUrl.replace(/:([^:@]+)@/, ':****@'));
// Let's print the length and first/last char of the password
const match = poolUrl.match(/:([^:@]+)@/);
if (match) {
  const pw = match[1];
  console.log(`Password details: length=${pw.length}, first=${pw[0]}, last=${pw[pw.length-1]}`);
}
