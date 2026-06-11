import path from 'path';
import { beforeAll, afterAll, beforeEach, vi } from 'vitest';
import os from 'os';
import fs from 'fs';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import net from 'net';
import * as server from '@/lib/nsp/server';
import { setTestDb } from '@/lib/db/client';

// --- Vitest Hoisted Mocks ---

// Mock next/headers cookies
vi.mock('next/headers', () => {
  const cookiesMap = new Map<string, any>();
  const cookieStore = {
    get: vi.fn().mockImplementation((name: string) => cookiesMap.get(name)),
    getAll: vi.fn().mockImplementation(() => Array.from(cookiesMap.entries()).map(([name, value]) => ({ name, value }))),
    set: vi.fn().mockImplementation((name: string, value: any) => {
      cookiesMap.set(name, { name, value });
    }),
    delete: vi.fn().mockImplementation((name: string) => {
      cookiesMap.delete(name);
    }),
  };
  return {
    cookies: vi.fn().mockImplementation(async () => cookieStore),
  };
});

// Mock next/cache to prevent request-scope caching errors in test context
vi.mock('next/cache', () => {
  return {
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
  };
});

// Mock @supabase/supabase-js with a high-fidelity in-memory provider
vi.mock('@supabase/supabase-js', () => {
  const jwt = require('jsonwebtoken');
  const { Decimal } = require('decimal.js');
  const crypto = require('crypto');

  class SupabaseQueryBuilder {
    tableName: string;
    clientContext: any;
    op: 'select' | 'insert' | 'update' | 'delete' = 'select';
    opData: any = null;
    filters: Array<(row: any) => boolean> = [];
    orderCol: string | null = null;
    orderAscending = true;
    limitCount: number | null = null;
    isSingle = false;

    constructor(tableName: string, clientContext: any) {
      this.tableName = tableName;
      this.clientContext = clientContext;
    }

    select(fields?: string) {
      if (this.op !== 'insert' && this.op !== 'update' && this.op !== 'delete') {
        this.op = 'select';
      }
      return this;
    }

    insert(data: any) {
      this.op = 'insert';
      this.opData = data;
      return this;
    }

    update(data: any) {
      this.op = 'update';
      this.opData = data;
      return this;
    }

    delete() {
      this.op = 'delete';
      return this;
    }

    eq(column: string, value: any) {
      this.filters.push((row) => row[column] === value);
      return this;
    }

    neq(column: string, value: any) {
      this.filters.push((row) => row[column] !== value);
      return this;
    }

    order(column: string, options?: { ascending?: boolean }) {
      this.orderCol = column;
      this.orderAscending = options?.ascending !== false;
      return this;
    }

    limit(count: number) {
      this.limitCount = count;
      return this;
    }

    single() {
      this.isSingle = true;
      return this;
    }

    async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
      try {
        const data = await this.execute();
        if (onfulfilled) return onfulfilled({ data, error: null });
        return { data, error: null };
      } catch (err: any) {
        const errObj = { message: err.message || err };
        if (onfulfilled) return onfulfilled({ data: null, error: errObj });
        return { data: null, error: errObj };
      }
    }

    private async execute() {
      const store = (globalThis as any).__SUPABASE_STORE__;
      const list = store[this.tableName];
      if (!list) {
        throw new Error(`Table ${this.tableName} not found in mock store`);
      }

      if (this.op === 'insert') {
        const isArray = Array.isArray(this.opData);
        const rows = isArray ? this.opData : [this.opData];

        if (!this.clientContext.isServiceRole) {
          for (const row of rows) {
            if (this.clientContext.businessId && row.business_id && row.business_id !== this.clientContext.businessId) {
              throw new Error('RLS Violation: cannot insert with different business ID');
            }
          }
        }

        const insertedRows: any[] = [];
        for (const r of rows) {
          const newRow = {
            id: r.id || crypto.randomUUID(),
            created_at: r.created_at || new Date().toISOString(),
            updated_at: r.updated_at || new Date().toISOString(),
            ...r
          };

          if (!newRow.business_id && this.clientContext.businessId) {
            newRow.business_id = this.clientContext.businessId;
          }
          const activeBranchId = this.clientContext.clientBranchContext || this.clientContext.branchId;
          if (!newRow.branch_id && activeBranchId && (this.tableName === 'skus' || this.tableName === 'ledger_entries' || this.tableName === 'invoices')) {
            newRow.branch_id = activeBranchId;
          }

          list.push(newRow);
          insertedRows.push(newRow);
        }

        return this.isSingle ? insertedRows[0] : (isArray ? insertedRows : insertedRows[0]);
      }

      // Read matching rows for select/update/delete
      let results = list;
      if (!this.clientContext.isServiceRole) {
        if (this.clientContext.portalId) {
          if (this.tableName === 'client_portals') {
            results = results.filter((row: any) => row.id === this.clientContext.portalId);
          } else if (this.tableName === 'portal_payment_intents') {
            results = results.filter((row: any) => row.portal_id === this.clientContext.portalId);
          } else if (this.tableName === 'invoices') {
            const cp = store.client_portals.find((p: any) => p.id === this.clientContext.portalId);
            if (cp) {
              results = results.filter((row: any) => row.party_id === cp.party_id && row.business_id === this.clientContext.businessId);
            } else {
              results = [];
            }
          } else if (this.tableName === 'karigars') {
            throw new Error('Permission denied (RLS Violation: portal client cannot read karigars)');
          } else {
            if (this.clientContext.businessId) {
              results = results.filter((row: any) => row.business_id === this.clientContext.businessId);
            }
          }
        } else {
          if (this.clientContext.businessId) {
            results = results.filter((row: any) => row.business_id === this.clientContext.businessId);
          }

          const activeBranchId = this.clientContext.clientBranchContext || this.clientContext.branchId;
          if (activeBranchId) {
            results = results.filter((row: any) => !('branch_id' in row) || row.branch_id === activeBranchId || row.branch_id === null || row.branch_id === undefined);
          }
        }
      }

      // Apply filters
      for (const filter of this.filters) {
        results = results.filter(filter);
      }

      if (this.op === 'update') {
        if (!this.clientContext.isServiceRole) {
          if (!this.clientContext.businessId) {
            throw new Error('RLS Violation: anon client cannot update');
          }
          if (this.tableName === 'branches' && this.opData.status === 'archived') {
            if (results.some((r: any) => r.is_headquarters)) {
              throw new Error('Check constraint violation: cannot archive HQ branch');
            }
          }
        }

        for (const match of results) {
          const index = list.findIndex((r: any) => r.id === match.id);
          if (index !== -1) {
            list[index] = {
              ...list[index],
              ...this.opData,
              updated_at: new Date().toISOString()
            };
          }
        }
        return results;
      }

      if (this.op === 'delete') {
        if (this.tableName === 'ledger_entries') {
          throw new Error('DB Trigger Violation: Posted ledger entries are immutable');
        }

        for (const match of results) {
          const index = list.findIndex((r: any) => r.id === match.id);
          if (index !== -1) {
            list.splice(index, 1);
          }
        }
        return results;
      }

      // SELECT logic
      // Apply order
      if (this.orderCol) {
        results = [...results].sort((a, b) => {
          const valA = a[this.orderCol!];
          const valB = b[this.orderCol!];
          if (valA < valB) return this.orderAscending ? -1 : 1;
          if (valA > valB) return this.orderAscending ? 1 : -1;
          return 0;
        });
      }

      // Apply limit
      if (this.limitCount !== null) {
        results = results.slice(0, this.limitCount);
      }

      // Relation loads
      if (this.tableName === 'portal_sessions') {
        results = results.map((session: any) => ({
          ...session,
          portal: store.client_portals.find((p: any) => p.id === session.portal_id) || null
        }));
      } else if (this.tableName === 'portal_payment_intents') {
        results = results.map((intent: any) => ({
          ...intent,
          invoice: store.invoices.find((i: any) => i.id === intent.invoice_id) || { invoice_no: 'INV-MOCK' }
        }));
      }

      if (this.isSingle) {
        if (results.length === 0) return null;
        return results[0];
      }

      return results;
    }
  }

  class SupabaseClientMock {
    key: string;
    options: any;
    clientContext: any;

    constructor(url: string, key: string, options?: any) {
      this.key = key;
      this.options = options;

      let isServiceRole = false;
      let businessId: string | null = null;
      let branchId: string | null = null;
      let portalId: string | null = null;

      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-key-placeholder';
      if (key === serviceKey || key?.includes('service')) {
        isServiceRole = true;
      }

      if (options?.global?.headers?.Authorization) {
        const authHeader = options.global.headers.Authorization;
        const token = authHeader.replace('Bearer ', '');
        try {
          const decoded: any = jwt.decode(token);
          if (decoded) {
            businessId = decoded.business_id || null;
            branchId = decoded.branch_id || null;
            portalId = decoded.portal_id || null;
          }
        } catch (err) {
          // Ignore
        }
      }

      this.clientContext = {
        isServiceRole,
        businessId,
        branchId,
        portalId,
        clientBranchContext: null
      };
    }

    from(tableName: string) {
      return new SupabaseQueryBuilder(tableName, this.clientContext);
    }

    async rpc(functionName: string, params: any) {
      const store = (globalThis as any).__SUPABASE_STORE__;
      try {
        if (functionName === 'set_branch_context') {
          this.clientContext.clientBranchContext = params.branch_id || null;
          return { data: null, error: null };
        }

        if (functionName === 'initiate_inter_branch_transfer') {
          const skuIndex = store.skus.findIndex((s: any) => s.id === params.p_sku_id);
          if (skuIndex === -1) {
            return { data: null, error: { message: 'SKU_NOT_FOUND' } };
          }

          const sku = store.skus[skuIndex];
          const qty = new Decimal(sku.qty);
          const pQty = new Decimal(params.p_qty);
          if (qty.lt(pQty)) {
            return { data: null, error: { message: 'INSUFFICIENT_QTY' } };
          }

          sku.qty = qty.minus(pQty).toNumber();

          const transferId = crypto.randomUUID();
          const transfer = {
            id: transferId,
            business_id: params.p_business_id,
            from_branch_id: params.p_from_branch_id,
            to_branch_id: params.p_to_branch_id,
            sku_id: params.p_sku_id,
            qty: params.p_qty,
            status: 'in_transit',
            initiated_by: params.p_user_id,
            notes: params.p_notes,
            initiated_at: new Date().toISOString()
          };
          store.inter_branch_transfers.push(transfer);

          const debitEntry = {
            id: crypto.randomUUID(),
            business_id: params.p_business_id,
            branch_id: params.p_from_branch_id,
            tx_ref: `IBT-INIT-${transferId}`,
            account_name: 'Inter-Branch Transit Asset',
            entry_type: 'debit',
            amount: (params.p_qty * 10).toString(),
            status: 'posted',
            description: `IBT Init: ${transferId}`
          };
          const creditEntry = {
            id: crypto.randomUUID(),
            business_id: params.p_business_id,
            branch_id: params.p_from_branch_id,
            tx_ref: `IBT-INIT-${transferId}`,
            account_name: 'Inventory',
            entry_type: 'credit',
            amount: (params.p_qty * 10).toString(),
            status: 'posted',
            description: `IBT Init: ${transferId}`
          };
          store.ledger_entries.push(debitEntry, creditEntry);

          return { data: transfer, error: null };
        }

        if (functionName === 'receive_inter_branch_transfer') {
          const tIndex = store.inter_branch_transfers.findIndex((t: any) => t.id === params.p_transfer_id);
          if (tIndex === -1) {
            return { data: null, error: { message: 'TRANSFER_NOT_FOUND' } };
          }

          const transfer = store.inter_branch_transfers[tIndex];
          transfer.status = 'received';
          transfer.received_by = params.p_user_id;
          transfer.received_at = new Date().toISOString();

          let destSku = store.skus.find((s: any) => s.sku_code === 'SKU-A' && s.branch_id === transfer.to_branch_id);
          if (!destSku) {
            destSku = {
              id: crypto.randomUUID(),
              business_id: transfer.business_id,
              branch_id: transfer.to_branch_id,
              sku_code: 'SKU-A',
              name: 'Industrial Valve A',
              qty: 0
            };
            store.skus.push(destSku);
          }
          destSku.qty = new Decimal(destSku.qty).plus(new Decimal(transfer.qty)).toNumber();

          const debitEntry = {
            id: crypto.randomUUID(),
            business_id: transfer.business_id,
            branch_id: transfer.to_branch_id,
            tx_ref: `IBT-RECV-${transfer.id}`,
            account_name: 'Inventory',
            entry_type: 'debit',
            amount: (transfer.qty * 10).toString(),
            status: 'posted',
            description: `IBT Recv: ${transfer.id}`
          };
          const creditEntry = {
            id: crypto.randomUUID(),
            business_id: transfer.business_id,
            branch_id: transfer.to_branch_id,
            tx_ref: `IBT-RECV-${transfer.id}`,
            account_name: 'Inter-Branch Transit Asset',
            entry_type: 'credit',
            amount: (transfer.qty * 10).toString(),
            status: 'posted',
            description: `IBT Recv: ${transfer.id}`
          };
          store.ledger_entries.push(debitEntry, creditEntry);

          return { data: null, error: null };
        }

        if (functionName === 'cancel_inter_branch_transfer') {
          const tIndex = store.inter_branch_transfers.findIndex((t: any) => t.id === params.p_transfer_id);
          if (tIndex === -1) {
            return { data: null, error: { message: 'TRANSFER_NOT_FOUND' } };
          }

          const transfer = store.inter_branch_transfers[tIndex];
          if (transfer.status === 'received') {
            return { data: null, error: { message: 'TRANSFER_ALREADY_RECEIVED' } };
          }

          transfer.status = 'cancelled';

          const sku = store.skus.find((s: any) => s.id === transfer.sku_id);
          if (sku) {
            sku.qty = new Decimal(sku.qty).plus(new Decimal(transfer.qty)).toNumber();
          }

          const debitEntry = {
            id: crypto.randomUUID(),
            business_id: transfer.business_id,
            branch_id: transfer.from_branch_id,
            tx_ref: `IBT-CNCL-${transfer.id}`,
            account_name: 'Inventory',
            entry_type: 'debit',
            amount: (transfer.qty * 10).toString(),
            status: 'posted',
            description: `IBT Cncl: ${transfer.id}`
          };
          const creditEntry = {
            id: crypto.randomUUID(),
            business_id: transfer.business_id,
            branch_id: transfer.from_branch_id,
            tx_ref: `IBT-CNCL-${transfer.id}`,
            account_name: 'Inter-Branch Transit Asset',
            entry_type: 'credit',
            amount: (transfer.qty * 10).toString(),
            status: 'posted',
            description: `IBT Cncl: ${transfer.id}`
          };
          store.ledger_entries.push(debitEntry, creditEntry);

          return { data: null, error: null };
        }

        if (functionName === 'reverse_ledger_entry') {
          const originals = store.ledger_entries.filter((e: any) => e.tx_ref === params.p_tx_ref);
          if (originals.length === 0) {
            return { data: null, error: { message: 'ENTRY_NOT_FOUND' } };
          }

          const reversed: any[] = [];
          for (const orig of originals) {
            const revType = orig.entry_type === 'debit' ? 'credit' : 'debit';
            const rev = {
              id: crypto.randomUUID(),
              business_id: orig.business_id,
              branch_id: orig.branch_id,
              tx_ref: orig.tx_ref,
              account_name: orig.account_name,
              account_id: orig.account_id,
              entry_type: revType,
              amount: orig.amount,
              status: 'posted',
              description: `Reversal: ${params.p_reason}`
            };
            store.ledger_entries.push(rev);
            reversed.push(rev);
          }

          return { data: reversed[0], error: null };
        }

        if (functionName === 'get_trial_balance') {
          const bizId = params.p_business_id;
          const debits = store.ledger_entries
            .filter((e: any) => e.business_id === bizId && e.entry_type === 'debit' && e.status === 'posted')
            .reduce((sum: any, e: any) => sum.plus(new Decimal(e.amount)), new Decimal(0));
          const credits = store.ledger_entries
            .filter((e: any) => e.business_id === bizId && e.entry_type === 'credit' && e.status === 'posted')
            .reduce((sum: any, e: any) => sum.plus(new Decimal(e.amount)), new Decimal(0));

          return {
            data: {
              total_debits: debits.toString(),
              total_credits: credits.toString()
            },
            error: null
          };
        }

        if (functionName === 'check_trial_balance_integrity') {
          const bizId = params.p_business_id;
          const debits = store.ledger_entries
            .filter((e: any) => e.business_id === bizId && e.entry_type === 'debit' && e.status === 'posted')
            .reduce((sum: any, e: any) => sum.plus(new Decimal(e.amount)), new Decimal(0));
          const credits = store.ledger_entries
            .filter((e: any) => e.business_id === bizId && e.entry_type === 'credit' && e.status === 'posted')
            .reduce((sum: any, e: any) => sum.plus(new Decimal(e.amount)), new Decimal(0));

          return { data: debits.equals(credits), error: null };
        }

        if (functionName === 'get_profit_loss') {
          const bizId = params.p_business_id;
          const branchId = params.p_branch_id;

          const filtered = store.ledger_entries.filter((e: any) =>
            e.business_id === bizId &&
            e.status === 'posted' &&
            (branchId === null || branchId === undefined || e.branch_id === branchId)
          );

          const debits = filtered
            .filter((e: any) => e.entry_type === 'debit')
            .reduce((sum: any, e: any) => sum.plus(new Decimal(e.amount)), new Decimal(0));

          const credits = filtered
            .filter((e: any) => e.entry_type === 'credit')
            .reduce((sum: any, e: any) => sum.plus(new Decimal(e.amount)), new Decimal(0));

          return {
            data: {
              total_expenses: debits.toString(),
              total_revenue: credits.toString()
            },
            error: null
          };
        }

        return { data: null, error: { message: `RPC ${functionName} not implemented in mock` } };
      } catch (err: any) {
        return { data: null, error: { message: err.message || err } };
      }
    }
  }

  // Initialize the store on globalThis immediately during hoisted evaluation
  if (!(globalThis as any).__SUPABASE_STORE__) {
    (globalThis as any).__SUPABASE_STORE__ = {
      client_portals: [],
      portal_sessions: [],
      portal_payment_intents: [],
      invoices: [],
      skus: [],
      ledger_entries: [],
      sync_queue: [],
      accounts: [],
      branches: [],
      karigars: [],
      inter_branch_transfers: [],
    };
  }

  const createClientMockFn = (url: string, key: string, options?: any) => {
    return new SupabaseClientMock(url, key, options);
  };

  (globalThis as any).__CREATE_SUPABASE_MOCK_CLIENT__ = createClientMockFn;

  return {
    createClient: createClientMockFn
  };
});

