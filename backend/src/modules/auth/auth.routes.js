import { createHash, timingSafeEqual } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { User } from '../../models/index.js';
import { env } from '../../config/env.js';
import { validate } from '../../middleware/validate.js';
import { HttpError } from '../../utils/httpError.js';
import { signToken, hashPassword, checkPassword } from '../../auth/tokens.js';
import { publicUser } from '../users/publicUser.js';

const email = z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address'));
// bcrypt only reads the first 72 bytes, so cap the length there
const password = z.string().min(8, 'Use at least 8 characters').max(72, 'Use 72 characters or fewer');

const registerBody = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(80),
  email,
  password,
});
// staff: true is sent by the CRM sign-in page (/admin/login); only admins and agents may use it
const loginBody = z.object({ email, password: z.string().min(1, 'Enter your password').max(72), staff: z.boolean().optional() });

// Constant-time comparison so response timing doesn't leak the admin password
const sameSecret = (a, b) => timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());
const isAdminLogin = ({ email: address, password: pw }) => Boolean(env.admin) && address === env.admin.email && sameSecret(pw, env.admin.password);

/**
 * The admin account is defined by ADMIN_EMAIL / ADMIN_PASSWORD in the server
 * settings. Signing in with them creates the account on first use and keeps
 * its role and password in sync with the settings afterwards.
 */
async function syncAdmin() {
  const passwordHash = await hashPassword(env.admin.password);
  return User.findOneAndUpdate(
    { email: env.admin.email },
    { $set: { role: 'admin', active: true, passwordHash }, $setOnInsert: { name: 'Niwas Admin' } },
    { upsert: true, returnDocument: 'after' },
  );
}

const session = (user) => ({ data: { token: signToken(user), user: publicUser(user) } });

export const authRouter = Router();

// Slow down password guessing: 20 attempts per 15 minutes per IP
if (!env.isTest) {
  authRouter.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: { message: 'Too many attempts. Try again in a few minutes.' } } }));
}

authRouter.post('/register', validate({ body: registerBody }), async (req, res) => {
  const { name, email: address, password: pw } = req.body;
  // The admin's email can't be claimed through public sign-up
  if (address === env.admin?.email || (await User.exists({ email: address }))) {
    throw new HttpError(409, 'An account with this email already exists. Sign in instead.');
  }

  const user = await User.create({
    name,
    email: address,
    passwordHash: await hashPassword(pw),
    // Public sign-up always creates a normal user. The admin comes from the
    // server settings; agents are added by the admin on the Team page.
    role: 'buyer',
  });
  res.status(201).json(session(user));
});

authRouter.post('/login', validate({ body: loginBody }), async (req, res) => {
  if (isAdminLogin(req.body)) return res.json(session(await syncAdmin()));

  const user = await User.findOne({ email: req.body.email }).select('+passwordHash');
  const ok = await checkPassword(req.body.password, user?.passwordHash);
  if (!ok) throw HttpError.unauthorized('Email or password is incorrect');
  if (!user.active) throw HttpError.forbidden('This account has been deactivated');
  if (req.body.staff && !user.isStaff()) throw HttpError.forbidden("This account doesn't have CRM access");
  res.json(session(user));
});
