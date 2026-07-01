import path from 'path'
import { logger } from '../logger'
import fs from 'fs'
import * as schema from './schema'
import { applyProductionPragmas } from './pragmas'

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
          nativeRequire = mod.createRequire(process.cwd() + '/index.js');
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

        // Apply encryption key if present
        if (dbKey) {
          try {
            // Check if DB is already encrypted by trying a simple PRAGMA
            sqlite.pragma(`key = '${dbKey}'`);
            sqlite.prepare('SELECT count(*) FROM sqlite_master').get();
            console.log('[DB] Encryption verified ✓');
          } catch (err) {
            console.log('[DB] Encryption check failed, checking if unencrypted...');
            try {
              // Try without key
              const checkDb = new Database(dbPath, {
                nativeBinding: process.env.BETTER_SQLITE3_BINDING || undefined,
              });
              checkDb.prepare('SELECT count(*) FROM sqlite_master').get();
              checkDb.close();
              
              console.log('[DB] Database is UNENCRYPTED. Triggering in-place encryption...');
              
              sqlite.close(); // Close existing connection
              
              // Open without key to execute rekey
              const migrator = new Database(dbPath, {
                nativeBinding: process.env.BETTER_SQLITE3_BINDING || undefined,
              });
              migrator.pragma(`rekey = '${dbKey}'`);
              migrator.close();
              
              console.log('[DB] Encryption complete. Re-opening encrypted database...');
              
              // Re-open with key
              const newSqlite = new Database(dbPath, {
                verbose: process.env.NODE_ENV === 'development'
                  ? (msg: string) => logger.debug({ msg }, 'sqlite')
                  : undefined,
                nativeBinding: process.env.BETTER_SQLITE3_BINDING || undefined,
              });
              newSqlite.pragma(`key = '${dbKey}'`);
              _db = Object.assign(drizzle(newSqlite, { schema }), { $client: newSqlite });
              if (dbPath !== ':memory:') {
                try { applyProductionPragmas(newSqlite); } catch {}
              }
              return (_db as Record<string | symbol, any>)[prop];
            } catch (migrationErr) {
              console.error('[DB] Migration failed FATAL:', migrationErr);
              console.log('[DB] Deleting corrupt or incompatible database and starting fresh...');
              try {
                sqlite.close();
              } catch {}
              
              let targetDbPath = dbPath;
              try {
                if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
                if (fs.existsSync(dbPath + '-wal')) fs.unlinkSync(dbPath + '-wal');
                if (fs.existsSync(dbPath + '-shm')) fs.unlinkSync(dbPath + '-shm');
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
              _db = Object.assign(drizzle(freshSqlite, { schema }), { $client: freshSqlite });
              if (targetDbPath !== ':memory:') {
                try { applyProductionPragmas(freshSqlite); } catch {}
              }
              return (_db as Record<string | symbol, any>)[prop];
            }
          }
        }
        
        _db = Object.assign(drizzle(sqlite, { schema }), { $client: sqlite });
        
        // Apply production-tuned performance pragmas
        if (dbPath !== ':memory:') {
          try {
            applyProductionPragmas(sqlite);
          } catch (e) {
            console.error("Failed to apply pragmas:", e);
          }
        }
      } catch (err) {
        console.error("Local Database Initialization Failed:", err);
        // Return a mock or throw a meaningful error that routes can catch
        throw new Error("LOCAL_DB_UNAVAILABLE");
      }
    }
    return (_db as Record<string | symbol, any>)[prop];
  }
});

export type DrizzleDB = Record<string, any>;
