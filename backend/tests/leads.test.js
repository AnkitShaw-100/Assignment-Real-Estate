import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestApp, teardownTestApp, resetDb, makeUser, propertyInput } from './helpers.js';
import { Lead, Property, Customer } from '../src/models/index.js';

let api;
beforeAll(async () => ({ api } = await setupTestApp()));
afterAll(teardownTestApp);
beforeEach(resetDb);

const inquiry = (overrides = {}) => ({
  name: 'Meera Shah',
  email: 'meera@example.com',
  phone: '+91 98200 12345',
  message: 'Is the villa still available for a viewing this weekend?',
  intent: 'visit',
  ...overrides,
});

describe('website inquiries', () => {
  it('assigns an inquiry about a listing to that listing’s agent', async () => {
    const listingAgent = await makeUser('agent');
    await makeUser('agent');
    const property = await Property.create({ ...propertyInput(), agent: listingAgent._id });

    const res = await api().post('/api/leads/inquiry').send(inquiry({ property: String(property._id) }));
    expect(res.status).toBe(201);
    expect(res.body.data).toEqual({ id: expect.any(String), status: 'received' });

    const lead = await Lead.findById(res.body.data.id);
    expect(lead).toMatchObject({ source: 'website', status: 'new' });
    expect(String(lead.assignedTo)).toBe(String(listingAgent._id));
  });

  it('assigns general inquiries to the agent with the fewest open leads', async () => {
    const busy = await makeUser('agent');
    const free = await makeUser('agent');
    await Lead.create([
      { name: 'A', email: 'a@x.com', assignedTo: busy._id },
      { name: 'B', email: 'b@x.com', assignedTo: busy._id },
      { name: 'C', email: 'c@x.com', assignedTo: free._id, status: 'won' }, // closed: doesn't count
    ]);

    const res = await api().post('/api/leads/inquiry').send(inquiry());
    const lead = await Lead.findById(res.body.data.id);
    expect(String(lead.assignedTo)).toBe(String(free._id));
  });

  it('validates the form and returns field messages', async () => {
    const res = await api().post('/api/leads/inquiry').send({ name: 'M', email: 'nope' });
    expect(res.status).toBe(400);
    expect(res.body.error.details).toMatchObject({ name: ['Enter your name'], email: ['Enter a valid email'] });
  });

  it('rejects the honeypot field', async () => {
    const res = await api().post('/api/leads/inquiry').send(inquiry({ website: 'http://spam.example' }));
    expect(res.status).toBe(400);
  });

  it('shows a signed in visitor their own inquiries', async () => {
    await makeUser('agent');
    const buyer = await makeUser('buyer', { email: 'meera@example.com' });
    await api().post('/api/leads/inquiry').send(inquiry());
    await api().post('/api/leads/inquiry').send(inquiry({ email: 'someone@else.com' }));

    const res = await api(buyer).get('/api/leads/mine');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].assignedTo).toBeUndefined();
  });
});

describe('lead access', () => {
  it('scopes the list to the agent’s own leads; admin sees all', async () => {
    const a = await makeUser('agent');
    const b = await makeUser('agent');
    const admin = await makeUser('admin');
    await Lead.create([
      { name: 'Mine', email: 'm@x.com', assignedTo: a._id },
      { name: 'Theirs', email: 't@x.com', assignedTo: b._id },
    ]);

    expect((await api(a).get('/api/leads')).body.data.map((l) => l.name)).toEqual(['Mine']);
    expect((await api(admin).get('/api/leads')).body.total).toBe(2);
  });

  it("returns 404 for another agent's lead", async () => {
    const a = await makeUser('agent');
    const b = await makeUser('agent');
    const lead = await Lead.create({ name: 'Theirs', email: 't@x.com', assignedTo: b._id });
    expect((await api(a).get(`/api/leads/${lead._id}`)).status).toBe(404);
  });

  it('only admins reassign', async () => {
    const a = await makeUser('agent');
    const b = await makeUser('agent');
    const admin = await makeUser('admin');
    const lead = await Lead.create({ name: 'L', email: 'l@x.com', assignedTo: a._id });

    expect((await api(a).patch(`/api/leads/${lead._id}`).send({ assignedTo: String(b._id) })).status).toBe(403);
    const res = await api(admin).patch(`/api/leads/${lead._id}`).send({ assignedTo: String(b._id) });
    expect(String(res.body.data.assignedTo)).toBe(String(b._id));
  });

});

describe('pipeline', () => {
  async function setup() {
    const agent = await makeUser('agent');
    const property = await Property.create({ ...propertyInput(), agent: agent._id });
    const lead = await Lead.create({ name: 'Kiran', email: 'kiran@x.com', assignedTo: agent._id, property: property._id });
    return { agent, property, lead };
  }

  it('records stage changes in the activity log', async () => {
    const { agent, lead } = await setup();
    const res = await api(agent).patch(`/api/leads/${lead._id}/stage`).send({ stage: 'qualified' });
    expect(res.status).toBe(200);
    expect(res.body.data.activity.at(-1)).toMatchObject({ type: 'stage', from: 'new', to: 'qualified' });
  });

  it('requires a deal value to win and a reason to lose', async () => {
    const { agent, lead } = await setup();
    const won = await api(agent).patch(`/api/leads/${lead._id}/stage`).send({ stage: 'won' });
    expect(won.status).toBe(400);
    expect(won.body.error.details.dealValue).toBeDefined();
    const lost = await api(agent).patch(`/api/leads/${lead._id}/stage`).send({ stage: 'lost' });
    expect(lost.body.error.details.lostReason).toBeDefined();
  });

  it('winning creates the customer with the deal and marks the property sold', async () => {
    const { agent, property, lead } = await setup();
    const res = await api(agent).patch(`/api/leads/${lead._id}/stage`).send({ stage: 'won', dealValue: 1_200_000 });
    expect(res.status).toBe(200);

    const customer = await Customer.findOne({ email: 'kiran@x.com' });
    expect(customer.deals).toHaveLength(1);
    expect(customer.deals[0].value).toBe(1_200_000);
    expect(String(customer.assignedAgent)).toBe(String(agent._id));
    expect((await Property.findById(property._id)).status).toBe('sold');
  });

  it('reopening a won lead removes the deal and puts the property under offer', async () => {
    const { agent, property, lead } = await setup();
    await api(agent).patch(`/api/leads/${lead._id}/stage`).send({ stage: 'won', dealValue: 500 });
    await api(agent).patch(`/api/leads/${lead._id}/stage`).send({ stage: 'negotiation' });

    expect((await Customer.findOne({ email: 'kiran@x.com' })).deals).toHaveLength(0);
    expect((await Property.findById(property._id)).status).toBe('under_offer');
    expect((await Lead.findById(lead._id)).closedAt).toBeUndefined();
  });

  it('converting twice reuses the same customer', async () => {
    const { agent, lead } = await setup();
    await api(agent).post(`/api/leads/${lead._id}/convert`);
    await api(agent).post(`/api/leads/${lead._id}/convert`);
    expect(await Customer.countDocuments()).toBe(1);
  });
});
