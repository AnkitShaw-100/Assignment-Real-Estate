import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { User } from '../src/models/index.js';

/**
 * Fake identity provider: the test chooses who is "signed in" with the
 * x-test-clerk-id header, and profiles come from a map instead of Clerk.
 */
export const profiles = new Map();
const fakeAuth = {
  resolveAuth: (req) => req.get('x-test-clerk-id') ?? null,
  fetchProfile: async (id) => profiles.get(id),
  setRole: async () => {},
};

let mongo;

export async function setupTestApp() {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  const app = await createApp({ auth: fakeAuth, connect: async () => {} });

  /** api(user?) → supertest agent that sends requests as that user. */
  const api = (user) => {
    const as = (req) => (user ? req.set('x-test-clerk-id', user.clerkId) : req);
    return {
      get: (url) => as(request(app).get(url)),
      post: (url) => as(request(app).post(url)),
      patch: (url) => as(request(app).patch(url)),
      delete: (url) => as(request(app).delete(url)),
    };
  };
  return { app, api };
}

export async function teardownTestApp() {
  await mongoose.disconnect();
  await mongo?.stop();
}

export async function resetDb() {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
  profiles.clear();
}

let counter = 0;
export async function makeUser(role = 'buyer', overrides = {}) {
  counter += 1;
  return User.create({
    clerkId: `user_${counter}`,
    name: `${role} ${counter}`,
    email: `${role}${counter}@niwas.test`,
    role,
    ...overrides,
  });
}

export function propertyInput(overrides = {}) {
  return {
    title: 'Seaside villa with private pool',
    description: 'A bright four bedroom villa a short walk from the beach, with a private pool and garden.',
    category: 'residential',
    type: 'villa',
    purpose: 'sale',
    price: 1_250_000,
    location: { city: 'Lisbon', area: 'Cascais', country: 'Portugal' },
    bedrooms: 4,
    bathrooms: 3,
    images: [{ url: 'https://images.unsplash.com/photo-1' }],
    ...overrides,
  };
}
