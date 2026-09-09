# IOS-MVP-1 App Store Launch Requirements

Research cutoff: September 3, 2026

Distribution: Public Apple App Store

Target: Expo/React Native iPhone app

Apple sources: [10-official-sources.md](./10-official-sources.md)

Apple rules, forms, SDK floors, and regional terms change. `VERIFY_LIVE` items must be checked in
Apple Developer and App Store Connect on upload and submission day.

## Labels

| Label | Meaning |
|---|---|
| `MANDATORY` | Required for this public IOS-MVP-1 release |
| `CONDITIONAL` | Required only if the named behavior or storefront applies |
| `RECOMMENDED` | PartyHause release gate even when Apple does not require a form field |
| `VERIFY_LIVE` | Recheck the current Apple page or live account before submission |

## Current External Deadlines

| Effective date | Label | Requirement |
|---|---|---|
| May 1, 2024 | `MANDATORY` | Required-reason APIs must use approved reasons in privacy manifests |
| February 17, 2025 | `MANDATORY`, `VERIFY_LIVE` | Developer trader or non-trader status must be declared |
| January 31, 2026 | `MANDATORY` | Current age-rating questions and rating system apply |
| April 28, 2026 | `MANDATORY` | Uploads require Xcode 26 or later and the iOS 26 SDK or later |
| September 2026 | `MANDATORY`, `VERIFY_LIVE` | Recheck the updated age-rating questionnaire at submission |

No later SDK deadline is assumed. The live Upcoming Requirements page controls.

## Developer Account And Legal Entity

| ID | Label | Requirement | Evidence |
|---|---|---|---|
| `IOS-DEV-01` | `MANDATORY` | Active Apple Developer Program membership through review and release | Membership status |
| `IOS-DEV-02` | `MANDATORY` | Two-factor authentication for the enrolling Apple Account | Account security capture |
| `IOS-DEV-03` | `MANDATORY` | Account Holder accepts all current agreements | No pending agreement |
| `IOS-DEV-04` | `MANDATORY` | Least-privileged App Store Connect roles | Team-role review |
| `IOS-DEV-05` | `VERIFY_LIVE` | Legal entity, seller, address, phone, email, and membership dates are current | Submission-day record |

Paid-app tax, banking, and purchase agreements are not active IOS-MVP-1 requirements because the
app is free and contains no purchase. Reassess before any monetization.

## Identifier, Device Family, Signing, And Build

| ID | Label | Requirement | Evidence |
|---|---|---|---|
| `IOS-BLD-01` | `MANDATORY` | App ID and App Store record use `com.partyhause.mobile` | Matching identifier records |
| `IOS-BLD-02` | `MANDATORY` | The target supports iPhone only and declares no tablet family | Archive device-family inspection |
| `IOS-BLD-03` | `MANDATORY` | Minimum deployment target is iOS 17.0 | Built target settings |
| `IOS-BLD-04` | `MANDATORY` | App Store archive is signed by the correct team and profile | Archive validation |
| `IOS-BLD-05` | `MANDATORY` | Version and build number increase monotonically | App Store Connect build record |
| `IOS-BLD-06` | `MANDATORY` | Upload uses Xcode 26 or later and iOS 26 SDK or later | Processed build metadata |
| `IOS-BLD-07` | `MANDATORY` | Only public APIs and capabilities used by the binary are present | Entitlement and validation report |
| `IOS-BLD-08` | `MANDATORY` | The app downloads no executable feature code | Architecture review |
| `IOS-BLD-09` | `MANDATORY` | IPv6-only networking passes for auth, API, email links, and browser RSVP | NAT64 test |
| `IOS-BLD-10` | `MANDATORY` | Release archive has a valid 1024 by 1024 icon with no alpha | Asset validation |
| `IOS-BLD-11` | `MANDATORY` | Compiler, TypeScript, lint, test, native build, and App Store validation errors are zero | Candidate logs |
| `IOS-BLD-12` | `RECOMMENDED` | Build is reproducible from a tagged commit with lockfile, symbols, and provenance retained | Release record |
| `IOS-BLD-13` | `VERIFY_LIVE` | Current Xcode, SDK, listed-SDK, signing, and upload rules still pass | Submission-day review |

IOS-MVP-1 does not use Universal Links or a custom scheme for RSVP. Verification, reset, RSVP,
Privacy, Terms, and Support are HTTPS browser routes. The release must not claim associated-domain,
QR, or deep-link behavior it does not use.

