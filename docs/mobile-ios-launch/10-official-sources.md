# Official Sources And Repository Evidence

## Source Policy

Apple rules are living documents. The sources below were accessed on September 3, 2026. The live page and App Store Connect form control at submission time.

Only official Apple sources are used for Apple requirements in this directory. Repository evidence is used for current PartyHause implementation claims.

## Apple Review, Build, And Submission

| Source | Supports | Date information |
|---|---|---|
| [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) | Safety, UGC, completeness, metadata, login, privacy, payments, design, and legal requirements | Apple page reported last updated June 8, 2026 during research |
| [Upcoming Requirements](https://developer.apple.com/news/upcoming-requirements/) | Current SDK floor, age-rating deadlines, DSA, required-reason APIs | Live rolling page; accessed September 3, 2026 |
| [Xcode 26 SDK requirement](https://developer.apple.com/news/?id=ueeok6yw) | April 28, 2026 Xcode 26 and iOS/iPadOS 26 SDK minimum | Published February 3, 2026 |
| [Xcode support](https://developer.apple.com/support/xcode/) | Production Xcode and SDK compatibility matrix | Live page without a fixed publication date |
| [Software releases](https://developer.apple.com/news/releases/) | Current production and beta Apple tool releases | Rolling release feed |
| [Supporting IPv6 DNS64/NAT64 networks](https://developer.apple.com/support/ipv6/) | IPv6-only network compatibility guidance | Live support page |
| [Add a new app](https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app/) | App Store Connect record fields and agreement prerequisites | Live help page |
| [Upload builds](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/) | Build upload process | Live help page |
| [Submit an app](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-app/) | App Review submission sequence | Live help page |
| [TestFlight](https://developer.apple.com/testflight/) | Internal and external beta testing | Live product page |
| [Provide TestFlight information](https://developer.apple.com/help/app-store-connect/test-a-beta-version/provide-test-information/) | Beta description, feedback email, and review information | Live help page |
| [Invite external testers](https://developer.apple.com/help/app-store-connect/test-a-beta-version/invite-external-testers/) | External testing and TestFlight App Review | Live help page |
| [Release a version update in phases](https://developer.apple.com/help/app-store-connect/update-your-app/release-a-version-update-in-phases/) | Seven-day phased-release percentages and controls | Live help page |
| [App Store Improvements](https://developer.apple.com/support/app-store-improvements/) | Ongoing functionality and stale-app expectations | Live support page |

## Developer Account And Agreements

| Source | Supports | Date information |
|---|---|---|
| [Apple Developer Program enrollment](https://developer.apple.com/programs/enroll/) | Membership, identity, organization, D-U-N-S, and two-factor authentication | Live page |
| [Membership renewal](https://developer.apple.com/help/account/membership/renewal/) | Effects of expired membership | Live help page |
| [Sign and update agreements](https://developer.apple.com/help/app-store-connect/manage-agreements/sign-and-update-agreements/) | Program and paid agreement management | Live help page |
| [Register an App ID](https://developer.apple.com/help/account/identifiers/register-an-app-id/) | Explicit App ID setup | Live help page |
| [Create App Store provisioning profile](https://developer.apple.com/help/account/provisioning-profiles/create-an-app-store-provisioning-profile/) | App Store signing profile | Live help page |

## Accounts And Sign In

| Source | Supports | Date information |
|---|---|---|
| [Offering account deletion in your app](https://developer.apple.com/support/offering-account-deletion-in-your-app/) | In-app initiation, full deletion, UGC, delayed fulfillment, subscriptions, and Sign in with Apple revocation | Requirement effective June 30, 2022; live support page |
| [Sign in with Apple capability](https://developer.apple.com/help/account/capabilities/about-sign-in-with-apple/) | Capability and App ID configuration | Live help page |
| [Private email relay service](https://developer.apple.com/documentation/signinwithapple/communicating-using-the-private-email-relay-service) | Relay email registration and delivery requirements | Live documentation |
| [Sign in with Apple relay domain update](https://developer.apple.com/news/?id=1ptvdtcm) | New `@private.icloud.com` relay domain and continued existing-domain support | Published August 24, 2026 |

## Privacy, Tracking, And SDKs

| Source | Supports | Date information |
|---|---|---|
| [App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/) | Required App Privacy disclosures, data types, linkage, use, tracking, and Privacy Policy URL | Live page |
| [Privacy manifest files](https://developer.apple.com/documentation/bundleresources/privacy-manifest-files) | Privacy manifest structure | Live documentation |
| [Describing required-reason API use](https://developer.apple.com/documentation/bundleresources/describing-use-of-required-reason-api) | Approved reasons and upload requirements | Enforcement in force since May 1, 2024 |
| [Third-party SDK requirements](https://developer.apple.com/support/third-party-SDK-requirements/) | Listed SDK manifests and signatures | Live support page |
| [User privacy and data use](https://developer.apple.com/app-store/user-privacy-and-data-use/) | ATT, tracking definition, consent, fingerprinting, and data use | Live page |
| [Tracking usage description](https://developer.apple.com/documentation/bundleresources/information-property-list/nsusertrackingusagedescription) | Purpose string required when requesting ATT authorization | Live documentation |

## Permissions And Native Capabilities

| Source | Supports | Date information |
|---|---|---|
| [Requesting location authorization](https://developer.apple.com/documentation/corelocation/requesting-authorization-to-use-location-services) | Location request timing and authorization | Live documentation |
| [Camera usage description](https://developer.apple.com/documentation/bundleresources/information-property-list/nscamerausagedescription) | Required camera purpose string | Live documentation |
| [Contacts usage description](https://developer.apple.com/documentation/bundleresources/information-property-list/nscontactsusagedescription) | Required contacts purpose string | Live documentation |
| [Photo Library usage description](https://developer.apple.com/documentation/bundleresources/information-property-list/nsphotolibraryusagedescription) | Photo-library purpose string | Live documentation |
| [Photo Library add usage description](https://developer.apple.com/documentation/bundleresources/information-property-list/nsphotolibraryaddusagedescription) | Add-only photo-library purpose string | Live documentation |
| [Microphone usage description](https://developer.apple.com/documentation/bundleresources/information-property-list/nsmicrophoneusagedescription) | Required microphone purpose string | Live documentation |
| [Selecting photos and videos](https://developer.apple.com/documentation/photokit/selecting-photos-and-videos-in-ios) | System picker approach | Live documentation |
| [Asking permission for notifications](https://developer.apple.com/documentation/usernotifications/asking-permission-to-use-notifications) | Notification authorization | Live documentation |
| [Registering with APNs](https://developer.apple.com/documentation/usernotifications/registering-your-app-with-apns) | Device registration and token handling | Live documentation |
| [Accessing the event store](https://developer.apple.com/documentation/eventkit/accessing-the-event-store) | Calendar authorization behavior | Live documentation |
| [Local network usage description](https://developer.apple.com/documentation/bundleresources/information-property-list/nslocalnetworkusagedescription) | Local-network purpose string | Live documentation |
| [Supporting associated domains](https://developer.apple.com/documentation/xcode/supporting-associated-domains) | Universal Links entitlement | Live documentation |
| [Keychain Services](https://developer.apple.com/documentation/security/keychain-services) | Secure credential storage | Live documentation |

## Age, Children, And Accessibility

| Source | Supports | Date information |
|---|---|---|
| [Set an app age rating](https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating/) | App Store Connect rating process | Live help page |
| [Age-rating values and definitions](https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions/) | Current rating levels, content descriptors, and regional mappings | Live reference page |
| [Social-media age-rating update](https://developer.apple.com/news/?id=tlur8uvi) | September 2026 social-media questionnaire change | Published July 9, 2026 |
| [Time Allowances](https://developer.apple.com/news/?id=0d2gpmml) | Declared Age Range behavior for social-media restrictions | Apple news page |
| [Kids](https://developer.apple.com/kids/) | Kids Category, parental gates, data, analytics, and advertising | Live page |
| [Age assurance](https://developer.apple.com/support/age-assurance/) | Declared Age Range and regional developer responsibilities | Live support page |
| [Regional age requirements](https://developer.apple.com/news/?id=f5zj08ey) | 2026 regional age-assurance changes | Published February 24, 2026 |
| [Texas age-assurance update](https://developer.apple.com/news/?id=sg176nne) | Texas 2026 age and consent behavior | Published June 3, 2026 |
| [Accessibility](https://developer.apple.com/documentation/accessibility) | Apple accessibility APIs and guidance | Live documentation |
| [Accessibility Nutrition Labels](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/overview-of-accessibility-nutrition-labels/) | Current voluntary label and claim scope | Live help page; voluntary at research cutoff |

## Payments And Commerce

| Source | Supports | Date information |
|---|---|---|
| [App Review Guideline 3.1](https://developer.apple.com/app-store/review/guidelines/#in-app-purchase) | In-App Purchase, physical goods/services, person-to-person services, and external links | Guideline page last updated June 8, 2026 during research |
| [In-App Purchase](https://developer.apple.com/in-app-purchase/) | StoreKit and product setup | Live page |
| [Auto-renewable subscriptions](https://developer.apple.com/app-store/subscriptions/) | Subscription value, period, price disclosure, and management | Live page |
| [App Store Server Notifications setup](https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/enter-server-urls-for-app-store-server-notifications/) | Optional server-notification URL configuration | Live help page |
| [Apps in the EU](https://developer.apple.com/support/apps-in-the-eu/) | EU payment, distribution, and business-term options | Live page reflecting announced 2026 changes |
| [EU business-term update](https://developer.apple.com/news/?id=gmws0jgp) | October 1, 2026 changes | Published August 18, 2026 |

## Metadata, Screenshots, And Review Access

| Source | Supports | Date information |
|---|---|---|
| [Required, localizable, and editable properties](https://developer.apple.com/help/app-store-connect/reference/app-information/required-localizable-and-editable-properties/) | Which app and version metadata fields are required | Live reference page |
| [App information](https://developer.apple.com/help/app-store-connect/reference/app-information/app-information/) | App-level name, category, SKU, bundle, and compliance properties | Live reference page |
| [Platform version information](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information/) | Description, keywords, support URL, screenshots, and review information | Live reference page |
| [Set a price](https://developer.apple.com/help/app-store-connect/manage-app-pricing/set-a-price/) | Free or paid app price selection | Live help page |
| [Manage app availability](https://developer.apple.com/help/app-store-connect/manage-your-apps-availability/manage-availability-for-your-app-on-the-app-store/) | Country and region availability | Live help page |
| [Add an app icon](https://developer.apple.com/help/app-store-connect/manage-app-information/add-an-app-icon/) | App Store icon workflow | Live help page |
| [Upload previews and screenshots](https://developer.apple.com/help/app-store-connect/manage-app-information/upload-app-previews-and-screenshots/) | Asset count, file types, upload behavior | Live help page |
| [Screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/) | Current device wells and accepted dimensions | Live reference page |
| [App Review before-you-submit guidance](https://developer.apple.com/app-store/review/guidelines/#before-you-submit) | Demo account, sample QR, backend access, contact, and Review Notes | Guideline page |

## Encryption And EU Compliance

| Source | Supports | Date information |
|---|---|---|
| [Export compliance overview](https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance/) | Encryption assessment and App Store Connect questions | Live help page |
| [Encryption property key](https://developer.apple.com/documentation/bundleresources/information-property-list/itsappusesnonexemptencryption) | `ITSAppUsesNonExemptEncryption` meaning | Live documentation |
| [DSA trader requirements](https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-european-union-digital-services-act-trader-requirements/) | Trader declaration, verification, public contact data, payment account details, and certification | Live help page |

## Release And Monitoring

| Source | Supports | Date information |
|---|---|---|
| [Crash reports and diagnostic logs](https://developer.apple.com/documentation/xcode/acquiring-crash-reports-and-diagnostic-logs) | Symbolicated crash monitoring | Live documentation |
| [App Store Connect reporting tools](https://developer.apple.com/help/app-store-connect/measure-app-performance/overview-of-reporting-tools/) | App Analytics, Sales and Trends, and reporting | Live help page |
| [Select release option](https://developer.apple.com/help/app-store-connect/manage-your-apps-availability/select-an-app-store-version-release-option/) | Automatic, manual, and scheduled release | Live help page |

## Repository Evidence

### Product entry points

- `src/App.tsx`: web route and state destination handling.
- `src/store/usePartyStore.ts`: persisted web page and event state.
- `apps/mobile/app/_layout.tsx`: native root stack.
- `apps/mobile/app/(tabs)/_layout.tsx`: native tab structure.
- `apps/mobile/app.config.ts`: name, bundle ID, supported devices, scheme, and permission descriptions.
- `apps/mobile/eas.json`: build profiles and submit configuration.
- `apps/mobile/package.json`: native dependencies and scripts.

### Identity and authorization

- `server/routes/auth.ts`: signup, verification, resend, login, reset, and logout contracts.
- `server/middleware/auth.ts`: JWT validation and verified-email enforcement.
- `server/lib/event-access.ts`: host, co-host, guest, and public event checks.
- `packages/core/src/resources/auth.ts`: shared mobile auth contract.
- `src/hooks/use-auth.ts`: web auth state transitions.
- `src/lib/msal.ts`: transitional Entra/MSAL client.

### Events and participation

- `server/routes/events.ts`: event list and CRUD behavior.
- `server/routes/guests.ts`: guest CRUD, identity checks, and QR generation.
- `server/routes/invites.ts`: invite-token generation, join, and conversion.
- `server/routes/timeline.ts`: relational timeline API.
- `server/routes/polls.ts`: poll creation, voting, and close behavior.
- `server/routes/cost-split.ts`: host cost-ledger API.
- `server/routes/invite-templates.ts`: saved invitation templates.
- `server/routes/email-logs.ts` and `server/routes/email-webhook.ts`: delivery tracking.
- `server/index.ts`: mounted routes, global middleware order, and email send endpoint.

### Social, support, and safety

- `server/routes/feed.ts`: PartyCrew feed and seen state.
- `server/routes/connections.ts` and `server/routes/partycrew.ts`: relationship APIs.
- `server/routes/users.ts`: profile and suggestion APIs.
- `server/routes/notifications.ts`: in-app notification list and read behavior.
- `prisma/schema.prisma`: identity, events, guests, social, block, posts, notifications, polls, invite, and cost models.

### Mobile implementation

- `apps/mobile/app/events/`: routed creation, draft, event, guest, game, invite, and PartyBoard screens.
- `apps/mobile/app/profile/[id].tsx`: native profile.
- `apps/mobile/components/screens/`: landing, auth, dashboard, feed, event, and guest screen components.
- `apps/mobile/lib/email.ts`: mobile invitation rendering and sending behavior.
- `apps/mobile/lib/mappers.ts`: API-to-mobile model conversion.
- `packages/core/src/`: shared transport, auth, resources, store, and types.

### Existing documents treated as historical evidence

- `docs/mobile/MOBILE_PRODUCTION_DEPLOY.md`.
- `AGENTS.md` for the current Azure migration status and deployment architecture.

Three sources cited by the September 3, 2026 audit were deleted on September 4, 2026:
`docs/WEB_MOBILE_PARITY_ASSESSMENT.md`, `docs/FEATURE_ROADMAP_COMPREHENSIVE.md` and
`docs/project/PARTYHAUSE_ESSENCE_COMPREHENSIVE.md`. All three described Supabase, Netlify or Vercel
as live infrastructure. They were removed along with 94 other documents in the same class, because
a document that states retired infrastructure as fact is worse than no document. They remain in git
history if the original wording is ever needed.

Historical documents contain obsolete infrastructure and readiness statements. Current runtime code, current deployment configuration, verified tests, and current Apple documentation control when they conflict.

## Research Limits

The September 3, 2026 audit did not independently verify:

- Apple Developer membership, agreements, certificates, App IDs, team roles, or App Store Connect record.
- Live DSA trader declaration, tax, banking, export, age-rating, or App Privacy answers.
- Production database schema, migration history, secrets, provider dashboards, or retention jobs.
- Production endpoints, sender-domain authentication, webhooks, push certificates, support queue, or moderation queue.
- Physical-device performance, permissions, accessibility, IPv6, Universal Links, or archive validation.

Those are verification obligations in documents 07 and 09, not assumed facts.
