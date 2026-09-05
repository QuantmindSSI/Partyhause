# iOS App Store Launch Requirements

Research cutoff: September 3, 2026  
Distribution: Public Apple App Store  
Target: Native Expo/React Native iPhone and iPad app  
Apple source index: [10-official-sources.md](./10-official-sources.md)

Apple changes App Store rules, forms, SDK requirements, and regional terms. Every item labeled `VERIFY LIVE` must be checked again in Apple Developer and App Store Connect immediately before upload or submission.

## Requirement Labels

| Label | Meaning |
|---|---|
| `MANDATORY` | Applies to the described PartyHause public App Store launch |
| `CONDITIONAL` | Required only when the named feature, data use, business model, or storefront applies |
| `RECOMMENDED` | Strong quality, review-risk, or operational control without a universal Apple submission field |
| `OPTIONAL` | A supported choice that is not needed for the PartyHause public App Store launch |
| `VERIFY LIVE` | The value or policy can change and must be confirmed in the live account at submission |

## Current Apple Deadlines

| Effective date | Label | Requirement |
|---|---|---|
| May 1, 2024 | `MANDATORY` | Code using Apple's listed required-reason APIs must declare an approved reason in privacy manifests; missing reasons can block upload |
| February 17, 2025 | `MANDATORY`, `VERIFY LIVE` | Every developer must declare trader or non-trader status; apps offered in the EU become unavailable there until required trader verification is complete |
| January 31, 2026 | `MANDATORY` | Updated age-rating questions and rating system are in force |
| April 28, 2026 | `MANDATORY` | iOS and iPadOS uploads must be built with Xcode 26 or later using the iOS/iPadOS 26 SDK or later |
| Beginning September 2026 | `MANDATORY`, `VERIFY LIVE` | Updated age-rating responses include social-media capability questions; confirm the form is active for the app record |
| Later in 2026 | `CONDITIONAL` | New Sign in with Apple relay addresses begin using `@private.icloud.com`; existing `@privaterelay.appleid.com` addresses continue, so both must be accepted if Sign in with Apple is used |
| October 1, 2026 | `CONDITIONAL`, `VERIFY LIVE` | Developers distributing in the EU move to Apple's announced unified business terms; transaction and alternative-payment provisions apply where relevant |

No Xcode 27 or iOS 27 SDK submission deadline was published at the research cutoff. Do not infer one. Recheck Apple's Upcoming Requirements page on upload day.

Apple's support matrix listed Xcode 26.6 as the latest production release at the research cutoff. Use a production release accepted by App Store Connect; beta Xcode and iOS 27 builds are compatibility targets unless Apple explicitly permits or requires them for submission.

## 1. Developer Program And Legal Entity

| ID | Label | Requirement | Required evidence |
|---|---|---|---|
| `IOS-DEV-01` | `MANDATORY` | Maintain an active Apple Developer Program membership | Membership page shows active status through the intended release window |
| `IOS-DEV-02` | `MANDATORY` | Use two-factor authentication on the enrolling Apple Account | Account security status verified |
| `IOS-DEV-03` | `MANDATORY` | Ensure the Account Holder accepts the latest Apple Developer Program License Agreement | No pending agreement banner in Apple Developer or App Store Connect |
| `IOS-DEV-04` | `RECOMMENDED` | Enroll the organization that legally owns PartyHause so its name appears as seller | Organization identity, D-U-N-S record, domain email, website, and signing authority verified |
| `IOS-DEV-05` | `CONDITIONAL` | Keep Paid Apps Agreement, tax, and banking active if paid app, In-App Purchase, or subscription is introduced; separate DSA trader payment-account requirements are covered in section 19 | Agreement active and tax/banking accepted before paid product submission |
| `IOS-DEV-06` | `MANDATORY` | Assign least-privileged App Store Connect roles for development, metadata, finance, and submission | Team-role review recorded |
| `IOS-DEV-07` | `VERIFY LIVE` | Confirm legal entity name, seller name, address, phone, email, agreements, and membership expiration | Submission-day account capture |

## 2. App Identifier, Signing, And Build

| ID | Label | Requirement | Required evidence |
|---|---|---|---|
| `IOS-BLD-01` | `MANDATORY` | Register an explicit App ID matching the release bundle identifier | App ID and App Store Connect record both use `com.partyhause.mobile`, or an intentionally migrated final identifier |
| `IOS-BLD-02` | `MANDATORY` | Sign the archive for App Store distribution with the correct team and provisioning | Release archive validates with no signing errors |
| `IOS-BLD-03` | `MANDATORY` | Build uploads with Xcode 26 or later and the iOS/iPadOS 26 SDK or later | Build metadata in App Store Connect shows an accepted toolchain |
| `IOS-BLD-04` | `MANDATORY` | Use monotonically increasing build numbers and a user-facing semantic version | App Store Connect accepts the version and build |
| `IOS-BLD-05` | `MANDATORY` | Include only capabilities actually used by the build | Entitlement diff reviewed against features and App Store record |
| `IOS-BLD-06` | `MANDATORY` | Use only public APIs for their intended purposes | Release archive and App Store validation contain no private-API issue |
| `IOS-BLD-07` | `MANDATORY` | Keep the app self-contained and do not download executable code that changes functionality | Architecture review confirms remote data cannot introduce executable product features |
| `IOS-BLD-08` | `MANDATORY` | Support IPv6-only networks | Physical or representative NAT64 test passes for auth, API, media, links, and notifications |
| `IOS-BLD-09` | `MANDATORY` | Provide a final, stable build with no crash, incomplete route, mock production data, debug interface, or dead action | Release acceptance and exploratory test evidence |
| `IOS-BLD-10` | `MANDATORY` | Keep all backend services and review dependencies live during App Review | Health monitoring and on-call coverage confirmed |
| `IOS-BLD-11` | `MANDATORY` | Configure Universal Links for supported web URLs | Associated Domains entitlement and valid `apple-app-site-association` file tested on physical devices |
| `IOS-BLD-12` | `MANDATORY` | Configure the custom `partyhause` scheme only for controlled QR and fallback use | Strict allow-list parser and collision-safe routing tests pass |
| `IOS-BLD-13` | `MANDATORY` | Include a valid 1024 by 1024 App Store icon with no alpha channel | Asset validation passes and icon matches installed app branding |
| `IOS-BLD-14` | `MANDATORY` | Resolve all release compiler, TypeScript, lint, native build, and App Store validation errors | CI and archive logs are clean |
| `IOS-BLD-15` | `RECOMMENDED` | Submit from a reproducible tagged commit with locked dependencies and retained symbols | Tag, lockfile, build provenance, archive, and dSYM storage recorded |
| `IOS-BLD-16` | `VERIFY LIVE` | Recheck current Xcode, SDK, listed-SDK, entitlement, and upload requirements | Submission-day Apple requirements review |

