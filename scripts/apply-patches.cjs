/**
 * Applies patch-package patches. Skips gracefully when patch-package is not
 * installed yet (e.g. first npm install pass) so install does not fail.
 */
const { existsSync } = require('fs');
const { spawnSync } = require('child_process');
const path = require('path');

const entry = path.join(__dirname, '..', 'node_modules', 'patch-package', 'index.js');

if (!existsSync(entry)) {
  console.error(
    '[patches] patch-package is missing. From the repo root run:\n' +
      '  npm install --ignore-scripts\n' +
      '  npm install',
  );
  process.exit(1);
}

const result = spawnSync(process.execPath, [entry], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit',
});

process.exit(result.status === null ? 1 : result.status);
