const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const args = process.argv.slice(2);
const checkOnly = args.includes('--check-only');
const reportArgument = args.find((argument) => argument !== '--check-only');

if (!reportArgument) {
  throw new Error('Uso: node scripts/open-report.js [--check-only] <arquivo.html>');
}

const reportPath = path.resolve(reportArgument);
if (!fs.existsSync(reportPath)) {
  throw new Error(`Relatório não encontrado: ${reportPath}`);
}

if (checkOnly) {
  console.log(`Relatório validado: ${reportPath}`);
  process.exit(0);
}

const openerByPlatform = {
  win32: { command: 'cmd.exe', args: ['/d', '/s', '/c', 'start', '', reportPath] },
  darwin: { command: 'open', args: [reportPath] },
  linux: { command: 'xdg-open', args: [reportPath] }
};

const opener = openerByPlatform[process.platform];
if (!opener) {
  throw new Error(`Sistema operacional não suportado: ${process.platform}`);
}

const child = spawn(opener.command, opener.args, {
  detached: true,
  stdio: 'ignore'
});

child.on('error', (error) => {
  console.error(`Não foi possível abrir o relatório: ${error.message}`);
  process.exitCode = 1;
});

child.unref();
console.log(`Relatório aberto: ${reportPath}`);
