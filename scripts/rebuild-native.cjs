const { spawnSync } = require('node:child_process');
const path = require('node:path');

const target = process.argv[2];
if (target !== 'node' && target !== 'electron') {
  console.error('Usage: node scripts/rebuild-native.cjs <node|electron>');
  process.exit(1);
}

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const projectRoot = path.resolve(__dirname, '..');

const result = target === 'node'
  ? spawnSync(npmCommand, ['rebuild', 'better-sqlite3', '--foreground-scripts'], {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  : spawnSync(process.execPath, [
      path.join(projectRoot, 'node_modules', '@electron', 'rebuild', 'lib', 'cli.js'),
      '--force',
      '--which-module',
      'better-sqlite3',
    ], {
      cwd: projectRoot,
      stdio: 'inherit',
    });

if (result.error) {
  console.error(`Failed to rebuild native modules for ${target}: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
