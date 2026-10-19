// Vercel serverless entry. Vercel calls the default export as a request
// handler; an Express app is one. The DB connection is opened lazily by the
// app's middleware and cached across warm invocations (see src/config/db.js).
import { createApp } from '../src/app.js';

const app = await createApp();
export default app;
