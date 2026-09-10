import { existsSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import ts from 'typescript';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMvpApiClient } from '@partyhause/core/mvp';
import { createMemoryStorage, STORAGE_KEYS } from '../../packages/core/src/http/adapters';

const repositoryRoot = process.cwd();
const mvpEntry = resolve(repositoryRoot, 'packages/core/src/mvp.ts');
const mobileClientEntry = resolve(repositoryRoot, 'apps/mobile/lib/client.ts');
const fetchMock = vi.fn<typeof fetch>();

const EXCLUDED_ENDPOINTS = [
  '/api/timeline',
  '/api/polls',
  '/api/partycrew',
  '/api/feed',
  '/api/notifications',
  '/api/storage',
  '/api/send-email',
  '/api/email-logs',
  '/api/invite-templates',
  '/api/invites',
] as const;

function runtimeImports(path: string): string[] {
  const source = readFileSync(path, 'utf8');
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const specifiers: string[] = [];

  for (const statement of file.statements) {
    if (ts.isImportDeclaration(statement) && !statement.importClause?.isTypeOnly) {
      if (ts.isStringLiteral(statement.moduleSpecifier)) specifiers.push(statement.moduleSpecifier.text);
    }
    if (ts.isExportDeclaration(statement) && !statement.isTypeOnly && statement.moduleSpecifier) {
      if (ts.isStringLiteral(statement.moduleSpecifier)) specifiers.push(statement.moduleSpecifier.text);
    }
  }
  return specifiers;
}

