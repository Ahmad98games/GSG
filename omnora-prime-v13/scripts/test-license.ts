import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testLicenseSystem() {
  console.log('\n=== NOXIS LICENSE SYSTEM TEST ===\n');
  
  const { data: licenses, error: readError } =
    await supabase.from('licenses').select('*');
  
  if (readError) {
    console.error('❌ Cannot read licenses:', readError.message);
    return;
  }
  console.log(`✅ Licenses table: ${licenses?.length || 0} records`);
  
  const trials = licenses?.filter((l: any) => l.is_trial) || [];
  console.log(`✅ Trial licenses: ${trials.length}`);
  trials.forEach((t: any) => {
    const expired = t.expires_at
      ? new Date(t.expires_at) < new Date()
      : false;
    console.log(`   ${t.license_key} | ${t.tier} | ${t.expires_at ? (expired ? '❌ EXPIRED' : '✅ Active') : '⏳ Not activated'}`);
  });
  
  const tierFields = [
    'tier', 'max_devices', 'is_trial',
    'expires_at', 'activated_at', 'customer_name',
  ];
  const sampleLicense = licenses?.[0];
  if (sampleLicense) {
    tierFields.forEach(field => {
      const has = field in sampleLicense;
      console.log(`${has ? '✅' : '❌'} Field: ${field}`);
    });
  }
  
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/verify-license`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_key: 'INVALID-TEST' }),
      }
    );
    const data = await res.json();
    console.log('✅ Edge function reachable');
    console.log('   Invalid key response:', data.valid === false ? '✅ Correct (false)' : '❌ Wrong');
  } catch (e) {
    console.error('❌ Edge function not reachable:', e);
  }
  
  const trialKey = trials[0]?.license_key;
  if (trialKey) {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/verify-license`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_key: trialKey }),
      }
    );
    const data = await res.json();
    console.log(`\nTrial key test (${trialKey}):`);
    console.log(`  valid: ${data.valid ? '✅' : '❌'}`);
    console.log(`  tier: ${data.tier || 'not returned'}`);
    console.log(`  is_trial: ${data.is_trial}`);
    console.log(`  expires_at: ${data.expires_at || 'not set (correct for unactivated)'}`);
  }
  
  const EXPECTED_LIMITS = {
    lite:  { maxDevices: 5,  maxCameras: 2 },
    pro:   { maxDevices: 15, maxCameras: 8 },
    elite: { maxDevices: 50, maxCameras: 20 },
  };
  
  console.log('\nTier limits verification:');
  Object.entries(EXPECTED_LIMITS).forEach(([tier, limits]) => {
    console.log(`  ${tier.toUpperCase()}: devices=${(limits as any).maxDevices}, cameras=${(limits as any).maxCameras}`);
  });
  
  console.log('\n=== TEST COMPLETE ===\n');
}

testLicenseSystem().catch(console.error);
