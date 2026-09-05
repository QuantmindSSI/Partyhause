# Release Validation Plan

## Objective

Produce evidence that the exact PartyHause binary submitted to Apple is complete, correct, secure, private, accessible, supportable, and consistent with its App Store metadata.

Passing a build command is necessary but not sufficient. Launch requires the product cases, backend behavior, operational workflows, Apple account configuration, and review package to pass together.

## Release Candidate Identity

Every candidate must be traceable by:

- Git commit SHA and signed release tag.
- App semantic version and iOS build number.
- Expo SDK, React Native, Xcode, and iOS SDK versions.
- Lockfile checksum and dependency inventory.
- API image SHA and database migration version.
- Environment identifier and feature-flag snapshot.
- App Store Connect build identifier.
- Archive, dSYM, privacy report, and validation log location.

Secrets, Apple credentials, review passwords, invitation tokens, and guest QR secrets are stored outside the repository.

## Validation Environments

| Environment | Purpose | Data rule |
|---|---|---|
| Local | Unit, component, and fast integration feedback | Generated fictional fixtures only |
| CI | Deterministic lint, type, test, dependency, and build checks | Ephemeral isolated data |
| Staging | Full mobile/API/database/provider and migration validation | Production-shaped fictional data; no real customer data |
| TestFlight internal | Team device, permission, performance, upgrade, and resilience testing | Controlled fictional accounts |
| TestFlight external | Real-world usability and compatibility validation | Test accounts and consented tester data only |
| App Review | Stable review account and seeded feature coverage | Persistent fictional data maintained throughout review |
| Production | Manual first release and monitored live service | Real data under approved policy and controls |

## Supported Device Matrix

Because `supportsTablet` is currently true, iPad is a launch platform rather than an incidental compatibility target.

| Class | Required coverage |
|---|---|
| Small iPhone | Smallest supported display, including keyboard and accessibility text stress |
| Standard iPhone | Common current display size on minimum supported iOS |
| Large iPhone | Current 6.9-inch class used for App Store screenshots |
| 11-inch iPad | Portrait, landscape, split view, hardware keyboard, and pointer |
| 13-inch iPad | Portrait, landscape, screenshot production, and large-canvas behavior |

At least one physical iPhone and one physical iPad must execute camera, contacts, photo picker, push, Universal Links, backgrounding, Keychain, and performance tests. Simulators supplement but do not replace those tests.

## Operating-System Matrix

| OS class | Required coverage |
|---|---|
| Minimum supported | iOS/iPadOS 17.x behavior and upgrade path |
| Intermediate supported | At least one major release between minimum and current where device coverage permits |
| Current production | Latest iOS/iPadOS 26.x production release at submission |
| Next beta | Latest available iOS/iPadOS 27 beta for compatibility risk, not as the submission toolchain unless Apple permits it |

The exact current and beta versions are recorded when tests run. Submission uses a production Xcode accepted by App Store Connect.

## Environment Variations

| Dimension | Required variants |
|---|---|
| Appearance | Light, Dark, Increase Contrast |
| Text | Default, largest standard Dynamic Type, accessibility sizes |
| Motion | Standard and Reduce Motion |
| Assistive input | VoiceOver, Voice Control, hardware keyboard, pointer on iPad |
| Locale | English launch locale plus long-string and right-to-left pseudolocalization |
| Time | 12/24-hour, daylight-saving boundary, event timezone different from device timezone |
| Network | Normal Wi-Fi, high latency, packet loss, timeout, offline, recovery, IPv6-only/NAT64 |
| Permissions | Not determined, granted, denied, restricted, and changed in Settings |
| Session | New, restored, expired, revoked, signed out, account deleted |
| Data scale | Empty, typical, and launch-bound large lists for events, guests, feed, comments, and notifications |

## Test Layers

### 1. Static and build checks

Run from the repository root for every release candidate:

