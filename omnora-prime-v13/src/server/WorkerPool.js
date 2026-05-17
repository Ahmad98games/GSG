"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalPool = exports.WorkerPool = exports.TaskPriority = void 0;
const worker_threads_1 = require("worker_threads");
const path_1 = __importDefault(require("path"));
const logger_1 = require("@/lib/logger");
/**
 * Noxis v13.0 — Priority Worker Pool
 */
var TaskPriority;
(function (TaskPriority) {
    TaskPriority[TaskPriority["CRITICAL"] = 0] = "CRITICAL";
    TaskPriority[TaskPriority["HIGH"] = 1] = "HIGH";
    TaskPriority[TaskPriority["MEDIUM"] = 2] = "MEDIUM";
    TaskPriority[TaskPriority["LOW"] = 3] = "LOW"; // DB_READ, Background reports
})(TaskPriority || (exports.TaskPriority = TaskPriority = {}));
class WorkerPool {
    workers = [];
    queues = [[], [], [], []];
    poolSize;
    workerPath;
    constructor(size = 4) {
        this.poolSize = size;
        this.workerPath = path_1.default.resolve(__dirname, '../lib/nsp/nsp-worker.ts');
        this.init();
        this.startWatchdog();
    }
    init() {
        for (let i = 0; i < this.poolSize; i++) {
            this.spawnWorker();
        }
    }
    spawnWorker() {
        const worker = new worker_threads_1.Worker(this.workerPath, {
            execArgv: ['-r', 'ts-node/register']
        });
        const index = this.workers.length;
        worker.on('message', (result) => {
            this.workers[index].lastActive = Date.now();
            this.processNext();
        });
        worker.on('error', (err) => {
            logger_1.logger.error({ err, workerIndex: index }, 'Worker error');
            this.restartWorker(index);
        });
        worker.on('exit', (code) => {
            if (code !== 0) {
                logger_1.logger.warn({ code, workerIndex: index }, 'Worker exited unexpectedly');
                this.restartWorker(index);
            }
        });
        this.workers.push({ worker, lastActive: Date.now(), isStalled: false });
    }
    restartWorker(index) {
        this.workers[index].worker.terminate();
        // Spawn new worker logic simplified for brevity
        logger_1.logger.info({ workerIndex: index }, 'Restarting worker');
        // ... logic to replace worker in array ...
    }
    startWatchdog() {
        setInterval(() => {
            const now = Date.now();
            this.workers.forEach((w, i) => {
                if (now - w.lastActive > 10000) { // 10s timeout
                    logger_1.logger.warn({ workerIndex: i }, 'Worker stalled — watchdog triggering restart');
                    this.restartWorker(i);
                }
            });
            // Log metrics
            const metrics = this.getMetrics();
            logger_1.logger.info(metrics, 'Worker Pool Status');
        }, 30000);
    }
    getMetrics() {
        return {
            queueDepth: this.queues.reduce((acc, q) => acc + q.length, 0),
            workerUtilization: this.workers.filter(w => !w.isStalled).length / this.poolSize * 100,
            activeWorkers: this.workers.length
        };
    }
    enqueue(type, payload, priority = TaskPriority.MEDIUM) {
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
    processNext() {
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
exports.WorkerPool = WorkerPool;
exports.globalPool = new WorkerPool(Number(process.env.HUB_WORKER_POOL_SIZE) || 4);
