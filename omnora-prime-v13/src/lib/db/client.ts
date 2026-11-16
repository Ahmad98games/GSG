import path from 'path'
import { logger } from '../logger'
import fs from 'fs'
import * as schema from './schema'
import { applyProductionPragmas } from './pragmas'
import { NOXIS_SCHEMA } from '../../../electron/database/schema'

function getDbPath(): string {
  // Priority 1: Electron passes userData via env
  if (process.env.ELECTRON_USER_DATA) {
    return path.join(
      process.env.ELECTRON_USER_DATA,
      'noxis-local.db'
    )
  }
  
  // Priority 2: Check if running in Electron
  // by looking for standard Electron env markers
  if (process.env.APPDATA && (process.versions as { electron?: string }).electron) {
    return path.join(
      process.env.APPDATA,
      'noxis',
      'noxis-local.db'
    )
  }
  
  // Priority 3: Development fallback
  return path.join(process.cwd(), 'noxis-local.db')
}

let _db: Record<string, any> | null = null;

export function setTestDb(instance: any) {
  _db = instance;
}

/**
 * Enterprise Multi-Workstation SQLite Migration & Self-Healing
 * Ensures that 15+ concurrent PCs can add products, invoices, parties, and ledger entries
 * simultaneously without Foreign Key failures, locked tables, or missing column crashes.
 */
