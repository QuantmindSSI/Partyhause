# Information Architecture And Screen Registry

## Counting Rule

An app-owned screen is a routeable, restorable, independently testable destination. Alerts, action sheets, permission prompts, pickers, banners, and transient success messages are registered separately and do not inflate the screen count.

The registry contains exactly 80 app-owned screens.

## Navigation Model

### Public root stack

- Launch/session gate.
- Welcome and authentication stack.
- Invitation and account-action Universal Links.
- Public legal and support destinations.
- Unavailable, maintenance, update, and offline recovery destinations.

### Authenticated tabs

| Tab | Root | Purpose |
|---|---|---|
| Events | `EVT-01` | Hosted, co-hosted, and invited events; creation entry |
| PartyCrew | `SOC-01` | Feed, people discovery, and relationship requests |
| Games | `GAM-01` | Two complete shared-device games |
| Me | `SOC-05` for the current user | Profile, connections, notifications, and settings |

### Event workspace

Host and co-host workspace sections are Overview, Plan, and Guests. Guest workspace sections are Overview, Schedule, and Participate. The section switcher is navigation chrome, not another screen.

The Plan section links to Timeline, Polls, PartyBoard, and Costs. Invitations, insights, co-hosts, check-in, and event settings are pushed destinations based on permissions.

### Navigation rules

- Switching tabs preserves each tab stack.
- Reselecting a tab returns to its root.
- Back returns to the invoking context, never to a guessed role dashboard.
- Authentication preserves the requested deep-link destination.
- Complex tasks use full-screen routes. Sheets are limited to bounded edits, filters, and confirmations.
- iPad uses adaptive split views with the same screen IDs and routes.
- Unknown, expired, deleted, blocked, or forbidden destinations resolve safely through `SYS-04`.

## Screen Status

| Status | Meaning |
|---|---|
| `ADAPT` | Existing durable behavior and UI can be adapted |
| `PORT` | Backend exists; native experience needs completion |
| `HARDEN` | Existing behavior is mock, local-only, misleading, insecure, or inconsistent |
| `BUILD` | Required end-to-end capability is absent |
| `NATIVE` | iOS or app-shell work is required |

## Authentication: 8 Screens

| ID | Screen | Route and presentation | Actor | Primary responsibility | Status |
|---|---|---|---|---|---|
| `AUTH-01` | Welcome | `/welcome`, root replacement | V | Product value, Sign In, Create Account, legal and support access | `ADAPT` |
| `AUTH-02` | Sign In | `/auth/sign-in`, push | V | Email/password login, verification recovery, retained destination | `HARDEN` |
| `AUTH-03` | Create Account | `/auth/sign-up`, push | V | Name, email, password, age eligibility, terms and privacy consent | `HARDEN` |
| `AUTH-04` | Check Your Email | `/auth/check-email`, replacement | V | Verification explanation, resend, change email, open Mail | `PORT` |
| `AUTH-05` | Verify Email Result | `/auth/verify-email`, Universal Link | V | Verifying, verified, and one privacy-safe invalid/expired/already-used outcome with resend | `HARDEN` |
| `AUTH-06` | Forgot Password | `/auth/forgot-password`, push | V | Enumeration-safe reset request | `PORT` |
| `AUTH-07` | Reset Password | `/auth/reset-password`, Universal Link | V | Link validation, new password, session establishment | `HARDEN` |
| `AUTH-08` | Complete Profile | `/onboarding/profile`, full screen | M | Required display name; optional bio, location, avatar, and cover | `HARDEN` |

## Events And Creation: 15 Screens

