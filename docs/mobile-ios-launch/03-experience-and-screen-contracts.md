# IOS-MVP-1 Experience And Screen Contracts

## Design Direction

The iPhone app is a focused host tool. It uses PartyHause color and energy for identity while forms,
status, and destructive actions follow familiar iOS behavior.

- Use the iOS system font for all task text and controls.
- Use a dark Ink header, warm Paper content, coral-700 primary actions, and Signal Red only for
  destructive or critical states. Coral-500 remains a decorative brand color and never carries
  body-size white text.
- Do not use event artwork, gradients, motion, or haptics as the only source of meaning.
- Keep one visually dominant action per screen.
- Keep all required actions above the home indicator and reachable when the keyboard is open.
- Support iPhone portrait layouts from the smallest supported display through the current large
  iPhone screenshot size.

## Universal State Contract

Every applicable native and browser surface implements these states:

| State | Required behavior |
|---|---|
| Initial loading | Show stable progress; do not flash a false empty state |
| Refreshing | Keep confirmed data visible and identify refresh separately |
| Empty | Explain the absence and provide one relevant next action |
| Validation error | Preserve input, associate error with its field, and focus the first error |
| Mutation pending | Prevent duplicate submission while preserving safe cancellation |
| Mutation success | Reflect confirmed server state and present the next valid action |
| Recoverable error | State what failed, retain input, and offer a bounded retry |
| Offline | Keep readable onscreen data, block mutation, and never claim queued success |
| Unauthorized | Clear or lock private state and route to Sign In without leaking data |
| Forbidden or missing | Use one privacy-safe unavailable result |
| Deleted or expired | Remove stale actions and return to a valid parent or public page |

Every registered surface also has:

- A stable ID and route.
- A defined actor and server authorization rule.
- A deterministic return destination.
- VoiceOver labels, traits, values, reading order, error announcements, and focus behavior.
- Dynamic Type, Voice Control, Increase Contrast, Differentiate Without Color, and Reduce Motion
  behavior.
- Sensitive-value redaction for logs, diagnostics, and analytics.
- A retry and idempotency rule for every mutation.

## Component Contracts

### Primary action

- Use an action and object, such as `Publish event` or `Send 12 invitations`.
- Show progress without changing the button's position or label meaning.
- Disable repeat submission while the same command is pending.
- Announce the confirmed result in visible text and to assistive technology.

### Form field

- Keep a visible label while editing.
- State requirements before submit.
- Use the correct keyboard and content type.
- Preserve valid fields after client or server validation failure.
- Do not place passwords, tokens, email addresses, or event content in analytics.

### Event row

- Show title, local date and time, venue, and stored status.
- Use text and a symbol for status.
- Never derive `published` from a client mapper.
- Expose only host actions and only for events owned by the current account.

### Guest row

- Show name, masked email where practical, RSVP text, and check-in text.
- Never rely on color alone.
- Keep Edit and Check In visible without a long press.
- Show no check-in action for `pending`, `maybe`, or `declined` guests.

### Status vocabulary

| Object | Allowed labels |
|---|---|
| Event | Draft, Published, Completed, Cancelled |
| RSVP | Pending, Accepted, Maybe, Declined |
| Delivery | Queued, Accepted by provider, Delivered, Bounced, Failed |
| Attendance | Not checked in, Checked in |

The UI does not show Opened or Clicked unless the active provider supplies trustworthy evidence and
the privacy disclosures include that collection.

## Native Screen Acceptance

