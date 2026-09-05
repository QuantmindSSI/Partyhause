# Product Scope And Principles

## Product Promise

PartyHause helps people plan an event together, bring guests into the experience, run the gathering, and keep useful social connections afterward. The mobile product should make the next meaningful action obvious without forcing a person to understand internal concepts such as creator, attendee, vendor, or database status.

## Outcomes

### Host outcome

A host can create a real event, publish it, invite people, coordinate details, make group decisions, check guests in, and understand attendance without leaving the app.

### Guest outcome

A guest can open an invitation, respond with relevant details, see the event schedule, participate in planning, show an entry pass, and manage their social and cost-share relationships safely.

### Community outcome

A member can find known or relevant people, form PartyCrew relationships, publish and consume moderated content, control visibility, report abuse, block users, and leave the service completely.

### Business outcome

The first App Store release is credible, supportable, measurable, and compliant. It does not expose speculative product surfaces or make claims that the backend cannot uphold.

## Actors

| Code | Actor | Description |
|---|---|---|
| `V` | Visitor | Signed-out person, including an anonymous invitation recipient |
| `M` | Member | Signed-in, verified PartyHause account |
| `G` | Guest | Event guest identity attached to a guest record |
| `G-auth` | Authenticated guest | Verified member session linked to an accepted and, where required, approved guest record |
| `G-token` | Token-scoped guest | Signed-out invitee holding a valid scoped credential for RSVP, permitted event details, timeline, and pass only |
| `H` | Host | Event owner with full event administration |
| `C` | Co-host | Member with explicit event-level permissions |
| `O` | Operator | Internal support or moderation staff using protected operational tooling outside the consumer app |
| `ALL` | Any applicable actor | Surface can be used signed in or signed out, subject to its data scope |

One person may be `M`, `G-auth`, `H`, and `C` across different events. `G-token` never enters authenticated tabs, PartyCrew, polls, PartyBoard, costs, or games. The app and API derive every event action from the current relationship and credential rather than a client-only account role.

## Core Product Principles

### 1. One account, contextual capabilities

- Every verified member can create an event.
- Host, co-host, and guest capabilities are calculated per event.
- A user never switches the entire application into a creator, attendee, or vendor mode.
- Hidden actions are preferable to disabled actions when the actor has no permission.
- A permission change takes effect on the next protected request and updates the open screen.

The launch co-host permission vocabulary is:

| Permission | Capability |
|---|---|
| `edit_event` | Edit core and template-specific event details |
| `manage_timeline` | Create, edit, reorder, hide, and delete timeline entries |
| `invite_guests` | Compose invitations, select recipients, and send or retry eligible delivery |
| `manage_guests` | Add, edit, remove, approve, and reject guest records |
| `check_in_guests` | Search, scan, check in, and correct a check-in with audit history |
| `moderate_event_content` | Moderate event polls and PartyBoard content within published policy |
| `view_insights` | View attendance and invitation analytics |

The host has every permission. Each co-host permission is an independent server-stored boolean and is checked on every protected endpoint.

### 2. Server truth over optimistic fiction

- A publish confirmation is shown only after the server stores a published state.
- Invitation success reflects accepted provider requests for every displayed recipient.
- A local draft is labeled as device recovery data, not as a synchronized draft.
- A failed child operation during event creation leaves a visible draft with a recovery action.
- Mock records are allowed in tests and App Review seed data, not in the production experience.

### 3. Invitation-first guest experience

- An invitation link opens a useful event preview before account creation.
- Opening a link does not consume it or create a guest record.
- Anonymous RSVP is supported when the token policy allows it.
- Authentication, installation, and verification preserve the intended destination.
- RSVP updates an existing invitation record instead of creating duplicates.

### 4. Safety before social scale

- Every visible item of user-generated content has a report entry point.
- Every public or social profile has a block entry point.
- Blocking is enforced by the server across feed, profiles, discovery, connections, notifications, comments, polls, and PartyBoard collaboration.
- Text is filtered before publication and can be quarantined for review.
- Operators have a documented response process, audit history, appeal handling, and emergency escalation.
- Support contact details and community standards are accessible without authentication.

### 5. Native behavior without permission pressure

- Navigation follows iOS back, sheet, share, keyboard, safe-area, and accessibility conventions.
- Notifications, contacts, camera, and photo selection are requested at the moment of need.
- Denying a permission never blocks unrelated functionality.
- Every permission-backed action has a non-permission fallback where one is practical.
- The app never asks for microphone or location access in 1.0 because those capabilities are outside scope.

### 6. Recovery is part of every flow

- Loading, empty, error, offline, stale, forbidden, and deleted states are designed states.
- A retry does not duplicate event creation, invitations, RSVP, check-in, votes, costs, reports, support tickets, or deletion requests.
- Destructive operations name their impact and require explicit confirmation.
- Back navigation and process termination preserve safe draft work.
- Error messages distinguish unavailable service, invalid input, expired link, and insufficient access without leaking private data.

