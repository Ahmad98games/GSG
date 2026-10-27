/**
 * ============================================================================
 * Noxis Hub — Resilient Port & Print Queue Failover Engine
 * Target File: src/main/hardware/PortSelfHealer.ts
 * ============================================================================
 * Self-heals disconnected USB thermal printers (ESC/POS), loose COM cables,
 * and serial weighing scales with bounded FIFO failover and auto-rehook.
 */

import { EventEmitter } from 'events';

export interface HardwarePortIdentifier {
  path?: string;             // e.g. 'COM3' or '/dev/ttyUSB0'
  vendorId?: string;         // e.g. '0483' (STMicroelectronics), '0416' (Winbond)
  productId?: string;        // e.g. '5743' (POS Thermal Printer)
  serialNumber?: string;
  manufacturer?: string;
}

export interface QueuedPrintJob {
  jobId: string;
  targetDevice: 'printer' | 'scale';
  rawBuffer: Buffer;
  timestamp: number;
  attempts: number;
  description?: string;
}

export interface HardwareDeviceStatus {
  target: 'printer' | 'scale';
  connected: boolean;
  portPath: string | null;
  lastSeen: number;
  pendingJobs: number;
}

export interface PortSelfHealerOptions {
  printerIdentifier: HardwarePortIdentifier;
  scaleIdentifier?: HardwarePortIdentifier;
  pollIntervalMs?: number;      // Default: 2000ms
  maxQueueSize?: number;        // Default: 100 jobs
  printTimeoutMs?: number;      // Default: 4000ms
}

export class PortSelfHealer extends EventEmitter {
  private readonly printerId: HardwarePortIdentifier;
  private readonly scaleId?: HardwarePortIdentifier;
  private readonly pollIntervalMs: number;
  private readonly maxQueueSize: number;
  private readonly printTimeoutMs: number;

  private printQueue: QueuedPrintJob[] = [];
  private processedJobIds = new Set<string>();
  private pollTimer: NodeJS.Timeout | null = null;
  private isFlushingQueue = false;

  private printerConnected = false;
  private scaleConnected = false;
  private activePrinterPath: string | null = null;
  private activeScalePath: string | null = null;

  // Active stream or socket/serialport handles
  private printerTransport: any = null;
  private scaleTransport: any = null;

  constructor(options: PortSelfHealerOptions) {
    super();
    this.printerId = options.printerIdentifier;
    this.scaleId = options.scaleIdentifier;
    this.pollIntervalMs = options.pollIntervalMs ?? 2000;
    this.maxQueueSize = options.maxQueueSize ?? 100;
    this.printTimeoutMs = options.printTimeoutMs ?? 4000;
  }

  /**
   * Starts the 2,000ms autonomous port discovery and health loop.
   */
  public start(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);

