import mongoose from 'mongoose';
import { z, ZodError } from 'zod';
import { HttpError } from '../utils/httpError.js';
import { env } from '../config/env.js';

export function notFound(req, _res, next) {
  next(new HttpError(404, 'Route not found'));
}

// Every error leaves the API in one shape: { error: { message, details? } }
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let status = 500;
  let message = 'Something went wrong on our side. Try again in a moment.';
  let details;

  if (err instanceof HttpError) {
    ({ status, message, details } = err);
  } else if (err instanceof ZodError) {
    status = 400;
    message = 'Some fields need attention';
    details = z.flattenError(err).fieldErrors;
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = 'Some fields need attention';
    details = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, [v.message]]));
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid ${err.path}`;
  } else if (err?.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'value';
    message = `That ${field} is already in use`;
  } else if (err?.type === 'entity.parse.failed') {
    status = 400;
    message = 'Request body is not valid JSON';
  }

  if (status >= 500 && !env.isTest) console.error(err);

  res.status(status).json({ error: details ? { message, details } : { message } });
}