### 7. Accessibility is a release property

- Every primary task works with VoiceOver, Voice Control, Larger Text, Reduce Motion, and sufficient contrast.
- Color never carries status alone.
- Touch targets are at least 44 by 44 points.
- Canvas and gesture-heavy features expose an equivalent structured list or button path.
- Dynamic Type does not clip required controls or hide legal consent.
- Motion, haptics, sound, and video are enhancements, not the sole source of meaning.

## Functional Scope

### Accounts and identity

- Email/password registration and verification.
- Sign-in, sign-out, session restoration, password reset, and reauthentication.
- Profile completion and editing.
- Privacy settings, blocked accounts, security status, and account deletion.
- External identity options remain absent until the API validates their issued token and the login offering satisfies App Review Guideline 4.8.

### Event lifecycle

The canonical event lifecycle is:

```text
draft -> published -> active -> completed
             \          \-> cancelled
              \-> cancelled
```

Rules:

- Event creation establishes a server draft after valid basics.
- Publish validates required content and writes `published` atomically.
- A bounded server job changes `published` to `active` at the event start and `active` to `completed` at the event end; a host may correct a delayed transition.
- Cancellation is distinct from deletion.
- Archive is represented by `archived_at`, not another lifecycle status. Only completed or cancelled events can be archived. Restore clears `archived_at` and retains the prior terminal lifecycle status.
- Delete is host-only, destructive, and must account for dependent records and user-facing links.

Allowed transitions are:

| Current | Allowed next state or action |
|---|---|
| `draft` | `published`, delete |
| `published` | `active`, `cancelled`, delete |
| `active` | `completed`, `cancelled` |
| `completed` | archive |
| `cancelled` | archive |
| archived completed/cancelled | restore to the same terminal state |

### Event creation

- Smart brief with deterministic manual fallback.
- Server-validated event templates and blank creation.
- Core details, event-type details, selected contacts/manual guests, timeline, review, draft save, and publish.
- Wizard state survives backgrounding and process termination.
- Guest and timeline writes use one recoverable server-side creation workflow or explicit partial-completion state.

### Guests, invitations, RSVP, and check-in

- Guest add, edit, remove, deduplicate, search, and filter.
- Reusable invitation templates and event-specific invitation composition.
- Actual event and guest records in preview and recipient selection.
- Authenticated, authorized server-side send command with delivery tracking and bounded retries.
- Token preview, token constraints, usage inspection, revocation, and anonymous or authenticated RSVP.
- RSVP states of invited, maybe, accepted, declined, and withdrawn.
- Separate approval states of not required, pending, approved, and rejected so RSVP intent never grants participant access by itself.
- Event-scoped QR pass and idempotent camera or manual check-in.

### Collaborative planning

- One canonical timeline data source with guest visibility rules.
- Single-choice and multiple-choice polls. Ranking polls are excluded from 1.0.
- Cost splits as a non-payment ledger with actor-scoped visibility and validated state transitions.
- Persistent PartyBoard notes and ideas with ownership, voting, filtering, accessible list mode, and moderation.
- Co-host assignment and explicit edit, invite, and moderation permissions.

### Games

- General Trivia.
- Getting to Know You.
- Shared-device setup, play, pause, interruption recovery, result, replay, and share.
- No claim of network multiplayer, persistent game history, prizes, Game Center, or more games in 1.0.

### PartyCrew

- Feed, post detail, supported post creation, comments, likes, and native sharing.
- Discover people, public PartyCrew join, private request, request inbox, leave PartyCrew, and cancel request.
- Profiles, profile editing, connection lists, privacy enforcement, reporting, blocking, and unblocking.
- User-generated content cannot launch until moderation operations are live.

Canonical relationship terms:

| Concept | User-facing term |
|---|---|
| Create a public outgoing relationship | Join PartyCrew |
| Request a private outgoing relationship | Request to Join |
| Pending outgoing relationship | Requested |
| Remove an outgoing relationship | Leave PartyCrew |
| People connected to this profile | Members |
| Profiles the current member joined | Crewing With |
| Relationship in both directions | Mutual |

### Notifications

- In-app notification center, unread state, mark read, and typed destination routing.
- Complete APNs push integration with category-level preferences; permission remains optional for the user.
- Push denial leaves in-app notifications fully usable.
- Marketing notifications require separate explicit consent and are outside the default 1.0 notification set.

### Help, legal, and account control

- Searchable help topics available online and in a bundled offline set.
- Direct contact support with an idempotent ticket reference.
- Community Guidelines, Terms of Service, and Privacy Policy available before signup and from Settings.
- In-app initiation and confirmation of permanent account deletion.

## Nonfunctional Scope

