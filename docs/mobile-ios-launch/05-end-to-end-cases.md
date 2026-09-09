# IOS-MVP-1 End-To-End Cases

## Execution Rule

Exactly six cases define release acceptance. Each case runs against a production-like API and
database with deterministic fictional data. Every listed branch is required when it changes
authorization, durable state, privacy, or recovery behavior.

## `C01`: Account Lifecycle

### Objective

Prove registration, legal consent, browser verification, sign-in, session validation, password
recovery, and sign-out without a sensitive iOS permission.

### Setup

| Item | Requirement |
|---|---|
| Device | Clean installation on a supported physical iPhone |
| Account | New controlled email inbox plus one existing verified account |
| Network | Normal network, then one offline launch |
| Accessibility | Repeat primary path with VoiceOver and accessibility text |

### Path

`SYS-01 -> AUTH-01 -> AUTH-03 -> AUTH-04 -> WEB-AUTH-01 -> AUTH-02 -> EVT-01 -> SET-01 -> AUTH-01`

### Main Steps

1. Launch and verify that no permission prompt appears.
2. Open Privacy, Terms, and Support from `AUTH-01`, then return.
3. Create an account with valid name, normalized email, password, age assertion, and legal consent.
4. Confirm no session exists and `AUTH-04` shows a masked email.
5. Open the email in a browser and complete `WEB-AUTH-01` once.
6. Sign in and verify `SYS-01` validates the stored session before `EVT-01` renders.
7. Terminate and reopen the app; confirm one restored session and no duplicate navigation.
8. Sign out from `SET-01`; confirm Keychain and private local data are cleared.
9. Request a reset from `AUTH-05`, complete `WEB-AUTH-02`, and sign in with the new password.

### Required Branches

| Branch | Expected result |
|---|---|
| Duplicate signup | Safe recovery action; no unrelated account facts |
| Weak password | Other fields retained; password error focused |
| Resend for unknown or verified email | Same acknowledgement as an eligible address |
| Expired, malformed, or reused verification link | One safe failure and a new-request path |
| Unknown reset email | Same acknowledgement and timing class as a known email |
| Expired, malformed, or reused reset link | One safe failure and a new-request path |
| Offline launch with stored token | No protected host data renders as newly authorized |
| Rejected stored session | Credentials and private cache clear before `AUTH-01` |

### Acceptance

- `FL-01` passes.
- Verification and reset tokens each succeed once.
- Consent versions and age assertion are stored.
- Sign-out invalidates the server session and clears device data.
- No contacts, camera, photos, notifications, microphone, location, or tracking prompt occurs.

## `C02`: Event Lifecycle

### Objective

Prove a host can create, save, publish, edit, complete, cancel, and delete private events with one
authoritative status and no excluded creation feature.

### Setup

| Item | Requirement |
|---|---|
| Actor | Verified host |
| Events | No initial event, plus deterministic clock control |
| Data | Plain title, description, start, end, IANA timezone, and venue |
| Failure | One publish response is dropped after the server receives the command |

### Path

`EVT-01 -> EVT-02 -> EVT-03 -> EVT-02 -> EVT-03 -> OVL-02 -> EVT-01`

### Main Steps

1. Open empty `EVT-01` and start `EVT-02`.
2. Enter plain event fields and verify privacy is fixed to private and capacity to 50.
3. Save a server draft, terminate the app, reopen it, and resume confirmed values.
4. Publish and confirm `EVT-03` reports the server's `published` status.
5. Edit the venue using a revision check and confirm the updated server value.
6. Advance the test clock beyond the end and verify one transition to `completed`.
7. Create and publish a second event, cancel it through `OVL-02`, then delete it.
8. Delete the completed event and verify direct links return a safe unavailable result.

### Required Branches

| Branch | Expected result |
|---|---|
| End before start or invalid timezone | Save blocked; input retained |
| Dirty back navigation | `OVL-01` prevents silent loss |
| Public privacy or capacity above 50 submitted | API rejects the request |
| Lost create response | Retry returns the original draft, not a duplicate |
| Lost publish response | Refresh shows the single durable server result |
| Concurrent edit | Stale revision cannot overwrite newer data |
| Publish validation failure | Event remains draft |
| Direct published deletion | Must cancel before deletion |
| Completion worker failure | At most five attempts, then an operator alert |

