import { Router, type ErrorRequestHandler, type RequestHandler, type Response } from 'express';
import { rateLimit } from 'express-rate-limit';

import {
  AccountService,
  AccountServiceError,
  type DeletionStatusView,
} from '../lib/account';
import { prisma } from '../lib/prisma';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';

export interface AccountRouteService {
  summary(userId: string): Promise<unknown>;
  createDeletionIntent(userId: string, password: unknown): Promise<DeletionStatusView>;
  confirmDeletion(receipt: unknown, confirmation: unknown): Promise<DeletionStatusView>;
  status(receipt: unknown): Promise<DeletionStatusView>;
}

const deletionLimiter = rateLimit({
  windowMs: 15 * 60 * 1_000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { code: 'DELETION_RATE_LIMITED', error: 'Too many deletion attempts. Try again later.' },
});

function privateResponse(response: Response): void {
  response.set('Cache-Control', 'no-store');
  response.set('Referrer-Policy', 'no-referrer');
  response.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
}

function sendError(response: Response, error: unknown): void {
  if (error instanceof AccountServiceError) {
    response.status(error.status).json({ code: error.code, error: error.message });
    return;
  }
  console.error('[account] request failed');
  response.status(500).json({ code: 'ACCOUNT_REQUEST_FAILED', error: 'Account request failed' });
}

/** Build account routes with injectable service and authentication for route tests. */
export function createAccountRouter(
  service: AccountRouteService,
  authenticate: RequestHandler = requireAuth,
  limitDeletion: RequestHandler = deletionLimiter,
): Router {
  const router = Router();
  router.use((_request, response, next) => {
    privateResponse(response);
    next();
  });

  router.get('/', authenticate, (request, response) => {
    const userId = (request as AuthenticatedRequest).user?.id;
    if (!userId) return response.status(401).json({ code: 'AUTH_REQUIRED', error: 'Authentication is required' });
    void service.summary(userId).then(
      (body) => response.json(body),
      (error: unknown) => sendError(response, error),
    );
  });

  router.post('/deletion-intent', limitDeletion, authenticate, (request, response) => {
    const userId = (request as AuthenticatedRequest).user?.id;
    if (!userId) return response.status(401).json({ code: 'AUTH_REQUIRED', error: 'Authentication is required' });
    void service.createDeletionIntent(userId, request.body?.password).then(
      (deletion) => response.status(201).json({ deletion }),
      (error: unknown) => sendError(response, error),
    );
  });

  router.post('/deletion', limitDeletion, (request, response) => {
    void service.confirmDeletion(request.body?.receipt, request.body?.confirmation).then(
      (deletion) => response.status(deletion.status === 'completed' ? 200 : 202).json({
        accepted: true,
        deletion,
      }),
      (error: unknown) => sendError(response, error),
    );
  });

  router.get('/deletion/:receipt', limitDeletion, (request, response) => {
    void service.status(request.params.receipt).then(
      (deletion) => response.json({ deletion }),
      (error: unknown) => sendError(response, error),
    );
  });

  router.use((_request, response) => {
    response.status(404).json({ code: 'ACCOUNT_ROUTE_NOT_FOUND', error: 'Account route not found' });
  });
  return router;
}

export const accountInputErrorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  privateResponse(response);
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

export const accountService = new AccountService(prisma);
export default createAccountRouter(accountService);
