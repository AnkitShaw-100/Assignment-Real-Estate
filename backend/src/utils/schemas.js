import mongoose from 'mongoose';
import { z } from 'zod';

// Small reusable Zod pieces shared by module schemas.

export const objectId = z
  .string()
  .refine((v) => mongoose.isValidObjectId(v), { message: 'Invalid id' });

export const idParams = z.object({ id: objectId });

/** "" from an HTML form means "not set". */
export const optionalText = (max = 2000) =>
  z.preprocess((v) => (v === '' ? undefined : v), z.string().trim().max(max).optional());

export const phone = z
  .string()
  .trim()
  .regex(/^[+\d][\d\s().-]{6,19}$/, 'Enter a valid phone number')
  .optional()
  .or(z.literal('').transform(() => undefined));

export const csvList = z
  .union([z.string(), z.array(z.string())])
  .transform((v) => (Array.isArray(v) ? v : v.split(',')).map((s) => s.trim()).filter(Boolean));