### Current repository actions

- `apps/mobile/app.config.ts` already names `PartyHause`, version `1.0.0`, and bundle ID `com.partyhause.mobile`.
- `apps/mobile/eas.json` contains non-production App Store submit values and cannot submit until secure account-level values are configured.
- The app config declares `supportsTablet: true`, and this specification fixes iPad quality, screenshots, and review coverage as part of 1.0. Removing iPad requires the directory-wide scope change process.
- The app config has a custom scheme but no Associated Domains configuration.
- The mobile package has no push-notification package or APNs registration implementation.
- The release must be built with the current accepted Xcode and SDK even if Expo's remote build image requires an SDK or image upgrade.

## 3. Product Completeness And Honest Metadata

Apple App Review Guideline 2.1 requires a final, functional app. Guideline 2.3 requires accurate metadata and disclosure of material behavior.

| ID | Label | Requirement | Required evidence |
|---|---|---|---|
| `IOS-CMP-01` | `MANDATORY` | Every visible feature is complete, reviewable, and backed by production behavior | No route or action in the release build depends on mock, fixed sample, or device-only data presented as synchronized |
| `IOS-CMP-02` | `MANDATORY` | Remove hidden, dormant, unavailable, or undocumented functionality | Feature flag and route inventory matches Review Notes and metadata |
| `IOS-CMP-03` | `MANDATORY` | Do not submit a beta, trial, or demonstration build to the public store | Public build contains no beta language; pre-release testing uses TestFlight |
| `IOS-CMP-04` | `MANDATORY` | App name, description, screenshots, preview, privacy label, age rating, and purchase claims match the binary | Metadata-to-build review completed |
| `IOS-CMP-05` | `MANDATORY` | Backend, authentication, invitation, email, moderation, support, and deletion systems remain accessible during review | Automated checks and staff coverage active |
| `IOS-CMP-06` | `MANDATORY` | Explain non-obvious behavior, permissions, deep links, and any feature constraints in Review Notes | Review Notes reviewed by product, engineering, and support |
| `IOS-CMP-07` | `RECOMMENDED` | Seed realistic fictional data so the reviewer does not depend on another real person | Review host and guest accounts contain events, posts, requests, notifications, and cost records |

For PartyHause, this requirement blocks submission while event publishing reports the wrong persisted state, invitation screens use fixed data, PartyBoard is device-only, event game actions are unavailable, or visible controls have no implementation.

## 4. Accounts, Authentication, And Login

| ID | Label | Requirement | Required evidence |
|---|---|---|---|
| `IOS-ACT-01` | `MANDATORY` | Require login only where persistent account behavior is material | Invitation preview, legal content, and support remain available without an account where safe |
| `IOS-ACT-02` | `MANDATORY` | Registration, verification, sign-in, reset, session restoration, and sign-out work end to end | `C01`, `C02`, and `C10` pass |
| `IOS-ACT-03` | `MANDATORY` | Preserve deep-link intent through authentication and verification | Universal Link cold, warm, install, and signed-out cases pass |
| `IOS-ACT-04` | `MANDATORY` | Protect credentials and session tokens with iOS Keychain-backed storage | Security test confirms tokens are not stored as ordinary AsyncStorage values |
| `IOS-ACT-05` | `MANDATORY` | Use enumeration-safe account recovery and bounded abuse controls | Known and unknown email behavior plus rate-limit tests pass |
| `IOS-ACT-06` | `CONDITIONAL` | If a third-party or social login authenticates the primary account, offer an equivalent login that satisfies Guideline 4.8 | Login matrix and App Review assessment recorded before exposing the button |
| `IOS-ACT-07` | `CONDITIONAL` | If Sign in with Apple is used, enable the capability, validate credentials, handle revocation, revoke tokens on deletion, support both relay domains, register outbound sender domains/addresses, and configure SPF for private relay delivery | Capability, server validation, revocation, sender registration, SPF, email relay, and deletion tests pass |
| `IOS-ACT-08` | `MANDATORY` | Keep incomplete Entra or other external identity controls out of the release build | Release feature inventory contains only end-to-end accepted token issuers |

PartyHause 1.0 uses its own email/password account system. Sign in with Apple is not universally required for an app that offers only its own account system. The presence of Microsoft infrastructure alone does not trigger Guideline 4.8. If Entra, Microsoft, Google, Facebook, or another third-party identity authenticates the user's primary account, evaluate the exact login model and Apple's exceptions, then provide a compliant equivalent option when required.

## 5. In-App Account Deletion

Apple requires apps that support account creation to let every user initiate permanent account deletion from within the app.

