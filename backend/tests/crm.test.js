import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestApp, teardownTestApp, resetDb, makeUser, propertyInput } from './helpers.js';
import { Customer, Lead, Property } from '../src/models/index.js';

let api;
beforeAll(async () => ({ api } = await setupTestApp()));
afterAll(teardownTestApp);
beforeEach(resetDb);

const DAY = 86_400_000;

describe('customers', () => {
  it('adds interactions newest first and scopes to the assigned agent', async () => {
    const agent = await makeUser('agent');
    const other = await makeUser('agent');
    const customer = await Customer.create({ name: 'Leela', email: 'leela@x.com', assignedAgent: agent._id });

    await api(agent).post(`/api/customers/${customer._id}/interactions`).send({ kind: 'call', summary: 'Intro call', at: new Date(Date.now() - DAY) });
    await api(agent).post(`/api/customers/${customer._id}/interactions`).send({ kind: 'site_visit', summary: 'Visited the villa' });

    const res = await api(agent).get(`/api/customers/${customer._id}`);
    expect(res.body.data.interactions.map((i) => i.kind)).toEqual(['site_visit', 'call']);
    expect((await api(other).get(`/api/customers/${customer._id}`)).status).toBe(404);
  });

  it('matches available listings to requirements', async () => {
    const agent = await makeUser('agent');
    await Property.create([
      { ...propertyInput({ title: 'Fits', price: 800_000, bedrooms: 3 }), agent: agent._id },
      { ...propertyInput({ title: 'Too pricey', price: 3_000_000, bedrooms: 3 }), agent: agent._id },
      { ...propertyInput({ title: 'Wrong city', price: 800_000, location: { city: 'Paris', country: 'France' } }), agent: agent._id },
      { ...propertyInput({ title: 'Rental', purpose: 'rent', price: 5_000 }), agent: agent._id },
    ]);
    const customer = await Customer.create({
      name: 'Leela',
      email: 'leela@x.com',
      type: 'buyer',
      assignedAgent: agent._id,
      requirements: { budgetMax: 1_000_000, locations: ['lisbon'], bedrooms: 3 },
    });

    const res = await api(agent).get(`/api/customers/${customer._id}/matches`);
    expect(res.body.data.map((p) => p.title)).toEqual(['Fits']);
  });
});

describe('dashboard overview', () => {
  it('returns KPIs, 12 months of sales and a full pipeline, scoped per agent', async () => {
    const a = await makeUser('agent');
    const b = await makeUser('agent');
    const admin = await makeUser('admin');
    await Property.create({ ...propertyInput(), agent: a._id });
    await Lead.create([
      { name: 'Won A', email: 'wa@x.com', assignedTo: a._id, status: 'won', dealValue: 100, closedAt: new Date() },
      { name: 'Open A', email: 'oa@x.com', assignedTo: a._id, source: 'referral' },
      { name: 'Won B', email: 'wb@x.com', assignedTo: b._id, status: 'won', dealValue: 900, closedAt: new Date() },
    ]);

    const mine = (await api(a).get('/api/dashboard/overview')).body.data;
    expect(mine.scope).toBe('mine');
    expect(mine.kpis.sales).toMatchObject({ count: 1, value: 100 });
    expect(mine.kpis.availableProperties).toBe(1);
    expect(mine.salesByMonth).toHaveLength(12);
    expect(mine.salesByMonth.at(-1).value).toBe(100);
    const now = new Date();
    expect(mine.salesByMonth.at(-1).month).toBe(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    expect(mine.pipeline.map((p) => p.stage)).toEqual(['new', 'contacted', 'qualified', 'site_visit', 'negotiation', 'won', 'lost']);

    const all = (await api(admin).get('/api/dashboard/overview')).body.data;
    expect(all.kpis.sales.value).toBe(1000);
  });

  it('is staff only', async () => {
    const buyer = await makeUser('buyer');
    expect((await api(buyer).get('/api/dashboard/overview')).status).toBe(403);
  });
});