| ID | Screen | Route and presentation | Actor | Primary responsibility | Status |
|---|---|---|---|---|---|
| `EVT-01` | Events Home | `/(tabs)/events`, tab root | M | Group hosted, co-hosted, invited, upcoming, and past events | `HARDEN` |
| `EVT-02` | Event Drafts | `/events/drafts`, push | M | Resume, duplicate, and delete server drafts; label local recovery data | `HARDEN` |
| `EVT-03` | Smart Event Brief | `/events/create/brief`, wizard | M | Convert a conversation or free text into editable event fields | `PORT` |
| `EVT-04` | Event Template Gallery | `/events/create/templates`, wizard | M | Select a validated server template or start blank | `HARDEN` |
| `EVT-05` | Event Basics | `/events/create/basics`, wizard | M | Name, description, dates, timezone, venue, capacity, privacy, playlist | `HARDEN` |
| `EVT-06` | Template Details | `/events/create/template/[templateId]`, dynamic wizard | M | Render one schema-driven event-type form | `HARDEN` |
| `EVT-07` | Initial Guest Setup | `/events/create/guests`, wizard | M | Manual add or explicit contact selection, edit, validation, deduplication | `HARDEN` |
| `EVT-08` | Initial Timeline Setup | `/events/create/timeline`, wizard | M | Seed activities, visibility, duration, location, assignment, reminders | `HARDEN` |
| `EVT-09` | Review And Publish | `/events/create/review`, wizard | M | Review, save draft, or atomically publish | `HARDEN` |
| `EVT-10` | Event Created | `/events/[eventId]/created`, replacement | H | Confirm server state and route to invitations or event workspace | `BUILD` |
| `EVT-11` | Event Overview | `/events/[eventId]`, push | H/C/G-auth/G-token | Credential-scoped facts, RSVP, stats, playlist, map, calendar, and report entry for another host's content | `HARDEN` |
| `EVT-12` | Edit Event | `/events/[eventId]/edit`, push | H/C with `edit_event` | Edit core and event-type details with conflict-safe saving | `HARDEN` |
| `EVT-13` | Event Access And Lifecycle | `/events/[eventId]/settings`, push | H | Privacy, capacity, publish, cancel, archive, restore, and delete | `HARDEN` |
| `EVT-14` | Co-hosts And Permissions | `/events/[eventId]/cohosts`, push | H | Add, permission, revoke, and remove co-hosts | `BUILD` |
| `EVT-15` | Event Insights | `/events/[eventId]/insights`, push | H/C with `view_insights` | RSVP, attendance, check-in, and invitation delivery metrics | `HARDEN` |

## Invitations, RSVP, Guests, And Check-In: 14 Screens

| ID | Screen | Route and presentation | Actor | Primary responsibility | Status |
|---|---|---|---|---|---|
| `INV-01` | Invitation Template Library | `/events/[eventId]/invites/templates`, push | H/C with `invite_guests` | Unified bundled and saved invitation designs | `HARDEN` |
| `INV-02` | Invite Template Editor | `/invite-templates/new` or `/invite-templates/[templateId]/edit`, full screen | H | Safe reusable subject, body, variables, preview, and default selection | `HARDEN` |
| `INV-03` | Invitation Composer And Preview | `/events/[eventId]/invites/compose`, push | H/C with `invite_guests` | Bind real event data, copy, style, artwork, map, and RSVP action | `HARDEN` |
| `INV-04` | Recipient Selection | `/events/[eventId]/invites/recipients`, push | H/C with `invite_guests` | Select real guest records and exclude invalid recipients | `HARDEN` |
| `INV-05` | Delivery And Engagement | `/events/[eventId]/invites/delivery`, push | H/C with `invite_guests` | Sent, delivered, opened, clicked, bounced, failed, and retry state for authorized inviters | `HARDEN` |
| `INV-06` | Share Link And Join QR | `/events/[eventId]/share`, push | H | Generate, constrain, share, inspect, and revoke invite tokens | `HARDEN` |
| `RSVP-01` | Invitation Landing | `/join/[token]`, Universal Link | V/M | Preview allowed event and host data, report abusive content, and avoid consuming the token | `BUILD` |
| `RSVP-02` | RSVP And Guest Details | `/join/[token]/rsvp`, push | V/M | Accept, maybe, decline, plus-ones, phone, dietary and access needs | `BUILD` |
| `RSVP-03` | RSVP Confirmation | `/join/[token]/confirmed`, replacement | V/G | Invited, maybe, accepted, declined, withdrawn, pending, approved, or rejected outcome with valid next actions | `BUILD` |
| `GST-01` | Guest List | `/events/[eventId]/guests`, push | H/C with `manage_guests` | Search, RSVP filter, totals, invite state, and check-in state | `HARDEN` |
| `GST-02` | Guest Detail And Edit | `/events/[eventId]/guests/[guestId]`, push | H/C with `manage_guests`, G-auth self, or G-token self | Guest data, RSVP, needs, email history, and authorized actions | `HARDEN` |
| `CHK-01` | Check-In Hub | `/events/[eventId]/check-in`, push | H/C with `check_in_guests` | Arrival totals, search, manual check-in, and scanner entry | `HARDEN` |
| `CHK-02` | Camera Scanner | `/events/[eventId]/check-in/scan`, full screen | H/C with `check_in_guests` | Validate an event-scoped QR and perform idempotent check-in | `BUILD` |
| `CHK-03` | Guest Entry Pass | `/events/[eventId]/pass`, push | G-auth/G-token | Offline-capable QR, guest identity, event facts, and check-in state | `HARDEN` |

