# PartyHause

**Plan. Party. Perfect.**

[![CI](https://github.com/QuantmindSSI/Partyhause/actions/workflows/ci.yml/badge.svg)](https://github.com/QuantmindSSI/Partyhause/actions/workflows/ci.yml)
[![Deploy](https://github.com/QuantmindSSI/Partyhause/actions/workflows/deploy.yml/badge.svg)](https://github.com/QuantmindSSI/Partyhause/actions/workflows/deploy.yml)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPLv3-blue.svg)](./LICENSE)

Party planning falls apart in the gaps. The guest list lives in one app, the running order in
someone's notes, the "who's actually coming" in a group chat nobody can scroll back through, and
the person who booked the venue is the only one who knows what time the food arrives.

PartyHause closes the gaps. One place to build the event, invite people, see who said yes, agree
on the things that need agreeing on, and run the night without checking four apps.

Live at **[partyhause.com](https://partyhause.com)**.

---

## What it does

**Build the event.** Start from a template built for the occasion, a birthday, a wedding, a
corporate offsite, group travel, or start blank. Add the where, the when, and the details that
matter for that kind of night.

**Invite people properly.** Send designed email invitations that actually arrive, and see what
happened to each one: delivered, opened, clicked, bounced. No more wondering whether the invite
went to spam.

**Know who is coming.** RSVPs land back in one guest list. Share a join link and let people add
themselves without an account. Convert a guest into a full member of the crew when they want in
properly.

**Agree on the details.** Run a poll when the group needs to pick a date, a place, or a playlist.
Everyone votes, everyone sees the result, the decision stops living in a chat thread.

**Run the night.** Build a timeline so everyone knows what happens when. Check guests in at the
door by scanning a QR code.

**Keep the crew together.** PartyCrew is the social side: the people you actually go out with. A
feed of what your crew is planning, requests to join, and profiles that carry across events.

**Install it like an app.** PartyHause is a progressive web app. Add it to your home screen on iOS
or Android and it behaves like a native app, no store required.

---

## Where it is today

Honest status, because a README that oversells is worse than one that undersells.

The web app is live and in use. Events, guests, invitations, RSVPs, polls, timelines, QR check-in,
PartyCrew and the crew feed all work end to end.

A native iOS app is in active development and has not shipped. Cost splitting and the vendor
marketplace have data models and, in the case of cost splitting, a working API, but no interface
yet. They are not available to use.

Full engineering detail, including what is built, what is partial, and what is only planned, lives
in [`AGENTS.md`](./AGENTS.md).

---

## Built on

React and TypeScript on the front, an Express and Prisma API on the back, running on Azure
Container Apps with PostgreSQL, Blob Storage and Web PubSub for live updates.

Developers should start at [`AGENTS.md`](./AGENTS.md), which is the engineering source of truth:
local setup, architecture, the full API surface, environment variables, deployment, and a candid
list of known gaps. [`docs/README.md`](./docs/README.md) indexes the rest of the documentation and
says plainly which parts are current and which describe a stack we no longer run.

---

## Brand

The name is two words fused, the party and the house, and the mark makes it literal: a roof lifted
off a building with confetti escaping through the gap. Raising the roof is what people already say
when a gathering got good.

Identity, colour, type and asset rules are in [`docs/BRAND.md`](./docs/BRAND.md).

---

## License

GPL-3.0. See [LICENSE](./LICENSE).
