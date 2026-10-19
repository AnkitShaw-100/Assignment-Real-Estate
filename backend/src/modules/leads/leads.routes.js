import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../../middleware/validate.js';
import { requireAuth, requireStaff, requireAdmin } from '../../middleware/auth.js';
import { idParams } from '../../utils/schemas.js';
import { env } from '../../config/env.js';
import { inquiryBody, createBody, updateBody, stageBody, listQuery } from './leads.schema.js';
import * as ctrl from './leads.controller.js';

export const leadsRouter = Router();

// 5 inquiries per 10 minutes per IP stops form spam without bothering real visitors
const inquiryLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  skip: () => env.isTest,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, res) =>
    res.status(429).json({ error: { message: 'Too many inquiries from this network. Try again in a few minutes.' } }),
});

leadsRouter.post('/inquiry', inquiryLimiter, validate({ body: inquiryBody }), ctrl.inquiry);
leadsRouter.get('/mine', requireAuth, ctrl.mine);

leadsRouter.use(requireStaff);
leadsRouter.get('/', validate({ query: listQuery }), ctrl.list);
leadsRouter.post('/', validate({ body: createBody }), ctrl.create);
leadsRouter.get('/:id', validate({ params: idParams }), ctrl.getOne);
leadsRouter.patch('/:id', validate({ params: idParams, body: updateBody }), ctrl.update);
leadsRouter.patch('/:id/stage', validate({ params: idParams, body: stageBody }), ctrl.updateStage);
leadsRouter.post('/:id/convert', validate({ params: idParams }), ctrl.convert);
leadsRouter.delete('/:id', requireAdmin, validate({ params: idParams }), ctrl.remove);
