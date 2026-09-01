export function applyProductionPragmas(sqlite: any) {
  // Set 10-second busy timeout to wait for locks instead of throwing SQLITE_ERROR
  try { sqlite.pragma('busy_timeout = 10000'); } catch {}
  // WAL mode: concurrent reads during writes
  try { sqlite.pragma('journal_mode = WAL'); } catch {}
  // Synchronous NORMAL: safe + fast
  try { sqlite.pragma('synchronous = NORMAL'); } catch {}
  // 64MB cache
  try { sqlite.pragma('cache_size = -65536'); } catch {}
  // Memory-mapped I/O: 256MB
  try { sqlite.pragma('mmap_size = 268435456'); } catch {}
  // Temp tables in memory
  try { sqlite.pragma('temp_store = MEMORY'); } catch {}
  // Foreign keys enforced
  try { sqlite.pragma('foreign_keys = ON'); } catch {}
  // Page size optimized for SSD
  try { sqlite.pragma('page_size = 4096'); } catch {}
  // Auto-checkpoint WAL at 1000 pages
  try { sqlite.pragma('wal_autocheckpoint = 1000'); } catch {}
}