## Completeness And Honest Metadata

| ID | Label | Requirement | Evidence |
|---|---|---|---|
| `IOS-CMP-01` | `MANDATORY` | Every visible route and action is complete and production-backed | Route and action inventory |
| `IOS-CMP-02` | `MANDATORY` | Binary, remote flags, seed data, screenshots, and metadata expose only registered IOS-MVP-1 surfaces | Scope diff |
| `IOS-CMP-03` | `MANDATORY` | No sample data, false success, unavailable action, or beta language appears | Clean-install review |
| `IOS-CMP-04` | `MANDATORY` | App name, description, screenshots, privacy, age rating, and Review Notes match the binary | Metadata reconciliation |
| `IOS-CMP-05` | `MANDATORY` | API, database, email, browser pages, support, retention, and deletion remain live during review | Monitoring and staffing evidence |
| `IOS-CMP-06` | `MANDATORY` | Review Notes explain browser RSVP, one-host ownership, 50-guest cap, no native guest mode, and no permissions | Approved Review Notes |

Any visible PartyCrew/social, template, timeline, poll, PartyBoard, cost, game, push, realtime, media,
contacts, camera, iPad, Android launch, or payment surface blocks submission.

## Accounts And Authentication

| ID | Label | Requirement | Evidence |
|---|---|---|---|
| `IOS-ACT-01` | `MANDATORY` | Registration, verification, sign-in, restore, recovery, sign-out, and error recovery pass end to end | `C01` |
| `IOS-ACT-02` | `MANDATORY` | Signup does not create a session before email verification | API and device test |
| `IOS-ACT-03` | `MANDATORY` | Credentials and session material use Keychain-backed storage | Device inspection |
| `IOS-ACT-04` | `MANDATORY` | Stored sessions are server-validated before private UI renders | Cold-launch tests |
| `IOS-ACT-05` | `MANDATORY` | Credential and recovery endpoints are enumeration-safe and rate-limited | Negative and rate-limit tests |
| `IOS-ACT-06` | `MANDATORY` | Sign-out, reset, and deletion revoke applicable sessions and clear device data | Lifecycle tests |
| `IOS-ACT-07` | `MANDATORY` | External identity buttons and incomplete issuers are absent | Binary and UI inventory |
| `IOS-ACT-08` | `CONDITIONAL` | If third-party login is later introduced, reassess Guideline 4.8 and Sign in with Apple | Approved later-scope review |

First-party email and password is the only IOS-MVP-1 login. Sign in with Apple is not required for
an app that offers only its own account system.

## Permanent Account Deletion

| ID | Label | Requirement | Evidence |
|---|---|---|---|
| `IOS-DEL-01` | `MANDATORY` | Permanent deletion is easy to find at `SET-01 -> ACC-01` | Clean-install review |
| `IOS-DEL-02` | `MANDATORY` | Deactivation is not substituted for deletion | Copy and API review |
| `IOS-DEL-03` | `MANDATORY` | Deletion starts and completes without requiring phone or email support | `C06` |
| `IOS-DEL-04` | `MANDATORY` | Recent authentication and confirmation add safety without unnecessary friction | Failure and success branches |
| `IOS-DEL-05` | `MANDATORY` | Account, hosted events, guests, invitations, RSVP, attendance, credentials, and device data follow document 01 | Disposition audit |
| `IOS-DEL-06` | `MANDATORY` | Delayed work communicates pending, failure recovery, and completion | Worker evidence |
| `IOS-DEL-07` | `MANDATORY` | The right applies in every selected storefront | Policy and test matrix |
| `IOS-DEL-08` | `CONDITIONAL` | Sign in with Apple token revocation is required only if that login is later added | Later release evidence |

## Privacy Policy, App Privacy, And Data Use

| ID | Label | Requirement | Evidence |
|---|---|---|---|
| `IOS-PRV-01` | `MANDATORY` | Privacy Policy identifies each collected data type and source | Final data map |
| `IOS-PRV-02` | `MANDATORY` | Every use, linkage, sharing purpose, and processor is stated | Purpose and processor map |
| `IOS-PRV-03` | `MANDATORY` | Retention and deletion match the exact document 01 matrix | Job, database, backup, and provider tests |
| `IOS-PRV-04` | `MANDATORY` | Consent withdrawal, correction, support, and deletion methods are clear | Policy and UI review |
| `IOS-PRV-05` | `MANDATORY` | Policy, App Privacy, manifests, SDKs, logs, and observed traffic agree | Signed reconciliation |
| `IOS-PRV-06` | `MANDATORY` | No collected data is repurposed without a valid basis and required consent | Data-use review |
| `IOS-PRV-07` | `MANDATORY` | No historical provider remains in disclosures and no active provider is omitted | Dependency and traffic audit |

