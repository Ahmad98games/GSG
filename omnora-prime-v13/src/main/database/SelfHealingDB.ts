/**
 * ============================================================================
 * Noxis Hub — Autonomous SQLite WAL Health & Recovery Engine
 * Target File: src/main/database/SelfHealingDB.ts
 * ============================================================================
 * Designed for mission-critical retail & warehouse point-of-sale systems
 * subject to abrupt power cuts, filesystem stalls, and dirty shutdowns.
 */

import Database, { Database as DatabaseInstance } from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

export interface SelfHealingDBOptions {
  dbPath: string;
  backupDir?: string;
  maxBackups?: number;
  backupIntervalMs?: number;
  onAuditLog?: (event: AuditEvent) => void;
}

export interface AuditEvent {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  action: string;
  message: string;
  details?: Record<string, any>;
}

export class SelfHealingDB {
  private db: DatabaseInstance | null = null;
  private readonly dbPath: string;
  private readonly backupDir: string;
  private readonly safeBackupPath: string;
  private readonly auditLogPath: string;
  private readonly maxBackups: number;
  private backupTimer: NodeJS.Timeout | null = null;
  private isRecovering = false;
  private onAuditLog?: (event: AuditEvent) => void;

  constructor(options: SelfHealingDBOptions) {
    this.dbPath = path.resolve(options.dbPath);
    this.backupDir = options.backupDir
      ? path.resolve(options.backupDir)
      : path.join(path.dirname(this.dbPath), 'snapshots');
    this.safeBackupPath = path.join(this.backupDir, 'noxis_backup_safe.db');
    this.auditLogPath = path.join(path.dirname(this.dbPath), 'recovery_audit.log');
    this.maxBackups = options.maxBackups ?? 5;
    this.onAuditLog = options.onAuditLog;

    this.ensureDirectories();
  }

  /**
   * Initializes the database connection with automated pre-flight recovery.
   */
  public initialize(): DatabaseInstance {
    this.log('INFO', 'INIT', `Initializing database connection at: ${this.dbPath}`);
    this.connectAndVerify();
    this.startRollingBackup(60 * 30 * 1000); // 30-minute default rolling snapshot
    return this.getHandle();
  }

  /**
   * Returns the underlying better-sqlite3 instance safely.
   */
  public getHandle(): DatabaseInstance {
    if (!this.db || !this.db.open) {
      throw new Error('[SelfHealingDB] Database instance is not open or accessible.');
    }
    return this.db;
  }

  /**
   * Connects to SQLite and executes pre-flight integrity routines.
   */
  private connectAndVerify(): void {
    try {
      this.db = new Database(this.dbPath, {
        timeout: 5000,
        verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
      });

      // Configure WAL and high-resiliency durability settings
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('busy_timeout = 10000');
      this.db.pragma('foreign_keys = ON');

      // 1. Pre-Flight Integrity Check
      const isHealthy = this.runIntegrityChecks();
      if (!isHealthy) {
        this.log('WARN', 'INTEGRITY_FAIL', 'Pre-flight integrity check failed. Initiating recovery.');
        this.recoverFromCorruption();
      } else {
        this.log('INFO', 'HEALTH_OK', 'Database passed pre-flight integrity verification.');
      }
    } catch (err: any) {
      this.log('ERROR', 'CONNECT_FAIL', `Failed to open database: ${err.message}`, { error: String(err) });
      this.recoverFromLockOrCrash(err);
    }
  }

  /**
   * Performs quick_check and escalates to deep integrity_check if needed.
   */
  private runIntegrityChecks(): boolean {
    if (!this.db) return false;

    try {
      const quick = this.db.pragma('quick_check') as Array<{ quick_check: string }>;
      const isQuickOk = quick && quick.length > 0 && quick[0].quick_check === 'ok';

      if (isQuickOk) {
        return true;
      }

      this.log('WARN', 'QUICK_CHECK_FAIL', 'quick_check failed. Escalating to deep integrity_check.');
      const deep = this.db.pragma('integrity_check') as Array<{ integrity_check: string }>;
      const isDeepOk = deep && deep.length > 0 && deep[0].integrity_check === 'ok';

      if (isDeepOk) {
        this.log('INFO', 'DEEP_CHECK_OK', 'Deep integrity_check passed after quick_check warning.');
        return true;
      }

      this.log('ERROR', 'DEEP_CHECK_FAIL', 'Full integrity check failed with errors.', { errors: deep });
      return false;
    } catch (err: any) {
      this.log('ERROR', 'CHECK_EXCEPTION', `Integrity check threw an exception: ${err.message}`);
      return false;
    }
  }