## Timeline, Polls, Costs, And PartyBoard: 11 Screens

| ID | Screen | Route and presentation | Actor | Primary responsibility | Status |
|---|---|---|---|---|---|
| `TIM-01` | Event Timeline | `/events/[eventId]/timeline`, push | H/C/G-auth/G-token | Chronological schedule filtered by guest visibility | `HARDEN` |
| `TIM-02` | Timeline Editor | `/events/[eventId]/timeline/edit`, push | H/C with `manage_timeline` | Add, edit, reorder, hide, remind, assign, and delete entries | `HARDEN` |
| `POL-01` | Event Polls | `/events/[eventId]/polls`, push | H/C/G-auth | Active and closed lists with creator and deadline metadata | `PORT` |
| `POL-02` | Poll Composer | `/events/[eventId]/polls/new`, full screen | H/C/G-auth | Single or multiple choice, options, selection bounds, deadline, quorum, and consensus | `HARDEN` |
| `POL-03` | Poll Detail And Results | `/events/[eventId]/polls/[pollId]`, push | H/C/G-auth | Vote, revise, results, and authorized close | `HARDEN` |
| `COST-01` | Cost Split Summary | `/events/[eventId]/costs`, push | H | Pending, sent, disputed, confirmed, cancelled, refunded, derived overdue, and per-guest totals | `HARDEN` |
| `COST-02` | Create Cost Split | `/events/[eventId]/costs/new`, full screen | H | Description, currency, due date, and equal or custom reimbursement records for accepted guests | `HARDEN` |
| `COST-03` | Cost Share Detail | `/events/[eventId]/costs/[splitId]`, push | H/G-auth owner | Request state, note, external reference, confirm, dispute, cancel | `HARDEN` |
| `COST-04` | My Cost Shares | `/(tabs)/events/costs`, push | G-auth | Current member's outstanding and resolved shares | `BUILD` |
| `BRD-01` | PartyBoard | `/events/[eventId]/board`, canvas or list | H/C/G-auth | Persistent notes and ideas, categories, votes, movement, accessible list | `BUILD` |
| `BRD-02` | Board Item Detail And Edit | `/events/[eventId]/board/items/[itemId]`, push | H/C/G-auth | Read, edit own, vote, categorize, report, and authorized delete | `BUILD` |

## Games: 5 Screens

| ID | Screen | Route and presentation | Actor | Primary responsibility | Status |
|---|---|---|---|---|---|
| `GAM-01` | Game Library | `/(tabs)/games`, tab root | M/G-auth | Show only launch-playable games with optional event context | `HARDEN` |
| `GAM-02` | Game Setup | `/games/[gameId]/setup`, push | M/G-auth | Instructions, duration, local player names, and start validation | `HARDEN` |
| `GAM-03` | Trivia Play | `/games/run/[runId]/trivia`, full screen | M/G-auth | Timed questions, answer feedback, score, pause, and resume | `HARDEN` |
| `GAM-04` | Getting To Know You Play | `/games/run/[runId]/getting-to-know-you`, full screen | M/G-auth | Prompt, sharing timer, follow-up, skip, pause, and next round | `HARDEN` |
| `GAM-05` | Game Results | `/games/run/[runId]/results`, replacement | M/G-auth | Results, replay, switch game, share, and return | `HARDEN` |

## PartyCrew, Feed, And Profiles: 9 Screens

| ID | Screen | Route and presentation | Actor | Primary responsibility | Status |
|---|---|---|---|---|---|
| `SOC-01` | PartyCrew Feed | `/(tabs)/crew`, tab root | M | Moderated feed, filters, pagination, and seen state | `PORT` |
| `SOC-02` | Post Detail And Comments | `/crew/posts/[postId]`, push | M | Full post, comments, replies, like, share, profile, report | `BUILD` |
| `SOC-03` | Compose Or Edit Post | `/crew/posts/compose`, full screen | M | Supported post type, event link, audience, preview, filtered publish | `BUILD` |
| `SOC-04` | Discover People | `/crew/discover`, push | M | Suggestions, reasons, profile navigation, join or request state | `HARDEN` |
| `SOC-05` | Profile | `/profile/[userId]`; own profile uses `/(tabs)/me` | ALL | Privacy-aware profile, stats, relationship, website, report, block | `HARDEN` |
| `SOC-06` | Edit Profile | `/profile/edit`, push | M | Display name, bio, location, website, avatar, and cover | `HARDEN` |
| `SOC-07` | Connections | `/profile/[userId]/connections`, push | M | Members, Crewing, and Mutual lists with privacy and pagination | `PORT` |
| `SOC-08` | Crew Requests | `/crew/requests`, push | M | Received and sent requests; accept, decline, and cancel | `HARDEN` |
| `SOC-09` | Blocked Accounts | `/settings/blocked`, push | M | List, explain suppression, and unblock | `BUILD` |

