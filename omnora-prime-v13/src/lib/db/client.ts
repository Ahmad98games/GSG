import path from 'path'
import { logger } from '../logger'

import fs from 'fs'

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

export const db = new Proxy({} as Record<string, any>, {
  get(target, prop) {
    if (!_db) {
      try {
        /* eslint-disable @typescript-eslint/no-var-requires */
        const Database = require('better-sqlite3-multiple-ciphers');
        const { drizzle } = require('drizzle-orm/better-sqlite3');
        const schema = require('./schema');
        const { applyProductionPragmas } = require('./pragmas');
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
              const checkDb = new Database(dbPath);
              checkDb.prepare('SELECT count(*) FROM sqlite_master').get();
              checkDb.close();
              
              console.log('[DB] Database is UNENCRYPTED. Triggering migration...');
              /* eslint-disable @typescript-eslint/no-var-requires */
              const { migrateToEncrypted } = require('./migrateToEncrypted');
              /* eslint-enable @typescript-eslint/no-var-requires */
              const tempPath = dbPath + '.encrypted';
              const backupPath = dbPath + '.bak';
              
              // This is synchronous in our context but migrateToEncrypted is currently async in definition
              // We'll wrap it or use a sync version if needed. 
              // For simplicity in this proxy, we'll assume the caller can handle the migration.
              // Actually, SQLCipher export is very fast.
              
              sqlite.close(); // Close existing connection
              
              // Perform migration
              // Note: Using require here to avoid circular dependencies or early loads
              /* eslint-disable @typescript-eslint/no-var-requires */
              const fs = require('fs');
              /* eslint-enable @typescript-eslint/no-var-requires */
              const oldPath = dbPath;
              const newPath = tempPath;
              
              // Run migration (simplified for sync context)
              const migrator = new Database(oldPath);
              migrator.exec(`ATTACH DATABASE '${newPath}' AS encrypted KEY '${dbKey}'`);
              migrator.exec(`SELECT sqlcipher_export('encrypted')`);
              migrator.exec(`DETACH DATABASE encrypted`);
              migrator.close();
              
              // Swap files
              fs.renameSync(oldPath, backupPath);
              fs.renameSync(newPath, oldPath);
              
              console.log('[DB] Migration complete. Re-opening encrypted database...');
              
              // Re-open
              const newSqlite = new Database(dbPath);
              newSqlite.pragma(`key = '${dbKey}'`);
              _db = Object.assign(drizzle(newSqlite, { schema }), { $client: newSqlite });
              return (_db as Record<string | symbol, any>)[prop];
            } catch (migrationErr) {
              console.error('[DB] Migration failed FATAL:', migrationErr);
              throw migrationErr;
            }
          }
        }
        
        _db = Object.assign(drizzle(sqlite, { schema }), { $client: sqlite });
        
        // Apply production-tuned performance pragmas
        if (dbPath !== ':memory:') {
          try {
            applyProductionPragmas();
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
