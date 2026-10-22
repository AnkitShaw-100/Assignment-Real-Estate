import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { sanitize } from './middleware/sanitize.js';
import { attachUser } from './middleware/auth.js';
import { notFound, errorHandler } from './middleware/error.js';
import { apiRouter } from './routes.js';
import { statusPage } from './statusPage.js';

/**
 * Builds the Express app. Dependencies are injectable for tests:
 *   connect   – DB connector (tests connect to an in-memory Mongo themselves)
 */
export async function createApp({ connect = connectDB } = {}) {
  if (!env.JWT_SECRET && !env.isTest) console.warn('JWT_SECRET is not set: using a development-only signing key.');
  const app = express();

  app.set('trust proxy', 1); // Vercel sits behind a proxy; needed for rate-limit IPs
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(
    cors({
      origin(origin, cb) {
        // Allow same-origin/server-to-server (no Origin header) and the configured frontends
        if (!origin || env.clientOrigins.includes(origin)) return cb(null, true);
        cb(null, false);
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(sanitize);

  app.get('/', statusPage(connect));
  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  if (!env.isTest) {
    app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false }));
  }

  // Ensure a DB connection before any API route (cached after the first call)
  app.use('/api', async (_req, _res, next) => {
    await connect();
    next();
  });

  app.use('/api', attachUser);
  app.use('/api', apiRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
