import { Worker } from 'worker_threads';
import path from 'path';
import fs from 'fs';
import { logger } from '../lib/logger';

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

interface WorkerState {
  worker: Worker;
  lastActive: number;
  isStalled: boolean;
  activeTask: Task | null;
}

export class WorkerPool {
  private workers: WorkerState[] = [];
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
      process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
        module: 'commonjs',
        moduleResolution: 'node',
        target: 'es2020',
        esModuleInterop: true,
        skipLibCheck: true
      });
    }
    this.init();
    this.startWatchdog();
  }

  private init() {
    for (let i = 0; i < this.poolSize; i++) {
      this.spawnWorker(i);
    }
  }

  private spawnWorker(index: number) {
    const worker = new Worker(this.workerPath, {
      execArgv: this.workerExecArgv,
    });

    const workerState: WorkerState = {
      worker,
      lastActive: Date.now(),
      isStalled: false,
      activeTask: null
    };

    this.workers[index] = workerState;

    worker.on('message', (result) => {
      workerState.lastActive = Date.now();
      const task = workerState.activeTask;
      workerState.activeTask = null;

      if (task) {
        if (result && result.status === 'ok') {
          task.resolve(result.payload);
        } else {
          task.reject(new Error(result?.error || 'Worker execution failed'));
        }
      }
      this.processNext();
    });

    worker.on('error', (err) => {
      logger.error({ err, workerIndex: index }, 'Worker error');
      const task = workerState.activeTask;
      workerState.activeTask = null;
      if (task) {
        task.reject(err);
      }
      this.restartWorker(index);
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        logger.warn({ code, workerIndex: index }, 'Worker exited unexpectedly');
        const task = workerState.activeTask;
        workerState.activeTask = null;
        if (task) {
          task.reject(new Error(`Worker exited with code ${code}`));
        }
        this.restartWorker(index);
      }
    });
  }

  private restartWorker(index: number) {
    logger.info({ workerIndex: index }, 'Restarting worker');
    try {
      if (this.workers[index] && this.workers[index].worker) {
        this.workers[index].worker.terminate();
      }
    } catch (e) {}
    this.spawnWorker(index);
  }

  private startWatchdog() {
    setInterval(() => {
      const now = Date.now();
      this.workers.forEach((w, i) => {
        // Only restart if the worker is currently executing a task and has been stuck for > 10 seconds
        if (w.activeTask !== null && (now - w.lastActive > 10000)) {
          logger.warn({ workerIndex: i, taskType: w.activeTask.type }, 'Worker stalled on active task — watchdog triggering restart');
          this.restartWorker(i);
        }
      });

      const metrics = this.getMetrics();
      logger.info(metrics, 'Worker Pool Status');
    }, 300_000);
  }

  public getMetrics() {
    return {
      queueDepth: this.queues.reduce((acc, q) => acc + q.length, 0),
      workerUtilization: this.workers.filter(w => w.activeTask !== null).length / this.poolSize * 100,
      activeWorkers: this.workers.length
    };
  }

  public enqueue(type: string, payload: any, priority: TaskPriority = TaskPriority.MEDIUM): Promise<any> {
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
    const SHARED_KEY = Buffer.alloc(32, process.env.NSP_SHARED_KEY || 'test-key-001');

    while (true) {
      const idleWorkerState = this.workers.find(w => !w.isStalled && w.activeTask === null);
      if (!idleWorkerState) {
        break;
      }

      let taskToProcess: Task | null = null;
      for (const queue of this.queues) {
        if (queue.length > 0) {
          taskToProcess = queue.shift() || null;
          break;
        }
      }

      if (!taskToProcess) {
        break;
      }

      idleWorkerState.activeTask = taskToProcess;
      idleWorkerState.lastActive = Date.now();

      if (taskToProcess.type === 'DECRYPT_AND_PARSE') {
        const rawData = taskToProcess.payload.data as Buffer;
        const encrypted = rawData.subarray(4);
        idleWorkerState.worker.postMessage({ encrypted, key: SHARED_KEY });
      } else {
        idleWorkerState.worker.postMessage({ type: taskToProcess.type, payload: taskToProcess.payload });
      }
    }
  }
}

let globalPoolInstance: WorkerPool | null = null;

export function getGlobalPool(): WorkerPool {
  if (!globalPoolInstance) {
    globalPoolInstance = new WorkerPool(Number(process.env.HUB_WORKER_POOL_SIZE) || 4);
  }
  return globalPoolInstance;
}