```bash
npm ci --legacy-peer-deps
npm run lint
npm run test:run
npm run build:check
npm --workspace apps/mobile run lint
npx expo-doctor apps/mobile
```

After the EAS CLI version and build image are standardized in CI, produce the candidate with the production profile:

```bash
npx eas-cli build --platform ios --profile production
```

Pass criteria:

- Clean dependency installation from the lockfile.
- No lint, type, unit-test, or build failure.
- Expo dependency and configuration checks pass.
- Build uses the accepted Xcode 26 or later and iOS 26 SDK or later.
- App Store Connect processes the uploaded binary without validation warnings that affect submission.

### 2. Unit and model tests

Required areas:

- Date, timezone, multi-day, and lifecycle transition rules.
- Normalized email and guest deduplication.
- Event relationship and co-host permission predicates.
- Invitation token expiry, limits, allow-list, revocation, and transactional use.
- QR encode/decode and event scope.
- Single-choice and multiple-choice selection, rejection of ranking, vote revision, quorum, deadline, and close rules.
- Currency minor-unit rounding and cost-share state transitions.
- PartyBoard ownership, version conflict, vote, and moderation rules.
- Deep-link parser allow-list and sensitive-query redaction.
- Notification action decoding.
- Privacy setting audience rules.
- Block suppression across every domain.
- Account-deletion dependency plan.

### 3. API integration tests

Required actor matrix:

- Anonymous visitor.
- Unverified account.
- Verified unrelated member.
- Invited pending guest.
- Accepted guest.
- Declined guest.
- Co-host with each permission combination.
- Host.
- Blocked user in both relationship directions.
- Moderator or support operator.

Required mutation properties:

- Authentication required where expected.
- Resource ownership and event relationship checked server-side.
- Input validation rejects malformed and oversized values.
- Retryable commands are idempotent.
- Multi-record operations are transactional or return an explicit recoverable partial state.
- Private fields are absent from unauthorized responses, not merely hidden by the client.
- Rate limits and abuse controls return predictable recovery data.
- Database constraints hold under concurrent requests.

### 4. Native component and route tests

Every screen ID needs tests for applicable states from the Universal Screen Contract:

- Initial loading.
- Refreshing with prior data retained.
- Empty.
- Success.
- Field validation.
- Mutation in progress.
- Recoverable error and retry.
- Offline and stale data.
- Forbidden.
- Deleted or expired.
- Partial completion.
- Accessibility name, role, value, order, and focus.

Navigation tests must cover tab stack preservation, tab reselection, back behavior, unsaved-change protection, modal dismissal, keyboard avoidance, and restored route state.

### 5. End-to-end product cases

All cases in [05-ten-end-to-end-cases.md](./05-ten-end-to-end-cases.md) are required. Each case passes on a current physical iPhone and current physical iPad. Minimum-OS and small-screen runs are distributed across the matrix but must include every primary domain.

| Case | Required result |
|---|---|
| `C01` | Repeat contacts-denied and partial-create branches |
| `C02` | Pass session, conflict, permission-revocation, offline, maintenance, and update branches |
| `C03` | Pass guest CRUD, real-recipient send, every supported delivery status, rate limit, idempotent retry, and token revocation |
| `C04` | Pass anonymous and signed-in RSVP, offline pass, camera denial, manual and duplicate check-in |
| `C05` | Pass single and multiple choice, reject ranking, enforce quorum, guest visibility, PartyBoard canvas/list parity, moderation, and conflict |
| `C06` | Pass currency reconciliation, actor privacy, invalid transition, dispute, and no-payment wording |
| `C07` | Pass both games, minimum players, interruption, replay reset, Reduce Motion, and VoiceOver |
| `C08` | Pass public/private relationships, request resolution, privacy, block, and unblock |
| `C09` | Pass filter, publish, interaction rollback, report, block, moderation, push denial, and notification route |
| `C10` | Pass enumeration-safe recovery, offline help, idempotent support, reauthentication, and complete deletion |

