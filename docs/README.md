# Documentation index

90 markdown files. Every one of them is either accurate today, an accurate record of the past, or
non-engineering material. Nothing here tells you to run a command that stopped working in July 2026.

That was not true yesterday. Before the 2026-09-04 cleanup, the repository held 187 markdown files,
including 185 under `docs/`. Of those, 97 described Supabase, Netlify or Vercel as live
infrastructure or had been superseded outright. Those 97 were deleted. What follows is what
survived and why.

Start at [`../AGENTS.md`](../AGENTS.md) for implementation facts. The approved IOS-MVP-1 product
scope and release requirements are controlled by [`mobile-ios-launch/`](./mobile-ios-launch/).

| Class | Count | How to read it |
|---|---|---|
| [Current](#current) | 17 | Accurate. Use it |
| [Historical](#historical) | 41 | Accurate **as a record of its date**. Never as instruction |
| [Non-technical](#non-technical) | 32 | Marketing, brand, GTM. Not engineering material |
| Deleted | 97 | Gone. In git history if ever needed |

---

## Current

- [`../AGENTS.md`](../AGENTS.md) engineering source of truth. Stack, setup, the full 77-route API
  surface, auth model, infrastructure, deployment, known gaps
- [`../README.md`](../README.md) product front door. Non-engineering audience
- [`SHARED_API_CLIENT.md`](./SHARED_API_CLIENT.md) `packages/core` design and rationale
- [`LOCAL_DEV_AUTOSYNC.md`](./LOCAL_DEV_AUTOSYNC.md) lockfile and schema drift reminders
- [`WEBMCP_MONITORING.md`](./WEBMCP_MONITORING.md) browser Model Context monitoring tools
- [`BRAND.md`](./BRAND.md) identity, colour, type, assets. Corrective rather than descriptive
- [`mobile-ios-launch/`](./mobile-ios-launch/) all 11 files. The approved IOS-MVP-1 scope and launch
  specification: iPhone host app, private one-host events, 50 guests, and browser RSVP

`mobile-ios-launch/08-current-state-gap-register.md` is the implementation snapshot at `2cbf6a6`:
93 legacy gap IDs, with 39 `OPEN_BLOCKER`, 2 `OPEN_HIGH`, 6 `RESOLVED_AT_2CBF6A6`, and 46
`REMOVED_FROM_IOS_MVP`. Removed scope is not counted as resolved.

---

## Historical

Dated records of work that happened. They are accurate about their own date and nothing else.

**These are deliberately not edited.** Several describe Supabase, Netlify or MailerSend, because
that is what the project ran at the time. Rewriting a record to match today falsifies it. They were
kept, rather than deleted with the stale set, because they answer "why is this like this", which
the code cannot.

Read the date in the header before the body. If one contradicts `AGENTS.md`, `AGENTS.md` wins.

`docs/`: `BLOATWARE.md`, `EMAIL_CONFIRMATION_TEST_RESULTS.md`, `ERROR_FIXES_NOV_1.md`,
`EVENT_LOADING_FIX_NOV_1.md`, `IDEAS_FEATURE_PORT_COMPLETE.md`, `PARTYBOARD_FEATURE_PORT.md`,
`POLLS_FEATURE_PORT_COMPLETE.md`, `PUSH_VERIFICATION_AND_FEATURES_STATUS.md`,
`SECURITY_REVIEW_AUG_2026.md`, `TYPESCRIPT_FIXES_SUMMARY.md`, `UI_REFACTORING_SUMMARY.md`,
`UI_STRUCTURE_AUDIT_WEB_AUG_2026.md`, `UI_UX_AUDIT_SUMMARY.md`

`docs/features/`: `BIRTHDAY_DETAILS_IMPLEMENTATION.md`, `CARD_UI_READY.md`,
`DASHBOARD_UI_REDESIGN.md`, `EVENT_PUBLISHING_FIX.md`,
`GUEST_MANAGEMENT_INTEGRATION_COMPLETE.md`, `LOCAL_VIDEO_IMPLEMENTATION.md`,
`PARTYBOARD_PHASE_2_COMPLETE.md`, `PARTYBOARD_PHASE_2_TEST_GUIDE.md`,
`PARTYBOARD_STICKY_DRAG_FIX.md`, `PARTYBOARD_STICKY_POSITION_STABILITY.md`,
`PARTYBOARD_STICKY_SUMMARY.md`, `PARTYBOARD_TEST_CATEGORIES_1-3_VERIFICATION.md`,
`PARTYCREW_PHASE1_COMPLETE.md`, `PARTYCREW_PHASE2_SUMMARY.md`, `PARTYCREW_UI_COMPLETE.md`,
`TEMPLATES_IMPLEMENTATION_STATUS.md`

`docs/mobile/`: `EXPO_EMAIL_FIX.md`, `MOBILE_3D_ENHANCEMENTS.md`,
`MOBILE_CREATE_EVENT_COMPLETE.md`, `MOBILE_INVITE_TEST_RESULTS.md`,
`MOBILE_INVITE_VERIFICATION.md`, `MOBILE_LANDING_ENHANCED.md`, `MOBILE_PRODUCTION_DEPLOY.md`,
`MOBILE_PUSH_SUMMARY.md`, `MOBILE_WIZARD_COMPLETE.md`

`docs/project/PHASE1_PROGRESS.md`, `docs/testing/JSON_PARSE_ERROR_DEBUG.md`,
`docs/testing/mailltest.md` (empty, 0 bytes, safe to delete)

Some of these carry a git date of 2026-08-30 that means nothing. That commit was a repo-wide
`PartyHaus` to `PartyHause` spelling replacement which rewrote text without reading it. Trust the
date written inside the document, not the one git reports.

---

## Non-technical

Marketing, competitive analysis, go-to-market, brand, ICPs, storyboards, UI concept work. Not
checked for engineering accuracy and not intended to be.

`docs/`: `COMPETITIVE_ANALYSIS_LUMA.md`, `COMPETITIVE_LANDSCAPE_FULL_ANALYSIS.md`,
`COMPETITIVE_MOAT_ANALYSIS.md`, `EMAIL_CONFIGURATION_SUMMARY.md`, `EMAIL_SIGNATURES.md`,
`EMAIL_TEMPLATES.md`, `GMAIL_FILTERS_SETUP.md`, `UI_UX_DESIGN_GUIDE.md`

`docs/marketing/` all 4 files. `docs/project/` the competitive, GTM, ICP and use-case set.
`docs/features/` the screen, journey and UI-option documents, which describe interaction design
rather than infrastructure.

**Do not cite a marketing document for a technical claim.** Several still assert stale facts in
passing. `COMPETITIVE_MOAT_ANALYSIS.md` claims Supabase realtime as a differentiator; realtime is
Azure Web PubSub over a native WebSocket. These were left because correcting positioning copy is a
marketing decision, not an engineering one.

---

## What was deleted, and why

97 files, on 2026-09-04, in one commit. Recoverable from git history.

79 were **stale**: they presented Supabase, Netlify or Vercel as live, or referenced `api/` and
`netlify/` directories that no longer exist. Several carried hand-written `CREATE TABLE` DDL that
contradicted `prisma/schema.prisma`, so following them would have built the wrong table.

18 were **superseded**: a newer document already covered the topic, in several cases better and
against the correct stack.

The deletion was preferred to a rewrite. Producing 97 replacement documents that could not be
grounded in the code would have manufactured a larger version of the same problem: text that reads
as authoritative and is not. Anything genuinely worth keeping was already restated in `AGENTS.md`
from the source.

---

## If you are adding a document

Put engineering facts in `AGENTS.md`, not in a new file. The reason there were 188 of these is that
every change added a document instead of editing one.

If you must add one, date it, state what you verified it against, and add it here. If you find a
document that contradicts the code, fix it or delete it **in the same change**. That rule is the
only thing that stops this recurring.
