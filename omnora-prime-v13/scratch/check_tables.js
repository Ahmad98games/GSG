const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Service Role Key in .env.local!");
  process.exit(1);
}

const s = createClient(supabaseUrl, supabaseKey);

Promise.all([
  s.from('skus').select('id').limit(1),
  s.from('invoices').select('id').limit(1),
  s.from('parties').select('id').limit(1),
]).then(([sk, inv, pa]) => {
  console.log('skus:', !sk.error ? 'OK' : sk.error.message);
  console.log('invoices:', !inv.error ? 'OK' : inv.error.message);
  console.log('parties:', !pa.error ? 'OK' : pa.error.message);
}).catch(console.error);
