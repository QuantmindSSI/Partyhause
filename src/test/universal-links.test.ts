/**
 * Guards the Universal Links association and the RSVP deep link behind it.
 *
 * WHY THIS EXISTS
 *   `/.well-known/apple-app-site-association` answered 404 for the life of the
 *   domain, which was correct: no Team ID existed, so the site could claim no
 *   app. Now one does, and publishing the file introduces a failure mode that
 *   nothing else in the repository can catch.
 *
 *   Apple's CDN fetches this file and caches it. If it claims a path the app
 *   has no route for, tapping that link opens the app to expo-router's
 *   unmatched screen instead of opening Safari, and the fix does not take
 *   effect until the cache expires. A wrong file is materially worse than the
 *   404 it replaced.
 *
 *   So the invariant that matters is not "is the file valid JSON". It is:
 *   every path this file claims must resolve to a real screen, and the appID
 *   must agree with the three other places the same identity is written down.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { createApiClient, createMemoryStorage } from '../../packages/core/src/index';

const ROOT = process.cwd();
const AASA_PATH = path.resolve(ROOT, 'public/.well-known/apple-app-site-association');
const MOBILE_APP = path.resolve(ROOT, 'apps/mobile/app');
const BASE = 'https://api.test.local';

interface AasaDetail {
  appID?: string;
  appIDs?: string[];
  paths?: string[];
  components?: Array<Record<string, string>>;
}

function readAasa(): { applinks: { details: AasaDetail[] } } {
  return JSON.parse(fs.readFileSync(AASA_PATH, 'utf8'));
}

function read(relative: string): string {
  return fs.readFileSync(path.resolve(ROOT, relative), 'utf8');
}

/**
 * Read a source file with comments removed.
 *
 * Absence assertions must run against code. The comment explaining why this
 * screen does not call `isAuthenticated` necessarily contains the word, so
 * asserting on raw text would penalise the explanation.
 *
 * @param relative Repo-relative path.
 * @returns Source with block comments and comment-only lines stripped.
 */
function readCode(relative: string): string {
  return read(relative)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      return !trimmed.startsWith('//') && !trimmed.startsWith('*');
    })
    .join('\n');
}

/** Route paths expo-router derives from the file tree, groups stripped. */
function mobileRoutes(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.tsx$/.test(entry.name) && !entry.name.startsWith('_layout')) out.push(full);
    }
  };
  walk(MOBILE_APP);

  return out.map((file) => {
    const rel = path
      .relative(MOBILE_APP, file)
      .replace(/\.tsx$/, '')
      .replace(/(^|\/)index$/, '');
    const bare = rel
      .split('/')
      .filter((s) => s.length > 0 && !/^\(.*\)$/.test(s))
      .join('/');
    return `/${bare}`.replace(/\/$/, '') || '/';
  });
}

/**
 * Does any mobile route serve this claimed path pattern?
 *
 * A claim such as `/join/*` is served by `/join/[token]`, so the wildcard is
 * matched against a dynamic segment rather than compared literally.
 *
 * @param claim A path pattern from the association file.
 * @param routes Route paths derived from the file tree.
 */
