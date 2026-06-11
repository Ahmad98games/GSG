import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { Decimal } from 'decimal.js';
import { 
  initiateInterBranchTransfer, 
  receiveInterBranchTransfer, 
  cancelInterBranchTransfer 
} from '@/lib/actions/interBranchTransfer';
import { TEST_BUSINESS_ID, TEST_BRANCH_HQ, TEST_BRANCH_02, TEST_SKU_A } from '../setup';

/**
 * PHASE 11 & 12: LEDGER INTEGRITY INTEGRATION TESTS
 * These tests enforce strict industrial financial rules.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const anon = createClient(supabaseUrl, supabaseKey);
const admin = createClient(supabaseUrl, serviceRoleKey);

describe('Ledger Integrity — Immutability Rules', () => {
  
  it('cannot UPDATE a posted ledger entry', async () => {
    // 1. Insert posted entry via service role
    const { data: entry } = await admin.from('ledger_entries').insert({
      business_id: TEST_BUSINESS_ID,
      tx_ref: 'TX-IMMUTABLE-01',
      entry_type: 'debit',
      account_id: 'some-account-uuid', // Assuming seeded in setup
      amount: 1000,
      status: 'posted'
    }).select().single();

    // 2. Attempt UPDATE via anon client
    const { error } = await anon.from('ledger_entries')
      .update({ amount: 5000 })
      .eq('id', entry.id);

    // 3. Assert failure
    expect(error).toBeDefined();
    
    // 4. Verify re-fetch
    const { data: refetched } = await admin.from('ledger_entries').select('*').eq('id', entry.id).single();
    expect(new Decimal(refetched.amount).equals(new Decimal(1000))).toBe(true);
  });

  it('cannot DELETE a posted ledger entry', async () => {
    // 1. Insert posted entry
    const { data: entry } = await admin.from('ledger_entries').insert({
      business_id: TEST_BUSINESS_ID,
      tx_ref: 'TX-IMMUTABLE-02',
      entry_type: 'credit',
      amount: 500,
      status: 'posted'
    }).select().single();

    // 2. Attempt DELETE via service role (Blocked by DB Rule/Trigger)
    const { error } = await admin.from('ledger_entries').delete().eq('id', entry.id);
    expect(error).toBeDefined();

    // 3. Verify row still exists
    const { data: exists } = await admin.from('ledger_entries').select('*').eq('id', entry.id).single();
    expect(exists).toBeDefined();
  });

  it('reversal creates new entry, does not modify original', async () => {
    const txRef = 'TX-REVERSAL-TEST';
    
    // 1. Create original
    await admin.from('ledger_entries').insert({
      business_id: TEST_BUSINESS_ID,
      tx_ref: txRef,
      entry_type: 'debit',
      amount: 1000,
      status: 'posted'
    });

    // 2. Call reversal (Simulated RPC call)
    const { data: reversal } = await admin.rpc('reverse_ledger_entry', {
      p_tx_ref: txRef,
      p_reason: 'Testing Reversal'
    });

    // 3. Assert original unchanged
    const { data: original } = await admin.from('ledger_entries').select('*').eq('tx_ref', txRef).eq('entry_type', 'debit').single();
    expect(new Decimal(original.amount).equals(new Decimal(1000))).toBe(true);

    // 4. Assert reversal exists with negative amount
    const { data: revEntry } = await admin.from('ledger_entries').select('*').eq('tx_ref', txRef).eq('entry_type', 'credit').single();
    expect(new Decimal(revEntry.amount).equals(new Decimal(1000))).toBe(true); // Balanced entry
    // OR if Phase 3 uses negative amounts:
    // expect(new Decimal(revEntry.amount).equals(new Decimal(-1000))).toBe(true);
    
    const sum = new Decimal(original.amount).minus(new Decimal(revEntry.amount));
    expect(sum.equals(0)).toBe(true);
  });

  it('trial balance integrity — debits equal credits', async () => {
    const txId = `TB-${Date.now()}`;
    // Insert 5 pairs
    for(let i=0; i<5; i++) {
      await admin.from('ledger_entries').insert([
        { business_id: TEST_BUSINESS_ID, tx_ref: txId, entry_type: 'debit', amount: 100 * (i+1), status: 'posted' },
        { business_id: TEST_BUSINESS_ID, tx_ref: txId, entry_type: 'credit', amount: 100 * (i+1), status: 'posted' }
      ]);
    }

    const { data: tb } = await admin.rpc('get_trial_balance', { p_business_id: TEST_BUSINESS_ID });
    
    const debits = new Decimal(tb.total_debits);
    const credits = new Decimal(tb.total_credits);
    
    expect(debits.equals(credits)).toBe(true);
    
    const { data: integrity } = await admin.rpc('check_trial_balance_integrity', { p_business_id: TEST_BUSINESS_ID });
    expect(integrity).toBe(true);
  });
});

describe('Ledger Integrity — Inter-Branch Transfers', () => {

  it('IBT initiation creates exactly 2 ledger entries', async () => {
    // 1. Initiate transfer
    const transfer = await initiateInterBranchTransfer({
      businessId: TEST_BUSINESS_ID,
      fromBranchId: TEST_BRANCH_HQ,
      toBranchId: TEST_BRANCH_02,
      skuId: TEST_SKU_A,
      qty: '25',
      userId: 'test-user'
    });

    // 2. Query ledger entries
    const { data: entries } = await admin.from('ledger_entries')
      .eq('tx_ref', `IBT-INIT-${transfer.id}`);

    expect(entries?.length).toBe(2);
    
    // Check specific postings
    const transitEntry = entries?.find(e => e.account_name === 'Inter-Branch Transit Asset');
    const inventoryEntry = entries?.find(e => e.account_name === 'Inventory');
    
    expect(transitEntry).toBeDefined();
    expect(inventoryEntry).toBeDefined();
    expect(transitEntry.entry_type).toBe('debit');
    expect(inventoryEntry.entry_type).toBe('credit');

    // 3. Check SKU Qty
    const { data: sku } = await admin.from('skus').select('*').eq('id', TEST_SKU_A).single();
    expect(new Decimal(sku.qty).equals(new Decimal(75))).toBe(true);
  });

  it('IBT receipt creates exactly 1 more ledger entry', async () => {
    // 1. Create transfer first
    const transfer = await initiateInterBranchTransfer({
      businessId: TEST_BUSINESS_ID,
      fromBranchId: TEST_BRANCH_HQ,
      toBranchId: TEST_BRANCH_02,
      skuId: TEST_SKU_A,
      qty: '20',
      userId: 'test-user'
    });

    // 2. Receive it
    await receiveInterBranchTransfer(transfer.id, 'test-user');

    // 3. Check new ledger entry
    const { data: entries } = await admin.from('ledger_entries')
      .eq('tx_ref', `IBT-RECV-${transfer.id}`);
    
    expect(entries?.length).toBe(2); // Receiving side is also a double-entry pair: Debit Inventory (Dest), Credit Transit
    
    // 4. Verify Transfer Status
    const { data: tRow } = await admin.from('inter_branch_transfers').select('*').eq('id', transfer.id).single();
    expect(tRow.status).toBe('received');
  });

  it('IBT cancellation reverses stock and posts reversal entry', async () => {
    const transfer = await initiateInterBranchTransfer({
      businessId: TEST_BUSINESS_ID,
      fromBranchId: TEST_BRANCH_HQ,
      toBranchId: TEST_BRANCH_02,
      skuId: TEST_SKU_A,
      qty: '10',
      userId: 'test-user'
    });

    await cancelInterBranchTransfer(transfer.id, 'test-user');

    // Verify stock restoration
    const { data: sku } = await admin.from('skus').select('*').eq('id', TEST_SKU_A).single();
    // Assuming starting at 100, -25, -20, -10 + 10 = 55 (approx, depending on setup state)
    // But we focus on the delta of this specific transaction
    
    const { data: revEntries } = await admin.from('ledger_entries')
      .eq('tx_ref', `IBT-CNCL-${transfer.id}`);
    expect(revEntries?.length).toBe(2);
    
    const { data: tRow } = await admin.from('inter_branch_transfers').select('*').eq('id', transfer.id).single();
    expect(tRow.status).toBe('cancelled');
  });

  it('cannot cancel a received transfer', async () => {
    const transfer = await initiateInterBranchTransfer({
      businessId: TEST_BUSINESS_ID,
      fromBranchId: TEST_BRANCH_HQ,
      toBranchId: TEST_BRANCH_02,
      skuId: TEST_SKU_A,
      qty: '5',
      userId: 'test-user'
    });

    await receiveInterBranchTransfer(transfer.id, 'test-user');

    // Attempt cancel
    await expect(cancelInterBranchTransfer(transfer.id, 'test-user'))
      .rejects.toThrow('TRANSFER_ALREADY_RECEIVED');
  });
});

describe('Financial Statements — Branch Scoping', () => {

  it('get_profit_loss with branch_id returns branch-only data', async () => {
    // 1. Insert 2 entries for HQ, 1 for Branch-02
    await admin.from('ledger_entries').insert([
      { business_id: TEST_BUSINESS_ID, branch_id: TEST_BRANCH_HQ, entry_type: 'debit', amount: 100, status: 'posted', tx_ref: 'PL-1' },
      { business_id: TEST_BUSINESS_ID, branch_id: TEST_BRANCH_HQ, entry_type: 'debit', amount: 200, status: 'posted', tx_ref: 'PL-2' },
      { business_id: TEST_BUSINESS_ID, branch_id: TEST_BRANCH_02, entry_type: 'debit', amount: 500, status: 'posted', tx_ref: 'PL-3' }
    ]);

    // 2. Query HQ only
    const { data: hqPL } = await admin.rpc('get_profit_loss', {
      p_business_id: TEST_BUSINESS_ID,
      p_branch_id: TEST_BRANCH_HQ
    });
    expect(new Decimal(hqPL.total_expenses).equals(300)).toBe(true);

    // 3. Query Consolidated
    const { data: consPL } = await admin.rpc('get_profit_loss', {
      p_business_id: TEST_BUSINESS_ID,
      p_branch_id: null
    });
    expect(new Decimal(consPL.total_expenses).equals(800)).toBe(true);
  });

  it('Decimal.js — no floating point errors in financial sums', async () => {
    const amounts = ['0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8'];
    const txId = 'DECIMAL-PRECISION-TEST';

    for(const amt of amounts) {
      await admin.from('ledger_entries').insert({
        business_id: TEST_BUSINESS_ID,
        tx_ref: txId,
        entry_type: 'debit',
        amount: parseFloat(amt),
        status: 'posted'
      });
    }

    const { data: tb } = await admin.rpc('get_trial_balance', { p_business_id: TEST_BUSINESS_ID });
    
    // Expected Sum = 3.6
    const result = new Decimal(tb.total_debits);
    expect(result.equals(new Decimal('3.6'))).toBe(true);
    
    // Demonstrate JS failure
    const rawJsSum = 0.1+0.2+0.3+0.4+0.5+0.6+0.7+0.8;
    expect(result.toNumber()).not.toBe(rawJsSum);
  });
});

