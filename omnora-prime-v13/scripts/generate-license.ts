import { createClient } from '@supabase/supabase-js'
import * as crypto from 'crypto'
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function generateKey(tier: string): string {
  const prefix = tier.toUpperCase().slice(0,4)
  const random = crypto.randomBytes(12)
    .toString('hex').toUpperCase()
  // Format: ELIT-XXXX-XXXX-XXXX
  const parts = random.match(/.{1,4}/g) || []
  return `${prefix}-${parts.slice(0,3).join('-')}`
}

async function createLicense(params: {
  tier: 'lite' | 'pro' | 'elite'
  customerName: string
  customerEmail: string
  customerPhone?: string
  paymentReference?: string
  amountPaid?: number
  currency?: string
  notes?: string
}) {
  const key = generateKey(params.tier)
  const maxDevices = {
    lite: 15, pro: 35, elite: 75
  }[params.tier]
  
  const expiresAt = new Date()
  expiresAt.setFullYear(expiresAt.getFullYear() + 1)
  
  const { data, error } = await supabase
    .from('licenses')
    .insert({
      license_key: key,
      tier: params.tier,
      max_devices: maxDevices,
      customer_name: params.customerName,
      customer_email: params.customerEmail,
      customer_phone: params.customerPhone,
      payment_reference: params.paymentReference,
      amount_paid: params.amountPaid,
      currency: params.currency || 'PKR',
      notes: params.notes,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()
  
  if (error) {
    console.error('Failed:', error.message)
    return
  }
  
  console.log('='.repeat(50))
  console.log('LICENSE KEY GENERATED')
  console.log('='.repeat(50))
  console.log('Key:      ', data.license_key)
  console.log('Tier:     ', data.tier.toUpperCase())
  console.log('Devices:  ', data.max_devices)
  console.log('Customer: ', data.customer_name)
  console.log('Email:    ', data.customer_email)
  console.log('Expires:  ',
    new Date(data.expires_at).toLocaleDateString())
  console.log('='.repeat(50))
  console.log('Send this key to the customer.')
  console.log('They enter it on first launch.')
  console.log('='.repeat(50))
}

// Default generation for first customer if script is run directly
if (require.main === module) {
  createLicense({
    tier: 'pro',
    customerName: 'Al-Hamid Textiles',
    customerEmail: 'alhamid@example.com',
    customerPhone: '0300-1234567',
    paymentReference: 'JC-20240510-001',
    amountPaid: 6500,
    currency: 'PKR',
    notes: 'First customer — textile factory Lahore'
  })
}
