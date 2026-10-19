import { z } from 'zod';

export const pageQuery = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

/** Runs a paginated find + count in parallel and returns the list envelope. */
export async function paginate(model, filter, { page, limit, sort = { createdAt: -1 }, populate, select }) {
  let query = model.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean();
  if (select) query = query.select(select);
  for (const p of [].concat(populate ?? [])) query = query.populate(p);

  const [data, total] = await Promise.all([query, model.countDocuments(filter)]);
  return { data, page, limit, total, pages: Math.ceil(total / limit) };
}
