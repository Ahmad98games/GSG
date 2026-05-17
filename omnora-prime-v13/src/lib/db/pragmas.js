"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyProductionPragmas = applyProductionPragmas;
const client_1 = require("./client");
function applyProductionPragmas() {
    // WAL mode: concurrent reads during writes
    client_1.db.$client.pragma('journal_mode = WAL');
    // Synchronous NORMAL: safe + fast (not FULL)
    client_1.db.$client.pragma('synchronous = NORMAL');
    // 64MB cache (low-end PC has 4GB+ RAM)
    client_1.db.$client.pragma('cache_size = -65536');
    // Memory-mapped I/O: 256MB
    client_1.db.$client.pragma('mmap_size = 268435456');
    // Temp tables in memory
    client_1.db.$client.pragma('temp_store = MEMORY');
    // Foreign keys enforced
    client_1.db.$client.pragma('foreign_keys = ON');
    // Page size optimized for SSD
    client_1.db.$client.pragma('page_size = 4096');
    // Auto-checkpoint WAL at 1000 pages
    client_1.db.$client.pragma('wal_autocheckpoint = 1000');
}