| ID | Label | Requirement | Required evidence |
|---|---|---|---|
| `IOS-DEL-01` | `MANDATORY` | Make permanent account deletion easy to find in the app; PartyHause places it in Account And Security | `SET-02 -> ACC-01` is reachable and reviewable |
| `IOS-DEL-02` | `MANDATORY` | Delete the account and associated personal data; deactivation alone is insufficient | Data-deletion inventory and completed `C10` run |
| `IOS-DEL-03` | `MANDATORY` | Include user-generated posts, comments, photos, reviews, and other associated content in deletion unless retention is legally required | Deletion job verification across all relevant tables and blob paths |
| `IOS-DEL-04` | `MANDATORY` | Do not require ordinary consumer users to call or email support | Complete in-app initiation and confirmation demonstrated |
| `IOS-DEL-05` | `MANDATORY` | Permit appropriate reauthentication and confirmation without unnecessary friction | Wrong-credential and successful confirmation branches pass |
| `IOS-DEL-06` | `MANDATORY` | Explain fulfillment timing and confirm completion if deletion is delayed | Pending and completion communications captured |
| `IOS-DEL-07` | `MANDATORY` | Apply the deletion right to every user region and automatically created account | Policy and tests cover all account types and storefronts |
| `IOS-DEL-08` | `CONDITIONAL` | If a web page completes deletion, link directly to that deletion page, not a generic support page | Direct-link test passes; native completion is preferred for 1.0 |
| `IOS-DEL-09` | `CONDITIONAL` | If subscriptions exist, explain that account deletion does not cancel Apple billing and link to subscription management while still allowing immediate deletion | Not applicable to the free 1.0 build; reassess before monetization |
| `IOS-DEL-10` | `CONDITIONAL` | Revoke Sign in with Apple tokens during deletion | Applies only if Sign in with Apple is introduced |

Apple specifies no universal retention period. PartyHause must choose, implement, and disclose actual periods for active data, deletion jobs, logs, backups, fraud evidence, support tickets, moderation records, and legally retained records.

## 6. User-Generated Content And Social Safety

PartyHause contains profiles, feed posts, comments, polls, board items, event descriptions, and invitation content. App Review Guideline 1.2 therefore applies even if some content is created on the web.

| ID | Label | Requirement | Required evidence |
|---|---|---|---|
| `IOS-UGC-01` | `MANDATORY` | Filter objectionable material before it is exposed through the service | `OPS-01` test corpus, enforcement logs, and `C05`/`C09` pass |
| `IOS-UGC-02` | `MANDATORY` | Provide an in-app report mechanism for offensive content and users | `MOD-01` reachable from every UGC and profile surface |
| `IOS-UGC-03` | `MANDATORY` | Operate a process that responds to reports in a timely manner | Moderation staffing, queue, service objective, escalation, and audit evidence |
| `IOS-UGC-04` | `MANDATORY` | Let users block abusive users from the service | Block API and cross-surface enforcement pass `OPS-03` tests |
| `IOS-UGC-05` | `MANDATORY` | Publish easy-to-find contact information | In-app Support and public Support URL show current contact channels |
| `IOS-UGC-06` | `MANDATORY` | Remove content that violates Apple guidelines, PartyHause terms, or Community Guidelines | Operator removal and account-action workflow demonstrated |
| `IOS-UGC-07` | `MANDATORY` | Prevent the service from becoming primarily pornography, bullying, threats, objectification, or random or anonymous chat | Product scope, policy, filters, reports, blocks, and enforcement metrics reviewed |
| `IOS-UGC-08` | `CONDITIONAL` | Identify creator content exceeding the app rating and restrict underage users with an appropriate age mechanism | Reassess if mature creator content is allowed; 1.0 should prohibit it |
| `IOS-UGC-09` | `RECOMMENDED` | Provide appeals, immutable evidence, moderator least privilege, audit history, and emergency escalation | `FL-O01` passes and operational runbook is approved |

The social and collaborative write features must remain disabled in production until `IOS-UGC-01` through `IOS-UGC-06` are complete. Removing only post composition is not sufficient if web-originated UGC still appears in the iOS feed.

## 7. Privacy Policy, App Privacy, And Consent

Apple requires a public Privacy Policy URL in App Store Connect and an easily accessible policy inside the app. App Privacy disclosures are a separate mandatory App Store Connect artifact. Privacy manifests in the binary are a third artifact.

### Privacy policy content

| ID | Label | Requirement | Required evidence |
|---|---|---|---|
| `IOS-PRV-01` | `MANDATORY` | Identify each data type collected and how it is collected | Final data map approved against client, server, database, logs, and vendors |
| `IOS-PRV-02` | `MANDATORY` | State every use of collected data | Purpose map matches product behavior and App Privacy answers |
| `IOS-PRV-03` | `MANDATORY` | Identify third-party processors, access, and sharing with equivalent protection expectations | Processor inventory and contracts reviewed |
| `IOS-PRV-04` | `MANDATORY` | State retention and deletion practices | Implemented retention schedule and deletion behavior match the policy |
| `IOS-PRV-05` | `MANDATORY` | Explain consent withdrawal and data-deletion methods | In-app controls and public contact path verified |
| `IOS-PRV-06` | `MANDATORY` | Keep policy, permission copy, App Privacy label, privacy manifests, and network behavior consistent | Release privacy reconciliation signed off |
| `IOS-PRV-07` | `MANDATORY` | Obtain informed consent where required and do not repurpose data without a valid basis and further consent where applicable | Consent inventory and version records reviewed |
| `IOS-PRV-08` | `MANDATORY` | Obtain explicit permission before sharing personal data with third-party AI | AI flow either excludes personal data or includes clear, specific consent and controls |

### PartyHause processor inventory to verify

The final policy and App Privacy answers must reflect every active service in the release path, including:

- PartyHause Express API.
- Azure Database for PostgreSQL.
- Azure Blob Storage.
- Azure Web PubSub if mounted by the release client.
- Resend and any active Azure email provider.
- Azure OpenAI or OpenAI for Smart Event Brief, including exactly what text is transmitted.
- Microsoft Entra External ID only if active in the release.
- Transitional Supabase services only while the release actually calls them.
- Expo/EAS services used by the installed binary or push infrastructure.
- Crash, diagnostics, analytics, customer support, moderation, and status providers added before launch.

No provider should appear in policy or App Privacy as historical residue after its code and data path are removed. No active provider may be omitted.

### App Privacy label

`MANDATORY`: App Store Connect requires accurate privacy-practice answers for the app and integrated third parties before a new app or update can be submitted. Responses can be updated without a binary update, but must remain accurate.

The following is a working audit inventory, not a substitute for examining the final network behavior:

