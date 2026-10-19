import { Router } from 'express';
import { requireStaff } from '../../middleware/auth.js';
import { HttpError } from '../../utils/httpError.js';
import { env } from '../../config/env.js';
import { createUploadSignature } from './cloudinary.js';

export const uploadsRouter = Router();

uploadsRouter.post('/signature', requireStaff, (_req, res) => {
  if (!env.cloudinaryEnabled) throw new HttpError(503, 'Image uploads are not configured on this server');
  res.json({ data: createUploadSignature() });
});