The final processor inventory includes only services reached by IOS-MVP-1:

- PartyHause Express API and Azure Container Apps ingress.
- Azure Database for PostgreSQL.
- Azure Communication Services and Resend only according to the active email failover behavior.
- Expo and EAS services present in the installed binary or build/distribution path.
- Any crash or performance service actually added before release.

Azure Web PubSub, Azure Blob media, OpenAI, Entra, push providers, payment providers, advertising,
and social analytics are excluded unless final traffic proves an unavoidable active path. If an
excluded provider is reached, submission is blocked until the code or the approved scope changes.

### App Privacy working inventory

| Apple data category | IOS-MVP-1 example | Expected use |
|---|---|---|
| Name | Host display name; guest name | Linked; app functionality |
| Email address | Host login; guest invitation | Linked; app functionality, authentication, communication |
| User ID | Internal host account ID | Linked; app functionality and security |
| Other user content | Private event title, description, date, and venue | Linked; app functionality |
| Product interaction | RSVP, invitation result, and check-in state | Linked; app functionality |
| Diagnostics | Crash or performance data only if a final SDK collects it | Declare exact final behavior |
| IP address in service logs | Security and rate limiting | Classify against current Apple definitions and disclose as required |

Do not declare contacts, photos, precise location, device ID for push, payment data, social content,
or tracking when the final binary does not collect them. Network capture, not intent, determines the
answer.

## Privacy Manifests And Tracking

| ID | Label | Requirement | Evidence |
|---|---|---|---|
| `IOS-MAN-01` | `CONDITIONAL`, upload-blocking | Every required-reason API used by app or SDK has an approved reason in the correct manifest | Xcode privacy report |
| `IOS-MAN-02` | `MANDATORY` when a reason is declared | The reason matches actual use and is never used for fingerprinting | Code-to-reason review |
| `IOS-MAN-03` | `CONDITIONAL`, upload-blocking | Listed third-party SDK manifests and signatures meet current Apple rules | Archive dependency audit |
| `IOS-MAN-04` | `VERIFY_LIVE` | Required-reason and listed-SDK lists are rechecked for the candidate | Submission-day audit |
| `IOS-ATT-01` | `MANDATORY` | No IDFA access, fingerprinting, data broker sharing, targeted advertising, or cross-company tracking | SDK, endpoint, and domain audit |
| `IOS-ATT-02` | `MANDATORY` | No ATT prompt or tracking purpose string appears | Info.plist and runtime inspection |
| `IOS-ATT-03` | `CONDITIONAL` | Any later tracking proposal requires approved scope, ATT, App Privacy, policy, and denial behavior | Later release review |

## Permissions And Device Capabilities

| ID | Label | IOS-MVP-1 requirement | Evidence |
|---|---|---|---|
| `IOS-PER-01` | `MANDATORY` | No contacts usage string, package call, or runtime prompt | Archive and device inspection |
| `IOS-PER-02` | `MANDATORY` | No camera usage string, scanner, QR flow, or runtime prompt | Archive and route inspection |
| `IOS-PER-03` | `MANDATORY` | No photo-library or photo-save usage string or runtime prompt | Archive and device inspection |
| `IOS-PER-04` | `MANDATORY` | No notification entitlement, registration, token, usage prompt, or settings claim | Entitlement and traffic inspection |
| `IOS-PER-05` | `MANDATORY` | No microphone, location, local-network, or tracking usage string or runtime request | Info.plist and runtime inspection |
| `IOS-PER-06` | `MANDATORY` | Mail and browser handoffs remain optional and recoverable | `C01`, `C04` |

Purpose text for an excluded capability is itself a scope defect, even if the app never triggers it.

## Security And Data Protection

