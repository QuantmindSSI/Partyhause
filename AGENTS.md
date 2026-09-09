# AGENTS.md

Engineering source of truth for PartyHause. Written for AI agents and humans working in this
repository.

Implementation claims were verified from code on 2026-09-04 and corrected through 2026-09-05,
not copied from prior documentation. Where the codebase is ambiguous or contradictory, that is
stated rather than smoothed over. This file controls implementation facts. The approved product
scope and release requirements for IOS-MVP-1 are canonical in
[`docs/mobile-ios-launch/`](./docs/mobile-ios-launch/). A difference between that specification and
the code is a gap, not permission to broaden the release.

`README.md` is the product front door and is written for a non-engineering audience. It is not an
engineering reference.

---

## Stack

| Layer | Technology | Location |
|---|---|---|
| Web | React 19.2.3, TypeScript 5.9.3, Vite 7.3.6, `vite-plugin-pwa` 1.3.0 | `src/` |
| UI | Tailwind CSS 3, shadcn/ui on Radix, framer-motion | `src/components/` |
| Web state | Zustand 4 (one persisted store) plus TanStack Query v5 | `src/store/usePartyStore.ts` |
| API | Express 4.22.1, run directly with `tsx`, no compile step | `server/` |
| ORM | Prisma 7.10.0 with the `@prisma/adapter-pg` driver adapter | `prisma/`, `server/lib/prisma.ts` |
| Database | PostgreSQL 15, Azure Flexible Server | `prisma/schema.prisma` |
| Auth | Self-hosted JWT, HS256, bcryptjs cost 12 | `server/routes/auth.ts`, `server/middleware/auth.ts` |
| Realtime | Azure Web PubSub over native WebSocket | `server/lib/pubsub.ts`, `src/hooks/use-realtime.ts` |
| Storage | Azure Blob Storage, server-side upload via multer | `server/routes/storage.ts` |
| Email | Azure Communication Services primary, Resend fallback | `server/lib/email.ts` |
| Mobile | Expo SDK 57, React Native 0.86, Expo Router 57 | `apps/mobile/` |
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

### Version notes

- Node is standardized on `22.22.0`: the package engine accepts that Node 22 range, both local
  version files pin it, and CI, EAS, and both Docker build paths use the same patch release.
- Web and mobile both use React 19.2.3 so Metro resolves one native React installation in the npm
  workspace.
- npm uses strict peer resolution. Clean `npm install`, `npm ci`, and `npm ls --all` pass without
  `legacy-peer-deps`; `.npmrc` retains `engine-strict=true` only.
- Mobile uses TypeScript 6.0.3 from its workspace while the web, server, and shared core projects
  use TypeScript 5.9.3.
- **`npm run test:ui` cannot work.** `@vitest/ui` is not in `devDependencies`.

---

## Repository layout

npm workspaces are `apps/*` and `packages/*` (`package.json:10-13`).

| Path | Contents |
|---|---|
| `src/` | Vite React PWA. `App.tsx`, `pages/` (11), `features/` (partyboard, partycrew, polls, timeline, notifications), `components/`, `lib/`, `store/`, `test/` |
| `server/` | Express API. `index.ts` entrypoint, `routes/` (19 files), `lib/` (7), `middleware/auth.ts` |
| `packages/core/` | Shared API client and zustand store. Ships raw TypeScript; `main` points at `src/index.ts` |
| `apps/mobile/` | Expo Router app. Uses the root workspace lockfile; `app.config.ts` is the Expo source of truth |
| `prisma/` | `schema.prisma` (1344 lines, 43 models), versioned migrations, and `seed.ts` |
| `infra/` | Bicep. `main.bicep` (subscription scope), `resources.bicep`, `modules/` (5) |
| `scripts/` | 29 operational scripts, mixed languages. Release-critical audits are wired to npm scripts |
| `docs/` | 88 markdown files, all current, historical or non-technical. 97 stale ones were deleted on 2026-09-04. Index at [`docs/README.md`](./docs/README.md) |

**`packages/core` is consumed by mobile only.** `rg "@partyhause/core" src/` returns nothing. The
web app runs a separate client at `src/lib/api-client.ts`. This is a real cost: the same contract
bug has to be fixed in both places, and has been, more than once. Treat any change to an API
contract as a two-site change until the clients are unified.

### Canonical IOS-MVP-1 scope

