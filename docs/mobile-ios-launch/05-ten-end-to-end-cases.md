# Ten End-To-End User-Flow Cases

## How To Use These Cases

These ten cases are release acceptance scenarios, not marketing personas. Together they cover every app-owned screen, canonical flow, iOS surface, reusable overlay, and operational workflow in the launch specification.

Each case must run against a production-like API with deterministic seed data. Alternate branches are part of the case and must be executed independently where they change state or authorization.

## `C01`: First-Time Member Publishes A Birthday Event

### Objective

Prove that a visitor can create and verify an account, complete a profile, turn a rough idea into a valid event, select contacts deliberately, and publish one consistent server-backed event.

### Actors and setup

| Item | Requirement |
|---|---|
| Primary actor | Visitor who becomes a member and host |
| Account | New email address with access to its inbox |
| Device | Fresh installation with no stored session |
| Event | Adult birthday for 20 people in the device's non-default timezone |
| Contacts | Permission not determined; at least three fictional contacts available |
| Service branch | AI service returns one recoverable failure before deterministic fallback succeeds |

### Screen path

```text
SYS-01 -> AUTH-01 -> AUTH-03 -> AUTH-04 -> SYS-02 -> AUTH-05
-> AUTH-02 -> AUTH-08 -> EVT-01 -> EVT-03 -> EVT-04 -> EVT-05
-> EVT-06 -> EVT-07 -> EVT-08 -> EVT-09 -> EVT-10 -> EVT-11
```

### Main steps

1. Launch the app and confirm that no permission prompt appears.
2. Open Create Account, review Terms and Privacy, enter valid identity data, and submit.
3. Confirm Check Your Email shows the correct masked address, does not imply an authenticated session, and opens Mail through `OS-07` without removing resend or change-email actions.
4. Open the verification Universal Link and confirm the app routes through the deep-link resolver.
5. Sign in and complete the profile without adding an image.
6. Start event creation from Events Home.
7. Describe the birthday in Smart Event Brief and recover from the AI service failure using the deterministic result.
8. Choose the adult birthday template and correct extracted details.
9. Enter multi-day-safe dates, timezone, venue, privacy, capacity, description, and playlist URL.
10. Complete template-specific fields.
11. Open contact selection, choose two contacts explicitly, then add one guest manually through `OVL-02`.
12. Add two timeline entries, edit one through `OVL-03`, and mark one as host-only.
13. Review the complete event, correct one validation error, and publish.
14. Confirm Event Created states `published`, then open Event Overview.

### Required alternate branches

| Branch | Expected result |
|---|---|
| Duplicate email | Create Account offers Sign In and Forgot Password without exposing unrelated account data |
| Weak password | Input is retained, first invalid field receives focus, password remains private |
| Verification resend | Submitted email is sent explicitly; rate-limit state is visible |
| Expired verification link | Verify Email Result offers a valid resend path |
| Malformed verification link | No token data is exposed and the user can request a fresh message |
| Reused verification link | Verify Email Result reports that the account is already verified and routes safely to Sign In |
| Verification on another device | The result is clear on that device and the original device can continue after sign-in |
| Contacts denied | `OS-02` returns to Initial Guest Setup and manual add remains available |
| Blank event | Template Details is skipped and review remains valid |
| Skip optional guests and timeline | Review remains valid and publishes no empty child records |
| Exit with edits | `OVL-01` offers Keep Editing or Save Draft And Leave |
| Process termination mid-wizard | Relaunch resumes the durable server draft at the same completed step |
| Child-resource failure | Event remains a named server draft with a targeted recovery action, not a false publish success |

### Acceptance

- Exactly one event record exists.
- Server and client both report `published`.
- Three deduplicated guest records and two canonical timeline records exist.
- The guest-visible timeline excludes the host-only entry.
- The user returns to the intended route after verification.
- The accepted Terms and Privacy versions plus age-eligibility assertion are stored with the account record.
- `FL-A01`, `FL-E01`, and `FL-Y01` pass.

## `C02`: Returning Host Resumes A Draft And Governs An Event

### Objective

Prove session restoration, server-backed draft recovery, event editing, lifecycle controls, co-host permissions, insight accuracy, degraded operation, and sign-out.

