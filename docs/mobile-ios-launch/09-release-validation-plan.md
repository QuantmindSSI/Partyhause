# IOS-MVP-1 Release Validation Plan

## Objective

Produce evidence that the exact iPhone binary submitted to Apple, its API, its browser surfaces,
and its operational jobs implement only IOS-MVP-1 and satisfy all six release cases.

## Candidate Identity

Every candidate record contains:

- Git commit SHA and signed release tag.
- App semantic version and iOS build number.
- Expo, React Native, EAS CLI, Xcode, and iOS SDK versions.
- Lockfile checksum and dependency inventory.
- API image SHA and database schema version.
- Environment and release-feature inventory.
- App Store Connect build identifier.
- Archive, dSYM, privacy report, validation log, and test-evidence locations.

Credentials, invitation tokens, reviewer passwords, signing keys, and Apple credentials remain in
the approved secret manager, never in the repository or evidence bundle.

## Environments

| Environment | Purpose | Data rule |
|---|---|---|
| Local | Unit, component, browser, and API feedback | Generated fictional fixtures |
| CI | Deterministic static, test, contract, and build gates | Ephemeral isolated data |
| Staging | Full app, API, database, provider, job, and browser validation | Production-shaped fictional data |
| TestFlight internal | Device, accessibility, performance, upgrade, and resilience | Controlled fictional accounts |
| TestFlight external | Real-world compatibility and task validation | Test accounts and consented tester data |
| App Review | Stable host account, event, invitation, inbox, and deletion account | Persistent fictional data maintained through review |
| Production | Manual release and monitored service | Real data under the approved policy |

## iPhone And OS Matrix

IOS-MVP-1 has no tablet or Android launch matrix.

| Class | Required coverage |
|---|---|
| Small supported iPhone | Keyboard, 200 percent text, accessibility sizes, and dense 50-guest list |
| Standard iPhone | Complete six-case physical-device pass |
| Current large iPhone | App Store screenshots and layout verification |

| OS class | Required coverage |
|---|---|
| Minimum | Latest available iOS 17 release |
| Intermediate | At least one supported major version between minimum and current |
| Current | Latest production iOS release at submission |
| Next beta | Compatibility run only; never the submission toolchain unless Apple permits it |

At least two physical iPhones are required: one on the minimum supported major version and one on
the current production version. Simulators supplement but do not replace Keychain, browser handoff,
network, backgrounding, and performance tests.

## Variation Matrix

| Dimension | Required variants |
|---|---|
| Appearance | Light, Dark, Increase Contrast |
| Text | Default, largest standard Dynamic Type, accessibility sizes |
| Motion | Standard, Reduce Motion |
| Assistive input | VoiceOver, Voice Control, Switch Control smoke test |
| Locale | English launch locale, long-string pseudolocalization, right-to-left layout smoke test |
| Time | 12-hour, 24-hour, daylight-saving boundary, event timezone different from device |
| Network | Normal, high latency, timeout, offline, recovery, IPv6-only/NAT64 |
| Session | New, restored, expired, revoked, signed out, deletion pending, deleted |
| Data | Empty, typical, 49 guests, 50 guests, attempted 51st guest |
| Browser token | Valid, repeated, malformed, expired, revoked, removed guest, cancelled event |

## Test Layers

### 1. Static And Build Gates

Run from the repository root for every candidate:

```bash
npm ci --legacy-peer-deps
npx prisma generate
npm run lint
npm run build:check
npm run test:run
npm --workspace apps/mobile run lint
npx expo-doctor apps/mobile
npm --workspace apps/mobile run build:ios:production
```

Pass criteria:

- Dependency installation uses the lockfile.
- Lint, TypeScript, contract audit, unit tests, web build, Expo checks, and iOS build pass.
- The archive is iPhone-only, targets iOS 17.0 or later, and uses an Apple-accepted Xcode and SDK.
- App Store Connect processing reports no actionable validation issue.
- Route, string, dependency, entitlement, purpose-string, and asset audits find no excluded feature.

