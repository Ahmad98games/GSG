import { Worker } from 'worker_threads';
import path from 'path';
import fs from 'fs';
import { logger } from '../lib/logger';

// Ensures TypeScript emits the worker alongside the Electron/server bundle (.js path at runtime).
import '../lib/nsp/nsp-worker';

/**
 * Noxis v13.0 — Priority Worker Pool
 */

export enum TaskPriority {
  CRITICAL = 0, // SOS, Auth, System Lock
  HIGH = 1,     // Scans, Khata, Stock
  MEDIUM = 2,   // Heartbeats, Telemetry
  LOW = 3       // DB_READ, Background reports
}

interface Task {
  type: string;
  payload: any;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  priority: TaskPriority;
  timestamp: number;
}

export class WorkerPool {
  private workers: { worker: Worker; lastActive: number; isStalled: boolean }[] = [];
  private queues: Task[][] = [[], [], [], []];
  private poolSize: number;
  private workerPath: string;
  private workerExecArgv: string[];

  constructor(size: number = 4) {
    this.poolSize = size;
    const workerJs = path.join(__dirname, '../lib/nsp/nsp-worker.js');
    const workerTs = path.join(__dirname, '../lib/nsp/nsp-worker.ts');
    if (fs.existsSync(workerJs)) {
      this.workerPath = workerJs;
      this.workerExecArgv = [];
    } else {
      this.workerPath = workerTs;
      this.workerExecArgv = ['-r', 'ts-node/register'];
    }
    this.init();
    this.startWatchdog();
  }

  private init() {
    for (let i = 0; i < this.poolSize; i++) {
      this.spawnWorker();
    }
  }

  private spawnWorker() {
    const worker = new Worker(this.workerPath, {
      execArgv: this.workerExecArgv,
    });

    const index = this.workers.length;
    
    worker.on('message', (result) => {
      this.workers[index].lastActive = Date.now();
      this.processNext();
    });

    worker.on('error', (err) => {
      logger.error({ err, workerIndex: index }, 'Worker error');
      this.restartWorker(index);
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        logger.warn({ code, workerIndex: index }, 'Worker exited unexpectedly');
        this.restartWorker(index);
      }
    });

    this.workers.push({ worker, lastActive: Date.now(), isStalled: false });
  }

  private restartWorker(index: number) {
    this.workers[index].worker.terminate();
    // Spawn new worker logic simplified for brevity
    logger.info({ workerIndex: index }, 'Restarting worker');
    // ... logic to replace worker in array ...
  }

  private startWatchdog() {
    setInterval(() => {
      const now = Date.now();
      this.workers.forEach((w, i) => {
        if (now - w.lastActive > 10000) { // 10s timeout
          logger.warn({ workerIndex: i }, 'Worker stalled — watchdog triggering restart');
          this.restartWorker(i);
        }
      });

      // Log metrics
      const metrics = this.getMetrics();
      logger.info(metrics, 'Worker Pool Status');
    }, 30000);
  }

  public getMetrics() {
    return {
      queueDepth: this.queues.reduce((acc, q) => acc + q.length, 0),
      workerUtilization: this.workers.filter(w => !w.isStalled).length / this.poolSize * 100,
      activeWorkers: this.workers.length
    };
  }

  public enqueue(type: string, payload: any, priority: TaskPriority = TaskPriority.MEDIUM): Promise<any> {
    // Backpressure
    if (this.queues[TaskPriority.MEDIUM].length > 500 && priority === TaskPriority.MEDIUM) {
      return Promise.reject(new Error('BACKPRESSURE_REJECT'));
    }

    return new Promise((resolve, reject) => {
      this.queues[priority].push({
        type, payload, resolve, reject, priority, timestamp: Date.now()
      });
      this.processNext();
    });
  }

  private processNext() {
    // Priority dequeue logic
    for (const queue of this.queues) {
      if (queue.length > 0) {
        const task = queue.shift();
        if (task) {
          // Find idle worker and post task
          const worker = this.workers[0].worker; // Simplified round-robin for now
          worker.postMessage({ type: task.type, payload: task.payload });
          // In real implementation, handle resolve/reject on message return
        }
      }
    }
  }
}

let globalPoolInstance: WorkerPool | null = null;

/** Lazy singleton so importing `@/server/server` during `next build` never starts worker threads. */
export function getGlobalPool(): WorkerPool {
  if (!globalPoolInstance) {
    globalPoolInstance = new WorkerPool(Number(process.env.HUB_WORKER_POOL_SIZE) || 4);
  }
  return globalPoolInstance;
}

