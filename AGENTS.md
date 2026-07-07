# AGENTS.md — PartyHause

Project-specific guidance for AI agents (and humans) working in this repo.

## Stack

- **Frontend**: React + Vite PWA (`apps/web` or root `src/`), built to static files served by nginx.
- **Backend**: Node/Express API (`server/`), served from a Container App.
- **Database**: Azure Database for PostgreSQL Flexible Server (replaces Supabase Postgres).
- **Storage**: Azure Blob Storage (replaces Supabase Storage).
- **Realtime**: Azure Web PubSub (replaces Supabase Realtime).
- **Auth**: Microsoft Entra External ID (CIAM) — tenant `partyhause.onmicrosoft.com` (provisioning). Transitional: Supabase Auth still used for JWT issuance.
- **Email**: Resend (via `/api/send-email` and `/api/email` endpoints).
- **ORM**: Prisma 7 with `@prisma/adapter-pg` driver adapter.
- **Infra**: Bicep (`infra/`), deployed to Azure Container Apps.

## Common commands

```bash
npm ci --legacy-peer-deps     # install (peer-dep conflicts are expected)
npm run lint                  # eslint
npm run test:run              # vitest, single run (no watch)
npm run build:check           # tsc + vite build (typecheck + build)
npm run smoke-test:migration  # optional Supabase migration smoke test (needs SUPABASE_* creds)
```

## CI/CD

Two GitHub workflows live in `.github/workflows/`:

- **`ci.yml`** — runs on PRs and non-main pushes. Lint, typecheck, build, tests. Does NOT deploy.
- **`deploy.yml`** — runs on push to `main` (and `workflow_dispatch`). Builds images, optionally
  provisions/updates Bicep infra, deploys to Azure Container Apps, then runs health checks.

Netlify/Vercel deployment has been discontinued. Do not re-add Netlify/Vercel config.

### Concurrency

- `deploy.yml` uses `concurrency: deploy-prod` with `cancel-in-progress: true` — only one prod
  deploy runs at a time; newer pushes cancel older in-flight runs.
- `ci.yml` uses `concurrency: ci-${{ github.ref }}` so per-branch CI runs don't pile up.

### Image tagging

Images are pushed to ACR with two tags: `:latest` and `:<git-sha>`. The Container Apps are
updated to the `:<git-sha>` tag so each deployment is traceable to a commit. `:latest` is kept
for convenience/manual `az containerapp update` fallbacks.

## Required GitHub Secrets

Set these in **repo settings → Secrets and variables → Actions**. The deploy workflow will fail
without the "Required" ones.

### Required (deploy.yml)

| Secret | Used by | Purpose |
|---|---|---|
| `AZURE_CREDENTIALS` | `azure/login` | Service principal JSON (Contributor on RG + AcrPush on ACR). |
| `POSTGRES_ADMIN_PASSWORD` | Bicep `--parameters` | PostgreSQL cluster admin password (Bicep `@secure` param). |
| `RESEND_API_KEY` | Bicep `--parameters` + API container secret | Resend API key for sending email. |
| `RESEND_FROM_EMAIL` | API container env var | Verified Resend sending address, e.g. `PartyHause <noreply@partyhause.com>`. |
| `SUPABASE_URL` | API container env var | Supabase project URL (transitional, while Supabase is still referenced). |
| `SUPABASE_SERVICE_ROLE_KEY` | API container secret | Supabase service role key (transitional). |
| `VITE_SUPABASE_URL` | `az acr build --build-arg` | Supabase URL baked into the web bundle at build time. |
| `VITE_SUPABASE_ANON_KEY` | `az acr build --build-arg` | Supabase anon key baked into the web bundle at build time. |
| `ENTRA_API_CLIENT_SECRET` | Bicep `--parameters` | Entra External ID (B2C) API app client secret (Bicep `@secure` param). |

### Optional (only needed for first provision or Entra wiring)

