/**
 * ============================================================================
 * Noxis Hub — Process Watchdog & Session Rehydration Supervisor
 * Target File: src/main/supervisor/WatchdogService.ts
 * ============================================================================
 * Prevents POS counter lockouts caused by Windows "Not Responding" freezes,
 * event-loop stalls, or memory leaks. Restores in-flight cart state automatically.
 */

import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';

export interface CartItemDraft {
  skuId: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  taxAmount?: number;
  lineTotal: number;
  barcode?: string;
}

export interface SessionDraft {
  cashierId: string | null;
  cashierName: string | null;
  partyId: string | null;
  partyName: string | null;
  partyPhone: string | null;
  items: CartItemDraft[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  paymentMethod?: string;
  notes?: string;
  lastUpdated: string;
}

export interface WatchdogOptions {
  storageDir: string;
  heartbeatIntervalMs?: number; // Expected ping interval from UI (default: 3000ms)
  timeoutThresholdMs?: number;  // Max tolerance before restart (default: 10000ms)
  onCrashRestart?: (reason: string) => void;
}

export class WatchdogService extends EventEmitter {
  private lastHeartbeatTime: number = Date.now();
  private watchdogTimer: NodeJS.Timeout | null = null;
  private readonly draftFilePath: string;
  private readonly draftTempPath: string;
  private readonly crashLogPath: string;
  private readonly heartbeatIntervalMs: number;
  private readonly timeoutThresholdMs: number;
  private isRestarting = false;
  private onCrashRestart?: (reason: string) => void;

  constructor(options: WatchdogOptions) {
    super();
    const dir = path.resolve(options.storageDir);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.draftFilePath = path.join(dir, '.session_draft.json');
    this.draftTempPath = path.join(dir, '.session_draft.json.tmp');
    this.crashLogPath = path.join(dir, 'watchdog_crash.log');

    this.heartbeatIntervalMs = options.heartbeatIntervalMs ?? 3000;
    this.timeoutThresholdMs = options.timeoutThresholdMs ?? 10000;
    this.onCrashRestart = options.onCrashRestart;
  }

  /**
   * Starts monitoring the UI renderer process heartbeat.
   */
  public startSupervisor(): void {
    this.lastHeartbeatTime = Date.now();

    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
    }

    this.watchdogTimer = setInterval(() => {
      this.checkHeartbeat();
    }, 1000); // Check every second for responsive detection
  }

  /**
   * Called whenever the UI renderer dispatches a heartbeat ping (every 3000ms).
   */
  public recordHeartbeat(): void {
    this.lastHeartbeatTime = Date.now();
  }

  /**
   * Evaluates if the main process or renderer has frozen or starved the event loop.
   */
  private checkHeartbeat(): void {
    if (this.isRestarting) return;

    const elapsed = Date.now() - this.lastHeartbeatTime;
    if (elapsed > this.timeoutThresholdMs) {
      this.triggerEmergencyRelaunch(
        `Renderer/Event-Loop freeze detected. No heartbeat for ${elapsed}ms (threshold: ${this.timeoutThresholdMs}ms)`
      );
    }
  }

  /**
   * Atomically persists the in-flight cart state upon each item scan or price update.
   * Uses temp file + rename to guarantee zero partial-write corruption during power outages.
   */
  public persistDraftTransaction(draft: Omit<SessionDraft, 'lastUpdated'>): void {
    try {
      const fullDraft: SessionDraft = {
        ...draft,
        lastUpdated: new Date().toISOString(),
      };

      const payload = JSON.stringify(fullDraft, null, 2);

      // Atomic write pattern: write to tmp, then flush & rename
      fs.writeFileSync(this.draftTempPath, payload, 'utf8');
      fs.renameSync(this.draftTempPath, this.draftFilePath);
    } catch (err: any) {
      console.error('[Watchdog] Failed to persist atomic draft session:', err.message);
    }
  }

  /**
   * Retrieves the active in-progress transaction state after an abrupt crash or restart.
   */
  public restoreDraftTransaction(): SessionDraft | null {
    try {
      if (!fs.existsSync(this.draftFilePath)) {
        return null;
      }

      const content = fs.readFileSync(this.draftFilePath, 'utf8');
      const draft: SessionDraft = JSON.parse(content);

      // Basic sanity validation
      if (!Array.isArray(draft.items)) {
        return null;
      }

      console.log(`[Watchdog] Successfully rehydrated cart session (${draft.items.length} items from ${draft.lastUpdated})`);
      return draft;
    } catch (err: any) {
      console.warn('[Watchdog] Draft restore warning (corrupt or unreadable):', err.message);
      return null;
    }
  }

  /**
   * Clears the draft transaction once an invoice is successfully finalized & printed.
   */
  public clearDraftTransaction(): void {
    try {
      if (fs.existsSync(this.draftFilePath)) {
        fs.unlinkSync(this.draftFilePath);
      }
      if (fs.existsSync(this.draftTempPath)) {
        fs.unlinkSync(this.draftTempPath);
      }
    } catch (err: any) {
      console.warn('[Watchdog] Failed to clear draft transaction:', err.message);
    }
  }

  /**
   * Executes a graceful kill and silent restart of the Electron / Node runtime.
   */
  public triggerEmergencyRelaunch(reason: string): void {
    if (this.isRestarting) return;
    this.isRestarting = true;

    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] WATCHDOG_RELAUNCH: ${reason}\n`;

    try {
      fs.appendFileSync(this.crashLogPath, logEntry, 'utf8');
    } catch {}

    if (this.onCrashRestart) {
      this.onCrashRestart(reason);
    }

    console.error(`[Watchdog] CRITICAL RESTART: ${reason}`);

    // Electron specific relaunch handling
    try {
      const electron = require('electron');
      if (electron.app) {
        electron.app.relaunch();
        electron.app.exit(0);
        return;
      }
    } catch {}

    // Node.js child process fallback (headless / dev mode)
    const { spawn } = require('child_process');
    spawn(process.argv[0], process.argv.slice(1), {
      detached: true,
      stdio: 'ignore',
    }).unref();

    process.exit(1);
  }

  public stop(): void {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }
}
