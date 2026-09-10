import {
  Router,
  type ErrorRequestHandler,
  type RequestHandler,
  type Response,
} from 'express';

import { mapMvpDatabaseError } from '../lib/mvp-command';
import { type MvpHttpResponse } from '../lib/mvp-contract';
import { MvpEventsService } from '../lib/mvp-events';
import { MvpGuestsService } from '../lib/mvp-guests';
import { MvpInvitationsService } from '../lib/mvp-invitations';
import { prisma } from '../lib/prisma';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';

export interface MvpRouteService {
  events: Pick<
    MvpEventsService,
    'list' | 'get' | 'create' | 'update' | 'publish' | 'cancel' | 'remove'
  >;
  guests: Pick<
    MvpGuestsService,
    'list' | 'get' | 'create' | 'update' | 'remove' | 'checkIn' | 'correctCheckIn'
  >;
  invitations: Pick<MvpInvitationsService, 'list' | 'send'>;
}

type MvpHandler = (request: AuthenticatedRequest) => Promise<MvpHttpResponse<unknown>>;

function send(response: Response, result: MvpHttpResponse<unknown>): void {
  response.status(result.status).json(result.body);
}

function endpoint(handler: MvpHandler): RequestHandler {
  return (request, response) => {
    const authenticated = request as AuthenticatedRequest;
    if (!authenticated.user) {
      response.status(401).json({ code: 'AUTH_REQUIRED', error: 'Authentication is required' });
      return;
    }
    void handler(authenticated).then(
      (result) => send(response, result),
      (error: unknown) => {
        const safe = mapMvpDatabaseError(error);
        if (safe.status >= 500) console.error(`[mvp] request failed with ${safe.code}`);
        response.status(safe.status).json({ code: safe.code, error: safe.message });
      },
    );
  };
}

/** Build the isolated iOS MVP router with injectable auth and services for route tests. */
export function createMvpRouter(
  service: MvpRouteService,
  authenticate: RequestHandler = requireAuth,
): Router {
  const router = Router();
  router.use(authenticate);

  router.get('/events', endpoint((request) => service.events.list(request.user!.id)));
  router.get('/events/:id', endpoint((request) =>
    service.events.get(request.user!.id, request.params.id)));
  router.post('/events', endpoint((request) =>
    service.events.create(request.user!.id, request.body, request.get('Idempotency-Key'))));
  router.patch('/events/:id', endpoint((request) =>
    service.events.update(request.user!.id, request.params.id, request.body)));
  router.post('/events/:id/publish', endpoint((request) =>
    service.events.publish(
      request.user!.id,
      request.params.id,
      request.body,
      request.get('Idempotency-Key'),
    )));
  router.post('/events/:id/cancel', endpoint((request) =>
    service.events.cancel(
      request.user!.id,
      request.params.id,
      request.body,
      request.get('Idempotency-Key'),
    )));
  router.delete('/events/:id', endpoint((request) =>
    service.events.remove(
      request.user!.id,
      request.params.id,
      request.body,
      request.get('Idempotency-Key'),
    )));

  router.get('/events/:eventId/guests', endpoint((request) =>
    service.guests.list(request.user!.id, request.params.eventId)));
  router.post('/events/:eventId/guests', endpoint((request) =>
    service.guests.create(
      request.user!.id,
      request.params.eventId,
      request.body,
      request.get('Idempotency-Key'),
    )));
  router.get('/events/:eventId/invitations', endpoint((request) =>
    service.invitations.list(request.user!.id, request.params.eventId)));
  router.post('/events/:eventId/invitations/send', endpoint((request) =>
    service.invitations.send(
      request.user!.id,
      request.params.eventId,
      request.body,
      request.get('Idempotency-Key'),
    )));
  router.get('/guests/:id', endpoint((request) =>
    service.guests.get(request.user!.id, request.params.id)));
  router.patch('/guests/:id', endpoint((request) =>
    service.guests.update(request.user!.id, request.params.id, request.body)));
  router.delete('/guests/:id', endpoint((request) =>
    service.guests.remove(
      request.user!.id,
      request.params.id,
      request.body,
      request.get('Idempotency-Key'),
    )));
  router.post('/guests/:id/check-in', endpoint((request) =>
    service.guests.checkIn(
      request.user!.id,
      request.params.id,
      request.body,
      request.get('Idempotency-Key'),
    )));
  router.post('/guests/:id/check-in/correction', endpoint((request) =>
    service.guests.correctCheckIn(
      request.user!.id,
      request.params.id,
      request.body,
      request.get('Idempotency-Key'),
    )));

  router.use((_request, response) => {
    response.status(404).json({ code: 'MVP_ROUTE_NOT_FOUND', error: 'MVP route not found' });
  });

  return router;
}

/** Convert JSON parser failures for this namespace to a stable public response. */
export const mvpInputErrorHandler: ErrorRequestHandler = (error, _request, response, next) => {
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

const mvpRouter = createMvpRouter({
  events: new MvpEventsService(prisma),
  guests: new MvpGuestsService(prisma),
  invitations: new MvpInvitationsService(prisma),
});

export default mvpRouter;
