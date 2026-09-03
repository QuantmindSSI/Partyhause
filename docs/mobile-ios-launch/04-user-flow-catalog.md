# User Flow Catalog

## Flow Contract

Each flow has a stable ID, actor, entry condition, success path, alternate paths, and a postcondition. A flow is complete only when its server authorization, client state, retry behavior, analytics, accessibility, and support recovery agree.

## Authentication And Session Flows

### `FL-A01`: Register And Verify

Actor: `V`  
Entry: Welcome, invitation continuation, or a protected destination  
Path: `AUTH-01 -> AUTH-03 -> AUTH-04 -> SYS-02 -> AUTH-05 -> AUTH-02 -> AUTH-08`  
Success: A verified member session exists and the retained destination opens.

Required branches:

- Duplicate email returns a safe sign-in or reset option.
- Weak or compromised password preserves all nonsensitive fields.
- Delayed email supports a bounded resend using the submitted email.
- Invalid, expired, or reused verification links provide a safe recovery path.
- A verification link opened on another device still produces a clear result.
- Terms and privacy versions accepted at signup are recorded.

### `FL-A02`: Restore Session And Sign Out

Actor: `M`  
Entry: Cold launch, warm launch, or authentication completion  
Path: `SYS-01 -> validate session -> retained or default destination -> SET-01 or SET-02 -> sign out -> AUTH-01`  
Success: A valid session restores exactly once, or all local credentials and private caches are removed on sign out.

Required branches:

- Expired or revoked token returns to sign in while preserving the destination.
- Offline launch permits only safe cached content and never treats an unvalidated session as newly authorized.
- Failed account lookup cannot leave an authenticated-looking shell without a usable token.
- Sign out clears sensitive notifications, drafts, and cached private records according to cache policy.

### `FL-A03`: Recover Password

Actor: `V`  
Entry: Sign In or Help  
Path: `AUTH-02 -> AUTH-06 -> SYS-02 -> AUTH-07 -> authenticated destination`  
Success: Password changes, reset credential becomes unusable, and a valid session is established.

Required branches:

- Known and unknown emails receive the same request acknowledgement.
- Malformed, expired, and reused links route to a new reset request.
- Password validation is client and server consistent.
- Repeated submit cannot reset twice or create conflicting sessions.

## Event Flows

### `FL-E01`: Create And Publish Event

Actor: `M`, becoming `H`  
Entry: Events Home create action  
Path: `EVT-03 -> EVT-04 -> EVT-05 -> EVT-06 -> EVT-07 -> EVT-08 -> EVT-09 -> EVT-10 -> EVT-11`  
Success: One server event exists in `published` state with consistent guest and timeline resources.

Required branches:

- Smart brief can be skipped or can fall back to deterministic/manual extraction.
- A blank event bypasses template details safely.
- Guests and timeline are optional but preserved if entered.
- Validation returns to the exact section and field.
- A partial child-resource failure leaves a named, recoverable server draft.
- Process termination resumes from durable draft state.

### `FL-E02`: Save, Resume, Duplicate, Or Delete Draft

Actor: `M/H`  
Entry: Any creation step or Event Drafts  
Path: `creation step -> save -> EVT-02 -> resume exact step -> EVT-09 -> publish or delete`  
Success: The intended draft is published, duplicated with a new identity, or deleted with dependencies handled.

Required branches:

- Local recovery data reconciles with the server version.
- Stale version conflict offers refresh or intentional overwrite with audit data.
- Corrupt local recovery falls back to the server draft.
- Draft deletion is idempotent and removes associated recovery data.

### `FL-E03`: Manage Event Details And Lifecycle

Actor: `H`; `C` uses only actions granted by event permissions  
Entry: Event Overview  
Path: `EVT-11 -> EVT-12 -> EVT-13 -> EVT-15`  
Success: Authorized changes persist, lifecycle state is valid, and metrics reflect the current event.

Required branches:

- A co-host with `edit_event` may use `EVT-12`; a co-host without it sees no edit action. `EVT-13` remains host-only and `EVT-15` requires host or `view_insights`.
- Invalid dates, capacity, lifecycle transition, or privacy combination is rejected.
- Archive uses `archived_at` only for completed or cancelled events and restores the same terminal status.
- Delete accounts for dependent guests, links, polls, board data, costs, and notifications.
- Concurrent edits never silently overwrite newer state.

### `FL-E04`: Manage Co-hosts And Permissions

