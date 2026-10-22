import { Router } from 'express';
import { authRouter } from './modules/auth/auth.routes.js';
import { propertiesRouter } from './modules/properties/properties.routes.js';
import { leadsRouter } from './modules/leads/leads.routes.js';
import { customersRouter } from './modules/customers/customers.routes.js';
import { tasksRouter } from './modules/tasks/tasks.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { dashboardRouter } from './modules/dashboard/dashboard.routes.js';
import { statsRouter } from './modules/stats/stats.routes.js';
import { uploadsRouter } from './modules/uploads/uploads.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/properties', propertiesRouter);
apiRouter.use('/leads', leadsRouter);
apiRouter.use('/customers', customersRouter);
apiRouter.use('/tasks', tasksRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/stats', statsRouter);
apiRouter.use('/uploads', uploadsRouter);
