import { Router } from 'express';
import { z } from 'zod';
import { Customer, Property, CUSTOMER_TYPES, INTERACTION_KINDS, PUBLIC_PROPERTY_STATUSES } from '../../models/index.js';
import { validate } from '../../middleware/validate.js';
import { requireStaff, requireAdmin } from '../../middleware/auth.js';
import { idParams, objectId, phone } from '../../utils/schemas.js';
import { paginate, pageQuery } from '../../utils/paginate.js';
import { scopeFilter, assertInScope } from '../../utils/scope.js';
import { escapeRegex } from '../../utils/escapeRegex.js';
import { HttpError } from '../../utils/httpError.js';

// ---------- schemas ----------
const requirements = z
  .object({
    budgetMin: z.coerce.number().min(0).optional(),
    budgetMax: z.coerce.number().min(0).optional(),
    locations: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
    types: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
    bedrooms: z.coerce.number().int().min(0).max(20).optional(),
  })
  .refine((r) => r.budgetMin === undefined || r.budgetMax === undefined || r.budgetMin <= r.budgetMax, {
    message: 'Minimum budget must be lower than maximum',
    path: ['budgetMax'],
  });

const baseFields = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().trim().toLowerCase(),
  phone,
  type: z.enum(CUSTOMER_TYPES),
  requirements,
  assignedAgent: objectId,
  tags: z.array(z.string().trim().min(1).max(30)).max(10),
});
const createBody = baseFields.partial({ type: true, requirements: true, assignedAgent: true, tags: true });
const updateBody = baseFields.partial();

const interactionBody = z.object({
  kind: z.enum(INTERACTION_KINDS),
  summary: z.string().trim().min(2, 'Add a short summary').max(2000),
  at: z.coerce.date().optional(),
});

const listQuery = z.object({
  q: z.string().trim().max(100).optional(),
  type: z.enum(CUSTOMER_TYPES).optional(),
  ...pageQuery,
});

// ---------- handlers ----------
async function findScoped(req) {
  return assertInScope(req.user, await Customer.findById(req.valid.params.id), 'assignedAgent');
}

export const customersRouter = Router();
customersRouter.use(requireStaff);

customersRouter.get('/', validate({ query: listQuery }), async (req, res) => {
  const q = req.valid.query;
  const filter = scopeFilter(req.user, 'assignedAgent');
  if (q.type) filter.type = q.type;
  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  res.json(
    await paginate(Customer, filter, {
      page: q.page,
      limit: q.limit,
      sort: { updatedAt: -1 },
      populate: { path: 'assignedAgent', select: 'name avatar' },
      select: '-interactions',
    }),
  );
});

customersRouter.post('/', validate({ body: createBody }), async (req, res) => {
  const body = { ...req.body };
  if (req.user.role !== 'admin' || !body.assignedAgent) body.assignedAgent = req.user._id;
  const customer = await Customer.create(body);
  res.status(201).json({ data: customer });
});

customersRouter.get('/:id', validate({ params: idParams }), async (req, res) => {
  await findScoped(req);
  const customer = await Customer.findById(req.valid.params.id)
    .populate('assignedAgent', 'name email avatar')
    .populate('leads', 'status source createdAt dealValue property')
    .populate('deals.property', 'title slug images coverIndex')
    .populate('interactions.by', 'name avatar')
    .lean();
  customer.interactions.sort((a, b) => new Date(b.at) - new Date(a.at));
  res.json({ data: customer });
});

customersRouter.patch('/:id', validate({ params: idParams, body: updateBody }), async (req, res) => {
  const customer = await findScoped(req);
  const body = { ...req.body };
  if (req.user.role !== 'admin') delete body.assignedAgent;
  customer.set(body);
  await customer.save();
  res.json({ data: customer });
});

customersRouter.delete('/:id', requireAdmin, validate({ params: idParams }), async (req, res) => {
  const customer = await Customer.findById(req.valid.params.id);
  if (!customer) throw HttpError.notFound();
  await customer.deleteOne();
  res.status(204).end();
});

customersRouter.post(
  '/:id/interactions',
  validate({ params: idParams, body: interactionBody }),
  async (req, res) => {
    const customer = await findScoped(req);
    customer.interactions.push({ ...req.body, by: req.user._id });
    await customer.save();
    res.status(201).json({ data: customer.interactions.at(-1) });
  },
);

/** Listings that fit the customer's saved requirements. */
customersRouter.get('/:id/matches', validate({ params: idParams }), async (req, res) => {
  const { requirements: r = {}, type } = await findScoped(req);
  const filter = { status: { $in: PUBLIC_PROPERTY_STATUSES } };

  if (type === 'renter') filter.purpose = 'rent';
  if (type === 'buyer' || type === 'investor') filter.purpose = 'sale';
  if (r.budgetMin || r.budgetMax) {
    filter.price = {};
    if (r.budgetMin) filter.price.$gte = r.budgetMin;
    if (r.budgetMax) filter.price.$lte = r.budgetMax;
  }
  if (r.locations?.length) {
    filter['location.city'] = { $in: r.locations.map((l) => new RegExp(`^${escapeRegex(l)}$`, 'i')) };
  }
  if (r.types?.length) filter.type = { $in: r.types };
  if (r.bedrooms) filter.bedrooms = { $gte: r.bedrooms };

  const data = await Property.find(filter).sort({ featured: -1, createdAt: -1 }).limit(6).lean();
  res.json({ data });
});