### 2. Unit And Model Tests

Required areas:

- Email normalization and `(event_id, normalized_email)` uniqueness.
- Password, verification, reset, session, and consent invariants.
- Event date, timezone, one-host, private-only, capacity, revision, and status transitions.
- Idempotent event create, publish, invitation, RSVP, check-in, correction, and deletion commands.
- 49, 50, and 51 guest boundaries and concurrent final-slot requests.
- Invitation recipient scope, provider-state mapping, retry eligibility, and rate limits.
- Token generation, hashing, expiry, revocation, guest binding, and safe errors.
- Attendance derivation and immutable correction audit.
- Every retention deadline, deletion dependency, backup expiry, and tombstone replay rule.

### 3. API And Database Tests

Required actors:

- Anonymous visitor without an RSVP token.
- Unverified host account.
- Verified event host.
- Verified unrelated account.
- Browser recipient with each token state.
- Restricted deletion or retention worker.

Required properties:

- Host identity is enforced for every event, guest, send, attendance, and deletion request.
- Private objects return no data to unrelated actors.
- Request schemas reject malformed, oversized, unknown, and out-of-range input.
- Database constraints hold under concurrent requests.
- Multi-record operations are transactional.
- Retryable commands use server-enforced idempotency.
- Provider and worker failures have bounded retries and alerts.
- Responses use stable typed errors and omit internal exception text.
- Migration applies cleanly to an empty database and an upgrade fixture before the API revision.

### 4. Native Screen Tests

Every one of the 14 native IDs is tested for applicable loading, empty, success, validation,
pending, recoverable failure, offline, unauthorized, forbidden, deleted, and accessibility states.

Navigation tests cover:

- Root session validation before protected render.
- Separate signed-out and signed-in stacks.
- Events and Account tab stack preservation and reselection.
- Back behavior and `OVL-01` unsaved-change protection.
- Destructive replacement after event, guest, or account deletion.
- Absence of every excluded route and tab.

### 5. Browser Surface Tests

Every one of the 6 browser IDs is tested at current mobile Safari widths plus desktop keyboard use.
Tests cover direct navigation, refresh, Back, token replay, content security policy, safe HTML
rendering, no token logging, no cross-guest access, responsive reflow, and WCAG 2.2 AA behavior.

### 6. End-To-End Cases

All cases in [05-end-to-end-cases.md](./05-end-to-end-cases.md) are required.

| Case | Required result |
|---|---|
| `C01` | Account creation, browser verification, restore, reset, sign-out, and no permission prompt pass |
| `C02` | Private one-host event lifecycle, recovery, conflict, status truth, and deletion pass |
| `C03` | Manual guest management, exact cap, scoped send, provider truth, and retry pass |
| `C04` | Browser-only account-free RSVP and every token failure pass |
| `C05` | Manual accepted-guest check-in, idempotency, correction, authorization, and offline failure pass |
| `C06` | In-app deletion, immediate revocation, bounded recovery, full disposition, and backup replay pass |

`C01` through `C06` all pass on a current physical iPhone. The minimum-OS and small-iPhone matrix
distributes the cases but includes at least one case from every domain. No case depends on manual
database editing after its deterministic seed.

## Security Validation

- Attempt event, guest, invitation, attendance, and deletion ID substitution between two hosts.
- Attempt anonymous, unverified, expired-session, and unrelated-account mutations.
- Submit public visibility, another host ID, capacity above 50, invalid status, stale revision, and
  invalid date or timezone.
- Race two 50th-guest requests and two 51st-guest requests.
- Attempt arbitrary recipient, mixed valid and unrelated recipients, more than 50 recipients, and
  more than 100 recipients in one rolling hour.
- Test provider timeout before and after acceptance and duplicate idempotency keys.
- Test RSVP token guessing, raw database ID use, token substitution, replay, expiry, revocation, and
  concurrent response.
