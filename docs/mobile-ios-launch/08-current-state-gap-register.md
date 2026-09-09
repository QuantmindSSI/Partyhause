# IOS-MVP-1 Current-State Gap Register

Audit date: September 5, 2026

Implementation baseline: `2cbf6a6cc4854c58aaecf79cfd461c76052927bd`

Method: Static repository inspection and existing automated tests

Scope: Difference between commit `2cbf6a6` and the approved IOS-MVP-1 specification

Changes after `2cbf6a6` are not credited in this snapshot. A later implementation change must be
audited against the same closure rule before this register changes.

Post-baseline implementation note, September 6, 2026: the current worktree adds token-version
session revocation, versioned signup consent, authenticated account facts, receipt-based permanent
deletion with retryable primary-store and owned-blob disposition, native Account and Delete Account
routes, replacement Privacy, Terms, and Support pages, and four versioned migrations. Production was
preflighted, enrolled in Prisma history, migrated, and verified on September 6. The baseline status
counts below remain unchanged until the full release audit in document 09 is complete.

## Status Rules

| Status | Meaning |
|---|---|
| `OPEN_BLOCKER` | Submission is blocked until evidence closes the gap |
| `OPEN_HIGH` | Material reliability or operability work remains; public submission is blocked by document 09 |
| `RESOLVED_AT_2CBF6A6` | Static code and tests at the baseline close the original defect |
| `REMOVED_FROM_IOS_MVP` | The former requirement is excluded; related release UI, routes, permissions, flags, and claims must be absent |

Removal is not implementation. A row marked `REMOVED_FROM_IOS_MVP` can still require deletion or
release gating when excluded code is reachable. `GAP-IOS-14` is the aggregate blocker for that
release-surface cleanup.

## Exact Status Count

| Status | Count |
|---|---:|
| `OPEN_BLOCKER` | 39 |
| `OPEN_HIGH` | 2 |
| `RESOLVED_AT_2CBF6A6` | 6 |
| `REMOVED_FROM_IOS_MVP` | 46 |
| **Total legacy gap IDs** | **93** |

Open IOS-MVP-1 gaps: 41. Removed rows remain traceable and are not counted as closed.

## Authentication And Account

| ID | Status | Evidence at `2cbf6a6` | Required disposition |
|---|---|---|---|
| `GAP-AUTH-01` | `RESOLVED_AT_2CBF6A6` | `src/lib/auth.ts` no longer stores a session after signup and returns `awaitingVerification` | Preserve no-session signup behavior |
| `GAP-AUTH-02` | `OPEN_BLOCKER` | `apps/mobile/components/screens/AuthScreen.tsx` still says signup is signing in and invokes the success route although signup returns no token | Route to `AUTH-04` and retain pending email |
| `GAP-AUTH-03` | `OPEN_BLOCKER` | Shared request shapes and database verification were corrected, but `src/pages/ResetPasswordPage.tsx` stores only the returned token and native account-action routes are absent | Make browser reset return safely to Sign In and test the complete cross-channel contract |
| `GAP-AUTH-04` | `RESOLVED_AT_2CBF6A6` | `src/lib/auth.ts` sends the email body and `src/pages/VerifyEmailPage.tsx` exposes resend without a session | Preserve anonymous, enumeration-safe resend |
| `GAP-AUTH-05` | `OPEN_BLOCKER` | Mobile route inventory has no check-email or forgot-password destination | Build `AUTH-04` and `AUTH-05`; use browser verification and reset pages |
| `GAP-AUTH-06` | `REMOVED_FROM_IOS_MVP` | Entra cannot establish an API session | Remove all external identity controls and metadata |
| `GAP-AUTH-07` | `REMOVED_FROM_IOS_MVP` | Broad creator, attendee, and vendor role switching is not part of the host-only app | Remove role selection and non-host dashboards from the release |
| `GAP-AUTH-08` | `OPEN_BLOCKER` | No deletion endpoint, route, worker, or data-disposition implementation exists | Build `ACC-01`, `OPS-03`, and the document 01 matrix |
| `GAP-AUTH-09` | `OPEN_BLOCKER` | `/api/auth/logout` is a no-op and JWTs cannot be revoked | Add server-side session revocation for sign-out, reset, and deletion |
| `GAP-AUTH-10` | `OPEN_HIGH` | Signup creates `User` and `UserProfile` in separate writes | Create account and required profile data transactionally |
| `GAP-AUTH-11` | `OPEN_BLOCKER` | Signup stores no age assertion or legal versions and can claim email was sent after contained delivery failure | Add versioned consent and truthful delivery state |
| `GAP-AUTH-12` | `OPEN_BLOCKER` | Mobile credentials and draft data use ordinary AsyncStorage | Move credentials to Keychain, remove legacy private cache, and clear on lifecycle boundaries |
| `GAP-AUTH-13` | `REMOVED_FROM_IOS_MVP` | Signed-in password change and session inventory were broad account settings | Keep them absent; IOS-MVP-1 uses recovery plus session revocation |
| `GAP-AUTH-14` | `OPEN_BLOCKER` | Home validates `/api/auth/me`, but `apps/mobile/app/events/_layout.tsx` still gates on token presence alone | Use one root validation gate for every protected route |

