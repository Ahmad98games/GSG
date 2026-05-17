import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
dotenv.config({ path: '.env.local' })

async function tryInsertLicense() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const testKey = 'LITE-TEST-TRIAL-KEY9'
  console.log('Attempting to insert test license...')
  const { data, error } = await supabase
    .from('licenses')
    .insert({
      license_key: testKey,
      tier: 'lite',
      max_devices: 3,
      customer_name: 'Tester 0',
      customer_email: 'test0@noxis.test',
      expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      is_trial: true,
      notes: 'Test trial key creation',
      amount_paid: 0,
      currency: 'PKR',
    })
    .select()

  if (error) {
    console.error('Insert failed:', error.message, `(${error.code})`)
  } else {
    console.log('Insert SUCCESS:', data)
    // Clean up
    await supabase.from('licenses').delete().eq('license_key', testKey)
  }
}

tryInsertLicense()
