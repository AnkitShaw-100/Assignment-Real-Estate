// Vercel serverless entry (vercel.json: framework null, every path rewritten
// here). The app itself is built in src/server.js, which only listens when it
// runs outside Vercel.
export { default } from '../src/server.js';
