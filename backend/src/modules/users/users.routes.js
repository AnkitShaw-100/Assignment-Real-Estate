import { Router } from 'express';
import { z } from 'zod';
import { User, Lead, Property, ROLES, OPEN_LEAD_STAGES, PUBLIC_PROPERTY_STATUSES } from '../../models/index.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth, requireAdmin, requireStaff } from '../../middleware/auth.js';
import { idParams, objectId, phone } from '../../utils/schemas.js';
import { HttpError } from '../../utils/httpError.js';
import { publicUser } from './publicUser.js';

const meBody = z
  .object({
    name: z.string().trim().min(2).max(80),
    phone,
    title: z.string().trim().max(60),
  })
  .partial();

const roleBody = z.object({ role: z.enum(ROLES) });
const activeBody = z.object({ active: z.boolean() });


export const usersRouter = Router();

usersRouter.get('/me', requireAuth, (req, res) => res.json({ data: publicUser(req.user) }));

usersRouter.patch('/me', requireAuth, validate({ body: meBody }), async (req, res) => {
  req.user.set(req.body);
  await req.user.save();
  res.json({ data: publicUser(req.user) });
});

usersRouter.get('/me/saved', requireAuth, async (req, res) => {
  const data = await Property.find({
    _id: { $in: req.user.savedProperties },
    status: { $in: PUBLIC_PROPERTY_STATUSES },
  }).lean();
  res.json({ data });
});

usersRouter.post('/me/saved/:propertyId', requireAuth, validate({ params: z.object({ propertyId: objectId }) }), async (req, res) => {
  const exists = await Property.exists({ _id: req.valid.params.propertyId });
  if (!exists) throw HttpError.notFound('Property not found');
  await User.updateOne({ _id: req.user._id }, { $addToSet: { savedProperties: req.valid.params.propertyId } });
  res.status(204).end();
});

usersRouter.delete('/me/saved/:propertyId', requireAuth, validate({ params: z.object({ propertyId: objectId }) }), async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $pull: { savedProperties: req.valid.params.propertyId } });
  res.status(204).end();
});

/** Active agents, for assignment dropdowns. Staff only. */
usersRouter.get('/agents', requireStaff, async (_req, res) => {
  const data = await User.find({ role: { $in: ['agent', 'admin'] }, active: true })
    .select('name email avatar role title')
    .sort({ name: 1 })
    .lean();
  res.json({ data });
});

/** Team list with per-agent workload. Admin only. */
usersRouter.get('/', requireAdmin, async (_req, res) => {
  const [users, stats] = await Promise.all([
    User.find().sort({ role: 1, name: 1 }).lean(),
    Lead.aggregate([
      {
        $group: {
          _id: '$assignedTo',
          openLeads: { $sum: { $cond: [{ $in: ['$status', OPEN_LEAD_STAGES] }, 1, 0] } },
          won: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] } },
          revenue: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, '$dealValue', 0] } },
        },
      },
    ]),
  ]);
  const byUser = new Map(stats.map((s) => [String(s._id), s]));
  const data = users.map((u) => {
    const s = byUser.get(String(u._id));
    return { ...publicUser(u), active: u.active, openLeads: s?.openLeads ?? 0, won: s?.won ?? 0, revenue: s?.revenue ?? 0 };
  });
  res.json({ data });
});

usersRouter.patch('/:id/role', requireAdmin, validate({ params: idParams, body: roleBody }), async (req, res) => {
  const user = await User.findById(req.valid.params.id);
  if (!user) throw HttpError.notFound();
  if (String(user._id) === String(req.user._id) && req.body.role !== 'admin') {
    throw HttpError.badRequest("You can't remove your own admin access");
  }

  user.role = req.body.role;
  await user.save();
  res.json({ data: publicUser(user) });
});

usersRouter.patch('/:id/active', requireAdmin, validate({ params: idParams, body: activeBody }), async (req, res) => {
  if (String(req.valid.params.id) === String(req.user._id)) throw HttpError.badRequest("You can't deactivate yourself");
  const user = await User.findByIdAndUpdate(req.valid.params.id, { active: req.body.active }, { returnDocument: 'after' });
  if (!user) throw HttpError.notFound();
  res.json({ data: { ...publicUser(user), active: user.active } });
});
