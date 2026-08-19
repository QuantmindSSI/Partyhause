# Security Review Record — August 2026 (PR #8)

Adversarial review of the "complete coming-soon features" work (email verification, password reset, notifications, privacy, AI event planner) before it merged to `main`. Full thread on PR [#8](https://github.com/QuantmindSSI/Partyhause/pull/8); this file records the findings, resolutions and standing follow-ups so they are not lost in PR history.

**Verdict history:** BLOCKED → all must-fix items resolved and empirically verified → CodeQL surfaced 9 additional high alerts on the fix push → resolved → merged.

---

## Blockers (fixed)

| ID | Finding | Resolution |
|---|---|---|
| B1 | **Email send was a no-op in every environment.** `require('resend')` inside an ESM project (`"type": "module"`, run via tsx) throws `ReferenceError`; the catch swallowed it — no verification or reset email was ever sent, even with a valid key. | Top-level `import { Resend } from 'resend'` in `server/routes/auth.ts`; shared `sendAuthEmail()` used by both flows. Runtime-probed: signup 201, no ReferenceError. |
| B2 | **Raw verification/reset tokens logged unconditionally** — anyone with production log access could take over the flows. | `logAuthLinkInDev()` gated on `NODE_ENV !== 'production'`. |

## Major (fixed)

| ID | Finding | Resolution |
|---|---|---|
| M2 | **User enumeration** via response differences on `/verify-email` (404 unknown / 200 already-verified / 400 no-pending) and `/forgot-password` (404 "no account"). | Uniform single failure response on `verify-email`, `forgot-password`, `reset-password` regardless of account existence/state. |
| M3 | **Zero rate limiting**: bcrypt-per-call credential endpoints and metered LLM endpoints were unlimited (CPU + cost abuse). | Three tiers: umbrella `300/min per IP` on all `/api`; `credentialLimiter 20/15min per IP` on signup/login/verify/resend/forgot/reset; AI `30/5min per user` mounted **after** `requireAuth` so per-user keying works. `trust proxy 1` set for real client IPs behind Azure ingress. Empirically probed: 429 at request 20 on credentials; `/me` unlimited. |
| M4 | **Stored XSS** via `website_url` (length-only validation; rendered via `window.open` — a stored `javascript:` URL executes on click). | Server-side scheme validation: must match `^https?:\/\//i`. |
| M5 | **Azure LLM path silently dead**: bicep deployed `gpt-5-mini` but the code defaulted to API version `2024-06-01`, which rejects the request shape → heuristic fallback on every call. | Code default → `2024-12-01-preview`; `AZURE_OPENAI_API_VERSION` pinned in `infra/resources.bicep`. |
| M6 | **Production email links pointed to localhost** (`VITE_APP_URL` never provisioned on the API container). | `VITE_APP_URL = https://<web fqdn>` added to the API container env in bicep. |

## CodeQL findings on the fix push (fixed)

- **5 × `js/polynomial-redos`** in `server/lib/event-extraction.ts`: unbounded quantifiers scanning user input (`\d+` digit runs, `[\d,]+` comma runs, adjacent `\s+ \s*` pairs). Fixed with bounded quantifiers (`\d{1,6}`, `\s{1,3}`, `\d[\d,]{0,14}`), plus containment at the heuristic entry: input capped at 2,000 chars and whitespace runs collapsed, making total work provably sub-millisecond. Worst crafted attack measured at 33 ms (previously unbounded quadratic). All 36 extraction/chat tests pass unchanged.
- **4 × `js/missing-rate-limiting`** on authenticated DB routes (`users`, `notifications`, `ai`): covered by the umbrella limiter above.

## Accepted / standing follow-ups

| ID | Item | Status |
|---|---|---|
| M1 | `email_verified` is recorded but **gates nothing** (login and event creation don't check it). | Deliberate for now; enforcement is a product decision. When decided, enforce **server-side**. |
| M7 | `/api/ai/chat` has **no client UI** — endpoint is tested and rate-limited but unreachable from the app. | Ship the client or remove the endpoint. |
| M8 | Schema added `users.email_verified` / `verification_token` / `verification_token_expires`. | **Deploy order:** run `prisma db push` BEFORE deploying the API image, otherwise every user lookup 500s with P2022. |
| — | Minor items from review: dead `@unique` index on the hashed verification token; `ResetPasswordPage` auto-signin doesn't hydrate the persisted store; `VerifyEmailPage` dead-end for signed-out users with expired links; notifications GET is `take`-only (no cursor); email addresses appear in link query strings (PII in access logs — consequence of hash-only token storage). | Tracked, non-blocking. |

## Related fixes merged in the same cycle

- PR [#4](https://github.com/QuantmindSSI/Partyhause/pull/4): `AUTH_BYPASS` no longer clobbers real sessions (token verified first); bypass identity materialized idempotently; bypass remains hard-disabled in production.
