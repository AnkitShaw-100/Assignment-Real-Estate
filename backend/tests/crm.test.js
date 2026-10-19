import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestApp, teardownTestApp, resetDb, makeUser, propertyInput } from './helpers.js';
import { Customer, Lead, Property, Task } from '../src/models/index.js';

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

describe('tasks', () => {
  it('buckets tasks by due date for the signed in agent', async () => {
    const agent = await makeUser('agent');
    const other = await makeUser('agent');
    const noon = new Date();
    noon.setHours(12, 0, 0, 0);
    await Task.create([
      { title: 'Overdue', dueAt: new Date(noon - 2 * DAY), assignee: agent._id },
      { title: 'Today', dueAt: noon, assignee: agent._id },
      { title: 'Upcoming', dueAt: new Date(+noon + 2 * DAY), assignee: agent._id },
      { title: 'Done', dueAt: noon, assignee: agent._id, status: 'done', completedAt: new Date() },
      { title: 'Not mine', dueAt: noon, assignee: other._id },
    ]);

    const titles = async (due) => (await api(agent).get(`/api/tasks?due=${due}`)).body.data.map((t) => t.title);
    expect(await titles('overdue')).toEqual(['Overdue']);
    expect(await titles('today')).toEqual(['Today']);
    expect(await titles('upcoming')).toEqual(['Upcoming']);
    expect(await titles('done')).toEqual(['Done']);
  });

  it('stamps completedAt when a task is completed and clears it when reopened', async () => {
    const agent = await makeUser('agent');
    const task = await Task.create({ title: 'Send brochure', dueAt: new Date(), assignee: agent._id });

    const done = await api(agent).patch(`/api/tasks/${task._id}`).send({ status: 'done' });
    expect(done.body.data.completedAt).toBeTruthy();
    const reopened = await api(agent).patch(`/api/tasks/${task._id}`).send({ status: 'open' });
    expect(reopened.body.data.completedAt).toBeNull();
  });

  it('agents always assign tasks to themselves', async () => {
    const agent = await makeUser('agent');
    const other = await makeUser('agent');
    const res = await api(agent).post('/api/tasks').send({ title: 'Call back', dueAt: new Date().toISOString(), assignee: String(other._id) });
    expect(String(res.body.data.assignee)).toBe(String(agent._id));
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
    expect(mine.pipeline.map((p) => p.stage)).toEqual(['new', 'contacted', 'qualified', 'site_visit', 'negotiation', 'won', 'lost']);

    const all = (await api(admin).get('/api/dashboard/overview')).body.data;
    expect(all.kpis.sales.value).toBe(1000);
  });

  it('is staff only', async () => {
    const buyer = await makeUser('buyer');
    expect((await api(buyer).get('/api/dashboard/overview')).status).toBe(403);
  });
});
