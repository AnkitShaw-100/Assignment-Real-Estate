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
const loginBody = z.object({ email, password: z.string().min(1, 'Enter your password').max(72) });

const session = (user) => ({ data: { token: signToken(user), user: publicUser(user) } });

export const authRouter = Router();

// Slow down password guessing: 20 attempts per 15 minutes per IP
if (!env.isTest) {
  authRouter.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: { message: 'Too many attempts. Try again in a few minutes.' } } }));
}

authRouter.post('/register', validate({ body: registerBody }), async (req, res) => {
  const { name, email: address, password: pw } = req.body;
  if (await User.exists({ email: address })) throw new HttpError(409, 'An account with this email already exists. Sign in instead.');

  const user = await User.create({
    name,
    email: address,
    passwordHash: await hashPassword(pw),
    // ADMIN_EMAILS bootstraps the first admins; everyone else starts as a normal user
    role: env.adminEmails.includes(address) ? 'admin' : 'buyer',
  });
  res.status(201).json(session(user));
});

authRouter.post('/login', validate({ body: loginBody }), async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+passwordHash');
  const ok = await checkPassword(req.body.password, user?.passwordHash);
  if (!ok) throw HttpError.unauthorized('Email or password is incorrect');
  if (!user.active) throw HttpError.forbidden('This account has been deactivated');
  res.json(session(user));
});