### Actors and setup

| Item | Requirement |
|---|---|
| Primary actor | Returning host |
| Secondary actor | Co-host whose edit permission can be revoked |
| Draft | Server draft at Template Details with a newer local recovery copy |
| Published event | Seeded with guests, invitations, timeline, and a co-host |
| Terminal event | Separate completed event available for archive and restore |
| Disposable event | Separate published event with deletable dependencies |
| Test clock | Can cross the start and end boundaries for the published event |
| Network | Can be switched offline and into maintenance response mode |
| Version service | Can require a newer minimum version |

### Screen path

```text
SYS-01 -> AUTH-02 when required -> EVT-01 -> EVT-02 -> EVT-09
-> EVT-11 -> EVT-12 -> EVT-13 -> EVT-14 -> EVT-15
-> SYS-03 -> SYS-05 -> SET-01 -> AUTH-01
```

### Main steps

1. Cold-launch and restore the prior session through server validation.
2. Open Event Drafts and compare server and local recovery timestamps.
3. Resolve the conflict, resume the exact saved step, and reach Review And Publish.
4. Save again, duplicate the draft, and delete the duplicate through `OVL-05`.
5. Open the published event and edit its date and capacity.
6. Trigger `OVL-01`, keep editing, then save successfully.
7. Advance the test clock and verify `OPS-07` performs `published -> active -> completed` once with an audit record.
8. Open Event Access And Lifecycle, cancel a separate published fixture, then archive and restore the completed event.
9. Delete the disposable event through `OVL-05` and verify dependent links resolve safely.
10. Add a co-host, grant `invite_guests`, add `edit_event`, revoke `edit_event`, then remove the co-host.
11. Inspect Event Insights and verify guest, RSVP, check-in, and invitation denominators.
12. Disconnect the network, confirm `OVL-09`, and use cached event access through Offline Or Degraded Mode.
13. Restore connectivity, simulate maintenance, retry, then simulate a required update and open the App Store through `OS-08`.
14. Sign out and verify private caches and credentials are removed.

### Required alternate branches

| Branch | Expected result |
|---|---|
| Expired session | Sign In appears with the intended destination retained |
| Revoked session | Private cached content is cleared or locked and the intended route is preserved for reauthentication |
| Failed account lookup | The app exits authenticated chrome instead of retaining a local user with no valid server session |
| Offline cold launch | Only encrypted, previously authorized cached content opens with a staleness label |
| Corrupt local recovery | Server draft opens without losing server data |
| Repeated draft delete | The operation remains successful, clears local recovery data, and cannot affect another draft |
| Concurrent event edit | User chooses refresh or intentional conflict resolution; no silent overwrite |
| Invalid date, capacity, or privacy update | Save is rejected with the affected field and stored event remains unchanged |
| Permission revoked mid-edit | Co-host's pending mutation is rejected and the UI becomes read-only |
| Unknown or duplicate co-host | Add is rejected safely without changing existing permissions |
| Last-host removal | Operation is blocked until a valid ownership transfer completes |
| Invalid lifecycle transition | Server rejects the transition and current state remains visible |
| Delete dependency failure | Event remains available and the error names recoverable work |
| Offline mutation | Action is unavailable with a reason; no false queued success appears |
| Maintenance retry | Retry is bounded and a status link remains available |
| Lifecycle job retry | Repeated execution cannot skip, reverse, or duplicate a lifecycle transition and alerts after its fifth failure |

### Acceptance

- Session state never shows an authenticated shell without a valid token.
- Draft resolution and deletion are deterministic.
- Co-host authorization changes on the next protected request.
- Insights do not derive total guests from event capacity.
- `SYS-03` and `SYS-05` never loop indefinitely.
- `FL-A02`, `FL-E02`, `FL-E03`, `FL-E04`, and `FL-Y02` pass.

## `C03`: Host Runs An Invitation Campaign

### Objective

Prove guest preparation, reusable invitation design, event-specific composition, actual recipient selection, authorized delivery, failure recovery, token sharing, and token revocation.

### Actors and setup

