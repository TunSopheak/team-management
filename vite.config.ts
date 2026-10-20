import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const apiPort = process.env.PORT || '3000';

export default defineConfig({
  root: path.resolve(rootDir, 'client'),
  envDir: rootDir,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@shared': path.resolve(rootDir, 'shared') },
  },
  build: {
    outDir: path.resolve(rootDir, 'dist/client'),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    // In development the Express API runs separately; forward /api calls to it.
    proxy: {
      '/api': `http://localhost:${apiPort}`,
    },
  },
});
