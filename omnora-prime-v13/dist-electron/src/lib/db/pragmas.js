"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyProductionPragmas = applyProductionPragmas;
/**
 * Noxis Hub — SQLite WAL Performance & Crash Safety Pragmas
 * Applied in exact required order every time the database opens.
 */
function applyProductionPragmas(sqlite) {
    // 1. WAL mode: readers never block writers, writers never block readers. Power cut safe.
    try {
        sqlite.pragma('journal_mode = WAL');
    }
    catch { }
    // 2. synchronous NORMAL: data safe on power cut, 3x faster than FULL.
    try {
        sqlite.pragma('synchronous = NORMAL');
    }
    catch { }
    // 3. cache_size -64000: 64MB page cache in memory. Hot data never hits disk.
    try {
        sqlite.pragma('cache_size = -64000');
    }
    catch { }
    // 4. temp_store MEMORY: temp tables in RAM not disk.
    try {
        sqlite.pragma('temp_store = MEMORY');
    }
    catch { }
    // 5. mmap_size 268435456: 256MB memory mapped IO. OS-level reads, zero syscall overhead.
    try {
        sqlite.pragma('mmap_size = 268435456');
    }
    catch { }
    // 6. page_size 4096: Optimized filesystem block size.
    try {
        sqlite.pragma('page_size = 4096');
    }
    catch { }
    // 7. wal_autocheckpoint 1000: WAL file folds back into main DB every 1000 pages.
    try {
        sqlite.pragma('wal_autocheckpoint = 1000');
    }
    catch { }
    // 8. busy_timeout 5000: Instead of SQLITE_BUSY crash, wait 5 seconds and retry.
    try {
        sqlite.pragma('busy_timeout = 5000');
    }
    catch { }
    // 9. foreign_keys ON: Foreign keys strictly enforced.
    try {
        sqlite.pragma('foreign_keys = ON');
    }
    catch { }
    // 10. optimize: Updates internal query planner statistics.
    try {
        sqlite.pragma('optimize');
    }
    catch { }
}