function claimIsRouted(claim: string, routes: string[]): boolean {
  const claimSegments = claim.split('/').filter(Boolean);

  return routes.some((route) => {
    const routeSegments = route.split('/').filter(Boolean);
    if (routeSegments.length < claimSegments.length) return false;

    return claimSegments.every((segment, index) => {
      const actual = routeSegments[index];
      if (segment === '*') return /^\[.+\]$/.test(actual) || actual !== undefined;
      return segment === actual;
    });
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

describe('the apple-app-site-association file', () => {
  it('exists and is valid JSON', () => {
    // Apple requires the exact filename with no extension, served as JSON.
    expect(fs.existsSync(AASA_PATH), 'AASA file is missing').toBe(true);
    expect(() => readAasa()).not.toThrow();
  });

  it('carries no placeholder identifiers', () => {
    const raw = fs.readFileSync(AASA_PATH, 'utf8');
    for (const marker of ['TEAMID', 'REPLACE', 'XXXX', 'example.com', 'YOUR_']) {
      expect(raw, `placeholder in AASA: ${marker}`).not.toContain(marker);
    }
  });

  it('states an appID of TEAMID.bundleIdentifier', () => {
    const detail = readAasa().applinks.details[0];
    expect(detail.appID).toBeDefined();

    const [team, ...bundle] = detail.appID!.split('.');
    // Apple Team IDs are exactly ten alphanumeric characters.
    expect(team, `${team} is not a Team ID`).toMatch(/^[A-Z0-9]{10}$/);
    expect(bundle.join('.')).toBe('com.partyhause.mobile');
  });

  it('agrees with the bundle identifier in app.config.ts', () => {
    const detail = readAasa().applinks.details[0];
    const config = read('apps/mobile/app.config.ts');
    const bundle = detail.appID!.split('.').slice(1).join('.');

    expect(config).toContain(`bundleIdentifier: "${bundle}"`);
  });

  it('agrees with the Team ID in eas.json', () => {
    const detail = readAasa().applinks.details[0];
    const team = detail.appID!.split('.')[0];
    const eas = JSON.parse(read('apps/mobile/eas.json'));

    // If these drift, `eas submit` signs for one team while the site vouches
    // for another, and association fails with no useful diagnostic.
    expect(eas.submit.production.ios.appleTeamId).toBe(team);
  });

  it('keeps appID and appIDs consistent', () => {
    // Both spellings are published for compatibility across iOS versions.
    // Disagreeing entries would associate on some devices and not others.
    const detail = readAasa().applinks.details[0];
    expect(detail.appIDs).toContain(detail.appID);
  });

  it('claims only paths the app has a route for', () => {
    // THE point of this file. A claimed path with no screen behind it opens
    // the app to the unmatched screen rather than opening Safari, and the
    // association is cached by Apple.
    const detail = readAasa().applinks.details[0];
    const routes = mobileRoutes();

    const claims = [
      ...(detail.paths ?? []),
      ...(detail.components ?? []).map((component) => component['/']).filter(Boolean),
    ];
    expect(claims.length, 'AASA claims no paths at all').toBeGreaterThan(0);

    const unrouted = claims.filter((claim) => !claimIsRouted(claim, routes));
    expect(
      unrouted,
      `claimed with no mobile route: ${unrouted.join(', ')}`,
    ).toEqual([]);
  });

  it('is served from the domain the app declares', () => {
    // associatedDomains names the host Apple will fetch this file from. If it
    // named a different one, the published file would never be read.
    const config = read('apps/mobile/app.config.ts');
    expect(config).toContain('applinks:partyhause.com');
  });

  it('survives the web build into dist', () => {
    // Dot-directories are routinely dropped by build tooling. A file that
    // exists in the repo but not in the image is a 404 in production, which is
    // exactly the state this replaced.
    const built = path.resolve(ROOT, 'dist/.well-known/apple-app-site-association');
    if (!fs.existsSync(path.resolve(ROOT, 'dist'))) return;
    expect(fs.existsSync(built), 'AASA missing from dist/, vite did not copy it').toBe(true);
  });

  it('is not excluded from the Docker build context', () => {
    const ignore = read('.dockerignore');
    for (const line of ignore.split('\n').map((l) => l.trim())) {
      expect(line).not.toBe('public');
      expect(line).not.toBe('public/');
      expect(line).not.toBe('.well-known');
    }
  });
});

describe('the RSVP deep link the association points at', () => {
  it('has a route', () => {
    expect(fs.existsSync(path.join(MOBILE_APP, 'join/[token].tsx'))).toBe(true);
  });

  it('resolves and responds through the shared client', () => {
    const screen = read('apps/mobile/app/join/[token].tsx');
    expect(screen).toContain('api.rsvp.resolve');
    expect(screen).toContain('api.rsvp.respond');
  });

  it('does not gate itself behind a session', () => {
    // A guest replying to an invitation has no account. The token is the
    // credential, which is why /api/rsvp sits outside requireAuth.
    const screen = readCode('apps/mobile/app/join/[token].tsx');
    expect(screen).not.toContain('isAuthenticated');
  });

  it('is not nested under an auth-gated layout', () => {
    // app/events/_layout.tsx gates its subtree. app/join must not sit under
    // anything similar, or the link opens onto a sign-in wall.
    expect(fs.existsSync(path.join(MOBILE_APP, 'join/_layout.tsx'))).toBe(false);
  });
});

describe('the shared RSVP resource', () => {
  const client = () => createApiClient({ baseUrl: BASE, storage: createMemoryStorage() });

  it('is exposed on the client', () => {
    const api = client();
    expect(typeof api.rsvp.resolve).toBe('function');
    expect(typeof api.rsvp.respond).toBe('function');
  });

  it('resolves anonymously with only the token', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ event: {}, rsvp: { status: 'pending', revision: 3 } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await client().rsvp.resolve('tok_1');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/api/rsvp/resolve`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual({ token: 'tok_1' });
    // The service rejects unknown keys, and an Authorization header here would
    // be meaningless: the guest has no account.
    expect(new Headers(init.headers).get('Authorization')).toBeNull();
  });

  it('echoes the revision so two devices cannot silently overwrite each other', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ event: {}, rsvp: { status: 'accepted', revision: 4 } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await client().rsvp.respond('tok_1', 'accepted', 3);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/api/rsvp`);
    expect(init.method).toBe('PUT');
    // exactKeys() on the server rejects anything beyond these three.
    expect(JSON.parse(String(init.body))).toEqual({
      token: 'tok_1',
      status: 'accepted',
      expectedRevision: 3,
    });
  });

  it('surfaces a revision conflict rather than retrying blindly', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ code: 'REVISION_CONFLICT', error: 'stale' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const { data, error } = await client().rsvp.respond('tok_1', 'declined', 1);

    expect(data).toBeFalsy();
    expect(error?.code).toBe('REVISION_CONFLICT');
    // One call. A retry would resend the same stale revision and fail again.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
