import { spawn } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getViteRoot } from './vite-root.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const viteRoot = getViteRoot(projectRoot);
const viteCli = join(viteRoot, 'node_modules', 'vite', 'bin', 'vite.js');
const child = spawn(
  process.execPath,
  ['--preserve-symlinks', '--preserve-symlinks-main', viteCli, ...process.argv.slice(2)],
  { cwd: viteRoot, stdio: 'inherit', windowsHide: true },
);

child.on('error', (error) => {
  console.error('No se pudo iniciar Vite:', error);
  process.exitCode = 1;
});
child.on('exit', (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
