const { spawn } = require('child_process');
const path = require('path');

const electronBinary = require('electron');
const appRoot = path.resolve(__dirname, '..');

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electronBinary, ['.'], {
  cwd: appRoot,
  env,
  stdio: 'inherit'
});

child.on('close', (code) => {
  process.exit(code || 0);
});