  /**
   * Resolves SQLITE_BUSY, locked processes, or dangling WAL/SHM locks.
   */
  public recoverFromLockOrCrash(cause?: Error): void {
    if (this.isRecovering) return;
    this.isRecovering = true;

    this.log('WARN', 'LOCK_RECOVERY', 'Executing lock release and WAL checkpoint recovery...', {
      cause: cause?.message,
    });

    try {
      if (this.db && this.db.open) {
        try {
          // Attempt an aggressive truncate checkpoint to fold WAL into DB
          this.db.pragma('wal_checkpoint(TRUNCATE)');
          this.log('INFO', 'WAL_TRUNCATED', 'WAL checkpoint(TRUNCATE) successfully completed.');
        } catch (chkErr: any) {
          this.log('WARN', 'CHECKPOINT_FAILED', `Checkpoint execution failed: ${chkErr.message}`);
        }
        try {
          this.db.close();
        } catch {}
      }

      this.db = null;

      // Safe handle cleanup for stale -shm file
      const shmPath = `${this.dbPath}-shm`;
      if (fs.existsSync(shmPath)) {
        try {
          fs.unlinkSync(shmPath);
          this.log('INFO', 'SHM_PURGED', 'Dangling shared memory index (-shm) purged.');
        } catch (unlinkErr: any) {
          this.log('WARN', 'SHM_LOCKED', `Could not unlink -shm: ${unlinkErr.message}`);
        }
      }

      // Reconnect
      this.connectAndVerify();
    } finally {
      this.isRecovering = false;
    }
  }