| Secret | Used by | Purpose |
|---|---|---|
| `AZURE_DEPLOYER_OBJECT_ID` | Bicep `--parameters` | Object ID of the SP/user granted Key Vault access. Get via `az ad sp show --id <appId> --query id -o tsv`. |
| `ENTRA_TENANT_ID` | Bicep `--parameters` | B2C tenant id (leave empty until Entra is wired up). |
| `ENTRA_API_CLIENT_ID` | Bicep `--parameters` | B2C API app (server) client id. |
| `ENTRA_SPA_CLIENT_ID` | Bicep `--parameters` | B2C SPA app (web) client id. |

### CI-only (ci.yml)

| Secret | Purpose |
|---|---|
| `SUPABASE_URL` | Migration smoke test (optional, skipped if unset). |
| `SUPABASE_SERVICE_ROLE_KEY` | Migration smoke test (optional, skipped if unset). |

## Provisioning

`infra/main.bicep` is **subscription-scoped** (it creates the resource group itself), so use:

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

The `deploy.yml` workflow does this automatically in the `provision` job (overriding the secure
params from GitHub Secrets). To skip provisioning on a code-only deploy, trigger the workflow
with the `skip-provision` input set to `true`.

### `main.parameters.json` Key Vault references

The three `@secure` Bicep params (`postgresAdminPassword`, `RESEND_API_KEY`,
`entraApiClientSecret`) are declared in `infra/main.parameters.json` as **Key Vault references**
pointing at `kvphgipkzrenusqpy` in `rg-partyhause-prod`. This lets you run `az deployment sub create`
manually without passing secrets on the CLI.

When deploying via `deploy.yml`, the workflow **overrides** these with `--parameters` from
GitHub Secrets, so the Key Vault references are not used by CI. They exist for manual/CLI deploys.

> Note: the Key Vault is currently empty — secrets are stored directly on the Container App via
> the Bicep `secrets` array, not pulled from Key Vault at runtime. To use the parameter-file
> Key Vault references, populate the vault first:
> ```bash
> az keyvault secret set --vault-name kvphgipkzrenusqpy --name PostgresAdminPassword --value "<pw>"
> az keyvault secret set --vault-name kvphgipkzrenusqpy --name ResendApiKey --value "<key>"
> az keyvault secret set --vault-name kvphgipkzrenusqpy --name EntraApiClientSecret --value "<secret>"
> ```

## Build-time vs runtime env vars (important)

- **`VITE_*` variables are BUILD-TIME ONLY.** Vite inlines them into the static bundle during
  `npm run build:web`. They are passed as `--build-arg` to `az acr build` in `deploy.yml`. Do
  **not** add them as runtime env vars on the web Container App — the nginx container only
  serves static files and does not read env vars.