## Navigation And Browser Routes

| ID | Status | Evidence at `2cbf6a6` | Required disposition |
|---|---|---|---|
| `GAP-NAV-01` | `OPEN_BLOCKER` | Public, auth, and signed-in modes remain inside the Home tab | Split signed-out and signed-in stacks and implement the two approved tabs |
| `GAP-NAV-02` | `REMOVED_FROM_IOS_MVP` | The former native invite, poll, profile, notification, and pass deep-link set is excluded | Keep account actions and RSVP in the browser; remove native deep-link claims |
| `GAP-NAV-03` | `REMOVED_FROM_IOS_MVP` | Associated Domains are not configured | Do not add them for browser-only IOS-MVP-1 links |
| `GAP-NAV-04` | `REMOVED_FROM_IOS_MVP` | Legacy event, poll, profile, and guest URLs are outside the approved route set | Remove legacy links from IOS-MVP-1 email and metadata |
| `GAP-NAV-05` | `REMOVED_FROM_IOS_MVP` | Broad web application routing is not an IOS-MVP-1 host-app requirement | Limit release validation to the six registered browser surfaces |
| `GAP-NAV-06` | `RESOLVED_AT_2CBF6A6` | Starter modal route and root registration were deleted | Keep it absent |
| `GAP-NAV-07` | `OPEN_BLOCKER` | Mobile invitation output still links to `/events/:eventId` and creates no guest-scoped RSVP credential | Generate `https://partyhause.com/join/:token` per selected guest |

## Events And Lifecycle

