/**
 * The boundary of `party-planning-flow.spec.ts`, asserted rather than assumed.
 *
 * A flow test proves what the product does. It says nothing about what it does
 * not do, and the gap between those two is where this repository has
 * repeatedly lost time: a card that reported a count and did nothing when
 * tapped, a dashboard of zeros for a marketplace nobody had built, a canvas
 * posting to a router that was never written. Each read as a loading bug for
 * months because nothing recorded that the surface was absent on purpose.
 *
 * So the omissions are written down here as executable claims. Two kinds:
 *
 *   1. Endpoints that do not exist. If one starts answering, the flow test is
 *      no longer complete and somebody has to extend it. That is the point:
 *      this file fails on the commit that builds the feature, not six months
 *      later.
 *
 *   2. Endpoints that exist and have no interface. Those are not bugs in the
 *      API and cannot be found by calling it; only a test that knows the UI is
 *      missing can hold the fact.
 *
 * Nothing here is a wish list. Every assertion was checked against the deployed
 * API on 2026-09-10 before it was written.
 *
 * These are independent single-request checks, so unlike the planning flow they
 * carry no shared state and do not need `describe.serial`.
 */

import { expect, test } from '@playwright/test';

import { API_BASE, createVerifiedUser, emailFor, seedSession } from './support';

/**
 * Routers that are not mounted.
 *
 * `server/index.ts` mounts 26 routers and neither of these is among them, so
 * both fall through to the `/api` 404 handler. The Prisma schema does define
 * `Vendor`, `VendorTask` and `Media`, which is exactly why this needs stating:
 * the models exist, so a reader who greps the schema concludes the feature
 * does too.
 */
const UNMOUNTED = ['/api/vendors', '/api/media'] as const;

/**
 * Routers that answer but that no web interface reaches.
 *
 * Unauthenticated they return 401, which is the discriminator used below: 401
 * means mounted and guarded, 404 means absent. `cost-split` has full CRUD and
 * no UI on either client. `timeline` is bypassed deliberately and
 * `src/lib/timeline.ts:17` explains why.
 */
const MOUNTED_WITHOUT_UI = [
  { path: '/api/cost-split/00000000-0000-0000-0000-000000000000', name: 'cost-split' },
  { path: '/api/timeline/00000000-0000-0000-0000-000000000000', name: 'timeline' },
] as const;

test.describe('surfaces the planning flow deliberately does not cover', () => {
  for (const path of UNMOUNTED) {
    test(`${path} is not mounted, so no flow step can exercise it`, async ({ request }) => {
      const response = await request.get(`${API_BASE}${path}`);

      expect(
        response.status(),
        `${path} now answers ${response.status()}. If this router was just built, `
          + 'party-planning-flow.spec.ts needs a step for it and this assertion should go.',
      ).toBe(404);

      // Assert the body too. A 404 from the API's own handler and a 404 from
      // the SPA fallback are the same status and mean opposite things: one is
      // "no such endpoint", the other is "your asset request was answered with
      // index.html", which is the class of defect that shipped once already.
      expect(await response.json()).toEqual({ error: 'Not found' });
    });
  }

  for (const { path, name } of MOUNTED_WITHOUT_UI) {
    test(`${name} is mounted and guarded, but has no interface to drive`, async ({ request }) => {
      const response = await request.get(`${API_BASE}${path}`);

      // 401 rather than 404 is the whole assertion: it separates "the API is
      // missing" from "the API is there and nothing calls it". The second is a
      // UI gap, and no amount of browser testing will surface it, because
      // there is no control to click.
      expect(
        response.status(),
        `${name} answered ${response.status()}, expected 401. `
          + 'If it is now 404 the router was removed; if 200, the auth guard was.',
      ).toBe(401);
    });
  }

  test('the vendor dashboard says the marketplace is unbuilt instead of showing zeros', async ({
    page,
    request,
  }) => {
    // The counterexample this whole file exists for. This page used to render
    // a revenue figure of $0 and an empty booking list, which is
    // indistinguishable from a marketplace that exists and has no data. It now
    // states the position, and that copy is load-bearing: it is the difference
    // between "nobody booked you" and "there is nothing to book".
    //
    // Reached by seeding a vendor session and loading `/`, not by visiting a
    // path. There is no `/vendor-dashboard` route: React Router owns eight
    // paths in `src/App.tsx` and this is not one of them. The page lives in
    // the `currentPage` state machine behind `path="*"`, behind
    // `RoleGuard allowedRoles={['vendor']}`, and is also what the role
    // dispatch at `src/App.tsx:236` renders for a vendor. Navigating to a URL
    // would land on the attendee dashboard and the test would fail for a
    // reason that has nothing to do with vendors.
    const email = emailFor('vendor');
    const session = await createVerifiedUser(request, email, 'vendor-pw-8891', 'Vee Vendor');
    await seedSession(page, session, 'vendor');

    await page.goto('/');

    await expect(page.getByText(/marketplace is still being built/i)).toBeVisible({
      timeout: 20_000,
    });

    // And it must not have quietly regained a dashboard of zeros. Scoped to
    // the main region so a currency figure in unrelated chrome cannot fail it.
    await expect(page.getByRole('main').getByText(/\$\s?0(\.00)?\b/)).toHaveCount(0);
  });
});