- **API container** env vars/secrets are runtime. Secrets are referenced via `secretref:` and
  must already exist on the Container App (provisioned by Bicep's `secrets` array).

## CORS

`CORS_ALLOWED_ORIGINS` on the API Container App must equal the web Container App's public FQDN
(scheme + host, no trailing slash). Bicep sets this automatically from the web app output:
`'https://${webApp.outputs.fqdn}'`. If you change the web app's domain (e.g. custom domain),
update this in `infra/resources.bicep` and re-provision, or patch the live app:

```bash
az containerapp update -n ca-api-partyhause-gipkzrenusqpy -g rg-partyhause-prod \
  --set-env-vars CORS_ALLOWED_ORIGINS=https://<new-web-fqdn>
```

## Current prod resource names

- Resource group: `rg-partyhause-prod`
- ACR: `acrpartyhausegipkzrenusqpy` (`acrpartyhausegipkzrenusqpy.azurecr.io`)
- Web app: `ca-web-partyhause-gipkzrenusqpy` → `ca-web-partyhause-gipkzrenusqpy.calmtree-5b646dc8.eastus2.azurecontainerapps.io`
- API app: `ca-api-partyhause-gipkzrenusqpy` → `ca-api-partyhause-gipkzrenusqpy.calmtree-5b646dc8.eastus2.azurecontainerapps.io`
- Key Vault: `kvphgipkzrenusqpy`
- Storage: `stphgipkzrenusqpy`
- Postgres: `psqlphgipkzrenusqpy` (in `centralus`, not `eastus2` — see note in `resources.bicep`)
- Container Apps Env: `cae-partyhause-gipkzrenusqpy`
- Web PubSub: `wps-partyhause-gipkzrenusqpy`
- CIAM Tenant: `partyhause` (domain: `partyhause.onmicrosoft.com`)

## Migration status (Supabase → Azure)

| Phase | Status | Notes |
|---|---|---|
| 1. Database (Prisma + Azure PG) | ✅ Done | 36 models, 8 RPC functions, 7 triggers, 1 view. Templates seeded. |
| 2. Express API (Prisma routes) | ✅ Done | 16 route files in `server/routes/`, all wired into `server/index.ts`. Deployed. |
| 3. Frontend API client | ✅ Done | `src/lib/api-client.ts`. Events, guests, timeline, templates, polls, partycrew, feed, invites, cost-split, users, email-tracking all call Express API. |
| 4. Storage (Azure Blob) | ✅ Done | `server/routes/storage.ts` handles upload/delete/SAS. `src/lib/image-utils.ts` rewritten. Container `event-invites` with public blob read. |
| 5. Realtime (Web PubSub) | ✅ Done | `server/routes/realtime.ts` negotiate endpoint. `src/hooks/use-realtime.ts` uses socket.io-client. Broadcasts in events+guests routes. Fallback polling. |
| 6. Auth (Entra CIAM) | 🔄 In progress | CIAM tenant provisioning. App registrations + user flows + MSAL.js pending. |
| 7. Remove Supabase dependency | ⏳ Pending | Waiting for Phase 6 completion. |
| 8. Final verification | ⏳ Pending | |

### API routes (server/routes/)

| Route file | Base path | Endpoints |
|---|---|---|
| `events.ts` | `/api/events` | GET, POST, GET/:id, PUT/:id, DELETE/:id |
| `guests.ts` | `/api/guests` | GET, POST, PUT/:id, DELETE/:id |
| `timeline.ts` | `/api/timeline` | GET/:eventId, POST, PUT/:id, DELETE/:id |
| `polls.ts` | `/api/polls` | GET, POST, GET/:id, POST/:id/vote, POST/:id/close |
| `invite-templates.ts` | `/api/invite-templates` | GET, POST, PUT/:id, DELETE/:id |
| `event-templates.ts` | `/api/event-templates` | GET, GET/:id, POST/:id/create-event |
| `email-webhook.ts` | `/api/email-webhook` | POST (no auth, Resend webhook) |
| `email-logs.ts` | `/api/email-logs` | GET, POST, PUT/:id, GET/:id, GET/analytics/event |
| `connections.ts` | `/api/connections` | GET, POST, DELETE/:id |
| `partycrew.ts` | `/api/partycrew` | GET/members, GET/crewing-with, GET+POST/toggle, GET+POST+DELETE/requests |
| `users.ts` | `/api/users` | GET/suggested, GET/:id |
| `feed.ts` | `/api/feed` | GET/crew |
| `invites.ts` | `/api/invites` | POST/generate, POST/join, POST/convert-guest |
| `cost-split.ts` | `/api/cost-split` | GET/:eventId, POST, PUT/:id, DELETE/:id |
| `ai.ts` | `/api/ai` | POST/extract-event-details |
| `storage.ts` | `/api/storage` | POST/upload, DELETE/:blobName, GET/url/:blobName |
| `realtime.ts` | `/api/realtime` | GET/negotiate |

### Prisma commands

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (no migration files)
DATABASE_URL="postgresql://..." npx prisma db push

# Seed templates
DATABASE_URL="postgresql://..." npx tsx prisma/seed.ts

# Open Prisma Studio
DATABASE_URL="postgresql://..." npx prisma studio
```
