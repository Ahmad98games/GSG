const { parentPort, workerData } = require('worker_threads');
const { NSPEncryption } = require('./encryption');
const { NSPProtobuf } = require('./protobuf');

if (parentPort) {
  parentPort.on('message', (packet: Buffer) => {
    try {
      const { encrypted, key } = packet as any;
      const decrypted = NSPEncryption.decrypt(encrypted, key);
      const payload = JSON.parse(decrypted.toString()); // Protobuf decode simulation
      parentPort?.postMessage({ status: 'ok', payload });
    } catch (err) {
      parentPort?.postMessage({ status: 'error', error: 'DECRYPT_FAIL' });
    }
  });
}
