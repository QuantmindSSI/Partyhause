import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveRsvp, submitRsvp } from '@/lib/rsvp-client';

const fetchMock = vi.fn<typeof fetch>();

function response(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('anonymous browser RSVP client', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(response({ event: {}, rsvp: {} }));
    vi.stubGlobal('fetch', fetchMock);
  });

  it('keeps the token in a no-referrer resolve body', async () => {
    await resolveRsvp('private-token');
    const [url, init] = fetchMock.mock.calls[0];

    expect(url).toBe('/api/rsvp/resolve');
    expect(init).toMatchObject({
      method: 'POST',
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    });
    expect(JSON.parse(String(init?.body))).toEqual({ token: 'private-token' });
    expect(String(url)).not.toContain('private-token');
    expect(new Headers(init?.headers).has('Authorization')).toBe(false);
  });

  it('submits only token, status, and expectedRevision', async () => {
    await submitRsvp('private-token', 'declined', 7);
    const [url, init] = fetchMock.mock.calls[0];

    expect(url).toBe('/api/rsvp');
    expect(init?.method).toBe('PUT');
    expect(JSON.parse(String(init?.body))).toEqual({
      token: 'private-token',
      status: 'declined',
      expectedRevision: 7,
    });
  });
});
