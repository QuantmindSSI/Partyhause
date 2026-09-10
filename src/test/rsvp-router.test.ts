import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import express, { type RequestHandler } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MvpError } from '../../server/lib/mvp-contract';
import { createRsvpRouter, rsvpInputErrorHandler } from '../../server/routes/rsvp';

const passThrough: RequestHandler = (_request, _response, next) => next();

describe('public RSVP router', () => {
  let server: Server;
  let baseUrl: string;
  const service = {
    resolve: vi.fn().mockResolvedValue({ status: 200, body: { rsvp: { status: 'pending' } } }),
    update: vi.fn().mockResolvedValue({ status: 200, body: { rsvp: { status: 'accepted' } } }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const app = express();
    app.use(express.json());
    app.use('/api/rsvp', rsvpInputErrorHandler, createRsvpRouter(service, passThrough));
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

  it('mounts anonymous resolve and update with private response headers', async () => {
    const resolveBody = { token: 'A'.repeat(43) };
    const updateBody = { token: 'A'.repeat(43), status: 'accepted', expectedRevision: 1 };
    const resolved = await fetch(`${baseUrl}/api/rsvp/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resolveBody),
    });
    const updated = await fetch(`${baseUrl}/api/rsvp`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateBody),
    });

    expect(service.resolve).toHaveBeenCalledWith(resolveBody);
    expect(service.update).toHaveBeenCalledWith(updateBody);
    for (const response of [resolved, updated]) {
      expect(response.headers.get('Cache-Control')).toBe('no-store');
      expect(response.headers.get('Referrer-Policy')).toBe('no-referrer');
      expect(response.headers.get('X-Robots-Tag')).toContain('noindex');
    }
  });

  it('returns identical safe errors without reflecting a token', async () => {
    service.resolve.mockRejectedValueOnce(
      new MvpError(404, 'RSVP_UNAVAILABLE', 'This invitation is unavailable'),
    );
    const secret = 'B'.repeat(43);
    const response = await fetch(`${baseUrl}/api/rsvp/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: secret }),
    });
    const body = await response.text();

    expect(response.status).toBe(404);
    expect(body).toContain('RSVP_UNAVAILABLE');
    expect(body).not.toContain(secret);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('Referrer-Policy')).toBe('no-referrer');
    expect(response.headers.get('X-Robots-Tag')).toContain('noindex');
  });

  it('applies privacy headers to malformed JSON responses', async () => {
    const response = await fetch(`${baseUrl}/api/rsvp/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{broken',
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ code: 'INVALID_JSON', error: 'Request body must be valid JSON' });
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('Referrer-Policy')).toBe('no-referrer');
    expect(response.headers.get('X-Robots-Tag')).toContain('noindex');
  });
});