IOS-MVP-1 is an iPhone-only host app for private events. Each event has one host and at most 50
manually entered guests. Invitations use a fixed server-rendered email, RSVP occurs in a browser,
and check-in is manual in the host app. There is no native guest mode.

PartyCrew/social, templates, timeline, polls, PartyBoard, costs, games, push, realtime, media,
contacts, camera, iPad, Android launch, co-hosts, and payments are `REMOVED_FROM_IOS_MVP`. They must
not appear in the release binary, navigation, remote flags, permissions, review data, screenshots,
or metadata. Existing code and database models do not change that boundary.

The implementation gap snapshot in
[`docs/mobile-ios-launch/08-current-state-gap-register.md`](./docs/mobile-ios-launch/08-current-state-gap-register.md)
is fixed to commit `2cbf6a6`. Later commits require explicit re-audit before a status changes.

---

## Local development

```bash
# 1. Install. Strict peer resolution is required.
npm ci

# 2. Generate the Prisma client. Both CI workflows do this before anything else.
npx prisma generate

# 3. Apply the versioned schema to a local Postgres.
DATABASE_URL="postgresql://localhost:5432/partyhause" npx prisma migrate deploy
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
| `npm run test:migrations` | Replays migrations twice and checks Prisma drift | **CI and deploy** |
| `npm run test:mobile-release` | Validates the mobile route and iOS configuration allow-lists | via `test:run` |
| `npm run doctor:mobile` | Runs pinned Expo Doctor checks | **CI and deploy** |
| `npm run build:ios:export` | Produces the unsigned iOS JavaScript export | **CI and deploy** |
| `npm run audit:contracts` | Compares client call shapes to server route expectations | via `build:check` |
| `npm run audit:endpoints` | Endpoint inventory | not wired to CI |
| `npm run server` | API without watch or bypass | |

`build:check` is the real gate. Note that `vite build` does not typecheck, so a type error will
still produce a working bundle if you bypass `build:check`.

---

## API surface

Base URL in production is the API Container App FQDN. All routes are under `/api`.

`server/index.ts` mounts the legacy routers plus isolated RSVP, iOS MVP, and MVP account routers,
with two API endpoints registered before
that umbrella: `GET /api/health` and `POST /api/send-email`. The email endpoint has its own
authenticated, user-keyed limiter. Favicon and SPA fallback routes are registered only when
`dist/` exists and are not API routes.

99 HTTP routes across `server/index.ts` and 22 router files.

| Router | Routes |
|---|---|
| `/api/auth` | `POST /signup`, `POST /verify-email`, `POST /resend-verification`, `POST /login`, `GET /me`, `POST /forgot-password`, `POST /reset-password`, `POST /logout` |
| `/api/mvp/account` | `GET /`, `POST /deletion-intent`, `POST /deletion`, `GET /deletion/:receipt` |
| `/api/mvp` | 16 owner-scoped event, guest, invitation, and attendance routes |
| `/api/rsvp` | `POST /resolve`, `PUT /` |
| `/api/events` | `GET /:id?`, `POST /`, `PUT /:id`, `DELETE /:id` |
| `/api/guests` | `GET /`, `POST /`, `PUT /:id`, `DELETE /:id` |
| `/api/timeline` | `GET /:eventId`, `POST /`, `PUT /:id`, `DELETE /:id` |
| `/api/polls` | `GET /`, `POST /`, `GET /:id`, `POST /:id/vote`, `POST /:id/close` |
| `/api/invite-templates` | `GET /`, `POST /`, `PUT /:id`, `DELETE /:id` |
| `/api/event-templates` | `GET /`, `GET /:id`, `POST /:id/create-event` |
| `/api/email-webhook` | `POST /` (anonymous; svix HMAC checked only when the secret is configured) |
| `/api/email-logs` | `POST /`, `PUT /:id`, `GET /`, `GET /:id`, `GET /analytics/event` |
| `/api/connections` | `GET /`, `POST /`, `DELETE /:id` |
| `/api/partycrew` | `GET /members`, `GET /crewing-with`, `GET /toggle`, `POST /toggle`, `GET /requests`, `POST /requests`, `DELETE /requests` |
| `/api/users` | `GET /me/profile`, `PUT /me/profile`, `GET /suggested`, `GET /:id` |
| `/api/feed` | `GET /crew`, `POST /seen`, `POST/DELETE /posts/:id/like`, `GET/POST /posts/:id/comments`, `POST /posts/:id/share` |
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
- **`POST /api/send-email` is no longer an open relay.** It requires authentication, applies a
  user-keyed limit, checks event invite authority, restricts recipients to that event's guest list,
  caps a request at 100 recipients, fixes the sender, and sanitizes HTML. Thirteen tests in
  `src/test/send-email-scoping.test.ts` cover those controls. IOS-MVP-1 still requires a lower
  50-recipient bound and fixed server-rendered invitation content.
- **The global error handler returns `err?.message` to the client** in 500 bodies
  (`server/index.ts:377-381`).
- **Empty `CORS_ALLOWED_ORIGINS` allows all origins** (`server/index.ts:217-219`).

---

## Auth

Self-hosted. No Supabase, no working Entra path.

**Issuance.** `jsonwebtoken` HS256. Claims are
`{ sub, email, name, email_verified, token_version }`. Lifetime comes from `JWT_EXPIRES_IN`,
default `7d`. Secret comes from
`server/lib/jwt-secret.ts`, which in production throws if the secret is empty, equals the committed
dev fallback, or is shorter than 32 characters. `assertJwtSecretConfigured()` runs before
`app.listen` and exits 1 on failure.

**Verification.** `jwt.verify` uses an explicit `HS256` allow-list. Every authenticated request then
loads the current user and rejects missing or non-active accounts, unverified addresses, and a
`token_version` mismatch. Logout, password reset, and confirmed deletion increment the version;
logout therefore revokes all sessions for the MVP rather than only clearing one device.

**Passwords.** bcryptjs cost 12 for passwords, cost 10 for verification and reset tokens. Minimum
length 8, no complexity rule.

**Email verification is enforced at three points**, and all three are required:

1. Signup returns no token at all (`routes/auth.ts:234-241`).
2. Login rejects unconfirmed accounts with **403 `EMAIL_NOT_VERIFIED`**, deliberately distinct from
   the 401 for bad credentials, so the client can offer a resend instead of a password reset.
3. `requireAuth` requires both the signed claim and current database value, and rejects every token
   minted before token-version enforcement.

**Consent.** Signup requires `ageEligible: true` and exact Terms and Privacy version
`2026-09-06`; both versions and the age assertion are persisted with the account. Signup still
returns no session token and now reports whether an email provider accepted the verification mail.

**Deletion.** `/api/mvp/account/deletion-intent` reauthenticates the password and creates or reuses a
15-minute random receipt. Confirming with that receipt and exact `DELETE` atomically marks the
account `deletion_pending`, increments `token_version`, and revokes hosted-event invitation links
before a bounded synchronous erasure pass. Failed or interrupted blob and database work is retried
in bounded hourly batches and remains retryable under the same receipt. Completion removes the
receipt's user link and retains only nonidentifying outcome
data for 365 days. Primary erasure has a 24-hour deadline. Azure PostgreSQL backup retention is the
current 7-day service setting, not the former 35-day target.

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

43 Prisma models and 2 enums in `prisma/schema.prisma`. Core entities: `User`, `UserProfile`,
`Event`, `EventCoHost`, `Guest`, `Ticket`, `TimelineBlock`, `Poll`, `PollOption`, `PollVote`,
`Connection`, `ConnectionRequest`, `PartycrewPost`, `Notification`, `EmailLog`, `EmailEvent`,
`Template`, `InviteTemplate`, `EventInviteToken`, `CostSplitRequest`, `Media`, `Vendor`,
`VendorTask`.

`Vendor` and `VendorTask` exist in the schema but **have no API routes and no UI**. The vendor
marketplace is not built.

The datasource declares no `url` (Prisma 7 requirement); it is supplied by `prisma.config.ts` from
`DATABASE_URL`. `server/lib/prisma.ts` falls back to assembling a connection string from
`POSTGRES_*` parts with `sslmode=require` if `DATABASE_URL` fails to parse.

`prisma/migrations/20260905000000_baseline` contains the Prisma-visible PostgreSQL baseline,
`20260905000100_database_functions` owns the previously ad hoc functions and triggers, and
`20260905000200_core_integrity_constraints` adds validated checks at critical trust boundaries.
`20260906000000_ios_mvp_domain` adds the owner-scoped event, guest, invitation, attendance, and
account-deletion state required by IOS-MVP-1. A read-only PostgreSQL 15.18 production schema dump
was restored locally on 2026-09-05; after modeling the legacy `partyboard_stickies`, `saved_events`,
and `connections.connection_type` objects, Prisma reported zero structural drift. The migration set
was also replayed from an empty database, the functions migration was reapplied twice, and the
required constraints, functions, and trigger cardinality were verified.

Production was enrolled on 2026-09-06 after a current automatic backup and a 18-check data
preflight. The baseline was recorded without re-executing it, and all three later migrations were
applied transactionally. Three automated-test profile usernames that exceeded 30 characters were
collision-checked and truncated by the integrity migration. All four history rows have the expected
checksums and finished timestamps; the invariant verifier passed after application. For another
existing environment that exactly matches the unmanaged baseline, the standard adoption sequence
is:

```bash
DATABASE_URL="postgresql://..." npx prisma migrate resolve --applied 20260905000000_baseline
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