| Apple data category | Expected PartyHause examples | Likely linkage and purpose | Launch action |
|---|---|---|---|
| Name | Account, profile, guest identity | Linked; app functionality and personalization | Declare if retained off device |
| Email address | Account, guest invitation, support | Linked; app functionality, security, communication | Declare |
| Phone number | Optional guest detail or support contact | Linked; app functionality | Declare only if final forms retain it |
| Physical address or location | Profile location and event venue | Usually linked; app functionality | Determine whether Apple's precise/coarse location category applies to stored event coordinates or addresses |
| Contacts | User-selected invitees from device contacts | Linked when stored as guests; app functionality | Declare actual selected-contact transmission and retention |
| Photos or videos | Avatar, cover, invitation artwork | Linked; app functionality and personalization | Declare if uploaded or retained |
| Emails or text messages | User-composed invitation communication if it meets Apple's category definition | Linked; app functionality | Confirm against the live App Privacy definitions |
| Other user content | Event copy, posts, comments, polls, and board notes | Linked; app functionality, moderation, personalization | Declare |
| Customer support | Support messages, attachments, and consented diagnostics | Linked; customer support and app functionality | Declare unless every optional-disclosure condition is met |
| User ID | Internal account, profile, guest-account linkage | Linked; app functionality and security | Declare |
| Device ID | Push token or installation identifier | Usually linked; app functionality | Declare if retained |
| Product interaction | Feed impressions, taps, feature analytics | Linked or not depending on implementation; analytics or personalization | Declare only actual collection and linkage |
| Crash data | Crash reporter payloads | Depends on SDK configuration; diagnostics | Declare if collected |
| Performance data | Launch, network, and responsiveness telemetry | Depends on implementation; diagnostics | Declare if collected |
| Other financial info | Cost-share amounts and reimbursement state | Linked; app functionality | Assess and declare if this category applies |
| Sensitive or health-related data | Dietary restrictions and accessibility accommodations | Linked; event functionality | Assess exact Apple categories, minimize fields, and disclose accurately |
| Gameplay content | Saved game runs or multiplayer state | Not collected in the local-only 1.0 design | Do not declare unless implementation transmits or retains it |
| Data represented by retained IP addresses | Server, security, provider, or CDN logs | Depends on use; Apple may classify it as location, device ID, or diagnostics | Audit retention and use, then map to the current definitions |

Apple generally defines collected data as data transmitted off device and retained longer than needed to service the immediate request. On-device-only processing is normally not declared as collected, but any derived value sent off device must be assessed.

### Privacy Choices URL

`RECOMMENDED`: Supply a public Privacy Choices URL that leads directly to data-access, correction, consent, and deletion controls. It is optional in App Store Connect but reduces friction and supports transparency.

## 8. Privacy Manifests And Required-Reason APIs

| ID | Label | Requirement | Required evidence |
|---|---|---|---|
| `IOS-MAN-01` | `CONDITIONAL`, upload-blocking | Every required-reason API used by app code has an Apple-approved reason in the appropriate `PrivacyInfo.xcprivacy` | Xcode archive privacy report and manifest review |
| `IOS-MAN-02` | `MANDATORY` when declaring a reason | The selected reason accurately describes actual use and the data is never used for fingerprinting | Code-to-reason trace reviewed |
| `IOS-MAN-03` | `CONDITIONAL` | Each executable or dynamic library using a required-reason API has the manifest in its containing bundle | Archive bundle inspection |
| `IOS-MAN-04` | `CONDITIONAL`, upload-blocking | Listed third-party SDKs contain required privacy manifests; a listed SDK used as a binary dependency also carries the required signature | Dependency and archive audit against Apple's current list |
| `IOS-MAN-05` | `RECOMMENDED` | Reconcile Xcode's generated privacy report with App Privacy, policy, permissions, SDK behavior, and server data map | Signed release privacy review |
| `IOS-MAN-06` | `VERIFY LIVE` | Recheck Apple's required-reason API list and listed third-party SDK list for every release | Submission-day dependency audit |

Expo and React Native dependencies may use required-reason APIs indirectly. Source-level assumptions are insufficient; inspect the final archive and privacy report.

The manifest audit also verifies collected-data declarations, tracking status, and tracking domains when those keys apply. Hermes and every other SDK present in the final archive are checked against Apple's current listed-SDK requirements.

## 9. Tracking And AppTrackingTransparency

PartyHause 1.0 has a no-tracking product decision.

| ID | Label | Requirement | Required evidence |
|---|---|---|---|
| `IOS-ATT-01` | `MANDATORY` for the chosen no-tracking model | Do not link PartyHause user or device data with another company's data for targeted advertising or ad measurement and do not share it with a data broker | SDK, endpoint, domain, and vendor audit |
| `IOS-ATT-02` | `MANDATORY` | Do not fingerprint devices, regardless of consent | Dependency and network review |
| `IOS-ATT-03` | `RECOMMENDED` for the chosen no-tracking model | Omit an unused ATT prompt and tracking usage string so the binary does not imply tracking behavior that does not occur | Final Info.plist and runtime behavior inspected |
| `IOS-ATT-04` | `CONDITIONAL` | If tracking is later introduced, add `NSUserTrackingUsageDescription`, declare tracking in App Privacy, request ATT authorization before tracking or IDFA access, and honor denial fully | Product, legal, privacy, SDK, metadata, consent, and test review before release |
| `IOS-ATT-05` | `CONDITIONAL` | Never gate features, compensate, mislead, or pressure a person to allow tracking | Consent UX review |

Analytics alone does not always constitute Apple's defined tracking. It still belongs in App Privacy when data is collected and must not silently become cross-company tracking through an SDK.

## 10. Permissions And Device Capabilities

### Permission principles

- Request only at the point where the person invokes the feature.
- A concise pre-permission explanation tied to immediate value is recommended when it improves understanding.
- Denial does not block unrelated app use.
- The Info.plist purpose string must match actual use and the in-app explanation.
- Remove unused purpose strings and entitlements from the release build.
- Never contact an imported person without the inviting user's specific action and visibility into sender and message.