| ID | Status | Evidence at `2cbf6a6` | Required disposition |
|---|---|---|---|
| `GAP-EVT-01` | `OPEN_BLOCKER` | Create ignores requested `published`, stores `draft`, while `apps/mobile/lib/mappers.ts` forces every event to `published` | Add explicit idempotent publish and preserve server status end to end |
| `GAP-EVT-02` | `REMOVED_FROM_IOS_MVP` | The former creation wizard coupled guest and timeline child writes to event creation | Replace it with one plain event form; manage guests after publish |
| `GAP-EVT-03` | `OPEN_BLOCKER` | Drafts are device-only AsyncStorage records | Persist one server draft and resume it by ID |
| `GAP-EVT-04` | `REMOVED_FROM_IOS_MVP` | Template wizard state is serialized through route parameters | Remove the wizard and its route-carried payload |
| `GAP-EVT-05` | `REMOVED_FROM_IOS_MVP` | The six former stub forms are implemented at the baseline, but event templates are not approved | Remove template gallery, routes, forms, and claims from the release |
| `GAP-EVT-06` | `REMOVED_FROM_IOS_MVP` | Smart brief and AI extraction are outside the manual event form | Remove AI entry and provider traffic from the release |
| `GAP-EVT-07` | `OPEN_BLOCKER` | Native event edit and cancellation remain inert, and excluded media, vendor, activity, and game actions remain visible | Implement approved edit/cancel/delete actions and remove every excluded action |
| `GAP-EVT-08` | `REMOVED_FROM_IOS_MVP` | Co-host management is excluded | Remove co-host UI, routes, metadata, and review data |
| `GAP-EVT-09` | `REMOVED_FROM_IOS_MVP` | Boolean co-host checks were fixed and tested, but co-hosts are excluded | Do not expose co-host capability in IOS-MVP-1 |
| `GAP-EVT-10` | `REMOVED_FROM_IOS_MVP` | Explore was deleted and public discovery is excluded | Keep public discovery absent |
| `GAP-EVT-11` | `OPEN_BLOCKER` | Event visibility still has both `privacy` and `is_public` and access treats either as public | Enforce one server-owned private value and reject client overrides |
| `GAP-EVT-12` | `OPEN_BLOCKER` | Schema lacks `cancelled`; generic update accepts arbitrary status; no completion job, revision, or lifecycle audit exists | Implement the document 01 state machine and bounded completion job |
| `GAP-EVT-13` | `OPEN_BLOCKER` | Event DTO allow-list and capability output exist, but mobile ignores capabilities and shows management controls for non-host relationships | IOS-MVP-1 list and detail must include owned events only and gate every action |
| `GAP-EVT-14` | `REMOVED_FROM_IOS_MVP` | Server and native template catalogs differ | Remove both catalogs from the release path |
| `GAP-EVT-15` | `OPEN_BLOCKER` | Current basics omit explicit timezone and fixed capacity; creation still starts at a template gallery | Replace with the plain private event contract and fixed cap 50 |
| `GAP-EVT-16` | `OPEN_BLOCKER` | API lists hosted, co-hosted, and invited events; dashboard has no error state and mapper discards relationship and status | Return and render only owned events for IOS-MVP-1 with explicit error state |

## Guests, Invitations, RSVP, And Attendance

| ID | Status | Evidence at `2cbf6a6` | Required disposition |
|---|---|---|---|
| `GAP-INV-01` | `REMOVED_FROM_IOS_MVP` | The current invitation composer is a design and customization flow with fixed event data | Remove composer and templates; `INV-01` uses fixed server output |
| `GAP-INV-02` | `OPEN_BLOCKER` | `apps/mobile/app/events/[id]/invites/send.tsx` uses four fixed recipients | Load actual owned-event guests and submit guest IDs |
| `GAP-INV-03` | `OPEN_BLOCKER` | Mobile sends generic content with a wrong URL and reports success without checking `result.success` | Server-render fixed content and show per-recipient confirmed outcomes |
| `GAP-INV-04` | `RESOLVED_AT_2CBF6A6` | `/api/send-email` requires auth, uses a user-keyed limiter, checks invite authority and guest membership, caps recipients, and sanitizes HTML; 13 tests pass | Preserve these controls while moving rendering server-side |
| `GAP-INV-05` | `REMOVED_FROM_IOS_MVP` | Reusable and visual invitation templates are excluded | Remove template APIs and UI from the release path |
| `GAP-INV-06` | `OPEN_BLOCKER` | `/join/:token` auto-submits without anonymous name/email and exposes PartyCrew conversion behavior instead of RSVP controls | Build one read-before-write browser RSVP flow bound to an existing guest |
| `GAP-INV-07` | `REMOVED_FROM_IOS_MVP` | Legacy `/event/:eventId/guest/:guestId` access is not approved | Remove raw-ID guest links and keep only token-scoped browser RSVP |
| `GAP-INV-08` | `OPEN_BLOCKER` | Allowed emails are not enforced, token listing and revocation are absent, plaintext tokens are stored, and usage plus guest creation is not one transaction | Replace with hashed single-guest credentials, expiry, revocation, and transaction safety |
| `GAP-INV-09` | `OPEN_BLOCKER` | Guest schema lacks `(event_id, normalized_email)` uniqueness | Normalize and enforce uniqueness transactionally |
| `GAP-INV-10` | `REMOVED_FROM_IOS_MVP` | Multiple QR formats exist | Remove QR invitation, pass, and check-in behavior |
| `GAP-INV-11` | `REMOVED_FROM_IOS_MVP` | No native scanner is installed | Keep scanner and camera permission absent |
| `GAP-INV-12` | `OPEN_BLOCKER` | Routed guest screen lists and toggles check-in but lacks complete add, edit, remove, and cap behavior | Implement `GST-01` and `GST-02` against host-authorized APIs |
| `GAP-INV-13` | `OPEN_BLOCKER` | Client can update delivery fields on an email-log ID without owner verification; webhook verification is optional; analytics route is shadowed by `/:id` | Make delivery state provider-owned, fail closed, fix route order, and expose only supported evidence |
| `GAP-INV-14` | `REMOVED_FROM_IOS_MVP` | Declined and pending poll participation was fixed, while approval and polls are not approved | Keep approval and participant features absent; use the four RSVP states only |
| `GAP-INV-15` | `OPEN_BLOCKER` | Check-in is still a generic guest update, rewrites timestamps, permits correction without audit, and has no idempotency key | Add dedicated host-only check-in and correction commands for accepted guests |

