export class AppError extends Error {
  /**
   * @param {string} message
   * @param {{ status?: number, details?: unknown, code?: string }} [options]
   */
  constructor(message, { status = 500, details, code } = {}) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.details = details;
    this.code = code;
  }
}

export function notFound(message = 'Resource not found') {
  return new AppError(message, { status: 404, code: 'NOT_FOUND' });
}

export function badRequest(message, details) {
  return new AppError(message, { status: 400, code: 'BAD_REQUEST', details });
}

export function conflict(message) {
  return new AppError(message, { status: 409, code: 'CONFLICT' });
}

export function unauthorized(message = 'Authentication required') {
  return new AppError(message, { status: 401, code: 'UNAUTHORIZED' });
}
