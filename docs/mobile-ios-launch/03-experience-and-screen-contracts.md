# Experience And Screen Contracts

## Design Direction

The PartyHause interface should feel like a well-produced event before it feels like event-management software. It must be energetic without becoming noisy, expressive without obscuring status, and native without looking interchangeable with every other utility app.

### Visual concept: Night Garden

The visual system combines a dark editorial canvas with vivid event accents and warm paper-like surfaces.

- `Ink`: near-black violet for immersive headers, active events, games, and evening contexts.
- `Paper`: warm off-white for forms, schedules, and long reading.
- `Ultraviolet`: primary brand and selected state.
- `Coral`: human action, invitation, and social warmth.
- `Citron`: live, accepted, and celebratory highlights.
- `Sky`: informational and collaboration states.
- `Signal Red`: destructive and critical errors only.

Event artwork may influence an event workspace accent, but never text contrast, semantic colors, or system-wide controls. The product should avoid placing every surface on a gradient. Gradients are reserved for hero artwork, invitation previews, and game transitions.

### Type

- Use the iOS system font for controls, forms, numbers, and body content so Dynamic Type remains reliable.
- Use a display face only for short event titles and campaign artwork, with a system-font fallback and licensed font files bundled in the app.
- Preserve the user's Dynamic Type category. Do not cap text below accessibility sizes on task-critical screens.
- Use tabular numerals for countdowns, attendance totals, cost totals, and game scores.
- Keep body text at 17 points at the default size and secondary text at 15 points or greater.

### Shape and depth

- Event cards use a clipped poster shape with one asymmetric corner treatment, not a generic floating rounded rectangle.
- Controls use native radii and materials where they improve familiarity.
- Elevation communicates temporary layers only. Permanent hierarchy relies on spacing, tone, and typography.
- Borders are subtle but visible in Increase Contrast mode.
- Content density increases on iPad rather than scaling phone cards to fill the width.

## Layout Model

### iPhone

- One primary column.
- Bottom tab bar for Events, PartyCrew, Games, and Me.
- Large titles on tab roots, compact titles after scroll.
- Full-screen routes for creation, scanner, game play, reporting, deletion, and other high-focus tasks.
- Medium or large detent sheets for short bounded edits.
- Primary actions remain reachable above the home indicator and keyboard.

### iPad

- Sidebar or split view for Events, PartyCrew, Connections, Guests, and Settings.
- Detail panes cap readable line length and form width.
- PartyBoard may use the larger canvas while retaining list mode.
- Modals use appropriate form-sheet widths rather than stretched phone layouts.
- Keyboard navigation, pointer hover, context menus, and hardware-keyboard shortcuts are supported where appropriate.

### Safe areas and orientation

- All screens honor the status bar, Dynamic Island, home indicator, keyboard, and split-view safe areas.
- Portrait is the primary phone layout.
- iPad supports portrait and landscape.
- Scanner and games preserve state across permitted orientation or size-class changes.

## Navigation And Interaction

- One visually dominant action per screen.
- Destructive actions never share the primary accent treatment.
- Back behavior follows the navigation stack and preserves unsaved work through `OVL-01`.
- Swipe-to-go-back is retained unless it would bypass a required destructive confirmation.
- Long press supplements visible actions and never hides the only path to a task.
- Pull to refresh is available on list roots but is not the only retry mechanism.
- Context menus expose secondary actions for event, guest, post, connection, and board records.
- Search uses native searchable navigation where the collection is large enough to justify it.
- Filters remain visible as compact chips and announce active count to VoiceOver.

## Motion And Haptics

- Motion clarifies continuity between event card, event workspace, and detail destinations.
- Standard navigation uses native transitions.
- Celebration animation is limited to successful publish, accepted RSVP, and game completion.
- Reduce Motion replaces scale, parallax, blur travel, and confetti with opacity or no animation.
- Haptics confirm discrete actions such as publish, RSVP, check-in, vote, and destructive confirmation.
- Haptics never provide the only success or error signal.
- Infinite decorative animation is absent from forms, legal content, and accessibility-critical tasks.

## Universal Screen Contract

Every app-owned screen must define and implement the following states where applicable.

