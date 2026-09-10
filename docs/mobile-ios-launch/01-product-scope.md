# IOS-MVP-1 Product Scope

## Product Promise

PartyHause lets one host create a private event on iPhone, invite up to 50 named guests, collect
browser RSVPs, record attendance, and delete the account and its data.

## Actors

| Code | Actor | Authority |
|---|---|---|
| `V` | Signed-out visitor | Register, sign in, recover access, and open public legal or support pages |
| `H` | Verified host | Own and administer only their events, guests, invitations, and attendance |
| `R` | Browser RSVP recipient | Read the minimum event facts and update only the guest record bound to the token |
| `O` | Restricted operator or worker | Deliver invitations, expire event data, and fulfill deletion outside the consumer app |

There is no native guest actor and no co-host actor. Event authority is derived from
`event.host_id == authenticated_user.id` on every host operation.

## Fixed Decisions

| Area | IOS-MVP-1 decision |
|---|---|
| Devices | iPhone only |
| Minimum OS | iOS 17.0 |
| Orientation | Portrait |
| Authentication | First-party email and password only |
| Events | Private only |
| Event ownership | Exactly one host; no transfer and no co-host |
| Event size | At most 50 guest records; plus-ones are not supported |
| Guest entry | Manual name and email entry only |
| Invitation | One fixed server-rendered design; no template or media customization |
| RSVP | Browser only; no account required |
| Check-in | Host-only manual action; no camera or QR |
| Connectivity | Network required for mutations; failures remain retryable and never claim success |
| Permissions | No contacts, camera, photos, notifications, microphone, location, or tracking prompt |
| Monetization | Free; no payment or purchase surface |
| Release | Manual first release after all gates pass |

## Account Lifecycle

- Signup collects display name, normalized email, password, age-eligibility assertion, and accepted
  Terms and Privacy versions.
- Signup creates no authenticated session. The account must be verified before sign-in.
- Verification and password reset use single-use HTTPS links that complete in the browser.
- Login rejects unverified accounts with a recovery action and does not disclose unrelated account
  existence.
- The app validates a stored session with the API before rendering host data.
- Credentials use Keychain-backed storage. Sign-out removes credentials and all private local data.
- Permanent deletion starts in the app, requires recent authentication, revokes every session, and
  follows the disposition matrix below.
- Third-party login buttons are absent.

## Event Lifecycle

The only stored statuses are:

```text
draft -> published -> completed
                   -> cancelled
draft -> deleted
completed -> deleted
cancelled -> deleted
```

Rules:

- Create stores one server draft before reporting success.
- A draft requires title, start, end, timezone, and venue before publication.
- End must be after start. Timezone is an IANA identifier.
- `privacy` is always `private`; clients cannot submit another value.
- `max_guests` is always 50; clients cannot raise it.
- Publish is an explicit server transition. A client mapper cannot substitute a status.
- Published events become completed once after their end time through a bounded, idempotent job.
- A published event can be cancelled but not returned to draft.
- Deleting a published event requires cancellation first.
- Delete removes the event, guests, RSVP credentials, delivery records, and attendance records.
- Event creation and editing are manual. Templates, AI briefs, timelines, media, and collaborators are
  not part of the form.

## Guest And Invitation Rules

- Each guest has one event-scoped record containing name, normalized email, RSVP status, check-in
  status, and timestamps.
- `(event_id, normalized_email)` is unique.
- The API rejects a 51st guest and every bulk request that would cross the cap.
- Guest email is required because email is the only invitation channel.
- Removing a guest immediately revokes that guest's RSVP token.
- Invitation sends accept at most 50 selected guest IDs for one owned event.
- The server resolves addresses from guest IDs. A client cannot submit arbitrary recipients.
- The server renders the fixed email and creates one opaque, random, single-guest RSVP token per
  recipient. Only a hash is stored.
- A send command is idempotent. Retry sends only records whose prior attempt was not accepted by the
  provider.
- The send endpoint is limited to 50 recipients per command and 100 recipients per host per rolling
  hour.
- Delivery UI distinguishes queued, provider accepted, delivered when supported, bounced, and
  failed. It does not infer opens or clicks when the provider does not supply them.

## Browser RSVP Rules

- The canonical route is `https://partyhause.com/join/:token`.
- Opening the route does not install or open the native app.
- The token resolves one event and one existing guest. It cannot create a guest or expose the guest
  list.
- Before submission, the page shows event title, host display name, start, end, timezone, venue,
  current RSVP state, Privacy, and Support links.
- The recipient may choose `accepted`, `maybe`, or `declined`. The unchanged initial state is
  `pending`.
- Repeated submission of the same state is idempotent. A later valid response replaces the prior
  response on the same record and records the response time.
- Tokens expire at the event end, are revocable by guest removal or event cancellation, and are
  invalid after event or account deletion.