Actor: `H`  
Entry: Event Overview or Event Access And Lifecycle  
Path: `EVT-14 -> add co-host -> assign permissions -> update or revoke -> remove`  
Success: Server authorization immediately reflects the selected permissions.

Required branches:

- Unknown member and duplicate co-host are handled safely.
- Permission values are booleans end to end.
- Revoked access invalidates an open co-host mutation.
- The last host cannot remove or demote themselves without a valid ownership transfer.

## Invitation, RSVP, And Check-In Flows

### `FL-I01`: Choose And Customize Invitation Design

Actor: `H`; a `C` with `invite_guests` may select and use an existing template but may not edit the host's reusable library  
Entry: Event Overview  
Path: `INV-01 -> optional INV-02 -> INV-03`  
Success: A safe event-specific invitation draft uses real event data and a valid design.

Required branches:

- Bundled and saved templates use one data contract.
- Unsafe markup is rejected or transformed into safe structured content.
- Unresolved variables prevent continuation.
- Unsaved changes are protected by `OVL-01`.
- Artwork uses `OS-04` and can be omitted.

### `FL-I02`: Select Recipients, Send, And Recover Delivery

Actor: `H/C` with `invite_guests`  
Entry: Invitation Composer  
Path: `INV-03 -> INV-04 -> OVL-06 -> INV-05`  
Success: An authorized server command creates auditable delivery records for the selected real guests.

Required branches:

- Missing or malformed addresses are excluded with an explanation.
- Duplicate recipients are collapsed by event and normalized address.
- Partial batch failure names successful and failed recipients.
- Retry uses an idempotency key and sends only eligible failures.
- Bounce suppression and rate limits prevent repeated abuse.
- Provider outage preserves a retryable campaign without claiming success.
- Rate-limited send preserves the campaign and states the next eligible retry time.

### `FL-I03`: Generate, Share, Inspect, And Revoke Invite Token

Actor: `H`  
Entry: Event Overview or invitation workflow  
Path: `INV-06 -> OVL-07 -> usage inspection -> revoke`  
Success: A constrained token can be shared and later made unusable.

Required branches:

- Expiry, maximum uses, allowed emails, and approval requirement are enforced server-side.
- Preview does not increment use count.
- Token use, RSVP creation, and usage logging are transactional.
- Revoked, expired, or exhausted token resolves through `SYS-04`.

### `FL-GST01`: Manage Guest Records

Actor: `H/C` with `manage_guests`  
Entry: Event Overview, creation guest step, or invitation recipient step  
Path: `GST-01 -> OVL-02 -> GST-02 -> GST-01`  
Success: Search, filter, add, edit, approve, reject, and remove actions persist without duplicates or unauthorized data exposure.

Required branches:

- Normalized event-plus-email identity prevents duplicate manual, contact, and invitation records.
- Guest search and RSVP filters compose and return server-backed counts.
- Approval changes participant access only after approved state is durable.
- Removing a guest explains invitation, pass, poll, cost, and check-in impact and is idempotent.
- A co-host without `manage_guests` receives read-only access or no guest-list access according to policy.
- Guest self-service can update only the allowed fields on the caller's own record.
- Capacity and plus-one rules are checked transactionally.

### `FL-R01`: Preview Invitation And RSVP

Actor: `V/M/G`  
Entry: Universal Link or QR invitation  
Path: `SYS-02 -> RSVP-01 -> RSVP-02 -> RSVP-03 -> EVT-11 or CHK-03`  
Success: One guest identity has the selected RSVP state and permitted details.

Required branches:

- Anonymous visitor supplies only data required by token policy and selected response.
- Existing signed-in or email-invited guest is updated, not duplicated.
- Invited, maybe, accepted, declined, withdrawn, approval pending, approved, and rejected outcomes remain distinct.
- Plus-one capacity and data requirements are enforced.
- Expired, revoked, exhausted, wrong-email, and malformed tokens are safe.
- Authentication or installation preserves the token destination.
- Event and invitation copy can be reported before account creation through a privacy-safe support/report path.

### `FL-C01`: Present Pass And Check In

Actors: `G` and `H/C` with check-in permission  
Entry: Guest Entry Pass and Check-In Hub  
Path: `CHK-03`; host side `CHK-01 -> CHK-02 or manual search -> dedicated check-in command -> confirmation`  
Success: The correct guest is checked into the correct event exactly once.

Required branches:

