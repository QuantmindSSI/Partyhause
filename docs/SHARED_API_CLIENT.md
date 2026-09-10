# Shared API Client

Status: foundation complete and tested. Web and mobile migration outstanding.

`@partyhause/core` is the single HTTP client for both the Vite web app and the
Expo mobile app. This document records why it exists, how it is structured, the
decisions that are load-bearing, and the measured state of endpoint coverage.

All coverage figures here come from `scripts/audit-endpoints.cjs`, which walks
the TypeScript AST rather than grepping. Re-run it to refresh them.

---

## 1. Why this exists

Two independent audits produced the same conclusion from different directions.

**The endpoint audit.** An AST walk of `server/routes/*.ts` resolved against the
`app.use()` mounts in `server/index.ts` produced 72 concrete routes across 21
API families. Comparing that table to the two clients showed they were not one
product with two front ends. They were two unrelated integrations:

- web called 13 of 21 families, mobile called 5
- `/api/partycrew` and `/api/timeline` were called by mobile and not by web
- 10 families were called by web and not by mobile
- neither was a superset of the other

**The mobile audit.** `apps/mobile` was written against Supabase. Supabase was
removed from the project in July 2026, the web app moved to the Express API, and
mobile was never migrated. What remained was a stub in
`packages/core/src/supabase.ts` that 13 mobile files imported. It failed in two
distinct ways:

1. It exposed no `from()` method, so every `supabase.from(...)` call in those
   13 files threw at runtime.
2. Its session lookup read `localStorage`, guarded by
   `typeof localStorage !== 'undefined'`. React Native has no such global, so
   that guard was always false and `getSession()` unconditionally returned
   `{ session: null }`. Mobile could not hold a session, so every authenticated
   request went out unauthenticated.

`AuthScreen.tsx` called `client.auth.signInWithPassword(...)`, a method the stub
never implemented. Mobile had no sign-in path at all.

Duplicated configuration is why this survived so long. Nine mobile files each
carried their own copy of
`process.env.EXPO_PUBLIC_API_URL || 'https://www.partyhause.com'`, so fixing one
call site fixed nothing measurable.

---

## 2. Architecture

```
packages/core/src/
  http/adapters.ts           platform seams, STORAGE_KEYS, memory storage
  http/transport.ts          the request engine, no platform APIs
  http/storage-adapters.ts   createWebStorage(), createAsyncStorage()
  resources/auth.ts          sign in/up/out, me, reset, verify, persistence
  resources/index.ts         events, guests, timeline, polls, partycrew,
                             users, notifications, storage, email
  types.ts                   domain types checked against server/routes
  client.ts                  createApiClient(config)
  index.ts                   public surface
```

One engine, four injected seams. `transport.ts` touches only `fetch`,
`AbortController` and `URLSearchParams`, all of which exist in modern browsers
and in React Native's Hermes runtime. Everything platform-specific arrives
through configuration:

```ts
interface ApiClientConfig {
  baseUrl: string;
  storage: TokenStorage;
  telemetry?: Telemetry;
  onUnauthorized?: () => void | Promise<void>;
  timeoutMs?: number;
}
```

Construction differs only in the adapters:

```ts
// web
createApiClient({
  baseUrl,
  storage: createWebStorage(),
  telemetry: recordApiCall,
  onUnauthorized: redirectToLogin,
});

// mobile
createApiClient({
  baseUrl,
  storage: createAsyncStorage(AsyncStorage),
  onUnauthorized: () => router.replace('/'),
});
```

Call sites are then identical across platforms:

```ts
await api.auth.signIn(email, password);
await api.events.list();
await api.guests.update(id, { rsvp_status: 'accepted' });
```

---

## 3. Load-bearing decisions

### TokenStorage is asynchronous

React Native's AsyncStorage is promise-based; the DOM `Storage` interface is
synchronous. The contract is async, and the web adapter wraps its synchronous
storage in resolved promises.

This is the inverse of what the old stub did, and the inversion is the whole
bug. Making the narrower platform satisfy the wider contract yields one code
path. Assuming the synchronous API everywhere yields a client that silently
cannot authenticate on one of the two platforms.

### Retry is bounded and mutation-safe

At most two attempts, GET only, on network failure or 502/503/504, with a 600 ms
delay. Mutations are never retried, because a retried `POST /api/events` creates
the event twice. This satisfies Power of 10 rule 2: every loop has a provable
bound.

### A 401 clears both storage keys

Clearing only the token leaves a rehydrated Zustand store asserting the user is
signed in while every subsequent request fails, which traps the user in a loop.
The transport removes both `partyhause_auth_token` and `partyhause_auth_user`
before handing control to `onUnauthorized`, and still returns a normal error
result so no caller hangs.

### Failures never cascade

A throwing telemetry sink cannot fail a request. A throwing `onUnauthorized`
cannot mask the 401 from the caller. `signOut` clears the local session even
when the network call fails, so an offline user is never stranded in a
signed-in state. A corrupt cached user is deleted rather than thrown.

### The client is honest about what the server offers

There is deliberately no `partyboard` resource. The AST walk found seven web
call sites against `/api/partyboard/*` with no route, no router and no Prisma
model behind them. Adding a client method would manufacture a call that can
never succeed. Its absence converts a silent production 404 into a compile
error the moment web migrates.

---

## 4. Endpoint coverage, measured

