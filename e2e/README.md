# Browser end-to-end suite

Drives the web app through a real Chromium against a real API and a real
PostgreSQL database. This is the only suite in the repository that does that.
`src/test/` runs under jsdom with no database, so it cannot see a session that
is valid but renders as signed out, an invitation that sends but cannot be
answered, or a role that gates a control nobody can reach.

**This suite writes to whatever database you point it at.** Use a scratch one.

## What runs it

Nothing starts the servers for you. `playwright.config.ts` deliberately has no
`webServer` block, because the API needs a database, a JWT secret and an
invitation secret, and starting it from a test config would hide the fact that
these tests are writing rows somewhere.

Three terminals.

```bash
# 1. A scratch database, migrated.
createdb partyhause_e2e
export DATABASE_URL="postgresql://$USER@localhost:5432/partyhause_e2e?schema=public"
npx prisma migrate deploy
```

The connection string needs an explicit username. Omitting it makes Prisma
answer `P1010: User was denied access`, which reads like a permissions problem
and is not one.

```bash
# 2. The API, with its log on disk. NODE_ENV=test is required, see below.
NODE_ENV=test \
DATABASE_URL="postgresql://$USER@localhost:5432/partyhause_e2e?schema=public" \
JWT_SECRET="e2e-jwt-secret-at-least-32-characters-long" \
INVITATION_TOKEN_SECRET="e2e-invitation-secret-not-the-jwt-one-32ch" \
npx tsx server/index.ts 2>&1 | tee /tmp/e2e-api.log
```

```bash
# 3. The web app, and the suite.
npm run dev            # :5173, proxies /api to :3001
npm run test:e2e
```

`npm run test:e2e:headed` runs the same thing with a visible browser, which is
the faster way to understand a failure than reading a trace.

## Why NODE_ENV=test, and why a log file

There is no mail provider in local development, so there is no inbox to read a
verification link out of. `server/routes/auth.ts` prints those links to stdout
when `NODE_ENV` is not `production`, and `e2e/support.ts` reads them back out
of the log. That is the same mechanism the database-backed scripts in
`scripts/e2e-*.mjs` already use.

`NODE_ENV=test` rather than `development` matters for a second reason:
`server/dev-api.ts` sets `AUTH_BYPASS=true`, which admits unauthenticated
requests as a synthetic dev user. Every authorization assertion in this suite
would then pass for the wrong reason. Start `server/index.ts` directly, as
above, not `npm run dev:api`.

The log path defaults to `/tmp/e2e-api.log` and is overridable with
`E2E_API_LOG`. If a test fails with *"No verify-email link for ... in
/tmp/e2e-api.log"*, the API was almost certainly started without `NODE_ENV=test`
or without `tee`.

## Environment

| Variable | Default | Purpose |
|---|---|---|
| `E2E_BASE_URL` | `http://localhost:5173` | Where the web app is served |
| `E2E_API_URL` | `http://localhost:3001` | Where the API answers |
| `E2E_API_LOG` | `/tmp/e2e-api.log` | File the API's stdout is tee'd to |

## The files

| File | What it is |
|---|---|
| `party-planning-flow.spec.ts` | The host's journey, ten steps, `describe.serial` |
| `unbuilt-surfaces.spec.ts` | What the flow deliberately does not cover, asserted as absent |
| `support.ts` | Session seeding, consent constants, log scraping |
| `discover.mjs` | Not a test. Prints the accessible controls on a route |

`discover.mjs` exists so selectors are derived from the running UI instead of
guessed:

```bash
node e2e/discover.mjs / /dashboard
```

That is the difference between a test that exercises the app and one that fails
on a class name nobody changed.

## Why the flow is serial

`party-planning-flow.spec.ts` is one continuous story: an account is created,
confirmed, signs in, becomes a creator, drafts an event with the AI planner,
creates it, invites a committee member who answers from a second anonymous
browser, and the committee deliberates on the partyboard. Each step depends on
the one above.

`workers: 1` and `fullyParallel: false` follow from that, and so does
`describe.serial`: the suite stops at the first break rather than reporting
eight failures with one cause. `retries: 0` is deliberate too. A retry on a
stateful story reruns a step whose preconditions were consumed by the previous
attempt, which turns a real failure into a confusing one.

## It is not in `npm run test:run`

`vitest.config.ts` sets `include: ['src/**/*.{test,spec}.{ts,tsx}']` and
excludes `e2e/**`. Without that, vitest's default `include` swallows
`e2e/*.spec.ts` and fails to collect it with *"Playwright Test did not expect
test.describe() to be called here"*, which turns `npm run test:run` red without
a single assertion having failed.

CI does not run this suite. It needs a database and two servers, and the
billing lock on GitHub Actions means CI currently runs nothing at all. Run it
by hand before a release, and after any change to auth, invitations or the
partyboard.

## Artifacts

Failures leave a trace, a screenshot and an `error-context.md` in
`e2e/.artifacts/`. Open a trace with:

```bash
npx playwright show-trace e2e/.artifacts/<dir>/trace.zip
```

`.artifacts/` is generated output. It should not be committed.
