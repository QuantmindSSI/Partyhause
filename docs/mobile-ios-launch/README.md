# IOS-MVP-1 Canonical Launch Specification

Version: 1.0

Status: Approved

Scope decision date: September 5, 2026

Implementation audit baseline: `2cbf6a6`

Distribution target: Public Apple App Store

## Authority

This directory is the product and release authority for IOS-MVP-1. `AGENTS.md` remains the
authority for repository implementation facts. When implementation differs from this specification,
the difference is an open gap, not permission to expand the release.

IOS-MVP-1 is a host-only iPhone app for private events. A guest receives an email and responds in a
browser. A guest does not install, sign in to, or enter the native app.

## Document Map

| Document | Purpose |
|---|---|
| [01-product-scope.md](./01-product-scope.md) | Approved boundaries, exact product rules, and data disposition |
| [02-information-architecture.md](./02-information-architecture.md) | Navigation and the complete screen, browser, overlay, and operation registries |
| [03-experience-and-screen-contracts.md](./03-experience-and-screen-contracts.md) | Interaction, state, accessibility, and performance contracts |
| [04-user-flow-catalog.md](./04-user-flow-catalog.md) | The complete six-flow registry |
| [05-end-to-end-cases.md](./05-end-to-end-cases.md) | Six release acceptance cases |
| [06-coverage-matrix.md](./06-coverage-matrix.md) | Traceability from every registered item to a case |
| [07-ios-app-store-launch-requirements.md](./07-ios-app-store-launch-requirements.md) | Applicable Apple, privacy, security, accessibility, and submission requirements |
| [08-current-state-gap-register.md](./08-current-state-gap-register.md) | Gap status at implementation commit `2cbf6a6` |
| [09-release-validation-plan.md](./09-release-validation-plan.md) | Candidate tests, release gates, review rehearsal, and operations |
| [10-official-sources.md](./10-official-sources.md) | Official Apple sources and repository evidence |

## Canonical Counts

| Registry or limit | Exact value |
|---|---:|
| Native iPhone screens | 14 |
| Browser surfaces | 6 |
| Canonical flows | 6 |
| End-to-end cases | 6 |
| Reusable overlays | 3 |
| Operational workflows | 3 |
| Hosts per event | 1 |
| Guests per event | 50 |
| Native sensitive-permission prompts | 0 |

These values are release invariants. A change to any value requires updates to documents 01, 02,
04, 05, 06, 07, 08, and 09 in the same change.

## Included Product

- First-party email and password registration, verification, sign-in, sign-out, session restore,
  password recovery, and permanent account deletion.
- Private event creation, draft save, publish, edit, completion, cancellation, and deletion.
- Exactly one account owner and host for each event.
- Manual guest entry and management for at most 50 guests per event.
- A fixed, server-rendered invitation email sent only to selected guests of the host's event.
- Browser RSVP without an account or native guest session.
- RSVP states `pending`, `accepted`, `maybe`, and `declined`.
- Host-only attendance totals, manual check-in, and explicit check-in correction.
- Public Privacy Policy, Terms of Service, and Support pages.

## Excluded Product

Every item below has disposition `REMOVED_FROM_IOS_MVP`. It must be absent from native navigation,
remote flags, review data, screenshots, metadata, permissions, and marketing for this release.

- PartyCrew, feeds, profiles, discovery, connections, social posts, comments, reports, and blocking.
- Event templates, invitation templates, smart briefs, and template-specific forms.
- Timeline, polls, PartyBoard, cost sharing, and games.
- Co-hosts or any second event administrator.
- Native guest mode, guest accounts, guest passes, and guest-facing native event views.
- Push notifications, in-app notifications, realtime updates, and live presence.
- Media upload, event photos, avatars, covers, invitation artwork, and photo memories.
- Contacts access or import.
- Camera access, QR invitations, QR passes, and QR check-in.
- iPad support and iPad screenshots.
- Android launch, Android store submission, and Android launch validation.
- Tickets, paid admission, subscriptions, purchases, reimbursements, external payment links, and any
  other payment flow.
- Public event discovery, nearby events, vendors, chat, location access, and external identity login.

Code or database models for an excluded capability may remain in the repository. The release build
must not expose or advertise them.

## Gap Status Vocabulary

| Status | Meaning |
|---|---|
| `OPEN_BLOCKER` | IOS-MVP-1 cannot be submitted while the gap remains |
| `OPEN_HIGH` | Material security, reliability, privacy, or operability work remains |
| `RESOLVED_AT_2CBF6A6` | Static evidence at the audit commit proves the stated defect closed |
| `REMOVED_FROM_IOS_MVP` | The former requirement is not approved; the related release surface must be removed |

`REMOVED_FROM_IOS_MVP` never means implemented or resolved. Re-entry requires a later approved
scope and a new privacy, security, accessibility, App Review, flow, case, and release assessment.

## Definition Of Ready

IOS-MVP-1 is ready only when:

- All registered native and browser surfaces implement their contracts.
- All six flows and all six cases pass against the release candidate.
- The app is iPhone-only and exposes only the approved host workflow.
- The one-host and 50-guest limits are enforced by the API, database, and client.
- Browser RSVP is token-scoped, account-free, idempotent, and private.
- No sensitive iOS permission is declared or requested.
- Account deletion follows the disposition matrix in document 01.
- Every `OPEN_BLOCKER` in document 08 is closed with evidence.
- Every release gate in document 09 passes.
- App Store metadata and Review Notes describe this exact product.
