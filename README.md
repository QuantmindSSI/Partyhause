# PartyHause

[![CI](https://github.com/QuantmindSSI/Partyhause/actions/workflows/ci.yml/badge.svg)](https://github.com/QuantmindSSI/Partyhause/actions/workflows/ci.yml)
[![Deploy](https://github.com/QuantmindSSI/Partyhause/actions/workflows/deploy.yml/badge.svg)](https://github.com/QuantmindSSI/Partyhause/actions/workflows/deploy.yml)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPLv3-blue.svg)](./LICENSE)

Event management platform: create events, manage guest lists and RSVPs, send tracked email
invitations, run polls, split costs, coordinate a social "PartyCrew" graph, and check guests in
by QR — as an installable PWA backed by an Express/Prisma API on Azure.

Every claim in this document was verified against the source tree at commit `ab5209e`
(2026-08-18) by compiling, testing, building, and reading the code. Where the codebase is
incomplete or transitional, that is stated explicitly in [Known gaps](#known-gaps-and-limitations).

---

## Verified state

| Check | Command | Result |
|---|---|---|
| Typecheck (full AST, project references) | `npx tsc` | exit 0, no errors¹ |
| Unit / integration tests | `npm run test:run` | 9 files, **68 passed, 0 failed**, 5 skipped (live-email E2E, gated by `RUN_E2E_TESTS`) |
| Production build | `npx vite build` | success; PWA service worker generated, 59 precached entries (~1.8 MB) |
| Lint | `npm run lint` | 0 source errors², 834 warnings (mostly `no-explicit-any`) |
| Placeholder scan (server + core libs) | grep TODO/FIXME/stubs | 1 TODO (`src/lib/error-handling.ts:138`, error-reporting hook), 1 stub (`authService.verifyEmail`) |

¹ Under the repo's *loose* compiler settings — `strict: false`, `strictNullChecks: false` (`tsconfig.app.json`). The code compiles cleanly, but not under `--strict`.
² The 10 reported lint "errors" are all in `dev-dist/workbox-*.js`, a committed **generated** service-worker artifact, not source code.

## Architecture

```
Browser (React 18 PWA, port 5173 dev / nginx:80 prod)
   │  fetch /api/* (Bearer JWT)          │ WebSocket (json.webpubsub.azure.v1)
   ▼                                     ▼
Express 4 API (tsx, port 3001) ◄── negotiate ──► Azure Web PubSub (hub: partyhause)
   │ Prisma 7 (@prisma/adapter-pg)       │ @azure/storage-blob        │ Resend SDK
   ▼                                     ▼                            ▼
Azure PostgreSQL Flexible Server     Azure Blob Storage           Resend (email)
(36 models + SQL functions)          (event-invites container)    + svix-signed webhooks
```

| Layer | Technology | Where |
|---|---|---|
| Frontend | React 18.2, TypeScript 5.2, Vite 7.1.9, `vite-plugin-pwa` | `src/` |
| UI | Tailwind CSS 3, shadcn/ui (40 primitives), framer-motion, Radix | `src/components/` |
| State | Zustand 4 (single persisted store) + TanStack Query v4 | `src/store/usePartyStore.ts` |
| Routing | react-router-dom 7: 6 URL routes + store-driven page state machine, all 16 pages `React.lazy` | `src/App.tsx` |
| API | Express 4.18, executed directly with `tsx` (no compile step) | `server/` |
| ORM | Prisma 7.8 with `@prisma/adapter-pg` driver adapter | `prisma/`, `server/lib/prisma.ts` |
| Database | PostgreSQL (Azure Flexible Server `psqlphgipkzrenusqpy` in prod; local PG for dev) | `prisma/schema.prisma` |
| Auth | Custom JWT (HS256, bcryptjs cost 12) — Entra External ID via MSAL is wired client-side but **not yet validated server-side** | `server/routes/auth.ts`, `src/lib/msal*.ts` |
| Realtime | Azure Web PubSub over **native WebSocket** (`json.webpubsub.azure.v1` subprotocol; not socket.io) | `server/lib/pubsub.ts`, `src/hooks/use-realtime.ts` |
| Storage | Azure Blob Storage, server-side uploads via multer | `server/routes/storage.ts`, `src/lib/image-utils.ts` |
| Email | Resend (`/api/send-email`), delivery tracking via webhook + `email_logs` | `server/index.ts`, `server/routes/email-webhook.ts` |
| Infra | Bicep (subscription scope) → Azure Container Apps, ACR, Key Vault, Log Analytics | `infra/` |

## Repository layout

```
├── src/                  # React PWA
│   ├── pages/            # 7 route-level pages (dashboards, feed, explore, profile, settings)
│   ├── features/         # partyboard, partycrew, polls, timeline (33 files)
│   ├── components/       # 31 feature components + ui/ (40 shadcn primitives)
│   ├── hooks/            # use-auth, use-realtime, use-hardening, use-monitoring, ...
│   ├── lib/              # api-client, auth, msal, email-tracking, sanitization, validation, ...
│   ├── store/            # usePartyStore.ts (zustand, persisted)
│   └── test/             # 9 vitest suites + setup
├── server/               # Express API
│   ├── index.ts          # app wiring, CORS, raw-body capture, /api/health, /api/send-email
│   ├── middleware/auth.ts# requireAuth / optionalAuth (HS256 JWT)
│   ├── lib/              # prisma.ts, pubsub.ts, event-access.ts (authorization matrix)
│   ├── routes/           # 18 route files, 62 endpoints (see API surface)
│   └── dev-api.ts        # dev entry: dotenv + AUTH_BYPASS=true → index.ts
├── prisma/               # schema.prisma (36 models, 2 enums), seed.ts (5 event templates)
├── scripts/azure-pg-functions.sql  # SQL functions/triggers Prisma cannot express (idempotent)
├── infra/                # main.bicep (subscription scope) + resources.bicep + modules/
├── .github/workflows/    # ci.yml (PR checks), deploy.yml (build → provision → deploy → health)
├── Dockerfile            # web: node:20-slim build → nginx:alpine (SPA fallback)
├── Dockerfile.api        # api: node:20-slim, prisma generate, CMD tsx server/index.ts
├── apps/mobile           # Expo workspace app (secondary)
└── supabase/, api/, netlify/   # LEGACY — reference only, not in the runtime path
```

## Quick start (local development)

Prerequisites: Node.js ≥ 18 (Docker images use Node 20), npm ≥ 8, PostgreSQL running locally.

```bash
# 1. Install (peer-dep conflicts are expected; --legacy-peer-deps is required)
npm ci --legacy-peer-deps

# 2. Create the database and apply schema + functions + seed
createdb partyhause
export DATABASE_URL="postgresql://$(whoami)@localhost:5432/partyhause"
npx prisma db push
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/azure-pg-functions.sql
npx tsx prisma/seed.ts        # seeds 5 event templates

# 3. Start the API (port 3001). dev-api.ts defaults AUTH_BYPASS=true for local work.
npm run dev:api

# 4. In another terminal: start the web app (port 5173, proxies /api → 3001)
npm run dev

# 5. Verify
curl http://localhost:3001/api/health
# {"status":"ok","message":"PartyHause API server is running", ...}
```

This exact sequence was executed and verified against a clean local PostgreSQL 17 database.

Email sending is disabled locally unless `RESEND_API_KEY` is set (health reports
`"email":"missing-credentials"`); everything else works without it. `AUTH_BYPASS` is refused
when `NODE_ENV=production`.

### Useful commands

```bash
npm run lint            # eslint (flat config)
npm run test:run        # vitest, single pass
npm run test:coverage   # vitest + coverage
npm run build:check     # tsc + vite build (what CI runs)
npm run server          # API without the dev AUTH_BYPASS default
npx prisma studio       # inspect the database
```

## Environment variables

### API (runtime)

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | — (falls back to `POSTGRES_HOST/PORT/USER/PASSWORD/DB` parts, `sslmode=require`) | Prisma/pg connection |
| `PORT` | `3001` | API listen port |
| `JWT_SECRET` | dev-only fallback constant | HS256 signing secret — **must** be set in production |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `AUTH_BYPASS`, `AUTH_BYPASS_USER_ID` | off | Dev-only auth bypass; hard-disabled when `NODE_ENV=production` |
| `CORS_ALLOWED_ORIGINS` | empty (allow any) | Comma-separated origin allow-list |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_FROM_NAME` | — / — / `PartyHause` | Outbound email |
| `RESEND_WEBHOOK_SECRET` | — | svix HMAC verification of `/api/email-webhook` (timing-safe, 5-min replay window) |
| `ALLOW_FROM_OVERRIDE` | off | Permit caller-supplied `from` on `/api/send-email` |
| `VITE_APP_URL` | `http://localhost:5173` | Base URL used in password-reset links |
| `WEBPUBSUB_CONNECTION_STRING`, `WEBPUBSUB_HUB` | — / `partyhause` | Realtime; broadcasts no-op with a one-time warning when unset |
| `AZURE_STORAGE_CONNECTION_STRING` **or** `AZURE_STORAGE_ACCOUNT` + `AZURE_STORAGE_ACCOUNT_KEY` | — | Blob storage client |
| `AZURE_STORAGE_BLOB_ENDPOINT`, `AZURE_STORAGE_IMAGE_CONTAINER` | prod endpoint / `event-invites` | Blob addressing |

### Web (build-time only — Vite inlines these; never set them on the nginx container)

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | empty = same-origin `/api/*` | API base URL |
| `VITE_ENTRA_TENANT_ID`, `VITE_ENTRA_SPA_CLIENT_ID`, `VITE_ENTRA_POLICY` | unset | Enables MSAL/Entra External ID login; when unset the app uses the custom JWT auth |
| `VITE_ALLOW_FROM_OVERRIDE`, `VITE_FROM_OVERRIDE` | unset | Email `from` override (dev/testing) |

## API surface

64 HTTP endpoints: 2 inline (`GET /api/health`, `POST /api/send-email`) + 62 across 18 route
files. Auth = custom HS256 Bearer JWT via `requireAuth` unless noted.

| Base path | Endpoints | Auth notes |
|---|---|---|
| `/api/auth` | POST `signup`, `login`, `forgot-password`, `reset-password`, `logout`; GET `me` | public except `me`; bcrypt cost 12; reset tokens hashed, 1 h expiry |
| `/api/events` | GET `/:id?`, POST, PUT `/:id`, DELETE `/:id` | authorization matrix below |
| `/api/guests` | GET, POST, PUT `/:id`, DELETE `/:id` | host/co-host managed; guest self-read/update |
| `/api/timeline` | GET `/:eventId`, POST, PUT `/:id`, DELETE `/:id` | guests see `guest_visible` blocks only |
| `/api/polls` | GET, POST, GET `/:id`, POST `/:id/vote`, POST `/:id/close` | participants vote; creator/host closes |
| `/api/invite-templates` | GET, POST, PUT `/:id`, DELETE `/:id` | |
| `/api/event-templates` | GET, GET `/:id`, POST `/:id/create-event` | GET routes are **public** (see gaps) |
| `/api/email-logs` | GET, POST, PUT `/:id`, GET `/:id`, GET `/analytics/event` | per-send delivery tracking |
| `/api/email-webhook` | POST | public; svix HMAC-SHA256 verified when secret set |
| `/api/connections` | GET, POST, DELETE `/:id` | |
| `/api/partycrew` | GET `members`, `crewing-with`, `toggle`, `requests`; POST `toggle`, `requests`; DELETE `requests` | |
| `/api/users` | GET `suggested`; GET `/:id` | `/:id` uses `optionalAuth` |
| `/api/feed` | GET `crew`; POST `seen` | impression recording, ≤100 ids/call |
| `/api/invites` | POST `generate`, `join`, `convert-guest` | `join` uses `optionalAuth` (token-based) |
| `/api/cost-split` | GET `/:eventId`, POST, PUT `/:id`, DELETE `/:id` | summaries maintained by DB trigger |
| `/api/ai` | POST `extract-event-details` | keyword/regex extraction — **no LLM behind it** |
| `/api/storage` | POST `upload`, DELETE `/:blobName`, GET `url/:blobName` | see Storage |
| `/api/realtime` | GET `negotiate` | issues 60-min Web PubSub client token; 503 when unconfigured |

## Data model

`prisma/schema.prisma`: **36 models**, 2 enums (`TemplateCategory`, `PriceTier`), all mapped to
snake_case tables. Domains: users/profiles (2), core events — event, co-hosts, guests, tickets,
timeline, media, activities, vendors (10), social/PartyCrew — connections, requests, blocks,
posts, likes, comments, shares, notifications, read-status, interactions (10), polls (3),
email — logs, events, invite templates (3), event templates + usage (2), guest-to-crew
conversion + cost-split + invite tokens (4), legacy games (2).

Business rules that Prisma cannot express live in **`scripts/azure-pg-functions.sql`**
(idempotent; apply after every `prisma db push`): guest→crew conversion, mutual-crew checks,
poll consensus trigger, and an `update_event_cost_summary` trigger that recomputes event cost
summaries on insert/update/delete of splits.

## Authorization model

`server/lib/event-access.ts` ports the former Supabase row-level-security policies into one
app-layer matrix used by the events, guests, timeline, and polls routes (8 predicate
functions, all fully implemented):

| Resource | READ | WRITE | DELETE |
|---|---|---|---|
| Event | public, host, co-host, invited guest (email match) | host, co-host with `can_edit` | host only |
| Guests | host, co-host; a guest may read/update **their own** record | add: host, co-host with `can_invite` | host, co-host |
| Timeline | host/co-host: all blocks; participants/public: `guest_visible` only | host, co-host | host, co-host |
| Polls | event participants | vote: participants; close: creator or host | — |

## Realtime protocol

- Client calls `GET /api/realtime/negotiate` → server issues a Web PubSub client access token
  (hub `partyhause`, 60-min expiry) via `WebPubSubServiceClient`.
- Client connects with **native `WebSocket`** using the `json.webpubsub.azure.v1` subprotocol —
  socket.io is deliberately not used (its framing is incompatible; see `server/lib/pubsub.ts`).
- Server broadcasts `{event, data}` envelopes: `guest-updated` (3 call sites in guests route)
  and `event-updated` (3 call sites in events route). Poll/timeline broadcast types are declared
  client-side but not yet emitted server-side.
- Resilience: bounded exponential reconnect (8 attempts, 1 s → 30 s cap) with re-negotiation;
  30-second guest polling whenever the socket is down; polling persists if reconnects exhaust.

## Storage pipeline

Client (`src/lib/image-utils.ts`): validate → canvas compression (max 1920×1080, quality 0.9
for files >1 MB) → multipart POST `/api/storage/upload`.
Server (`server/routes/storage.ts`, 355 lines): multer memory storage, **5 MB limit**,
content-type allow-list (`jpeg/png/webp/gif`), blob names sanitized against path traversal and
**namespaced under the uploader's user id**. Deletes and SAS grants require ownership (or event
hostship for legacy names). `GET /url/:blobName` returns a 1-hour HTTPS-only read SAS when an
account key is configured, else the public container URL.

## Testing

`vitest` + jsdom + Testing Library. 9 suites in `src/test/`: auth hook session lifecycle,
zustand store, email service + templates, email E2E (skipped unless `RUN_E2E_TESTS=true`),
hardening (error classes, zod validation, sanitization, client rate-limit util), guest view,
auth+event-creation integration, and two logout suites (unit + integration).

Current result: **68 passed, 0 failed, 5 skipped**. Gap: there are no server-side route tests;
the Express layer is exercised only indirectly.

## CI/CD and deployment

- **`ci.yml`** — PRs and non-main pushes: `npm ci` → lint → `build:check` (tsc + vite build) →
  `test:run`. Per-branch concurrency.
- **`deploy.yml`** — push to `main` (or manual dispatch with `skip-provision`): build & test →
  Bicep provision (`az deployment sub create`, subscription scope) → `az acr build` for both
  images tagged `:latest` **and** `:<git-sha>` → update both Container Apps to the sha tag →
  poll `/api/health` and web `/` until healthy. Single-flight via `deploy-prod` concurrency
  group; newer pushes cancel in-flight deploys.

Production (resource group `rg-partyhause-prod`, East US 2; Postgres in Central US):

| Component | Resource |
|---|---|
| Web | `ca-web-partyhause-gipkzrenusqpy` (nginx, port 80) |
| API | `ca-api-partyhause-gipkzrenusqpy` (tsx, port 3001) |
| Registry | `acrpartyhausegipkzrenusqpy` |
| Database | `psqlphgipkzrenusqpy` (PostgreSQL Flexible Server) |
| Storage | `stphgipkzrenusqpy` / container `event-invites` |
| Realtime | `wps-partyhause-gipkzrenusqpy` (Web PubSub) |
| Secrets | Key Vault `kvphgipkzrenusqpy` + Container App secrets |

Required GitHub secrets, Bicep parameters, and CORS notes are documented in
[`AGENTS.md`](./AGENTS.md). `VITE_*` values are build-time only — they are inlined into the
static bundle during `az acr build` and are never read at runtime by the nginx container.

## Migration status (Supabase → Azure)

| Phase | Status | Evidence |
|---|---|---|
| 1. Database → Prisma + Azure PG | Done | 36 models; functions ported in `scripts/azure-pg-functions.sql` |
| 2. Express API | Done | 18 route files, 62 endpoints, mounted in `server/index.ts` |
| 3. Frontend API client | Done | `src/lib/api-client.ts` (Bearer injection, 15 s timeout, GET retry on 502/503/504, 401 → session wipe) |
| 4. Storage → Azure Blob | Done | `server/routes/storage.ts` + `src/lib/image-utils.ts` |
| 5. Realtime → Web PubSub | Done | native WebSocket + negotiate endpoint + polling fallback |
| 6. Auth → Entra External ID | **In progress** | MSAL client integration complete (lazy-loaded, env-gated); **the API does not yet validate Entra tokens** — only custom HS256 JWTs |
| 7. Remove Supabase | Effectively done at runtime | `@supabase/supabase-js` is absent from dependencies; `src/lib/supabase.ts` remains as a no-SDK compatibility stub; `supabase/` migrations kept as reference |
| 8. Final verification | Pending | blocked on phase 6 |

## Known gaps and limitations

Honest accounting of what the code does *not* do, verified by inspection:

1. **Entra tokens are not accepted by the API.** `server/middleware/auth.ts` validates only the
   custom HS256 JWT. Enabling `VITE_ENTRA_*` lets users authenticate in the browser, but those
   tokens will fail API auth until server-side Entra validation is implemented (phase 6).
2. **No API rate limiting and no helmet/security-header middleware.** CORS allow-listing and
   auth are the only request gates. The svix webhook check is the exception (HMAC + replay window).
3. **Loose TypeScript.** `strict: false`, `strictNullChecks: false`. `tsc` passes under these
   settings only.
4. **`GET /api/event-templates*` is public** although an inline comment claims `optionalAuth`;
   no middleware is applied to those two routes.
5. **`authService.verifyEmail()` is a stub** ("Email verification coming soon"). No email
   verification flow exists.
6. **`/api/ai` is not AI.** Extraction is keyword/regex-based; it also attempts an insert into
   an `ai_extractions` table that is never created (silently caught, harmless).
7. **Client-side-only roles.** `user`/`creator`/`vendor` gating lives in the React `RoleGuard`;
   the `User` model has no role column and the API enforces none.
8. **Partial realtime coverage.** Only guest and event updates are broadcast; poll/timeline
   updates rely on refetch/polling.
9. **No refresh tokens.** 7-day access token; logout is client-side token discard.
10. **Legacy code retained in-tree** (not in the runtime path): `api/` (36 deprecated Vercel
    functions), `netlify/` (27 functions) + `netlify.toml`, `supabase/` (26 reference
    migrations), ~18 root `test-*.js` ad-hoc scripts, committed `dist/`/`dev-dist/` artifacts,
    stale `bun.lockb` (npm's `package-lock.json` is authoritative), and a root tsconfig that
    still extends `expo/tsconfig.base` (the web Dockerfile strips it with `sed`).
11. **834 lint warnings** (predominantly `@typescript-eslint/no-explicit-any`) and 1 TODO
    (error-reporting service hook).

## License

[GPL-3.0](./LICENSE). (Earlier revisions of this README stated MIT; the `LICENSE` file in this
repository is the GNU General Public License v3.)
