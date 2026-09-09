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
  createSecureStoreStorage,
  createWebStorage,
  SECURE_STORE_MIGRATION_KEY,
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
    fetchMock.mockResolvedValue(jsonResponse(200, { events: [{ id: 'e1' }] }));

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
      .mockResolvedValueOnce(jsonResponse(200, { events: [{ id: 'e1' }] }));

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
    expect(onUnauthorized).toHaveBeenCalledWith('stale');
  });

  it('does not clear a session after an anonymous 401', async () => {
    const storage = createMemoryStorage();
    await storage.setItem(STORAGE_KEYS.token, 'existing-session');
    const onUnauthorized = vi.fn();
    const client = createApiClient({ baseUrl: BASE, storage, onUnauthorized });
    fetchMock.mockResolvedValue(jsonResponse(401, { error: 'Invalid email or password' }));

    const result = await client.auth.signIn('person@example.com', 'wrong-password');

    expect(result.error?.message).toBe('Invalid email or password');
    expect(await storage.getItem(STORAGE_KEYS.token)).toBe('existing-session');
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('does not clear a newer token when an old authenticated request returns 401', async () => {
    const storage = createMemoryStorage();
    await storage.setItem(STORAGE_KEYS.token, 'old-token');
    const onUnauthorized = vi.fn();
    const client = createApiClient({ baseUrl: BASE, storage, onUnauthorized });
    let resolveResponse: (response: Response) => void = () => undefined;
    fetchMock.mockImplementation(() => new Promise((resolve) => { resolveResponse = resolve; }));

    const request = client.events.list();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await storage.setItem(STORAGE_KEYS.token, 'new-token');
    resolveResponse(jsonResponse(401, { error: 'expired' }));
    const result = await request;

    expect(result.error?.status).toBe(401);
    expect(await storage.getItem(STORAGE_KEYS.token)).toBe('new-token');
    expect(onUnauthorized).toHaveBeenCalledWith('old-token');
  });

  it('returns a bounded error and clears the current token when a 401 body read fails', async () => {
    const storage = createMemoryStorage();
    await storage.setItem(STORAGE_KEYS.token, 'stale-token');
    const onUnauthorized = vi.fn();
    const client = createApiClient({ baseUrl: BASE, storage, onUnauthorized });
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      text: vi.fn().mockRejectedValue(new Error('socket closed')),
    } as unknown as Response);

    const result = await client.events.list();

    expect(result.error).toMatchObject({ status: 401, message: 'socket closed' });
    expect(await storage.getItem(STORAGE_KEYS.token)).toBeNull();
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

  it('preserves a machine-readable API error code', async () => {
    const client = createApiClient({ baseUrl: BASE, storage: createMemoryStorage() });
    fetchMock.mockResolvedValue(jsonResponse(403, {
      error: 'Email address not confirmed',
      code: 'EMAIL_NOT_VERIFIED',
    }));

    const response = await client.auth.signIn('person@example.com', 'password');

    expect(response.error).toEqual({
      message: 'Email address not confirmed',
      status: 403,
      code: 'EMAIL_NOT_VERIFIED',
    });
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

  it('does not persist a tokenless signup response', async () => {
    const storage = createMemoryStorage();
    const client = createApiClient({ baseUrl: BASE, storage });
    fetchMock.mockResolvedValue(jsonResponse(201, {
      user: { id: 'u1', email: 'a@b.c', email_verified: false },
      message: 'Check your email',
    }));

    const result = await client.auth.signUp('a@b.c', 'password', 'A', {
      ageEligible: true,
      termsVersion: '2026-09-06',
      privacyVersion: '2026-09-06',
    });

    expect(result.data?.user.id).toBe('u1');
    expect(await storage.getItem(STORAGE_KEYS.token)).toBeNull();
    expect(await storage.getItem(STORAGE_KEYS.user)).toBeNull();
  });

  it('clears the local session on sign out even if the server call fails', async () => {
    const storage = createMemoryStorage();
    await storage.setItem(STORAGE_KEYS.token, 'jwt');
    await storage.setItem(STORAGE_KEYS.user, '{"id":"u1"}');
    const client = createApiClient({ baseUrl: BASE, storage });
    fetchMock.mockRejectedValue(new Error('offline'));

    await client.auth.signOut();

    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get('Authorization')).toBe('Bearer jwt');
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

  it('moves legacy auth values to secure storage once and removes every plaintext copy', async () => {
    const secureValues = new Map<string, string>();
    const legacyValues = new Map<string, string>([
      [STORAGE_KEYS.token, 'legacy-token'],
      [STORAGE_KEYS.user, '{"id":"u1"}'],
    ]);
    const secureStore = {
      isAvailableAsync: vi.fn().mockResolvedValue(true),
      getItemAsync: vi.fn(async (key: string) => secureValues.get(key) ?? null),
      setItemAsync: vi.fn(async (key: string, value: string) => { secureValues.set(key, value); }),
      deleteItemAsync: vi.fn(async (key: string) => { secureValues.delete(key); }),
    };
    const legacyStorage = {
      getItem: vi.fn(async (key: string) => legacyValues.get(key) ?? null),
      setItem: vi.fn(async (key: string, value: string) => { legacyValues.set(key, value); }),
      removeItem: vi.fn(async (key: string) => { legacyValues.delete(key); }),
    };
    const storage = createSecureStoreStorage(secureStore, { legacyStorage });

    expect(await storage.getItem(STORAGE_KEYS.token)).toBe('legacy-token');
    expect(secureValues.get(STORAGE_KEYS.user)).toBe('{"id":"u1"}');
    expect(secureValues.get(SECURE_STORE_MIGRATION_KEY)).toBe('complete');
    expect(legacyValues.has(STORAGE_KEYS.token)).toBe(false);
    expect(legacyValues.has(STORAGE_KEYS.user)).toBe(false);

    const legacyReadCount = legacyStorage.getItem.mock.calls.length;
    await storage.getItem(STORAGE_KEYS.user);
    expect(legacyStorage.getItem).toHaveBeenCalledTimes(legacyReadCount);
  });

  it('keeps an existing secure value and removes the stale legacy value', async () => {
    const secureValues = new Map<string, string>([[STORAGE_KEYS.token, 'secure-token']]);
    const legacyValues = new Map<string, string>([[STORAGE_KEYS.token, 'legacy-token']]);
    const storage = createSecureStoreStorage({
      getItemAsync: async (key) => secureValues.get(key) ?? null,
      setItemAsync: async (key, value) => { secureValues.set(key, value); },
      deleteItemAsync: async (key) => { secureValues.delete(key); },
    }, {
      legacyStorage: {
        getItem: async (key) => legacyValues.get(key) ?? null,
        setItem: async (key, value) => { legacyValues.set(key, value); },
        removeItem: async (key) => { legacyValues.delete(key); },
      },
    });

    expect(await storage.getItem(STORAGE_KEYS.token)).toBe('secure-token');
    expect(legacyValues.has(STORAGE_KEYS.token)).toBe(false);
  });

  it('retains the legacy value and retries when a secure migration write fails', async () => {
    const secureValues = new Map<string, string>();
    const legacyValues = new Map<string, string>([[STORAGE_KEYS.token, 'legacy-token']]);
    let failWrite = true;
    const storage = createSecureStoreStorage({
      getItemAsync: async (key) => secureValues.get(key) ?? null,
      setItemAsync: async (key, value) => {
        if (failWrite && key === STORAGE_KEYS.token) throw new Error('keychain locked');
        secureValues.set(key, value);
      },
      deleteItemAsync: async (key) => { secureValues.delete(key); },
    }, {
      legacyStorage: {
        getItem: async (key) => legacyValues.get(key) ?? null,
        setItem: async (key, value) => { legacyValues.set(key, value); },
        removeItem: async (key) => { legacyValues.delete(key); },
      },
    });

    await expect(storage.getItem(STORAGE_KEYS.token)).rejects.toThrow('keychain locked');
    expect(legacyValues.get(STORAGE_KEYS.token)).toBe('legacy-token');
    expect(secureValues.has(SECURE_STORE_MIGRATION_KEY)).toBe(false);

    failWrite = false;
    await expect(storage.getItem(STORAGE_KEYS.token)).resolves.toBe('legacy-token');
    expect(legacyValues.has(STORAGE_KEYS.token)).toBe(false);
  });

  it('does not mark migration complete until legacy credential removal succeeds', async () => {
    const secureValues = new Map<string, string>();
    const legacyValues = new Map<string, string>([[STORAGE_KEYS.token, 'legacy-token']]);
    let failRemoval = true;
    const storage = createSecureStoreStorage({
      getItemAsync: async (key) => secureValues.get(key) ?? null,
      setItemAsync: async (key, value) => { secureValues.set(key, value); },
      deleteItemAsync: async (key) => { secureValues.delete(key); },
    }, {
      legacyStorage: {
        getItem: async (key) => legacyValues.get(key) ?? null,
        setItem: async (key, value) => { legacyValues.set(key, value); },
        removeItem: async (key) => {
          if (failRemoval) throw new Error('plaintext removal failed');
          legacyValues.delete(key);
        },
      },
    });

    await expect(storage.getItem(STORAGE_KEYS.token)).rejects.toThrow('plaintext removal failed');
    expect(legacyValues.get(STORAGE_KEYS.token)).toBe('legacy-token');
    expect(secureValues.get(STORAGE_KEYS.token)).toBe('legacy-token');
    expect(secureValues.has(SECURE_STORE_MIGRATION_KEY)).toBe(false);

    failRemoval = false;
    await expect(storage.getItem(STORAGE_KEYS.token)).resolves.toBe('legacy-token');
    expect(legacyValues.has(STORAGE_KEYS.token)).toBe(false);
    expect(secureValues.get(SECURE_STORE_MIGRATION_KEY)).toBe('complete');
  });

  it('fails closed and leaves plaintext untouched when SecureStore is unavailable', async () => {
    const legacyValues = new Map<string, string>([[STORAGE_KEYS.token, 'legacy-token']]);
    const secureWrite = vi.fn();
    const storage = createSecureStoreStorage({
      isAvailableAsync: async () => false,
      getItemAsync: async () => null,
      setItemAsync: secureWrite,
      deleteItemAsync: async () => undefined,
    }, {
      legacyStorage: {
        getItem: async (key) => legacyValues.get(key) ?? null,
        setItem: async (key, value) => { legacyValues.set(key, value); },
        removeItem: async (key) => { legacyValues.delete(key); },
      },
    });

    await expect(storage.getItem(STORAGE_KEYS.token)).rejects.toThrow(
      'Secure credential storage is unavailable',
    );
    expect(legacyValues.get(STORAGE_KEYS.token)).toBe('legacy-token');
    expect(secureWrite).not.toHaveBeenCalled();
  });

  it('removes a stale plaintext copy after every secure write', async () => {
    const secureValues = new Map<string, string>([[SECURE_STORE_MIGRATION_KEY, 'complete']]);
    const legacyValues = new Map<string, string>([[STORAGE_KEYS.token, 'stale-token']]);
    const storage = createSecureStoreStorage({
      getItemAsync: async (key) => secureValues.get(key) ?? null,
      setItemAsync: async (key, value) => { secureValues.set(key, value); },
      deleteItemAsync: async (key) => { secureValues.delete(key); },
    }, {
      legacyStorage: {
        getItem: async (key) => legacyValues.get(key) ?? null,
        setItem: async (key, value) => { legacyValues.set(key, value); },
        removeItem: async (key) => { legacyValues.delete(key); },
      },
    });

    await storage.setItem(STORAGE_KEYS.token, 'new-token');

    expect(secureValues.get(STORAGE_KEYS.token)).toBe('new-token');
    expect(legacyValues.has(STORAGE_KEYS.token)).toBe(false);
  });

  it('removes secure and plaintext copies without migrating on sign-out', async () => {
    const secureValues = new Map<string, string>([[STORAGE_KEYS.token, 'secure-token']]);
    const legacyValues = new Map<string, string>([[STORAGE_KEYS.token, 'legacy-token']]);
    const secureWrite = vi.fn();
    const storage = createSecureStoreStorage({
      getItemAsync: async (key) => secureValues.get(key) ?? null,
      setItemAsync: secureWrite,
      deleteItemAsync: async (key) => { secureValues.delete(key); },
    }, {
      legacyStorage: {
        getItem: async (key) => legacyValues.get(key) ?? null,
        setItem: async (key, value) => { legacyValues.set(key, value); },
        removeItem: async (key) => { legacyValues.delete(key); },
      },
    });

    await storage.removeItem(STORAGE_KEYS.token);

    expect(secureValues.has(STORAGE_KEYS.token)).toBe(false);
    expect(legacyValues.has(STORAGE_KEYS.token)).toBe(false);
    expect(secureWrite).not.toHaveBeenCalled();
  });

  it('serializes sign-out behind an in-flight plaintext migration', async () => {
    const secureValues = new Map<string, string>();
    const legacyValues = new Map<string, string>([[STORAGE_KEYS.token, 'legacy-token']]);
    let releaseWrite: () => void = () => undefined;
    let signalWriteStarted: () => void = () => undefined;
    const writeStarted = new Promise<void>((resolve) => { signalWriteStarted = resolve; });
    const writeReleased = new Promise<void>((resolve) => { releaseWrite = resolve; });
    const storage = createSecureStoreStorage({
      getItemAsync: async (key) => secureValues.get(key) ?? null,
      setItemAsync: async (key, value) => {
        if (key === STORAGE_KEYS.token) {
          signalWriteStarted();
          await writeReleased;
        }
        secureValues.set(key, value);
      },
      deleteItemAsync: async (key) => { secureValues.delete(key); },
    }, {
      legacyStorage: {
        getItem: async (key) => legacyValues.get(key) ?? null,
        setItem: async (key, value) => { legacyValues.set(key, value); },
        removeItem: async (key) => { legacyValues.delete(key); },
      },
    });

    const migration = storage.getItem(STORAGE_KEYS.token);
    await writeStarted;
    const signOut = storage.removeItem(STORAGE_KEYS.token);
    releaseWrite();
    await Promise.all([migration, signOut]);

    expect(secureValues.has(STORAGE_KEYS.token)).toBe(false);
    expect(legacyValues.has(STORAGE_KEYS.token)).toBe(false);
  });

  it('serializes a replacement login after conditional session clearing', async () => {
    const secureValues = new Map<string, string>([
      [SECURE_STORE_MIGRATION_KEY, 'complete'],
      [STORAGE_KEYS.token, 'old-token'],
      [STORAGE_KEYS.user, '{"id":"old-user"}'],
    ]);
    let releaseDelete: () => void = () => undefined;
    let signalDeleteStarted: () => void = () => undefined;
    const deleteStarted = new Promise<void>((resolve) => { signalDeleteStarted = resolve; });
    const deleteReleased = new Promise<void>((resolve) => { releaseDelete = resolve; });
    const storage = createSecureStoreStorage({
      getItemAsync: async (key) => secureValues.get(key) ?? null,
      setItemAsync: async (key, value) => { secureValues.set(key, value); },
      deleteItemAsync: async (key) => {
        if (key === STORAGE_KEYS.token) {
          signalDeleteStarted();
          await deleteReleased;
        }
        secureValues.delete(key);
      },
    });

    const clearing = storage.clearSessionIfToken?.('old-token');
    await deleteStarted;
    const replacement = storage.setItem(STORAGE_KEYS.token, 'new-token');
    releaseDelete();

    await expect(clearing).resolves.toBe(true);
    await replacement;
    expect(await storage.getItem(STORAGE_KEYS.token)).toBe('new-token');
  });
});

describe('response envelope unwrapping', () => {
  // Every list/single route wraps its payload under a named key. Returning the
  // envelope makes `data` an object where callers expect an array, so
  // data.map(...) throws at runtime while the types still look correct.
  it('lifts {events} from the list route', async () => {
    const client = createApiClient({ baseUrl: BASE, storage: createMemoryStorage() });
    fetchMock.mockResolvedValue(jsonResponse(200, { events: [{ id: 'e1' }, { id: 'e2' }] }));

    const res = await client.events.list();

    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data).toHaveLength(2);
  });

  it('lifts {event, stats} from the single route, discarding stats', async () => {
    const client = createApiClient({ baseUrl: BASE, storage: createMemoryStorage() });
    fetchMock.mockResolvedValue(jsonResponse(200, { event: { id: 'e1' }, stats: { total_guests: 3 } }));

    const res = await client.events.get('e1');

    expect(res.data).toEqual({ id: 'e1' });
  });

  it('lifts {guests, stats} from the guest list route', async () => {
    const client = createApiClient({ baseUrl: BASE, storage: createMemoryStorage() });
    fetchMock.mockResolvedValue(jsonResponse(200, { guests: [{ id: 'g1' }], stats: {} }));

    const res = await client.guests.listForEvent('e1');

    expect(res.data).toEqual([{ id: 'g1' }]);
  });

  it('normalizes legacy confirmed RSVP rows to accepted for MVP clients', async () => {
    const client = createApiClient({ baseUrl: BASE, storage: createMemoryStorage() });
    fetchMock.mockResolvedValue(jsonResponse(200, {
      guests: [{ id: 'g1', rsvp_status: 'confirmed' }],
      stats: { accepted: 1 },
    }));

    const result = await client.guests.listForEventWithStats('e1');

    expect(result.data?.guests[0].rsvp_status).toBe('accepted');
    expect(result.data?.stats.accepted).toBe(1);
  });

  it('lifts {blocks} and {polls} and {notifications}', async () => {
    const client = createApiClient({ baseUrl: BASE, storage: createMemoryStorage() });

    fetchMock.mockResolvedValueOnce(jsonResponse(200, { blocks: [{ id: 't1' }] }));
    expect((await client.timeline.listForEvent('e1')).data).toEqual([{ id: 't1' }]);

    fetchMock.mockResolvedValueOnce(jsonResponse(200, { polls: [{ id: 'p1' }] }));
    expect((await client.polls.list('e1')).data).toEqual([{ id: 'p1' }]);

    fetchMock.mockResolvedValueOnce(jsonResponse(200, { notifications: [{ id: 'n1' }] }));
    expect((await client.notifications.list()).data).toEqual([{ id: 'n1' }]);
  });

  it('yields [] when a list route omits the key entirely', async () => {
    const client = createApiClient({ baseUrl: BASE, storage: createMemoryStorage() });
    fetchMock.mockResolvedValue(jsonResponse(200, {}));

    const res = await client.events.list();

    // Callers do data.map(...); null would throw.
    expect(res.data).toEqual([]);
  });

  it('propagates errors without attempting to unwrap', async () => {
    const client = createApiClient({ baseUrl: BASE, storage: createMemoryStorage() });
    fetchMock.mockResolvedValue(jsonResponse(500, { error: 'boom' }));

    const res = await client.events.list();

    expect(res.data).toBeNull();
    expect(res.error?.message).toBe('boom');
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
