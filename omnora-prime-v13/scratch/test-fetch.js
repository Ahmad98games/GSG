const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function main() {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/business_profiles?select=id&limit=1`;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('Fetching:', url);
  try {
    const res = await fetch(url, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response:', text);
  } catch (e) {
    console.error('Fetch failed:', e);
  }
}

main().catch(console.error);
