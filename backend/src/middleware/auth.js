import { User } from '../models/index.js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

/**
 * Loads the signed-in user's Mongo document onto req.user.
 *
 * Clerk proves *who* the caller is; roles live in our database. On first
 * sight we create the Mongo user (or relink a seeded one by email), so no
 * Clerk webhook is needed. Anonymous requests pass through with req.user = null.
 */
export async function attachUser(req, _res, next) {
  req.user = null;
  const auth = req.app.locals.auth;
  const clerkId = auth.resolveAuth(req);
  if (!clerkId) return next();

  let user = await User.findOne({ clerkId });
  if (!user) {
    const profile = await auth.fetchProfile(clerkId);
    if (!profile?.email) throw HttpError.unauthorized('Your account has no email address');
    const email = profile.email.toLowerCase();

    user = await User.findOne({ email });
    if (user) {
      // A seeded/pre-invited user signing in for the first time
      user.clerkId = clerkId;
      if (profile.avatar && !user.avatar) user.avatar = profile.avatar;
      await user.save();
    } else {
      user = await User.create({
        clerkId,
        email,
        name: profile.name || email,
        avatar: profile.avatar,
        role: env.adminEmails.includes(email) ? 'admin' : 'buyer',
      });
    }
  }

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