- Invalid, expired, revoked, or malformed tokens return one privacy-safe unavailable result.
- The browser flow creates no PartyHause account, social relationship, native session, or tracking
  identifier.

## Attendance And Check-In Rules

- Only the host can read attendance totals or mutate check-in state.
- Only an `accepted` guest can be checked in.
- Check-in is a dedicated event-scoped command, not a generic guest update.
- Repeating check-in returns the original result and does not rewrite its timestamp.
- Correction requires explicit confirmation and records actor, prior state, new state, and time.
- Check-in and correction require network confirmation. Offline state never queues or reports a
  completed mutation.

## Removed Scope

All items in the Excluded Product section of [README.md](./README.md) have disposition
`REMOVED_FROM_IOS_MVP`. In particular, the release has no PartyCrew/social surface, templates,
timeline, polls, PartyBoard, costs, games, push, realtime, media, contacts, camera, iPad, Android
launch, payments, co-hosts, or native guest mode.

## Security And Privacy Invariants

- Every host API verifies current ownership on the server.
- Browser RSVP authorization comes only from a high-entropy, hashed, expiring, revocable token.
- Responses never expose another event, guest, recipient, token, password, or internal error.
- Passwords use the repository's bcrypt cost 12 policy. Session JWT verification uses an explicit
  algorithm allow-list and production secret checks.
- Rate limits cover credentials, RSVP, invitation delivery, and deletion confirmation.
- Logs use allow-listed fields and omit email bodies, addresses, tokens, passwords, event copy, and
  full provider payloads.
- The release uses TLS only, no advertising, no IDFA, no fingerprinting, and no cross-company
  tracking.
- The final Privacy Policy, App Privacy answers, privacy manifests, network capture, and the matrix
  below must agree.

## Data Lifecycle And Disposition

These are product requirements for IOS-MVP-1. A release is blocked until storage, jobs, provider
contracts, policy text, and tests implement them.

| Data | Active retention | Trigger and primary-store disposition | Residual disposition |
|---|---|---|---|
| Account name, normalized email, password hash, consent records | While account is active | Make inaccessible immediately after confirmed deletion; erase within 24 hours | Current Azure PostgreSQL backups expire after 7 days |
| Email verification token hash | Maximum 24 hours | Erase on use or replacement; expired rows erased within 24 hours | No backup restoration after tombstone replay |
| Password reset token hash | Maximum 1 hour | Erase on use or replacement; expired rows erased within 24 hours | No backup restoration after tombstone replay |
| Session records and device credentials | Maximum 7 days | Revoke server-side and clear Keychain immediately on sign-out, password reset, or deletion | Security event retained without token for 30 days |
| Event record | Until host deletes it or deletes the account | Hide immediately and erase within 24 hours after deletion | Current Azure PostgreSQL backups expire after 7 days |
| Guest name, normalized email, RSVP, and response time | Until 30 days after event end | Erase within 24 hours after the retention deadline, guest removal, event deletion, or account deletion | Aggregate counts may remain only when they cannot identify a guest |
| RSVP token | Until event end or earlier revocation | Revoke immediately; erase token hash within 24 hours | No plaintext token is stored or logged |
| Invitation delivery record | 30 days after the send | Erase recipient address and provider payload within 24 hours after the deadline, event deletion, or account deletion | Non-identifying delivery totals may remain for 90 days |
| Check-in state and audit | 30 days after event end | Erase within 24 hours after the deadline, event deletion, or account deletion | No person-level attendance history remains |
| Support correspondence | 90 days after closure | Erase on schedule or verified deletion request unless a legal hold applies | Legal hold scope and release are access-controlled and audited |
| Security and abuse logs | Rolling 30 days | Automatic expiry; immediate secret and content redaction | A documented legal hold is the only extension |
| Deletion audit | 365 days | Retain random request ID, one-way subject tombstone, request time, completion time, and outcome | No name, email, event, guest, token, or content |
| Device data | Current session only | Clear private cache immediately on sign-out or deletion | No guest list or event data is retained in unencrypted general storage |
| Database backups | Current Azure PostgreSQL retention is 7 days | Expire automatically; deleted records are never selectively restored to production | Any full restore must replay deletion receipts before serving traffic |

The Privacy Policy must state the legal-hold exception and the processor retention that PartyHause
cannot shorten. A processor with a longer incompatible retention period cannot be used for this
release.

## Launch Success Criteria

- A new host can register, verify in a browser, sign in, restore a session, recover a password, and
  sign out without support.
- The host can create and publish one private event whose stored state matches the UI.
- A 50th guest can be added and a 51st cannot.
- Selected real guests receive the fixed invitation; unselected or unrelated addresses cannot be
  mailed through PartyHause.
- A recipient can RSVP in a browser without an account and without creating a duplicate guest.
- The host can check in an accepted guest exactly once and audit a correction.
- The host can delete the account in app and every data class follows the matrix.
- No excluded feature, permission, device family, or purchase claim appears in the release.
