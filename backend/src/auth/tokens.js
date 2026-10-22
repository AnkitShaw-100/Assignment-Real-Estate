import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

const ISSUER = 'niwas-api';
const BCRYPT_COST = 12;

/** Session token for a user. Only the id goes in; role is read from the DB on every request. */
export function signToken(user) {
  return jwt.sign({}, env.jwtSecret, { subject: String(user._id), issuer: ISSUER, expiresIn: env.JWT_EXPIRES_IN, algorithm: 'HS256' });
}

/** Returns the user id, or null for a missing/invalid/expired token. */
export function verifyToken(token) {
  try {
    return jwt.verify(token, env.jwtSecret, { issuer: ISSUER, algorithms: ['HS256'] }).sub ?? null;
  } catch {
    return null;
  }
}

export const hashPassword = (password) => bcrypt.hash(password, BCRYPT_COST);

// Compared against when the email is unknown, so both paths take the same time
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser', BCRYPT_COST);

export async function checkPassword(password, hash) {
  return bcrypt.compare(password, hash ?? DUMMY_HASH).then((ok) => ok && Boolean(hash));
}
