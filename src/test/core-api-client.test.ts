/**
 * Behavioural tests for the shared API client in packages/core.
 *
 * These exercise the transport directly with an injected fetch, because the
 * behaviour that matters is not "does it call the right URL" but the parts
 * that previously went wrong in production:
 *
 *   - retry must be bounded, and must never retry a mutation
 *   - a 401 must clear BOTH stored keys, or a rehydrated store keeps claiming
 *     the user is signed in while every request fails
 *   - errors must be normalised from three different server body shapes
 *   - the token must come from async storage, since React Native has no
 *     synchronous localStorage
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createApiClient,
  createMemoryStorage,
  createWebStorage,
  STORAGE_KEYS,
  type ApiCallRecord,
} from '../../packages/core/src/index';

const BASE = 'https://api.test.local';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('shared API client transport', () => {
  it('rejects construction without a base URL', () => {
    expect(() => createApiClient({ baseUrl: '', storage: createMemoryStorage() })).toThrow(
      /baseUrl is required/,
    );
  });

  it('rejects a non-positive timeout', () => {
    expect(() =>
      createApiClient({ baseUrl: BASE, storage: createMemoryStorage(), timeoutMs: 0 }),
    ).toThrow(/timeoutMs must be positive/);
  });

  it('attaches a bearer token read from async storage', async () => {
    const storage = createMemoryStorage();
    await storage.setItem(STORAGE_KEYS.token, 'tok-123');
    const client = createApiClient({ baseUrl: BASE, storage });
    fetchMock.mockResolvedValue(jsonResponse(200, [{ id: 'e1' }]));

    await client.events.list();

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer tok-123');
  });

  it('omits the bearer token on anonymous calls such as login', async () => {
    const storage = createMemoryStorage();
    await storage.setItem(STORAGE_KEYS.token, 'tok-123');
    const client = createApiClient({ baseUrl: BASE, storage });
    fetchMock.mockResolvedValue(jsonResponse(200, { user: { id: 'u1', email: 'a@b.c' }, token: 't' }));

    await client.auth.signIn('a@b.c', 'pw');

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBeUndefined();
  });

  it('retries a GET once on 503 and then succeeds', async () => {
    const client = createApiClient({ baseUrl: BASE, storage: createMemoryStorage() });
    fetchMock
      .mockResolvedValueOnce(jsonResponse(503, { error: 'unavailable' }))
      .mockResolvedValueOnce(jsonResponse(200, [{ id: 'e1' }]));

    const res = await client.events.list();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(res.error).toBeNull();
    expect(res.data).toEqual([{ id: 'e1' }]);
  });

  it('never retries a mutation, so an event cannot be created twice', async () => {
    const client = createApiClient({ baseUrl: BASE, storage: createMemoryStorage() });
    fetchMock.mockResolvedValue(jsonResponse(503, { error: 'unavailable' }));

    const res = await client.events.create({ name: 'Party' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(res.error?.status).toBe(503);
  });

  it('bounds retries: a persistently failing GET stops at two attempts', async () => {
    const client = createApiClient({ baseUrl: BASE, storage: createMemoryStorage() });
    fetchMock.mockRejectedValue(new Error('network down'));

    const res = await client.events.list();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(res.data).toBeNull();
    expect(res.error?.message).toBe('network down');
  });

  it('clears BOTH stored keys and invokes onUnauthorized on 401', async () => {
    const storage = createMemoryStorage();
    await storage.setItem(STORAGE_KEYS.token, 'stale');
    await storage.setItem(STORAGE_KEYS.user, JSON.stringify({ id: 'u1' }));
    const onUnauthorized = vi.fn();
    const client = createApiClient({ baseUrl: BASE, storage, onUnauthorized });
    fetchMock.mockResolvedValue(jsonResponse(401, { error: 'nope' }));

    const res = await client.events.list();

    expect(res.error?.status).toBe(401);
    expect(await storage.getItem(STORAGE_KEYS.token)).toBeNull();
    expect(await storage.getItem(STORAGE_KEYS.user)).toBeNull();
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('still returns to the caller when onUnauthorized throws', async () => {
    const storage = createMemoryStorage();
    const client = createApiClient({
      baseUrl: BASE, storage,
      onUnauthorized: () => { throw new Error('navigation blew up'); },
    });
    fetchMock.mockResolvedValue(jsonResponse(401, {}));

    const res = await client.events.list();
    expect(res.error?.status).toBe(401);
  });

  it('normalises error messages from {error}, {message} and plain text', async () => {
    const client = createApiClient({ baseUrl: BASE, storage: createMemoryStorage() });

    fetchMock.mockResolvedValueOnce(jsonResponse(400, { error: 'bad input' }));
    expect((await client.events.list()).error?.message).toBe('bad input');

    fetchMock.mockResolvedValueOnce(jsonResponse(400, { message: 'other shape' }));
    expect((await client.events.list()).error?.message).toBe('other shape');

    fetchMock.mockResolvedValueOnce(new Response('plain failure', { status: 500 }));
    expect((await client.events.list()).error?.message).toBe('plain failure');

    fetchMock.mockResolvedValueOnce(new Response('', { status: 418 }));
    expect((await client.events.list()).error?.message).toBe('HTTP error! status: 418');
  });

  it('reports telemetry without letting a throwing sink break the request', async () => {
    const records: ApiCallRecord[] = [];
    const client = createApiClient({
      baseUrl: BASE,
      storage: createMemoryStorage(),
      telemetry: (r) => { records.push(r); throw new Error('sink exploded'); },
    });
    fetchMock.mockResolvedValue(jsonResponse(200, []));

    const res = await client.events.list();

    expect(res.error).toBeNull();
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ method: 'GET', path: '/api/events', status: 200, ok: true, attempts: 1 });
  });

  it('builds query strings and drops null/undefined params', async () => {
    const client = createApiClient({ baseUrl: BASE, storage: createMemoryStorage() });
    fetchMock.mockResolvedValue(jsonResponse(200, []));

    await client.request('/api/guests', { method: 'GET', query: { eventId: 'e1', cursor: null, limit: 10 } });

    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/api/guests?eventId=e1&limit=10`);
  });
});

describe('auth resource', () => {
  it('persists token and user on successful sign in', async () => {
    const storage = createMemoryStorage();
    const client = createApiClient({ baseUrl: BASE, storage });
    fetchMock.mockResolvedValue(
      jsonResponse(200, { user: { id: 'u1', email: 'a@b.c', name: 'A' }, token: 'jwt-abc' }),
    );

    await client.auth.signIn('a@b.c', 'pw');

    expect(await storage.getItem(STORAGE_KEYS.token)).toBe('jwt-abc');
    expect(await client.auth.getCachedUser()).toMatchObject({ id: 'u1', email: 'a@b.c' });
    expect(await client.auth.isAuthenticated()).toBe(true);
  });

  it('does not persist anything when sign in fails', async () => {
    const storage = createMemoryStorage();
    const client = createApiClient({ baseUrl: BASE, storage });
    fetchMock.mockResolvedValue(jsonResponse(400, { error: 'Invalid email or password' }));

    const res = await client.auth.signIn('a@b.c', 'wrong');

    expect(res.error?.message).toBe('Invalid email or password');
    expect(await client.auth.isAuthenticated()).toBe(false);
  });

  it('clears the local session on sign out even if the server call fails', async () => {
    const storage = createMemoryStorage();
    await storage.setItem(STORAGE_KEYS.token, 'jwt');
    await storage.setItem(STORAGE_KEYS.user, '{"id":"u1"}');
    const client = createApiClient({ baseUrl: BASE, storage });
    fetchMock.mockRejectedValue(new Error('offline'));

    await client.auth.signOut();

    expect(await storage.getItem(STORAGE_KEYS.token)).toBeNull();
    expect(await storage.getItem(STORAGE_KEYS.user)).toBeNull();
  });

  it('drops a corrupt cached user instead of throwing', async () => {
    const storage = createMemoryStorage();
    await storage.setItem(STORAGE_KEYS.user, '{not json');
    const client = createApiClient({ baseUrl: BASE, storage });

    expect(await client.auth.getCachedUser()).toBeNull();
    expect(await storage.getItem(STORAGE_KEYS.user)).toBeNull();
  });
});

describe('storage adapters', () => {
  it('web adapter degrades to null when no storage exists', async () => {
    const s = createWebStorage({
      getItem: () => { throw new Error('disabled'); },
      setItem: () => { throw new Error('quota'); },
      removeItem: () => { throw new Error('disabled'); },
    });
    await expect(s.getItem('k')).resolves.toBeNull();
    await expect(s.setItem('k', 'v')).resolves.toBeUndefined();
    await expect(s.removeItem('k')).resolves.toBeUndefined();
  });

  it('web adapter round-trips through an injected storage', async () => {
    const map = new Map<string, string>();
    const s = createWebStorage({
      getItem: (k) => map.get(k) ?? null,
      setItem: (k, v) => { map.set(k, v); },
      removeItem: (k) => { map.delete(k); },
    });
    await s.setItem('k', 'v');
    expect(await s.getItem('k')).toBe('v');
    await s.removeItem('k');
    expect(await s.getItem('k')).toBeNull();
  });
});

describe('events resource path correction', () => {
  it('fetches one event by path param, not a query string', async () => {
    const client = createApiClient({ baseUrl: BASE, storage: createMemoryStorage() });
    fetchMock.mockResolvedValue(jsonResponse(200, { id: 'e1' }));

    await client.events.get('e1');

    // server/routes/events.ts declares router.get('/:id?') and reads
    // req.params.id. A query string is ignored and the full list comes back.
    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/api/events/e1`);
  });

  it('encodes ids so a slash cannot escape the path', async () => {
    const client = createApiClient({ baseUrl: BASE, storage: createMemoryStorage() });
    fetchMock.mockResolvedValue(jsonResponse(200, {}));

    await client.events.get('a/b');

    expect(fetchMock.mock.calls[0][0]).toBe(`${BASE}/api/events/a%2Fb`);
  });
});

describe('guests resource path correction', () => {
  it('updates via PUT /api/guests/:id, not PATCH with a query string', async () => {
    const client = createApiClient({ baseUrl: BASE, storage: createMemoryStorage() });
    fetchMock.mockResolvedValue(jsonResponse(200, { id: 'g1' }));

    await client.guests.update('g1', { rsvpStatus: 'accepted' });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/api/guests/g1`);
    expect(init.method).toBe('PUT');
  });

  it('sends checkedIn, the name the route destructures, not the column name', async () => {
    const client = createApiClient({ baseUrl: BASE, storage: createMemoryStorage() });
    fetchMock.mockResolvedValue(jsonResponse(200, { id: 'g1' }));

    await client.guests.update('g1', { checkedIn: true });

    // PUT /api/guests/:id destructures `checkedIn` and maps it to the
    // checked_in column. The Guest model also carries a legacy `is_checked_in`
    // column that the API never reads; mobile wrote to it for months, so every
    // check-in was invisible to the API and the web app.
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toEqual({ checkedIn: true });
    expect(body).not.toHaveProperty('is_checked_in');
    expect(body).not.toHaveProperty('checked_in');
  });
});
