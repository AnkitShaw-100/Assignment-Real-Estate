import { createApp } from './createApp.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';

const app = await createApp();

// One entry for both environments.
// Locally: connect up front (fail fast on a bad MONGODB_URI) and listen.
// On Vercel (vercel.json routes every request here) it must not listen or crash
// on a DB error; it only exports the app, which connects lazily per request.
if (!process.env.VERCEL) {
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`Niwas API listening on http://localhost:${env.PORT}`);
  });
}

export default app;