function resolveLocalImport(importer: string, specifier: string): string | null {
  if (!specifier.startsWith('.')) return null;
  const base = resolve(dirname(importer), specifier);
  const candidates = [`${base}.ts`, `${base}.tsx`, resolve(base, 'index.ts')];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function runtimeModuleGraph(entry: string): string[] {
  const pending = [entry];
  const visited = new Set<string>();

  while (pending.length > 0) {
    const path = pending.pop();
    if (!path || visited.has(path)) continue;
    visited.add(path);
    for (const specifier of runtimeImports(path)) {
      const dependency = resolveLocalImport(path, specifier);
      if (dependency && !visited.has(dependency)) pending.push(dependency);
    }
  }
  return [...visited].sort();
}

function response(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function requestAt(index: number): { url: string; init: RequestInit } {
  const [url, init] = fetchMock.mock.calls[index];
  return { url: String(url), init: init ?? {} };
}

function bodyAt(index: number): unknown {
  return JSON.parse(String(requestAt(index).init.body));
}

describe('iOS MVP API client boundary', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  it('exposes exactly the approved auth, account, event, guest, and invitation resources', () => {
    const client = createMvpApiClient({
      baseUrl: 'https://api.test.local',
      storage: createMemoryStorage(),
    });

    expect(Object.keys(client).sort()).toEqual(['account', 'auth', 'baseUrl', 'events', 'guests', 'invitations']);
  });

  it('keeps excluded endpoint strings out of its runtime module graph', () => {
    const graph = runtimeModuleGraph(mvpEntry);
    const sources = graph.map((path) => readFileSync(path, 'utf8')).join('\n');

    expect(graph.map((path) => relative(repositoryRoot, path))).not.toContain(
      'packages/core/src/resources/index.ts',
    );
    for (const endpoint of EXCLUDED_ENDPOINTS) {
      expect(sources).not.toContain(endpoint);
    }
    expect(sources).not.toMatch(/['"`]\/api\/(?:events|guests)(?:[/'"`?]|$)/);
  });

  // Skipped deliberately, and it must be re-enabled rather than deleted.
  //
  // This asserts a property of apps/mobile, which is not part of this change:
  // the mobile MVP rewrite is entangled with an Expo SDK 54 to 57 upgrade and
  // was held back. apps/mobile/lib/client.ts therefore still imports the broad
  // '@partyhause/core' entry, which is correct for the screens it currently
  // serves and wrong for the MVP surface.
  //
  // The four tests around this one exercise packages/core directly and do
  // apply, so the MVP client boundary itself is still covered. What is not
  // covered until mobile lands is that mobile actually consumes it.
  it.skip('does not route the mobile client through the broad package entry', () => {
    const source = readFileSync(mobileClientEntry, 'utf8');

    expect(source).toContain("from '@partyhause/core/mvp'");
    expect(source).not.toMatch(/from ['"]@partyhause\/core['"]/);
    expect(source).not.toContain("from './storage'");
    expect(source).not.toContain('createWebStorage');
  });

  it('uses only strict MVP event paths, verbs, bodies, and command headers', async () => {
    const client = createMvpApiClient({
      baseUrl: 'https://api.test.local',
      storage: createMemoryStorage(),
    });
    fetchMock.mockResolvedValue(response({ event: { id: 'event-1' }, events: [] }));
    const event = {
      name: 'Dinner',
      description: null,
      start: '2030-01-01T18:00:00.000Z',
      end: '2030-01-01T20:00:00.000Z',
      timezone: 'UTC',
      location: 'Hall',
    };

    await client.events.list();
    await client.events.get('event/1');
    await client.events.create(event, 'create-key');
    await client.events.update('event-1', { location: 'New hall', expectedRevision: 1 });
    await client.events.publish('event-1', 2, 'publish-key');
    await client.events.cancel('event-1', 3, 'cancel-key');
    await client.events.remove('event-1', 4, 'delete-key');

    expect(requestAt(0)).toMatchObject({ url: 'https://api.test.local/api/mvp/events', init: { method: 'GET' } });
    expect(requestAt(1).url).toBe('https://api.test.local/api/mvp/events/event%2F1');
    expect(requestAt(2).init.method).toBe('POST');
    expect(bodyAt(2)).toEqual(event);
    expect(new Headers(requestAt(2).init.headers).get('Idempotency-Key')).toBe('create-key');
    expect(requestAt(3).init.method).toBe('PATCH');
    expect(bodyAt(3)).toEqual({ location: 'New hall', expectedRevision: 1 });
    expect(requestAt(4).url).toBe('https://api.test.local/api/mvp/events/event-1/publish');
    expect(bodyAt(4)).toEqual({ expectedRevision: 2 });
    expect(new Headers(requestAt(4).init.headers).get('Idempotency-Key')).toBe('publish-key');
    expect(requestAt(5).url).toBe('https://api.test.local/api/mvp/events/event-1/cancel');
    expect(new Headers(requestAt(5).init.headers).get('Idempotency-Key')).toBe('cancel-key');
    expect(requestAt(6).init.method).toBe('DELETE');
    expect(bodyAt(6)).toEqual({ expectedRevision: 4 });
    expect(new Headers(requestAt(6).init.headers).get('Idempotency-Key')).toBe('delete-key');
  });

  it('uses only strict MVP guest paths and dedicated attendance commands', async () => {
    const client = createMvpApiClient({
      baseUrl: 'https://api.test.local',
      storage: createMemoryStorage(),
    });
    fetchMock.mockResolvedValue(response({ guest: { id: 'guest-1' }, guests: [{ id: 'guest-1' }] }));

    await client.guests.listForEventWithStats('event/1');
    await client.guests.get('guest/1');
    await client.guests.create('event-1', { name: 'Ada', email: 'ada@example.com' }, 'create-guest-key');
    await client.guests.createMany('event-1', [{ name: 'Grace', email: 'grace@example.com' }], 'batch-key');
    await client.guests.update('guest-1', { name: 'Ada B', expectedRevision: 1 });
    await client.guests.remove('guest-1', 2, 'remove-key');
    await client.guests.checkIn('guest-1', 3, 'check-in-key');
    await client.guests.correctCheckIn('guest-1', false, 4, 'correction-key');

    expect(requestAt(0).url).toBe('https://api.test.local/api/mvp/events/event%2F1/guests');
    expect(requestAt(1).url).toBe('https://api.test.local/api/mvp/guests/guest%2F1');
    expect(bodyAt(2)).toEqual({ name: 'Ada', email: 'ada@example.com' });
    expect(new Headers(requestAt(2).init.headers).get('Idempotency-Key')).toBe('create-guest-key');
    expect(bodyAt(3)).toEqual({ guests: [{ name: 'Grace', email: 'grace@example.com' }] });
    expect(requestAt(4).init.method).toBe('PATCH');
    expect(bodyAt(4)).toEqual({ name: 'Ada B', expectedRevision: 1 });
    expect(requestAt(5).init.method).toBe('DELETE');
    expect(bodyAt(5)).toEqual({ expectedRevision: 2 });
    expect(requestAt(6).url).toBe('https://api.test.local/api/mvp/guests/guest-1/check-in');
    expect(bodyAt(6)).toEqual({ expectedRevision: 3 });
    expect(requestAt(7).url).toBe('https://api.test.local/api/mvp/guests/guest-1/check-in/correction');
    expect(bodyAt(7)).toEqual({ checkedIn: false, expectedRevision: 4 });
    expect(new Headers(requestAt(7).init.headers).get('Idempotency-Key')).toBe('correction-key');
  });

  it('uses only the dedicated MVP invitation paths and server-owned content', async () => {
    const client = createMvpApiClient({
      baseUrl: 'https://api.test.local',
      storage: createMemoryStorage(),
    });
    fetchMock.mockResolvedValue(response({ candidates: [], results: [] }));

    await client.invitations.getForEvent('event/1');
    await client.invitations.send('event-1', ['guest-1', 'guest-2'], 'invite-key');

    expect(requestAt(0)).toMatchObject({
      url: 'https://api.test.local/api/mvp/events/event%2F1/invitations',
      init: { method: 'GET' },
    });
    expect(requestAt(1).url).toBe('https://api.test.local/api/mvp/events/event-1/invitations/send');
    expect(bodyAt(1)).toEqual({ guestIds: ['guest-1', 'guest-2'] });
    expect(new Headers(requestAt(1).init.headers).get('Idempotency-Key')).toBe('invite-key');
    expect(JSON.stringify(requestAt(1).init)).not.toMatch(/subject|html|recipient|address/i);
  });

  it('uses authenticated account summary and intent plus receipt-scoped deletion requests', async () => {
    const storage = createMemoryStorage();
    await storage.setItem(STORAGE_KEYS.token, 'session-token');
    const client = createMvpApiClient({ baseUrl: 'https://api.test.local', storage });
    fetchMock.mockResolvedValue(response({ deletion: { receipt: 'receipt-1', status: 'pending' } }));

    await client.account.summary();
    await client.account.createDeletionIntent('current-password');
    await client.account.confirmDeletion('receipt/1');
    await client.account.deletionStatus('receipt/1');

    expect(requestAt(0).url).toBe('https://api.test.local/api/mvp/account');
    expect(new Headers(requestAt(0).init.headers).get('Authorization')).toBe('Bearer session-token');
    expect(bodyAt(1)).toEqual({ password: 'current-password' });
    expect(new Headers(requestAt(1).init.headers).get('Authorization')).toBe('Bearer session-token');
    expect(bodyAt(2)).toEqual({ receipt: 'receipt/1', confirmation: 'DELETE' });
    expect(new Headers(requestAt(2).init.headers).has('Authorization')).toBe(false);
    expect(requestAt(3).url).toBe('https://api.test.local/api/mvp/account/deletion/receipt%2F1');
    expect(new Headers(requestAt(3).init.headers).has('Authorization')).toBe(false);
  });
});