### Acceptance

- `FL-02` and the completion branch of `OPS-02` pass.
- Every event has exactly one host, private visibility, and capacity 50.
- The release shows no template, AI, timeline, poll, PartyBoard, cost, game, co-host, media, or public
  discovery control.
- Client and server status agree after every mutation and retry.

## `C03`: Guests And Invitations

### Objective

Prove manual guest management, the 50-guest boundary, fixed invitation delivery, authorization,
truthful result reporting, and retry behavior.

### Setup

| Item | Requirement |
|---|---|
| Actor | Host of one published private event |
| Guests | 48 unique fixtures, one case-variant duplicate, and two new unique addresses |
| Provider | Accepted, delivered, transient failure, permanent bounce, and timeout fixtures |
| Other account | Owns a separate event and guest list |

### Path

`EVT-03 -> GST-01 -> GST-02 -> GST-01 -> INV-01 -> OVL-03 -> INV-01`

### Main Steps

1. Load `GST-01`; verify server totals and distinct loading, empty, and error states.
2. Add the 49th guest manually and edit the name without changing normalized email identity.
3. Attempt the case-variant duplicate and verify no second guest appears.
4. Add the 50th guest and verify the exact count.
5. Select three real guests in `INV-01`, inspect the fixed event details, and confirm through
   `OVL-03`.
6. Send once and verify each recipient receives a distinct HTTPS RSVP URL.
7. Compare queued, accepted, delivered, bounced, and failed labels with provider evidence.
8. Retry the transient failure and verify accepted or bounced recipients are not sent again.
9. Remove one guest and verify the guest's RSVP credential is revoked immediately.

### Required Branches

| Branch | Expected result |
|---|---|
| 51st guest | Transaction rejected; count remains 50 |
| Batch crossing the cap | Entire batch rejected; no partial insert |
| Invalid or missing email | Field error; no guest created |
| Address not on this event | Send rejected before provider contact |
| Guest from another host's event | No existence disclosure and no send |
| Double submit | One idempotent delivery command |
| Provider timeout after acceptance | Reconciliation prevents duplicate send |
| Partial failure | Successful and failed recipients are separated |
| Rate limit | Next eligible time shown; selection retained |

### Acceptance

- `FL-03` and `OPS-01` pass.
- The event never exceeds 50 unique normalized guest emails.
- No contact picker, invitation template, artwork, arbitrary HTML, or arbitrary recipient is used.
- Delivery statements match provider evidence.

## `C04`: Browser RSVP

### Objective

Prove a guest can respond from the invitation in a mobile browser without an account, app install,
native guest mode, or data exposure.

### Setup

| Item | Requirement |
|---|---|
| Actor | Signed-out invitation recipient |
| Browser | Safari on a supported iPhone |
| Invitation | Valid single-guest token for a published private event |
| Guest | Existing record in `pending` state |

### Path

`Invitation email -> EXT-02 -> WEB-RSVP-01`

### Main Steps

1. Open the HTTPS link and confirm Safari remains the destination.
2. Verify only title, host display name, dates, timezone, venue, and current response are visible.
3. Refresh and use browser Back; confirm no mutation occurred.
4. Choose `maybe`, submit once, and verify the same guest record changed.
5. Reopen the link, choose `accepted`, and verify it replaces `maybe` on the same record.
6. Repeat `accepted` and verify the response is idempotent.
7. Reopen and choose `declined`; verify no account or second guest is created.
8. Open Privacy and Support, return, and confirm the RSVP context remains valid.

### Required Branches

| Branch | Expected result |
|---|---|
| Malformed token | Privacy-safe unavailable result |
| Expired or revoked token | Same unavailable result |
| Removed guest | Same unavailable result |
| Cancelled or deleted event | Same unavailable result |
| Deleted host account | Same unavailable result |
| Token substituted for another guest | Cannot read or mutate the other guest |
| Dropped submit response | Retry returns one final state, not a duplicate |
| Keyboard and screen reader | Full preview and response flow remains operable |

### Acceptance

- `FL-04` passes.
- One existing guest contains the latest response and response time.
- The page creates no PartyHause account, native session, social relationship, or tracking ID.
- No private event or guest-list field appears.

## `C05`: Attendance And Check-In

### Objective

Prove the host can derive attendance and manually check in an accepted guest exactly once, correct
an error, and recover from failure without camera or QR.