### Capability matrix

| Capability | Label | 1.0 behavior | Requirement and fallback |
|---|---|---|---|
| Notifications | `CONDITIONAL` | Optional-to-the-user event, RSVP, Crew, and reminder alerts | APNs entitlement for remote push, user authorization, secure token registration, category preferences; in-app notifications remain after denial |
| Contacts | `CONDITIONAL` | Explicit selection of individual invitees | Accurate contacts purpose string if direct contact access is used; manual guest add fallback; no automatic bulk import or contact database |
| Camera | `CONDITIONAL` | Event check-in QR scanning only | `NSCameraUsageDescription` names QR check-in; manual guest search fallback |
| Photos | `CONDITIONAL` | Avatar, cover, and invitation artwork selection | Prefer the system photo picker; request broad library permission only if final behavior requires direct library access |
| Photo save | `CONDITIONAL` | Not in 1.0 | Remove add-to-library purpose string unless a real save action ships |
| Microphone | `CONDITIONAL` | Not in 1.0 | Remove microphone purpose string and avoid microphone access |
| Device location | `CONDITIONAL` | Not in 1.0 | Use typed venue and Apple Maps handoff; add location purpose strings only if a later release directly accesses location |
| Calendar | `CONDITIONAL` | Present system event editor or share `.ics` | Request calendar access only if writing directly; cancellation leaves RSVP unchanged |
| Local network | `CONDITIONAL` | Not expected | Do not include local-network purpose text or Bonjour services unless a real feature requires them |

### Current app-config correction

`apps/mobile/app.config.ts` currently declares Contacts, Photo Library, Photo Library Add, Camera, and Microphone usage descriptions. The fixed launch scope includes explicit contact selection and QR camera scanning. It should use the system photo picker where possible, remove add-to-library access, remove Microphone, and make the camera purpose string specific to check-in. Any scope removal requires the directory-wide change process.

## 11. Security And Data Protection

| ID | Label | Requirement | Required evidence |
|---|---|---|---|
| `IOS-SEC-01` | `MANDATORY` | Enforce all event, guest, social, support, moderation, and deletion authorization on the server | Actor-permission integration suite passes |
| `IOS-SEC-02` | `MANDATORY` | Store auth secrets in Keychain-backed secure storage and clear them on sign-out/deletion | Device inspection and lifecycle tests |
| `IOS-SEC-03` | `MANDATORY` | Use HTTPS/TLS for every production request and reject insecure fallback | Network security configuration and proxy inspection |
| `IOS-SEC-04` | `MANDATORY` | Validate and normalize all untrusted input at API boundaries | Schema tests for body, query, path, deep link, upload, and webhook input |
| `IOS-SEC-05` | `MANDATORY` | Authorize uploads, downloads, and deletions; avoid public exposure of private event media | Storage access tests and container policy review |
| `IOS-SEC-06` | `MANDATORY` | Authenticate and rate-limit invitation email sending; never expose an arbitrary public email relay | Abuse test and route authorization evidence |
| `IOS-SEC-07` | `MANDATORY` | Verify webhook signatures in every production environment | Provider configuration and invalid-signature tests |
| `IOS-SEC-08` | `MANDATORY` | Use cryptographically strong, expiring, revocable tokens and transactional invite consumption | Token security and concurrency tests |
| `IOS-SEC-09` | `MANDATORY` | Redact passwords, tokens, reset links, invite secrets, emails, guest needs, and support content from logs and analytics | Log sampling and automated redaction tests |
| `IOS-SEC-10` | `MANDATORY` | Apply bounded rate limits and abuse controls to auth, email, invitations, reports, support, uploads, and AI | Load and abuse-control evidence |
| `IOS-SEC-11` | `MANDATORY` | Validate image type, size, ownership, and content handling | Upload tests and storage lifecycle review |
| `IOS-SEC-12` | `RECOMMENDED` | Maintain dependency scanning, secret scanning, SBOM, incident response, backup restore, and vulnerability remediation | Release security report |

App Review Guideline 1.6 requires appropriate security measures. Current repository findings around the public email endpoint, inconsistent co-host checks, public blob configuration, and missing ownership checks are release blockers, not post-launch cleanup.

## 12. Encryption And Export Compliance

| ID | Label | Requirement | Required evidence |
|---|---|---|---|
| `IOS-EXP-01` | `MANDATORY` | Determine the encryption status of the final app and every linked library | Export-compliance assessment tied to the release archive |
| `IOS-EXP-02` | `MANDATORY` | Answer App Store Connect encryption questions accurately for the build | Completed build compliance record |
| `IOS-EXP-03` | `CONDITIONAL` | Set `ITSAppUsesNonExemptEncryption` to `NO` only if the final app qualifies for that statement | Legal/technical assessment retained |
| `IOS-EXP-04` | `CONDITIONAL` | Supply French encryption declaration, US CCATS, or other documents when the final cryptography and storefronts require them | App Store Connect compliance approval attached to build |
| `IOS-EXP-05` | `VERIFY LIVE` | Complete the live questionnaire and attach any approval code to the selected build | Submission-day record |

HTTPS and authentication libraries still require an export-compliance determination. The presence of common encryption does not justify guessing at the App Store Connect answers.

## 13. Age Rating, Minors, And Regional Age Assurance

| ID | Label | Requirement | Required evidence |
|---|---|---|---|
| `IOS-AGE-01` | `MANDATORY` | Complete the current App Store Connect age-rating questionnaire honestly | Calculated global and regional ratings recorded |
| `IOS-AGE-02` | `MANDATORY`, `VERIFY LIVE` | Answer current social-media capability questions for the feed and UGC features | Submission form reviewed in September 2026 or later |
| `IOS-AGE-03` | `MANDATORY` | Align in-app age eligibility, terms, moderation, content, screenshots, and calculated rating | Product and legal review signed off |
| `IOS-AGE-04` | `CONDITIONAL` | Raise the rating if PartyHause terms set a higher minimum age than Apple's result | Store rating override documented |
| `IOS-AGE-05` | `CONDITIONAL` | Use Declared Age Range plus required parent/guardian consent, significant-change consent, and consent-revocation handling where law and selected storefront require it | Storefront legal assessment and physical-device tests |
| `IOS-AGE-06` | `MANDATORY` | Complete every questionnaire section with an accurate Yes/No or frequency response; PartyHause answers User-Generated Content and Social Media affirmatively and assesses Messaging and Chat against public posting behavior | Feature-to-question audit and saved questionnaire result |
| `IOS-AGE-07` | `RECOMMENDED` | Launch PartyHause as a general audience social/event app with a clear minimum age rather than selecting the Kids Category | Product and legal decision recorded |

