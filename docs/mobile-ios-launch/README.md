# PartyHause Mobile iOS Launch Specification

Version: 1.0  
Status: Proposed launch baseline  
Research and repository audit date: September 3, 2026  
Target: PartyHause 1.0 for the public Apple App Store

## Purpose

This directory is the canonical product, experience, flow, compliance, and release specification for the PartyHause iOS application. It converts the current web app, Expo app, Express API, and Prisma data model into one launchable mobile product.

The specification does four things:

1. Names every app-owned screen in the iOS 1.0 scope.
2. Defines every canonical user and operational flow.
3. Provides exactly 10 end-to-end cases that collectively exercise every screen and flow.
4. Defines the technical, privacy, safety, quality, and App Store submission gates for launch.

## How To Read This Directory

| Document | Purpose |
|---|---|
| [01-product-scope.md](./01-product-scope.md) | Product boundaries, actors, launch decisions, and success criteria |
| [02-information-architecture.md](./02-information-architecture.md) | Navigation model and the canonical registry of 80 app-owned screens |
| [03-experience-and-screen-contracts.md](./03-experience-and-screen-contracts.md) | State-of-the-art mobile design language and behavior required on every screen |
| [04-user-flow-catalog.md](./04-user-flow-catalog.md) | Registry of 35 user and operational flows, including failure paths |
| [05-ten-end-to-end-cases.md](./05-ten-end-to-end-cases.md) | Ten acceptance scenarios spanning the complete product |
| [06-coverage-matrix.md](./06-coverage-matrix.md) | Proof that all screens, flows, native surfaces, overlays, and operations are covered |
| [07-ios-app-store-launch-requirements.md](./07-ios-app-store-launch-requirements.md) | Apple, privacy, UGC, account, metadata, build, and submission requirements |
| [08-current-state-gap-register.md](./08-current-state-gap-register.md) | Evidence-based gaps between the repository and the launch target |
| [09-release-validation-plan.md](./09-release-validation-plan.md) | Test matrix, review-account setup, release gates, rollout, and monitoring |
| [10-official-sources.md](./10-official-sources.md) | Official Apple references and repository evidence used by this specification |

## Canonical Counts

| Registry | Count |
|---|---:|
| App-owned screens | 80 |
| Canonical flows | 35 |
| End-to-end cases | 10 |
| Native permission and handoff surfaces | 9 |
| Reusable overlays | 9 |
| Operational workflows | 7 |

Every registered item is assigned a stable ID. Product requirements, design files, routes, analytics, tests, and release notes should use these IDs.

## Launch Definition

PartyHause 1.0 is a free, account-based event planning and participation app for iPhone and iPad. It lets a person host, co-host, or attend events without switching account roles. The launch product includes:

- Account creation, email verification, sign-in, password recovery, profile setup, and account deletion.
- Hosted, co-hosted, and invited event lists.
- Event creation from a smart brief, a validated template, or a blank event.
- Server-backed drafts, publishing, editing, lifecycle controls, co-host permissions, and event insights.
- Guest management, invitation design and delivery, share links, RSVP, guest passes, and QR check-in.
- Timeline, polls, a reimbursement-only cost ledger, and a persistent collaborative PartyBoard.
- Two complete shared-device games: General Trivia and Getting to Know You.
- PartyCrew feed, profile discovery, connections, requests, posts, comments, reports, and blocking.
- In-app notifications, a complete opt-in push implementation, privacy controls, legal content, and support.
- Safe deep links, offline-safe read access, maintenance handling, and required-update handling.

## Explicit 1.0 Exclusions

The following are not part of this launch specification and must not appear as active or disabled product controls in the submitted build:

- Ticket sales, ticket wallets, paid admission, checkout, refunds, and promo codes.
- Vendor marketplace, vendor profiles, services, bookings, earnings, and reviews.
- Event chat, direct messages, random chat, and live presence.
- Shared photo albums, event memories, highlight reels, and face recognition.
- Public or nearby event marketplace discovery.
- Unsupported games, multiplayer lobbies, leaderboards, and Game Center.
- In-app money movement for cost shares.
- Advertising, cross-app tracking, and IDFA collection.
- External identity buttons until their tokens are accepted by the PartyHause API.

These boundaries reduce review risk and prevent the app from advertising behavior that is not complete.

## Product Decisions

| Area | Launch decision |
|---|---|
| Account roles | Hosting, co-hosting, and attendance are contextual event relationships, not permanent user roles |
| Authentication | PartyHause email and password at launch; external identity controls remain hidden until fully integrated |
| Monetization | Free 1.0 build with no In-App Purchases and no external digital purchase links |
| Cost split | Reimbursement record only; PartyHause does not process payments |
| Social safety | No social or collaborative write surface ships before filtering, reporting, blocking, moderation, and support are operational |
| Permissions | Requested only when the user invokes the related feature; no first-launch permission wall |
| Photos | Use the system photo picker for selected images; do not request broad library access unless the implementation truly requires it |
| Location | Use typed addresses and Apple Maps handoff; do not request device location in 1.0 |
| Camera | Used only for host/co-host QR check-in |
| Microphone | Not used in 1.0; remove its usage description from the release binary |
| Devices | Native adaptive layouts for iPhone and iPad because the current Expo config declares tablet support |
| Minimum OS | Product baseline is iOS and iPadOS 17.0; the submission SDK requirement is tracked separately |
| Offline | Cached event facts, visible timeline, guest pass, legal content, and help content are readable; server mutations do not claim offline completion |
| Release | Manual first release after App Review approval, with staffed support and moderation |

## Authority And Change Control

This directory supersedes older mobile readiness documents where they conflict with current code or current Apple requirements. In particular, older claims of complete mobile parity, complete publishing, complete email delivery, complete PartyBoard persistence, or production readiness are not treated as launch evidence.

A change to launch scope must update, in the same change set:

1. The screen registry.
2. The flow registry.
3. At least one end-to-end case.
4. The coverage matrix.
5. The gap register.
6. The App Store privacy and metadata assessment when data behavior changes.
7. The release validation plan.

## Status Vocabulary

| Status | Meaning |
|---|---|
| `ADAPT` | Durable API behavior and a functioning UI exist; the work is native adaptation and hardening |
| `PORT` | Backend capability exists, but the native destination is absent or materially incomplete |
| `HARDEN` | Current behavior is mocked, local-only, misleading, insecure, or contract-inconsistent |
| `BUILD` | Required backend or end-to-end workflow does not exist |
| `NATIVE` | The work is an iOS or application-shell integration |
| `REMOVE` | A visible feature or permission must be removed from the release build |

## Definition Of Launch Ready

The app is launch ready only when all of the following are true:

- All 80 app-owned screens meet their screen contracts and required states.
- All 35 flows pass their happy path, primary failure paths, authorization paths, and recovery paths.
- All 10 end-to-end cases pass on supported iPhone and iPad devices.
- No release surface is backed only by mock data or a device-only record that the UI represents as synchronized.
- All App Store mandatory requirements in document 07 are evidenced and signed off.
- All release blockers in document 08 are closed or the related feature is removed from the binary and metadata.
- The release validation gates in document 09 pass with no open critical or high-severity defects.
- App Review receives a stable demo account, sample invitation link, sample guest QR, complete review notes, and a live backend.
