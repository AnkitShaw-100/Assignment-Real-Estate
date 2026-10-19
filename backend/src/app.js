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

// Without Clerk keys the API still serves public routes; every caller is anonymous.
const anonymousProvider = { resolveAuth: () => null, fetchProfile: async () => null };

async function defaultAuthProvider() {
  if (env.CLERK_SECRET_KEY) return (await import('./auth/clerkProvider.js')).clerkProvider;
  if (env.DEV_AUTH === 'true' && !env.isProd) {
    console.warn('DEV_AUTH is on: requests can pick a user with the x-dev-user header. Development only.');
    return (await import('./auth/devProvider.js')).devProvider;
  }
  if (!env.isTest) console.warn('CLERK_SECRET_KEY is not set: sign in is disabled, all requests are anonymous.');
  return anonymousProvider;
}

/**
 * Builds the Express app. Dependencies are injectable for tests:
 *   auth      – identity provider (defaults to Clerk)
 *   connect   – DB connector (tests connect to an in-memory Mongo themselves)
 */
export async function createApp({ auth, connect = connectDB } = {}) {
  const app = express();
  app.locals.auth = auth ?? (await defaultAuthProvider());

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

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  if (!env.isTest) {
    app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false }));
  }

  // Ensure a DB connection before any API route (cached after the first call)
  app.use('/api', async (_req, _res, next) => {
    await connect();
    next();
  });

  if (app.locals.auth.middleware) app.use(app.locals.auth.middleware());
  app.use('/api', attachUser);
  app.use('/api', apiRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