| Screen | Acceptance contract |
|---|---|
| `SYS-01` | Waits for Keychain read and `/api/auth/me`; routes once; clears rejected session and private cache |
| `AUTH-01` | No permission prompt; accurately describes the host-only private-event product; public links work |
| `AUTH-02` | Supports unverified-account recovery; bad credentials do not reveal unrelated account existence |
| `AUTH-03` | Shows password rules and legal links before consent; records age and accepted document versions |
| `AUTH-04` | Shows a masked address; resend is bounded and enumeration-safe; Mail handoff is optional |
| `AUTH-05` | Gives the same acknowledgement for known and unknown email addresses |
| `EVT-01` | Shows owned events only; error is distinct from empty; excluded tabs and invited events are absent |
| `EVT-02` | Uses plain fields only; validates timezone and date order; saves one server draft; publishes only after server confirmation |
| `EVT-03` | Shows authoritative state; edit, cancel, and delete obey the lifecycle; no excluded action appears |
| `GST-01` | Shows server counts for at most 50 guests; search and RSVP filter compose; accepted guests alone can be checked in |
| `GST-02` | Normalizes and deduplicates email; rejects the 51st guest; removal states invitation and RSVP impact |
| `INV-01` | Lists real event guests; sends a fixed server-rendered email; reports per-recipient truth; retry excludes successes |
| `SET-01` | Shows server account facts; legal/support links work; sign-out clears all local private state; deletion is easy to find |
| `ACC-01` | Names every data consequence; requires recent authentication and exact confirmation; never substitutes deactivation |

## Browser Surface Acceptance

| Surface | Acceptance contract |
|---|---|
| `WEB-AUTH-01` | Valid token verifies once; invalid, expired, reused, and unknown combinations share a safe failure state |
| `WEB-AUTH-02` | Valid token changes the password once; invalid, expired, reused, and unknown combinations share a safe failure state |
| `WEB-RSVP-01` | Does not require an account; reveals only scoped facts; updates one existing guest; invalid token reveals nothing |
| `WEB-LEGAL-01` | Matches actual data, processors, retention, deletion, tracking, and permission behavior |
| `WEB-LEGAL-02` | Displays version and effective date; matches the version recorded during signup |
| `WEB-SUP-01` | Provides a current contact path and specific help for account, RSVP, privacy, and deletion issues |

## Accessibility Contract

All six release cases must complete with VoiceOver, Voice Control, Larger Text, Reduce Motion,
Increase Contrast, and Differentiate Without Color where the mode applies.

- Touch targets are at least 44 by 44 points.
- Text remains usable at 200 percent and at iOS accessibility sizes.
- Focus moves to the screen title after navigation and to the first invalid field after submit.
- Custom controls expose name, role, value, state, and action.
- Status always has text or a symbol in addition to color.
- Destructive confirmations identify the affected event, guest, or account.
- Browser surfaces meet WCAG 2.2 AA for keyboard operation, focus, labels, errors, reflow, contrast,
  and target size.
- Check-in has a visible button path and does not depend on gesture, camera, or QR recognition.

Publishing an App Store accessibility claim is allowed only when the complete common-task evidence
supports it.

## Permission Contract

IOS-MVP-1 requests no sensitive iOS permission. The release must contain no purpose string or
runtime request for contacts, camera, photos, microphone, location, notifications, local network,
or tracking. Mail and browser handoffs use system URL handling and do not require those permissions.

## Content Contract

- Use `host` for the signed-in account and `guest` for an invitation recipient.
- Do not use co-host, member, PartyCrew, follower, guest pass, or native guest terminology.
- Do not claim that an email was delivered when the provider only accepted it.
- Do not claim that an event was published, a guest was checked in, or an account was deleted until
  the server confirms the durable state.
- Do not claim offline, realtime, push, media, template, payment, iPad, or Android launch support.

## Performance Budgets

| Interaction | Release target |
|---|---|
| Cold launch to usable signed-out or validated signed-in route | 2.5 seconds at p75 on the slowest supported iPhone |
| Warm tab switch | Visible response within 100 ms |
| Event list from warm cache in memory | Content frame within 500 ms |
| Server list response under normal network | p95 at or below 1 second for 50 guests |
| Primary action acknowledgement | Press state within one frame and pending state within 100 ms |
| Browser RSVP usable content | Largest content paint at or below 2.5 seconds at p75 on mobile cellular |

Normal network measurements record device, OS, build, region, latency, and result. A budget miss is
a release defect when it blocks a primary task or causes a false retry.
