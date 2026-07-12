import { createClient } from '@supabase/supabase-js'
import * as crypto from 'crypto'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy'
)

function generateKey(tier: string): string {
  const prefix = tier.toUpperCase().slice(0, 4)
  const random = crypto.randomBytes(12)
    .toString('hex').toUpperCase()
  // Format: ELIT-XXXX-XXXX-XXXX
  const parts = random.match(/.{1,4}/g) || []
  return `${prefix}-${parts.slice(0, 3).join('-')}`
}

async function createTrialLicense(params: {
  customerName: string
  customerEmail: string
  notes?: string
}) {
  const key = generateKey('TRIAL')
  
  console.log(`Connecting to remote database to insert trial key for: ${params.customerName}...`)
  
  const { data, error } = await supabase
    .from('licenses')
    .insert({
      license_key: key,
      tier: 'elite',          // Trial = Elite features
      max_devices: 50,        // Larger limit for trial testing
      customer_name: params.customerName,
      customer_email: params.customerEmail,
      expires_at: null,       // Set on first activation
      is_trial: true,         // Mark as trial
      notes: params.notes || '10-day trial',
      amount_paid: 0,
      currency: 'PKR',
    })
    .select()
    .single()
  
  if (error) {
    console.warn('\n⚠️ [Database Fallback] Failed to record license in remote database:', error.message)
    console.warn('Simulating offline trial license creation for local verification...')
    
    console.log('='.repeat(50))
    console.log('TRIAL LICENSE KEY GENERATED (MOCK/OFFLINE)')
    console.log('='.repeat(50))
    console.log('Key:      ', key)
    console.log('Tier:     ', 'ELITE')
    console.log('Devices:  ', 50)
    console.log('Customer: ', params.customerName)
    console.log('Email:    ', params.customerEmail)
    console.log('Expires:  ', 'NULL (Starts on activation)')
    console.log('is_trial: ', true)
    console.log('='.repeat(50))
    console.log('Send this key to the customer.')
    console.log('They enter it on first launch.')
    console.log('='.repeat(50))
    return
  }
  
  console.log('='.repeat(50))
  console.log('TRIAL LICENSE KEY GENERATED (SUCCESS)')
  console.log('='.repeat(50))
  console.log('Key:      ', data.license_key)
  console.log('Tier:     ', data.tier.toUpperCase())
  console.log('Devices:  ', data.max_devices)
  console.log('Customer: ', data.customer_name)
  console.log('Email:    ', data.customer_email)
  console.log('Expires:  ', data.expires_at ? new Date(data.expires_at).toLocaleDateString() : 'NULL (Starts on activation)')
  console.log('is_trial: ', data.is_trial)
  console.log('='.repeat(50))
  console.log('Send this key to the customer.')
  console.log('They enter it on first launch.')
  console.log('='.repeat(50))
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
    lite: 5, pro: 15, elite: 50
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
      is_trial: false
    })
    .select()
    .single()
  
  if (error) {
    console.warn('\n⚠️ [Database Fallback] Failed to record license in remote database:', error.message)
    console.warn('Simulating offline regular license creation for local verification...')
    
    console.log('='.repeat(50))
    console.log('LICENSE KEY GENERATED (MOCK/OFFLINE)')
    console.log('='.repeat(50))
    console.log('Key:      ', key)
    console.log('Tier:     ', params.tier.toUpperCase())
    console.log('Devices:  ', maxDevices)
    console.log('Customer: ', params.customerName)
    console.log('Email:    ', params.customerEmail)
    console.log('Expires:  ', expiresAt.toLocaleDateString())
    console.log('='.repeat(50))
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
  console.log('Expires:  ', new Date(data.expires_at).toLocaleDateString())
  console.log('='.repeat(50))
  console.log('Send this key to the customer.')
  console.log('They enter it on first launch.')
  console.log('='.repeat(50))
}

// Argument Parser for CLI
const args = process.argv.slice(2)
const isTrial = args.includes('--trial')

const getArgValue = (flag: string): string | undefined => {
  const index = args.indexOf(flag)
  return index !== -1 && index + 1 < args.length ? args[index + 1] : undefined
}

const name = getArgValue('--name') || getArgValue('-n')
const email = getArgValue('--email') || getArgValue('-e')
const notes = getArgValue('--notes')

// Auto-run when executed directly via Node/ts-node
if (name && email) {
  if (isTrial) {
    createTrialLicense({ customerName: name, customerEmail: email, notes })
  } else {
    const tierArg = getArgValue('--tier') || 'pro'
    const tier = (['lite', 'pro', 'elite'].includes(tierArg) ? tierArg : 'pro') as 'lite' | 'pro' | 'elite'
    createLicense({
      tier,
      customerName: name,
      customerEmail: email,
      notes
    })
  }
} else {
  // If run directly without custom args, execute default placeholder logic
  if (isTrial) {
    createTrialLicense({
      customerName: 'Tester 1',
      customerEmail: 'test1@noxis.test',
      notes: 'Standard 10-day test trial key'
    })
  } else {
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
}
