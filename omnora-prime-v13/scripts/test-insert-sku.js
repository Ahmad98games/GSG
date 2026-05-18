const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
dotenv.config({ path: '.env.local' });

async function testSKUInsertion() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  console.log('Logging in as admin@noxis.app...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@noxis.app',
    password: 'noxis2026'
  });

  if (authError) {
    console.error('Login failed:', authError.message);
    return;
  }

  const user = authData.user;
  console.log('Login successful. User ID:', user.id);

  console.log('Fetching business profile...');
  const { data: profile, error: profileError } = await supabase
    .from('business_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (profileError) {
    console.error('Profile fetch failed:', profileError.message);
    return;
  }

  console.log('Business Profile ID:', profile.id);

  const skuCode = `TEST-${Math.floor(1000 + Math.random() * 9000)}`;
  console.log(`Attempting to insert SKU with code ${skuCode}...`);

  const { data: sku, error: insertError } = await supabase
    .from('skus')
    .insert({
      name: 'Test Product',
      sku_code: skuCode,
      unit: 'meter',
      current_location: 'warehouse',
      cost_price: 100,
      sale_price: 150,
      reorder_level: 5,
      qty_on_hand: 0,
      qty_reserved: 0,
      is_active: true,
      business_id: profile.id
    })
    .select()
    .single();

  if (insertError) {
    console.error('SKU Insert failed:', insertError.message, `(Code: ${insertError.code})`);
  } else {
    console.log('SKU Insert SUCCESS:', sku);
    
    // Clean up
    console.log('Cleaning up inserted test SKU...');
    const { error: deleteError } = await supabase
      .from('skus')
      .delete()
      .eq('id', sku.id);
    if (deleteError) {
      console.error('Clean up failed:', deleteError.message);
    } else {
      console.log('Clean up SUCCESS.');
    }
  }
}

testSKUInsertion();
