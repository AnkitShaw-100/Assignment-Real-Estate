import mongoose from 'mongoose';

/**
 * GET / : a small human-readable status page, so opening the API URL in a
 * browser shows it's running instead of a bare 404. It waits up to 3s for
 * the database so the status is meaningful on a cold start.
 */
export function statusPage(connect) {
  return async (_req, res) => {
    const db = await Promise.race([
      connect().then(() => 'connected'),
      new Promise((resolve) => setTimeout(() => resolve(mongoose.connection.readyState === 1 ? 'connected' : 'not connected'), 3000)),
    ]).catch(() => 'unreachable');

    const ok = db === 'connected';
    const row = (label, value, good) =>
      `<li><span>${label}</span><b class="${good ? 'ok' : 'bad'}">${value}</b></li>`;

    res.type('html').send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Niwas API</title>
<style>
  :root { color-scheme: light; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f2f3f5; color: #0c1a3b;
         font: 15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  main { width: min(420px, calc(100% - 32px)); background: #fff; border: 1px solid #e3e5ea; border-radius: 20px; padding: 28px; }
  h1 { margin: 0; font-size: 24px; letter-spacing: -0.02em; }
  p { margin: 6px 0 20px; color: #5d6678; }
  ul { list-style: none; margin: 0; padding: 0; border-top: 1px solid #e3e5ea; }
  li { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e3e5ea; }
  b { font-weight: 600; } .ok { color: #1e7b45; } .bad { color: #b42318; }
  a { color: #3d5a80; }
</style></head>
<body><main>
  <h1>Niwas API is running</h1>
  <p>REST API for the Niwas real estate website and CRM.</p>
  <ul>
    ${row('API', 'online', true)}
    ${row('Database', db, ok)}
    ${row('Environment', process.env.NODE_ENV ?? 'development', true)}
  </ul>
  <p style="margin:18px 0 0">Health check: <a href="/api/health">/api/health</a></p>
</main></body></html>`);
  };
}
