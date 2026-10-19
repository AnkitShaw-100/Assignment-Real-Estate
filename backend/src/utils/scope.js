import { HttpError } from './httpError.js';

/**
 * Row-level access: admins see everything, agents only what is assigned to them.
 * `field` is the ownership field on the model (assignedTo, assignedAgent, assignee, agent).
 */
export function scopeFilter(user, field) {
  return user.role === 'admin' ? {} : { [field]: user._id };
}

/** Throws 404 (not 403) for records outside the user's scope, so ids can't be probed. */
export function assertInScope(user, doc, field) {
  if (!doc) throw HttpError.notFound();
  if (user.role === 'admin') return doc;
  const owner = doc[field]?._id ?? doc[field];
  if (!owner || String(owner) !== String(user._id)) throw HttpError.notFound();
  return doc;
}
