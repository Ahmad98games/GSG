
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSKUs() {
  const { data: skus, error } = await supabase.from('skus').select('id, name, sku_code, business_id');
  if (error) {
    console.error('Error fetching SKUs:', error);
    return;
  }
  console.log('SKUs in database:', skus.length);
  skus.forEach(s => console.log(`- [${s.id}] ${s.sku_code}: ${s.name} (Business: ${s.business_id})`));

  const { data: profiles, error: pError } = await supabase.from('business_profiles').select('id, business_name');
  if (pError) {
    console.error('Error fetching profiles:', pError);
    return;
  }
  console.log('\nBusiness Profiles:');
  profiles.forEach(p => console.log(`- [${p.id}] ${p.name}`));
}

checkSKUs();