Produced by `node scripts/audit-endpoints.cjs`. Server column derives from
`router.<verb>()` declarations resolved against `app.use()` mounts.

| API family | Server | Shared client | Web | Mobile |
|---|---|---|---|---|
| `/api/events` | yes | GET POST PUT DELETE | GET POST PUT DELETE | GET POST |
| `/api/guests` | yes | GET POST PUT DELETE | GET POST PUT DELETE | GET POST PATCH |
| `/api/timeline` | yes | GET POST PUT DELETE | none | POST |
| `/api/partycrew` | yes | GET POST DELETE | none | GET POST |
| `/api/polls` | yes | GET POST | GET POST | none |
| `/api/auth` | yes | GET POST | GET | none |
| `/api/notifications` | yes | GET POST | GET POST | none |
| `/api/storage` | yes | GET DELETE | GET | none |
| `/api/users` | yes | GET | GET PUT | none |
| `/api/send-email` | yes | POST | POST | POST |
| `/api/invites` | yes | none | GET | none |
| `/api/invite-templates` | yes | none | GET POST PUT DELETE | none |
| `/api/email-logs` | yes | none | GET POST PUT | none |
| `/api/realtime` | yes | none | GET | none |
| `/api/health` | yes | none | GET | none |
| `/api/ai` | yes | none | none | none |
| `/api/connections` | yes | none | none | none |
| `/api/cost-split` | yes | none | none | none |
| `/api/event-templates` | yes | none | none | none |
| `/api/feed` | yes | none | none | none |
| `/api/email-webhook` | yes | none | none | none |
| `/api/partyboard` | **none** | none | GET POST PATCH DELETE | none |

```
server families        21
shared client          10/21  47%
web                    13/21  61%
mobile                  5/21  23%

families the shared client calls with no server route:  none
families web calls with no server route:                /api/partyboard, /api/test
```

Two observations worth keeping.

**The shared client introduces no phantom endpoints.** Every path it declares
resolves to a real route. Web still carries two that do not.

**Six server families have no caller at all**: `ai`, `connections`,
`cost-split`, `event-templates`, `feed`, plus `email-webhook` which is correctly
uncalled because it is a provider callback. AI chat and cost splitting are
implemented server-side with no client. Each is maintained attack surface
returning nothing, and each should be either shipped or deleted before launch.

---

## 5. Corrections the client bakes in

**`guests.update` uses `PUT /api/guests/:id`.** Mobile issued
`PATCH /api/guests` with a query string. The server exposes no such route, so
every RSVP update from mobile returned 404. There is a regression test for this
specific path and verb.

**Endpoint resolution is centralised.** `apps/mobile/lib/api.ts` replaced nine
duplicated definitions of the same dead default. `www.partyhause.com` resolves
to a container app in an environment that no longer exists, and
`partyhause.netlify.app` was retired when Netlify deployment was discontinued.

---

## 6. Verification

19 behavioural tests in `src/test/core-api-client.test.ts`, all passing. They
target the failure modes above rather than the happy path:

- GET retries once on 503; a persistently failing GET stops at two attempts
- POST is never retried
- 401 clears both keys and invokes `onUnauthorized`
- a throwing `onUnauthorized` still returns the 401 to the caller
- errors normalise from `{error}`, `{message}`, plain text and empty bodies
- a throwing telemetry sink does not break the request
- the bearer token is read from async storage, and omitted on anonymous calls
- `signOut` clears locally even when the network fails
- a corrupt cached user is dropped rather than thrown
- query strings omit null and undefined parameters
- `guests.update` issues `PUT /api/guests/:id`

Full repository state at time of writing: 12 test files, 123 passing, 5 skipped.
Typecheck clean across all five projects. Web build clean.

---

## 7. Remaining work

1. **Mobile client instance** wiring `createAsyncStorage(AsyncStorage)`.
2. **Migrate 13 mobile files** off `supabase.from(...)` and `supabase.auth.*`.
   This is where mobile gains a working login for the first time.
3. ~~**Delete both stubs.**~~ Done. Both were replaced by `client.ts` in their
   respective packages. The web app's equivalent, `src/lib/supabase.ts`, was
   removed on 2026-09-08 and its surviving localStorage helpers now live in
   `src/lib/auth-storage.ts`; the fake database client it also exported is
   gone rather than renamed. There is no vendor SDK stub anywhere in the tree.
4. **Point `src/lib/api-client.ts` at core** and remove the duplicated
   transport, which is currently the only remaining copy of this logic.
5. **Extend resource coverage** to the six families web uses that core does not
   yet declare: `invites`, `invite-templates`, `email-logs`, `realtime`,
   `health`, and `users` PUT.
6. **Resolve `/api/partyboard`**: implement the server routes and Prisma model,
   or remove the feature. It is broken in production either way.

---

## 8. Running the audit

```sh
node scripts/audit-endpoints.cjs            # raw JSON
```

The script resolves `router.<verb>()` declarations against `app.use()` mounts,
folds template literals so `` `${base}/api/guests?eventId=${id}` `` reduces to
`/api/guests`, and follows the typed helpers (`apiGet`, `apiPost`, `apiPut`,
`apiDelete`, `apiUrl`, `request`) rather than raw `fetch` alone.

Worth wiring into CI. It would have caught the `/api/partyboard` breakage on the
day it was introduced.
