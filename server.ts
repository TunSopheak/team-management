import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './server/app';
import { config } from './server/config';
import { closeDb, getDb } from './server/db';
import { runMigrations } from './server/db/migrate';
import { seedIfEmpty } from './server/db/seed';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const db = await getDb();
  await runMigrations(db);
  console.log(`[db] connected (${db.kind === 'pglite' ? `embedded PGlite at ${config.pgliteDir}` : 'PostgreSQL'})`);

  // Auto-seed demo data if empty database so app is immediately usable
  try {
    const seeded = await seedIfEmpty(db);
    if (seeded) {
      console.log('[db] Auto-seeded demo accounts and initial data');
    }
  } catch (err) {
    console.warn('[db] Seed check/run warning:', err);
  }

  const app = createApp();

  if (!config.isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: config.port },
      appType: 'spa',
      root: path.resolve(__dirname, 'client'),
    });

    app.use(vite.middlewares);

    app.use(async (req, res, next) => {
      if (req.method !== 'GET') return next();
      const url = req.originalUrl;
      if (url.startsWith('/api')) {
        return next();
      }
      try {
        const indexPath = path.resolve(__dirname, 'client', 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  }

  const server = app.listen(config.port, '0.0.0.0', () => {
    console.log(`[server] LeaderSync listening on http://0.0.0.0:${config.port}`);
  });

  const shutdown = (signal: string) => {
    console.log(`[server] ${signal} received, shutting down...`);
    server.close(async () => {
      await closeDb();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch(err => {
  console.error('[server] failed to start:', err);
  process.exit(1);
});