No case may rely on editing the database by hand after its documented seed setup.

## Security Validation

### Required tests

- Authorization bypass attempts for every event, guest, poll, cost, board, profile, connection, post, report, support, and deletion endpoint.
- ID enumeration and object substitution across two unrelated accounts.
- Co-host permission combinations and revocation during an open session.
- Invite replay, expiry, revocation, use-count race, wrong email, and concurrent final-use attempts.
- QR tampering, wrong-event code, duplicate scan, and raw guest-ID submission.
- Arbitrary email recipient/body attempts and unauthenticated send attempts.
- Webhook invalid signature, replay, and malformed body.
- Upload extension/content mismatch, oversized image, path traversal, cross-user delete, and unauthorized URL request.
- Password reset and verification enumeration, brute force, token replay, and log redaction.
- Deep-link malformed schemes, unexpected hosts, unexpected paths, encoded traversal, duplicate parameters, and token leakage.
- UGC filter bypass, report spam, block bypass, deleted-target interaction, and moderator privilege escalation.
- Support attachment and diagnostic redaction.
- Account-deletion cancellation, duplicate request, worker retry, and orphan-data scan.

### Release evidence

- Security review of the complete release diff.
- Dependency and secret scans.
- Server configuration and least-privilege review.
- API integration results with actor matrix.
- Network proxy capture showing TLS and expected domains only.
- Log samples proving sensitive-value redaction.
- Incident response contacts and rollback authority.

## Privacy Validation

### Final-binary data-flow audit

1. Install the release build on a clean physical device.
2. Capture every network domain and request class while running all 10 cases.
3. Map every transmitted field to an App Privacy category, purpose, linkage, and retention rule.
4. Map every third party to the Privacy Policy and processor inventory.
5. Confirm no IDFA access, cross-company tracking, fingerprinting, or undeclared domain exists.
6. Generate the Xcode privacy report from the release archive.
7. Inspect app and SDK privacy manifests, approved required-reason APIs, and signatures.
8. Reconcile the report with Info.plist purpose strings, App Privacy answers, Privacy Policy, and server retention.
9. Exercise consent withdrawal, profile privacy, block, support-diagnostics consent, and account deletion.
10. Record product, engineering, security/privacy, and legal sign-off.

### Permission tests

| Surface | Required sequence |
|---|---|
| Notifications | No first-launch prompt; contextual rationale; grant and deny; later Settings path; token de-association on sign-out |
| Contacts | Manual fallback; explicit selection; no select-all default; exact outgoing invitation visible |
| Camera | Prompt only on scanner entry; denial returns to manual check-in; revocation in Settings handled |
| Photos | System picker without broad access where supported; cancellation and upload failure safe |
| Microphone | No purpose string and no runtime access in 1.0 |
| Location | No purpose string and no runtime device-location access in 1.0 |

## Accessibility Validation

Run every common task listed in document 03 under the following modes:

- VoiceOver with screen curtain for nonvisual task validation.
- Voice Control with numbered overlays and spoken labels.
- Largest accessibility Dynamic Type.
- Reduce Motion.
- Increase Contrast.
- Differentiate Without Color.
- Bold Text.
- Hardware keyboard on iPad.
- Pointer on iPad.

VoiceOver receives a complete `C01` through `C10` pass on both a physical iPhone and iPad. Voice Control, largest accessibility text, Reduce Motion, Increase Contrast, Differentiate Without Color, Bold Text, keyboard, and pointer each cover every common task from document 03 across the device matrix; they do not all need to be multiplied across every device and OS combination.

Pass criteria:

- No required content or action is clipped, hidden, unreachable, or dependent on drag.
- Focus order follows visual and task order.
- Route changes and validation failures move focus predictably.
- Custom controls expose correct role, label, value, and state.
- Status uses text or symbol in addition to color.
- Game timers, live results, and notification badges do not overwhelm announcements.
- PartyBoard list mode provides complete functional equivalence for supported actions.
- Published Accessibility Nutrition Label claims, if any, match these results.

