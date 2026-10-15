import { badRequest } from '../lib/errors.js';

export function validate(schema) {
  return (req, _res, next) => {
    const parsed = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!parsed.success) {
      return next(badRequest('Validation failed', parsed.error.flatten()));
    }

    req.validated = parsed.data;
    next();
  };
}