| Item | Requirement |
|---|---|
| Primary actor | Host |
| Event | Published private event below capacity |
| Guest fixtures | Two pending guests for approve/reject, one editable guest, one disposable guest, and delivery recipients below |
| Recipients | Five valid, one duplicate, one malformed, one bounce-suppressed address |
| Email provider | Produces accepted sends plus delivered, opened, clicked, retryable failure, and permanent bounce webhook fixtures |
| Token | Approval required, maximum ten uses, seven-day expiry |

### Screen path

```text
EVT-11 -> GST-01 -> GST-02 -> INV-01 -> INV-02 -> INV-03
-> INV-04 -> INV-05 -> INV-06 -> EVT-15
```

### Main steps

1. Open Guest List, combine search with a pending filter, and inspect one Guest Detail.
2. Add a guest through `OVL-02`, verify deduplication, edit the guest, approve a pending guest, reject another, then remove a disposable guest through `OVL-05`.
3. Open Invitation Template Library and create a reusable design.
4. Enter subject, structured body, variables, and default choice in Invite Template Editor.
5. Attempt to leave with edits, continue through `OVL-01`, then save.
6. Compose the event invitation using real event details and optional artwork through `OS-04`.
7. Confirm preview toggles match the final rendered event details, map, and RSVP action.
8. Select actual guest records; verify malformed, duplicate, and suppressed recipients are handled before confirmation.
9. Confirm the exact recipient count through `OVL-06` and send once.
10. Open Delivery And Engagement, distinguish accepted, delivered, opened, clicked, failed, and bounced outcomes, then retry only the retryable recipient.
11. Generate the constrained join link and QR, inspect its policy, and open `OVL-07`.
12. Record one valid use in a separate client, inspect usage, then revoke the token through `OVL-05`.
13. Return to Event Insights and verify delivery totals.

### Required alternate branches

| Branch | Expected result |
|---|---|
| Unsafe invitation markup | Save is rejected or content is converted to the supported safe structure |
| Unresolved variable | Continue is blocked and the missing variable is identified |
| Artwork cancelled | Composition remains valid with no photo permission requirement |
| Provider unavailable | Campaign remains retryable and no recipient is labeled sent |
| Send rate limit | Campaign remains intact and displays the server-provided next eligible retry time |
| Duplicate send tap | Idempotency key prevents another campaign |
| Partial batch failure | Successful and failed recipients are named separately |
| Bounce retry | Permanent bounce remains suppressed |
| Revoked token | New preview and RSVP attempts resolve through `SYS-04` |
| Unsafe event or invitation copy | Content is rejected or quarantined before another user can view it and remains privately correctable |
| Guest removal retry | Repeating a confirmed removal is idempotent and does not affect another guest |
| Guest removal impact | Confirmation names invitation, pass, poll, cost, and check-in consequences before the record is removed |
| Co-host without guest permission | Guest mutations are absent in UI and rejected by the API |
| Guest self-edit | Guest can update only their own allowed RSVP details and cannot view host-only delivery data |
| Concurrent final token use | At most one final allowed use commits and usage count remains correct |

### Acceptance

- No hard-coded event or guest data appears.
- Delivery states match provider and webhook evidence.
- Retry does not resend successful recipients.
- Token policy and revocation are enforced by the server.
- `OPS-06` records sender, event, recipient outcomes, and token action.
- `FL-GST01`, `FL-I01`, `FL-I02`, and `FL-I03` pass.

## `C04`: Anonymous Invitee RSVPs And Is Checked In

### Objective

Prove the complete invitation-recipient journey from Universal Link through anonymous RSVP, calendar and map handoff, cached pass, camera failure fallback, and idempotent entry.

### Actors and setup

| Item | Requirement |
|---|---|
| Primary actor | Anonymous invitee who may later create an account |
| Secondary actor | Authorized event host |
| Invitation | Valid, approval not required, one plus-one allowed |
| Event | Private, published, with one guest-visible and one host-only timeline entry |
| Camera | Permission initially denied |
| Connectivity | Guest pass is cached before a temporary outage |

### Screen path

```text
SYS-02 -> RSVP-01 -> RSVP-02 -> RSVP-03 -> EVT-11 -> TIM-01 -> CHK-03
Host path: EVT-11 -> CHK-01 -> CHK-02 -> CHK-01
Failure destinations: SYS-03 and SYS-04
```

