import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';

// Local development entry. On Vercel, api/index.js is used instead.
await connectDB();
const app = await createApp();

app.listen(env.PORT, () => {
  console.log(`Niwas API listening on http://localhost:${env.PORT}`);
});