    // Initial check immediately, then periodically
    this.scanAndRehook();
    this.pollTimer = setInterval(() => {
      this.scanAndRehook();
    }, this.pollIntervalMs);
  }

  /**
   * Enqueues an ESC/POS print job or sends it directly if the hardware is live.
   * Catches EPIPE, PORT_NOT_FOUND, and timeout errors without bubbling to the UI.
   */
  public async dispatchPrint(job: {
    jobId: string;
    rawBuffer: Buffer;
    description?: string;
  }): Promise<{ success: boolean; queued: boolean; message: string }> {
    // Prevent duplicate print jobs
    if (this.processedJobIds.has(job.jobId)) {
      return { success: true, queued: false, message: 'Job already executed.' };
    }

    const printItem: QueuedPrintJob = {
      jobId: job.jobId,
      targetDevice: 'printer',
      rawBuffer: job.rawBuffer,
      timestamp: Date.now(),
      attempts: 0,
      description: job.description,
    };

    if (this.printerConnected && this.printerTransport) {
      try {
        await this.executeRawWrite(this.printerTransport, printItem.rawBuffer);
        this.processedJobIds.add(job.jobId);
        this.emit('print:success', { jobId: job.jobId });
        return { success: true, queued: false, message: 'Printed directly.' };
      } catch (err: any) {
        this.handleHardwareDisconnect('printer', err);
        // Fallthrough to enqueue
      }
    }

    // Hardware offline: push to bounded FIFO Spillover Queue
    this.enqueuePrintJob(printItem);
    return {
      success: true,
      queued: true,
      message: 'Printer disconnected. Job queued in self-healing buffer.',
    };
  }

  /**
   * Bounded FIFO Queue implementation.
   */
  private enqueuePrintJob(job: QueuedPrintJob): void {
    if (this.printQueue.length >= this.maxQueueSize) {
      // Discard oldest unprinted non-critical job to prevent memory leak
      const dropped = this.printQueue.shift();
      console.warn(`[PortSelfHealer] Spillover queue limit reached (${this.maxQueueSize}). Dropped oldest job: ${dropped?.jobId}`);
    }

    this.printQueue.push(job);
    this.emit('queue:updated', { size: this.printQueue.length, latestJobId: job.jobId });
    console.log(`[PortSelfHealer] Buffered print job [${job.jobId}]. Total pending: ${this.printQueue.length}`);
  }

  /**
   * Scans system COM/USB ports and re-hooks lost printer or scale streams.
   */
  private async scanAndRehook(): Promise<void> {
    try {
      const ports = await this.listAvailablePorts();

      // 1. Re-hook Printer
      const matchedPrinter = this.matchPort(ports, this.printerId);
      if (matchedPrinter) {
        if (!this.printerConnected || this.activePrinterPath !== matchedPrinter.path) {
          await this.reconnectPrinter(matchedPrinter.path);
        }
      } else if (this.printerConnected) {
        this.handleHardwareDisconnect('printer', new Error('PORT_NOT_FOUND (cable unplugged)'));
      }

      // 2. Re-hook Serial Scale (if configured)
      if (this.scaleId) {
        const matchedScale = this.matchPort(ports, this.scaleId);
        if (matchedScale) {
          if (!this.scaleConnected || this.activeScalePath !== matchedScale.path) {
            await this.reconnectScale(matchedScale.path);
          }
        } else if (this.scaleConnected) {
          this.handleHardwareDisconnect('scale', new Error('PORT_NOT_FOUND (scale disconnected)'));
        }
      }
    } catch (err: any) {
      console.warn('[PortSelfHealer] Scan warning:', err.message);
    }
  }

  /**
   * Port matching logic based on VendorID, ProductID, Path, or Friendly Name.
   */
  private matchPort(availablePorts: any[], target: HardwarePortIdentifier): any | null {
    return (
      availablePorts.find((p) => {
        if (target.path && p.path && p.path.toLowerCase() === target.path.toLowerCase()) return true;
        if (
          target.vendorId &&
          target.productId &&
          p.vendorId &&
          p.productId &&
          p.vendorId.toLowerCase() === target.vendorId.toLowerCase() &&
          p.productId.toLowerCase() === target.productId.toLowerCase()
        ) {
          return true;
        }
        if (target.serialNumber && p.serialNumber && p.serialNumber === target.serialNumber) return true;
        return false;
      }) || null
    );
  }

  /**
   * Safe port listing with graceful fallback.
   */
  private async listAvailablePorts(): Promise<any[]> {
    try {
      // Dynamic import of serialport to prevent native compilation crashes on low-spec PCs
      const { SerialPort } = require('serialport');
      return await SerialPort.list();
    } catch {
      // Fallback for Windows Node environment
      return [];
    }
  }

  /**
   * Reconnects to printer and drains the pending FIFO buffer.
   */
  private async reconnectPrinter(portPath: string): Promise<void> {
    console.log(`[PortSelfHealer] Re-hooking printer on port: ${portPath}`);
    try {
      this.closePrinterTransport();

      const { SerialPort } = require('serialport');
      this.printerTransport = new SerialPort({
        path: portPath,
        baudRate: 9600,
        autoOpen: true,
      });

      this.activePrinterPath = portPath;
      this.printerConnected = true;

      this.printerTransport.on('error', (err: any) => {
        this.handleHardwareDisconnect('printer', err);
      });

      this.printerTransport.on('close', () => {
        this.handleHardwareDisconnect('printer', new Error('Port stream closed'));
      });

      this.emit('hardware:connected', { target: 'printer', port: portPath });
      console.log(`[PortSelfHealer] Printer successfully re-hooked on ${portPath}`);

      // Flush queued jobs sequentially
      await this.flushPrintQueue();
    } catch (err: any) {
      this.printerConnected = false;
      console.error(`[PortSelfHealer] Failed to re-hook printer on ${portPath}:`, err.message);
    }
  }

  /**
   * Reconnects to serial scale for weight stream reading.
   */
  private async reconnectScale(portPath: string): Promise<void> {
    console.log(`[PortSelfHealer] Re-hooking weighing scale on port: ${portPath}`);
    try {
      this.closeScaleTransport();

      const { SerialPort } = require('serialport');
      this.scaleTransport = new SerialPort({
        path: portPath,
        baudRate: 9600,
        autoOpen: true,
      });

      this.activeScalePath = portPath;
      this.scaleConnected = true;

      this.scaleTransport.on('data', (chunk: Buffer) => {
        this.emit('scale:data', chunk);
      });

      this.scaleTransport.on('error', (err: any) => {
        this.handleHardwareDisconnect('scale', err);
      });

      this.emit('hardware:connected', { target: 'scale', port: portPath });
    } catch (err: any) {
      this.scaleConnected = false;
      console.error(`[PortSelfHealer] Failed to re-hook scale on ${portPath}:`, err.message);
    }
  }

  /**
   * Flushes and executes pending queued print jobs sequentially with deduplication.
   */
  private async flushPrintQueue(): Promise<void> {
    if (this.isFlushingQueue || this.printQueue.length === 0 || !this.printerConnected) {
      return;
    }

    this.isFlushingQueue = true;
    console.log(`[PortSelfHealer] Flushing ${this.printQueue.length} pending jobs from queue...`);

    try {
      while (this.printQueue.length > 0 && this.printerConnected) {
        const job = this.printQueue[0];

        // Deduplication safety guard
        if (this.processedJobIds.has(job.jobId)) {
          this.printQueue.shift();
          continue;
        }

        try {
          await this.executeRawWrite(this.printerTransport, job.rawBuffer);
          this.processedJobIds.add(job.jobId);
          this.printQueue.shift(); // Successfully executed, remove from FIFO
          this.emit('print:success', { jobId: job.jobId });

          // Inter-job pacing (150ms) to prevent thermal printhead buffer overflow
          await new Promise((r) => setTimeout(r, 150));
        } catch (jobErr: any) {
          job.attempts++;
          console.warn(`[PortSelfHealer] Job [${job.jobId}] attempt ${job.attempts} failed:`, jobErr.message);
          this.handleHardwareDisconnect('printer', jobErr);
          break; // Stop flushing until next re-hook
        }
      }
    } finally {
      this.isFlushingQueue = false;
    }
  }

  /**
   * Writes raw buffer to transport with timeout guard.
   */
  private executeRawWrite(transport: any, buffer: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      let isTimedOut = false;
      const timeout = setTimeout(() => {
        isTimedOut = true;
        reject(new Error(`Print write timed out after ${this.printTimeoutMs}ms`));
      }, this.printTimeoutMs);

      transport.write(buffer, (err: any) => {
        clearTimeout(timeout);
        if (isTimedOut) return;
        if (err) {
          reject(err);
        } else {
          transport.drain((drainErr: any) => {
            if (drainErr) reject(drainErr);
            else resolve();
          });
        }
      });
    });
  }

  private handleHardwareDisconnect(target: 'printer' | 'scale', error: Error): void {
    if (target === 'printer' && this.printerConnected) {
      this.printerConnected = false;
      this.closePrinterTransport();
      this.emit('hardware:disconnected', { target: 'printer', error: error.message });
      console.warn(`[PortSelfHealer] Thermal Printer disconnected (${error.message}). Queue active.`);
    } else if (target === 'scale' && this.scaleConnected) {
      this.scaleConnected = false;
      this.closeScaleTransport();
      this.emit('hardware:disconnected', { target: 'scale', error: error.message });
      console.warn(`[PortSelfHealer] Serial Scale disconnected (${error.message}).`);
    }
  }

  public getStatus(): { printer: HardwareDeviceStatus; scale: HardwareDeviceStatus } {
    return {
      printer: {
        target: 'printer',
        connected: this.printerConnected,
        portPath: this.activePrinterPath,
        lastSeen: Date.now(),
        pendingJobs: this.printQueue.length,
      },
      scale: {
        target: 'scale',
        connected: this.scaleConnected,
        portPath: this.activeScalePath,
        lastSeen: Date.now(),
        pendingJobs: 0,
      },
    };
  }

  private closePrinterTransport(): void {
    if (this.printerTransport) {
      try { this.printerTransport.close(); } catch {}
      this.printerTransport = null;
    }
  }

  private closeScaleTransport(): void {
    if (this.scaleTransport) {
      try { this.scaleTransport.close(); } catch {}
      this.scaleTransport = null;
    }
  }

  public stop(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.closePrinterTransport();
    this.closeScaleTransport();
  }
}