## Performance And Reliability Validation

### Measurements

- Cold launch and warm launch.
- Time to usable cached Events Home.
- Event Overview route transition.
- Guest List at launch-bound maximum size.
- Feed pagination and image behavior.
- PartyBoard canvas and list at launch-bound item count.
- Scanner startup, successful decode, and repeated scan.
- Memory during tab cycling, game runs, image selection, and repeated modal use.
- Battery and thermal behavior during scanner and prolonged game use.
- Crash-free and hang-free sessions in TestFlight.

### Failure injection

- API timeout before and after mutation acceptance.
- 401, 403, 404, 409, 413, 422, 429, 500, 502, 503, and 504 responses where relevant.
- Email provider accepted, transient failed, permanent bounced, and webhook delayed.
- Blob upload interruption and cleanup.
- Push registration failure and stale token.
- Database connection exhaustion and transaction conflict.
- Web PubSub unavailable while polling fallback is active.
- Deletion worker step failure and bounded retry exhaustion.

Pass criteria:

- No mutation is falsely reported as complete.
- Retry cannot duplicate a successful side effect.
- The app does not crash, hang, spin indefinitely, or erase valid input.
- Safe cached reads remain available where specified.
- Service recovery refreshes stale state without requiring reinstall.

## App Review Rehearsal

Run on a clean physical device using only the information placed in App Store Connect.

1. Install the exact processed candidate.
2. Sign in with the review host account.
3. Open the seeded event and every in-scope domain.
4. Open the supplied invitation link on a signed-out device.
5. RSVP with the review guest and retrieve the pass.
6. Scan the supplied QR and exercise manual check-in.
7. Create and vote in a poll.
8. Add and inspect a PartyBoard item.
9. Run both games.
10. Open report, block, support, legal, privacy, and account deletion paths without completing destructive review-account deletion.
11. Confirm each permission prompt appears only after the documented reviewer action.
12. Confirm all URLs, credentials, seeded data, and backend dependencies remain valid.
13. Compare every screenshot and metadata claim with the installed build.
14. Verify Review Notes describe every non-obvious step and limitation.

The reviewer receives a separate disposable account for testing deletion to completion.

## Release Gates

### `RG-01`: Scope integrity

Pass criteria:

- All 80 screens and 35 flows match the registry.
- Excluded features have no active, disabled, hidden, or metadata surface.
- No sample or fixed production data remains.

### `RG-02`: Functional integrity

Pass criteria:

- All 10 cases pass.
- No critical or high-severity defect remains open.
- No false-success, duplicate mutation, or unrecoverable partial write remains.

### `RG-03`: Security and privacy

Pass criteria:

- Actor matrix, abuse tests, dependency review, privacy reconciliation, manifest review, and deletion audit pass.
- No public arbitrary email relay, private-data leak, secret in logs, tracking, or unused sensitive permission remains.

### `RG-04`: UGC safety and operations

Pass criteria:

- Filtering, report, block, moderation, support, appeal, escalation, and audit behavior are live.
- Staff schedules and alerts cover the release window.

### `RG-05`: Accessibility and devices

Pass criteria:

- Common tasks pass accessibility modes on iPhone and iPad.
- Adaptive layouts, keyboard, pointer, scanner, contacts, photos, push, and Universal Links pass physical-device tests.

### `RG-06`: Store compliance

Pass criteria:

- Developer account, agreements, build, age rating, App Privacy, export, DSA, metadata, screenshots, and review information are complete.
- The current Upcoming Requirements page introduces no unmet deadline.

### `RG-07`: Operational readiness

Pass criteria:

- Monitoring, alerts, on-call, support, moderation, deletion processing, provider status, backup restore, incident response, and rollback controls are exercised.

### `RG-08`: Final go or no-go

Required approvers:

