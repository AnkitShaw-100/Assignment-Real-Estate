import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.set('strictQuery', true);

// On Vercel every request may hit a fresh function instance, but warm
// instances reuse module state. Caching the connection promise on
// globalThis means we connect once per instance instead of per request.
const cache = globalThis.__mongoose ?? (globalThis.__mongoose = { conn: null, promise: null });

export async function connectDB(uri = env.MONGODB_URI) {
  if (cache.conn) return cache.conn;
  if (!uri) throw new Error('MONGODB_URI is not set');

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 8000, maxPoolSize: 10 })
      .catch((err) => {
        cache.promise = null; // allow a retry on the next request
        throw err;
      });
  }
  cache.conn = await cache.promise;
  return cache.conn;
}

export async function disconnectDB() {
  await mongoose.disconnect();
  cache.conn = null;
  cache.promise = null;
}
