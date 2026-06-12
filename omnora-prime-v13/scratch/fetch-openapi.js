const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function fetchOpenAPI() {
  try {
    console.log('Fetching OpenAPI spec with service role key...');
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    console.log('Paths in OpenAPI spec:');
    const paths = Object.keys(data.paths);
    paths.filter(p => p.startsWith('/rpc/')).forEach(p => console.log(p));
  } catch (err) {
    console.error('Error fetching OpenAPI spec:', err.message);
  }
}

fetchOpenAPI();