- Test check-in of every RSVP state, duplicate check-in, correction conflict, and unrelated host.
- Test verification and reset enumeration, brute force, replay, and log redaction.
- Test invalid webhook signatures, stale timestamps, replay, and missing production secret.
- Test deletion cancellation, wrong credentials, duplicate command, worker failure, orphan scan,
  backup expiry, and tombstone replay.

Release evidence includes a security review of the candidate diff, dependency and secret scans,
actor-matrix results, TLS network capture, redacted log samples, backup restore, and incident contacts.

## Privacy And Data-Lifecycle Validation

1. Install the release build on a clean physical iPhone.
2. Capture every network domain and request class while running `C01` through `C06`.
3. Map every transmitted field to an App Privacy category, purpose, linkage, processor, and
   retention row.
4. Confirm no IDFA, fingerprinting, cross-company tracking, undeclared domain, or excluded provider
   path exists.
5. Generate the Xcode privacy report and inspect all app and SDK manifests and signatures.
6. Inspect the final Info.plist and entitlements for zero sensitive-permission declarations.
7. Execute each deadline and disposition in document 01 using controlled clocks and isolated data.
8. Verify Azure PostgreSQL backups expire after the currently configured 7 days and restore tooling
   replays deletion receipts.
9. Reconcile binary, traffic, API, logs, policy, App Privacy, manifests, and processor contracts.
10. Record product, engineering, security/privacy, and legal approval.

## Accessibility Validation

Run every primary task in the six cases with:

- VoiceOver, including screen-curtain checks for nonvisual completion.
- Voice Control with visible command labels.
- Largest accessibility Dynamic Type.
- Reduce Motion.
- Increase Contrast.
- Differentiate Without Color.
- Bold Text.
- Switch Control smoke coverage for primary actions.

Pass criteria:

- No required content or action is clipped, hidden, unlabeled, unreachable, or gesture-only.
- Focus order follows task order and route changes move focus predictably.
- Validation errors identify field and correction.
- Status has text or symbol in addition to color.
- Browser verification, reset, RSVP, legal, and support remain keyboard and screen-reader operable.
- Any App Store accessibility claim has complete evidence.

## Performance And Reliability

Measure the document 03 budgets on release builds. Also record memory, battery, crash-free sessions,
hangs, API latency, provider latency, and deletion-job age.

Failure injection covers:

- Timeout before and after every mutation acceptance.
- 401, 403, 404, 409, 413, 422, 429, 500, 502, 503, and 504 where applicable.
- Database connection exhaustion and transaction conflict.
- Email accepted, delivered, transient failure, bounce, delayed webhook, and invalid webhook.
- Browser refresh during RSVP submission.
- Deletion and event-expiry worker retry exhaustion.

Pass criteria:

- No mutation is falsely reported complete.
- Retry cannot duplicate a successful side effect.
- The app and browser do not crash, hang, loop indefinitely, or erase valid input.
- Recovery obtains authoritative state without reinstalling the app.

## App Review Rehearsal

Run on a clean physical iPhone using only App Store Connect Review Notes and supplied resources.

1. Install the exact processed candidate.
2. Sign in with the verified review host.
3. Open the seeded private event, edit it, and inspect server status.
4. Add a manual guest and send the fixed invitation to the controlled inbox.
5. Open the invitation in Safari and complete browser RSVP without a PartyHause account.
6. Return to the host app and manually check in the accepted guest.
7. Open Privacy, Terms, and Support from signed-out and Account surfaces.
8. Open Delete Account on the main review account without final confirmation.
9. Use the disposable account to complete deletion and verify immediate sign-out.
10. Confirm no sensitive permission appears and no excluded route, feature, or claim is visible.
11. Compare every screenshot, description, privacy answer, age answer, and note with the installed
    build and browser behavior.

## Release Gates

### `RG-01`: Scope Integrity

- Registry totals are 14 native screens, 6 browser surfaces, 6 flows, 6 cases, 3 overlays, and 3
  operations.