### Main steps

1. Open the invitation Universal Link with the app installed.
2. Confirm Invitation Landing previews allowed event and host data without consuming the token.
3. Open RSVP And Guest Details, choose Maybe, enter the minimum required identity, one plus-one, and dietary information.
4. Confirm Maybe on RSVP Confirmation.
5. Reopen the same link, change to Accepted, and verify the existing guest record is updated.
6. Change the response to Declined, then Withdrawn, and finally Accepted; verify one guest record and distinct audit states.
7. Open Event Overview and confirm only guest-authorized actions appear.
8. Open Event Timeline and confirm the host-only entry is absent.
9. Use `OS-05` for Apple Maps and `OS-06` for Calendar, including their fallbacks.
10. Open Guest Entry Pass, disconnect the network, and confirm the cached pass remains available with a staleness label.
11. On the host device, open Check-In Hub and start Camera Scanner.
12. Deny `OS-03`, open iOS Settings through `OS-09`, return without changing permission, then use manual search to check the guest in.
13. Reopen `OS-09`, grant camera access, return to Camera Scanner, scan the same pass, and confirm Already Checked In without another mutation.

### Required alternate branches

| Branch | Expected result |
|---|---|
| Approval-required invitation | Confirmation reports Pending Approval and withholds participant-only content until approved |
| Rejected approval | RSVP intent remains recorded but participant-only content and pass remain unavailable |
| Existing signed-in invitee | RSVP binds to the existing guest by normalized identity rather than creating a duplicate |
| App not installed | Link opens the equivalent web flow and can continue after installation |
| Wrong allowed email | RSVP is rejected without revealing the allowed address list |
| Plus-one exceeds capacity | The transaction is rejected and neither guest nor companion count changes |
| Expired or exhausted token | `SYS-04` offers host contact or safe return |
| Abusive event or invitation copy | Invitation Landing opens `MOD-01` or signed-out support, records the token-scoped target, and returns without consuming the invite |
| Malformed or wrong-event QR | Scanner rejects it without showing another guest's details |
| Raw guest ID submitted as QR | Scanner and server reject it because only the signed versioned credential is valid |
| Unauthorized scanner | Check-in endpoint rejects the action and records no attendance change |
| Offline host | Manual and camera mutations remain disabled unless conflict-safe queueing has been implemented and tested |

### Acceptance

- Link preview does not increment token usage.
- Maybe, Declined, Withdrawn, and Accepted changes create no duplicate guest.
- Guest sees only permitted event and timeline data.
- The pass is event-scoped and works from encrypted cache.
- Check-in persists exactly once.
- `FL-R01`, `FL-C01`, `FL-Y01`, and relevant `FL-Y02` branches pass.

## `C05`: Co-host And Guests Plan Together

### Objective

Prove timeline editing, participant polling, persistent PartyBoard collaboration, accessibility alternatives, moderation, conflicts, and offline behavior.

### Actors and setup

| Item | Requirement |
|---|---|
| Primary actor | Co-host with timeline and moderation permission |
| Participants | Host and three accepted guests |
| Timeline | Two visible entries and one host-only entry |
| Polls | Support single and multiple choice; ranking is absent |
| Consensus fixture | Four eligible participants, 75 percent threshold, quorum of three |
| PartyBoard | One note and one idea with version conflict fixtures |
| Safety | One text sample rejected by the UGC filter |

### Screen path

```text
EVT-11 -> TIM-01 -> TIM-02 -> POL-01 -> POL-02 -> POL-03
-> BRD-01 -> BRD-02 -> SYS-03
```

### Main steps

1. Open the event as co-host and enter Timeline.
2. Add, edit, reorder, assign, remind, hide, and delete entries using `OVL-03` and a non-drag reorder path.
3. Open the event as a guest and verify only guest-visible entries appear.
4. Create a single-choice poll, vote as three participants, revise one vote, and close as the creator.
5. Repeat valid semantics for multiple choice.
6. Confirm ranking is absent and exercise the documented quorum formula with both below-quorum and at-quorum votes.
7. Attempt an unauthorized close as a guest who did not create the poll.
8. Open PartyBoard, add a safe note and idea through `OVL-04`, edit and move one, vote on one, delete an authorized disposable item, then switch to list mode and confirm equivalent actions.
9. Attempt unsafe text and verify `OPS-01` blocks exposure while retaining editable copy.
10. Trigger separate concurrent timeline and board edits and resolve each without silent overwrite.
11. Report a board item through `MOD-01` and confirm moderation intake.
12. Disconnect and confirm `OVL-09` plus read-only `SYS-03` behavior.

