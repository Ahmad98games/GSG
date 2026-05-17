import { Database } from 'better-sqlite3';

/**
 * Noxis v13.0 — SQLite Production Pragmas
 * Optimized for factory-floor PC hardware (i5/8GB RAM baseline).
 */
export function applyProductionPragmas(db: Database): void {
  // WAL mode: Allows concurrent reads during writes (critical for hub multi-threading)
  db.pragma('journal_mode = WAL');

  // Synchronous NORMAL: Faster than FULL, safe for WAL mode.
  // Syncs at checkpoints instead of every write.
  db.pragma('synchronous = NORMAL');

  // Cache size: -32000 KiB = 32MB. 
  // Larger cache for 100k+ row financial ledgers.
  db.pragma('cache_size = -32000');

  // Memory-mapped I/O: 256MB. 
  // Speeds up read-heavy queries by using OS-level file mapping.
  db.pragma('mmap_size = 268435456');

  // Temp storage in memory for faster sort/group operations in reports.
  db.pragma('temp_store = MEMORY');

  // Ensure foreign keys are strictly enforced.
  db.pragma('foreign_keys = ON');

  // Standard WAL auto-checkpoint at 1000 pages.
  db.pragma('wal_autocheckpoint = 1000');
}