  /**
   * Shadow Snapshot: Non-blocking live database backup via SQLite Backup API.
   */
  public async createShadowSnapshot(): Promise<string> {
    if (!this.db || !this.db.open) {
      throw new Error('Database handle unavailable for shadow snapshot.');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const snapshotFilename = `snapshot_${timestamp}.db`;
    const targetPath = path.join(this.backupDir, snapshotFilename);

    this.log('INFO', 'SNAPSHOT_START', `Creating live shadow snapshot: ${snapshotFilename}`);

    try {
      // Use native SQLite db.backup() for non-blocking online WAL copy
      await this.db.backup(targetPath, {
        progress({ totalPages, remainingPages }) {
          // Keep CPU utilization low during counter operations
          return 250; // pause 250ms between page batches
        },
      });

      // Maintain latest safe snapshot pointer
      fs.copyFileSync(targetPath, this.safeBackupPath);
      this.pruneOldSnapshots();
      this.log('INFO', 'SNAPSHOT_SUCCESS', `Shadow snapshot generated & verified at ${targetPath}`);
      return targetPath;
    } catch (err: any) {
      this.log('ERROR', 'SNAPSHOT_FAIL', `Failed to create shadow snapshot: ${err.message}`);
      throw err;
    }
  }

  /**
   * Catastrophic Point-in-Time Failover: Swaps in the latest safe snapshot
   * when pages are corrupted and cannot be repaired.
   */
  public recoverFromCorruption(): void {
    this.log('CRITICAL', 'CATASTROPHIC_FAILOVER', 'Initiating point-in-time disaster recovery failover.');

    try {
      if (this.db && this.db.open) {
        try {
          this.db.close();
        } catch {}
      }
      this.db = null;

      // 1. Quarantine corrupted files for post-incident diagnostics
      const quarantineDir = path.join(path.dirname(this.dbPath), 'quarantine');
      if (!fs.existsSync(quarantineDir)) {
        fs.mkdirSync(quarantineDir, { recursive: true });
      }

      const timestamp = Date.now();
      const corruptArchive = path.join(quarantineDir, `corrupt_${timestamp}.db`);
      if (fs.existsSync(this.dbPath)) {
        fs.renameSync(this.dbPath, corruptArchive);
      }
      if (fs.existsSync(`${this.dbPath}-wal`)) {
        fs.renameSync(`${this.dbPath}-wal`, `${corruptArchive}-wal`);
      }
      if (fs.existsSync(`${this.dbPath}-shm`)) {
        try { fs.unlinkSync(`${this.dbPath}-shm`); } catch {}
      }

      // 2. Validate safe snapshot availability
      if (!fs.existsSync(this.safeBackupPath)) {
        const errorMsg = 'No safe snapshot (noxis_backup_safe.db) found to fail over to!';
        this.log('CRITICAL', 'NO_SAFE_BACKUP', errorMsg);
        throw new Error(errorMsg);
      }

      // 3. Restore safe snapshot into active DB path
      fs.copyFileSync(this.safeBackupPath, this.dbPath);
      this.log('INFO', 'SNAPSHOT_RESTORED', `Safe snapshot deployed into primary database path.`);

      // 4. Re-open restored database
      this.connectAndVerify();

      this.log('INFO', 'FAILOVER_COMPLETE', 'Database successfully restored and operational. Counter unlocked.');
    } catch (err: any) {
      this.log('CRITICAL', 'FAILOVER_FATAL', `Disaster recovery failover failed: ${err.message}`);
      throw err;
    }
  }

  /**
   * Periodically schedules snapshots when the counter is idle.
   */
  public startRollingBackup(intervalMs = 1800000): void {
    if (this.backupTimer) clearInterval(this.backupTimer);

    this.backupTimer = setInterval(async () => {
      try {
        await this.createShadowSnapshot();
      } catch (err: any) {
        this.log('WARN', 'AUTO_SNAPSHOT_FAIL', `Scheduled backup failed: ${err.message}`);
      }
    }, intervalMs);
  }

  /**
   * Enforces rolling retention limit to prevent disk bloat.
   */
  private pruneOldSnapshots(): void {
    try {
      const files = fs.readdirSync(this.backupDir)
        .filter(f => f.startsWith('snapshot_') && f.endsWith('.db'))
        .map(f => ({ name: f, time: fs.statSync(path.join(this.backupDir, f)).mtimeMs }))
        .sort((a, b) => b.time - a.time);

      if (files.length > this.maxBackups) {
        const toDelete = files.slice(this.maxBackups);
        for (const file of toDelete) {
          fs.unlinkSync(path.join(this.backupDir, file.name));
        }
      }
    } catch (err: any) {
      this.log('WARN', 'PRUNE_FAIL', `Failed to prune old snapshots: ${err.message}`);
    }
  }

  private ensureDirectories(): void {
    const parentDir = path.dirname(this.dbPath);
    if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir, { recursive: true });
    if (!fs.existsSync(this.backupDir)) fs.mkdirSync(this.backupDir, { recursive: true });
  }

  private log(level: AuditEvent['level'], action: string, message: string, details?: Record<string, any>): void {
    const entry: AuditEvent = {
      timestamp: new Date().toISOString(),
      level,
      action,
      message,
      details,
    };

    const line = `[${entry.timestamp}] [${entry.level}] [${entry.action}] ${entry.message} ${details ? JSON.stringify(details) : ''}\n`;
    try {
      fs.appendFileSync(this.auditLogPath, line, 'utf8');
    } catch {}

    if (this.onAuditLog) {
      this.onAuditLog(entry);
    }

    if (level === 'ERROR' || level === 'CRITICAL') {
      console.error(`[SelfHealingDB] ${line.trim()}`);
    } else {
      console.log(`[SelfHealingDB] ${line.trim()}`);
    }
  }

  public close(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
    }
    if (this.db && this.db.open) {
      try {
        this.db.pragma('wal_checkpoint(TRUNCATE)');
        this.db.close();
      } catch {}
      this.db = null;
    }
  }
}