### Setup

| Item | Requirement |
|---|---|
| Actor | Event host |
| Event | Published private event with 50 guests |
| RSVP mix | Accepted, pending, maybe, and declined records |
| Failure | One network timeout and one stale-screen conflict |

### Path

`EVT-03 -> GST-01 -> search/filter -> check in -> OVL-02 correction`

### Main Steps

1. Open `GST-01` and compare totals with server records.
2. Combine name search with the Accepted filter and select one guest.
3. Check in the guest and record the host ID and original timestamp.
4. Submit the same check-in again and verify the original timestamp remains.
5. Refresh on a second device and verify the same attendance total.
6. Correct the check-in through `OVL-02`; verify prior and new states remain in audit history.
7. Check in the guest again and verify one current checked-in state.

### Required Branches

| Branch | Expected result |
|---|---|
| Pending, maybe, or declined guest | No valid check-in action; API rejects direct request |
| Unrelated account | No event or guest existence disclosure |
| Timeout before acceptance | State remains unchanged and retry is available |
| Timeout after acceptance | Reconciliation returns original completed command |
| Stale correction | Conflict refreshes current state before another decision |
| Offline device | No mutation is queued or reported complete |
| VoiceOver and Voice Control | Search, filter, check-in, and correction complete without gesture-only input |

### Acceptance

- `FL-05` passes.
- Attendance totals equal accepted guests with current checked-in state.
- Duplicate check-in does not rewrite time or add another success event.
- No camera usage description, request, scanner, QR, or guest pass appears.

## `C06`: Account Deletion

### Objective

Prove in-app permanent deletion, reauthentication, immediate revocation, dependent-data disposition,
bounded worker recovery, and completion communication.

### Setup

| Item | Requirement |
|---|---|
| Actor | Verified host with a current session |
| Data | Draft, published, completed, and cancelled events; 50 guests; invitations; RSVPs; check-ins |
| Sessions | Two active device sessions |
| Worker | One injected transient failure |
| Backup | Restorable test backup containing pre-deletion data |

### Path

`SET-01 -> ACC-01 -> OVL-02 -> reauthenticate -> OPS-03 -> AUTH-01`

### Main Steps

1. Open `ACC-01` and compare its impact list with document 01.
2. Start deletion, open `OVL-02`, cancel, and verify the account remains active.
3. Start again, fail reauthentication once, and verify context is retained without deletion.
4. Reauthenticate, enter the exact confirmation, and submit once.
5. Verify both sessions lose access immediately and all event and RSVP links fail safely.
6. Inject one worker failure; verify access remains revoked and operations receive an alert.
7. Resume the same request and verify primary-store erasure within 24 hours.
8. Verify guest, delivery, RSVP, attendance, device, log, deletion-audit, and backup outcomes against
   every row in the document 01 matrix.
9. Restore the test backup in isolation, replay deletion tombstones, and verify the account is not
   served.
10. Confirm completion and verify sign-in and password reset cannot restore the account.

### Required Branches

| Branch | Expected result |
|---|---|
| Wrong password | Account remains active; impact review retained |
| Duplicate submit | Existing deletion request returned; no competing worker |
| Worker retry exhaustion | Access remains revoked; operator alert includes resumable step, not personal content |
| Published event | RSVP tokens revoke before asynchronous erasure |
| Legal hold | Only documented minimum data is isolated, access-controlled, audited, and later released |
| Backup before 7 days | Not served until deletion receipts replay |
| Backup after 7 days | Backup no longer exists under the current Azure PostgreSQL policy |

### Acceptance

- `FL-06`, `OPS-02`, and `OPS-03` pass.
- Deactivation is never presented as deletion.
- No support call or email is required to start or complete deletion.
- The 365-day deletion audit has no name, email, event, guest, token, or content.
- App Privacy and Privacy Policy retention statements match measured behavior.

## Exact Case Count

| Case | Domain | Canonical flow |
|---|---|---|
| `C01` | Account lifecycle | `FL-01` |
| `C02` | Event lifecycle | `FL-02` |
| `C03` | Guests and invitations | `FL-03` |
| `C04` | Browser RSVP | `FL-04` |
| `C05` | Attendance and check-in | `FL-05` |
| `C06` | Account deletion | `FL-06` |
| **Total** |  | **6** |