- Camera denial returns to manual search.
- The `partyhause://checkin/v1/:opaqueCredential` value is signed, expiring, revocable, resolves event and guest server-side, and rejects raw IDs.
- Malformed, wrong-event, revoked, unknown, or unauthorized codes are rejected.
- Duplicate scan reports already checked in without creating a second event.
- Offline cached pass remains visible; check-in queues only if a conflict-safe server design exists.
- Manual check-in has the same authorization and audit behavior as camera check-in.

## Collaborative Planning Flows

### `FL-T01`: Build And Consume Timeline

Actors: `H/C/G`  
Entry: Event Plan or guest Schedule  
Path: Host or `manage_timeline` co-host uses `TIM-01 -> TIM-02 -> TIM-01`; guest uses `TIM-01 -> reminder destination`  
Success: One canonical ordered timeline persists and guests receive only visible entries.

Required branches:

- Add, edit, reorder without drag, hide, remind, assign, and delete.
- Overlap warning permits an intentional save because parallel activities are valid.
- Event timezone and local display timezone remain clear.
- Concurrent changes produce a conflict path.
- Offline guests can read a labeled cached timeline.

### `FL-P01`: Create, Vote, Revise, And Close Poll

Actors: `H/C/G` event participants  
Entry: Event Plan or Participate  
Path: `POL-01 -> POL-02 -> POL-03 -> vote/revise -> results -> close`  
Success: Valid votes and results persist with correct close permissions.

Required branches:

- Single and multiple choice semantics and configured selection bounds are tested; ranking is absent from 1.0.
- Invalid option, over-selection, duplicate selection, and late vote are rejected.
- Vote revision is atomic.
- Poll creator or event host can close; another participant cannot.
- Consensus requires the launch quorum formula in document 01 and cannot close before quorum.

### `FL-CS01`: Create And Reconcile Cost Split

Actor: `H`  
Entry: Event Plan  
Path: `COST-01 -> COST-02 with due date -> COST-03 -> COST-01`  
Success: Valid reimbursement records exist for selected accepted guests and totals reconcile.

Required branches:

- No accepted guests blocks creation with a guest-management action.
- Equal split uses integer minor units and allocates remainder by stable normalized guest ID order.
- Custom shares must equal the total in the selected currency.
- Duplicate request and invalid state transition are prevented.
- Confirm, cancel, dispute, and correction actions are auditable.

### `FL-CS02`: Review Own Cost Share

Actor: `G`  
Entry: Events Home, event, or notification  
Path: `COST-04 -> COST-03 -> mark sent or add dispute note -> host confirmation`  
Success: The guest can manage only their own record without PartyHause processing money.

Required branches:

- Another guest's share cannot be enumerated by ID.
- Confirmed, cancelled, and refunded records are read-only except the host's valid `confirmed -> refunded` transition.
- Dispute remains visible to host and guest.
- External payment method or reference is free of sensitive card data.

### `FL-B01`: Collaborate On PartyBoard

Actors: `H/C/G` according to event permissions  
Entry: Event Plan  
Path: `BRD-01 -> OVL-04 -> BRD-02 -> move/edit/vote/report/delete -> BRD-01`  
Success: A persistent moderated note or idea has consistent state in canvas and list modes.

Required branches:

- Read-only participant cannot mutate.
- Edit-own and authorized-delete rules are server-enforced.
- Concurrent movement or edit produces a refresh or merge path.
- Rejected text is retained privately for correction.
- Offline board is read-only unless conflict-safe synchronization exists.

## Game Flows

### `FL-G01`: Play General Trivia

Actor: `M/G`  
Entry: Games tab or event  
Path: `GAM-01 -> GAM-02 -> GAM-03 -> GAM-05`  
Success: A local shared-device run completes with deterministic scores and replay.

Required branches:

- Minimum players and names are validated.
- Timeout, pause, resume, background interruption, and abandon confirmation work.
- VoiceOver does not announce every timer tick.
- Replay resets all answers, timer, score, and navigation state.

### `FL-G02`: Play Getting To Know You

Actor: `M/G`  
Entry: Games tab or event  
Path: `GAM-01 -> GAM-02 -> GAM-04 -> GAM-05`  
Success: Prompt and follow-up rounds complete with replay.

Required branches:

- Minimum players are validated.
- Prompt repeat, skip, pause, resume, interruption, and abandon work.
- Timer is optional to progression and accessible.
- Replay resets all run state.

