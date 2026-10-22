import mongoose from 'mongoose';
import { inject } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/createApp.js';
import { User } from '../src/models/index.js';
import { signToken } from '../src/auth/tokens.js';

export const TEST_PASSWORD = 'correct-horse-battery';
// Cost 4 keeps makeUser fast; login still verifies it like a real hash
const TEST_HASH = bcrypt.hashSync(TEST_PASSWORD, 4);

export async function setupTestApp() {
  // Unique database per test file on the shared server from globalSetup.js
  await mongoose.connect(inject('mongoUri'), { dbName: `test_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` });
  const app = await createApp({ connect: async () => {} });

  /** api(user?) → supertest agent that sends requests as that user (real signed token). */
  const api = (user) => {
    const as = (req) => (user ? req.set('authorization', `Bearer ${signToken(user)}`) : req);
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
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}

export async function resetDb() {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}

let counter = 0;
export async function makeUser(role = 'buyer', overrides = {}) {
  counter += 1;
  return User.create({
    passwordHash: TEST_HASH,
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
