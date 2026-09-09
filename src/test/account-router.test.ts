import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import express, { type RequestHandler } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountServiceError, type DeletionStatusView } from '../../server/lib/account';
import type { AuthenticatedRequest } from '../../server/middleware/auth';
import { createAccountRouter, type AccountRouteService } from '../../server/routes/account';

const deletion: DeletionStatusView = {
  receipt: '123e4567-e89b-42d3-a456-426614174000',
  status: 'pending',
  requestedAt: '2026-09-06T12:00:00.000Z',
  eraseBy: '2026-09-07T12:00:00.000Z',
  completedAt: null,
  confirmationExpiresAt: '2026-09-06T12:15:00.000Z',
  retryable: false,
};

function serviceStub(): AccountRouteService {
  return {
    summary: vi.fn().mockResolvedValue({ account: { id: 'host-1' }, legal: {} }),
    createDeletionIntent: vi.fn().mockResolvedValue(deletion),
    confirmDeletion: vi.fn().mockResolvedValue({ ...deletion, status: 'completed' }),
    status: vi.fn().mockResolvedValue(deletion),
  };
}

const authenticate: RequestHandler = (request, response, next) => {
  if (request.get('Authorization') !== 'Bearer host-token') {
    response.status(401).json({ code: 'AUTH_REQUIRED', error: 'Authentication is required' });
    return;
  }
  (request as AuthenticatedRequest).user = {
    id: 'host-1',
    email_verified: true,
    token_version: 4,
  };
  next();
};

const noLimit: RequestHandler = (_request, _response, next) => next();

describe('account router', () => {
  let server: Server;
  let baseUrl: string;
  let service: AccountRouteService;

  beforeEach(async () => {
    service = serviceStub();
    const app = express();
    app.use(express.json());
    app.use('/api/mvp/account', createAccountRouter(service, authenticate, noLimit));
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', resolve);
    });
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterEach(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  });

  it('protects account facts and password reauthentication', async () => {
    const unauthenticated = await fetch(`${baseUrl}/api/mvp/account`);
    const intent = await fetch(`${baseUrl}/api/mvp/account/deletion-intent`, {
      method: 'POST',
      headers: { Authorization: 'Bearer host-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'secret' }),
    });

    expect(unauthenticated.status).toBe(401);
    expect(intent.status).toBe(201);
    expect(service.createDeletionIntent).toHaveBeenCalledWith('host-1', 'secret');
    expect(intent.headers.get('Cache-Control')).toBe('no-store');
    expect(intent.headers.get('X-Robots-Tag')).toContain('noindex');
  });

  it('accepts confirmation and status by opaque receipt without returning PII', async () => {
    const confirmed = await fetch(`${baseUrl}/api/mvp/account/deletion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receipt: deletion.receipt, confirmation: 'DELETE' }),
    });
    const status = await fetch(`${baseUrl}/api/mvp/account/deletion/${deletion.receipt}`);

    expect(confirmed.status).toBe(200);
    expect(service.confirmDeletion).toHaveBeenCalledWith(deletion.receipt, 'DELETE');
    expect(service.status).toHaveBeenCalledWith(deletion.receipt);
    expect(JSON.stringify(await status.json())).not.toMatch(/email|name|password/i);
  });

  it('returns stable service errors without internal details', async () => {
    vi.mocked(service.confirmDeletion).mockRejectedValueOnce(
      new AccountServiceError(400, 'DELETION_CONFIRMATION_INVALID', 'Type DELETE exactly to confirm'),
    );
    const response = await fetch(`${baseUrl}/api/mvp/account/deletion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receipt: deletion.receipt, confirmation: 'delete' }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      code: 'DELETION_CONFIRMATION_INVALID',
      error: 'Type DELETE exactly to confirm',
    });
  });
});