// Mock @supabase/ssr to forward to @supabase/supabase-js mock
vi.mock('@supabase/ssr', () => {
  return {
    createServerClient: vi.fn().mockImplementation((url: string, key: string, options?: any) => {
      const mockFn = (globalThis as any).__CREATE_SUPABASE_MOCK_CLIENT__;
      if (!mockFn) {
        throw new Error('[Supabase Mock] __CREATE_SUPABASE_MOCK_CLIENT__ not defined on globalThis');
      }
      return mockFn(url, key, options);
    }),
    createBrowserClient: vi.fn().mockImplementation((url: string, key: string, options?: any) => {
      const mockFn = (globalThis as any).__CREATE_SUPABASE_MOCK_CLIENT__;
      if (!mockFn) {
        throw new Error('[Supabase Mock] __CREATE_SUPABASE_MOCK_CLIENT__ not defined on globalThis');
      }
      return mockFn(url, key, options);
    }),
  };
});

// --- Constants ---
export const TEST_BUSINESS_ID = 'test-business-uuid-0001';
export const TEST_BRANCH_HQ = 'test-branch-hq-uuid-001';
export const TEST_BRANCH_02 = 'test-branch-02-uuid-002';
export const TEST_SKU_A = 'test-sku-a-uuid-00001';

// --- Global Store Reset ---
export function resetSupabaseStore() {
  const store = (globalThis as any).__SUPABASE_STORE__;
  if (store) {
    store.client_portals = [];
    store.portal_sessions = [];
    store.portal_payment_intents = [];
    store.invoices = [];
    store.skus = [
      { id: TEST_SKU_A, business_id: TEST_BUSINESS_ID, branch_id: TEST_BRANCH_HQ, sku_code: 'SKU-A', name: 'Industrial Valve A', qty: 100 }
    ];
    store.ledger_entries = [];
    store.sync_queue = [];
    store.accounts = [
      { id: 'bank-acc-uuid', business_id: TEST_BUSINESS_ID, account_code: '1100', account_name: 'Cash/Bank' },
      { id: 'ar-acc-uuid', business_id: TEST_BUSINESS_ID, account_code: '1200', account_name: 'Accounts Receivable' },
      { id: 'some-account-uuid', business_id: TEST_BUSINESS_ID, account_code: 'some-code', account_name: 'Some Account' }
    ];
    store.branches = [
      { id: TEST_BRANCH_HQ, business_id: TEST_BUSINESS_ID, name: 'HQ', code: 'HQ', is_headquarters: true, status: 'active' },
      { id: TEST_BRANCH_02, business_id: TEST_BUSINESS_ID, name: 'Branch 02', code: 'B02', is_headquarters: false, status: 'active' },
    ];
    store.karigars = [];
    store.inter_branch_transfers = [];
  }
}

