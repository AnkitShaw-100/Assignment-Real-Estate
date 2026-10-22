import express from 'express';
import { createApp } from './createApp.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';

// One entry for both environments. Vercel's Express preset picks this file up
// (it looks for an app/index/server file that imports express) and serves the
// default export. Locally it connects up front and listens.
const app = express();
app.use(await createApp());

if (!process.env.VERCEL) {
  await connectDB(); // fail fast on a bad MONGODB_URI
  app.listen(env.PORT, () => {
    console.log(`Niwas API listening on http://localhost:${env.PORT}`);
  });
}

export default app;