| ID | Label | Requirement | Evidence |
|---|---|---|---|
| `IOS-SEC-01` | `MANDATORY` | Every event, guest, invitation, attendance, and deletion operation is authorized server-side | Actor-matrix tests |
| `IOS-SEC-02` | `MANDATORY` | Session secrets use Keychain and are revoked and cleared at lifecycle boundaries | Device and API tests |
| `IOS-SEC-03` | `MANDATORY` | Production uses HTTPS only and supports IPv6-only networks | Proxy and NAT64 tests |
| `IOS-SEC-04` | `MANDATORY` | Request bodies, paths, query values, email addresses, dates, counts, and tokens have explicit bounds and normalization | Negative schema tests |
| `IOS-SEC-05` | `MANDATORY` | Invitation send requires authentication, ownership, guest membership, a 50-recipient cap, and a 100-recipient hourly cap | Abuse tests |
| `IOS-SEC-06` | `MANDATORY` | RSVP tokens are random, hashed at rest, single-guest, expiring, revocable, and never logged | Token and concurrency tests |
| `IOS-SEC-07` | `MANDATORY` | Provider webhooks fail closed on invalid signature and replay | Webhook tests |
| `IOS-SEC-08` | `MANDATORY` | Logs and errors omit secrets, addresses, content, provider payloads, and internal exception text | Automated redaction tests |
| `IOS-SEC-09` | `MANDATORY` | Retryable mutations use server-enforced idempotency and transactions | Timeout and concurrency tests |
| `IOS-SEC-10` | `RECOMMENDED` | Dependency, secret, SBOM, backup restore, incident response, and vulnerability review pass | Release security report |

## Content, Age Rating, And Payments

| ID | Label | Requirement | Evidence |
|---|---|---|---|
| `IOS-CNT-01` | `MANDATORY` | Final age-rating answers describe the actual private host tool and browser RSVP | Saved questionnaire |
| `IOS-CNT-02` | `MANDATORY`, `VERIFY_LIVE` | Social Media is answered from the final binary; PartyCrew and all social features are absent | Feature-to-form audit |
| `IOS-CNT-03` | `MANDATORY` | Private event text is length-bounded, safely rendered, and sent only to invited recipients | Input, authorization, and output tests |
| `IOS-CNT-04` | `MANDATORY` | Public Support contact is easy to find from app and RSVP page | Route test |
| `IOS-CNT-05` | `CONDITIONAL` | Broad UGC filtering, report, block, and moderation controls are reassessed before any social, public, or collaborative content ships | Later scope approval |
| `IOS-PAY-01` | `MANDATORY` | App is Free and contains no ticket, purchase, subscription, reimbursement, donation, or payment link | Binary and metadata inspection |
| `IOS-PAY-02` | `CONDITIONAL` | Any later digital feature sale uses the then-current App Review and StoreKit rules | Later scope approval |

Do not select the Kids Category. Set and disclose a minimum age supported by legal review and the
signup assertion. The calculated rating comes from the live App Store Connect questionnaire, not
from this document.

## Accessibility

| ID | Label | Requirement | Evidence |
|---|---|---|---|
| `IOS-ACC-01` | `RECOMMENDED`, release gate | All six cases complete with VoiceOver | Physical iPhone evidence |
| `IOS-ACC-02` | `RECOMMENDED`, release gate | All primary actions complete with Voice Control | Task evidence |
| `IOS-ACC-03` | `RECOMMENDED`, release gate | Larger Text and accessibility sizes preserve content and actions | Screenshot and task matrix |
| `IOS-ACC-04` | `RECOMMENDED`, release gate | Contrast passes and color is not the sole status signal | Automated and manual review |
| `IOS-ACC-05` | `RECOMMENDED`, release gate | Reduce Motion preserves every task | Motion matrix |
| `IOS-ACC-06` | `MANDATORY` if claimed | App Store accessibility claims match complete evidence | Claim record |
| `IOS-ACC-07` | `VERIFY_LIVE` | Accessibility Nutrition Label requirement and available labels are checked | Submission-day review |

## App Store Record And Metadata

| ID | Label | Requirement | Evidence |
|---|---|---|---|
| `IOS-META-01` | `MANDATORY` | App Store record has correct name, language, bundle ID, SKU, and team access | App record |
| `IOS-META-02` | `MANDATORY` | Name is `PartyHause`; description and keywords stay within live limits | Metadata validation |
| `IOS-META-03` | `MANDATORY` | Primary category reflects a private event host tool; proposed category is Lifestyle | Category review |
| `IOS-META-04` | `MANDATORY` | Public Privacy Policy and Support URLs work without authentication | URL checks |
| `IOS-META-05` | `MANDATORY` | Price is explicitly Free and selected regions match legal and support coverage | Availability record |
| `IOS-META-06` | `MANDATORY` | App Privacy, age rating, export, content rights, advertising, and DSA fields are complete | Submission record |
| `IOS-META-07` | `MANDATORY` | One to ten accepted iPhone screenshots use fictional data and show working app behavior | Media Manager acceptance |
| `IOS-META-08` | `MANDATORY` | No tablet screenshot is supplied because the binary is iPhone-only | Device-family and media check |
| `IOS-META-09` | `VERIFY_LIVE` | Field limits, screenshot wells, dimensions, categories, and required properties are current | Submission-day review |

