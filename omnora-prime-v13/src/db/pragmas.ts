import { Database } from 'better-sqlite3';

/**
 * Noxis Hub — SQLite WAL Performance & Crash Safety Pragmas
 * Applied in exact required order every time the database opens.
 */
export function applyProductionPragmas(db: Database): void {
  // 1. WAL mode: readers never block writers, writers never block readers. Power cut safe.
  db.pragma('journal_mode = WAL');

  // 2. synchronous NORMAL: data safe on power cut, 3x faster than FULL.
  db.pragma('synchronous = NORMAL');

  // 3. cache_size -64000: 64MB page cache in memory. Hot data never hits disk.
  db.pragma('cache_size = -64000');

  // 4. temp_store MEMORY: temp tables in RAM not disk.
  db.pragma('temp_store = MEMORY');

  // 5. mmap_size 268435456: 256MB memory mapped IO. OS-level reads, zero syscall overhead.
  db.pragma('mmap_size = 268435456');

  // 6. page_size 4096: Optimized filesystem block size.
  db.pragma('page_size = 4096');

  // 7. wal_autocheckpoint 1000: WAL file folds back into main DB every 1000 pages.
  db.pragma('wal_autocheckpoint = 1000');

  // 8. busy_timeout 5000: Instead of SQLITE_BUSY crash, wait 5 seconds and retry.
  db.pragma('busy_timeout = 5000');

  // 9. foreign_keys ON: Foreign keys strictly enforced.
  db.pragma('foreign_keys = ON');

  // 10. optimize: Updates internal query planner statistics.
  db.pragma('optimize');
}