### Required alternate branches

| Branch | Expected result |
|---|---|
| Timeline overlap | Clear warning permits an intentional save because parallel activities are valid |
| Hidden entry link | Guest receives no content and no existence leak |
| Late vote | Poll Detail shows closed state and rejects mutation |
| Invalid vote shape | Server rejects over-selection, under-selection, duplicate selection, or unknown option |
| Consensus | The formula in document 01 prevents closure below quorum and closes only after both quorum and threshold are met |
| Unsafe poll text | `OPS-01` rejects or quarantines it before participants can view it |
| Board read-only role | Composer, move, edit, and delete actions are absent |
| Board conflict | User can refresh or intentionally apply a supported resolution |
| Offline edit | Board and timeline stay readable but do not claim synchronization |

### Acceptance

- Timeline has one canonical data source.
- Poll payload and stored vote semantics agree for every enabled type.
- Canvas and list PartyBoard modes expose the same information and authorized actions.
- Moderated text is never briefly visible to another participant before rejection.
- `FL-T01`, `FL-P01`, `FL-B01`, and degraded `FL-Y02` pass.

## `C06`: Host And Guest Reconcile Event Costs

### Objective

Prove the reimbursement ledger, calculation rules, privacy boundaries, guest response, host confirmation, dispute, cancellation, and explicit no-payment positioning.

### Actors and setup

| Item | Requirement |
|---|---|
| Primary actor | Host |
| Secondary actor | One accepted guest |
| Event | Four accepted guests and one declined guest |
| Currency | USD |
| Cost | 100.01 shared among four accepted guests |

### Screen path

```text
Host: EVT-11 -> GST-01 -> GST-02 -> COST-01 -> COST-02 -> COST-03
Guest: COST-04 -> COST-03
```

### Main steps

1. Review Guest List and one Guest Detail to confirm accepted recipients.
2. Open Cost Split Summary and create an equal split for 100.01 with a due date.
3. Verify integer minor-unit rounding allocates one 25.01 share and three 25.00 shares by stable normalized guest ID order.
4. Open each Cost Share Detail and verify PartyHause states that it does not process payment.
5. As a guest, open My Cost Shares and only the signed-in guest's record.
6. Add an external reference and change `pending -> sent` without entering card or bank credentials.
7. As host, change `sent -> confirmed` and verify summary totals.
8. Create a custom split, submit a non-reconciling amount, correct it, and save.
9. Exercise `pending -> disputed -> pending -> sent -> confirmed -> refunded` with host correction and immutable history.
10. Exercise `pending -> cancelled` through `OVL-05` and verify the audit history.

### Required alternate branches

| Branch | Expected result |
|---|---|
| No accepted guests | Create Cost Split blocks and links to Guest List |
| Declined guest selected | Server rejects the recipient |
| Duplicate request | Existing request is shown or the duplicate is rejected safely |
| Other guest ID queried | Server returns no private cost data |
| Invalid final-state action | `confirmed -> sent` and every mutation after `refunded` are rejected; host-only `confirmed -> refunded` remains valid |
| Currency mismatch | Mixed-currency arithmetic is never performed silently |
| Retry after timeout | Idempotency prevents a duplicate split |

### Acceptance

- Every total reconciles to the minor currency unit.
- Guest sees only their own cost share.
- No payment credential is collected and no UI implies PartyHause transfers funds.
- State changes are validated and auditable.
- `FL-CS01` and `FL-CS02` pass.

## `C07`: Event Group Completes Both Launch Games

### Objective

Prove that the release contains exactly two complete, truthful, accessible shared-device game experiences with interruption recovery.

### Actors and setup

