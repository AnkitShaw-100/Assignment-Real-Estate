import { Router } from 'express';
import { z } from 'zod';
import { Task, User, TASK_PRIORITIES, TASK_STATUSES } from '../../models/index.js';
import { validate } from '../../middleware/validate.js';
import { requireStaff } from '../../middleware/auth.js';
import { idParams, objectId, optionalText } from '../../utils/schemas.js';
import { scopeFilter, assertInScope } from '../../utils/scope.js';
import { dayRange } from '../../utils/dates.js';
import { HttpError } from '../../utils/httpError.js';

const baseFields = z.object({
  title: z.string().trim().min(2, 'Give the task a title').max(200),
  description: optionalText(2000),
  dueAt: z.coerce.date(),
  priority: z.enum(TASK_PRIORITIES),
  status: z.enum(TASK_STATUSES),
  assignee: objectId,
  lead: objectId.nullable(),
  customer: objectId.nullable(),
});
const createBody = baseFields.partial({ priority: true, status: true, assignee: true, lead: true, customer: true });
const updateBody = baseFields.partial();

const listQuery = z.object({
  due: z.enum(['overdue', 'today', 'upcoming', 'done']).optional(),
  assignee: objectId.optional(),
  lead: objectId.optional(),
  customer: objectId.optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

/** Maps a due bucket to a Mongo filter. "today" includes everything due before midnight. */
function dueFilter(due) {
  const { start, end } = dayRange();
  switch (due) {
    case 'overdue':
      return { status: 'open', dueAt: { $lt: start } };
    case 'today':
      return { status: 'open', dueAt: { $gte: start, $lt: end } };
    case 'upcoming':
      return { status: 'open', dueAt: { $gte: end } };
    case 'done':
      return { status: 'done' };
    default:
      return {};
  }
}

async function resolveAssignee(req, requested) {
  if (!requested || req.user.role !== 'admin') return req.user._id;
  const user = await User.findById(requested).select('role active').lean();
  if (!user?.active || !['agent', 'admin'].includes(user.role)) {
    throw HttpError.badRequest('Tasks can only be assigned to active agents');
  }
  return requested;
}

export const tasksRouter = Router();
tasksRouter.use(requireStaff);

tasksRouter.get('/', validate({ query: listQuery }), async (req, res) => {
  const q = req.valid.query;
  const filter = { ...scopeFilter(req.user, 'assignee'), ...dueFilter(q.due) };
  if (q.assignee && req.user.role === 'admin') filter.assignee = q.assignee;
  if (q.lead) filter.lead = q.lead;
  if (q.customer) filter.customer = q.customer;

  const data = await Task.find(filter)
    .sort(q.due === 'done' ? { completedAt: -1 } : { dueAt: 1 })
    .limit(q.limit)
    .populate('assignee', 'name avatar')
    .populate('lead', 'name status')
    .populate('customer', 'name')
    .lean();
  res.json({ data });
});

tasksRouter.post('/', validate({ body: createBody }), async (req, res) => {
  const assignee = await resolveAssignee(req, req.body.assignee);
  const task = await Task.create({ ...req.body, assignee, createdBy: req.user._id });
  res.status(201).json({ data: task });
});

tasksRouter.patch('/:id', validate({ params: idParams, body: updateBody }), async (req, res) => {
  const task = assertInScope(req.user, await Task.findById(req.valid.params.id), 'assignee');
  const body = { ...req.body };
  if (body.assignee) body.assignee = await resolveAssignee(req, body.assignee);
  if (body.status && body.status !== task.status) body.completedAt = body.status === 'done' ? new Date() : null;

  task.set(body);
  await task.save();
  res.json({ data: task });
});

tasksRouter.delete('/:id', validate({ params: idParams }), async (req, res) => {
  const task = assertInScope(req.user, await Task.findById(req.valid.params.id), 'assignee');
  await task.deleteOne();
  res.status(204).end();
});
