const { spawn } = require('node:child_process');
const path = require('node:path');

const electronCommand = process.platform === 'win32'
  ? path.join(__dirname, '..', 'node_modules', 'electron', 'dist', 'electron.exe')
  : 'electron';
const child = spawn(electronCommand, ['.'], {
  env: { ...process.env, NODE_ENV: 'development' },
  stdio: 'inherit',
});

child.on('error', (error) => {
  console.error(`Failed to start Electron: ${error.message}`);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