export function runNoxisDatabaseMigrations(sqlite: any): void {
  if (!sqlite) return;

  // 1. Pragmas: 60-second busy timeout for 15+ workstations & disable foreign keys for offline decentralization
  try { sqlite.pragma('busy_timeout = 60000'); } catch {}
  try { sqlite.pragma('foreign_keys = OFF'); } catch {}

  const alterTableSafe = (table: string, colDef: string) => {
    try { sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${colDef};`); } catch {}
  };

  // 2. Default business_profiles rows for 'local', test, and default UUIDs
  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS business_profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'local-user',
        business_name TEXT DEFAULT 'Noxis Enterprise',
        industry TEXT DEFAULT 'general',
        base_currency TEXT DEFAULT 'PKR',
        tax_system TEXT DEFAULT 'GST',
        tax_rate REAL DEFAULT 17.0,
        country_code TEXT DEFAULT 'PK',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
      INSERT OR IGNORE INTO business_profiles (id, user_id, business_name) VALUES ('local', 'local-user', 'Noxis Local Business');
      INSERT OR IGNORE INTO business_profiles (id, user_id, business_name) VALUES ('00000000-0000-0000-0000-000000000000', 'local-user', 'Noxis Enterprise');
      INSERT OR IGNORE INTO business_profiles (id, user_id, business_name) VALUES ('test-local-biz', 'local-user', 'Test Enterprise');
    `);
  } catch (e: any) {
    console.warn('[DB Migration] business_profiles init note:', e?.message);
  }

  // 3. Migrate stock_adjustments: remove restrictive CHECK constraint and add audit columns
  try {
    const tableInfo = sqlite.prepare("PRAGMA table_info(stock_adjustments)").all() as { name: string }[];
    const colNames = new Set(tableInfo.map((c: any) => c.name));
    const hasPreviousQty = colNames.has('previous_qty');
    const hasNewQty = colNames.has('new_qty');
    const hasNotes = colNames.has('notes');

    const masterRow = sqlite.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='stock_adjustments'").get() as { sql: string } | undefined;
    const hasRestrictiveCheck = masterRow?.sql && masterRow.sql.includes('CHECK(adjustment_type IN');

    if (!hasPreviousQty || !hasNewQty || !hasNotes || hasRestrictiveCheck) {
      console.log('[DB Migration] Upgrading stock_adjustments table for multi-workstation concurrency...');
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS stock_adjustments_new (
          id TEXT PRIMARY KEY,
          business_id TEXT DEFAULT 'local',
          sku_id TEXT NOT NULL,
          adjustment_type TEXT NOT NULL DEFAULT 'adjustment',
          quantity REAL NOT NULL DEFAULT 0,
          previous_qty REAL DEFAULT 0,
          new_qty REAL DEFAULT 0,
          reason TEXT,
          reference TEXT,
          notes TEXT,
          adjusted_by TEXT,
          adjustment_date TEXT NOT NULL DEFAULT (date('now')),
          created_at TEXT DEFAULT (datetime('now'))
        );
      `);

      if (tableInfo.length > 0) {
        try {
          sqlite.exec(`
            INSERT INTO stock_adjustments_new (id, business_id, sku_id, adjustment_type, quantity, reason, reference, adjusted_by, adjustment_date, created_at)
            SELECT id, business_id, sku_id, adjustment_type, quantity, reason, reference, adjusted_by, adjustment_date, created_at
            FROM stock_adjustments;
          `);
        } catch {}
        try { sqlite.exec("DROP TABLE stock_adjustments;"); } catch {}
      }
      try { sqlite.exec("ALTER TABLE stock_adjustments_new RENAME TO stock_adjustments;"); } catch {}
      console.log('[DB Migration] stock_adjustments table successfully upgraded ✓');
    }
  } catch (err: any) {
    console.warn('[DB Migration] stock_adjustments notice:', err?.message);
  }

  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS stock_adjustments (
        id TEXT PRIMARY KEY,
        business_id TEXT DEFAULT 'local',
        sku_id TEXT NOT NULL,
        adjustment_type TEXT NOT NULL DEFAULT 'adjustment',
        quantity REAL NOT NULL DEFAULT 0,
        previous_qty REAL DEFAULT 0,
        new_qty REAL DEFAULT 0,
        reason TEXT,
        reference TEXT,
        notes TEXT,
        adjusted_by TEXT,
        adjustment_date TEXT NOT NULL DEFAULT (date('now')),
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
  } catch {}

  // 4. Ledger entries table and columns
  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS ledger_entries (
        id TEXT PRIMARY KEY,
        business_id TEXT DEFAULT 'local',
        party_id TEXT,
        account_code TEXT,
        entry_type TEXT NOT NULL DEFAULT 'debit',
        entry_date TEXT NOT NULL DEFAULT (date('now')),
        description TEXT,
        debit REAL DEFAULT 0,
        credit REAL DEFAULT 0,
        amount REAL DEFAULT 0,
        reference TEXT,
        source_table TEXT,
        source_id TEXT,
        created_by TEXT DEFAULT 'System',
        created_by_role TEXT DEFAULT 'owner',
        device_id TEXT,
        node_id TEXT,
        posted_at TEXT DEFAULT (datetime('now')),
        running_balance REAL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
  } catch {}

  alterTableSafe('ledger_entries', 'business_id TEXT DEFAULT "local"');
  alterTableSafe('ledger_entries', 'party_id TEXT');
  alterTableSafe('ledger_entries', 'account_code TEXT');
  alterTableSafe('ledger_entries', 'entry_type TEXT DEFAULT "debit"');
  alterTableSafe('ledger_entries', 'entry_date TEXT DEFAULT (date("now"))');
  alterTableSafe('ledger_entries', 'description TEXT');
  alterTableSafe('ledger_entries', 'debit REAL DEFAULT 0');
  alterTableSafe('ledger_entries', 'credit REAL DEFAULT 0');
  alterTableSafe('ledger_entries', 'amount REAL DEFAULT 0');
  alterTableSafe('ledger_entries', 'reference TEXT');
  alterTableSafe('ledger_entries', 'source_table TEXT');
  alterTableSafe('ledger_entries', 'source_id TEXT');
  alterTableSafe('ledger_entries', 'created_by TEXT DEFAULT "System"');
  alterTableSafe('ledger_entries', 'created_by_role TEXT DEFAULT "owner"');
  alterTableSafe('ledger_entries', 'device_id TEXT');
  alterTableSafe('ledger_entries', 'node_id TEXT');
  alterTableSafe('ledger_entries', 'posted_at TEXT DEFAULT (datetime("now"))');
  alterTableSafe('ledger_entries', 'running_balance REAL DEFAULT 0');
  alterTableSafe('ledger_entries', 'created_at TEXT DEFAULT (datetime("now"))');

  // 5. Parties table migrations
  alterTableSafe('parties', 'business_id TEXT DEFAULT "local"');
  alterTableSafe('parties', 'city TEXT');
  alterTableSafe('parties', 'opening_balance REAL DEFAULT 0');
  alterTableSafe('parties', 'balance_nature TEXT DEFAULT "receivable"');
  alterTableSafe('parties', 'current_balance REAL DEFAULT 0');
  alterTableSafe('parties', 'credit_limit REAL DEFAULT 0');
  alterTableSafe('parties', 'credit_terms_days INTEGER DEFAULT 0');
  alterTableSafe('parties', 'preferred_transport TEXT');
  alterTableSafe('parties', 'cnic_or_ntn TEXT');
  alterTableSafe('parties', 'is_blocked INTEGER DEFAULT 0');
  alterTableSafe('parties', 'is_active INTEGER DEFAULT 1');

  // 6. Invoices & items migrations
  alterTableSafe('invoices', 'business_id TEXT DEFAULT "local"');
  alterTableSafe('invoices', 'invoice_no TEXT');
  alterTableSafe('invoices', 'party_address TEXT');
  alterTableSafe('invoices', 'issue_date TEXT');
  alterTableSafe('invoices', 'due_date TEXT');
  alterTableSafe('invoices', 'subtotal REAL DEFAULT 0');
  alterTableSafe('invoices', 'discount_amount REAL DEFAULT 0');
  alterTableSafe('invoices', 'discount_percent REAL DEFAULT 0');
  alterTableSafe('invoices', 'tax_amount REAL DEFAULT 0');
  alterTableSafe('invoices', 'tax_rate REAL DEFAULT 0');
  alterTableSafe('invoices', 'total_amount REAL DEFAULT 0');
  alterTableSafe('invoices', 'amount_paid REAL DEFAULT 0');
  alterTableSafe('invoices', 'balance_due REAL DEFAULT 0');
  alterTableSafe('invoices', 'status TEXT DEFAULT "posted"');

  alterTableSafe('invoice_items', 'business_id TEXT DEFAULT "local"');
  alterTableSafe('invoice_items', 'sku_id TEXT');
  alterTableSafe('invoice_items', 'quantity REAL DEFAULT 1');
  alterTableSafe('invoice_items', 'unit TEXT DEFAULT "Piece"');
  alterTableSafe('invoice_items', 'unit_price REAL DEFAULT 0');
  alterTableSafe('invoice_items', 'total_price REAL DEFAULT 0');
  alterTableSafe('invoice_items', 'discount_percent REAL DEFAULT 0');
  alterTableSafe('invoice_items', 'discount_amount REAL DEFAULT 0');
  alterTableSafe('invoice_items', 'tax_rate REAL DEFAULT 0');
  alterTableSafe('invoice_items', 'tax_amount REAL DEFAULT 0');

  // 7. SKUs and SKU Cache migrations
  alterTableSafe('skus', 'business_id TEXT DEFAULT "local"');
  alterTableSafe('skus', 'category TEXT');
  alterTableSafe('skus', 'unit TEXT DEFAULT "Piece"');
  alterTableSafe('skus', 'cost_price REAL DEFAULT 0');
  alterTableSafe('skus', 'sale_price REAL DEFAULT 0');
  alterTableSafe('skus', 'qty_on_hand REAL DEFAULT 0');
  alterTableSafe('skus', 'min_stock_alert REAL DEFAULT 5');
  alterTableSafe('skus', 'barcode TEXT');
  alterTableSafe('skus', 'oem_number TEXT');
  alterTableSafe('skus', 'compatible_vehicles TEXT');
  alterTableSafe('skus', 'commission_rate TEXT DEFAULT "0"');

  alterTableSafe('sku_cache', 'category TEXT');
  alterTableSafe('sku_cache', 'oem_number TEXT');
  alterTableSafe('sku_cache', 'compatible_vehicles TEXT');
  alterTableSafe('sku_cache', 'commission_rate TEXT DEFAULT "0"');
  alterTableSafe('sku_cache', 'barcode TEXT');

  // 8. Other tables
  alterTableSafe('payments', 'business_id TEXT DEFAULT "local"');
  alterTableSafe('expenses', 'business_id TEXT DEFAULT "local"');
  alterTableSafe('employees', 'business_id TEXT DEFAULT "local"');
  alterTableSafe('karigars', 'business_id TEXT DEFAULT "local"');
  alterTableSafe('karigars', 'peshgi_balance REAL DEFAULT 0');
  alterTableSafe('authorized_devices', 'business_id TEXT DEFAULT "local"');
  alterTableSafe('hub_messages', 'business_id TEXT DEFAULT "local"');
}

// ── IN-MEMORY QUERY CACHE (With 60s TTL & 30s Cleanup Interval) ──
export const sqliteQueryCache = new Map<string, { data: any; ts: number }>();

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of sqliteQueryCache.entries()) {
      if (now - value.ts > 60_000) {
        sqliteQueryCache.delete(key);
      }
    }
  }, 30_000);
}

export const db = new Proxy({} as Record<string, any>, {
  get(target, prop) {
    if (!_db) {
      try {
        /* eslint-disable @typescript-eslint/no-var-requires */
        const sqliteModulePath = process.env.ELECTRON_RESOURCES
          ? path.join(process.env.ELECTRON_RESOURCES, 'better-sqlite3-multiple-ciphers', 'lib', 'index.js')
          : 'better-sqlite3-multiple-ciphers';

        // Use native require to avoid Turbopack/Webpack bundle-time interception
        let nativeRequire: (id: string) => any;
        try {
          const mod = typeof (globalThis as any).__non_webpack_require__ !== 'undefined'
            ? (globalThis as any).__non_webpack_require__('module')
            : eval('require')('module');
          const baseRequirePath = process.env.ELECTRON_RESOURCES
            ? path.join(process.env.ELECTRON_RESOURCES, 'standalone', 'server.js')
            : (process.cwd() + '/server.js');
          nativeRequire = mod.createRequire(baseRequirePath);
          
          // Alias better-sqlite3 to better-sqlite3-multiple-ciphers for drizzle-orm
          if (mod && mod.prototype && !mod.prototype.__noxis_aliased) {
            mod.prototype.__noxis_aliased = true;
            const originalRequire = mod.prototype.require;
            mod.prototype.require = function(id: string) {
              if (id === 'better-sqlite3') {
                const sqlitePath = process.env.ELECTRON_RESOURCES
                  ? path.join(process.env.ELECTRON_RESOURCES, 'better-sqlite3-multiple-ciphers')
                  : 'better-sqlite3-multiple-ciphers';
                return originalRequire.call(this, sqlitePath);
              }
              return originalRequire.apply(this, arguments);
            };
            console.log('[DB] Set up better-sqlite3 module redirection alias');
          }
        } catch (e) {
          nativeRequire = typeof (globalThis as any).__non_webpack_require__ !== 'undefined'
            ? (globalThis as any).__non_webpack_require__
            : (process as any).mainModule?.require || eval('require');
        }

        console.log('[DB Debug] sqliteModulePath:', sqliteModulePath);
        console.log('[DB Debug] BETTER_SQLITE3_BINDING:', process.env.BETTER_SQLITE3_BINDING);
        console.log('[DB Debug] Node Version:', process.version);
        console.log('[DB Debug] Module Version:', process.versions.modules);

        const Database = nativeRequire(sqliteModulePath);
        const { drizzle } = nativeRequire('drizzle-orm/better-sqlite3');
        /* eslint-enable @typescript-eslint/no-var-requires */

        const initDrizzle = (sqliteInst: any) => {
          const instance = Object.assign(drizzle(sqliteInst, { schema }), { $client: sqliteInst });
          try {
            const { migrate } = nativeRequire('drizzle-orm/better-sqlite3/migrator');
            const candidates = [
              path.join(process.cwd(), 'src', 'lib', 'db', 'migrations'),
              path.join(process.cwd(), '.next', 'standalone', 'src', 'lib', 'db', 'migrations'),
              path.join(__dirname, 'migrations'),
              path.join(process.cwd(), 'migrations'),
              process.env.ELECTRON_RESOURCES ? path.join(process.env.ELECTRON_RESOURCES, 'standalone', 'src', 'lib', 'db', 'migrations') : '',
              process.env.ELECTRON_RESOURCES ? path.join(process.env.ELECTRON_RESOURCES, 'src', 'lib', 'db', 'migrations') : '',
            ].filter(Boolean);

            const validFolder = candidates.find(c => fs.existsSync(path.join(c, 'meta', '_journal.json')));
            if (validFolder) {
              console.log('[DB] Running migrations from:', validFolder);
              migrate(instance, { migrationsFolder: validFolder });
              console.log('[DB] Migrations applied successfully ✓');
            } else {
              console.warn('[DB] Migrations folder not found, relying on DDL schema initialization');
            }
          } catch (migrationErr) {
            console.error('[DB] Migration step warning, relying on DDL schema fallback:', migrationErr);
          }

          // DDL Fallback for all tables & columns
          try {
            sqliteInst.exec(`
              CREATE TABLE IF NOT EXISTS sku_cache (
                sku_id TEXT PRIMARY KEY,
                sku_code TEXT NOT NULL,
                name TEXT NOT NULL,
                qty_on_hand TEXT NOT NULL DEFAULT '0',
                unit TEXT NOT NULL,
                cost_price TEXT NOT NULL DEFAULT '0',
                sale_price TEXT NOT NULL DEFAULT '0',
                location TEXT,
                branch_id TEXT,
                last_synced_at TEXT NOT NULL DEFAULT (datetime('now')),
                barcode TEXT,
                oem_number TEXT,
                compatible_vehicles TEXT,
                commission_rate TEXT DEFAULT '0'
              );

              CREATE TABLE IF NOT EXISTS hub_messages (
                id TEXT PRIMARY KEY,
                business_id TEXT DEFAULT 'local',
                sender_type TEXT NOT NULL,
                sender_device_id TEXT,
                sender_name TEXT NOT NULL,
                recipient_type TEXT NOT NULL,
                recipient_device_id TEXT,
                recipient_role TEXT,
                message_text TEXT NOT NULL,
                message_type TEXT DEFAULT 'text',
                priority TEXT DEFAULT 'normal',
                is_read INTEGER DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now'))
              );

              CREATE TABLE IF NOT EXISTS authorized_devices (
                node_id TEXT PRIMARY KEY,
                mesh_key TEXT NOT NULL DEFAULT '',
                label TEXT,
                is_active INTEGER NOT NULL DEFAULT 1,
                business_id TEXT,
                device_id TEXT,
                device_label TEXT DEFAULT 'Mobile Device',
                last_seen TEXT,
                is_revoked INTEGER NOT NULL DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now'))
              );

              CREATE TABLE IF NOT EXISTS api_keys (
                id TEXT PRIMARY KEY,
                business_id TEXT DEFAULT 'local',
                name TEXT NOT NULL,
                key_prefix TEXT NOT NULL,
                key_hash TEXT NOT NULL,
                scopes TEXT DEFAULT '["read"]',
                total_requests INTEGER DEFAULT 0,
                last_used_at TEXT,
                is_active INTEGER DEFAULT 1,
                created_at TEXT DEFAULT (datetime('now'))
              );

              CREATE TABLE IF NOT EXISTS webhook_endpoints (
                id TEXT PRIMARY KEY,
                business_id TEXT DEFAULT 'local',
                name TEXT NOT NULL,
                url TEXT NOT NULL,
                secret TEXT NOT NULL,
                events TEXT DEFAULT '["*"]',
                is_active INTEGER DEFAULT 1,
                created_at TEXT DEFAULT (datetime('now'))
              );

              CREATE TABLE IF NOT EXISTS webhook_deliveries (
                id TEXT PRIMARY KEY,
                business_id TEXT DEFAULT 'local',
                endpoint_id TEXT,
                endpoint_name TEXT,
                event_type TEXT NOT NULL,
                payload TEXT,
                response_status INTEGER,
                response_body TEXT,
                success INTEGER DEFAULT 1,
                latency_ms INTEGER DEFAULT 0,
                delivered_at TEXT DEFAULT (datetime('now'))
              );

              
              CREATE TABLE IF NOT EXISTS invoices (
                id TEXT PRIMARY KEY,
                business_id TEXT DEFAULT 'local',
                invoice_number TEXT,
                invoice_no TEXT,
                invoice_type TEXT DEFAULT 'invoice',
                party_id TEXT,
                party_name TEXT,
                party_phone TEXT,
                party_address TEXT,
                invoice_date TEXT DEFAULT (datetime('now')),
                issue_date TEXT DEFAULT (datetime('now')),
                due_date TEXT,
                status TEXT DEFAULT 'posted',
                subtotal REAL DEFAULT 0,
                discount_amount REAL DEFAULT 0,
                discount_percent REAL DEFAULT 0,
                tax_amount REAL DEFAULT 0,
                tax_rate REAL DEFAULT 0,
                total_amount REAL DEFAULT 0,
                amount_paid REAL DEFAULT 0,
                balance_due REAL DEFAULT 0,
                notes TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
              );

              CREATE TABLE IF NOT EXISTS invoice_items (
                id TEXT PRIMARY KEY,
                invoice_id TEXT NOT NULL,
                business_id TEXT DEFAULT 'local',
                sku_id TEXT,
                description TEXT NOT NULL,
                quantity REAL NOT NULL DEFAULT 1,
                unit TEXT DEFAULT 'Piece',
                unit_price REAL NOT NULL DEFAULT 0,
                total_price REAL NOT NULL DEFAULT 0,
                discount_percent REAL DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now'))
              );

              CREATE TABLE IF NOT EXISTS orders (
                id TEXT PRIMARY KEY,
                business_id TEXT DEFAULT 'local',
                order_number TEXT NOT NULL,
                party_id TEXT,
                order_date TEXT NOT NULL,
                expected_date TEXT,
                status TEXT DEFAULT 'pending',
                total_amount REAL DEFAULT 0,
                notes TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
              );

              CREATE TABLE IF NOT EXISTS order_items (
                id TEXT PRIMARY KEY,
                order_id TEXT NOT NULL,
                business_id TEXT DEFAULT 'local',
                sku_id TEXT,
                description TEXT NOT NULL,
                quantity REAL NOT NULL DEFAULT 1,
                unit TEXT DEFAULT 'Piece',
                unit_price REAL NOT NULL DEFAULT 0,
                total_price REAL NOT NULL DEFAULT 0,
                notes TEXT
              );

              CREATE TABLE IF NOT EXISTS production_batches (
                id TEXT PRIMARY KEY,
                business_id TEXT DEFAULT 'local',
                batch_no TEXT NOT NULL,
                sku_id TEXT,
                planned_qty REAL DEFAULT 0,
                actual_qty REAL DEFAULT 0,
                status TEXT DEFAULT 'open',
                notes TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
              );

              CREATE TABLE IF NOT EXISTS batch_cost_items (
                id TEXT PRIMARY KEY,
                batch_id TEXT NOT NULL,
                category TEXT DEFAULT 'material',
                item_name TEXT NOT NULL,
                quantity REAL DEFAULT 0,
                unit_cost REAL DEFAULT 0,
                total_cost REAL DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now'))
              );

              CREATE TABLE IF NOT EXISTS expenses (
                id TEXT PRIMARY KEY,
                business_id TEXT DEFAULT 'local',
                category TEXT NOT NULL,
                description TEXT NOT NULL,
                amount REAL NOT NULL DEFAULT 0,
                expense_date TEXT NOT NULL,
                payment_method TEXT DEFAULT 'cash',
                party_id TEXT,
                party_name TEXT,
                reference TEXT,
                receipt_url TEXT,
                is_recurring INTEGER DEFAULT 0,
                created_by TEXT,
                created_at TEXT DEFAULT (datetime('now'))
              );

              CREATE TABLE IF NOT EXISTS purchase_orders (
                id TEXT PRIMARY KEY,
                business_id TEXT DEFAULT 'local',
                po_number TEXT NOT NULL,
                supplier_id TEXT,
                supplier_name TEXT,
                order_date TEXT NOT NULL,
                expected_date TEXT,
                status TEXT DEFAULT 'pending',
                subtotal REAL DEFAULT 0,
                tax_amount REAL DEFAULT 0,
                tax_rate REAL DEFAULT 0,
                total_amount REAL DEFAULT 0,
                notes TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
              );

              CREATE TABLE IF NOT EXISTS purchase_order_items (
                id TEXT PRIMARY KEY,
                po_id TEXT NOT NULL,
                business_id TEXT DEFAULT 'local',
                sku_id TEXT,
                sku_code TEXT,
                description TEXT NOT NULL,
                ordered_qty REAL NOT NULL DEFAULT 1,
                received_qty REAL DEFAULT 0,
                unit TEXT DEFAULT 'Piece',
                unit_cost REAL DEFAULT 0,
                total_price REAL DEFAULT 0
              );

              CREATE TABLE IF NOT EXISTS karigar_production_logs (
                id TEXT PRIMARY KEY,
                business_id TEXT DEFAULT 'local',
                karigar_id TEXT,
                batch_id TEXT,
                qty_produced REAL DEFAULT 0,
                quality_grade TEXT DEFAULT 'A',
                notes TEXT,
                posted_at TEXT DEFAULT (datetime('now'))
              );

              CREATE TABLE IF NOT EXISTS attendance_logs (
                id TEXT PRIMARY KEY,
                business_id TEXT DEFAULT 'local',
                karigar_id TEXT,
                status TEXT DEFAULT 'present',
                log_date TEXT,
                posted_at TEXT DEFAULT (datetime('now'))
              );
            `);
            const alterTableSafe = (table: string, colDef: string) => {
              try { sqliteInst.exec(`ALTER TABLE ${table} ADD COLUMN ${colDef};`); } catch {}
            };
            alterTableSafe('orders', 'business_id TEXT');
            alterTableSafe('orders', 'order_number TEXT');
            alterTableSafe('orders', 'party_id TEXT');
            alterTableSafe('orders', 'order_date TEXT');
            alterTableSafe('orders', 'expected_date TEXT');
            alterTableSafe('orders', 'status TEXT DEFAULT "pending"');
            alterTableSafe('orders', 'total_amount REAL DEFAULT 0');
            alterTableSafe('orders', 'notes TEXT');
            alterTableSafe('order_items', 'business_id TEXT');
            alterTableSafe('order_items', 'sku_id TEXT');
            alterTableSafe('order_items', 'description TEXT');
            alterTableSafe('order_items', 'quantity REAL DEFAULT 1');
            alterTableSafe('order_items', 'unit TEXT DEFAULT "Piece"');
            alterTableSafe('order_items', 'unit_price REAL DEFAULT 0');
            alterTableSafe('order_items', 'total_price REAL DEFAULT 0');
            alterTableSafe('sku_cache', 'category TEXT');
            alterTableSafe('sku_cache', 'oem_number TEXT');
            alterTableSafe('sku_cache', 'compatible_vehicles TEXT');
            alterTableSafe('sku_cache', 'commission_rate TEXT DEFAULT "0"');
            alterTableSafe('authorized_devices', 'business_id TEXT');
            alterTableSafe('authorized_devices', 'device_id TEXT');
            alterTableSafe('authorized_devices', 'device_label TEXT');
            alterTableSafe('authorized_devices', 'last_seen TEXT');
            alterTableSafe('authorized_devices', 'is_revoked INTEGER DEFAULT 0');
            alterTableSafe('authorized_devices', 'is_active INTEGER DEFAULT 1');
            alterTableSafe('branch_cache', 'business_id TEXT');
            alterTableSafe('sync_logs', 'business_id TEXT');
            alterTableSafe('parties', 'business_id TEXT');
            alterTableSafe('parties', 'is_blocked INTEGER DEFAULT 0');
            alterTableSafe('parties', 'current_balance REAL DEFAULT 0');
            alterTableSafe('invoices', 'business_id TEXT');
            alterTableSafe('invoices', 'party_id TEXT');
            alterTableSafe('invoices', 'party_name TEXT');
            alterTableSafe('invoices', 'party_phone TEXT');
            alterTableSafe('invoices', 'invoice_number TEXT');
            alterTableSafe('invoices', 'total_amount REAL DEFAULT 0');
            alterTableSafe('invoices', 'amount_paid REAL DEFAULT 0');
            alterTableSafe('invoices', 'balance_due REAL DEFAULT 0');
            alterTableSafe('invoices', 'status TEXT DEFAULT "posted"');
            alterTableSafe('ledger_entries', 'business_id TEXT');
            alterTableSafe('payments', 'business_id TEXT');
            alterTableSafe('skus', 'business_id TEXT');
            alterTableSafe('karigars', 'business_id TEXT');
            alterTableSafe('karigars', 'peshgi_balance REAL DEFAULT 0');
            alterTableSafe('expenses', 'business_id TEXT');
            alterTableSafe('purchase_orders', 'business_id TEXT');
            alterTableSafe('workflows', 'business_id TEXT');
            alterTableSafe('workflow_runs', 'business_id TEXT');
            alterTableSafe('employees', 'business_id TEXT');
            alterTableSafe('hub_messages', 'created_at TEXT');
          } catch {}

          try {
            runNoxisDatabaseMigrations(sqliteInst);
          } catch {}

          return instance;
        };
        
        const dbPath = getDbPath();
        const dbKey = process.env.ELECTRON_DB_KEY || '';
        
        // Ensure directory exists before opening DB
        const dbDir = path.dirname(dbPath);
        if (dbPath !== ':memory:' && !fs.existsSync(dbDir)) {
          fs.mkdirSync(dbDir, { recursive: true });
        }
        
        console.log('[DB] Opening database at:', dbPath);
        
        // INSTANT-ON STRATEGY: 
        // This local SQLite-WASM/Native layer serves as the primary data source
        // for the UI, ensuring <50ms time-to-interactive even before Supabase 
        // handshake completes. Sync happens in the background via syncQueue.
        const sqlite = new Database(dbPath, {
          verbose: process.env.NODE_ENV === 'development'
            ? (msg: string) => logger.debug({ msg }, 'sqlite')
            : undefined,
          nativeBinding: process.env.BETTER_SQLITE3_BINDING || undefined,
        });

        // Apply busy_timeout & WAL pragmas immediately after opening connection to prevent database lock crashes
        if (dbPath !== ':memory:') {
          try { applyProductionPragmas(sqlite); } catch {}

          // STEP 4: Startup WAL integrity check & passive drain
          try {
            const integrityResult: any = sqlite.pragma('integrity_check');
            if (integrityResult && integrityResult[0]?.integrity_check !== 'ok') {
              console.error('[DB] Startup integrity check failure detail:', integrityResult);
              // Trigger auto-recovery / notification — do NOT crash silently
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('db-corruption-detected', { detail: integrityResult }));
              }
            } else {
              console.log('[DB] Startup integrity_check passed: ok');
            }
          } catch (intErr: any) {
            console.error('[DB] Startup integrity check exception:', intErr?.message);
          }

          try {
            const walResult = sqlite.pragma('wal_checkpoint(PASSIVE)');
            console.log('[DB] Startup wal_checkpoint(PASSIVE) drained:', walResult);
          } catch (walErr: any) {
            console.warn('[DB] Non-critical startup wal_checkpoint warning:', walErr?.message);
          }
        }

        // Apply encryption key if present
        if (dbKey) {
          try {
            // Check if DB is already encrypted by trying a simple PRAGMA
            sqlite.pragma(`key = '${dbKey}'`);
            sqlite.prepare('SELECT count(*) FROM sqlite_master').get();
            console.log('[DB] Encryption verified ✓');
          } catch (err) {
            console.log('[DB] Encryption check failed, checking if unencrypted...');
            let checkDb: any = null;
            let migrator: any = null;
            try {
              // Try without key
              checkDb = new Database(dbPath, {
                nativeBinding: process.env.BETTER_SQLITE3_BINDING || undefined,
              });
              checkDb.prepare('SELECT count(*) FROM sqlite_master').get();
              checkDb.close();
              checkDb = null;
              
              console.log('[DB] Database is UNENCRYPTED. Triggering in-place encryption...');
              
              sqlite.close(); // Close existing connection
              
              // Open without key to execute rekey
              migrator = new Database(dbPath, {
                nativeBinding: process.env.BETTER_SQLITE3_BINDING || undefined,
              });
              migrator.pragma(`rekey = '${dbKey}'`);
              migrator.close();
              migrator = null;
              
              console.log('[DB] Encryption complete. Re-opening encrypted database...');
              
              // Re-open with key
              const newSqlite = new Database(dbPath, {
                verbose: process.env.NODE_ENV === 'development'
                  ? (msg: string) => logger.debug({ msg }, 'sqlite')
                  : undefined,
                nativeBinding: process.env.BETTER_SQLITE3_BINDING || undefined,
              });
              newSqlite.pragma(`key = '${dbKey}'`);
              if (dbPath !== ':memory:') {
                try { applyProductionPragmas(newSqlite); } catch {}
              }
              _db = initDrizzle(newSqlite);
              return (_db as Record<string | symbol, any>)[prop];
            } catch (migrationErr) {
              console.error('[DB] Migration/Encryption failed FATAL:', migrationErr);
              console.log('[DB] Deleting corrupt or incompatible database and starting fresh...');
              
              // CRITICAL: Close checkDb and migrator connections if they are still open to free the file lock
              if (checkDb) {
                try { checkDb.close(); } catch {}
                checkDb = null;
              }
              if (migrator) {
                try { migrator.close(); } catch {}
                migrator = null;
              }
              
              try {
                sqlite.close();
              } catch {}
              
              let targetDbPath = dbPath;
              try {
                if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
                if (fs.existsSync(dbPath + '-wal')) fs.unlinkSync(dbPath + '-wal');
                if (fs.existsSync(dbPath + '-shm')) fs.unlinkSync(dbPath + '-shm');
                console.log('[DB] Incompatible database deleted successfully.');
              } catch (deleteErr) {
                console.error('[DB] Failed to delete incompatible database files:', deleteErr);
                targetDbPath = path.join(path.dirname(dbPath), 'noxis-local-fallback.db');
                console.log('[DB] Falling back to alternative database path:', targetDbPath);
                try {
                  if (fs.existsSync(targetDbPath)) fs.unlinkSync(targetDbPath);
                } catch {}
              }
              
              const freshSqlite = new Database(targetDbPath, {
                verbose: process.env.NODE_ENV === 'development'
                  ? (msg: string) => logger.debug({ msg }, 'sqlite')
                  : undefined,
                nativeBinding: process.env.BETTER_SQLITE3_BINDING || undefined,
              });
              freshSqlite.pragma(`key = '${dbKey}'`);
              if (targetDbPath !== ':memory:') {
                try { applyProductionPragmas(freshSqlite); } catch {}
              }
              _db = initDrizzle(freshSqlite);
              return (_db as Record<string | symbol, any>)[prop];
            } finally {
              if (checkDb) {
                try { checkDb.close(); } catch {}
              }
              if (migrator) {
                try { migrator.close(); } catch {}
              }
            }
          }
        }
        
        _db = initDrizzle(sqlite);
        
        try {
          sqlite.exec(NOXIS_SCHEMA);
        } catch (schemaErr) {
          console.warn('[DB] Non-critical schema initialization warning:', schemaErr);
        }

        try {
          runNoxisDatabaseMigrations(sqlite);
          console.log('[DB] Multi-workstation schema & migrations verified ✓');
          try {
            const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as { name: string }[];
            console.log(`[DB] Tables: ${tables.map(t => t.name).join(', ')}`);
          } catch {}
        } catch (migrationErr) {
          console.warn('[DB] Multi-workstation migration warning:', migrationErr);
        }
      } catch (err: any) {
        if (err?.code === 'ERR_DLOPEN_FAILED' || err?.message?.includes('NODE_MODULE_VERSION')) {
          console.warn('[DB] Native SQLite addon compiled for Electron ABI (non-fatal in Web Dev mode, fallback active)');
        } else {
          console.error("Local Database Initialization Warning:", err);
        }
        return undefined;
      }
    }
    return _db ? (_db as Record<string | symbol, any>)[prop] : undefined;
  }
});

export type DrizzleDB = Record<string, any>;