Metadata direction:

| Field | Approved direction |
|---|---|
| Name | PartyHause |
| Subtitle | Plan, invite, welcome |
| Primary category | Lifestyle |
| Core message | Create a private event, invite up to 50 guests, collect browser RSVPs, and manage attendance |
| Keyword themes | event planning, guest list, invitations, RSVP, attendance, check-in |

Screenshots show `EVT-01`, `EVT-02`, `EVT-03`, `GST-01`, and `INV-01`. They do not show excluded
features, another host, more than 50 guests, native guest mode, or permission prompts.

## Review Access And Notes

| ID | Label | Requirement | Evidence |
|---|---|---|---|
| `IOS-REV-01` | `MANDATORY` | Current private review contact name, email, and international phone are supplied | App Review Information |
| `IOS-REV-02` | `MANDATORY` | A verified, non-expiring host review account works | Pre-submit check |
| `IOS-REV-03` | `MANDATORY` | Reviewer receives one seeded private event, controlled invitation URL, controlled inbox, and disposable deletion account | Review package |
| `IOS-REV-04` | `MANDATORY` | Notes explain browser RSVP, manual check-in, no permissions, one host, 50 guests, and deletion | Approved notes |
| `IOS-REV-05` | `MANDATORY` | Review credentials and services remain live through review | Monitoring and owner |

Review Notes contain exact steps for all six cases. They do not include secrets in the repository,
request a guest native login, or reference QR, camera, push, social, templates, collaboration,
payments, tablet, or Android launch.

## Export, DSA, TestFlight, And Release

| ID | Label | Requirement | Evidence |
|---|---|---|---|
| `IOS-EXP-01` | `MANDATORY` | Final app and libraries receive an export-compliance assessment | Assessment tied to archive |
| `IOS-EXP-02` | `MANDATORY` | App Store encryption answers are accurate and required documents are attached | Build compliance record |
| `IOS-EXP-03` | `VERIFY_LIVE` | Live encryption questionnaire is completed for the selected build | Submission-day record |
| `IOS-EU-01` | `MANDATORY`, `VERIFY_LIVE` | Trader or non-trader status is declared | App Store Connect status |
| `IOS-EU-02` | `CONDITIONAL` | EU trader contact, verification, payment-account, and certification fields are complete when applicable | Regional record |
| `IOS-EU-03` | `CONDITIONAL` | Selected regions receive legal review for age, consumer, privacy, and business rules | Storefront matrix |
| `IOS-REL-01` | `RECOMMENDED`, release gate | Internal and external TestFlight cycles complete before public submission | Tester matrix and disposition |
| `IOS-REL-02` | `MANDATORY` | Correct processed build and every required version field are selected and submitted | Submission receipt |
| `IOS-REL-03` | `RECOMMENDED` | First release uses manual release with engineering and support staffed | Release plan |
| `IOS-REL-04` | `MANDATORY` | App remains functional, supported, and policy-current after launch | Ownership and monitoring |

## Submission-Day Checklist

1. Membership, agreements, roles, legal entity, and DSA status are current.
2. The selected build is iPhone-only, signed correctly, uses an accepted Xcode and SDK, and targets
   iOS 17.0 or later.
3. App Store processing reports no binary, signing, privacy-manifest, listed-SDK, required-reason,
   export, or entitlement error.
4. The archive contains no excluded entitlement, purpose string, route, asset, SDK path, or remote
   feature flag.
5. App Privacy matches the final archive, network capture, API behavior, processors, logs, policy,
   and document 01 retention matrix.
6. The live age-rating questionnaire and selected storefront obligations are complete.
7. Price is Free; no purchase or payment statement appears.
8. iPhone screenshots, description, keywords, category, Privacy URL, Support URL, and copyright are
   current and accurate.
9. Review contact, host account, controlled inbox, browser RSVP link, seeded event, disposable
   deletion account, and Review Notes pass from a clean install.
10. All six cases and all release gates in document 09 pass on the selected candidate.

Submission is blocked by any mismatch between this checklist, the binary, server behavior, browser
behavior, metadata, or observed data flow.