## Planning, Costs, Games, And Scale

| ID | Status | Evidence at `2cbf6a6` | Required disposition |
|---|---|---|---|
| `GAP-PLAN-01` | `REMOVED_FROM_IOS_MVP` | Timeline still has JSON and relational write paths even though event DTO no longer emits the JSON field | Remove timeline UI and traffic from the release |
| `GAP-PLAN-02` | `REMOVED_FROM_IOS_MVP` | DTO serialization prevents the former host-note leak, but timeline is excluded | Keep timeline absent rather than claim completion |
| `GAP-PLAN-03` | `REMOVED_FROM_IOS_MVP` | Timeline editing and reminders are excluded | Remove activity routes and controls |
| `GAP-PLAN-04` | `REMOVED_FROM_IOS_MVP` | Native poll UI is absent | Keep polls absent |
| `GAP-PLAN-05` | `REMOVED_FROM_IOS_MVP` | Poll ranking, selection, quorum, and consensus behavior is excluded | Remove poll claims and links |
| `GAP-PLAN-06` | `REMOVED_FROM_IOS_MVP` | Cost API and UI are outside scope | Remove cost and reimbursement surfaces |
| `GAP-PLAN-07` | `REMOVED_FROM_IOS_MVP` | Reimbursement positioning is outside the no-payment product | Do not expose cost status or payment wording |
| `GAP-PLAN-08` | `REMOVED_FROM_IOS_MVP` | Native PartyBoard routes were deleted; web endpoints remain absent | Keep PartyBoard absent |
| `GAP-PLAN-09` | `REMOVED_FROM_IOS_MVP` | Games routes were deleted or deferred | Keep all games absent |
| `GAP-PLAN-10` | `REMOVED_FROM_IOS_MVP` | Former large-list targets no longer apply | Enforce the new 50-guest cap; no broad feed or board scale claim |

## PartyCrew, Notifications, Legal, And Support

