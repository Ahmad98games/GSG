"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const encryption_1 = require("./encryption");
if (worker_threads_1.parentPort) {
    worker_threads_1.parentPort.on('message', (packet) => {
        try {
            const { encrypted, key } = packet;
            const decrypted = encryption_1.NSPEncryption.decrypt(encrypted, key);
            const payload = JSON.parse(decrypted.toString()); // Protobuf decode simulation
            worker_threads_1.parentPort?.postMessage({ status: 'ok', payload });
        }
        catch (err) {
            worker_threads_1.parentPort?.postMessage({ status: 'error', error: 'DECRYPT_FAIL' });
        }
    });
}