| State | Required behavior |
|---|---|
| Initial loading | Show stable structure or a concise progress state; never flash a false empty state |
| Refreshing | Keep readable data on screen and indicate refresh separately |
| Empty | Explain why the collection is empty and provide one relevant next action |
| Validation error | Associate the message with the field, preserve input, and move focus to the first error on submit |
| Mutation pending | Prevent duplicate submission while preserving cancel behavior where safe |
| Mutation success | Reflect confirmed server state and expose the next useful action |
| Recoverable error | State what failed, retain user input, and offer a bounded retry |
| Offline | Show cached content when safe, label staleness, and disable unsupported mutations |
| Forbidden | Do not expose private data; route to `SYS-04` with a safe explanation |
| Deleted or expired | Remove stale actions and route to `SYS-04` or the parent collection |
| Partial completion | Name completed and failed work, keep a server-backed draft, and provide targeted recovery |

Every screen also needs:

- A stable route and analytics screen ID.
- A defined actor and server authorization rule.
- A primary action and a deterministic return destination.
- VoiceOver labels, traits, values, reading order, and focus behavior.
- Dynamic Type, Voice Control, Increase Contrast, Differentiate Without Color, and Reduce Motion behavior.
- Sensitive-data redaction for logs, screenshots used by support, and analytics.
- A statement of cached data and offline behavior.
- An idempotency rule for any retryable mutation.

## Component Contracts

### Event card

- Identifies relationship: Hosting, Co-hosting, or Attending.
- Shows event title, date, status, and location summary.
- Uses text and icon together for status.
- Never reports an event as published when the server stores a draft.
- Exposes context actions appropriate to the relationship.

### Primary button

- Uses an action verb and object, such as `Publish event` or `Send 12 invitations`.
- Shows progress without changing width.
- Disables only while a duplicate action would be unsafe.
- Announces success or failure through visible text and assistive technology.

### Form field

- Visible label remains present while editing.
- Help, requirement, and error text are distinct.
- Keyboard, content type, capitalization, and return key match the data.
- Server errors map back to the relevant field when possible.
- Sensitive fields avoid analytics capture and support-diagnostics payloads.

### Person row

- Uses display name as the primary label and never reveals private email unless the actor is authorized.
- Relationship and request state appear in text, not color alone.
- Report and block remain reachable from a visible menu.

### Status chip

- Uses a semantic icon, label, and color.
- Supports accepted, maybe, declined, pending, checked in, sent, delivered, failed, draft, published, active, completed, cancelled, and archived.
- Has a VoiceOver label that includes the object and status.

### Skeleton and progress

- Skeletons match stable content geometry and stop animating under Reduce Motion.
- A blocking progress indicator always names the operation.
- Long-running server work supports safe backgrounding or a resumable status.

### Toast and banner

- Toasts acknowledge noncritical results and never contain the only path to recovery.
- Banners represent persistent connectivity, stale-data, maintenance, or permission state.
- Critical errors use inline or full-screen recovery, not disappearing feedback.

## Domain Screen Acceptance

### Authentication

| Screen | Key acceptance contract |
|---|---|
| `AUTH-01` | No system permission prompt; legal and support links work signed out; first frame contains useful content |
| `AUTH-02` | Login errors do not disclose whether an unrelated account exists; destination is preserved |
| `AUTH-03` | Terms and Privacy are linked before consent; password rules are visible before failure |
| `AUTH-04` | Shows the submitted address in masked form; resend is rate-limited and accepts email explicitly |
| `AUTH-05` | Distinguishes valid, expired, reused, malformed, and network outcomes without exposing token data |
| `AUTH-06` | Always gives the same acknowledgement for known and unknown addresses |
| `AUTH-07` | Requires password confirmation, invalidates the reset token, and produces a usable session |
| `AUTH-08` | Required and optional fields are clear; photo selection is optional; completion is resumable |

### Events and creation

| Screen | Key acceptance contract |
|---|---|
| `EVT-01` | A single event cannot appear as both a duplicate hosted and invited record; query failure is not rendered as empty |
| `EVT-02` | Server draft and local recovery state are labeled; resume opens the exact saved step |
| `EVT-03` | AI disclosure is clear; unavailable AI falls back to editable manual extraction without losing text |
| `EVT-04` | Every visible template has a valid server schema; unsupported templates are absent |
| `EVT-05` | Timezone and multi-day behavior are explicit; end cannot precede start |
| `EVT-06` | Dynamic fields are validated from a versioned schema and remain editable on review |
| `EVT-07` | Contacts are individually selected; duplicate and malformed email handling is visible before save |
| `EVT-08` | Guest visibility, local time, duration, overlap, and reminders are understandable before save |
| `EVT-09` | Publish validates all required resources; partial failure remains a recoverable draft |
| `EVT-10` | Names the stored status and never claims invitations were sent unless delivery was requested and accepted |
| `EVT-11` | Actions reflect event relationship and status; private notes and hidden timeline data never leak to guests |
| `EVT-12` | Conflict detection prevents silent overwrite; unsaved work receives `OVL-01` |
| `EVT-13` | Lifecycle follows the explicit transition table; archive is a reversible terminal-event view state; delete remains distinct |
| `EVT-14` | Permission changes are explicit, server-enforced, auditable, and cannot remove the last host |
| `EVT-15` | Metrics name their period and denominator and never derive guest totals from capacity |