The updated Apple system uses 4+, 9+, 13+, 16+, and 18+ ratings on OS version 26 or later. A social-media capability can establish at least a 13+ rating under Apple's current questionnaire behavior. The final rating must come from App Store Connect, not this document.

PartyHause sets a 13-year minimum for 1.0 unless legal review requires a higher age in a storefront. The app does not claim `Social Media Disabled for Users Under 13` unless the Declared Age Range API and age-appropriate UGC delivery are implemented and verified. Apple states that Xcode 26.2 build 17C52 with the iOS/iPadOS 26.2 SDK or later is needed to enable all current age-assurance technologies. This is conditional on using those technologies and is not a replacement for the universal upload minimum.

### Kids Category

PartyHause 1.0 must not select the Kids Category. If the product is ever redesigned specifically for children, Kids Category rules apply across parental gates, third-party analytics, advertising, personal data, and future updates. Only Kids Category apps may use `For Kids` or `For Children` in metadata.

### Regional requirements

Age-assurance and parental-consent obligations can differ by storefront. Apple's regional mechanisms do not replace the developer's legal duties. Legal counsel must assess selected countries, especially where declared-age range or download/purchase consent rules apply. Apple's published 2026 changes identify new-account age-category behavior in Utah from May 6, Louisiana from July 1, and Texas from June 4. The app must also respond to applicable significant-change consent and consent revocation. Apple states that these regional laws do not change App Review itself.

## 14. Accessibility

Accessibility Nutrition Labels are optional as of the research cutoff, but Apple states they will become required over time. Any published claim must be accurate for all common tasks.

| ID | Label | Requirement | Required evidence |
|---|---|---|---|
| `IOS-ACC-01` | `RECOMMENDED`, product launch gate | Common tasks work with VoiceOver | Full 10-case VoiceOver pass on iPhone and iPad |
| `IOS-ACC-02` | `RECOMMENDED`, product launch gate | Common tasks work with Voice Control | Named controls and task pass evidence |
| `IOS-ACC-03` | `RECOMMENDED`, product launch gate | Larger Text and accessibility sizes preserve content and action access | Screenshot and task matrix across text categories |
| `IOS-ACC-04` | `RECOMMENDED`, product launch gate | Color is not the only status indicator and contrast remains sufficient | Automated and manual contrast review |
| `IOS-ACC-05` | `RECOMMENDED`, product launch gate | Reduce Motion removes nonessential motion while preserving continuity | Animation matrix and physical-device tests |
| `IOS-ACC-06` | `MANDATORY` if claimed | App Store accessibility claims match complete task testing | Claim evidence retained for every selected label |
| `IOS-ACC-07` | `VERIFY LIVE` | Confirm whether Accessibility Nutrition Labels remain voluntary | Submission-day App Store Connect review |

PartyBoard canvas, QR, game timers, drag reorder, charts, and custom event cards require special attention because their visual or gesture model can exclude assistive-technology users without a structured alternative.

## 15. Payments, In-App Purchases, And Subscriptions

PartyHause 1.0 is free and contains no purchase, subscription, paid unlock, ticket checkout, or external digital-purchase link. Cost Split records reimbursements but does not move money.

| Future transaction | Label | Apple rule to apply before enabling |
|---|---|---|
| Premium planning tools, extra digital app functionality, digital content, post boosts, or paid social features | `CONDITIONAL` | Use In-App Purchase unless a current storefront-specific exception applies |
| Auto-renewing PartyHause membership | `CONDITIONAL` | Use StoreKit subscription, provide ongoing value for a period of at least seven days, work across all supported device types, provide clear price/period terms, restore access, and provide Apple subscription management |
| Admission to an in-person event | `CONDITIONAL` | Use an appropriate non-IAP payment method because the service is consumed outside the app |
| Virtual event or recording consumed in app | `CONDITIONAL` | Normally use In-App Purchase unless a specific current exception applies |
| Real-time one-to-one service | `CONDITIONAL` | External payment may qualify; one-to-few or one-to-many services generally use IAP |

Before any digital monetization:

- Activate Paid Apps Agreement, tax, and banking.
- Configure complete, visible, functional products in App Store Connect.
- Implement StoreKit and restore for restorable purchases. PartyHause also requires server entitlement validation and App Store Server Notifications as operational controls, although Apple does not universally require those two server components.
- Clearly show subscription name, period, benefits, full renewal price, trial duration, and post-trial price.
- Link Terms and Privacy in app and metadata.
- Reassess account deletion and subscription cancellation wording.
- Verify storefront-specific external-purchase rules instead of implementing one global link policy.

Apple's unified EU business terms take effect October 1, 2026 for developers distributing in the EU. A free app with no digital transactions may owe no transaction commission, but the Account Holder must still review and accept applicable terms. Payment-specific provisions must be reassessed before any EU alternative payment or distribution choice.

## 16. App Store Connect Record And Metadata

### Required app record