## Notifications, Settings, Support, Moderation, And Account: 13 Screens

| ID | Screen | Route and presentation | Actor | Primary responsibility | Status |
|---|---|---|---|---|---|
| `NTF-01` | Notification Center | `/notifications`, push | M | Activity, unread state, mark read, and safe destination routing | `HARDEN` |
| `NTF-02` | Notification Preferences | `/settings/notifications`, push | M | In-app, push, email, event, Crew, and request preferences | `BUILD` |
| `SET-01` | Settings | `/settings`, push from Me | M | Account, notifications, privacy, blocks, support, legal, sign out | `PORT` |
| `SET-02` | Account And Security | `/settings/account`, push | M | Email status, password, sessions, sign out, and deletion entry | `BUILD` |
| `SET-03` | Privacy And Visibility | `/settings/privacy`, push | M | Private account, event attendance, Crew list, and activity status | `HARDEN` |
| `SUP-01` | Help And Support | `/support`, public push | ALL | Search topics, contact details, service status, access help | `BUILD` |
| `SUP-02` | Help Article | `/support/[slug]`, public push | ALL | Versioned answer, related content, and support escalation | `BUILD` |
| `SUP-03` | Contact Support | `/support/contact`, public push | ALL | Category, message, optional diagnostics, and ticket reference | `BUILD` |
| `MOD-01` | Report Content Or User | `/report/[targetType]/[targetId]`, full screen | ALL with an authorized public or invitation context | Reason, details, immediate hide, optional signed-in block, confirmation | `BUILD` |
| `LEG-01` | Community Guidelines | `/legal/community`, public push backed by bundled and remotely versioned content | ALL | UGC rules, prohibited conduct, enforcement, and appeal route | `BUILD` |
| `LEG-02` | Terms Of Service | `/legal/terms`, public push backed by bundled and remotely versioned content | ALL | Versioned terms linked from signup and Settings | `BUILD` |
| `LEG-03` | Privacy Policy | `/legal/privacy`, public push backed by bundled and remotely versioned content | ALL | Collection, third parties, retention, consent, and deletion | `BUILD` |
| `ACC-01` | Delete Account | `/settings/account/delete`, guarded full screen | M | Impact, ownership handling, reauthentication, confirmation, status | `BUILD` |

## System And Recovery: 5 Screens

| ID | Screen | Route and presentation | Actor | Primary responsibility | Status |
|---|---|---|---|---|---|
| `SYS-01` | Launch And Session Restore | Internal `/launch` gate | ALL | Splash, secure restore, local migration, destination continuation | `NATIVE` |
| `SYS-02` | Deep-Link Router | Internal `/resolve-link` interception route | ALL | Validate auth, invite, event, poll, profile, pass, and notification links | `NATIVE` |
| `SYS-03` | Offline Or Degraded Mode | `/offline`, full-screen fallback | ALL | Retry and safe cached event, timeline, pass, legal, and help access | `NATIVE` |
| `SYS-04` | Content Unavailable | `/unavailable`, route replacement | ALL | Safe deleted, blocked, forbidden, invalid, and expired outcomes | `NATIVE` |
| `SYS-05` | Update Or Maintenance Gate | `/system-gate`, root blocking route | ALL | Required update and maintenance variants with retry and status link | `BUILD` |

## Screen Count

| Domain | Count |
|---|---:|
| Authentication | 8 |
| Events and creation | 15 |
| Invitations, RSVP, guests, and check-in | 14 |
| Timeline, polls, costs, and PartyBoard | 11 |
| Games | 5 |
| PartyCrew, feed, and profiles | 9 |
| Notifications, settings, support, moderation, and account | 13 |
| System and recovery | 5 |
| **Total** | **80** |

## Native And System Surfaces

These surfaces are controlled by iOS or another installed application and are not app-owned screens.

