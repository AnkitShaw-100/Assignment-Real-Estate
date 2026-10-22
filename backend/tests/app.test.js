import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { setupTestApp, teardownTestApp, resetDb, makeUser, TEST_PASSWORD } from './helpers.js';
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

  it('registers a normal user and returns a working token', async () => {
    const res = await api().post('/api/auth/register').send({ name: 'Asha Rao', email: ' Asha@Example.com ', password: 'long-enough-pw' });
    expect(res.status).toBe(201);
    expect(res.body.data.user).toMatchObject({ name: 'Asha Rao', email: 'asha@example.com', role: 'buyer' });
    expect(res.body.data.user.passwordHash).toBeUndefined();

    const me = await api().get('/api/users/me').set('authorization', `Bearer ${res.body.data.token}`);
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe('asha@example.com');
  });

  it('makes ADMIN_EMAILS users admin when they register', async () => {
    const res = await api().post('/api/auth/register').send({ name: 'Boss', email: 'boss@niwas.test', password: 'long-enough-pw' });
    expect(res.body.data.user.role).toBe('admin');
  });

  it('ignores a role sent at registration', async () => {
    const res = await api().post('/api/auth/register').send({ name: 'Sneaky', email: 'sneaky@x.test', password: 'long-enough-pw', role: 'admin' });
    expect(res.body.data.user.role).toBe('buyer');
  });

  it('rejects duplicate emails and weak passwords', async () => {
    await makeUser('buyer', { email: 'taken@x.test' });
    const dup = await api().post('/api/auth/register').send({ name: 'Again', email: 'TAKEN@x.test', password: 'long-enough-pw' });
    expect(dup.status).toBe(409);
    const weak = await api().post('/api/auth/register').send({ name: 'Weak', email: 'weak@x.test', password: 'short' });
    expect(weak.status).toBe(400);
    expect(weak.body.error.details.password).toBeDefined();
  });

  it('signs in with the right password only', async () => {
    await makeUser('agent', { email: 'agent@niwas.test' });
    const ok = await api().post('/api/auth/login').send({ email: 'Agent@niwas.test', password: TEST_PASSWORD });
    expect(ok.status).toBe(200);
    expect(ok.body.data.user.role).toBe('agent');
    expect(ok.body.data.token).toEqual(expect.any(String));

    const wrong = await api().post('/api/auth/login').send({ email: 'agent@niwas.test', password: 'nope-nope-nope' });
    const unknown = await api().post('/api/auth/login').send({ email: 'ghost@niwas.test', password: TEST_PASSWORD });
    expect(wrong.status).toBe(401);
    // Same message either way, so the endpoint does not reveal which emails exist
    expect(unknown.body.error.message).toBe(wrong.body.error.message);
  });

  it('refuses sign in and existing tokens for deactivated accounts', async () => {
    const user = await makeUser('agent', { email: 'gone@niwas.test' });
    await User.updateOne({ _id: user._id }, { active: false });
    expect((await api().post('/api/auth/login').send({ email: 'gone@niwas.test', password: TEST_PASSWORD })).status).toBe(403);
    expect((await api(user).get('/api/users/me')).status).toBe(403);
  });

  it('rejects forged and expired tokens', async () => {
    const user = await makeUser('admin');
    const forged = jwt.sign({}, 'some-other-secret-that-is-long-enough', { subject: String(user._id), issuer: 'niwas-api' });
    expect((await api().get('/api/users/me').set('authorization', `Bearer ${forged}`)).status).toBe(401);
    const expired = jwt.sign({ exp: Math.floor(Date.now() / 1000) - 10 }, 'niwas-development-only-secret-do-not-use-in-prod', { subject: String(user._id), issuer: 'niwas-api' });
    expect((await api().get('/api/users/me').set('authorization', `Bearer ${expired}`)).status).toBe(401);
  });

  it('applies role changes to existing sessions immediately', async () => {
    const user = await makeUser('agent');
    expect((await api(user).get('/api/leads')).status).toBe(200);
    await User.updateOne({ _id: user._id }, { role: 'buyer' });
    expect((await api(user).get('/api/leads')).status).toBe(403);
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