| ID | Label | Requirement | Launch value or evidence |
|---|---|---|---|
| `IOS-META-01` | `MANDATORY` | Create the iOS app record before upload | Name, primary language, bundle ID, SKU, and team access recorded |
| `IOS-META-02` | `MANDATORY` | Keep app name within 30 characters | `PartyHause` |
| `IOS-META-03` | `MANDATORY` | Provide an accurate description and keywords within current limits | Copy reviewed against the binary; description up to 4,000 characters and keywords up to 100 bytes at research cutoff |
| `IOS-META-04` | `MANDATORY` | Select an accurate primary category | Proposed: Social Networking; verify against final dominant behavior |
| `IOS-META-05` | `MANDATORY` | Provide a working Privacy Policy URL | Public HTTPS page matches `LEG-03` and the release data map |
| `IOS-META-06` | `MANDATORY` | Provide a working Support URL with an easy contact path | Public HTTPS page includes current contact details |
| `IOS-META-07` | `MANDATORY` | Provide copyright and rights-cleared metadata | Legal owner and year confirmed |
| `IOS-META-08` | `MANDATORY` | Complete App Privacy, age rating, export compliance, content rights, and advertising questions | App Store Connect submission has no missing compliance fields |
| `IOS-META-09` | `MANDATORY` | Select the app price, including an explicit Free selection for 1.0 | Price schedule shows Free in the intended storefronts |
| `IOS-META-10` | `MANDATORY` | Select app availability and countries or regions | Availability matrix reviewed with legal and support coverage |
| `IOS-META-11` | `RECOMMENDED` | Provide a concise subtitle and useful secondary category | Proposed subtitle and secondary category reviewed against the final product |
| `IOS-META-12` | `CONDITIONAL` | Complete tax category, IAP, subscription, and purchase metadata if monetization is added | No paid product exists in 1.0 |
| `IOS-META-13` | `VERIFY LIVE` | Check current field limits, categories, tags, localization, and required properties | Submission-day metadata review |

### Proposed metadata direction

| Field | Draft direction |
|---|---|
| Name | PartyHause |
| Subtitle | Plan, invite, celebrate |
| Primary category | Social Networking |
| Secondary category | Lifestyle |
| Promotional focus | Create an event, bring everyone into the plan, and run the day from one app |
| Keyword themes | event planning, invitations, RSVP, guest list, party games, polls, check-in |

Metadata must not mention ticketing, payment, photo memories, live multiplayer, nearby events, vendor booking, complete offline editing, or any other excluded or unavailable capability.

## 17. Screenshots And App Previews

| ID | Label | Requirement | Required evidence |
|---|---|---|---|
| `IOS-SCR-01` | `MANDATORY` | Supply one to ten screenshots in an accepted JPG, JPEG, or PNG format without alpha for each required device family | Media Manager accepts the required highest-resolution wells; custom lower-size and localized sets are supplied only where needed |
| `IOS-SCR-02` | `MANDATORY` | Show the app in use, not only a splash, title, or login screen | Screenshot storyboard reviewed |
| `IOS-SCR-03` | `MANDATORY` | Use fictional data and own rights to all people, artwork, logos, and content | Asset and release review completed |
| `IOS-SCR-04` | `MANDATORY` | Keep screenshots and previews suitable for a 4+ public product page even if the app rating is higher | Content review completed |
| `IOS-SCR-05` | `MANDATORY` | Supply iPad screenshots while `supportsTablet` remains enabled | Current iPhone and 13-inch iPad wells complete |
| `IOS-SCR-06` | `CONDITIONAL` | App previews use only screen capture of the app itself, with permitted narration or overlays | Up to three previews per supported size and localization if used |
| `IOS-SCR-07` | `VERIFY LIVE` | Use the exact device wells and dimensions displayed by Media Manager | Submission-day asset validation |

At the research cutoff, the 6.9-inch iPhone well accepts portrait dimensions of 1260 by 2736, 1290 by 2796, or 1320 by 2868 pixels, with reversed landscape dimensions. A native iPad app requires a 13-inch screenshot, with accepted portrait dimensions including 2064 by 2752 or 2048 by 2732 pixels and their landscape reversals. Use the live Media Manager as authority because accepted wells change.

### Screenshot story

| Position | Screen | Message |
|---:|---|---|
| 1 | `EVT-01` | Every event and relationship in one place |
| 2 | `EVT-03` plus `EVT-05` | Turn an idea into a structured event |
| 3 | `INV-03` | Invitations that carry the event's character |
| 4 | `RSVP-02` | Simple RSVP with the details a host needs |
| 5 | `BRD-01` plus `POL-03` | Make plans and decisions together |
| 6 | `CHK-01` plus `CHK-03` | Move guests through the door smoothly |
| 7 | `GAM-03` or `GAM-04` | Bring people into the moment |
| 8 | `SOC-01` | Keep the right connections after the event |

Every depicted behavior must work in the submitted build.

## 18. App Review Access And Review Notes

| ID | Label | Requirement | Required evidence |
|---|---|---|---|
| `IOS-REV-01` | `MANDATORY` | Provide current private review contact name, email, and international phone number | App Review Information complete |
| `IOS-REV-02` | `MANDATORY` | Provide a working, verified, non-expiring demo account when login is required | Credentials tested immediately before submission |
| `IOS-REV-03` | `MANDATORY` | Provide all resources needed to review core features | Host and guest accounts, invitation URL, guest QR, seeded event, posts, reports, and notification data |
| `IOS-REV-04` | `MANDATORY` | Explain non-obvious features, permissions, moderation, deep links, offline limits, and no-payment cost ledger | Review Notes are specific and within the current field limit |
| `IOS-REV-05` | `MANDATORY` | Keep the review account and backend live until review ends | Automated review-account check and on-call owner assigned |
| `IOS-REV-06` | `MANDATORY` | Include every material change in What Is New for later releases | Release notes match actual changes |
| `IOS-REV-07` | `CONDITIONAL` | If legal or security rules prohibit a review account, obtain prior Apple approval for a fully featured demo mode | Not expected for PartyHause |

Do not commit review credentials, Apple credentials, invitation secrets, or QR secrets to the repository. Store them in the approved team secret manager and enter them directly in App Store Connect.

### Required Review Notes content

- State that PartyHause 1.0 uses first-party email/password authentication.
- Explain the host, co-host, and guest contextual permission model.
- Give exact steps to open the seeded event, send to a controlled recipient, RSVP, vote, inspect PartyBoard, and check in the sample guest.
- Explain that games are shared-device and local, with no online multiplayer claim.
- Explain that Cost Split is a reimbursement ledger and does not process payment.
- Point to report, block, community standards, support, and account deletion.
- List each requested iOS permission and the reviewer action that triggers it.
- Explain cached read-only content and the limits of offline behavior.
- State whether the build contains analytics, tracking, IAP, ads, external login, or mature content.
- Name any release feature flag and how App Review accesses the feature.

