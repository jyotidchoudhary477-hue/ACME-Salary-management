import { unauthorized } from '../lib/errors.js';
import { getUserById, verifyToken } from '../services/authService.js';

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(unauthorized('Missing Bearer token'));
  }

  try {
    const payload = verifyToken(token);
    const user = getUserById(req.db, payload.sub);
    if (!user) return next(unauthorized('User not found'));
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
