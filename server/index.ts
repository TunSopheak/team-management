import { createApp } from './app';
import { config } from './config';
import { closeDb, getDb } from './db';
import { runMigrations } from './db/migrate';

async function main() {
  const db = await getDb();
  await runMigrations(db);
  console.log(`[db] connected (${db.kind === 'pglite' ? `embedded PGlite at ${config.pgliteDir}` : 'PostgreSQL'})`);
  if (db.kind === 'pglite' && config.isProduction) {
    console.warn(
      '[db] WARNING: DATABASE_URL is not set, so data is stored on local disk. On most cloud hosts that disk ' +
        'is wiped on every deploy/restart. Set DATABASE_URL to a PostgreSQL database for production.'
    );
  }

  try {
    const { seedIfEmpty } = await import('./db/seed');
    await seedIfEmpty(db);
  } catch (err) {
    console.warn('[db] Seed check warning:', err);
  }

  const app = createApp();
  const server = app.listen(config.port, '0.0.0.0', () => {
    console.log(`[server] LeaderSync API listening on http://0.0.0.0:${config.port}`);
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