## 19. EU DSA And Regional Distribution

| ID | Label | Requirement | Required evidence |
|---|---|---|---|
| `IOS-EU-01` | `MANDATORY`, `VERIFY LIVE` | Declare trader or non-trader status even if the app is not distributed in the EU | App Store Connect status completed |
| `IOS-EU-02` | `CONDITIONAL` | If a trader distributing in the EU, provide and verify the public contact information Apple displays | Address, phone, email, and required business documents verified |
| `IOS-EU-03` | `CONDITIONAL` | If declared a trader, provide payment account details when Apple requires them, even for a free app, and certify that offered products and services comply with EU law | Payment account and Account Holder certification complete |
| `IOS-EU-04` | `CONDITIONAL` | Confirm region-specific age assurance, tax, content, and consumer-law requirements for selected storefronts | Storefront matrix approved |
| `IOS-EU-05` | `OPTIONAL` | Alternative marketplace and Web Distribution are separate choices and are not needed for App Store launch | Public App Store remains the 1.0 distribution method |
| `IOS-EU-06` | `VERIFY LIVE` | Recheck and accept applicable October 1, 2026 unified EU terms before continuing EU distribution; separately assess transaction and alternative-payment provisions | Account Holder review recorded |

Commercial, ad-supported, paid, and IAP apps often have factors Apple identifies with trader status, but the developer must make the legal determination. Apple cannot determine it on the developer's behalf.

## 20. TestFlight, Submission, And Release

| ID | Label | Requirement | Required evidence |
|---|---|---|---|
| `IOS-REL-01` | `RECOMMENDED`, product launch gate | Complete internal and external TestFlight cycles before public submission | Tester matrix, feedback disposition, and release candidate sign-off |
| `IOS-REL-02` | `CONDITIONAL` | If external TestFlight testing is used, complete beta description, feedback email, review information, and external TestFlight review | TestFlight record complete and external build approved |
| `IOS-REL-03` | `MANDATORY` | Select the correct processed build and complete every required app-version field | App version shows Ready for Review |
| `IOS-REL-04` | `MANDATORY` | Add the app version to a submission and explicitly submit it to App Review | Submission receipt recorded |
| `IOS-REL-05` | `RECOMMENDED` | Use manual release for the first version | Product, support, moderation, and engineering are staffed at release time |
| `IOS-REL-06` | `MANDATORY` | Choose automatic, manual, or scheduled release behavior intentionally | Release option recorded; allow for storefront propagation time |
| `IOS-REL-07` | `RECOMMENDED` | Preserve archive and dSYMs and monitor crashes, hangs, reviews, support, moderation, deletion, and backend health | Dashboards and alerts verified before release |
| `IOS-REL-08` | `RECOMMENDED` | Use phased release for later updates when risk warrants it | Rollout and rollback criteria documented |
| `IOS-REL-09` | `MANDATORY` | Keep the app functional and actively supported after launch | On-call, incident, moderation, support, policy, and dependency-update ownership assigned |

Apple's standard phased release for updates progresses through 1, 2, 5, 10, 20, 50, and 100 percent over seven days and can be paused within Apple's stated limits. It does not prevent users from manually updating.

## 21. Submission-Day Verification

The release owner must record evidence for every item below on the day the build is submitted.

1. Apple Developer membership and all agreements are active.
2. Paid Apps Agreement, tax, and banking are either not applicable or active for every submitted paid product.
3. App price is explicitly Free and the intended countries or regions are selected.
4. The selected build uses the accepted Xcode and SDK, correct bundle ID, version, build number, signing, capabilities, and entitlements.
5. App Store Connect processing reports no privacy-manifest, listed-SDK, required-reason API, binary, signing, or export issue.
6. The current age-rating questionnaire, including social-media questions, is complete and the calculated regional ratings are accepted.
7. App Privacy answers match the final binary, SDKs, observed traffic, server behavior, policy, permissions, and vendors.
8. Encryption answers and any required documentation are attached to the selected build.
9. DSA trader status is declared; trader verification and payment account details are complete when applicable.
10. Required highest-resolution iPhone and iPad screenshot wells are complete with current dimensions; custom localization sets are complete where supplied.
11. App name, subtitle if used, description, keywords, primary category, secondary category if used, support URL, Privacy Policy URL, copyright, and contact data are current.
12. Review contact, credentials, invitation link, sample QR, seeded data, and Review Notes work in a clean installation.
13. All APIs, email delivery, webhooks, storage, deep-link domains, moderation, support, and deletion jobs are live.
14. No excluded, mock-backed, hidden, or remotely unavailable feature appears in the binary or metadata.
15. Accessibility Nutrition Labels remain voluntary or, if completed, every selected claim has current evidence.
16. Upcoming Requirements contains no newer Xcode, SDK, privacy, age, or compliance deadline affecting the build.
17. Selected storefronts introduce no unaddressed age-assurance, consumer, payment, encryption, or business requirement.

## 22. Launch Gate Summary

Submission is blocked if any of these conditions is true:

- Account creation works but permanent account deletion does not.
- UGC is visible but filter, report, block, contact, or moderation operations are absent.
- The server does not authorize every event and social mutation correctly.
- Any visible route is nonfunctional, mock-backed, or materially misleading.
- Publish, invitation delivery, RSVP, check-in, or deletion can report success before durable completion.
- Privacy policy, App Privacy label, manifests, permissions, SDKs, or network behavior disagree.
- The release contains unused sensitive permissions.
- The build does not satisfy the current Xcode and SDK minimum.
- Review credentials or required test artifacts fail from a clean install.
- Required metadata, age rating, export, DSA, agreement, or storefront fields are incomplete.
- The release candidate fails any required acceptance case in document 05 or gate in document 09.
