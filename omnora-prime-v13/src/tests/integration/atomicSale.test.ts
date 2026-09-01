import { describe, test, expect, beforeEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key'

const supabase = createClient(supabaseUrl, supabaseKey)

const TEST_BIZ_ID = '00000000-0000-0000-0000-000000000001'
const TEST_USER_ID = '00000000-0000-0000-0000-000000000002'
const TEST_PARTY_ID = '00000000-0000-0000-0000-000000000003'
let TEST_SKU_ID: string

beforeEach(async () => {
  TEST_SKU_ID = crypto.randomUUID()

  const store = (globalThis as any).__SUPABASE_STORE__
  if (store) {
    if (!store.business_profiles) store.business_profiles = []
    if (!store.business_profiles.some((b: any) => b.id === TEST_BIZ_ID)) {
      store.business_profiles.push({
        id: TEST_BIZ_ID,
        user_id: TEST_USER_ID,
        business_name: 'Test Business',
        invoice_counter: 1,
        invoice_prefix: 'INV',
      })
    }

    if (!store.parties) store.parties = []
    let party = store.parties.find((p: any) => p.id === TEST_PARTY_ID)
    if (!party) {
      party = {
        id: TEST_PARTY_ID,
        business_id: TEST_BIZ_ID,
        name: 'Test Customer',
        current_balance: 0,
      }
      store.parties.push(party)
    } else {
      party.current_balance = 0
    }
  }

  // Create a fresh test SKU with qty = 10
  await supabase.from('skus').insert({
    id: TEST_SKU_ID,
    business_id: TEST_BIZ_ID,
    name: 'Test Fabric',
    sku_code: `TEST-${Date.now()}`,
    unit: 'Meter',
    sale_price: 500,
    cost_price: 300,
    qty_on_hand: 10,
    reorder_level: 2,
    is_active: true,
  })
})

const buildParams = (
  overrides: Partial<any> = {},
  qty = 2,
  txId = crypto.randomUUID()
) => ({
  p_business_id: TEST_BIZ_ID,
  p_user_id: TEST_USER_ID,
  p_client_transaction_id: txId,
  p_invoice_date: new Date().toISOString().split('T')[0],
  p_party_id: null,
  p_party_name: null,
  p_party_phone: null,
  p_subtotal: 500 * qty,
  p_discount_amount: 0,
  p_discount_percent: 0,
  p_tax_amount: 0,
  p_grand_total: 500 * qty,
  p_invoice_currency: 'PKR',
  p_items: [{
    sku_id: TEST_SKU_ID,
    description: 'Test Fabric',
    quantity: qty,
    unit: 'Meter',
    unit_price: 500,
    discount_percent: 0,
    discount_amount: 0,
    tax_rate: 0,
    tax_amount: 0,
    line_total: 500 * qty,
  }],
  p_payments: [{
    method: 'cash',
    amount: 500 * qty,
    reference: null,
  }],
  ...overrides,
})

describe('Atomic Sale Hardening Integration Tests', () => {

  test('TEST 1: Cash sale succeeds', async () => {
    const { data } = await (supabase as any).rpc('complete_sale', buildParams())
    expect(data.status).toBe('SUCCESS')
    expect(data.invoice_number).toBeTruthy()
    expect(data.balance_due).toBe(0)

    const { data: sku } = await supabase
      .from('skus').select('qty_on_hand')
      .eq('id', TEST_SKU_ID).single()
    expect(Number(sku!.qty_on_hand)).toBe(8)
  })

  test('TEST 2: Credit sale requires party', async () => {
    const { data } = await (supabase as any).rpc('complete_sale', buildParams({
      p_payments: [{
        method: 'credit',
        amount: 1000,
        reference: null,
      }],
      p_party_id: null,
    }))
    expect(data.status).toBe('ERROR')
    expect(data.error_code).toBe('CREDIT_REQUIRES_PARTY')

    const { data: sku } = await supabase
      .from('skus').select('qty_on_hand')
      .eq('id', TEST_SKU_ID).single()
    expect(Number(sku!.qty_on_hand)).toBe(10)
  })

  test('TEST 3: Split payment', async () => {
    const { data } = await (supabase as any).rpc('complete_sale', buildParams({
      p_payments: [
        { method: 'cash', amount: 500, reference: null },
        { method: 'bank', amount: 500, reference: null },
      ],
    }, 2))
    expect(data.status).toBe('SUCCESS')
    expect(data.balance_due).toBe(0)
  })

  test('TEST 4: Insufficient stock = full rollback', async () => {
    const { data } = await (supabase as any).rpc('complete_sale', buildParams({}, 50))
    expect(data.status).toBe('ERROR')
    expect(data.error_code).toBe('INSUFFICIENT_STOCK')

    const { data: sku } = await supabase
      .from('skus').select('qty_on_hand')
      .eq('id', TEST_SKU_ID).single()
    expect(Number(sku!.qty_on_hand)).toBe(10)
  })

  test('TEST 5: Duplicate SKU array aggregation (6 + 6 with stock = 10)', async () => {
    const { data } = await (supabase as any).rpc('complete_sale', buildParams({
      p_grand_total: 6000,
      p_subtotal: 6000,
      p_items: [
        { sku_id: TEST_SKU_ID, description: 'Fabric', quantity: 6, unit: 'Meter', unit_price: 500, line_total: 3000 },
        { sku_id: TEST_SKU_ID, description: 'Fabric', quantity: 6, unit: 'Meter', unit_price: 500, line_total: 3000 },
      ],
      p_payments: [{ method: 'cash', amount: 6000, reference: null }],
    }))

    expect(data.status).toBe('ERROR')
    expect(data.error_code).toBe('INSUFFICIENT_STOCK')

    // Stock must remain untouched at 10
    const { data: sku } = await supabase
      .from('skus').select('qty_on_hand')
      .eq('id', TEST_SKU_ID).single()
    expect(Number(sku!.qty_on_hand)).toBe(10)
  })

  test('TEST 6: Negative or zero quantity rejected', async () => {
    const { data: resNeg } = await (supabase as any).rpc('complete_sale', buildParams({
      p_items: [{ sku_id: TEST_SKU_ID, description: 'Fabric', quantity: -1, unit: 'Meter', unit_price: 500, line_total: -500 }],
    }))
    expect(resNeg.status).toBe('ERROR')
    expect(resNeg.error_code).toBe('INVALID_QUANTITY')

    const { data: resZero } = await (supabase as any).rpc('complete_sale', buildParams({
      p_items: [{ sku_id: TEST_SKU_ID, description: 'Fabric', quantity: 0, unit: 'Meter', unit_price: 500, line_total: 0 }],
    }))
    expect(resZero.status).toBe('ERROR')
    expect(resZero.error_code).toBe('INVALID_QUANTITY')
  })

  test('TEST 7: Negative or zero payment amount rejected', async () => {
    const { data: resNegPay } = await (supabase as any).rpc('complete_sale', buildParams({
      p_payments: [{ method: 'cash', amount: -500, reference: null }],
    }))
    expect(resNegPay.status).toBe('ERROR')
    expect(resNegPay.error_code).toBe('INVALID_PAYMENT')

    const { data: resZeroPay } = await (supabase as any).rpc('complete_sale', buildParams({
      p_payments: [{ method: 'cash', amount: 0, reference: null }],
    }))
    expect(resZeroPay.status).toBe('ERROR')
    expect(resZeroPay.error_code).toBe('INVALID_PAYMENT')
  })

  test('TEST 8: Fabricated grand total rejected with PRICE_MISMATCH', async () => {
    const { data } = await (supabase as any).rpc('complete_sale', buildParams({
      p_grand_total: 100, // True total for 2 units @ 500 is 1000!
    }))
    expect(data.status).toBe('ERROR')
    expect(data.error_code).toBe('PRICE_MISMATCH')
  })

  test('TEST 9: Party balance NULL safety', async () => {
    const store = (globalThis as any).__SUPABASE_STORE__
    const nullPartyId = crypto.randomUUID()
    store.parties.push({
      id: nullPartyId,
      business_id: TEST_BIZ_ID,
      name: 'Null Balance Party',
      current_balance: null,
    })

    const txId = crypto.randomUUID()
    const { data } = await (supabase as any).rpc('complete_sale', buildParams({
      p_party_id: nullPartyId,
      p_party_name: 'Null Balance Party',
      p_grand_total: 1000,
      p_subtotal: 1000,
      p_payments: [
        { method: 'credit', amount: 1000, reference: null }
      ],
    }, 2, txId))

    expect(data.status).toBe('SUCCESS')
    expect(data.balance_due).toBe(1000)

    const party = store.parties.find((p: any) => p.id === nullPartyId)
    expect(party.current_balance).toBe(1000)
  })

  test('TEST 10: Idempotency — same txId twice', async () => {
    const txId = crypto.randomUUID()
    const params = buildParams({}, 2, txId)

    const { data: first } = await (supabase as any).rpc('complete_sale', params)
    expect(first.status).toBe('SUCCESS')
    const invoiceId = first.invoice_id

    const { data: second } = await (supabase as any).rpc('complete_sale', params)
    expect(second.status).toBe('ALREADY_COMPLETED')
    expect(second.invoice_id).toBe(invoiceId)
  })

  test('TEST 11: Concurrent sales receive unique invoice numbers', async () => {
    const txA = crypto.randomUUID()
    const txB = crypto.randomUUID()

    const [resA, resB] = await Promise.all([
      (supabase as any).rpc('complete_sale', buildParams({}, 1, txA)),
      (supabase as any).rpc('complete_sale', buildParams({}, 1, txB)),
    ])

    expect(resA.data.status).toBe('SUCCESS')
    expect(resB.data.status).toBe('SUCCESS')
    expect(resA.data.invoice_number).not.toBe(resB.data.invoice_number)
  })

})
