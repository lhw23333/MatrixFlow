const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const distRoot = path.join(projectRoot, 'dist', 'electron');

function copyDirectory(source, destination) {
  if (!fs.existsSync(source)) {
    throw new Error(`Build asset directory does not exist: ${source}`);
  }

  fs.cpSync(source, destination, { recursive: true });
}

const migrationsSource = path.join(projectRoot, 'electron', 'data', 'migrations');
const migrationsDestination = path.join(distRoot, 'data', 'migrations');
fs.mkdirSync(migrationsDestination, { recursive: true });

for (const file of fs.readdirSync(migrationsSource)) {
  if (file.endsWith('.sql')) {
    fs.copyFileSync(
      path.join(migrationsSource, file),
      path.join(migrationsDestination, file),
    );
  }
}

copyDirectory(
  path.join(projectRoot, 'electron', 'browser-ui'),
  path.join(distRoot, 'browser-ui'),
);
copyDirectory(
  path.join(projectRoot, 'electron', 'services', 'embedded-browser', 'stealth-scripts'),
  path.join(distRoot, 'services', 'embedded-browser', 'stealth-scripts'),
);

console.log('Electron assets copied successfully.');
