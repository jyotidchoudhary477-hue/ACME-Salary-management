import { AppError } from '../lib/errors.js';
import { config } from '../config.js';

export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  const payload = {
    error: err.message || 'Internal Server Error',
    code: err.code || (status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR'),
  };

  if (err.details) payload.details = err.details;
  if (!config.isProd && status >= 500 && err.stack) {
    payload.stack = err.stack;
  }

  if (!(err instanceof AppError) || status >= 500) {
    console.error('[api]', err);
  }

  res.status(status).json(payload);
}

export function notFound(_req, res) {
  res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
}
