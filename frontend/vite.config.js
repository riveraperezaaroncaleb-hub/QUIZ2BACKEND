import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { getViteRoot } from './scripts/vite-root.mjs';

const projectRoot = dirname(fileURLToPath(import.meta.url));
const viteRoot = getViteRoot(projectRoot);

export default defineConfig({
  root: viteRoot,
  plugins: [react()],
  resolve: {
    preserveSymlinks: true,
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    fs: {
      allow: [projectRoot, viteRoot],
    },
  },
});