### Invitations, RSVP, guests, and check-in

| Screen | Key acceptance contract |
|---|---|
| `INV-01` | Bundled and saved designs share one safe data contract; selected state is perceivable without color |
| `INV-02` | Structured content is sanitized; variable validation prevents sending unresolved tokens |
| `INV-03` | Preview uses the selected event and current data; image, map, and RSVP toggles match delivered output |
| `INV-04` | Uses actual event guests; selection never defaults to every device contact; invalid recipients are explained |
| `INV-05` | Provider-accepted, delivered, opened, clicked, bounced, and failed are not conflated or client-writable |
| `INV-06` | Token policy shows expiry, use limit, approval, and allow-list; host can inspect and revoke |
| `RSVP-01` | Preview is read-only, reportable, and does not consume the invite; private data is scoped by token |
| `RSVP-02` | Updates an existing invited identity; supports invited, maybe, accepted, declined, and withdrawn intent plus separate approval; declines require no unnecessary data |
| `RSVP-03` | Accurately names RSVP and approval state; next actions match the resulting access |
| `GST-01` | Search and filters work together; counts derive from records; bulk actions announce target count |
| `GST-02` | A guest can access only their own allowed fields; hosts see delivery and check-in audit data |
| `CHK-01` | Accepted guest search and manual check-in work without camera; repeated check-in is idempotent |
| `CHK-02` | Rejects malformed, wrong-event, revoked, or unauthorized codes without exposing another guest's data |
| `CHK-03` | QR is available from encrypted cache; stale or revoked status is refreshed when connectivity returns |

### Timeline, polls, costs, and PartyBoard

| Screen | Key acceptance contract |
|---|---|
| `TIM-01` | Guests receive only visible entries; local timezone and event timezone are unambiguous |
| `TIM-02` | Reorder works without drag; overlaps warn but remain valid; hidden status and reminders survive edits; concurrent changes are detected |
| `POL-01` | Active and closed states reflect the server; empty, failure, and no-access states are distinct |
| `POL-02` | Single and multiple choice have valid selection bounds; deadline, quorum, and consensus rules are explained; ranking is absent |
| `POL-03` | Vote revision is atomic; result visibility and close permission are enforced server-side |
| `COST-01` | Currency and minor-unit totals are consistent; derived overdue is distinct from stored state; a guest cannot enumerate another guest's share |
| `COST-02` | Custom shares must reconcile exactly; no accepted guests is a clear blocking state |
| `COST-03` | Pending, sent, disputed, confirmed, cancelled, and refunded transitions are valid and auditable; PartyHause does not process payment |
| `COST-04` | Shows only the signed-in guest's shares and separates pending, sent, disputed, confirmed, cancelled, and refunded |
| `BRD-01` | Canvas and structured list expose equivalent content and actions; content is persisted and moderated |
| `BRD-02` | Ownership, edit, delete, vote, and report rules remain consistent across canvas and list modes |

### Games

| Screen | Key acceptance contract |
|---|---|
| `GAM-01` | Shows only General Trivia and Getting to Know You; event context is optional and truthful |
| `GAM-02` | Player minimum, local-only behavior, duration, and interruption behavior are clear |
| `GAM-03` | Timer, score, answer state, pause, and VoiceOver progression remain deterministic |
| `GAM-04` | Getting To Know You prompts can be repeated or skipped; sharing timer is not required for progression |
| `GAM-05` | Results can be understood without color or motion; replay resets every run state |

### PartyCrew and profiles

| Screen | Key acceptance contract |
|---|---|
| `SOC-01` | Failed fetch is not an empty feed; blocked content is absent; pagination cannot duplicate posts |
| `SOC-02` | Deleted comments and posts resolve safely; every UGC object can be reported; interaction rollback is visible |
| `SOC-03` | Filtering occurs before exposure; audience and linked event are explicit; rejected content is retained privately for editing |
| `SOC-04` | Suggestions explain their source without exposing private signals; blocked users never appear |
| `SOC-05` | Private profile fields and lists stay hidden; report and block are available for other users |
| `SOC-06` | URL validation, selected-photo upload, progress, retry, and old-image cleanup are handled |
| `SOC-07` | Privacy applies to every page of the result; pagination preserves section and scroll position |
| `SOC-08` | Received and sent states are distinct; accept, decline, and cancel are idempotent |
| `SOC-09` | Unblock explains restored visibility and does not silently recreate a prior relationship |