| Area | Launch requirement |
|---|---|
| Availability | Core API and auth health monitored; review environment remains live throughout App Review |
| Performance | Warm tab transitions feel immediate; long lists virtualize; release traces identify slow startup and route transitions |
| Reliability | Mutations are idempotent where retries are possible; partial failures produce recoverable server state |
| Security | Authorization enforced server-side, secrets excluded from the client, tokens stored securely, inputs validated at trust boundaries |
| Privacy | Data minimization, disclosed retention, in-app deletion, accurate App Privacy answers, no tracking in 1.0 |
| Accessibility | Common tasks complete with supported accessibility modes on both iPhone and iPad |
| Operability | Structured logs, crash symbols, alerting, moderation queue, support queue, deletion-job visibility, and rollback plan |
| Compatibility | Physical-device validation on the supported OS range, current production iOS/iPadOS, and the next available beta |
| Connectivity | IPv6-only networking, slow network, transient failure, and offline read-only behavior tested |

## Launch Policy Constants

These values make acceptance tests deterministic. Product and security may revise them through the change-control rule in the directory index.

### Polls

- Supported types are single-choice and multiple-choice.
- Auto-consensus requires the configured result threshold and a quorum.
- Quorum is `max(3, ceil(eligible accepted participants * 0.5))`, capped at the number of eligible accepted participants.
- If fewer than three participants are eligible, every eligible participant must vote before auto-consensus can close the poll.
- A multiple-choice poll declares its minimum and maximum selections at creation.
- Consensus threshold is an integer percentage from 51 through 100 and defaults to 75.
- A single-choice poll reaches consensus when one option exceeds or equals the threshold among valid ballots after quorum. A tie at the threshold remains open.
- A multiple-choice poll reaches consensus when at least one option exceeds or equals the threshold among valid ballots after quorum. If multiple options reach the threshold, all qualifying options are retained in the result.

### Timeline

- Overlap creates a warning but does not block save because parallel activities are valid.
- Host-only entries are absent from guest API responses.
- Reorder is persisted as a server-validated integer sequence and has a non-drag control.

### Cost ledger

- Money is stored and calculated in integer minor units.
- Equal split assigns `floor(total / recipients)` to each selected guest, then distributes one remaining minor unit at a time by stable normalized guest ID order.
- Canonical states are `pending`, `sent`, `disputed`, `confirmed`, `cancelled`, and `refunded`. `overdue` is derived from due date and current state.
- Allowed transitions are `pending -> sent/disputed/cancelled`, `sent -> disputed/confirmed/cancelled`, `disputed -> pending/confirmed/cancelled`, and `confirmed -> refunded`.
- Every transition records actor, time, old state, new state, and optional non-sensitive note.

### Retry and idempotency

- Read requests may retry once after network failure or 502, 503, or 504 with jittered delay.
- User mutations do not retry automatically unless they carry a server-enforced idempotency key.
- Background delivery and deletion jobs attempt at most five times with exponential backoff and a final operator alert.
- Invitation campaigns accept at most 50 recipients per request and 200 recipients per host per rolling hour at launch.

### Moderation response

- Credible threats or imminent physical harm enter the emergency queue immediately and receive human review within one hour.
- High-severity harassment, sexual content, or targeted abuse receives human review within four hours.
- Other reports receive human review within 24 hours.
- Automated filters may hide or quarantine immediately, but final account enforcement remains auditable.

### Launch-scale collections

| Collection | Acceptance size and loading rule |
|---|---|
| Events | 250 per member, grouped and virtualized |
| Guests | 2,000 per event, server-filtered and paginated |
| Timeline | 250 entries per event |
| Polls | 100 per event |
| PartyBoard | 500 items per event in canvas and list modes |
| Feed | 500 reachable posts, loaded in pages no larger than 50 |
| Comments | 500 per post, paginated |
| Notifications | 1,000 per member, paginated |

## Launch Success Criteria

### Product

- A new user can verify an account and publish an event without support intervention.
- An invitation recipient can RSVP from a link and later retrieve their pass.
- A host can check in the same guest once, even after retries or duplicate scans.
- Event permissions produce the same result in the UI and API.
- No production screen displays fabricated data or an action that always fails.

### Safety and privacy

- Every UGC surface supports report and block behavior.
- Content filtering and operator triage are active before social writes are enabled.
- A user can permanently delete the account from Settings.
- Privacy policy, App Privacy answers, permission strings, and observed network traffic agree.
- The release build contains no advertising SDK, IDFA use, or undeclared tracking domain.

### Store submission

- The release archive passes App Store Connect validation.
- The active Apple agreements, age-rating questionnaire, DSA status, privacy disclosures, and export-compliance answers are complete.
- Screenshots show real app use with fictional data on every supported device family.
- The reviewer can access all core features with supplied credentials and artifacts.

## Out-Of-Scope Re-entry Rule

An excluded feature may enter a later release only when it has:

1. A server-backed domain model and authorization contract.
2. Complete native screens and recovery states.
3. Privacy, age-rating, moderation, and payment impact analysis.
4. Coverage in the screen and flow registries.
5. End-to-end tests and App Review notes.
