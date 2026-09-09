import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import express, { type RequestHandler } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MvpError } from '../../server/lib/mvp-contract';
import {
  createMvpRouter,
  mvpInputErrorHandler,
  type MvpRouteService,
} from '../../server/routes/mvp';
import type { AuthenticatedRequest } from '../../server/middleware/auth';

function method() {
  return vi.fn().mockResolvedValue({ status: 200, body: { ok: true } });
}

function serviceStub(): MvpRouteService {
  return {
    events: {
      list: method(),
      get: method(),
      create: method(),
      update: method(),
      publish: method(),
      cancel: method(),
      remove: method(),
    },
    guests: {
      list: method(),
      get: method(),
      create: method(),
      update: method(),
      remove: method(),
      checkIn: method(),
      correctCheckIn: method(),
    },
    invitations: {
      list: method(),
      send: method(),
    },
  } as unknown as MvpRouteService;
}

const authenticate: RequestHandler = (request, response, next) => {
  if (request.get('Authorization') !== 'Bearer host-token') {
    response.status(401).json({ code: 'AUTH_REQUIRED', error: 'Authentication is required' });
    return;
  }
  (request as AuthenticatedRequest).user = {
    id: 'host-1',
    email_verified: true,
    token_version: 0,
  };
  next();
};

describe('MVP router', () => {
  let server: Server;
  let baseUrl: string;
  let service: MvpRouteService;

  beforeEach(async () => {
    service = serviceStub();
    const app = express();
    app.use(express.json());
    app.use('/api/mvp', mvpInputErrorHandler, createMvpRouter(service, authenticate));
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', resolve);
    });
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  });

  it('requires authentication before invoking a service', async () => {
    const response = await fetch(`${baseUrl}/api/mvp/events`);

    expect(response.status).toBe(401);
    expect(service.events.list).not.toHaveBeenCalled();
  });

  it('forwards strict event command inputs and the idempotency header', async () => {
    vi.mocked(service.events.create).mockResolvedValueOnce({
      status: 201,
      body: { event: { id: 'event-1' } },
    } as never);
    const body = {
      name: 'Dinner',
      description: null,
      start: '2030-01-01T18:00:00.000Z',
      end: '2030-01-01T20:00:00.000Z',
      timezone: 'UTC',
      location: 'Hall',
    };
    const response = await fetch(`${baseUrl}/api/mvp/events`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer host-token',
        'Content-Type': 'application/json',
        'Idempotency-Key': 'create-key',
      },
      body: JSON.stringify(body),
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ event: { id: 'event-1' } });
    expect(service.events.create).toHaveBeenCalledWith('host-1', body, 'create-key');
  });

  it('mounts every event and guest mutation on the isolated namespace', async () => {
    const headers = {
      Authorization: 'Bearer host-token',
      'Content-Type': 'application/json',
      'Idempotency-Key': 'command-key',
    };
    const requests = [
      fetch(`${baseUrl}/api/mvp/events/event-1`, { method: 'PATCH', headers, body: '{"expectedRevision":1,"name":"New"}' }),
      fetch(`${baseUrl}/api/mvp/events/event-1/publish`, { method: 'POST', headers, body: '{"expectedRevision":1}' }),
      fetch(`${baseUrl}/api/mvp/events/event-1/cancel`, { method: 'POST', headers, body: '{"expectedRevision":2}' }),
      fetch(`${baseUrl}/api/mvp/events/event-1`, { method: 'DELETE', headers, body: '{"expectedRevision":3}' }),
      fetch(`${baseUrl}/api/mvp/events/event-1/guests`, { method: 'POST', headers, body: '{"name":"Ada","email":"ada@example.com"}' }),
      fetch(`${baseUrl}/api/mvp/events/event-1/invitations/send`, { method: 'POST', headers, body: '{"guestIds":["guest-1"]}' }),
      fetch(`${baseUrl}/api/mvp/guests/guest-1`, { method: 'PATCH', headers, body: '{"expectedRevision":1,"name":"Ada B"}' }),
      fetch(`${baseUrl}/api/mvp/guests/guest-1`, { method: 'DELETE', headers, body: '{"expectedRevision":2}' }),
      fetch(`${baseUrl}/api/mvp/guests/guest-1/check-in`, { method: 'POST', headers, body: '{"expectedRevision":1}' }),
      fetch(`${baseUrl}/api/mvp/guests/guest-1/check-in/correction`, { method: 'POST', headers, body: '{"expectedRevision":2,"checkedIn":false}' }),
    ];
    await Promise.all(requests);

    expect(service.events.update).toHaveBeenCalledWith('host-1', 'event-1', { expectedRevision: 1, name: 'New' });
    expect(service.events.publish).toHaveBeenCalledWith('host-1', 'event-1', { expectedRevision: 1 }, 'command-key');
    expect(service.events.cancel).toHaveBeenCalledWith('host-1', 'event-1', { expectedRevision: 2 }, 'command-key');
    expect(service.events.remove).toHaveBeenCalledWith('host-1', 'event-1', { expectedRevision: 3 }, 'command-key');
    expect(service.guests.create).toHaveBeenCalledWith(
      'host-1',
      'event-1',
      { name: 'Ada', email: 'ada@example.com' },
      'command-key',
    );
    expect(service.invitations.send).toHaveBeenCalledWith(
      'host-1',
      'event-1',
      { guestIds: ['guest-1'] },
      'command-key',
    );
    expect(service.guests.update).toHaveBeenCalledWith('host-1', 'guest-1', { expectedRevision: 1, name: 'Ada B' });
    expect(service.guests.remove).toHaveBeenCalledWith('host-1', 'guest-1', { expectedRevision: 2 }, 'command-key');
    expect(service.guests.checkIn).toHaveBeenCalledWith('host-1', 'guest-1', { expectedRevision: 1 }, 'command-key');
    expect(service.guests.correctCheckIn).toHaveBeenCalledWith(
      'host-1',
      'guest-1',
      { expectedRevision: 2, checkedIn: false },
      'command-key',
    );
  });

  it('mounts owner-scoped event and guest reads', async () => {
    const headers = { Authorization: 'Bearer host-token' };
    await Promise.all([
      fetch(`${baseUrl}/api/mvp/events`, { headers }),
      fetch(`${baseUrl}/api/mvp/events/event-1`, { headers }),
      fetch(`${baseUrl}/api/mvp/events/event-1/guests`, { headers }),
      fetch(`${baseUrl}/api/mvp/events/event-1/invitations`, { headers }),
      fetch(`${baseUrl}/api/mvp/guests/guest-1`, { headers }),
    ]);

    expect(service.events.list).toHaveBeenCalledWith('host-1');
    expect(service.events.get).toHaveBeenCalledWith('host-1', 'event-1');
    expect(service.guests.list).toHaveBeenCalledWith('host-1', 'event-1');
    expect(service.invitations.list).toHaveBeenCalledWith('host-1', 'event-1');
    expect(service.guests.get).toHaveBeenCalledWith('host-1', 'guest-1');
  });

  it('returns stable service errors without raw exception details', async () => {
    vi.mocked(service.events.get).mockRejectedValueOnce(
      new MvpError(404, 'EVENT_NOT_FOUND', 'Event not found'),
    );
    const response = await fetch(`${baseUrl}/api/mvp/events/missing`, {
      headers: { Authorization: 'Bearer host-token' },
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ code: 'EVENT_NOT_FOUND', error: 'Event not found' });
  });

  it('returns a stable error for malformed JSON before authentication or service work', async () => {
    const response = await fetch(`${baseUrl}/api/mvp/events`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer host-token',
        'Content-Type': 'application/json',
      },
      body: '{not-json',
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      code: 'INVALID_JSON',
      error: 'Request body must be valid JSON',
    });
    expect(service.events.create).not.toHaveBeenCalled();
  });
});