- Product owner.
- Mobile engineering owner.
- API/data engineering owner.
- Security/privacy owner.
- Support/moderation owner.
- Legal or compliance owner for privacy, age, DSA, export, and terms.
- Apple Account Holder or authorized App Manager.

Any approver may issue no-go for an unmet mandatory requirement. Schedule pressure does not override a release gate.

## Defect Policy

| Severity | Release treatment |
|---|---|
| Critical | No build distribution beyond controlled diagnosis; candidate rejected |
| Blocker | Same treatment as Critical; this is the label used by the gap register |
| High | Public submission blocked |
| Medium | Requires explicit owner, bounded impact, mitigation, and product/security acceptance; user-visible incomplete behavior is not acceptable |
| Low | May ship when documented, non-deceptive, and unrelated to safety, privacy, data integrity, access, payment, or a primary task |

## Launch-Day Runbook

1. Freeze release configuration and record candidate identity.
2. Verify Apple system status and PartyHause dependency status.
3. Re-run health, review-account, invitation-link, QR, email, push, moderation, support, and deletion smoke checks.
4. Confirm support, moderation, engineering, and incident responders are active.
5. Release manually after App Review approval.
6. Confirm product-page availability and perform a clean App Store installation.
7. Run account creation, sign-in, event open, invitation preview, RSVP, and support smoke checks in production.
8. Monitor crashes, hangs, API errors, auth failures, email failure, push registration, report queue, support queue, and deletion queue.
9. Compare early privacy-domain telemetry with the approved domain inventory.
10. Record launch decision, observations, incidents, and owner actions.

## Rollback And Containment

The response depends on the failure:

| Failure | Immediate containment |
|---|---|
| Crash on launch or account lockout | Pause release where possible, disable unsafe server behavior, prepare expedited corrected build |
| Private-data or authorization exposure | Disable affected endpoint or feature, revoke credentials if needed, start incident response and notification assessment |
| UGC moderation failure | Disable affected write and display surface, preserve evidence, staff the report queue |
| Email abuse | Disable send command, revoke exposed tokens, suppress provider traffic, investigate recipient impact |
| Duplicate financial ledger or RSVP mutation | Disable affected mutation and reconcile idempotency/audit records before reopening |
| App metadata mismatch | Correct metadata if possible without binary update; submit corrected binary when behavior differs |
| Broken review or support account | Restore access immediately and notify Apple through Resolution Center when under review |

Feature containment must not conceal functionality from App Review or silently change the product into a materially different app. Material fixes receive a new reviewed build.

## Post-Launch Monitoring

### Product and reliability

- Install, signup, verification, sign-in, publish, invitation send, RSVP, check-in, poll vote, support, and deletion completion funnels.
- Crash-free sessions, hangs, startup, route latency, API availability, and provider latency.
- Retry, conflict, partial completion, and duplicate-prevention metrics.

### Safety and privacy

- Filter rejection and quarantine rates.
- Reports by category, age, severity, resolution time, repeat offender, and appeal outcome.
- Block failures or attempted blocked interactions.
- Support response and resolution time.
- Deletion queue age, failure, retry, and completion.
- New network domains, SDK behavior, permission usage, and App Privacy drift.

### Store and customer

- App Store reviews and ratings.
- App Analytics, acquisition, retention, and deletion trends.
- Review responses and recurring support topics.
- New Apple requirements, SDK deadlines, policy updates, and regional compliance changes.

## Evidence Retention

Retain the following for each public version according to the approved security and privacy policy:

- Release candidate identity and signed approvals.
- Automated test and case results.
- Device, OS, network, permission, and accessibility matrix.
- Security and privacy reviews.
- Xcode privacy report and manifest audit.
- App Store metadata and screenshot snapshot.
- Age-rating, App Privacy, export, DSA, and agreement evidence.
- Review Notes and reviewer resources excluding secrets.
- Production smoke results and launch observations.
- Incident, containment, and corrected-build records when applicable.
