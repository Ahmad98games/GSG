const net = require('net');

const client = new net.Socket();
const HOST = '192.168.0.102';
const PORT = 9100;

console.log(`Connecting to ${HOST}:${PORT}...`);

client.connect(PORT, HOST, () => {
  console.log('Connected successfully! Sending receipt...');

  const ESC = '\x1b';
  const GS = '\x1d';

  const receipt = Buffer.concat([
    Buffer.from(ESC + '@', 'ascii'),
    Buffer.from(ESC + 'a\x01', 'ascii'),
    Buffer.from('NOXIS HUB THERMAL TEST\n\n', 'utf8'),
    Buffer.from(ESC + 'a\x00', 'ascii'),
    Buffer.from('Invoice: INV-000009\n', 'utf8'),
    Buffer.from('Item: AHM Suit x 1\n', 'utf8'),
    Buffer.from('Total: PKR 2,000.00\n', 'utf8'),
    Buffer.from('--------------------------------\n\n\n', 'ascii'),
    Buffer.from(GS + 'V\x41\x03', 'ascii')
  ]);

  client.write(receipt, () => {
    console.log('Data flushed to emulator. Closing connection.');
    client.end();
  });
});

client.on('error', (err) => {
  console.error('Socket Connection Error:', err.message);
});

client.on('close', () => {
  console.log('Connection closed.');
});