| Item | Requirement |
|---|---|
| Primary actor | Signed-in member |
| Participants | Four fictional local players |
| Context | One run started from Games, one from Event Overview |
| Device state | Supports background and foreground interruption |
| Accessibility | Reduce Motion and VoiceOver are enabled for separate runs |

### Screen path

```text
Games origin: GAM-01 -> GAM-02 -> GAM-03 -> GAM-05 -> GAM-03 -> GAM-05 -> GAM-01
Event origin: EVT-11 -> GAM-01 -> GAM-02 -> GAM-04 -> GAM-05 -> EVT-11
```

### Main steps

1. Open Game Library and confirm only General Trivia and Getting to Know You appear.
2. Select General Trivia, review its local shared-device behavior, add players, and start.
3. Answer questions, allow one timeout, pause, background the app, resume, and complete.
4. Review results, open `OVL-07`, replay a complete short run with clean state, return to results, then return to Game Library.
5. Open the event, enter Game Library with event context, and select Getting to Know You.
6. Repeat a prompt, skip another, pause, background, resume, and complete follow-up rounds.
7. Review accessible results and return to Event Overview.

### Required alternate branches

| Branch | Expected result |
|---|---|
| Too few players | Start remains blocked with a specific requirement |
| Duplicate or empty name | Setup identifies and retains the invalid row |
| Abandon mid-run | `OVL-05` protects accidental loss and returns to the invoking Games or Event context |
| Reduce Motion | Game remains clear without scale, parallax, or confetti |
| VoiceOver timer | Timer does not announce every second and controls remain operable |
| Replay | Score, prompt, timer, player turn, and navigation state all reset |

### Acceptance

- No unsupported game card, online lobby, fake participant, or multiplayer claim is visible.
- Backgrounding cannot corrupt the active run.
- Results are understandable without color, motion, or haptics.
- `FL-G01` and `FL-G02` pass.

## `C08`: Member Builds And Controls A PartyCrew Network

### Objective

Prove discovery, public follow, private requests, request resolution, profile editing, connection privacy, relationship actions, blocking, and unblocking.

### Actors and setup

| Item | Requirement |
|---|---|
| Primary actor | Member with a completed profile |
| Suggested accounts | One public, one private, one mutual, one account that later blocks the member |
| Media | One fictional avatar available to the system photo picker |
| Requests | Two received requests and one sent request |

### Screen path

```text
SOC-04 -> SOC-05 -> SOC-08 -> SOC-05
-> SOC-06 -> SOC-07 -> SOC-09
```

### Main steps

1. Open Discover People and inspect why each suggestion appears.
2. Open the public profile, join PartyCrew, configure its relationship actions through `OVL-08`, then unfollow.
3. Open the private profile and send a request; verify pending state rather than following state.
4. Open Crew Requests, cancel one sent request, accept one received request, and decline another fixture.
5. Return to Profile and verify updated relationship state.
6. Edit the current user's profile, choose an avatar through `OS-04`, and save text and image.
7. Open Connections and inspect Members, Crewing, and Mutual sections with pagination.
8. Attempt to view a private connection list without permission.
9. Block another account through `OVL-08` and `OVL-05`; verify `OPS-03` removes it across discovery, profile, feed, requests, notifications, comments, polls, and PartyBoard interactions.
10. Open Blocked Accounts, unblock, and confirm the old relationship is not recreated automatically.

### Required alternate branches

| Branch | Expected result |
|---|---|
| Duplicate join or request | Operation is idempotent and state remains correct |
| Self-follow | Action is rejected and no relationship is created |
| Already processed request | Current state replaces stale controls |
| Blocked request participant | Request disappears and cannot be accepted, declined, or recreated while blocked |
| Deleted request participant | Request resolves unavailable without exposing retained private profile data |
| Invalid website | Profile text is retained and the field receives focus |
| Unsafe profile text | The profile remains unchanged publicly and the member receives editable policy feedback |
| Image upload failure | Existing image remains; safe text changes are not falsely reported as all-or-nothing success |
| Account blocks member | Profile resolves through `SYS-04` and no private relationship data leaks |
| Pagination retry | Segment and scroll position are retained |

### Acceptance

- Public and private relationship states are never conflated.
- Block is server-enforced across every social read and mutation.
- Unblock does not recreate connections or pending requests.
- Profile privacy applies to every page of connection results.
- `FL-S01`, `FL-S02`, and `FL-S04` pass.

