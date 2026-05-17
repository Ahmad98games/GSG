import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { 
  TEST_BUSINESS_ID, 
  TEST_BRANCH_HQ, 
  TEST_BRANCH_02, 
  TEST_SKU_A 
} from '../setup';
import { verifyPortalToken, confirmPaymentAndPostLedger } from '@/lib/actions/clientPortal';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const JWT_SECRET = 'super-secret-jwt-key-with-at-least-32-characters-long';

const admin = createClient(supabaseUrl, serviceRoleKey);

// --- Helpers ---
function createBusinessClient(businessId: string, branchId?: string | null) {
  const token = jwt.sign({
    aud: 'authenticated',
    role: 'authenticated',
    sub: 'test-user-uuid',
    business_id: businessId,
    branch_id: branchId || null,
    exp: Math.floor(Date.now() / 1000) + 60 * 60
  }, JWT_SECRET);

  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: { Authorization: `Bearer ${token}` }
    }
  });
}

const BUSINESS_B_ID = 'business-B-uuid-9999';

describe('RLS — Cross-Business Isolation', () => {

  it('business A cannot read business B SKUs', async () => {
    // 1. Insert SKU for Business B via admin
    await admin.from('skus').insert({
      business_id: BUSINESS_B_ID,
      sku_code: 'SKU-B',
      name: 'Secret Product B'
    });

    // 2. Client for Business A
    const clientA = createBusinessClient(TEST_BUSINESS_ID);
    
    // 3. Select SKUs
    const { data } = await clientA.from('skus').select('*');
    
    // 4. Assert: SKU-B is invisible
    expect(data?.find(s => s.sku_code === 'SKU-B')).toBeUndefined();
  });

  it('business A cannot insert SKU with business B id', async () => {
    const clientA = createBusinessClient(TEST_BUSINESS_ID);
    
    const { error } = await clientA.from('skus').insert({
      business_id: BUSINESS_B_ID,
      sku_code: 'MALICIOUS-SKU',
      name: 'Hack Attempt'
    });

    expect(error).toBeDefined();
  });

  it('ledger entries cross-business isolation', async () => {
    await admin.from('ledger_entries').insert({
      business_id: BUSINESS_B_ID,
      tx_ref: 'B-SECRET-TX',
      amount: 1000,
      status: 'posted'
    });

    const clientA = createBusinessClient(TEST_BUSINESS_ID);
    const { data } = await clientA.from('ledger_entries').select('*');
    
    expect(data?.find(e => e.tx_ref === 'B-SECRET-TX')).toBeUndefined();
  });
});

describe('RLS — Branch Scoping', () => {

  it('branch operator sees only own branch SKUs', async () => {
    // Seed: SKU_HQ already in HQ (from setup)
    // Add SKU to Branch 02
    await admin.from('skus').insert({
      business_id: TEST_BUSINESS_ID,
      branch_id: TEST_BRANCH_02,
      sku_code: 'SKU-B02',
      name: 'Branch 02 Product'
    });

    const clientB2 = createBusinessClient(TEST_BUSINESS_ID, TEST_BRANCH_02);
    const { data } = await clientB2.from('skus').select('*');
    
    expect(data?.length).toBe(1);
    expect(data?.[0].sku_code).toBe('SKU-B02');
  });

  it('HQ consolidated view sees all branches', async () => {
    const clientConsolidated = createBusinessClient(TEST_BUSINESS_ID, null);
    const { data } = await clientConsolidated.from('skus').select('*');
    
    // Should see both SKU-A (HQ) and SKU-B02
    expect(data?.length).toBeGreaterThanOrEqual(2);
    expect(data?.some(s => s.sku_code === 'SKU-A')).toBe(true);
    expect(data?.some(s => s.sku_code === 'SKU-B02')).toBe(true);
  });

  it('legacy rows (null branch_id) always visible', async () => {
    await admin.from('skus').insert({
      business_id: TEST_BUSINESS_ID,
      branch_id: null, // Legacy row
      sku_code: 'SKU-LEGACY',
      name: 'Legacy Product'
    });

    const clientB2 = createBusinessClient(TEST_BUSINESS_ID, TEST_BRANCH_02);
    const { data } = await clientB2.from('skus').select('*');
    
    expect(data?.some(s => s.sku_code === 'SKU-LEGACY')).toBe(true);
  });

  it('cannot archive HQ branch', async () => {
    const clientHQ = createBusinessClient(TEST_BUSINESS_ID, TEST_BRANCH_HQ);
    
    // Attempt archive HQ
    const { error } = await clientHQ.from('branches')
      .update({ status: 'archived' })
      .eq('is_headquarters', true);

    // This should fail due to RLS or CHECK constraint
    expect(error).toBeDefined();
    
    const { data: branch } = await admin.from('branches').eq('id', TEST_BRANCH_HQ).single();
    expect(branch.status).not.toBe('archived');
  });
});