## PartyCrew And Notification Flows

### `FL-S01`: Discover And Join PartyCrew

Actor: `M`  
Entry: PartyCrew feed, empty feed, or profile link  
Path: `SOC-04 -> SOC-05 -> join PartyCrew, request access, configure, or leave PartyCrew`  
Success: Relationship state is accurate for public and private profiles.

Required branches:

- Public profile joins immediately.
- Private profile creates a pending request rather than a following state.
- Self-follow and duplicate operations are rejected or idempotent.
- Block in either direction resolves through `SYS-04`.

### `FL-S02`: Resolve Private Crew Request

Actor: `M`  
Entry: Notification, PartyCrew header, or profile  
Path: `SOC-08 -> accept or decline`; sender may cancel from sent requests  
Success: Both parties receive the same final relationship state.

Required branches:

- Duplicate action is idempotent.
- Already processed, cancelled, blocked, or deleted account is safe.
- Accept creates the intended directional relationship and notifications once.

### `FL-S03`: Publish, Engage With, And Report Crew Content

Actor: `M`  
Entry: PartyCrew feed  
Path: `SOC-01 -> SOC-03 -> SOC-02 -> like/comment/share or MOD-01`  
Success: Allowed content is published and interactions are accurate; abusive content enters moderation.

Required branches:

- Pre-publication filtering accepts, rejects, or quarantines before exposure.
- Rejected copy remains editable by its author.
- Failed optimistic interaction rolls back visibly.
- Deleted or blocked target resolves safely.
- Report can immediately hide and optionally block.
- Empty feed links to Discover People.
- Profile text, linked event copy, invitation copy, posts, comments, poll text, and PartyBoard text all use the applicable pre-exposure safety policy.

### `FL-S04`: Maintain Profile And Connections

Actor: `M`  
Entry: Me tab  
Path: `SOC-05 -> SOC-06 -> SOC-07`  
Success: Valid profile changes persist and connection lists honor privacy.

Required branches:

- Invalid website and unsafe bio are rejected.
- Image selection is optional and upload failure preserves text changes safely.
- Private or hidden lists disclose no records.
- Pagination retry preserves segment and position.

### `FL-N01`: Consume In-App Notification

Actor: `M`  
Entry: Bell, badge, or foreground notification  
Path: `NTF-01 -> mark read -> SYS-02 -> typed destination`  
Success: Notification read state persists and the intended accessible destination opens.

Required branches:

- Mark one and mark all are idempotent.
- Deleted, expired, blocked, or forbidden target resolves through `SYS-04`.
- Malformed action data leaves the notification readable without unsafe navigation.

### `FL-N02`: Configure Push Notifications

Actor: `M`  
Entry: Notification Preferences or first user-created reminder  
Path: `NTF-02 -> contextual rationale -> OS-01 -> token registration`  
Success: Category preferences and current device token agree with system permission.

Required branches:

- Denial leaves in-app notifications active.
- A later action can open iOS Settings.
- Token refresh and registration failure are recoverable.
- Sign out unregisters or de-associates the device token.
- Marketing push remains off unless separately and explicitly accepted.

## Settings, Safety, Account, And System Flows

### `FL-ST01`: Manage Account, Privacy, And Legal Choices

Actor: `M`  
Entry: Me tab  
Path: `SET-01 -> SET-02 or SET-03 -> LEG-01/LEG-02/LEG-03`  
Success: Account and privacy settings persist and legal content remains accessible.

Required branches:

- Sensitive account change requires recent authentication.
- Optimistic privacy update rolls back on server failure.
- Community Guidelines, Terms, and Privacy each fall back to the bundled current version when offline.
- Privacy changes update profile, discovery, feed, and connection behavior.

### `FL-SP01`: Find Help And Contact Support

Actor: `ALL`  
Entry: Welcome, auth, Settings, or an error recovery action  
Path: `SUP-01 -> SUP-02 -> SUP-03 -> ticket confirmation`  
Success: The user receives a stable support reference or an offline-safe contact handoff.

Required branches:

- Signed-out account-access help does not disclose account existence.
- Offline help uses bundled articles.
- Optional diagnostics are previewed and consented.
- Retry is idempotent and does not duplicate a ticket.

### `FL-M01`: Report, Hide, Block, And Moderate

