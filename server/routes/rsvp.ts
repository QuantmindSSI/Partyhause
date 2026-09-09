import { Router, type ErrorRequestHandler, type RequestHandler, type Response } from 'express';
import rateLimit from 'express-rate-limit';

import { mapMvpDatabaseError } from '../lib/mvp-command';
import { type MvpHttpResponse } from '../lib/mvp-contract';
import { RsvpService } from '../lib/rsvp';
import { prisma } from '../lib/prisma';

type PublicHandler = (body: unknown) => Promise<MvpHttpResponse<unknown>>;

function privateResponseHeaders(response: Response): void {
  response.set('Cache-Control', 'no-store');
  response.set('Referrer-Policy', 'no-referrer');
  response.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
}

const rsvpLimiter = rateLimit({
  windowMs: 15 * 60 * 1_000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_request, response) => {
    privateResponseHeaders(response);
    response.status(429).json({ code: 'RSVP_RATE_LIMITED', error: 'Too many RSVP requests. Try again later.' });
  },
});

function endpoint(handler: PublicHandler): RequestHandler {
  return (request, response) => {
    void handler(request.body).then(
      (result) => response.status(result.status).json(result.body),
      (error: unknown) => {
        const safe = mapMvpDatabaseError(error);
        if (safe.status >= 500) console.error(`[rsvp] request failed with ${safe.code}`);
        response.status(safe.status).json({ code: safe.code, error: safe.message });
      },
    );
  };
}

/** Build the anonymous RSVP router with injectable service and limiter for tests. */
export function createRsvpRouter(
  service: Pick<RsvpService, 'resolve' | 'update'>,
  limiter: RequestHandler = rsvpLimiter,
): Router {
  const router = Router();
  router.use((_request, response, next) => {
    privateResponseHeaders(response);
    next();
  });
  router.use(limiter);
  router.post('/resolve', endpoint((body) => service.resolve(body)));
  router.put('/', endpoint((body) => service.update(body)));
  router.use((_request, response) => {
    response.status(404).json({ code: 'RSVP_ROUTE_NOT_FOUND', error: 'RSVP route not found' });
  });
  return router;
}

/** Normalize parser failures while preserving privacy headers on public responses. */
export const rsvpInputErrorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  privateResponseHeaders(response);
  const status = error && typeof error === 'object' && 'status' in error
    ? Number((error as { status?: unknown }).status)
    : 0;
  if (error instanceof SyntaxError || status === 413) {
    response.status(status === 413 ? 413 : 400).json({
      code: status === 413 ? 'REQUEST_TOO_LARGE' : 'INVALID_JSON',
      error: status === 413 ? 'Request body is too large' : 'Request body must be valid JSON',
    });
    return;
  }
  next(error);
};

export default createRsvpRouter(new RsvpService(prisma));
