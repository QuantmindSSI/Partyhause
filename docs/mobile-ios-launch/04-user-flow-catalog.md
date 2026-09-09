# IOS-MVP-1 User Flow Catalog

## Flow Contract

The registry contains exactly six flows. Each flow includes its happy path, authorization boundary,
primary failures, retry behavior, accessibility path, and durable postcondition.

## `FL-01`: Account Lifecycle

Actor: `V`, becoming `H`

Entry: Fresh launch or expired session

Primary path: `SYS-01 -> AUTH-01 -> AUTH-03 -> AUTH-04 -> EXT-01 -> WEB-AUTH-01 -> AUTH-02 -> EVT-01`

Recovery path: `AUTH-02 -> AUTH-05 -> EXT-02 -> WEB-AUTH-02 -> AUTH-02`

Exit path: `SET-01 -> sign out -> AUTH-01`

Success:

- One verified account exists with versioned consent.
- A valid session is stored in Keychain and validated before host data renders.
- Password recovery changes the password once and returns to Sign In.
- Sign-out revokes the session and clears local private data.

Required branches:

- Duplicate signup response provides safe recovery without exposing unrelated account data.
- Weak password preserves nonsensitive fields and focuses the password error.
- Verification resend is bounded and responds identically for unknown or already verified email.
- Invalid, expired, malformed, and reused verification or reset credentials disclose no account
  state.
- Email delivery failure does not claim that a message was sent and offers bounded retry.
- Offline launch does not treat an unvalidated stored token as newly authorized.
- VoiceOver and Voice Control complete signup, Sign In, recovery, and sign-out.

Postcondition: the user is either a verified signed-in host with one validated session, or fully
signed out with no private device state.

## `FL-02`: Event Lifecycle

Actor: `H`

Entry: `EVT-01`

Path: `EVT-01 -> EVT-02 -> EVT-03 -> EVT-02 -> EVT-03 -> OVL-02 -> EVT-01`

Success:

- One private server draft is created, published, edited, completed or cancelled, and deleted only
  through an allowed transition.
- The event always has one host and a fixed capacity of 50 guests.

Required branches:

- Missing title, invalid timezone, invalid date, or end before start is rejected without data loss.
- Leaving a dirty form uses `OVL-01`.
- Retry after a lost response does not create a second event.
- A server draft reopens with confirmed fields after process termination.
- Publish failure leaves the event as a draft.
- Concurrent edit detects a stale revision instead of overwriting newer data.
- A client request for public visibility, another host, or capacity above 50 is rejected.
- Published deletion requires cancellation; draft, completed, and cancelled deletion names impact.
- The completion job runs once and has bounded retry and alerting.

Postcondition: the server status and displayed status agree, and no deleted event remains reachable.

## `FL-03`: Guests And Invitations

Actor: `H`

Entry: Published `EVT-03`

Path: `EVT-03 -> GST-01 -> GST-02 -> GST-01 -> INV-01 -> OVL-03 -> INV-01`

Success:

- Up to 50 unique event guests exist.
- The fixed invitation is sent only to selected guest records.
- Each recipient receives one event-and-guest-scoped browser RSVP token.

Required branches:

- Name and valid email are required and normalized.
- Duplicate normalized email returns the existing guest rather than creating another.
- The 51st guest and any batch that crosses 50 are rejected transactionally.
- Guest removal revokes the RSVP token and prevents later send or RSVP.
- Unselected guests and addresses not on the event guest list cannot receive a send.
- A double tap or lost response cannot duplicate an accepted send.
- Partial provider failure identifies failed recipients and retries only eligible failures.
- Bounce and rate-limit responses remain truthful and recoverable.
- The fixed email contains the correct private event facts and HTTPS RSVP URL.

Postcondition: guest count remains within 50 and delivery records match provider evidence.

## `FL-04`: Browser RSVP

Actor: `R`

Entry: Invitation email link

Path: `EXT-02 -> WEB-RSVP-01 -> choose response -> confirmation on WEB-RSVP-01`

Success:

- The existing token-bound guest changes from `pending` to `accepted`, `maybe`, or `declined`.
- No account, app installation, native route, or second guest record is created.

Required branches:

- Opening the link is read-only and does not consume or mutate the response.
- Repeating the same response is idempotent.
- A valid later response replaces the prior response on the same guest.
- Malformed, expired, revoked, removed-guest, cancelled-event, deleted-event, and deleted-account
  tokens share a privacy-safe unavailable response.
- A token for one guest cannot read or mutate another guest.
- Refresh, browser back, and a dropped response cannot create a duplicate guest or ambiguous state.
- Keyboard and screen-reader users can inspect event facts and submit every response.

Postcondition: one guest record contains the latest confirmed RSVP state and response time.

## `FL-05`: Attendance And Check-In

Actor: `H`

Entry: `GST-01` for a published event

Path: `GST-01 -> search or filter -> check in -> confirmation -> optional OVL-02 correction`

Success:

- One accepted guest is checked in once with actor and timestamp evidence.
- An explicit correction changes state without erasing audit history.

Required branches:

- Pending, maybe, and declined guests have no valid check-in action.
- Repeated check-in returns the original timestamp and does not add another audit event.
- A stale screen refreshes authoritative state after conflict.
- An unrelated account receives no event or guest existence information.
- Network failure leaves state unchanged and offers retry.
- Search and RSVP filter work together across all 50 records.
- Check-in is fully operable without camera, QR, drag, or gesture-only controls.

Postcondition: attendance totals equal checked-in accepted records and every correction is auditable.

## `FL-06`: Account Deletion

Actor: `H/O`

Entry: `SET-01`

Path: `SET-01 -> ACC-01 -> OVL-02 -> reauthenticate -> confirm -> OPS-03 -> AUTH-01`

Success:

- All sessions are revoked immediately.
- Hosted events and dependent guest, invitation, RSVP, delivery, and attendance data become
  inaccessible immediately and follow document 01 retention limits.
- Completion is communicated without requiring support contact.

Required branches:

- The host can cancel before final confirmation.
- Wrong or stale credentials retain the impact review and require another authentication attempt.
- A repeated deletion command returns the existing request and cannot create conflicting work.
- A worker failure keeps access revoked, preserves resumable state, and alerts operations.
- Deletion of an account with published events cancels access links before data erasure.
- Backup expiry and restore tombstone replay are verified.
- The retained 365-day deletion audit contains no direct identifier.
- Sign-in, reset, RSVP, and event URLs fail safely after completion.

Postcondition: no active account or user-accessible personal data remains, subject only to the exact
disclosed residual periods.

## Exact Flow Count

| Domain | Flow | Count |
|---|---|---:|
| Account lifecycle | `FL-01` | 1 |
| Event lifecycle | `FL-02` | 1 |
| Guests and invitations | `FL-03` | 1 |
| Browser RSVP | `FL-04` | 1 |
| Attendance and check-in | `FL-05` | 1 |
| Account deletion | `FL-06` | 1 |
| **Total** |  | **6** |
