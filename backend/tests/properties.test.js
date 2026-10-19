import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestApp, teardownTestApp, resetDb, makeUser, propertyInput } from './helpers.js';
import { Property } from '../src/models/index.js';

let api;
beforeAll(async () => ({ api } = await setupTestApp()));
afterAll(teardownTestApp);
beforeEach(resetDb);

async function seedListings(agent) {
  await Property.create([
    { ...propertyInput({ title: 'Lisbon villa', price: 900_000, bedrooms: 4 }), agent: agent._id },
    { ...propertyInput({ title: 'Dubai penthouse', type: 'penthouse', price: 2_500_000, bedrooms: 3, location: { city: 'Dubai', country: 'UAE' } }), agent: agent._id },
    { ...propertyInput({ title: 'Dubai office', category: 'commercial', type: 'office', purpose: 'rent', price: 8_000, bedrooms: 0, location: { city: 'Dubai', country: 'UAE' } }), agent: agent._id },
    { ...propertyInput({ title: 'Big family home', type: 'house', price: 1_100_000, bedrooms: 6 }), agent: agent._id },
    { ...propertyInput({ title: 'Draft listing', status: 'draft' }), agent: agent._id },
    { ...propertyInput({ title: 'Sold villa', status: 'sold' }), agent: agent._id },
  ]);
}

describe('public listings', () => {
  it('hides drafts and sold listings', async () => {
    await seedListings(await makeUser('agent'));
    const res = await api().get('/api/properties');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(4);
    expect(res.body.data.map((p) => p.title)).not.toContain('Draft listing');
  });

  it('combines city, category and price filters', async () => {
    await seedListings(await makeUser('agent'));
    const res = await api().get('/api/properties?city=dubai&category=residential&minPrice=1000000');
    expect(res.body.data.map((p) => p.title)).toEqual(['Dubai penthouse']);
  });

  it('treats beds=5 as five or more', async () => {
    await seedListings(await makeUser('agent'));
    const res = await api().get('/api/properties?beds=5');
    expect(res.body.data.map((p) => p.title)).toEqual(['Big family home']);
  });

  it('sorts by price ascending', async () => {
    await seedListings(await makeUser('agent'));
    const res = await api().get('/api/properties?sort=price_asc');
    const prices = res.body.data.map((p) => p.price);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it('rejects an inverted price range', async () => {
    const res = await api().get('/api/properties?minPrice=500&maxPrice=100');
    expect(res.status).toBe(400);
  });

  it('rejects unknown enum values with field details', async () => {
    const res = await api().get('/api/properties?type=castle');
    expect(res.status).toBe(400);
    expect(res.body.error.details.type).toBeDefined();
  });

  it('serves detail by slug with agent contact, but 404s for drafts', async () => {
    const agent = await makeUser('agent', { phone: '+1 555 0100' });
    const live = await Property.create({ ...propertyInput(), agent: agent._id });
    const draft = await Property.create({ ...propertyInput({ status: 'draft' }), agent: agent._id });

    const ok = await api().get(`/api/properties/${live.slug}`);
    expect(ok.status).toBe(200);
    expect(ok.body.data.agent).toMatchObject({ name: agent.name, phone: '+1 555 0100' });

    expect((await api().get(`/api/properties/${draft.slug}`)).status).toBe(404);
    // ...but the owning agent can preview it
    expect((await api(agent).get(`/api/properties/${draft.slug}`)).status).toBe(200);
  });
});

describe('managing listings', () => {
  it('lets agents create listings owned by themselves', async () => {
    const agent = await makeUser('agent');
    const other = await makeUser('agent');
    const res = await api(agent).post('/api/properties').send({ ...propertyInput(), agent: String(other._id) });
    expect(res.status).toBe(201);
    expect(String(res.body.data.agent)).toBe(String(agent._id));
    expect(res.body.data.slug).toMatch(/^seaside-villa-with-private-pool-/);
  });

  it('returns field errors for invalid input', async () => {
    const agent = await makeUser('agent');
    const res = await api(agent).post('/api/properties').send({ title: 'x', price: -5 });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.error.details)).toEqual(expect.arrayContaining(['title', 'price', 'description']));
  });

  it("blocks buyers from creating and agents from editing others' listings", async () => {
    const buyer = await makeUser('buyer');
    const owner = await makeUser('agent');
    const intruder = await makeUser('agent');
    const property = await Property.create({ ...propertyInput(), agent: owner._id });

    expect((await api(buyer).post('/api/properties').send(propertyInput())).status).toBe(403);
    expect((await api(intruder).patch(`/api/properties/${property._id}`).send({ price: 1 })).status).toBe(404);
    expect((await api(intruder).delete(`/api/properties/${property._id}`)).status).toBe(404);
  });

  it('lets admins edit any listing; PATCH only changes sent fields', async () => {
    const admin = await makeUser('admin');
    const owner = await makeUser('agent');
    const property = await Property.create({ ...propertyInput({ featured: true }), agent: owner._id });

    const res = await api(admin).patch(`/api/properties/${property._id}`).send({ price: 999 });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ price: 999, featured: true, status: 'available' });
  });

  it('scope=manage shows an agent only their own listings, including drafts', async () => {
    const a = await makeUser('agent');
    const b = await makeUser('agent');
    await Property.create([
      { ...propertyInput({ status: 'draft' }), agent: a._id },
      { ...propertyInput(), agent: b._id },
    ]);
    const res = await api(a).get('/api/properties?scope=manage');
    expect(res.body.total).toBe(1);
    expect(res.body.data[0].status).toBe('draft');
    expect((await api().get('/api/properties?scope=manage')).status).toBe(403);
  });
});

describe('saved properties', () => {
  it('saves and unsaves for a signed in buyer', async () => {
    const buyer = await makeUser('buyer');
    const property = await Property.create({ ...propertyInput(), agent: (await makeUser('agent'))._id });

    expect((await api(buyer).post(`/api/users/me/saved/${property._id}`)).status).toBe(204);
    expect((await api(buyer).get('/api/users/me/saved')).body.data).toHaveLength(1);
    await api(buyer).delete(`/api/users/me/saved/${property._id}`);
    expect((await api(buyer).get('/api/users/me/saved')).body.data).toHaveLength(0);
  });
});
