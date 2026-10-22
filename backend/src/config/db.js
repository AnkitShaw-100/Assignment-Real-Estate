import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.set('strictQuery', true);

// Without a listener, a failed connection's 'error' event is thrown as an
// uncaught exception and kills the serverless function (FUNCTION_INVOCATION_FAILED).
// Requests still get a 500 from the awaited connect() below; this just logs.
mongoose.connection.on('error', (err) => console.error('MongoDB connection error:', err.message));

// mongodb+srv needs an SRV lookup, which fails with ECONNREFUSED when Node
// picks up an unreachable resolver (e.g. 127.0.0.1 on some Windows setups).
if (env.dnsServers.length) dns.setServers(env.dnsServers);

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