### Notifications, settings, support, moderation, and account

| Screen | Key acceptance contract |
|---|---|
| `NTF-01` | Each notification has typed destination data; inaccessible targets resolve through `SYS-04` |
| `NTF-02` | In-app, push, and email settings are independent; denied system permission is represented accurately |
| `SET-01` | Account deletion, privacy, block list, support, legal, and sign out are easy to find |
| `SET-02` | Sensitive actions require recent authentication; session and verified-email status come from server truth |
| `SET-03` | Optimistic changes roll back on failure; every setting describes its audience impact |
| `SUP-01` | Contact information is public, current, and usable; core help remains available offline |
| `SUP-02` | Content is versioned, readable with Larger Text, and includes related help and escalation |
| `SUP-03` | Diagnostic attachment is optional and previewed; retries do not create duplicate tickets |
| `MOD-01` | Reporter chooses a specific reason; target is immediately hideable; confirmation does not reveal operator action |
| `LEG-01` | Clearly states prohibited content, enforcement, reporting, blocking, and appeal route |
| `LEG-02` | Version and effective date are visible; signup records the accepted version |
| `LEG-03` | Matches actual collection, sharing, retention, deletion, permissions, and third-party processors |
| `ACC-01` | Full deletion can start in app; deactivation is not substituted; progress and completion are communicated |

### System and recovery

| Screen | Key acceptance contract |
|---|---|
| `SYS-01` | Does not hang on a failed session check; routes only after migration and auth state resolve |
| `SYS-02` | Parses a strict allow-list, strips secrets from logs, preserves destination, and handles install continuation |
| `SYS-03` | Names cached content age and prevents unsupported writes while preserving safe reads |
| `SYS-04` | Uses one privacy-safe message family for deleted, blocked, forbidden, invalid, and expired content |
| `SYS-05` | Required update opens the App Store; maintenance offers status and retry; neither loops indefinitely |

## Accessibility Contract

### Required task coverage

The following tasks must complete with VoiceOver, Voice Control, Larger Text, Reduce Motion, Differentiate Without Color, and sufficient contrast:

- Create and verify an account.
- Sign in and reset a password.
- Create, review, save, and publish an event.
- Select contacts or add guests manually.
- Compose, select recipients, and send invitations.
- RSVP and retrieve a pass.
- Check in a guest without using the camera.
- Read and edit a timeline without drag.
- Create and vote in a poll.
- Create and inspect a cost share.
- Use PartyBoard in structured list mode.
- Set up, play, and finish both games.
- Follow, request, report, block, and unblock.
- Change privacy and notification settings.
- Contact support and delete an account.

### Implementation rules

- Decorative images are hidden from assistive technology.
- Event artwork has meaningful alternative text only when it conveys information.
- QR codes include a human-readable identity and a manual fallback.
- Custom controls expose name, role, value, state, and available actions.
- Focus moves to a route title on navigation and to an error summary after failed submit.
- Countdown changes do not announce every second.
- Canvas coordinates are not required to understand PartyBoard content.
- Text remains usable at 200 percent and at accessibility text sizes.

## Content And Tone

- Use direct verbs and specific nouns.
- Never blame the user for a network, provider, or server failure.
- Do not call a pending request a completed action.
- Do not use urgency to pressure notification, contact, camera, photo, privacy, or tracking consent.
- Explain why data is requested immediately before the system permission prompt.
- Use `PartyCrew` consistently for the social relationship and `PartyBoard` for event collaboration.
- Use `host`, `co-host`, and `guest` as event relationships.
- Use `member` for a signed-in PartyHause account.

## Performance Budgets

| Interaction | Target under normal network conditions |
|---|---|
| Warm tab switch | Visible response within 100 ms with no blocking network gate |
| Cached event open | Content frame in 500 ms or less |
| Cold launch to usable cached destination | 2 seconds at the 75th percentile on an iPhone SE (3rd generation) release build |
| Server-backed list refresh | Visible progress immediately; prior content remains usable |
| Primary action acknowledgement | Press state within one frame; progress state within 100 ms |
| Search response for local list | 100 ms or less for launch-scale collections |
| Animation | 60 fps target; no task-critical animation depends on frame-perfect timing |

Normal network for these budgets means Wi-Fi or cellular with at least 20 Mbps downstream, 5 Mbps upstream, round-trip latency at or below 75 ms, and packet loss below 1 percent to the production region. Release validation records device, network, build, percentile, and result.