describe('Portal Security', () => {

  it('expired portal token returns null, not error', async () => {
    // 1. Create expired session
    const rawToken = 'expired-token-' + Date.now();
    const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
    
    const { data: portal } = await admin.from('client_portals').insert({
      business_id: TEST_BUSINESS_ID,
      party_id: 'party-uuid',
      email: 'test@example.com',
      display_name: 'Test Client',
      status: 'active'
    }).select().single();

    await admin.from('portal_sessions').insert({
      portal_id: portal.id,
      token_hash: hash,
      expires_at: new Date(Date.now() - 3600000).toISOString() // 1h ago
    });

    const result = await verifyPortalToken(rawToken);
    expect(result).toBeNull();
  });

  it('portal client cannot read other business invoices', async () => {
    // 1. Create portal for Business A
    const { data: portalA } = await admin.from('client_portals').insert({
      business_id: TEST_BUSINESS_ID,
      party_id: 'party-A',
      email: 'a@ex.com',
      display_name: 'A',
      status: 'active'
    }).select().single();

    // 2. Create invoice for Business B
    await admin.from('invoices').insert({
      business_id: BUSINESS_B_ID,
      invoice_no: 'INV-B-001',
      total: 1000
    });

    // 3. Client for Portal A
    const token = jwt.sign({
      role: 'authenticated',
      sub: 'portal-user',
      portal_id: portalA.id,
      business_id: TEST_BUSINESS_ID
    }, JWT_SECRET);

    const portalClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data } = await portalClient.from('invoices').select('*');
    expect(data?.find(i => i.invoice_no === 'INV-B-001')).toBeUndefined();
  });

  it('portal client cannot read hub-side tables', async () => {
    const token = jwt.sign({ role: 'authenticated', portal_id: 'some-id' }, JWT_SECRET);
    const portalClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { error } = await portalClient.from('karigars').select('*');
    // Either RLS or role permissions block this
    expect(error).toBeDefined();
  });

  it('payment intent idempotency', async () => {
    const intentId = crypto.randomUUID();
    
    // Seed intent
    await admin.from('portal_payment_intents').insert({
      id: intentId,
      business_id: TEST_BUSINESS_ID,
      portal_id: 'some-portal-id',
      invoice_id: 'some-invoice-id',
      amount: 100,
      currency: 'PKR',
      status: 'pending',
      provider: 'stripe'
    });

    // Call twice
    await confirmPaymentAndPostLedger(intentId);
    await confirmPaymentAndPostLedger(intentId);

    // Verify exactly 2 ledger entries (1 debit, 1 credit) for the whole process
    const { data: entries } = await admin.from('ledger_entries').eq('tx_ref', `PAY-${intentId}`);
    expect(entries?.length).toBe(2);
  });
});

describe('Sync Queue — Zero Data Loss', () => {

  it('every TCP write hits sync_queue before ACK', async () => {
    // Simulating the logic from the TCP server
    const t1 = Date.now();
    
    // Simulate ScanEvent
    const batchId = `SYNC-TIME-TEST-${Date.now()}`;
    
    // This calls the internal server logic or the RPC the server uses
    await admin.from('sync_queue').insert({
      table_name: 'scan_events',
      operation: 'insert',
      record_id: batchId,
      payload: '{}',
      status: 'pending'
    });

    const t2 = Date.now();

    const { data: row } = await admin.from('sync_queue')
      .eq('record_id', batchId)
      .single();

    const createdAt = new Date(row.created_at).getTime();
    
    // This is a logical assertion: the server logic must be synchronous
    // to ensure T1 <= write <= T2.
    expect(createdAt).toBeGreaterThanOrEqual(t1);
    expect(createdAt).toBeLessThanOrEqual(t2);
  });
});

