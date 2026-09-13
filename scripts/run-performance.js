const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const [mode, ...options] = process.argv.slice(2);
const checkOnly = options.includes('--check-only');

if (!['load', 'spike'].includes(mode)) {
  console.error('Uso: node scripts/run-performance.js <load|spike> [--check-only]');
  process.exit(2);
}

const extension = process.platform === 'win32' ? 'bat' : 'sh';
const scriptPath = path.resolve(
  __dirname,
  '..',
  'blazedemo-performance-tests',
  'scripts',
  `run-${mode}-test.${extension}`
);

if (!fs.existsSync(scriptPath)) {
  console.error(`Script de performance não encontrado: ${scriptPath}`);
  process.exit(1);
}

if (checkOnly) {
  console.log(`Launcher validado para ${process.platform}: ${scriptPath}`);
  process.exit(0);
}

const command = process.platform === 'win32' ? 'cmd.exe' : 'bash';
const args = process.platform === 'win32'
  ? ['/d', '/s', '/c', `"${scriptPath}"`]
  : [scriptPath];
const result = spawnSync(command, args, {
  cwd: path.dirname(scriptPath),
  env: process.env,
  stdio: 'inherit'
});

if (result.error) {
  console.error(`Não foi possível iniciar o teste de performance: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
