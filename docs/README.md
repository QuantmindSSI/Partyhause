# Documentation index

187 markdown files live in this repository. **Most of them are wrong.** This index says which are
which, so nobody has to find out by following instructions that stopped working in July 2026.

Classification date: 2026-09-04. Every file was opened and checked against the code, not against
other documentation.

| Class | Count | Trust it? |
|---|---|---|
| [CURRENT](#current) | 17 | Yes |
| [STALE](#stale) | 79 | **No.** Describes Supabase, Netlify or Vercel as live |
| [HISTORICAL](#historical) | 41 | As history only. Never as instruction |
| [SUPERSEDED](#superseded) | 18 | No. A newer document covers it better |
| [NON-TECHNICAL](#non-technical) | 32 | Not engineering documents |

Start at [`../AGENTS.md`](../AGENTS.md). It is the engineering source of truth and it outranks
every file listed here.

## Why so much of it is wrong

The project moved off Supabase and off Netlify and Vercel onto Azure in July 2026. Roughly 150 of
these documents were written between October and December 2025, before that happened. They were
never revisited. They describe a database, an auth system, a deployment target and a directory
layout that no longer exist.

Two specific traps:

**The 2026-08-30 date is a lie.** 27 files show that git date. It comes from a repo-wide
`PartyHaus` to `PartyHause` string replacement that touched content without reading it. Those files
look nine months fresher than they are. They are marked `[SPELLING-ONLY]` below.

**`docs/features/` is 54 files and almost none of it shipped as written.** Several contain
hand-written `CREATE TABLE` DDL that contradicts `prisma/schema.prisma`, which is the actual
schema. If you take DDL from one of those files you will build the wrong table.

---

## CURRENT

Accurate against the stack as it runs today.

- [`../AGENTS.md`](../AGENTS.md) engineering source of truth. Read first
- [`../README.md`](../README.md) product front door, non-engineering audience
- [`SHARED_API_CLIENT.md`](./SHARED_API_CLIENT.md) `packages/core` design and rationale
- [`LOCAL_DEV_AUTOSYNC.md`](./LOCAL_DEV_AUTOSYNC.md) lockfile and schema drift reminders
- [`WEBMCP_MONITORING.md`](./WEBMCP_MONITORING.md) browser Model Context monitoring tools
- [`BRAND.md`](./BRAND.md) identity, colour, type, assets. Corrective, not merely descriptive
- `mobile-ios-launch/` all 11 files. The iOS launch specification

`mobile-ios-launch/08-current-state-gap-register.md` is the single most useful document in this
directory: 93 gaps, 68 marked BLOCKER, every one carrying file:line evidence.

---

## STALE

**Do not follow any instruction in these files.** Each one now carries a banner at the top saying
so. Listed by directory.

Root and `docs/`:
`INVITATION_VISUAL_GUIDE.md`, `INVITATION_WORKFLOW_GUIDE.md`, `AI_EVENT_PLANNING_ASSISTANT.md`
`[SPELLING-ONLY]`, `CLEANUP_READY.md`, `CURRENT_FEATURES_EXTENSION_GUIDE.md` `[SPELLING-ONLY]`,
`DEPLOYMENT_ALTERNATIVES.md`, `DEPLOYMENT_STATUS.md`, `DNS_RECORDS_TO_ADD.md`,
`DOMAIN_CONFIGURATION_FIX.md` `[SPELLING-ONLY]`, `DOMAIN_FIX_GUIDE.md` `[SPELLING-ONLY]`,
`EMAIL_SETUP_GUIDE.md`, `ENDPOINT_STATUS.md`, `FEATURE_ROADMAP_COMPREHENSIVE.md`
`[SPELLING-ONLY]`, `GUEST_CREW_IMPLEMENTATION.md`, `GUEST_EXPERIENCE_FLOW.md`,
`GUEST_EXPERIENCE_VISUAL.md`, `IMPLEMENTATION_PLAN.md` `[SPELLING-ONLY]`,
`MASTER_ROADMAP_INDEX.md` `[SPELLING-ONLY]`, `PARTYHAUSE_FEATURES_ROADMAP.md`,
`PARTYHUB_REFACTORING.md`, `PRODUCTION_CHECKLIST.md` `[SPELLING-ONLY]`,
`PROFILE_NOT_FOUND_FIX.md`, `PWA_IMPLEMENTATION_SUMMARY.md` `[SPELLING-ONLY]`,
`PWA_PRODUCTION_DEPLOYMENT_GUIDE.md` `[SPELLING-ONLY]`, `PWA_TESTING_GUIDE.md`,
`QUICK_START_GUIDE.md`, `REACT_NATIVE_PWA_DEPLOYMENT.md`, `SOCIAL_MEDIA_INTEGRATION.md`
`[SPELLING-ONLY]`, `SUPABASE_CLI_SETUP.md`, `SUPABASE_SMTP_SETUP.md` `[SPELLING-ONLY]`,
`TESTING_GUIDE_NATIVE_VS_WEB.md` `[SPELLING-ONLY]`, `TESTING_IN_EXPO_GO.md`,
`UNIFIED_POLL_UX_DESIGN.md`, `USER_CLEANUP_GUIDE.md`, `UTILITY_FEATURES.md` `[SPELLING-ONLY]`,
`VENDOR_MARKETPLACE.md` `[SPELLING-ONLY]`, `WEB_PARTYCREW_COMPLETE.md`, `ZOHO_MAIL_MIGRATION.md`

`docs/architecture/`: `BACKEND_ARCHITECTURE.md`, `MICROSERVICES_ARCHITECTURE.md`,
`PARTYCREW_ARCHITECTURE.md`. All three describe Vercel Functions plus Supabase.

`docs/features/`: `COLLABORATION_IMPLEMENTATION_PROGRESS.md`, `COLLABORATION_QUICK_REFERENCE.md`,
`COLLABORATION_REDUNDANCY_ANALYSIS.md`, `COLLABORATION_TESTING_GUIDE.md`,
`COLLABORATION_UI_IMPROVEMENTS.md`, `collaborativefeatures.md`, `CARD_UI_TESTING_GUIDE.md`,
`CREW_VS_GUESTS_GUIDE.md`, `EVENT_PLANNING_BLOCKS_FEATURE.md`, `EXPLORE_PARTYCREW_FEED_PLAN.md`,
`GUEST_INVITE_STATUS.md`, `GUEST_MANAGEMENT_QUICK_START.md`, `HOST_GUEST_MANAGEMENT.md`,
`MIND_MAP_COLLABORATION_SYSTEM.md`, `MIND_MAP_PLANNING_SYSTEM.md`,
`PARTYBOARD_HYBRID_IMPLEMENTATION.md`, `PARTYCREW_API_COMPLETE.md`,
`PARTYCREW_IMPLEMENTATION_SUMMARY.md`, `REAL_TIME_COLLABORATION_ENGINE.md`,
`SOCIAL_NETWORK_PLAN.md`, `templateimplementation.md`, `TEMPLATES_INTEGRATION_PLAN.md`,
`TIMELINE_VS_GAMES_CLARIFICATION.md`, `INVITATION_SYSTEM_REVIEW.md`

`docs/mobile/`: `MOBILE_API_CONFIG.md`, `MOBILE_DEBUGGING_GUIDE.md`,
`MOBILE_EVENT_PUBLISHING_READY.md`, `MOBILE_EMAIL_READY.md`, `MOBILE_IMPLEMENTATION_SUMMARY.md`,
`MOBILE_INVITE_IMPLEMENTATION.md`, `MOBILE_TESTING_GUIDE.md`

Elsewhere: `docs/project/PACKAGE_VERSIONS.md`, `docs/project/PARTYHAUSE_ESSENCE_COMPREHENSIVE.md`,
`docs/deployment/PRODUCTION_DEPLOYMENT.md`, `docs/testing/EMAIL_TROUBLESHOOTING.md`,
`docs/testing/TESTING_INVITATION_FEATURE.md`, `apps/mobile/README.md`,
`server/data/templates/README.md`

The last two matter more than the rest, because they sit inside live source trees where somebody is
likely to trust them.

---

## HISTORICAL

Dated records of things that happened. Correct as history. **Never follow them as instructions.**
They are not rewritten, because rewriting a record falsifies it.

`docs/`: `BLOATWARE.md`, `EMAIL_CONFIRMATION_TEST_RESULTS.md`, `ERROR_FIXES_NOV_1.md`,
`EVENT_LOADING_FIX_NOV_1.md`, `IDEAS_FEATURE_PORT_COMPLETE.md`, `PARTYBOARD_FEATURE_PORT.md`,
`POLLS_FEATURE_PORT_COMPLETE.md`, `PUSH_VERIFICATION_AND_FEATURES_STATUS.md`,
`SECURITY_REVIEW_AUG_2026.md`, `TYPESCRIPT_FIXES_SUMMARY.md`, `UI_REFACTORING_SUMMARY.md`,
`UI_STRUCTURE_AUDIT_WEB_AUG_2026.md`, `UI_UX_AUDIT_SUMMARY.md`

`docs/features/`: the `PARTYBOARD_*` and `PARTYCREW_PHASE*` completion records,
`BIRTHDAY_DETAILS_IMPLEMENTATION.md`, `CARD_UI_READY.md`, `DASHBOARD_UI_REDESIGN.md`,
`EVENT_PUBLISHING_FIX.md`, `GUEST_MANAGEMENT_INTEGRATION_COMPLETE.md`,
`LOCAL_VIDEO_IMPLEMENTATION.md`, `TEMPLATES_IMPLEMENTATION_STATUS.md`

`docs/mobile/`: `EXPO_EMAIL_FIX.md`, `MOBILE_3D_ENHANCEMENTS.md`,
`MOBILE_CREATE_EVENT_COMPLETE.md`, `MOBILE_INVITE_TEST_RESULTS.md`,
`MOBILE_INVITE_VERIFICATION.md`, `MOBILE_LANDING_ENHANCED.md`, `MOBILE_PRODUCTION_DEPLOY.md`,
`MOBILE_PUSH_SUMMARY.md`, `MOBILE_WIZARD_COMPLETE.md`

`docs/project/PHASE1_PROGRESS.md`, `docs/testing/JSON_PARSE_ERROR_DEBUG.md`,
`docs/testing/mailltest.md` (empty, 0 bytes)

Two of these claim "100% feature parity" and "production ready" about a stack that has since been
replaced. Read the date before the body.

---

## SUPERSEDED

A newer document covers the topic properly.

| File | Superseded by |
|---|---|
| `WEB_MOBILE_PARITY_ASSESSMENT.md` | `mobile-ios-launch/08-current-state-gap-register.md` |
| `WEB_FEATURE_PARITY_PLAN.md` | `mobile-ios-launch/06-coverage-matrix.md` |
| `../GUEST_INTERFACE_PLAN.md` | `mobile-ios-launch/04-user-flow-catalog.md` |
| `REPOSITORY_ORGANIZATION.md` | `../AGENTS.md` |
| `supabase-setup.md` | `../AGENTS.md` |
| `PARTYCREW_QUICK_REFERENCE.md` | `features/PARTYCREW_API_COMPLETE.md` |
| `UI_REFACTORING_QUICK_START.md` | `UI_REFACTORING_SUMMARY.md` |
| `WEB_PWA_UPGRADE_PLAN.md` | `PWA_IMPLEMENTATION_SUMMARY.md` |
| `project/bloatware.md` | `BLOATWARE.md` |
| `features/FEATURE_TRACKER.md` | `mobile-ios-launch/06-coverage-matrix.md` |
| `features/SOCIAL_NETWORK_FEATURE_PLAN.md` | `features/SOCIAL_NETWORK_PLAN.md` |
| `features/NETWORK_FEATURE_SUMMARY.md` | `features/PARTYCREW_IMPLEMENTATION_SUMMARY.md` |
| `features/PARTYBOARD_VS_IDEAS_COMPARISON.md` | `features/PARTYBOARD_HYBRID_IMPLEMENTATION.md` |
| `features/TEMPLATE_FORMS_PLAN.md` | `features/TEMPLATES_INTEGRATION_PLAN.md` |
| `mobile/EXPO_GO_FIX.md` | `mobile/EXPO_EMAIL_FIX.md` |
| `mobile/EXPO_GO_TESTING.md` | `mobile-ios-launch/09-release-validation-plan.md` |
| `mobile/KIDS_BIRTHDAY_FORM_TESTING.md` | `mobile-ios-launch/09-release-validation-plan.md` |
| `mobile/MOBILE_EMAIL_STATUS.md` | `mobile/MOBILE_EMAIL_READY.md` |

Several superseding documents are themselves STALE. Where that is the case, go to the code.

---

## NON-TECHNICAL

Marketing, competitive analysis, go-to-market, brand, ICPs, storyboards, UI concept work. Not
checked for engineering accuracy and not intended to be.

`docs/`: `COMPETITIVE_ANALYSIS_LUMA.md`, `COMPETITIVE_LANDSCAPE_FULL_ANALYSIS.md`,
`COMPETITIVE_MOAT_ANALYSIS.md`, `EMAIL_CONFIGURATION_SUMMARY.md`, `EMAIL_SIGNATURES.md`,
`EMAIL_TEMPLATES.md`, `GMAIL_FILTERS_SETUP.md`, `UI_UX_DESIGN_GUIDE.md`

`docs/marketing/` all 4. `docs/project/` the competitive, GTM, ICP and use-case set.
`docs/features/` the screen, journey and UI-option documents.

Note that some of these still assert stale technical facts in passing, for example
`COMPETITIVE_MOAT_ANALYSIS.md` claiming Supabase realtime as a differentiator. Do not cite a
marketing document for a technical claim.

---

## If you are adding a document

Put engineering facts in `AGENTS.md`, not in a new file. The reason there are 187 of these is that
every change added a document instead of editing one.

If you must add one, date it, state what you verified it against, and add it here. If you find a
document that contradicts the code, fix it or mark it stale **in the same change**. That rule is
the only thing that stops this recurring.