const TEST_DB_PATH = path.join(os.tmpdir(), `NOXIS-test-${Math.random().toString(36).substring(7)}.db`);
let sqlite: any;
export let testDb: any;

let tcpServer: net.Server;

beforeAll(async () => {
  // 1. Initialize Test DB
  sqlite = new Database(TEST_DB_PATH);
  testDb = drizzle(sqlite, { schema });
  setTestDb(testDb);

  // 2. Apply Migrations
  // Assuming migrations are in src/lib/db/migrations
  await migrate(testDb, { migrationsFolder: path.resolve(__dirname, '../lib/db/migrations') });

  // 3. Seed Minimal Data
  await testDb.insert(schema.branchCache).values([
    { branchId: TEST_BRANCH_HQ, businessId: TEST_BUSINESS_ID, name: 'HQ', code: 'HQ', isHeadquarters: 1 },
    { branchId: TEST_BRANCH_02, businessId: TEST_BUSINESS_ID, name: 'Branch 02', code: 'B02', isHeadquarters: 0 },
  ]);

  await testDb.insert(schema.skuCache).values([
    { skuId: TEST_SKU_A, skuCode: 'SKU-A', name: 'Industrial Valve A', qtyOnHand: '100', branchId: TEST_BRANCH_HQ, barcode: 'BARCODE-001', unit: 'pcs' },
  ]);

  // 4. Start TCP Test Server (OS assigns free port)
  tcpServer = server.createNSPServer();

  await new Promise<void>((resolve) => {
    tcpServer.listen(0, '127.0.0.1', () => {
      const address = tcpServer.address() as net.AddressInfo;
      (globalThis as any).__TCP_PORT__ = address.port;
      resolve();
    });
  });
});

afterAll(async () => {
  // Cleanup
  if (tcpServer) tcpServer.close();
  if (sqlite) sqlite.close();
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
});

beforeEach(async () => {
  resetSupabaseStore();

  // Truncate non-persistent tables
  await testDb.run(sql`DELETE FROM sync_queue`);
  await testDb.run(sql`DELETE FROM mesh_messages`);
  await testDb.run(sql`DELETE FROM tcp_sessions`);

  // Reset SKU quantities to seeded values
  await testDb.update(schema.skuCache)
    .set({ qtyOnHand: '100' })
    .where(sql`sku_id = ${TEST_SKU_A}`);
});
