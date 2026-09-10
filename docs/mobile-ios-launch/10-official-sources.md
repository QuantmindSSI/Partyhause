# IOS-MVP-1 Official Sources And Repository Evidence

## Source Policy

Apple rules are living documents. These official sources were accessed on September 3, 2026. The
live source and App Store Connect form control at submission time. Repository evidence is evaluated
at commit `2cbf6a6` for document 08.

## Apple Review, Build, And Release

| Source | Supports |
|---|---|
| [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) | Safety, completeness, metadata, accounts, privacy, payments, design, and legal review |
| [Upcoming Requirements](https://developer.apple.com/news/upcoming-requirements/) | Current SDK, privacy, age-rating, and regional deadlines |
| [Xcode 26 SDK requirement](https://developer.apple.com/news/?id=ueeok6yw) | April 28, 2026 upload floor |
| [Xcode support](https://developer.apple.com/support/xcode/) | Accepted Xcode and SDK compatibility |
| [Software releases](https://developer.apple.com/news/releases/) | Current production and beta tool releases |
| [Supporting IPv6 DNS64/NAT64 networks](https://developer.apple.com/support/ipv6/) | IPv6-only compatibility |
| [Upload builds](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/) | Build upload |
| [Submit an app](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-app/) | Submission sequence |
| [TestFlight](https://developer.apple.com/testflight/) | Internal and external beta testing |
| [Release option](https://developer.apple.com/help/app-store-connect/manage-your-apps-availability/select-an-app-store-version-release-option/) | Automatic, manual, and scheduled release |
| [App Store Improvements](https://developer.apple.com/support/app-store-improvements/) | Ongoing functionality and support expectations |

## Developer Account And Signing

| Source | Supports |
|---|---|
| [Apple Developer Program enrollment](https://developer.apple.com/programs/enroll/) | Membership, identity, organization, D-U-N-S, and two-factor authentication |
| [Membership renewal](https://developer.apple.com/help/account/membership/renewal/) | Expiration effects |
| [Sign and update agreements](https://developer.apple.com/help/app-store-connect/manage-agreements/sign-and-update-agreements/) | Agreement management |
| [Register an App ID](https://developer.apple.com/help/account/identifiers/register-an-app-id/) | Explicit App ID |
| [Create an App Store provisioning profile](https://developer.apple.com/help/account/provisioning-profiles/create-an-app-store-provisioning-profile/) | Distribution signing |
| [Add a new app](https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app/) | App record fields and prerequisites |

## Accounts, Privacy, And Security

| Source | Supports |
|---|---|
| [Offering account deletion in your app](https://developer.apple.com/support/offering-account-deletion-in-your-app/) | In-app initiation, permanent deletion, associated data, and delayed fulfillment |
| [App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/) | Data categories, linkage, use, tracking, and policy URL |
| [Privacy manifest files](https://developer.apple.com/documentation/bundleresources/privacy-manifest-files) | Manifest structure |
| [Describing required-reason API use](https://developer.apple.com/documentation/bundleresources/describing-use-of-required-reason-api) | Approved reasons and enforcement |
| [Third-party SDK requirements](https://developer.apple.com/support/third-party-SDK-requirements/) | Listed SDK manifests and signatures |
| [User privacy and data use](https://developer.apple.com/app-store/user-privacy-and-data-use/) | Consent, tracking, ATT, and fingerprinting |
| [Keychain Services](https://developer.apple.com/documentation/security/keychain-services) | Secure credential storage |

## Age And Accessibility

| Source | Supports |
|---|---|
| [Set an app age rating](https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating/) | Rating workflow |
| [Age-rating values and definitions](https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions/) | Current questions and regional mappings |
| [Age assurance](https://developer.apple.com/support/age-assurance/) | Regional developer responsibilities |
| [Accessibility](https://developer.apple.com/documentation/accessibility) | Platform accessibility APIs and guidance |
| [Accessibility Nutrition Labels](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/overview-of-accessibility-nutrition-labels/) | Label availability and evidence scope |

## Metadata, Screenshots, Review, Export, And DSA

| Source | Supports |
|---|---|
| [Required properties](https://developer.apple.com/help/app-store-connect/reference/app-information/required-localizable-and-editable-properties/) | Required app and version metadata |
| [App information](https://developer.apple.com/help/app-store-connect/reference/app-information/app-information/) | Name, category, SKU, bundle, and compliance fields |
| [Platform version information](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information/) | Description, keywords, URLs, screenshots, and review information |
| [Set a price](https://developer.apple.com/help/app-store-connect/manage-app-pricing/set-a-price/) | Explicit Free price |
| [Manage availability](https://developer.apple.com/help/app-store-connect/manage-your-apps-availability/manage-availability-for-your-app-on-the-app-store/) | Country and region selection |
| [Add an app icon](https://developer.apple.com/help/app-store-connect/manage-app-information/add-an-app-icon/) | App Store icon |
| [Upload previews and screenshots](https://developer.apple.com/help/app-store-connect/manage-app-information/upload-app-previews-and-screenshots/) | Media upload and count |
| [Screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/) | Current iPhone dimensions |
| [Before you submit](https://developer.apple.com/app-store/review/guidelines/#before-you-submit) | Review contact, account, resources, and notes |
| [Export compliance overview](https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance/) | Encryption assessment and questions |
| [Encryption property key](https://developer.apple.com/documentation/bundleresources/information-property-list/itsappusesnonexemptencryption) | `ITSAppUsesNonExemptEncryption` meaning |
| [DSA trader requirements](https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-european-union-digital-services-act-trader-requirements/) | Trader declaration and verification |

## Repository Evidence At `2cbf6a6`

### Native entry and configuration

- `apps/mobile/app.config.ts`: device family, bundle identifier, scheme, description, and usage
  strings.
- `apps/mobile/eas.json`: build profiles, remote version source, and submit configuration at the
  audit baseline.
- `apps/mobile/app/_layout.tsx`: root stack.
- `apps/mobile/app/(tabs)/_layout.tsx`: reachable tabs, including PartyCrew at the baseline.
- `apps/mobile/app/(tabs)/index.tsx`: launch, auth, and dashboard state machine.
- `apps/mobile/app/events/`: event, draft, guest, activity, and invitation routes.

### Account and authorization

- `server/routes/auth.ts`: signup, verification, resend, login, current user, recovery, and logout.
- `server/middleware/auth.ts`: JWT handling and verified-email gate.
- `server/lib/jwt-secret.ts`: production secret checks.
- `packages/core/src/resources/auth.ts`: mobile auth request shapes and persistence.
- `apps/mobile/lib/client.ts`: AsyncStorage-backed mobile client at the baseline.
- `src/lib/auth.ts`, `src/pages/VerifyEmailPage.tsx`, and `src/pages/ResetPasswordPage.tsx`: browser
  account flows.

### Events, guests, invitations, and attendance

- `server/routes/events.ts`: event list and CRUD behavior.
- `server/lib/event-access.ts`: event relationship and permission rules.
- `server/lib/event-dto.ts`: event response allow-list and capabilities.
- `server/routes/guests.ts`: guest CRUD and generic check-in update.
- `server/routes/invites.ts`: current shared token generation and join behavior.
- `server/index.ts`: authenticated, limited, event-scoped email send boundary.
- `server/routes/email-logs.ts` and `server/routes/email-webhook.ts`: delivery records and webhook
  handling.
- `apps/mobile/app/events/create/review.tsx`: local drafts, create, and forced publish request.
- `apps/mobile/app/events/[id]/guests.tsx`: routed list and check-in UI.
- `apps/mobile/app/events/[id]/invites/`: current design and fixed-recipient invitation UI.
- `apps/mobile/lib/email.ts`: current invitation rendering and URL construction.
- `src/components/JoinEventPage.tsx`: current browser token route.

### Data and operations

- `prisma/schema.prisma`: account, event, guest, token, delivery, and retained excluded models.
- `prisma.config.ts`: configured but absent migration directory.
- `prisma/seed.ts`: current seed scope.
- `infra/`: production infrastructure and deployment configuration.
- `public/privacy.html`, `public/terms.html`, and `public/support.html`: public legal and support copy.

### Evidence for corrected stale claims

- `src/test/send-email-scoping.test.ts`: 13 authorization, recipient, sanitization, and cap tests.
- `apps/mobile/app/(tabs)/partycrew.tsx`: PartyCrew is reachable at the baseline.
- `apps/mobile/components/forms/templates/BlockPartyForm.tsx`, `ClassReunionForm.tsx`,
  `CorporateForm.tsx`, `FundraiserForm.tsx`, `HackathonForm.tsx`, and `TravelForm.tsx`: former stub
  forms contain real fields and validation at the baseline.
- `docs/README.md`: current, historical, and non-technical document classification.

## Research Limits

The static audit did not verify:

- Apple membership, agreements, App ID, certificates, team roles, or App Store record.
- Live DSA, tax, banking, export, age-rating, App Privacy, price, or region selections.
- Production schema version, secrets, provider dashboards, sender authentication, retention jobs, or
  backup expiry.
- Production endpoint behavior, browser caching, support response, or deletion completion.
- Physical-device performance, Keychain, accessibility, IPv6, archive privacy report, signing, or
  App Store processing.

Documents 07 and 09 require direct evidence for those items. They are not assumed from source code.