| ID | Status | Evidence at `2cbf6a6` | Required disposition |
|---|---|---|---|
| `GAP-SOC-01` | `REMOVED_FROM_IOS_MVP` | PartyCrew is reachable at `/(tabs)/partycrew` and renders `PartyCrewFeedScreen` | Remove the tab, route, feed calls, and metadata from IOS-MVP-1 |
| `GAP-SOC-02` | `REMOVED_FROM_IOS_MVP` | Like, unlike, comments, replies, and share APIs now exist; post creation and safety remain incomplete | Remove all feed and interaction surfaces rather than claim social completion |
| `GAP-SOC-03` | `REMOVED_FROM_IOS_MVP` | PartyCrew relationship state is excluded | Remove relationship actions |
| `GAP-SOC-04` | `REMOVED_FROM_IOS_MVP` | Crew request inbox and transactional behavior are excluded | Remove request routes from the release UI |
| `GAP-SOC-05` | `REMOVED_FROM_IOS_MVP` | Social blocking is excluded with the social product | Remove social visibility and block claims |
| `GAP-SOC-06` | `REMOVED_FROM_IOS_MVP` | Social reporting and moderation are excluded with all social and collaborative content | Remove those content surfaces; reassess before re-entry |
| `GAP-SOC-07` | `REMOVED_FROM_IOS_MVP` | Social profile editing and profile media are excluded | Keep only the account display name required by signup |
| `GAP-SOC-08` | `REMOVED_FROM_IOS_MVP` | Native notification center and typed destinations are absent | Keep notifications absent |
| `GAP-SOC-09` | `REMOVED_FROM_IOS_MVP` | APNs and push preferences are absent | Keep push entitlement, prompt, token, and claims absent |
| `GAP-SOC-10` | `OPEN_BLOCKER` | Public Privacy, Terms, and Support pages still describe retired providers, contacts, templates, media, social login, and email-only deletion | Replace public pages with the IOS-MVP-1 data map and in-app deletion truth |
| `GAP-SOC-11` | `REMOVED_FROM_IOS_MVP` | Social visibility settings are excluded | Remove privacy controls that describe absent social behavior |
| `GAP-SOC-12` | `REMOVED_FROM_IOS_MVP` | Suggested-user discovery is excluded | Remove discovery and private-profile request claims |

## Privacy, App Store, Security, And Operations

| ID | Status | Evidence at `2cbf6a6` | Required disposition |
|---|---|---|---|
| `GAP-IOS-01` | `OPEN_BLOCKER` | Per-contact picker replaced bulk import, but contact UI, dependency, and usage description remain | Remove contacts and every other sensitive permission from IOS-MVP-1 |
| `GAP-IOS-02` | `OPEN_BLOCKER` | No candidate privacy report, app manifest review, required-reason audit, or listed-SDK signature audit exists | Produce and reconcile archive evidence |
| `GAP-IOS-03` | `OPEN_BLOCKER` | Public policy is stale and no implemented retention schedule matches document 01 | Implement the matrix and publish accurate policy and App Privacy answers |
| `GAP-IOS-04` | `OPEN_BLOCKER` | At baseline, EAS has an unbounded CLI version, remote version source without project ID, an empty iOS submit profile, no signed archive, and no mobile CI gate | Make the iPhone build reproducible and retain App Store processing evidence |
| `GAP-IOS-05` | `RESOLVED_AT_2CBF6A6` | `docs/README.md` classifies former mobile deployment claims as historical and makes this directory authoritative | Preserve classification and authority |
| `GAP-IOS-06` | `RESOLVED_AT_2CBF6A6` | Stale infrastructure documents were deleted and the documentation map records the audit | Keep current technical claims grounded in code |
| `GAP-IOS-07` | `OPEN_BLOCKER` | No repository evidence proves App Store record, agreements, price, regions, age rating, DSA, export, privacy, screenshots, or review access | Complete and retain the non-secret submission package |
| `GAP-IOS-08` | `REMOVED_FROM_IOS_MVP` | Config still declares tablet support, but iPad is no longer approved | Set iPhone-only device family and remove tablet screenshots and tests |
| `GAP-IOS-09` | `OPEN_BLOCKER` | No deletion, event-expiry, invitation-recovery monitoring, bounded jobs, or staff process exists | Implement `OPS-01` through `OPS-03`; moderation is not part of this scope |
| `GAP-IOS-10` | `REMOVED_FROM_IOS_MVP` | Realtime is not integrated safely on mobile | Remove negotiation and realtime claims from the release |
| `GAP-IOS-11` | `OPEN_BLOCKER` | No migration history or deploy migration exists; invite routes depend on unmanaged SQL functions | Add versioned schema deployment and verify it before API rollout |
| `GAP-IOS-12` | `OPEN_BLOCKER` | No deterministic review seed, database actor matrix, native route suite, browser RSVP suite, or physical-device evidence proves the six cases | Build candidate-bound evidence for documents 05 and 09 |
| `GAP-IOS-13` | `REMOVED_FROM_IOS_MVP` | The former persisted offline, pass, maintenance, and required-update destination set is not approved | Provide honest inline network errors; make no offline feature claim |
| `GAP-IOS-14` | `OPEN_BLOCKER` | PartyCrew, templates, timeline, contacts, CSV unavailable action, media/vendor actions, social copy, and other excluded behavior remain reachable or bundled | Enforce the 14-screen allow-list and inspect binary, flags, metadata, and traffic |
| `GAP-IOS-15` | `OPEN_BLOCKER` | Email and webhook paths log recipient or payload data and several APIs return raw exception messages | Use allow-listed redacted logs and opaque client errors |
| `GAP-IOS-16` | `OPEN_BLOCKER` | Core mobile controls lack systematic accessibility properties and no native accessibility suite exists | Implement document 03 and pass all six cases with required modes |
| `GAP-IOS-17` | `OPEN_HIGH` | Mobile has no privacy-reviewed crash or performance instrumentation | Add bounded redacted release telemetry or document an approved equivalent monitoring path |
| `GAP-IOS-18` | `REMOVED_FROM_IOS_MVP` | Blob and image ownership weaknesses concern excluded media | Remove media calls, controls, dependencies, and disclosure claims from the release |
| `GAP-IOS-19` | `OPEN_BLOCKER` | Guest and invite boundaries lack normalized email, collection, 50-guest, token-policy, and field bounds | Add explicit schemas, database constraints, typed errors, rate limits, and negative tests |