Actors: `ALL/O`; signed-out reporting is limited to content authorized by an invitation or public context  
Entry: Profile, event or invitation copy, post, comment, poll, or PartyBoard item  
Path: `MOD-01 -> local hide -> optional block -> OPS-02 -> operator decision -> status notification`; unblock via `SOC-09`  
Success: Evidence is retained, unsafe exposure is reduced immediately, and action is auditable.

Required branches:

- Duplicate reports coalesce without losing evidence.
- Reporter identity is protected from the reported member.
- Removed target can still be triaged from an immutable snapshot.
- Credible physical threat follows emergency escalation.
- Appeal can restore content and relationship visibility where appropriate.

### `FL-D01`: Permanently Delete Account

Actors: `M/O`  
Entry: Account And Security  
Path: `ACC-01 -> impact review -> ownership choice -> reauthenticate -> confirm -> session revoke -> OPS-05 -> completion`  
Success: Account and associated personal data are deleted or legally retained according to the disclosed policy.

Required branches:

- User can cancel before final confirmation.
- Wrong credentials or stale session requires reauthentication without losing the request context.
- Hosted event ownership is transferred, cancelled, or deleted through explicit choices.
- Deletion begins in app and never requires a phone call or support email.
- Delayed fulfillment communicates timeframe, pending state, failure recovery, and completion.
- Sign in with Apple tokens are revoked if that login option is introduced.

### `FL-Y01`: Resolve Launch And Deep Link

Actor: `ALL`  
Entry: App icon, Universal Link, custom check-in QR, push, or cold-start route  
Path: `SYS-01 or SYS-02 -> auth if required -> exact destination`  
Success: The allowed destination opens once after session and route validation.

Required branches:

- App not installed falls back to the equivalent web destination.
- Authentication, signup verification, password reset, and installation preserve intent.
- Malformed or unknown link resolves through `SYS-04`.
- Tokens and private query values never enter analytics or logs.

### `FL-Y02`: Recover From Offline, Maintenance, Unavailable Content, Or Old Build

Actor: `ALL`  
Entry: Any route or launch gate  
Path: `affected screen -> SYS-03/SYS-04/SYS-05 -> retry, cached read, parent, status, or App Store`  
Success: The user reaches a safe usable state without an infinite retry or false success.

Required branches:

- Cached event, timeline, pass, legal, and help content remain readable when safe.
- Unsupported mutations are disabled offline.
- Required update opens the correct App Store product page.
- Maintenance retry is bounded and exposes status information.
- Forbidden and not-found messages disclose no private object existence.

## Operational Flows

### `FL-O01`: Moderate Reported Content

Actor: `O`  
Entry: Moderation queue populated by `OPS-01` or `MOD-01`  
Path: inspect immutable snapshot and history -> assign -> decide -> remove/warn/suspend/restore -> notify -> audit  
Success: A policy-grounded decision is recorded and enforced across clients.

Required branches:

- Duplicate reports merge without losing reporters or evidence.
- Credible threats escalate to the defined safety process.
- Appeal review can reverse an action while retaining history.
- Operator access is least-privileged and audited.

### `FL-O02`: Resolve Support Request

Actor: `O`  
Entry: Support queue from `SUP-03`  
Path: route -> inspect consented context -> verify identity if needed -> reply -> resolve -> retain history  
Success: The requester receives a resolution and the ticket has a complete audit history.

Required branches:

- Account-access support does not expose whether another email is registered.
- Duplicate client retries merge by idempotency key.
- Security, privacy, billing, abuse, and deletion categories route to the correct process.

### `FL-O03`: Fulfill Deletion Request

Actor: `O` or deletion worker  
Entry: Confirmed `ACC-01` request  
Path: revoke credentials -> resolve hosted events -> delete or anonymize data -> delete blobs and relationships -> retain allowed legal records -> confirm  
Success: No user-accessible account or undisclosed personal data remains.

Required branches:

- Work uses bounded retries and visible failure alerts.
- A failed step remains resumable and does not restore account access.
- UGC deletion, backup aging, legal retention, and completion timing match the Privacy Policy.
- No orphaned blob, connection, notification, invite, or moderation reference exposes personal data.

## Flow Count

| Domain | Count |
|---|---:|
| Authentication and session | 3 |
| Events | 4 |
| Invitations, guest management, RSVP, and check-in | 6 |
| Collaborative planning | 5 |
| Games | 2 |
| PartyCrew and notifications | 6 |
| Settings, safety, account, and system | 6 |
| Operations | 3 |
| **Total** | **35** |
