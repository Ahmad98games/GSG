"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.setTestDb = setTestDb;
const path_1 = __importDefault(require("path"));
const logger_1 = require("../logger");
const fs_1 = __importDefault(require("fs"));
const schema = __importStar(require("./schema"));
const pragmas_1 = require("./pragmas");
const schema_1 = require("../../../electron/database/schema");
function getDbPath() {
    // Priority 1: Electron passes userData via env
    if (process.env.ELECTRON_USER_DATA) {
        return path_1.default.join(process.env.ELECTRON_USER_DATA, 'noxis-local.db');
    }
    // Priority 2: Check if running in Electron
    // by looking for standard Electron env markers
    if (process.env.APPDATA && process.versions.electron) {
        return path_1.default.join(process.env.APPDATA, 'noxis', 'noxis-local.db');
    }
    // Priority 3: Development fallback
    return path_1.default.join(process.cwd(), 'noxis-local.db');
}
let _db = null;
function setTestDb(instance) {
    _db = instance;
}
exports.db = new Proxy({}, {
    get(target, prop) {
        if (!_db) {
            try {
                /* eslint-disable @typescript-eslint/no-var-requires */
                const sqliteModulePath = process.env.ELECTRON_RESOURCES
                    ? path_1.default.join(process.env.ELECTRON_RESOURCES, 'better-sqlite3-multiple-ciphers', 'lib', 'index.js')
                    : 'better-sqlite3-multiple-ciphers';
                // Use native require to avoid Turbopack/Webpack bundle-time interception
                let nativeRequire;
                try {
                    const mod = typeof globalThis.__non_webpack_require__ !== 'undefined'
                        ? globalThis.__non_webpack_require__('module')
                        : eval('require')('module');
                    const baseRequirePath = process.env.ELECTRON_RESOURCES
                        ? path_1.default.join(process.env.ELECTRON_RESOURCES, 'standalone', 'server.js')
                        : (process.cwd() + '/server.js');
                    nativeRequire = mod.createRequire(baseRequirePath);
                    // Alias better-sqlite3 to better-sqlite3-multiple-ciphers for drizzle-orm
                    if (mod && mod.prototype && !mod.prototype.__noxis_aliased) {
                        mod.prototype.__noxis_aliased = true;
                        const originalRequire = mod.prototype.require;
                        mod.prototype.require = function (id) {
                            if (id === 'better-sqlite3') {
                                const sqlitePath = process.env.ELECTRON_RESOURCES
                                    ? path_1.default.join(process.env.ELECTRON_RESOURCES, 'better-sqlite3-multiple-ciphers')
                                    : 'better-sqlite3-multiple-ciphers';
                                return originalRequire.call(this, sqlitePath);
                            }
                            return originalRequire.apply(this, arguments);
                        };
                        console.log('[DB] Set up better-sqlite3 module redirection alias');
                    }
                }
                catch (e) {
                    nativeRequire = typeof globalThis.__non_webpack_require__ !== 'undefined'
                        ? globalThis.__non_webpack_require__
                        : process.mainModule?.require || eval('require');
                }
                console.log('[DB Debug] sqliteModulePath:', sqliteModulePath);
                console.log('[DB Debug] BETTER_SQLITE3_BINDING:', process.env.BETTER_SQLITE3_BINDING);
                console.log('[DB Debug] Node Version:', process.version);
                console.log('[DB Debug] Module Version:', process.versions.modules);
                const Database = nativeRequire(sqliteModulePath);
                const { drizzle } = nativeRequire('drizzle-orm/better-sqlite3');
                /* eslint-enable @typescript-eslint/no-var-requires */
                const initDrizzle = (sqliteInst) => {
                    const instance = Object.assign(drizzle(sqliteInst, { schema }), { $client: sqliteInst });
                    try {
                        const { migrate } = nativeRequire('drizzle-orm/better-sqlite3/migrator');
                        const candidates = [
                            path_1.default.join(process.cwd(), 'src', 'lib', 'db', 'migrations'),
                            path_1.default.join(process.cwd(), '.next', 'standalone', 'src', 'lib', 'db', 'migrations'),
                            path_1.default.join(__dirname, 'migrations'),
                            path_1.default.join(process.cwd(), 'migrations'),
                            process.env.ELECTRON_RESOURCES ? path_1.default.join(process.env.ELECTRON_RESOURCES, 'standalone', 'src', 'lib', 'db', 'migrations') : '',
                            process.env.ELECTRON_RESOURCES ? path_1.default.join(process.env.ELECTRON_RESOURCES, 'src', 'lib', 'db', 'migrations') : '',
                        ].filter(Boolean);
                        const validFolder = candidates.find(c => fs_1.default.existsSync(path_1.default.join(c, 'meta', '_journal.json')));
                        if (validFolder) {
                            console.log('[DB] Running migrations from:', validFolder);
                            migrate(instance, { migrationsFolder: validFolder });
                            console.log('[DB] Migrations applied successfully ✓');
                        }
                        else {
                            console.warn('[DB] Migrations folder not found, relying on DDL schema initialization');
                        }
                    }
                    catch (migrationErr) {
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
            `);
                        const alterTableSafe = (table, colDef) => {
                            try {
                                sqliteInst.exec(`ALTER TABLE ${table} ADD COLUMN ${colDef};`);
                            }
                            catch { }
                        };
                        alterTableSafe('sku_cache', 'oem_number TEXT');
                        alterTableSafe('sku_cache', 'compatible_vehicles TEXT');
                        alterTableSafe('sku_cache', 'commission_rate TEXT DEFAULT "0"');
                        alterTableSafe('auth_devices', 'business_id TEXT');
                        alterTableSafe('branch_cache', 'business_id TEXT');
                        alterTableSafe('sync_logs', 'business_id TEXT');
                        alterTableSafe('parties', 'business_id TEXT');
                        alterTableSafe('parties', 'is_blocked INTEGER DEFAULT 0');
                        alterTableSafe('invoices', 'business_id TEXT');
                        alterTableSafe('ledger_entries', 'business_id TEXT');
                        alterTableSafe('payments', 'business_id TEXT');
                        alterTableSafe('skus', 'business_id TEXT');
                        alterTableSafe('karigars', 'business_id TEXT');
                        alterTableSafe('expenses', 'business_id TEXT');
                        alterTableSafe('purchase_orders', 'business_id TEXT');
                        alterTableSafe('workflows', 'business_id TEXT');
                        alterTableSafe('workflow_runs', 'business_id TEXT');
                        alterTableSafe('employees', 'business_id TEXT');
                    }
                    catch { }
                    return instance;
                };
                const dbPath = getDbPath();
                const dbKey = process.env.ELECTRON_DB_KEY || '';
                // Ensure directory exists before opening DB
                const dbDir = path_1.default.dirname(dbPath);
                if (dbPath !== ':memory:' && !fs_1.default.existsSync(dbDir)) {
                    fs_1.default.mkdirSync(dbDir, { recursive: true });
                }
                console.log('[DB] Opening database at:', dbPath);
                // INSTANT-ON STRATEGY: 
                // This local SQLite-WASM/Native layer serves as the primary data source
                // for the UI, ensuring <50ms time-to-interactive even before Supabase 
                // handshake completes. Sync happens in the background via syncQueue.
                const sqlite = new Database(dbPath, {
                    verbose: process.env.NODE_ENV === 'development'
                        ? (msg) => logger_1.logger.debug({ msg }, 'sqlite')
                        : undefined,
                    nativeBinding: process.env.BETTER_SQLITE3_BINDING || undefined,
                });
                // Apply busy_timeout & WAL pragmas immediately after opening connection to prevent database lock crashes
                if (dbPath !== ':memory:') {
                    try {
                        (0, pragmas_1.applyProductionPragmas)(sqlite);
                    }
                    catch { }
                }
                // Apply encryption key if present
                if (dbKey) {
                    try {
                        // Check if DB is already encrypted by trying a simple PRAGMA
                        sqlite.pragma(`key = '${dbKey}'`);
                        sqlite.prepare('SELECT count(*) FROM sqlite_master').get();
                        console.log('[DB] Encryption verified ✓');
                    }
                    catch (err) {
                        console.log('[DB] Encryption check failed, checking if unencrypted...');
                        let checkDb = null;
                        let migrator = null;
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
                                    ? (msg) => logger_1.logger.debug({ msg }, 'sqlite')
                                    : undefined,
                                nativeBinding: process.env.BETTER_SQLITE3_BINDING || undefined,
                            });
                            newSqlite.pragma(`key = '${dbKey}'`);
                            if (dbPath !== ':memory:') {
                                try {
                                    (0, pragmas_1.applyProductionPragmas)(newSqlite);
                                }
                                catch { }
                            }
                            _db = initDrizzle(newSqlite);
                            return _db[prop];
                        }
                        catch (migrationErr) {
                            console.error('[DB] Migration/Encryption failed FATAL:', migrationErr);
                            console.log('[DB] Deleting corrupt or incompatible database and starting fresh...');
                            // CRITICAL: Close checkDb and migrator connections if they are still open to free the file lock
                            if (checkDb) {
                                try {
                                    checkDb.close();
                                }
                                catch { }
                                checkDb = null;
                            }
                            if (migrator) {
                                try {
                                    migrator.close();
                                }
                                catch { }
                                migrator = null;
                            }
                            try {
                                sqlite.close();
                            }
                            catch { }
                            let targetDbPath = dbPath;
                            try {
                                if (fs_1.default.existsSync(dbPath))
                                    fs_1.default.unlinkSync(dbPath);
                                if (fs_1.default.existsSync(dbPath + '-wal'))
                                    fs_1.default.unlinkSync(dbPath + '-wal');
                                if (fs_1.default.existsSync(dbPath + '-shm'))
                                    fs_1.default.unlinkSync(dbPath + '-shm');
                                console.log('[DB] Incompatible database deleted successfully.');
                            }
                            catch (deleteErr) {
                                console.error('[DB] Failed to delete incompatible database files:', deleteErr);
                                targetDbPath = path_1.default.join(path_1.default.dirname(dbPath), 'noxis-local-fallback.db');
                                console.log('[DB] Falling back to alternative database path:', targetDbPath);
                                try {
                                    if (fs_1.default.existsSync(targetDbPath))
                                        fs_1.default.unlinkSync(targetDbPath);
                                }
                                catch { }
                            }
                            const freshSqlite = new Database(targetDbPath, {
                                verbose: process.env.NODE_ENV === 'development'
                                    ? (msg) => logger_1.logger.debug({ msg }, 'sqlite')
                                    : undefined,
                                nativeBinding: process.env.BETTER_SQLITE3_BINDING || undefined,
                            });
                            freshSqlite.pragma(`key = '${dbKey}'`);
                            if (targetDbPath !== ':memory:') {
                                try {
                                    (0, pragmas_1.applyProductionPragmas)(freshSqlite);
                                }
                                catch { }
                            }
                            _db = initDrizzle(freshSqlite);
                            return _db[prop];
                        }
                        finally {
                            if (checkDb) {
                                try {
                                    checkDb.close();
                                }
                                catch { }
                            }
                            if (migrator) {
                                try {
                                    migrator.close();
                                }
                                catch { }
                            }
                        }
                    }
                }
                _db = initDrizzle(sqlite);
                try {
                    sqlite.exec(schema_1.NOXIS_SCHEMA);
                    // Auto-migrate missing columns for existing local databases
                    const alterTableSafe = (table, colDef) => {
                        try {
                            sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${colDef};`);
                        }
                        catch { }
                    };
                    alterTableSafe('parties', 'business_id TEXT');
                    alterTableSafe('parties', 'is_blocked INTEGER DEFAULT 0');
                    alterTableSafe('invoices', 'business_id TEXT');
                    alterTableSafe('ledger_entries', 'business_id TEXT');
                    alterTableSafe('payments', 'business_id TEXT');
                    alterTableSafe('skus', 'business_id TEXT');
                    alterTableSafe('karigars', 'business_id TEXT');
                    alterTableSafe('expenses', 'business_id TEXT');
                    console.log('[DB] Schema applied & column migrations verified ✓');
                    try {
                        const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
                        console.log(`[DB] Tables: ${tables.map(t => t.name).join(', ')}`);
                    }
                    catch { }
                }
                catch (schemaErr) {
                    console.warn('[DB] Non-critical schema initialization warning:', schemaErr);
                }
            }
            catch (err) {
                console.error("Local Database Initialization Warning:", err);
                return undefined;
            }
        }
        return _db ? _db[prop] : undefined;
    }
});
