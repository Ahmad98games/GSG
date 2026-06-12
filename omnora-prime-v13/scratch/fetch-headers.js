const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

async function fetchHeaders() {
  try {
    console.log(`Fetching headers from ${supabaseUrl}...`);
    const response = await fetch(supabaseUrl, { method: 'HEAD' });
    console.log('Status:', response.status);
    console.log('Headers:');
    for (const [key, val] of response.headers.entries()) {
      console.log(`  ${key}: ${val}`);
    }
  } catch (err) {
    console.error('Error fetching headers:', err.message);
  }
}

fetchHeaders();
