/**
 * npm run seed — resets the database with realistic demo data.
 *
 * Staff accounts are created with placeholder Clerk ids (seed_*). When a
 * person signs in through Clerk with the same email, attachUser() links the
 * real Clerk id to the seeded user, keeping their role and data.
 */
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { User, Property, Lead, Customer, Task, OPEN_LEAD_STAGES } from '../models/index.js';
import { PROPERTIES } from './data/properties.js';

// Deterministic randomness: same data on every run
let seed = 42;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const pick = (list) => list[Math.floor(rand() * list.length)];
const between = (min, max) => Math.floor(min + rand() * (max - min + 1));
const daysAgo = (n) => new Date(Date.now() - n * 86_400_000);
const daysFromNow = (n) => new Date(Date.now() + n * 86_400_000);

const ADMIN_EMAIL = env.adminEmails[0] ?? 'admin+clerk_test@niwas.app';

const STAFF = [
  { name: 'Niwas Admin', email: ADMIN_EMAIL, role: 'admin', title: 'Managing director', phone: '+1 415 555 0100' },
  { name: 'Aarav Mehta', email: 'agent+clerk_test@niwas.app', role: 'agent', title: 'Senior agent', phone: '+1 415 555 0101', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop' },
  { name: 'Sofia Lindqvist', email: 'sofia+clerk_test@niwas.app', role: 'agent', title: 'Luxury homes specialist', phone: '+1 415 555 0102', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop' },
  { name: 'Daniel Okafor', email: 'daniel+clerk_test@niwas.app', role: 'agent', title: 'Commercial agent', phone: '+1 415 555 0103', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop' },
];

const FIRST = ['Meera', 'James', 'Lucia', 'Omar', 'Hannah', 'Kenji', 'Priya', 'Lars', 'Amara', 'Diego', 'Chloe', 'Ravi', 'Elena', 'Tom', 'Fatima', 'Noah', 'Isabel', 'Yusuf', 'Grace', 'Mateo'];
const LAST = ['Shah', 'Carter', 'Romano', 'Haddad', 'Becker', 'Sato', 'Iyer', 'Nilsson', 'Okoro', 'Alvarez', 'Martin', 'Kapoor', 'Petrova', 'Walsh', 'Rahman', 'Fischer', 'Costa', 'Demir', 'Kim', 'Silva'];
const SOURCES = ['website', 'website', 'website', 'referral', 'portal', 'social', 'phone', 'walk_in'];
const MESSAGES = [
  'Is this still available? We would like to arrange a viewing.',
  'Could you share the floor plan and service charges?',
  'We are relocating in spring and this looks perfect for our family.',
  'Is the price negotiable for a cash buyer?',
  'Can we book a video tour this week?',
  'Looking for something similar with an extra bedroom.',
];
const LOST_REASONS = ['Chose another property', 'Budget too low', 'Financing fell through', 'Stopped responding'];
const INTERACTIONS = [
  ['call', 'Intro call: confirmed budget and preferred areas.'],
  ['email', 'Sent brochure and floor plans.'],
  ['site_visit', 'Viewed the property; liked the light and layout.'],
  ['meeting', 'Met at the office to discuss financing options.'],
  ['note', 'Prefers contact by WhatsApp in the evenings.'],
];

// Stage mix that makes the pipeline and charts look like a real business
const STAGE_WEIGHTS = [
  ['new', 8], ['contacted', 7], ['qualified', 6], ['site_visit', 5], ['negotiation', 4], ['won', 9], ['lost', 5],
];
const weightedStage = () => {
  let r = rand() * STAGE_WEIGHTS.reduce((s, [, w]) => s + w, 0);
  for (const [stage, w] of STAGE_WEIGHTS) if ((r -= w) < 0) return stage;
  return 'new';
};

/** Resets and fills the connected database. Exported so dev-memory.js can reuse it. */
export async function seedDatabase({ log = console.log } = {}) {
  log('Clearing collections…');
  await Promise.all([Property.deleteMany({}), Lead.deleteMany({}), Customer.deleteMany({}), Task.deleteMany({})]);

  // Keep users who already signed in (real Clerk ids), reset seeded ones
  await User.deleteMany({ clerkId: /^seed_/ });
  const staff = [];
  for (const [i, s] of STAFF.entries()) {
    const user = await User.findOneAndUpdate(
      { email: s.email },
      { $set: { ...s, active: true }, $setOnInsert: { clerkId: `seed_${i}` } },
      { upsert: true, returnDocument: 'after' },
    );
    staff.push(user);
  }
  const agents = staff.filter((u) => u.role === 'agent');
  const [, aarav, sofia, daniel] = staff;

  // Listings: commercial to Daniel, the rest split between Aarav and Sofia
  const properties = [];
  for (const [i, p] of PROPERTIES.entries()) {
    const agent = p.category === 'commercial' || p.type === 'land' ? daniel : i % 2 ? sofia : aarav;
    properties.push(await Property.create({ ...p, agent: agent._id, views: between(40, 900), createdAt: daysAgo(between(5, 170)) }));
  }
  log(`Created ${properties.length} properties`);

  // Leads across the last ~6 months
  const leads = [];
  for (let i = 0; i < 48; i += 1) {
    const property = rand() < 0.85 ? pick(properties) : null;
    const assignedTo = property?.agent ?? pick(agents)._id;
    const name = `${FIRST[i % FIRST.length]} ${LAST[(i * 7) % LAST.length]}`;
    const createdAt = daysAgo(between(0, 175));
    const status = weightedStage();
    const closed = status === 'won' || status === 'lost';
    const closedAt = closed ? new Date(Math.min(Date.now(), +createdAt + between(7, 45) * 86_400_000)) : undefined;

    const lead = {
      name,
      email: `${name.toLowerCase().replace(' ', '.')}${i}@example.com`,
      phone: `+1 555 01${String(i).padStart(2, '0')}`,
      message: pick(MESSAGES),
      intent: property?.purpose === 'rent' ? 'rent' : pick(['buy', 'visit', 'buy']),
      source: pick(SOURCES),
      property: property?._id,
      status,
      assignedTo,
      createdAt,
      closedAt,
      dealValue: status === 'won' || status === 'negotiation' ? Math.round((property?.price ?? 900_000) * (0.92 + rand() * 0.08)) : undefined,
      lostReason: status === 'lost' ? pick(LOST_REASONS) : undefined,
      followUpDate: OPEN_LEAD_STAGES.includes(status) && rand() < 0.7 ? daysFromNow(between(-3, 10)) : undefined,
      activity: [], // filled below once the source is known
      notes: rand() < 0.5 ? [{ body: pick(INTERACTIONS)[1], author: assignedTo }] : [],
    };
    lead.activity.push({ type: 'created', to: lead.source, at: createdAt });
    leads.push(lead);
  }
  const createdLeads = await Lead.insertMany(leads);
  log(`Created ${createdLeads.length} leads`);

  // Customers: every won lead, plus qualified-or-later leads
  let customerCount = 0;
  for (const lead of createdLeads) {
    if (!['qualified', 'site_visit', 'negotiation', 'won'].includes(lead.status)) continue;
    const property = properties.find((p) => String(p._id) === String(lead.property));
    const customer = await Customer.create({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      type: property?.purpose === 'rent' ? 'renter' : rand() < 0.25 ? 'investor' : 'buyer',
      assignedAgent: lead.assignedTo,
      requirements: {
        budgetMin: property ? Math.round(property.price * 0.7) : 500_000,
        budgetMax: property ? Math.round(property.price * 1.2) : 1_500_000,
        locations: property ? [property.location.city] : ['Lisbon'],
        types: property ? [property.type] : ['apartment'],
        bedrooms: property?.bedrooms || undefined,
      },
      leads: [lead._id],
      deals: lead.status === 'won' ? [{ property: lead.property, lead: lead._id, value: lead.dealValue, closedAt: lead.closedAt }] : [],
      interactions: INTERACTIONS.slice(0, between(1, 4)).map(([kind, summary], k) => ({
        kind,
        summary,
        by: lead.assignedTo,
        at: new Date(+lead.createdAt + (k + 1) * 3 * 86_400_000),
      })),
    });
    lead.customer = customer._id;
    await lead.save();
    if (lead.status === 'won' && property) {
      property.status = property.purpose === 'rent' ? 'rented' : 'sold';
      await property.save();
    }
    customerCount += 1;
  }
  log(`Created ${customerCount} customers`);

  // Tasks: follow-ups from leads plus some general ones
  const tasks = createdLeads
    .filter((l) => l.followUpDate)
    .map((l) => ({ title: `Follow up with ${l.name}`, dueAt: l.followUpDate, assignee: l.assignedTo, lead: l._id, customer: l.customer, priority: pick(['low', 'medium', 'high']) }));
  const general = ['Prepare monthly market report', 'Update listing photos', 'Call mortgage partner', 'Plan open house', 'Review pricing on slow listings'];
  for (const [i, title] of general.entries()) {
    const assignee = agents[i % agents.length]._id;
    tasks.push({ title, dueAt: daysFromNow(i - 1), assignee, priority: i % 2 ? 'medium' : 'high' });
    tasks.push({ title: `${title} (last month)`, dueAt: daysAgo(20 + i), assignee, status: 'done', completedAt: daysAgo(19 + i) });
  }
  await Task.insertMany(tasks.map((t) => ({ ...t, createdBy: staff[0]._id })));
  log(`Created ${tasks.length} tasks`);

  log('\nDemo staff accounts (sign up in Clerk with these emails; dev code 424242):');
  for (const s of staff) log(`  ${s.role.padEnd(6)} ${s.email}`);
}

// Run directly with `npm run seed` (not when imported by dev-memory.js)
if (process.argv[1]?.replaceAll('\\', '/').endsWith('scripts/seed.js')) {
  try {
    await connectDB();
    await seedDatabase();
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
