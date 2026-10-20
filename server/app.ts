import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { getDb } from './db';
import { requireAuth } from './middleware/auth';
import { errorHandler, notFoundApi } from './middleware/errors';
import { authRouter } from './routes/auth';
import { bootstrapRouter } from './routes/bootstrap';
import { groupsRouter } from './routes/groups';
import { usersRouter } from './routes/users';
import { tasksRouter } from './routes/tasks';
import { dailyLogsRouter } from './routes/dailyLogs';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // behind Render/Railway/Fly/NGINX load balancers

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
          // Let HTTPS be enforced by the host/proxy; this directive breaks plain-HTTP setups.
          'upgrade-insecure-requests': null,
        },
      },
    })
  );
  app.use(compression());
  if (config.corsOrigins.length > 0) {
    app.use('/api', cors({ origin: config.corsOrigins, credentials: true }));
  }
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  // ---- API ----
  app.get('/api/health', async (_req, res) => {
    const db = await getDb();
    await db.query('SELECT 1');
    res.json({ ok: true, db: db.kind });
  });

  app.use('/api/auth', authRouter);
  const api = express.Router();
  api.use(requireAuth);
  api.use(bootstrapRouter, groupsRouter, usersRouter, tasksRouter, dailyLogsRouter);
  app.use('/api', api);
  app.use('/api', notFoundApi);

  // ---- Frontend (production build) ----
  const indexHtml = path.join(config.clientDistDir, 'index.html');
  if (fs.existsSync(indexHtml)) {
    app.use(express.static(config.clientDistDir, { index: false, maxAge: '1y', immutable: true }));
    // SPA fallback: any non-API GET returns index.html (never cached so new deploys load immediately).
    app.get(/^(?!\/api\/).*/, (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(indexHtml);
    });
  }

  app.use(errorHandler);
  return app;
}
