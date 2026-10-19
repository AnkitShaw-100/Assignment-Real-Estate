import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { requireStaff } from '../../middleware/auth.js';
import { idParams } from '../../utils/schemas.js';
import { listQuery, createBody, updateBody, slugParams } from './properties.schema.js';
import * as ctrl from './properties.controller.js';

export const propertiesRouter = Router();

propertiesRouter.get('/', validate({ query: listQuery }), ctrl.list);
propertiesRouter.get('/cities', ctrl.cities);
propertiesRouter.get('/id/:id', requireStaff, validate({ params: idParams }), ctrl.getById);
propertiesRouter.get('/:slug', validate({ params: slugParams }), ctrl.getBySlug);
propertiesRouter.get('/:slug/similar', validate({ params: slugParams }), ctrl.similar);

propertiesRouter.post('/', requireStaff, validate({ body: createBody }), ctrl.create);
propertiesRouter.patch('/:id', requireStaff, validate({ params: idParams, body: updateBody }), ctrl.update);
propertiesRouter.delete('/:id', requireStaff, validate({ params: idParams }), ctrl.remove);
