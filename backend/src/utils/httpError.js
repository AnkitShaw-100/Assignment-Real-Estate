/**
 * An error that carries an HTTP status. Throw it anywhere in a request
 * handler and the central error handler turns it into the API error shape.
 */
export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }

  static badRequest(message = 'Invalid request', details) {
    return new HttpError(400, message, details);
  }

  static unauthorized(message = 'Sign in to continue') {
    return new HttpError(401, message);
  }

  static forbidden(message = "You don't have access to this") {
    return new HttpError(403, message);
  }

  static notFound(message = 'Not found') {
    return new HttpError(404, message);
  }
}
