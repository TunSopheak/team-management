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
    host: '0.0.0.0',
    port: 3000,
  },
});
