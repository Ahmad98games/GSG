const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') })
const { createClient } = require('@supabase/supabase-js')
const crypto = require('crypto')

async function setupPortal() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zgxmvwxzjmpmesqliwxl.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )


  const businessId = 'ffa84a41-941e-4e4e-87c3-9580271db2bd'
  
  // 1. Find columns for parties
  const { data: cols, error: cError } = await supabase.rpc('get_table_columns', { table_name: 'parties' })
  // If rpc fails, we'll try a common set of columns
  
  const partyData = {
    business_id: businessId,
    email: 'test@noxis.pk',
  }
  
  // Try to insert with common name columns
  const names = ['display_name', 'name', 'full_name']
  let party = null
  
  for (const nameCol of names) {
    const { data, error } = await supabase.from('parties').insert({
      ...partyData,
      [nameCol]: 'Test Industrial Client'
    }).select().single()
    
    if (data) {
      party = data
      break
    }
  }

  if (!party) {
    console.error('Failed to create party with common name columns.')
    return
  }

  // 2. Create a portal
  const { data: portal, error: poError } = await supabase.from('client_portals').insert({
    business_id: businessId,
    party_id: party.id,
    email: 'test@noxis.pk',
    display_name: 'Test Industrial Client',
    status: 'active'
  }).select().single()

  if (poError) {
    console.error('Error creating portal:', poError)
    return
  }

  // 3. Create a session
  const rawToken = 'noxis-test-token-' + crypto.randomBytes(4).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()

  const { error: sError } = await supabase.from('portal_sessions').insert({
    portal_id: portal.id,
    token_hash: tokenHash,
    expires_at: expiresAt
  })

  if (sError) {
    console.error('Error creating session:', sError)
    return
  }

  console.log('--- TEST PORTAL ACCESS ---')
  console.log(`Link: http://localhost:3000/portal/auth?token=${rawToken}`)
  console.log('---------------------------')
}

setupPortal()
