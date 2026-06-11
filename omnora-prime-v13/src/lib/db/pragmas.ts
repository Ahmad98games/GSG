export function applyProductionPragmas(sqlite: any) {
  // WAL mode: concurrent reads during writes
  sqlite.pragma('journal_mode = WAL')
  // Synchronous NORMAL: safe + fast (not FULL)
  sqlite.pragma('synchronous = NORMAL')
  // 64MB cache (low-end PC has 4GB+ RAM)
  sqlite.pragma('cache_size = -65536')
  // Memory-mapped I/O: 256MB
  sqlite.pragma('mmap_size = 268435456')
  // Temp tables in memory
  sqlite.pragma('temp_store = MEMORY')
  // Foreign keys enforced
  sqlite.pragma('foreign_keys = ON')
  // Page size optimized for SSD
  sqlite.pragma('page_size = 4096')
  // Auto-checkpoint WAL at 1000 pages
  sqlite.pragma('wal_autocheckpoint = 1000')
}
