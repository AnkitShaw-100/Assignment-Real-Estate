/**
 * npm run dev:memory — zero-setup local API.
 * Starts an in-memory MongoDB, seeds it, and serves the API on PORT.
 * Data disappears when the process stops. Use `npm run dev` with Atlas for real work.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 60_000 } });
process.env.MONGODB_URI = `${mongo.getUri()}niwas`;

const { connectDB } = await import('../config/db.js');
const { env } = await import('../config/env.js');
const { seedDatabase } = await import('./seed.js');
const { createApp } = await import('../app.js');

await connectDB();
await seedDatabase();
const app = await createApp();
app.listen(env.PORT, () => console.log(`\nNiwas API (in-memory DB) on http://localhost:${env.PORT}`));

const stop = async () => {
  await mongo.stop();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
