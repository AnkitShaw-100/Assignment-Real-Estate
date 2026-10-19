import { Property, PUBLIC_PROPERTY_STATUSES } from '../../models/index.js';
import { HttpError } from '../../utils/httpError.js';
import { paginate } from '../../utils/paginate.js';
import { assertInScope } from '../../utils/scope.js';
import { escapeRegex } from '../../utils/escapeRegex.js';
import { deleteImages } from '../uploads/cloudinary.js';

const AGENT_FIELDS = 'name email phone avatar title';

const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  popular: { views: -1 },
};

function buildFilter(q, user) {
  const filter = {};

  if (q.scope === 'manage') {
    if (!user?.isStaff()) throw HttpError.forbidden();
    if (user.role === 'agent') filter.agent = user._id;
    if (q.status) filter.status = q.status;
  } else {
    filter.status = { $in: PUBLIC_PROPERTY_STATUSES };
  }

  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q), 'i');
    filter.$or = [{ title: rx }, { 'location.city': rx }, { 'location.area': rx }, { 'location.country': rx }];
  }
  if (q.city) filter['location.city'] = new RegExp(`^${escapeRegex(q.city)}$`, 'i');
  if (q.category) filter.category = q.category;
  if (q.type) filter.type = q.type;
  if (q.purpose) filter.purpose = q.purpose;
  if (q.featured !== undefined) filter.featured = q.featured;
  // "5" in the bedrooms filter means 5 or more
  if (q.beds !== undefined) filter.bedrooms = q.beds >= 5 ? { $gte: 5 } : q.beds;
  if (q.minPrice !== undefined || q.maxPrice !== undefined) {
    if (q.minPrice !== undefined && q.maxPrice !== undefined && q.minPrice > q.maxPrice) {
      throw HttpError.badRequest('Minimum price must be lower than maximum price');
    }
    filter.price = {};
    if (q.minPrice !== undefined) filter.price.$gte = q.minPrice;
    if (q.maxPrice !== undefined) filter.price.$lte = q.maxPrice;
  }
  return filter;
}

export async function list(req, res) {
  const q = req.valid.query;
  const result = await paginate(Property, buildFilter(q, req.user), {
    page: q.page,
    limit: q.limit,
    sort: SORTS[q.sort],
    populate: { path: 'agent', select: AGENT_FIELDS },
    select: q.scope === 'public' ? '-views' : undefined,
  });
  res.json(result);
}

export async function cities(_req, res) {
  const data = await Property.distinct('location.city', { status: { $in: PUBLIC_PROPERTY_STATUSES } });
  res.json({ data: data.sort() });
}

/** Staff may preview their own drafts/sold listings; the public only sees live ones. */
function canSee(property, user) {
  if (PUBLIC_PROPERTY_STATUSES.includes(property.status)) return true;
  if (!user?.isStaff()) return false;
  return user.role === 'admin' || String(property.agent?._id ?? property.agent) === String(user._id);
}

export async function getBySlug(req, res) {
  const property = await Property.findOne({ slug: req.valid.params.slug }).populate('agent', AGENT_FIELDS).lean();
  if (!property || !canSee(property, req.user)) throw HttpError.notFound('This property is no longer listed');

  // Count the view without making the visitor wait for the write
  Property.updateOne({ _id: property._id }, { $inc: { views: 1 } }).catch(() => {});
  res.json({ data: property });
}

export async function getById(req, res) {
  const property = await Property.findById(req.valid.params.id).populate('agent', AGENT_FIELDS).lean();
  assertInScope(req.user, property, 'agent');
  res.json({ data: property });
}

export async function similar(req, res) {
  const base = await Property.findOne({ slug: req.valid.params.slug }).lean();
  if (!base) throw HttpError.notFound();

  const data = await Property.find({
    _id: { $ne: base._id },
    status: { $in: PUBLIC_PROPERTY_STATUSES },
    $or: [{ type: base.type }, { 'location.city': base.location.city }],
  })
    .sort({ featured: -1, createdAt: -1 })
    .limit(4)
    .lean();
  res.json({ data });
}

export async function create(req, res) {
  const body = { ...req.body };
  // Agents always own what they create; admins may assign another agent
  if (req.user.role !== 'admin' || !body.agent) body.agent = req.user._id;
  if (body.coverIndex >= body.images.length) body.coverIndex = 0;

  const property = await Property.create(body);
  res.status(201).json({ data: property });
}

export async function update(req, res) {
  const property = assertInScope(req.user, await Property.findById(req.valid.params.id), 'agent');
  const body = { ...req.body };
  if (req.user.role !== 'admin') delete body.agent; // agents can't hand listings to others

  // Images removed in this edit should also leave Cloudinary
  if (body.images) {
    const kept = new Set(body.images.map((i) => i.publicId).filter(Boolean));
    const removed = property.images.filter((i) => i.publicId && !kept.has(i.publicId));
    deleteImages(removed).catch(() => {});
  }

  property.set(body);
  if (property.coverIndex >= property.images.length) property.coverIndex = 0;
  await property.save();
  res.json({ data: property });
}

export async function remove(req, res) {
  const property = assertInScope(req.user, await Property.findById(req.valid.params.id), 'agent');
  await property.deleteOne();
  deleteImages(property.images).catch(() => {});
  res.status(204).end();
}
