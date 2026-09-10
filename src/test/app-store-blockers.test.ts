/**
 * Regression tests for the App Store submission blockers closed on 2026-09-10.
 *
 * Each block below pins one defect that would have caused a rejection or a
 * broken first-run experience. They are grouped by the guideline they answer to
 * rather than by file, because that is the axis on which they will be
 * re-litigated.
 *
 * WHY SO MUCH OF THIS IS SOURCE INSPECTION
 *   The mobile app has no test runner of its own: `apps/mobile` contains zero
 *   test files, and Vitest runs under jsdom with no React Native renderer, so
 *   these screens cannot be mounted here. Two things are still worth asserting
 *   from source, and they are exactly the two that failed:
 *
 *     1. that a control has a handler which does something, and
 *     2. that every navigation target names a route that exists.
 *
 *   Neither needs a renderer, and neither was caught by the type checker,
 *   because `router.push(x as any)` compiles and an empty arrow body is valid
 *   TypeScript. The client-layer tests below are real behavioural tests against
 *   an injected fetch.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { createApiClient, createMemoryStorage } from '../../packages/core/src/index';

const ROOT = process.cwd();
const MOBILE = path.resolve(ROOT, 'apps/mobile');
const BASE = 'https://api.test.local';

function read(relative: string): string {
  return fs.readFileSync(path.resolve(ROOT, relative), 'utf8');
}

/**
 * Read a source file with its comments removed.
 *
 * Every "this string must no longer appear" assertion below has to run against
 * code rather than prose, because the fixes are documented in place: the
 * comment explaining why `/(tabs)/explore` was wrong necessarily contains
 * `/(tabs)/explore`. Asserting on the raw text made six of these tests fail
 * against correct code, which is a test that punishes documentation.
 *
 * Block comments go entirely. Line comments go only when the line is nothing
 * but a comment, which leaves a URL such as `https://x` inside a string
 * literal intact.
 *
 * @param relative Repo-relative path.
 * @returns Source with comments stripped.
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

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
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

function client() {
  return createApiClient({ baseUrl: BASE, storage: createMemoryStorage() });
}

// ---------------------------------------------------------------------------
// Guideline 5.1.1(v): account deletion must be reachable in-app.
// ---------------------------------------------------------------------------

describe('guideline 5.1.1(v): in-app account deletion', () => {
  it('exposes account on the shared client', () => {
    // `createAccountResource` existed with a complete deletion flow while
    // `createApiClient` never called it, so no client could reach the
    // endpoints. That single omission was the blocker.
    const api = client();
    expect(api.account).toBeDefined();
    expect(typeof api.account.createDeletionIntent).toBe('function');
    expect(typeof api.account.confirmDeletion).toBe('function');
    expect(typeof api.account.summary).toBe('function');
    expect(typeof api.account.deletionStatus).toBe('function');
  });

  it('sends the password to deletion-intent and unwraps the receipt', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(201, {
        deletion: {
          receipt: 'rcpt_1',
          status: 'pending',
          requestedAt: '2026-09-10T10:00:00.000Z',
          eraseBy: '2026-10-10T10:00:00.000Z',
          completedAt: null,
          confirmationExpiresAt: '2026-09-10T10:15:00.000Z',
          retryable: true,
        },
      }),
    );

    const { data, error } = await client().account.createDeletionIntent('hunter2');

    expect(error).toBeFalsy();
    // Unwrapped from `{ deletion }`, not handed back as the envelope.
    expect(data?.receipt).toBe('rcpt_1');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/api/mvp/account/deletion-intent`);
    expect(JSON.parse(String(init.body))).toEqual({ password: 'hunter2' });
  });

  it('confirms with the exact literal the server demands', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(202, { accepted: true, deletion: {} }));

    await client().account.confirmDeletion('rcpt_1');

    const body = JSON.parse(String(fetchMock.mock.calls[0][1].body));
    // The service compares against 'DELETE' exactly and answers 400 otherwise.
    expect(body).toEqual({ receipt: 'rcpt_1', confirmation: 'DELETE' });
  });

  it('confirms anonymously, because the token is gone by then', async () => {
    const storage = createMemoryStorage();
    const api = createApiClient({ baseUrl: BASE, storage });
    fetchMock.mockResolvedValueOnce(jsonResponse(202, { accepted: true, deletion: {} }));

    await api.account.confirmDeletion('rcpt_1');

    const headers = new Headers(fetchMock.mock.calls[0][1].headers);
    expect(headers.get('Authorization')).toBeNull();
  });

  it('ships a settings screen that can actually reach deletion', () => {
    const screen = read('apps/mobile/app/settings/index.tsx');
    expect(screen).toContain('api.account.createDeletionIntent');
    expect(screen).toContain('api.account.confirmDeletion');
    // Signing out afterwards matters: the token names a user row that no
    // longer exists, so leaving it in storage strands the app on a dashboard
    // whose every query 401s.
    expect(screen).toContain('api.auth.signOut');
  });

  it('links to that screen from the signed-in dashboard', () => {
    // A screen nobody can navigate to does not satisfy the guideline.
    expect(read('apps/mobile/components/screens/DashboardScreen.tsx')).toContain(
      "router.push('/settings')",
    );
  });

  it('offers privacy and terms inside a signed-in session', () => {
    // These previously rendered only on the signup form, so a signed-in user
    // had no in-app route to either document.
    const screen = read('apps/mobile/app/settings/index.tsx');
    expect(screen).toContain('LEGAL_URLS.privacy');
    expect(screen).toContain('LEGAL_URLS.terms');
  });
});

// ---------------------------------------------------------------------------
// Guideline 2.1: no dead controls, no unmatched routes.
// ---------------------------------------------------------------------------

describe('guideline 2.1: every control does something', () => {
  /** Screens and components that ship as part of the running app. */
  const SOURCE_DIRS = ['apps/mobile/app', 'apps/mobile/components'];

  function walk(dir: string): string[] {
    const out: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) out.push(...walk(full));
      else if (/\.tsx?$/.test(entry.name)) out.push(full);
    }
    return out;
  }

  const files = SOURCE_DIRS.flatMap((d) => walk(path.resolve(ROOT, d)));

  it('finds no handler whose body is empty or a TODO', () => {
    // `onPress={() => {/* TODO */}}` compiles, renders, and does nothing. Three
    // of these shipped, one of them the primary button of the activities empty
    // state, which is the first screen a new event shows.
    const offenders: string[] = [];
    const empty = /on[A-Z]\w*=\{\s*\(\s*\)\s*=>\s*\{\s*(\/\*[\s\S]*?\*\/)?\s*\}\s*\}/g;

    for (const file of files) {
      const source = fs.readFileSync(file, 'utf8');
      for (const match of source.matchAll(empty)) {
        offenders.push(`${path.relative(ROOT, file)}: ${match[0].slice(0, 60)}`);
      }
    }

    expect(offenders, `empty handlers:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('routes every literal navigation target to a real screen', () => {
    // `/(tabs)/explore` and `/settings/profile` both pointed at nothing. The
    // second was cast to `any`, so typed routes could not report it.
    const routes = new Set<string>(['/']);
    const appDir = path.join(MOBILE, 'app');

    for (const file of walk(appDir)) {
      if (path.basename(file).startsWith('_layout')) continue;

      // "settings/index.tsx" -> "settings"; "discover.tsx" -> "discover".
      const rel = path
        .relative(appDir, file)
        .replace(/\.tsx?$/, '')
        .replace(/(^|\/)index$/, '');

      const withGroups = `/${rel}`.replace(/\/$/, '') || '/';
      // A group segment such as (tabs) is transparent in the URL, so both
      // "/(tabs)/partycrew" and "/partycrew" address the same screen.
      const bare = rel
        .split('/')
        .filter((segment) => segment.length > 0 && !/^\(.*\)$/.test(segment))
        .join('/');

      routes.add(withGroups);
      routes.add(`/${bare}`.replace(/\/$/, '') || '/');
    }

    const targets = new Set<string>();
    for (const file of files) {
      const source = fs.readFileSync(file, 'utf8');
      for (const match of source.matchAll(/router\.(?:push|replace)\(\s*'([^']+)'/g)) {
        targets.add(match[1].split('?')[0]);
      }
    }

    const unmatched = [...targets].filter((target) => {
      const stripped = target.replace(/\/\([^)]+\)/g, '') || '/';
      return !routes.has(target) && !routes.has(stripped);
    });

    expect(unmatched, `targets with no route file: ${unmatched.join(', ')}`).toEqual([]);
  });

  it('points Explore Creators at the discover screen', () => {
    const feed = readCode('apps/mobile/components/screens/PartyCrewFeedScreen.tsx');
    expect(feed).toContain("router.push('/discover')");
    expect(feed).not.toContain('/(tabs)/explore');
    expect(fs.existsSync(path.join(MOBILE, 'app/discover.tsx'))).toBe(true);
  });

  it('backs discover with the endpoint that exists', () => {
    // The Explore *tab* was removed because event discovery had no endpoint.
    // Creator discovery does: GET /api/users/suggested.
    expect(read('apps/mobile/app/discover.tsx')).toContain('api.users.suggested');
  });

  it('drops the edit-event stub rather than leaving it in a hidden header', () => {
    const screen = readCode('apps/mobile/app/events/[id]/index.tsx');
    expect(screen).not.toContain('headerRight');
    // The layout suppresses the header entirely, so the control could never
    // have rendered even had it been implemented.
    expect(read('apps/mobile/app/events/[id]/_layout.tsx')).toContain('headerShown: false');
  });
});

// ---------------------------------------------------------------------------
// Guideline 2.3.1: no fabricated metrics.
// ---------------------------------------------------------------------------

describe('guideline 2.3.1: the landing screen states nothing it cannot back', () => {
  const landing = () => readCode('apps/mobile/components/screens/LandingScreenEnhanced.tsx');

  it('carries no invented usage numbers', () => {
    const source = landing();
    for (const claim of ['10k+', '50k+', '4.9']) {
      expect(source, `fabricated metric still present: ${claim}`).not.toContain(claim);
    }
  });

  it('makes no claim about how many people use it', () => {
    expect(landing().toLowerCase()).not.toContain('join thousands');
  });

  it('does not hardcode a copyright year', () => {
    // It read "© 2025" while the repository clock said 2026.
    expect(landing()).not.toMatch(/©\s*20\d\d\s+PartyHause/);
    expect(landing()).toContain('getFullYear()');
  });
});

// ---------------------------------------------------------------------------
// First-run correctness: signup must not pretend to sign the user in.
// ---------------------------------------------------------------------------

describe('signup routes to confirmation, not into the app', () => {
  const auth = () => readCode('apps/mobile/components/screens/AuthScreen.tsx');

  it('never claims to be signing the user in', () => {
    // The old copy read "Account created. Signing you in..." and then dropped
    // the user on the marketing landing screen, because signup returns no
    // token by design.
    expect(auth()).not.toContain('Signing you in');
  });

  it('does not call onAuthSuccess on the signup path', () => {
    const source = auth();
    const start = source.indexOf('const performSignUp');
    const end = source.indexOf('const handleAuth');
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);

    const body = source.slice(start, end);
    expect(body, 'signup must not hand control to the signed-in shell').not.toContain(
      'onAuthSuccess',
    );
    // It should instead switch to the sign-in form with the resend panel open.
    expect(body).toContain('setIsLogin(true)');
    expect(body).toContain('setUnverifiedEmail(address)');
  });

  it('surfaces a failed verification send instead of reporting success', async () => {
    // 'unavailable' means the account exists but no mail left the building.
    // Telling the user to check their inbox would send them to an empty one.
    expect(auth()).toContain("verificationDelivery === 'unavailable'");
  });

  it('records the consent the user actually gave', () => {
    const source = auth();
    // Was a hardcoded `ageEligible: true`. The type is the literal `true`, so
    // the fix is a guard that narrows it, not a cast.
    expect(source).not.toMatch(/ageEligible:\s*true/);
    expect(source).toContain('if (!ageEligible || !legalAccepted)');
  });

  it('re-validates the session on focus, not only on mount', async () => {
    // Account deletion happens on a pushed screen while this one stays
    // mounted, so a mount-only check cannot observe the session ending.
    const shell = read('apps/mobile/app/(tabs)/index.tsx');
    expect(shell).toContain('useFocusEffect');
  });
});

// ---------------------------------------------------------------------------
// Defects found while closing the above.
// ---------------------------------------------------------------------------

describe('timeline writes reach the server in the shape it reads', () => {
  it('translates snake_case fields to the camelCase body the route destructures', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(201, { block: { id: 'b1' }, success: true }));

    await client().timeline.create({
      event_id: 'evt_1',
      label: 'Cake',
      start_time: '2026-09-10T18:30:00.000Z',
      duration: 30,
      type: 'activity',
    });

    const body = JSON.parse(String(fetchMock.mock.calls[0][1].body));
    // server/routes/timeline.ts:59-71 destructures these names. Sending
    // event_id/start_time left them undefined and the route answered 400
    // every time, for any input.
    expect(body).toEqual({
      eventId: 'evt_1',
      label: 'Cake',
      startTime: '2026-09-10T18:30:00.000Z',
      duration: 30,
      type: 'activity',
    });
  });

  it('omits keys the caller did not supply', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { block: { id: 'b1' }, success: true }));

    await client().timeline.update('b1', { label: 'Renamed' });

    const body = JSON.parse(String(fetchMock.mock.calls[0][1].body));
    // PUT treats undefined as "leave alone", so sending explicit nulls would
    // clear fields the caller never mentioned.
    expect(Object.keys(body)).toEqual(['label']);
  });

  it('unwraps the block from its envelope', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(201, { block: { id: 'b1', label: 'Cake' }, success: true }),
    );

    const { data } = await client().timeline.create({
      event_id: 'e',
      label: 'Cake',
      start_time: '10:00',
      duration: 30,
      type: 'activity',
    });

    // Was typed as the block but returned `{ block, success }`, so callers
    // received an object with no id and no error to report.
    expect(data).toEqual({ id: 'b1', label: 'Cake' });
  });
});

describe('the schedule has exactly one source of truth', () => {
  // `event-dto.test.ts` pins the decision that the `events.timeline_blocks`
  // JSON column reaches no client, host included, because it cannot express
  // `guest_visible` or `host_notes`. The activities screen read that column
  // anyway, so it received undefined and rendered "No Activities Scheduled" for
  // every event. The fix completes that migration rather than reversing it:
  // both the screen and the creation wizard now use /api/timeline, which is the
  // representation that carries visibility and filters per viewer.

  it('reads the schedule from /api/timeline, not from the event', () => {
    const screen = readCode('apps/mobile/app/events/[id]/activities.tsx');
    expect(screen).toContain('api.timeline.listForEvent');
    expect(screen).not.toContain('event.timeline_blocks');
    expect(screen).not.toContain('event?.timeline_blocks');
  });

  it('writes new activities to the same place it reads them from', () => {
    const screen = readCode('apps/mobile/app/events/[id]/activities.tsx');
    expect(screen).toContain('api.timeline.create');
    // Writing the JSON column would produce a block no client can ever read.
    expect(screen).not.toContain('timeline_blocks:');
  });

  it('has the creation wizard write there too', () => {
    // The wizard wrote the JSON column, so every schedule built during event
    // creation was invisible on the screen meant to display it.
    const wizard = readCode('apps/mobile/app/events/create/review.tsx');
    expect(wizard).toContain('api.timeline.create');
    expect(wizard).not.toContain('timeline_blocks:');
  });

  it('normalises the two start_time formats before rendering', () => {
    // The JSON column holds "HH:MM"; the table holds a DateTime that arrives
    // as ISO-8601. `formatTime` split on ':' and produced NaN:NaN for the
    // latter.
    const screen = readCode('apps/mobile/app/events/[id]/activities.tsx');
    expect(screen).toContain('toClockTime');
    expect(screen).toContain('formatTime(clock)');
  });
});

describe('profile editing has a destination', () => {
  it('removes the cast that hid the missing route', () => {
    const profile = readCode('apps/mobile/app/profile/[id].tsx');
    expect(profile).toContain("router.push('/settings/profile')");
    expect(profile).not.toContain("'/settings/profile' as any");
  });

  it('sends only changed fields and unwraps the profile envelope', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, { profile: { id: 'u1', display_name: 'Ada' } }),
    );

    const { data } = await client().users.updateProfile({ display_name: 'Ada' });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/api/users/me/profile`);
    expect(init.method).toBe('PUT');
    expect(JSON.parse(String(init.body))).toEqual({ display_name: 'Ada' });
    expect(data).toEqual({ id: 'u1', display_name: 'Ada' });
  });
});