## `C09`: Member Publishes Content, Receives A Notification, And Reports Abuse

### Objective

Prove the complete moderated social loop, interaction rollback, reporting, blocking, operator triage, in-app notifications, user-optional push consent, and safe destination resolution.

### Actors and setup

| Item | Requirement |
|---|---|
| Primary actor | Member |
| Secondary actor | Content author who posts abusive content |
| Operator | Moderation staff account with least-privileged queue access |
| Notifications | One valid post notification and one notification for a deleted target |
| Push | One clean installation grants permission and one clean installation denies it |

### Screen path

```text
SOC-01 -> SOC-03 -> SOC-02 -> SOC-05 -> MOD-01
-> NTF-01 -> NTF-02 -> SYS-02 -> SYS-04
```

### Main steps

1. Open PartyCrew Feed and confirm loading failure is not represented as an empty feed.
2. Compose a safe event-announcement post, review audience and linked event, and publish through `OPS-01`.
3. Open Post Detail, like, comment, reply, and use `OVL-07` to share.
4. Simulate a failed like request and verify optimistic rollback.
5. Open the abusive author's Profile, use `OVL-08`, and start Report Content Or User.
6. Select a reason, enter concise evidence, hide the content immediately, and block the author.
7. Confirm `OPS-02` receives an immutable snapshot and `OPS-03` removes cross-surface exposure.
8. As operator, merge a duplicate report, issue an action, notify the reporter safely, and retain audit history.
9. Open Notification Center, mark one item read, then mark all read.
10. Open Notification Preferences on one installation, grant `OS-01`, register a token, rotate the token, and verify the server retains only the current association.
11. On a clean second installation, enable event reminder push, read the rationale, deny `OS-01`, then open iOS Settings through `OS-09`.
12. Confirm in-app notifications remain enabled and sign-out de-associates the granted installation's token.
13. Open the deleted-target notification and verify `SYS-02` resolves it through `SYS-04`.
14. Use an account with no feed posts and verify the true empty state routes to Discover People.

### Required alternate branches

| Branch | Expected result |
|---|---|
| Unsafe authored post | Filter rejects or quarantines before exposure and preserves private editable copy |
| Unsafe comment | Comment remains unexposed and editable; repeated abuse enters moderation policy |
| Deleted post while open | Post Detail resolves safely and stale interaction actions disappear |
| Duplicate report | Evidence and reporter count merge without duplicate enforcement |
| Credible physical threat | Operator follows the emergency escalation process |
| Appeal granted | Content or account state is restored with history retained |
| Target already removed | Report retains its immutable evidence and resolves without exposing deleted content |
| Reporter privacy | Reported member never receives reporter identity through notice, API, or appeal data |
| Push token registration failure | Preference remains accurate and offers retry |
| Sign out | Device token is de-associated from the account |
| Marketing push | Remains disabled until separate explicit in-app consent is recorded |
| Malformed notification action | Notification remains readable and no unsafe route opens |

### Acceptance

- No UGC becomes visible before filtering outcome.
- Report and block are reachable from every relevant social object.
- Blocking suppresses both read and write paths.
- Push denial never reduces in-app functionality.
- Notification routes are typed and access-checked.
- `FL-S03`, `FL-N01`, `FL-N02`, `FL-M01`, and `FL-O01` pass.

## `C10`: Locked-Out User Recovers, Gets Help, And Deletes The Account

### Objective

Prove password recovery, settings, privacy, legal access, support, reauthentication, ownership handling, permanent account deletion, and operational fulfillment.

### Actors and setup

| Item | Requirement |
|---|---|
| Primary actor | Member who cannot remember the password |
| Account data | One hosted draft, one published event, social post, comment, board item, connection, blob, and notification |
| Support | Online support endpoint with idempotency support; bundled help content available offline |
| Deletion | Documented fulfillment period and legal-retention rule |

### Screen path

```text
SYS-01 -> AUTH-01 -> AUTH-02 -> AUTH-06 -> SYS-02 -> AUTH-07
-> SET-01 -> SET-02 -> SET-03 -> SUP-01 -> SUP-02 -> SUP-03
-> LEG-01 -> LEG-02 -> LEG-03 -> ACC-01 -> AUTH-01
```

