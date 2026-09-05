# AGENTS.md

Engineering source of truth for PartyHause. Written for AI agents and humans working in this
repository.

Every claim below was verified by reading the code on 2026-09-04, not by trusting prior
documentation. Where the codebase is ambiguous or contradicts itself, that is stated rather than
smoothed over. If this file disagrees with any other document in the repository, this file wins.
See [Documentation map](#documentation-map) for why that rule exists.

`README.md` is the product front door and is written for a non-engineering audience. It is not an
engineering reference.

---

## Stack

| Layer | Technology | Location |
|---|---|---|
| Web | React 18.3.1, TypeScript 5.9.3, Vite 7.1.9, `vite-plugin-pwa` | `src/` |
| UI | Tailwind CSS 3, shadcn/ui on Radix, framer-motion | `src/components/` |
| Web state | Zustand 4 (one persisted store) plus TanStack Query v4 | `src/store/usePartyStore.ts` |
| API | Express 4.22.1, run directly with `tsx`, no compile step | `server/` |
| ORM | Prisma 7.10.0 with the `@prisma/adapter-pg` driver adapter | `prisma/`, `server/lib/prisma.ts` |
| Database | PostgreSQL 15, Azure Flexible Server | `prisma/schema.prisma` |
| Auth | Self-hosted JWT, HS256, bcryptjs cost 12 | `server/routes/auth.ts`, `server/middleware/auth.ts` |
| Realtime | Azure Web PubSub over native WebSocket | `server/lib/pubsub.ts`, `src/hooks/use-realtime.ts` |
| Storage | Azure Blob Storage, server-side upload via multer | `server/routes/storage.ts` |
| Email | Azure Communication Services primary, Resend fallback | `server/lib/email.ts` |
| Mobile | Expo SDK 54, React Native 0.81, expo-router 6 | `apps/mobile/` |
| Shared client | TypeScript API client, shipped as raw `.ts` | `packages/core/` |
| Infra | Bicep, subscription scope, to Azure Container Apps | `infra/` |

### Two corrections to long-standing claims

**Supabase is gone.** `@supabase/supabase-js` is absent from every `package.json`, absent from both
lockfiles, and not installed in `node_modules`. Documentation describing Supabase as live or
"transitional" is wrong. `src/lib/supabase.ts` survives as a hand-written localStorage token store
that kept the module name; it contains no SDK and its database methods throw. Renaming it is
outstanding cleanup, not a migration.

**Realtime is a native `WebSocket`, not socket.io.** `src/hooks/use-realtime.ts:163` constructs
`new WebSocket(url, 'json.webpubsub.azure.v1')`. `socket.io-client` is not a dependency.

### Version hazards

- **Node is specified three ways.** `package.json:7` says `>=18.0.0`, `.nvmrc` and `.node-version`
  pin `18.18.0`, and both workflows plus both Dockerfiles use Node 20. Node 20 is what actually
  builds and runs.
- **React majors diverge across the workspace.** Web is React 18.3.1, mobile is React 19.1.0.
- **The mobile lockfile does not satisfy its manifest.** `expo` is declared `~54.0.35` and locked at
  `54.0.13`; `react-native` declared `^0.81.5`, locked `0.81.4`; `expo-router` declared `~6.0.24`,
  locked `6.0.12`.
- **`npm run test:ui` cannot work.** `@vitest/ui` is not in `devDependencies`.

---

## Repository layout

npm workspaces are `apps/*` and `packages/*` (`package.json:10-13`).

| Path | Contents |
|---|---|
| `src/` | Vite React PWA. `App.tsx`, `pages/` (11), `features/` (partyboard, partycrew, polls, timeline, notifications), `components/`, `lib/`, `store/`, `test/` |
| `server/` | Express API. `index.ts` entrypoint, `routes/` (19 files), `lib/` (7), `middleware/auth.ts` |
| `packages/core/` | Shared API client and zustand store. Ships raw TypeScript; `main` points at `src/index.ts` |
| `apps/mobile/` | Expo Router app. Own lockfile, `app.config.ts`, `eas.json`, `ios/` |
| `prisma/` | `schema.prisma` (1144 lines, 36 models) and `seed.ts` |
| `infra/` | Bicep. `main.bicep` (subscription scope), `resources.bicep`, `modules/` (5) |
| `scripts/` | 28 operational scripts, mixed languages. Four are wired to npm scripts; the rest are ad hoc |
| `docs/` | 88 markdown files, all current, historical or non-technical. 97 stale ones were deleted on 2026-09-04. Index at [`docs/README.md`](./docs/README.md) |

**`packages/core` is consumed by mobile only.** `rg "@partyhause/core" src/` returns nothing. The
web app runs a separate client at `src/lib/api-client.ts`. This is a real cost: the same contract
bug has to be fixed in both places, and has been, more than once. Treat any change to an API
contract as a two-site change until the clients are unified.

---

## Local development

```bash
# 1. Install. Peer-dependency conflicts are expected and the flag is required.
npm ci --legacy-peer-deps

# 2. Generate the Prisma client. Both CI workflows do this before anything else.
npx prisma generate

# 3. Apply the schema to a local Postgres.
DATABASE_URL="postgresql://localhost:5432/partyhause" npx prisma db push
DATABASE_URL="postgresql://localhost:5432/partyhause" npx tsx prisma/seed.ts

# 4. Start the API on 3001. dev-api.ts sets AUTH_BYPASS=true for local work.
npm run dev:api

# 5. In another terminal, start the web app on 5173. It proxies /api to 3001.
npm run dev

# 6. Verify.
curl localhost:3001/api/health
```

`AUTH_BYPASS` only works when `NODE_ENV !== 'production'`, and both conditions are required
(`server/middleware/auth.ts:23-25`). It upserts a real user row, `dev@partyhause.local`, so local
data is attributable. A valid real token always beats the bypass.

### Commands

| Command | What it does | Used by |
|---|---|---|
| `npm run dev` | Vite dev server, port 5173 | |
| `npm run dev:api` | API with watch and `AUTH_BYPASS=true` | |
| `npm run build:web` | `vite build` | Dockerfile |
| `npm run typecheck` | Five `tsc` projects: app, node, server, core, mobile | via `build:check` |
| `npm run build:check` | `typecheck` then `audit:contracts` then `vite build` | **CI and deploy** |
| `npm run lint` | `eslint .` | **CI and deploy** |
| `npm run test:run` | `vitest run` | **CI and deploy** |
| `npm run audit:contracts` | Compares client call shapes to server route expectations | via `build:check` |
| `npm run audit:endpoints` | Endpoint inventory | not wired to CI |
| `npm run server` | API without watch or bypass | |

`build:check` is the real gate. Note that `vite build` does not typecheck, so a type error will
still produce a working bundle if you bypass `build:check`.

---

## API surface

Base URL in production is the API Container App FQDN. All routes are under `/api`.

`server/index.ts` mounts 19 routers (`:174-192`) behind `apiLimiter` (`:173`), plus four inline
endpoints registered **before** the limiter and therefore not covered by it: `GET /api/health`
(`:129`), `POST /api/send-email` (`:143`), and the favicon and SPA fallback when `dist/` exists.

62 routes across 19 files.

| Router | Routes |
|---|---|
| `/api/auth` | `POST /signup`, `POST /verify-email`, `POST /resend-verification`, `POST /login`, `GET /me`, `POST /forgot-password`, `POST /reset-password`, `POST /logout` |
| `/api/events` | `GET /:id?`, `POST /`, `PUT /:id`, `DELETE /:id` |
| `/api/guests` | `GET /`, `POST /`, `PUT /:id`, `DELETE /:id` |
| `/api/timeline` | `GET /:eventId`, `POST /`, `PUT /:id`, `DELETE /:id` |
| `/api/polls` | `GET /`, `POST /`, `GET /:id`, `POST /:id/vote`, `POST /:id/close` |
| `/api/invite-templates` | `GET /`, `POST /`, `PUT /:id`, `DELETE /:id` |
| `/api/event-templates` | `GET /`, `GET /:id`, `POST /:id/create-event` |
| `/api/email-webhook` | `POST /` (anonymous, svix HMAC verified) |
| `/api/email-logs` | `POST /`, `PUT /:id`, `GET /`, `GET /:id`, `GET /analytics/event` |
| `/api/connections` | `GET /`, `POST /`, `DELETE /:id` |
| `/api/partycrew` | `GET /members`, `GET /crewing-with`, `GET /toggle`, `POST /toggle`, `GET /requests`, `POST /requests`, `DELETE /requests` |
| `/api/users` | `GET /me/profile`, `PUT /me/profile`, `GET /suggested`, `GET /:id` |
| `/api/feed` | `GET /crew`, `POST /seen` |
| `/api/invites` | `POST /generate`, `POST /join`, `POST /convert-guest` |
| `/api/cost-split` | `GET /:eventId`, `POST /`, `PUT /:id`, `DELETE /:id` |
| `/api/ai` | `POST /chat`, `POST /extract-event-details` |
| `/api/storage` | `POST /upload`, `DELETE /:blobName`, `GET /url/:blobName` |
| `/api/realtime` | `GET /negotiate` |
| `/api/notifications` | `GET /`, `GET /unread-count`, `POST /mark-read` |

### Known API defects

- **`GET /api/email-logs/analytics/event` is unreachable.** `GET /:id` is registered at
  `email-logs.ts:149`, before the analytics route at `:177`. Express matches in registration order,
  so the request binds `id="analytics"` and never arrives.
- **`POST /api/send-email` is anonymous, accepts arbitrary recipients and HTML, and bypasses the
  rate limiter.** This is `GAP-INV-04` in the iOS register and is a live abuse vector.
- **The global error handler returns `err?.message` to the client** in 500 bodies
  (`server/index.ts:218`).
- **`optionalAuth` does not enforce `email_verified`**, unlike `requireAuth`.
- **Empty `CORS_ALLOWED_ORIGINS` allows all origins** (`server/index.ts:100-102`).

---

## Auth

Self-hosted. No Supabase, no working Entra path.

**Issuance.** `jsonwebtoken` HS256. Claims are `{ sub, email, name, email_verified }`
(`routes/auth.ts:71-75`). Lifetime from `JWT_EXPIRES_IN`, default `7d`. Secret from
`server/lib/jwt-secret.ts`, which in production throws if the secret is empty, equals the committed
dev fallback, or is shorter than 32 characters. `assertJwtSecretConfigured()` runs before
`app.listen` and exits 1 on failure.

**Verification.** `jwt.verify` in `middleware/auth.ts:104`. No explicit `algorithms` allowlist is
passed; jsonwebtoken 9 rejects `alg: none` by default, but the allowlist should be explicit.

**Passwords.** bcryptjs cost 12 for passwords, cost 10 for verification and reset tokens. Minimum
length 8, no complexity rule.

**Email verification is enforced at three points**, and all three are required:

1. Signup returns no token at all (`routes/auth.ts:234-241`).
2. Login rejects unconfirmed accounts with **403 `EMAIL_NOT_VERIFIED`**, deliberately distinct from
   the 401 for bad credentials, so the client can offer a resend instead of a password reset.
3. `requireAuth` rejects any token whose `email_verified` claim is not `true`, which catches tokens
   minted before the gate existed. Tokens last 7 days and cannot be revoked, so gating login alone
   would have left a week-long hole.

`POST /api/auth/resend-verification` is **anonymous by design**. A user who cannot sign in has no
session, so putting it behind `requireAuth` made it the one endpoint a locked-out user needed and
could not reach. It answers identically whether or not the address exists.

**Rate limits.** `apiLimiter` 300 per 60s on `/api/*`. `credentialLimiter` 20 per 15 minutes on
every auth route except `/me` and `/logout`. `aiLimiter` 30 per 5 minutes, keyed on user id when
present.

**Entra External ID is bundled but inert, and would break auth if switched on.**
`isMsalConfigured` is `false` unless three `VITE_ENTRA_*` build args are set. Two things are
missing: `msalGetToken()` has zero call sites while `src/lib/api-client.ts` reads its bearer token
from localStorage, which MSAL never writes; and the API has no JWKS, issuer or audience validation
anywhere, so it cannot verify an Entra RS256 token. **Do not set `ENTRA_TENANT_ID` or
`ENTRA_SPA_CLIENT_ID` in the deploy workflow** until both are built.

---

## Data model

36 Prisma models and 2 enums in `prisma/schema.prisma`. Core entities: `User`, `UserProfile`,
`Event`, `EventCoHost`, `Guest`, `Ticket`, `TimelineBlock`, `Poll`, `PollOption`, `PollVote`,
`Connection`, `ConnectionRequest`, `PartycrewPost`, `Notification`, `EmailLog`, `EmailEvent`,
`Template`, `InviteTemplate`, `EventInviteToken`, `CostSplitRequest`, `Media`, `Vendor`,
`VendorTask`.

`Vendor` and `VendorTask` exist in the schema but **have no API routes and no UI**. The vendor
marketplace is not built.

The datasource declares no `url` (Prisma 7 requirement); it is supplied by `prisma.config.ts` from
`DATABASE_URL`. `server/lib/prisma.ts` falls back to assembling a connection string from
`POSTGRES_*` parts with `sslmode=require` if `DATABASE_URL` fails to parse.

**There is no `prisma/migrations/` directory** despite `prisma.config.ts:25` pointing at one. The
schema is applied with `prisma db push`, so there is no migration history.

```bash
npx prisma generate
DATABASE_URL="postgresql://..." npx prisma db push
DATABASE_URL="postgresql://..." npx tsx prisma/seed.ts
DATABASE_URL="postgresql://..." npx prisma studio
```

---

## Realtime, storage, email

**Realtime.** `GET /api/realtime/negotiate` (requires auth) returns a Web PubSub client URL with a
60 minute token. The browser opens a native `WebSocket` with the `json.webpubsub.azure.v1`
subprotocol. The server broadcasts `{ event, data }` envelopes via `sendToAll`. Hub name is
`WEBPUBSUB_HUB` or `partyhause`, and negotiate and broadcast must agree or clients listen to a hub
nothing publishes to. Negotiate returns 503 when `WEBPUBSUB_CONNECTION_STRING` is unset; the client
falls back to polling.

**Storage.** Uploads go through the API, not direct to blob. multer memory storage, 5 MB cap,
MIME allowlist of jpeg, png, webp, gif. Container `event-invites` has public blob read; `uploads`
does not.

**Email.** `server/lib/email.ts` prefers Azure Communication Services and falls back to Resend.
Delivery events arrive at `POST /api/email-webhook`, verified by svix HMAC-SHA256 over
`${svix-id}.${svix-timestamp}.${rawBody}` with a 300 second replay window, and are recorded in
`email_logs` and `email_events`.

---

## Environment variables

**The `VITE_*` and `EXPO_PUBLIC_*` split matters.** Both are inlined into the bundle at build time.
Setting them as runtime environment variables on a container does nothing, because the web
container is nginx serving static files and reads no environment at all.

### Build time, web (passed as `--build-arg` to `az acr build`)

`VITE_API_URL`, `VITE_ENTRA_TENANT_ID`, `VITE_ENTRA_SPA_CLIENT_ID`, `VITE_ENTRA_POLICY`.

`VITE_APP_NAME` and `VITE_APP_URL` are passed as build args but **are not read by anything in
`src/`**. `VITE_APP_URL` is read server-side only, where it is a runtime variable on the API
container and forms the base of emailed links.

### Runtime, API container

`PORT`, `NODE_ENV`, `CORS_ALLOWED_ORIGINS`, `DATABASE_URL`, `POSTGRES_*`, `JWT_SECRET`,
`JWT_EXPIRES_IN`, `VITE_APP_URL`, `ACS_CONNECTION_STRING`, `ACS_SENDER_ADDRESS`, `RESEND_API_KEY`,
`RESEND_FROM_EMAIL`, `RESEND_WEBHOOK_SECRET`, `WEBPUBSUB_CONNECTION_STRING`, `WEBPUBSUB_HUB`,
`AZURE_STORAGE_*`, `AZURE_OPENAI_*`, `OPENAI_API_KEY`, `AUTH_BYPASS`, `AUTH_BYPASS_USER_ID`.

Secrets are provisioned by Bicep into the Container App `secrets` array and referenced with
`secretref:`. The deploy workflow deliberately passes no environment variables, leaving Bicep as
the single source of truth.

---

## Infrastructure

`infra/main.bicep` is **subscription scoped** and creates the resource group itself, so it needs
`az deployment sub create`, not `--resource-group`.

```bash
az deployment sub create \
  --location eastus2 \
  --template-file infra/main.bicep \
  --parameters infra/main.parameters.json \
  --parameters postgresAdminPassword="<pw>" \
  --parameters RESEND_API_KEY="<key>" \
  --parameters entraApiClientSecret="<secret>" \
  --parameters deployerObjectId="<object-id>"
```

### Production resources

| Resource | Name |
|---|---|
| Resource group | `rg-partyhause-prod` |
| ACR | `acrpartyhausegipkzrenusqpy` |
| Web app | `ca-web-partyhause-gipkzrenusqpy` |
| API app | `ca-api-partyhause-gipkzrenusqpy` |
| Postgres | `psqlph-gipkzrenusqpy` (note the hyphen), in **centralus**, not eastus2 |
| Storage | `stphgipkzrenusqpy` |
| Web PubSub | `wps-partyhause-gipkzrenusqpy` |
| Key Vault | `kvphgipkzrenusqpy` |
| Container Apps env | `cae-partyhause-gipkzrenusqpy` |

Both container apps run 0.5 vCPU, 1.0 GiB, `minReplicas: 1`, `maxReplicas: 3`.

**`minReplicas` must stay in the template.** It was previously hardcoded to 0 in
`infra/modules/container-app.bicep`, fixed to 1 imperatively with `az containerapp update`, and
then silently reset to 0 by the next `az deployment sub create`. Measured effect of the regression
was 21 seconds to first byte on both tiers. It is now a parameter defaulting to 1. Never fix scale
settings on the live app alone.

### Infra hazards

- **AcrPull role assignment is off by default.** `manageAcrPullAssignment` defaults `false` and
  neither app passes `true`, so a fresh environment will not be able to pull images without setting
  it explicitly.
- **No health probes are defined**, despite the module comment claiming otherwise.
- **Storage allows public blob access** and `event-invites` is publicly readable.
- Key Vault uses access policies, not RBAC, and the policy is skipped entirely when
  `deployerObjectId` is empty. The vault is currently empty; secrets live on the Container App.

---

## CI/CD

Two workflows in `.github/workflows/`.

- **`ci.yml`** runs on PRs and non-main pushes: prisma generate, lint, `build:check`, `test:run`.
  Does not deploy.
- **`deploy.yml`** runs on push to `main`: the same gates, then optional Bicep provisioning, then
  `az acr build` for both images and a Container App revision update per tier. Images are tagged
  `:latest` and `:<git-sha>`; the apps are moved to the SHA tag so a deployment traces to a commit.

**GitHub Actions is currently billing-locked.** Every run since 2026-09-03T00:23 has failed with
*"The job was not started because your account is locked due to a billing issue"*, in 0 to 9
seconds, without compiling anything. The last green deploy was 2026-08-31. Until it is lifted,
deploys are manual:

```bash
SHA=$(git rev-parse HEAD)

az acr build --registry acrpartyhausegipkzrenusqpy \
  --image partyhause-api:latest --image partyhause-api:$SHA \
  --file Dockerfile.api .

az acr build --registry acrpartyhausegipkzrenusqpy \
  --image partyhause-web:latest --image partyhause-web:$SHA \
  --file Dockerfile \
  --build-arg VITE_API_URL="https://ca-api-partyhause-gipkzrenusqpy.calmtree-5b646dc8.eastus2.azurecontainerapps.io" \
  --build-arg VITE_APP_NAME="PartyHause" \
  --build-arg VITE_APP_URL="https://partyhause.com" .

az containerapp update -n ca-web-partyhause-gipkzrenusqpy -g rg-partyhause-prod \
  --image acrpartyhausegipkzrenusqpy.azurecr.io/partyhause-web:$SHA
az containerapp update -n ca-api-partyhause-gipkzrenusqpy -g rg-partyhause-prod \
  --image acrpartyhausegipkzrenusqpy.azurecr.io/partyhause-api:$SHA
```

Deploy the **web first, then the API**, so the window between them leaves the verification gate off
rather than half-enforced. Omit the `VITE_ENTRA_*` build args, for the reason given under Auth.

### Serving rules the nginx config encodes

`nginx.conf` is the web container's config, copied in by the Dockerfile and validated by
`RUN nginx -t` at build time. It exists because the previous six-line inline config set no
`Cache-Control` on anything, which left every URL to heuristic browser caching and stranded service
worker clients on a stale precache. Fingerprinted assets are immutable for a year; `sw.js`,
`registerSW.js`, `index.html` and the manifest are `no-cache`; every file-serving location ends in
`=404` so a missing asset cannot be disguised as a 200 of `index.html`.

**`public/` must stay in the Docker build context.** It was excluded by `.dockerignore` for the
entire life of the Azure stack, so every icon, `robots.txt`, `privacy.html`, `terms.html` and
`support.html` returned `index.html` instead. A test in `src/test/bundle-chunk-graph.test.ts`
asserts `.dockerignore` does not re-exclude it.

---

## Testing

15 files in `src/test/`, 155 passing and 5 skipped. Vitest with jsdom.

Notable suites: `bundle-chunk-graph.test.ts` guards the emitted Rollup chunk graph against import
cycles, which once shipped a white screen that returned HTTP 200, and asserts PWA manifest icons
resolve to real correctly-sized PNGs. `email-verification-gate.test.ts` covers the three auth
gates. `core-api-client.test.ts` covers transport retry bounds and 401 handling.

The skipped 5 are live email E2E tests requiring a running API.

---

## Known gaps and hazards

Ranked by consequence.

1. **68 blocking items for iOS launch.** `docs/mobile-ios-launch/08-current-state-gap-register.md`
   records 93 gaps, 68 marked BLOCKER, each with file:line evidence. It is current and trustworthy.
2. **Six mobile event-template forms are 27-line stubs** that call `onValidation(true)` with an
   empty payload, so the create wizard advances past them collecting nothing.
3. **About 2,900 lines of mobile components have no reachable route**, including the entire
   `PartyCrewFeedScreen`.
4. **Two HTTP clients**, described under Repository layout.
5. **Web routing is split** between React Router, which owns 8 paths, and a `currentPage` string
   state machine handling 33 keys behind `path="*"`. The state type ends in `| string`, so the
   literal set is not enforced. Eleven handled keys are never set by any call site.
6. **537 lint warnings**, mostly `no-explicit-any`.
7. **`build.target` is `esnext`**, so nothing is downlevelled. `Object.hasOwn` (Safari 15.4+) is
   already present in two eagerly loaded chunks.
8. **`eas.json` submit config contains literal placeholders**: `REPLACE_WITH_APP_STORE_CONNECT_APP_ID`
   and `your-apple-id@example.com`. Store submission is not configured.
9. **`Dockerfile:26` mutates `tsconfig.json`** during the web build, so the image build differs from
   a local `npm run build:web`.
10. **`src/lib/env-server.ts` is orphaned**: Node `process.env` inside the client tree, no importers.
11. **`app.set('trust proxy', 1)` is called twice** in `server/index.ts`.

---

## Documentation map

All 187 markdown files were audited against the code on 2026-09-04 and **97 were deleted**: 79 that
presented Supabase, Netlify or Vercel as live infrastructure, and 18 that a newer document already
covered. 91 remain.

| Class | Count | How to read it |
|---|---|---|
| CURRENT | 17 | Accurate. Use it |
| HISTORICAL | 41 | Accurate as a record of its date. Never as instruction |
| NON-TECHNICAL | 32 | Marketing, brand, GTM. Not engineering material |

The historical set is deliberately unedited. Several describe Supabase or MailerSend, because that
is what ran at the time; rewriting a record to match today falsifies it. Read the date written
inside the document, not the one git reports: a repo-wide `PartyHaus` to `PartyHause` spelling
replacement stamped 2026-08-30 onto files it never read.

Deletion was preferred to rewriting. 97 replacement documents that could not be grounded in code
would have been a larger version of the same problem. Anything worth keeping was restated here from
the source.

[`docs/README.md`](./docs/README.md) carries the per-file classification. Trust these, in order:
this file, then `docs/mobile-ios-launch/`, then `docs/BRAND.md`, `docs/SHARED_API_CLIENT.md`,
`docs/LOCAL_DEV_AUTOSYNC.md` and `docs/WEBMCP_MONITORING.md`.

When you find a document that contradicts the code, fix the document or mark it stale in the same
change. Documentation debt is why this file had to be rewritten from scratch.