Do not run `migrate deploy` first against an existing unmanaged schema. The unconditional baseline
would collide with existing tables. The three later migrations execute after the baseline is
recorded; each fails atomically if existing data violates a new constraint.

```bash
npx prisma generate
DATABASE_URL="postgresql://..." npx prisma migrate deploy
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
Delivery events arrive at `POST /api/email-webhook`. Svix HMAC-SHA256 verification over
`${svix-id}.${svix-timestamp}.${rawBody}` has a 300 second replay window when
`RESEND_WEBHOOK_SECRET` is configured, but the route currently accepts unsigned requests when that
secret is absent. Events are recorded in `email_logs` and `email_events`.

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
`JWT_EXPIRES_IN`, `INVITATION_TOKEN_SECRET`, `VITE_APP_URL`, `ACS_CONNECTION_STRING`, `ACS_SENDER_ADDRESS`, `RESEND_API_KEY`,
`RESEND_FROM_EMAIL`, `RESEND_WEBHOOK_SECRET`, `WEBPUBSUB_CONNECTION_STRING`, `WEBPUBSUB_HUB`,
`AZURE_STORAGE_*`, `AZURE_OPENAI_*`, `OPENAI_API_KEY`, `AUTH_BYPASS`, `AUTH_BYPASS_USER_ID`.

`INVITATION_TOKEN_SECRET` is required by the API. Production refuses to start when it is missing or
shorter than 32 UTF-8 bytes. It must be independent from `JWT_SECRET`; generate each secret with
`openssl rand -base64 48` and provision them as separate Container App secrets.

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
  --parameters jwtSecret="<jwt-secret>" \
  --parameters invitationTokenSecret="<invitation-token-secret>" \
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

- **`ci.yml`** runs on PRs and non-main pushes: Prisma generation and migration replay, lint,
  `build:check`, `test:run`, Expo Doctor, and an unsigned iOS export. Does not deploy.
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

## Mobile build path

There is no signed iOS build yet and nothing has been submitted. Build tooling is in place, but
IOS-MVP-1 still has both implementation blockers and account-side setup blockers.

**Build tooling.** npm scripts invoke the exact `eas-cli@23.2.0`, and `eas.json` enforces that
version plus Node 22.22.0. Build profiles cover simulator development, physical-device preview, and
production with auto-increment. Bundle identifier is `com.partyhause.mobile`. The Expo config is
iPhone-only, targets iOS 17.0, and strips sensitive iOS permission descriptions during prebuild; the
Contacts, media, document-picker, haptics, and excluded visual-feature dependencies were removed.

**Account-side setup that cannot be completed by repository code:**

| What | Why it blocks |
|---|---|
| An EAS project | `app.config.ts` has no `eas.projectId`, yet `eas.json` sets `appVersionSource: "remote"`, which requires one. Created by `eas init`, which needs an Expo account |
| Apple Team ID | Signing and submission need it. Only an Apple Developer account produces it |
| App Store Connect record | `ascAppId` cannot exist before the app record does |

```bash
cd apps/mobile
npm run eas:login          # Expo account
npm run eas:init           # writes eas.projectId into app.config.ts
npm run build:ios:preview  # first signed physical-device preview
```

`submit.production.ios` is deliberately empty. Apple account values must come from the authenticated
EAS account or approved secret configuration, not committed literals.

**Universal Links are not configured and IOS-MVP-1 does not require them.** Verification, password
reset, RSVP, Privacy, Terms, and Support intentionally remain HTTPS browser flows. Do not add an
Associated Domains entitlement or claim native link handling for this release.

---

## Testing

At audited commit `2cbf6a6`, `src/test/` contained 18 `*.test.ts` or `*.test.tsx` files. The current
implementation sprint has 46 suites, with 360 passing and 12 skipped when no database or live email
endpoint is supplied. Verified with `npm run test:run` on 2026-09-06. Vitest uses jsdom. The run
exits successfully but still prints React `act(...)` warnings in `guest-view.test.tsx` and
`logout.test.tsx`.

Notable suites: `bundle-chunk-graph.test.ts` guards the emitted Rollup chunk graph against import
cycles, which once shipped a white screen that returned HTTP 200, and asserts PWA manifest icons
resolve to real correctly-sized PNGs. `email-verification-gate.test.ts` covers the three auth
gates. `core-api-client.test.ts` covers transport retry bounds and 401 handling.

The skipped 5 are live email E2E tests requiring a running API. Seven PostgreSQL integration tests
also skip when `DATABASE_URL` is absent; all seven passed against a fresh migration replay on
2026-09-06.

---

## Known gaps and hazards

Ranked by consequence.

1. **39 IOS-MVP-1 blockers and 2 high-severity gaps remain at baseline `2cbf6a6`.** The gap register
   retains 93 legacy IDs: 39 `OPEN_BLOCKER`, 2 `OPEN_HIGH`, 6 `RESOLVED_AT_2CBF6A6`, and 46
   `REMOVED_FROM_IOS_MVP`. Removed scope is not resolved.
2. **The mobile route graph is narrowed but incomplete.** Social, profile, template, timeline,
   invitation-design, activity, games, media, vendor, contact, and local-draft routes were removed.
   Account and permanent deletion destinations are implemented; the remaining release gaps are
   tracked in `docs/mobile-ios-launch/08-current-state-gap-register.md`.
3. **The event form now saves one truthful private server draft.** Explicit publish, edit,
   cancellation, browser RSVP, and fixed invitation delivery are not yet implemented.
4. **Two HTTP clients**, described under Repository layout.
5. **Web routing is split** between React Router, which owns 8 paths, and a `currentPage` string
   state machine handling 33 keys behind `path="*"`. The state type ends in `| string`, so the
   literal set is not enforced. Eleven handled keys are never set by any call site.
6. **370 lint warnings**, mostly `no-explicit-any`.
7. **`build.target` is `esnext`**, so nothing is downlevelled. `Object.hasOwn` (Safari 15.4+) is
   already present in two eagerly loaded chunks.
8. **Store submission is not account-linked.** The iOS submit object is empty and no EAS project,
   Apple Team ID, or App Store Connect record is configured in the repository.
9. **`Dockerfile:26` mutates `tsconfig.json`** during the web build, so the image build differs from
   a local `npm run build:web`.
10. **`src/lib/env-server.ts` is orphaned**: Node `process.env` inside the client tree, no importers.
11. **`app.set('trust proxy', 1)` is called twice** in `server/index.ts`.
12. **`npm audit --omit=dev` reports 4 high-severity findings in the Prisma CLI 7.10.0 chain.**
    Prisma pins vulnerable `deepmerge-ts@7.1.5` and `mysql2@3.15.3`; the registry currently offers
    no stable compatible Prisma release, and npm suggests an incompatible Prisma 6.19.3 downgrade.
    The Expo 57 Metro and PostCSS chain contributes zero high-severity findings.

---

## Documentation map

All 187 markdown files were audited against the code on 2026-09-04 and **97 were deleted**: 79 that
presented Supabase, Netlify or Vercel as live infrastructure, and 18 that a newer document already
covered. 90 remain: 88 under `docs/`, plus the root `README.md` and `AGENTS.md`.

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

[`docs/README.md`](./docs/README.md) carries the per-file classification. Use this file for
implementation facts and `docs/mobile-ios-launch/` for approved IOS-MVP-1 product scope and release
requirements. Then use `docs/BRAND.md`, `docs/SHARED_API_CLIENT.md`, `docs/LOCAL_DEV_AUTOSYNC.md`
and `docs/WEBMCP_MONITORING.md` for their named subjects.

When you find a document that contradicts the code, fix the document or mark it stale in the same
change. Documentation debt is why this file had to be rewritten from scratch.
