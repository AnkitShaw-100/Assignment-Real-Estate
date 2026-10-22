import { User } from '../models/index.js';
import { HttpError } from '../utils/httpError.js';
import { verifyToken } from '../auth/tokens.js';

/**
 * Loads the signed-in user's document onto req.user from the Bearer token.
 *
 * The token only proves *who* the caller is; the role is read from the
 * database on every request, so role changes and deactivation apply at once.
 * Requests without a token pass through anonymously (req.user = null).
 */
export async function attachUser(req, _res, next) {
  req.user = null;
  const header = req.get('authorization') ?? '';
  if (!header.startsWith('Bearer ')) return next();

  const userId = verifyToken(header.slice(7).trim());
  const user = userId && (await User.findById(userId));
  if (!user) throw HttpError.unauthorized('Your session has expired. Sign in again.');
  if (!user.active) throw HttpError.forbidden('This account has been deactivated');

  req.user = user;
  next();
}

export function requireAuth(req, _res, next) {
  if (!req.user) throw HttpError.unauthorized();
  next();
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) throw HttpError.unauthorized();
    if (!roles.includes(req.user.role)) throw HttpError.forbidden();
    next();
  };
}

export const requireStaff = requireRole('agent', 'admin');
export const requireAdmin = requireRole('admin');