| ID | Surface | Trigger | Required fallback |
|---|---|---|---|
| `OS-01` | Notification permission | User enables push or schedules a first reminder | In-app notifications remain active; offer iOS Settings after denial |
| `OS-02` | Contact selection | User chooses Import Contacts in `EVT-07` | Manual add; never automatically import or preselect all contacts |
| `OS-03` | Camera permission | Host or co-host opens `CHK-02` | Return to `CHK-01` manual search and check-in |
| `OS-04` | System photo picker | Avatar, cover, or invitation artwork | Continue without an image; no broad library access required |
| `OS-05` | Apple Maps handoff | Directions from `EVT-11` or `RSVP-03` | Copy the formatted address |
| `OS-06` | Calendar event editor | Add to Calendar from `EVT-11` or `RSVP-03` | Share an `.ics` file or continue without saving |
| `OS-07` | Mail handoff | Open Mail from `AUTH-04` | Keep resend and change-email actions available |
| `OS-08` | App Store handoff | Required update from `SYS-05` | Show the product-page link and retry after returning |
| `OS-09` | iOS Settings handoff | User wants to change a denied notification, contacts, camera, or photo permission | Keep the app's non-permission fallback available |

## Reusable Overlays

| ID | Overlay | Owners |
|---|---|---|
| `OVL-01` | Unsaved changes or discard confirmation | Creation, event edit, timeline edit, invitation edit, post edit |
| `OVL-02` | Add or edit guest sheet | `EVT-07`, `GST-01`, `GST-02`, `INV-04` |
| `OVL-03` | Add or edit timeline item sheet | `EVT-08`, `TIM-02` |
| `OVL-04` | PartyBoard item composer and action menu | `BRD-01`, `BRD-02` |
| `OVL-05` | Destructive confirmation | Event, guest, poll, cost, board, block, draft, game-abandon, and account actions |
| `OVL-06` | Invitation send or resend confirmation and result | `INV-04`, `INV-05` |
| `OVL-07` | Native share sheet | Event link, invitation, post, and game result |
| `OVL-08` | Crew relationship actions | Notification toggle, Leave PartyCrew, cancel request, report, and block |
| `OVL-09` | Offline, reconnecting, and stale-data banner | Any server-backed screen |

## Operational Workflows

These workflows run in protected staff tooling and backend services. They are launch requirements even though they are not consumer screens.

| ID | Workflow | Outcome | Status |
|---|---|---|---|
| `OPS-01` | UGC filtering | Reject or quarantine unsafe profile/event/invitation text, posts, comments, polls, board items, avatars, covers, invitation artwork, and post media before exposure | `BUILD` |
| `OPS-02` | Moderation triage | Inspect evidence, decide, remove, warn, suspend, notify, and audit | `BUILD` |
| `OPS-03` | Block enforcement | Suppress profiles, discovery, feed, relationships, notifications, comments, polls, and board interactions in both directions | `BUILD` |
| `OPS-04` | Support handling | Create, route, reply to, resolve, and retain an auditable support ticket | `BUILD` |
| `OPS-05` | Account deletion fulfillment | Revoke access, resolve hosted content, delete personal data and UGC, retain only disclosed legal records | `BUILD` |
| `OPS-06` | Invitation abuse and delivery recovery | Revoke leaked tokens, rate-limit sends, suppress bounces, retry eligible failures, and audit | `HARDEN` |
| `OPS-07` | Event lifecycle scheduling | Move published events to active and active events to completed with idempotent bounded jobs, audit records, correction, retry, and alerting | `BUILD` |

## Universal-Link Contract

| External path | Destination |
|---|---|
| `https://partyhause.com/join/:token` | `SYS-02 -> RSVP-01` |
| `https://partyhause.com/auth/verify-email?token=...&email=...` | `SYS-02 -> AUTH-05` |
| `https://partyhause.com/auth/reset-password?token=...&email=...` | `SYS-02 -> AUTH-07` |
| `https://partyhause.com/events/:eventId` | `SYS-02 -> AUTH-02` if needed, then `EVT-11` |
| `https://partyhause.com/events/:eventId/polls/:pollId` | `SYS-02 -> AUTH-02` if needed, then `POL-03` |
| `https://partyhause.com/profile/:userId` | `SYS-02 -> SOC-05` |
| Existing `/event/:eventId/guest/:guestId` links | Exchange for a scoped guest credential or show `SYS-04`; a raw guest ID never grants access |
| `partyhause://checkin/v1/:opaqueCredential` | QR payload consumed by `CHK-02`; the signed, expiring, revocable credential resolves the event and guest server-side and rejects raw IDs |

Universal Links require an Associated Domains entitlement and an `apple-app-site-association` file served over HTTPS without redirects.