### Main steps

1. Launch signed out and request a password reset for the account.
2. Repeat with an unknown email and compare acknowledgements.
3. Open the reset Universal Link and set a valid new password.
4. Open Settings, inspect verified email and session state in Account And Security.
5. Change Privacy And Visibility and verify the effect on public profile and connections.
6. Open Help And Support, search, and read a Help Article.
7. Disconnect and verify bundled help, Community Guidelines, Terms, and Privacy remain readable.
8. Restore connectivity, open Contact Support, preview optional diagnostics, submit, and receive a stable ticket reference.
9. Exercise `OPS-04` and `FL-O02`: route the ticket, inspect only consented context, verify identity for the account request, reply, resolve, and retain audit history.
10. Read Community Guidelines, Terms Of Service, and Privacy Policy at accessibility text size.
11. Open Delete Account, review the complete impact, choose how each hosted event is transferred, cancelled, or deleted, invoke `OVL-05`, then cancel before final confirmation.
12. Repeat deletion, fail reauthentication once, authenticate successfully, and confirm permanent deletion.
13. Verify immediate session revocation and execute `OPS-05` and `FL-O03`.
14. Confirm completion, then verify sign-in fails and the account's UGC, blobs, relationships, and private records follow the disclosed deletion policy.

### Required alternate branches

| Branch | Expected result |
|---|---|
| Unknown reset email | Same acknowledgement, timing class, and next action as a known email |
| Expired reset link | Reset Password offers a new request without exposing token details |
| Malformed or reused reset link | Reset Password rejects it safely and routes to a new request |
| Duplicate reset submit | The token changes the password once and the second request cannot create another session |
| Weak new password | Reset Password preserves the link state, rejects the password, and moves focus to the error |
| Privacy save failure | Optimistic state rolls back and current audience remains clear |
| Support retry | Idempotency prevents a duplicate ticket |
| Account-access support | Operator response does not disclose whether a different email address has an account |
| Offline support submit | Content is preserved for deliberate retry; no false ticket reference appears |
| Wrong deletion credentials | Account remains active and the impact review is retained |
| Deletion worker failure | Account access stays revoked, request remains pending, and operations receive an alert |
| Legal retention | Retained category, purpose, and period match the Privacy Policy and are unavailable for product use |

### Acceptance

- Recovery does not disclose account existence.
- Legal and support destinations work signed out and at large text sizes.
- Account deletion is easy to find and begins entirely in app.
- Deactivation is not presented as deletion.
- Completion covers personal data, UGC, blobs, relationships, and credentials.
- `FL-A03`, `FL-ST01`, `FL-SP01`, `FL-D01`, `FL-O02`, and `FL-O03` pass.

## Case Coverage Summary

| Case | Primary domains | Canonical flows |
|---|---|---|
| `C01` | Account, onboarding, event creation | `FL-A01`, `FL-E01`, `FL-Y01` |
| `C02` | Session, drafts, event governance, system recovery | `FL-A02`, `FL-E02`, `FL-E03`, `FL-E04`, `FL-Y02` |
| `C03` | Guest records, invitations, delivery, share tokens | `FL-GST01`, `FL-I01`, `FL-I02`, `FL-I03` |
| `C04` | RSVP, guest event, pass, check-in | `FL-R01`, `FL-C01`, `FL-Y01`, `FL-Y02` |
| `C05` | Timeline, polls, PartyBoard | `FL-T01`, `FL-P01`, `FL-B01`, `FL-Y02` |
| `C06` | Cost ledger | `FL-CS01`, `FL-CS02` |
| `C07` | Games | `FL-G01`, `FL-G02` |
| `C08` | Discovery, profiles, connections, blocking | `FL-S01`, `FL-S02`, `FL-S04` |
| `C09` | Feed, posts, moderation, notifications | `FL-S03`, `FL-N01`, `FL-N02`, `FL-M01`, `FL-O01` |
| `C10` | Recovery, settings, support, legal, deletion | `FL-A03`, `FL-ST01`, `FL-SP01`, `FL-D01`, `FL-O02`, `FL-O03` |
