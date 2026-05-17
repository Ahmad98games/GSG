import { beforeAll, afterAll, beforeEach, vi } from 'vitest';
import path from 'path';
import os from 'os';
import fs from 'fs';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import net from 'net';
import { createNSPServer } from '@/lib/nsp/server';

// --- Constants ---
export const TEST_BUSINESS_ID = 'test-business-uuid-0001';
export const TEST_BRANCH_HQ = 'test-branch-hq-uuid-001';
export const TEST_BRANCH_02 = 'test-branch-02-uuid-002';
export const TEST_SKU_A = 'test-sku-a-uuid-00001';

const TEST_DB_PATH = path.join(os.tmpdir(), `NOXIS-test-${Math.random().toString(36).substring(7)}.db`);
let sqlite: any;
export let testDb: any;

let tcpServer: net.Server;

beforeAll(async () => {
  // 1. Initialize Test DB
  sqlite = new Database(TEST_DB_PATH);
  testDb = drizzle(sqlite, { schema });

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
  tcpServer = createNSPServer();

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
  // Truncate non-persistent tables
  await testDb.run(sql`DELETE FROM sync_queue`);
  await testDb.run(sql`DELETE FROM mesh_messages`);
  await testDb.run(sql`DELETE FROM tcp_sessions`);

  // Reset SKU quantities to seeded values
  await testDb.update(schema.skuCache)
    .set({ qtyOnHand: '100' })
    .where(sql`sku_id = ${TEST_SKU_A}`);
});

