import { db } from './client'

export function applyProductionPragmas() {
  // WAL mode: concurrent reads during writes
  db.$client.pragma('journal_mode = WAL')
  // Synchronous NORMAL: safe + fast (not FULL)
  db.$client.pragma('synchronous = NORMAL')
  // 64MB cache (low-end PC has 4GB+ RAM)
  db.$client.pragma('cache_size = -65536')
  // Memory-mapped I/O: 256MB
  db.$client.pragma('mmap_size = 268435456')
  // Temp tables in memory
  db.$client.pragma('temp_store = MEMORY')
  // Foreign keys enforced
  db.$client.pragma('foreign_keys = ON')
  // Page size optimized for SSD
  db.$client.pragma('page_size = 4096')
  // Auto-checkpoint WAL at 1000 pages
  db.$client.pragma('wal_autocheckpoint = 1000')
}
