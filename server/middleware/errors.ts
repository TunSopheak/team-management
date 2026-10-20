import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const badRequest = (msg: string) => new HttpError(400, msg);
export const unauthorized = (msg = 'Please sign in to continue.') => new HttpError(401, msg);
export const forbidden = (msg = 'You do not have permission to do that.') => new HttpError(403, msg);
export const notFound = (msg = 'Not found.') => new HttpError(404, msg);
export const conflict = (msg: string) => new HttpError(409, msg);

export const notFoundApi: RequestHandler = (_req, _res, next) => next(notFound('API route not found.'));

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  if (err instanceof ZodError) {
    const first = err.issues[0];
    const field = first?.path.join('.');
    res.status(400).json({ error: field ? `${field}: ${first.message}` : 'Invalid request.' });
    return;
  }
  // Postgres unique violation
  if (err?.code === '23505') {
    res.status(409).json({ error: 'A record with the same unique value already exists.' });
    return;
  }
  // Malformed UUIDs in URLs
  if (err?.code === '22P02') {
    res.status(404).json({ error: 'Not found.' });
    return;
  }
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Malformed JSON body.' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
};
