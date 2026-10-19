import { Lead, Property, PUBLIC_PROPERTY_STATUSES } from '../../models/index.js';
import { HttpError } from '../../utils/httpError.js';
import { paginate } from '../../utils/paginate.js';
import { scopeFilter, assertInScope } from '../../utils/scope.js';
import { escapeRegex } from '../../utils/escapeRegex.js';
import { dayRange } from '../../utils/dates.js';
import {
  pickAssignee,
  syncFollowUpTask,
  convertToCustomer,
  changeStage,
  assertAssignable,
} from './leads.service.js';

const POPULATE = [
  { path: 'assignedTo', select: 'name email avatar' },
  { path: 'property', select: 'title slug price purpose images coverIndex location' },
];

const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  follow_up: { followUpDate: 1 },
  value: { dealValue: -1 },
};

async function findScoped(req) {
  const lead = await Lead.findById(req.valid.params.id);
  return assertInScope(req.user, lead, 'assignedTo');
}

/** POST /leads/inquiry — public website form. */
export async function inquiry(req, res) {
  const { website: _honeypot, ...body } = req.body;

  if (body.property) {
    const property = await Property.findOne({ _id: body.property, status: { $in: PUBLIC_PROPERTY_STATUSES } }).lean();
    if (!property) throw HttpError.badRequest('This property is no longer available');
  }

  const assignedTo = await pickAssignee(body.property);
  const lead = await Lead.create({
    ...body,
    source: 'website',
    assignedTo,
    createdBy: req.user?._id,
    activity: [{ type: 'created', to: 'website' }],
  });

  // Return only what the visitor needs, never internal assignment data
  res.status(201).json({ data: { id: lead._id, status: 'received' } });
}

/** GET /leads/mine — a signed-in visitor's own inquiries, matched by email. */
export async function mine(req, res) {
  const data = await Lead.find({ email: req.user.email })
    .select('message intent status createdAt property')
    .populate('property', 'title slug images coverIndex location price purpose')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ data });
}

export async function list(req, res) {
  const q = req.valid.query;
  const filter = scopeFilter(req.user, 'assignedTo');

  if (q.status) filter.status = q.status;
  if (q.source) filter.source = q.source;
  if (q.assignedTo && req.user.role === 'admin') filter.assignedTo = q.assignedTo;
  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  if (q.followUp) {
    const { start, end } = dayRange();
    filter.status = filter.status ?? { $nin: ['won', 'lost'] };
    filter.followUpDate =
      q.followUp === 'overdue' ? { $lt: start } : q.followUp === 'today' ? { $gte: start, $lt: end } : { $gte: end };
  }

  res.json(await paginate(Lead, filter, { page: q.page, limit: q.limit, sort: SORTS[q.sort], populate: POPULATE, select: '-activity' }));
}

export async function getOne(req, res) {
  await findScoped(req);
  const lead = await Lead.findById(req.valid.params.id)
    .populate(POPULATE)
    .populate('notes.author', 'name avatar')
    .populate('activity.by', 'name')
    .populate('customer', 'name email')
    .lean();
  res.json({ data: lead });
}

export async function create(req, res) {
  const body = { ...req.body };
  if (req.user.role !== 'admin' || !body.assignedTo) body.assignedTo = req.user._id;
  else await assertAssignable(body.assignedTo);

  const lead = await Lead.create({
    ...body,
    createdBy: req.user._id,
    activity: [{ type: 'created', to: body.source, by: req.user._id }],
  });
  await syncFollowUpTask(lead, req.user._id);
  res.status(201).json({ data: lead });
}

export async function update(req, res) {
  const lead = await findScoped(req);
  const { note, assignedTo, followUpDate, ...fields } = req.body;

  if (assignedTo && String(assignedTo) !== String(lead.assignedTo)) {
    if (req.user.role !== 'admin') throw HttpError.forbidden('Only admins can reassign leads');
    await assertAssignable(assignedTo);
    lead.activity.push({ type: 'assigned', from: String(lead.assignedTo), to: String(assignedTo), by: req.user._id });
    lead.assignedTo = assignedTo;
  }
  if (followUpDate !== undefined) {
    lead.activity.push({ type: 'follow_up', to: followUpDate?.toISOString() ?? 'cleared', by: req.user._id });
    lead.followUpDate = followUpDate ?? undefined;
  }
  if (note) lead.notes.push({ body: note, author: req.user._id });

  for (const [key, value] of Object.entries(fields)) lead.set(key, value ?? undefined);
  await lead.save();
  await syncFollowUpTask(lead, req.user._id);
  res.json({ data: lead });
}

export async function updateStage(req, res) {
  const lead = await findScoped(req);
  await changeStage(lead, req.body, req.user._id);
  res.json({ data: lead });
}

export async function convert(req, res) {
  const lead = await findScoped(req);
  const customer = await convertToCustomer(lead, req.user._id);
  await lead.save();
  res.status(201).json({ data: customer });
}

export async function remove(req, res) {
  const lead = await Lead.findById(req.valid.params.id);
  if (!lead) throw HttpError.notFound();
  await lead.deleteOne();
  res.status(204).end();
}