## Submission-Critical Sequence

### Gate 1: Enforce the approved surface

1. Replace current navigation with the 14-screen allow-list.
2. Remove every `REMOVED_FROM_IOS_MVP` route, control, permission, dependency path, flag, seed, and
   metadata claim from the release.
3. Set the target to iPhone only.

### Gate 2: Complete identity and deletion

1. Complete native signup handoff, Check Email, Forgot Password, browser actions, and root session
   validation.
2. Move credentials to Keychain and add revocable sessions.
3. Implement versioned consent and `ACC-01` plus `OPS-03`.

### Gate 3: Make event and guest state authoritative

1. Implement the four-state event lifecycle, private-only enforcement, one-host rule, revision
   checks, and server drafts.
2. Implement normalized guest uniqueness and the hard 50-guest cap.
3. Replace generic check-in with idempotent host-only commands and audit.

### Gate 4: Complete invitation and browser RSVP

1. Replace fixed recipients and client HTML with guest-ID selection and fixed server rendering.
2. Create hashed single-guest RSVP tokens with expiry and revocation.
3. Build account-free browser RSVP and truthful provider-owned delivery state.

### Gate 5: Complete release evidence

1. Implement migrations, data-expiry jobs, redaction, monitoring, and deterministic review data.
2. Reconcile public legal pages, App Privacy, privacy manifests, permissions, processors, and
   observed traffic.
3. Pass all six cases, accessibility coverage, security tests, archive validation, and App Review
   rehearsal on the selected iPhone candidate.

## Closure Evidence Rule

An open gap closes only when all applicable evidence exists:

- Release-enabled implementation at a named commit.
- API, authorization, boundary, concurrency, and idempotency tests.
- Native or browser loading, empty, failure, offline, and retry tests.
- Accessibility verification.
- Privacy, retention, and App Store reconciliation.
- Applicable end-to-end case on the release candidate.
- Production-like logs and monitoring without sensitive-value leakage.

A removed gap is complete for release only when route, control, binary, metadata, permission, flag,
seed, and network inspection prove the excluded capability absent. Its status remains
`REMOVED_FROM_IOS_MVP`.