- The binary targets iPhone only.
- Events are private, have one host, and cap guests at 50.
- Every `REMOVED_FROM_IOS_MVP` capability is absent from routes, flags, binary, metadata, seed, and
  network traffic.

### `RG-02`: Functional Integrity

- All six cases pass on the selected candidate.
- No Critical, Blocker, or High defect is open.
- No false success, duplicate mutation, silent overwrite, or unrecoverable partial write remains.

### `RG-03`: Security

- Actor matrix, boundary, rate-limit, token, webhook, idempotency, concurrency, redaction,
  dependency, secret, and migration tests pass.
- No arbitrary email relay, private-data leak, reusable leaked token, or internal exception reaches
  a client.

### `RG-04`: Privacy And Data Disposition

- Policy, App Privacy, manifests, SDKs, processors, traffic, logs, and document 01 agree.
- No tracking or sensitive permission remains.
- Every deletion and retention deadline, including backup expiry and tombstone replay, passes.

### `RG-05`: Accessibility And iPhone Quality

- Document 03 common tasks pass required accessibility modes.
- Small, standard, and large iPhone layouts pass on the supported OS matrix.
- Performance budgets, browser handoffs, Keychain, backgrounding, and network recovery pass.

### `RG-06`: App Store Compliance

- Account, agreements, signing, build, age rating, App Privacy, export, DSA, price, regions,
  metadata, screenshots, review information, and live Apple requirements are complete.
- App Store Connect processes the exact candidate without an unresolved issue.

### `RG-07`: Operational Readiness

- API, database, email, browser pages, support, invitation delivery, event completion and expiry,
  account deletion, backups, alerts, on-call, incident response, and rollback have been exercised.
- Review resources and controlled inbox remain monitored through review.

### `RG-08`: Final Go Or No-Go

Required approvers are product, mobile, API/data, security/privacy, support, legal/compliance, and the
Apple Account Holder or authorized App Manager. Any approver can issue no-go for an unmet mandatory
requirement. Schedule pressure does not override a gate.

## Defect Policy

| Severity | Release treatment |
|---|---|
| Critical | Candidate rejected; distribution limited to controlled diagnosis |
| Blocker | Candidate rejected until fixed and revalidated |
| High | Public submission blocked |
| Medium | Requires named owner, bounded impact, evidence, and explicit product plus security acceptance |
| Low | May ship only when non-deceptive and unrelated to access, privacy, security, data integrity, or a primary task |

## Launch And Containment

Launch day:

1. Freeze and record candidate configuration.
2. Verify Apple, PartyHause, database, email, and browser-page status.
3. Run account, event, invitation, RSVP, check-in, support, and deletion smoke checks.
4. Confirm engineering, support, privacy, and incident owners are active.
5. Release manually after App Review approval.
6. Install from the App Store and repeat production smoke checks.
7. Monitor crashes, hangs, auth, API, email, RSVP, check-in, support, expiry, and deletion.

Immediate containment:

| Failure | Action |
|---|---|
| Crash on launch or account lockout | Pause release, contain server behavior, and prepare a reviewed correction |
| Authorization or private-data exposure | Disable affected endpoint, revoke credentials, and start incident response |
| Email abuse or recipient leakage | Disable send, revoke RSVP credentials, stop provider traffic, and investigate |
| Duplicate RSVP or check-in | Disable mutation and reconcile idempotency and audit records |
| Deletion failure | Keep access revoked, alert operations, and resume the same request |
| Metadata mismatch | Correct server-editable metadata or submit a corrected binary as required |

Feature containment cannot hide functionality from App Review or enable an excluded feature after
approval.

## Evidence Retention

Retain candidate identity, automated results, iPhone and OS matrix, accessibility evidence, security
and privacy reviews, Xcode privacy report, App Store metadata snapshot, compliance answers, Review
Notes, smoke results, approvals, and incident records according to the approved security policy.
Evidence never contains passwords, tokens, guest email addresses, event copy, or other production
personal data.
