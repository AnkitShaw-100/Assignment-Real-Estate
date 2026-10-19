import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestApp, teardownTestApp, resetDb, makeUser, profiles } from './helpers.js';
import { User } from '../src/models/index.js';

let api;
beforeAll(async () => ({ api } = await setupTestApp()));
afterAll(teardownTestApp);
beforeEach(resetDb);

describe('app basics', () => {
  it('reports health', async () => {
    const res = await api().get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('returns the error shape for unknown routes', async () => {
    const res = await api().get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { message: 'Route not found' } });
  });

  it('rejects malformed JSON with 400', async () => {
    const res = await api().post('/api/leads/inquiry').set('content-type', 'application/json').send('{bad');
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/not valid JSON/);
  });
});

describe('auth and roles', () => {
  it('requires sign in for /users/me', async () => {
    const res = await api().get('/api/users/me');
    expect(res.status).toBe(401);
  });

  it('creates a buyer on first sign in', async () => {
    profiles.set('clerk_new', { name: 'Asha Rao', email: 'Asha@Example.com' });
    const res = await api({ clerkId: 'clerk_new' }).get('/api/users/me');
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ name: 'Asha Rao', email: 'asha@example.com', role: 'buyer' });
  });

  it('makes ADMIN_EMAILS users admin on first sign in', async () => {
    profiles.set('clerk_boss', { name: 'Boss', email: 'boss@niwas.test' });
    const res = await api({ clerkId: 'clerk_boss' }).get('/api/users/me');
    expect(res.body.data.role).toBe('admin');
  });

  it('relinks a seeded user by email instead of duplicating', async () => {
    await makeUser('agent', { clerkId: 'seed_1', email: 'agent@niwas.test' });
    profiles.set('clerk_real', { name: 'Agent', email: 'agent@niwas.test' });
    const res = await api({ clerkId: 'clerk_real' }).get('/api/users/me');
    expect(res.body.data.role).toBe('agent');
    expect(await User.countDocuments()).toBe(1);
  });

  it('blocks buyers from staff routes', async () => {
    const buyer = await makeUser('buyer');
    const res = await api(buyer).get('/api/leads');
    expect(res.status).toBe(403);
  });

  it('only lets admins change roles', async () => {
    const agent = await makeUser('agent');
    const buyer = await makeUser('buyer');
    const admin = await makeUser('admin');

    expect((await api(agent).patch(`/api/users/${buyer._id}/role`).send({ role: 'agent' })).status).toBe(403);
    const res = await api(admin).patch(`/api/users/${buyer._id}/role`).send({ role: 'agent' });
    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('agent');
  });

  it('ignores role in /users/me updates (no mass assignment)', async () => {
    const buyer = await makeUser('buyer');
    const res = await api(buyer).patch('/api/users/me').send({ name: 'New Name', role: 'admin' });
    expect(res.body.data).toMatchObject({ name: 'New Name', role: 'buyer' });
  });

  it('strips Mongo operators from bodies', async () => {
    const res = await api().post('/api/leads/inquiry').send({ name: 'Eve', email: { $gt: '' } });
    expect(res.status).toBe(400);
  });
});
