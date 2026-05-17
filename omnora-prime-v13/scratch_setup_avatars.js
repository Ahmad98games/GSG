const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setup() {
  console.log('--- Setting up Profile Picture System ---');
  
  // 1. Add column to business_profiles
  console.log('1. Adding avatar_url column...');
  try {
    const { error: colError } = await supabase.rpc('execute_sql', {
      sql: 'ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS avatar_url text;'
    });
    if (colError) console.warn('Column add warning (rpc execute_sql might be missing):', colError.message);
    else console.log('Column check complete.');
  } catch (e) {
    console.error('Column check failed:', e.message);
  }

  // 2. Create Storage Bucket
  console.log('2. Creating avatars bucket...');
  try {
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket('avatars', {
      public: true,
      fileSizeLimit: 1024 * 1024, // 1MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
    });
    if (bucketError) console.warn('Bucket warning (might exist):', bucketError.message);
    else console.log('Bucket created.');
  } catch (e) {
    console.error('Bucket creation failed:', e.message);
  }

  // 3. Set Policies
  console.log('3. Setting storage policies...');
  const policies = [
    {
      name: "Users can upload own avatar",
      sql: "CREATE POLICY \"Users can upload own avatar\" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');"
    },
    {
      name: "Avatars are publicly readable",
      sql: "CREATE POLICY \"Avatars are publicly readable\" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');"
    }
  ];
  
  for (const policy of policies) {
    try {
      const { error: polError } = await supabase.rpc('execute_sql', { sql: policy.sql });
      if (polError) console.warn(`Policy warning (${policy.name}):`, polError.message);
      else console.log(`Policy check complete: ${policy.name}`);
    } catch (e) {
      console.error(`Policy check failed (${policy.name}):`, e.message);
    }
  }
  
  console.log('Setup finished.');
}

setup();
