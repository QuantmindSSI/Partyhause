+# PartyHause — Core Templates (Top 10)

Version: 1.0
Date: October 22, 2025

This document identifies the top 10 core event templates to build first for the mobile app and explains, for each template, the planning (pre-event), in-app engagement (during event), and post-event (memory & retention) features, plus phases, data contracts, success metrics, edge cases, and common integrations.

Guiding principles
- Mobile-first flows: short, well-scaffolded wizards for planning; single-tap engagement for guests; low-friction media uploads for memories.
- Reusable building blocks: RSVP & ticketing, timeline/agenda, polls & games, galleries, vendor/workspace cards, analytics exports.
- Retention loop: capture and surface moments during and after the event to pull users back into the app (albums, highlight reels, personalized follow-ups).

Top 10 templates (summary)
1. Social Birthday (Adult & Kids variants)
2. Wedding — Intimate & Full
3. Product Launch / Small Business Demo
4. Fundraiser / Charity Gala
5. Music Festival / Multi-stage Event
6. Conference / Hybrid Meetup
7. Group Travel / Multi-day Trip
8. Community Block Party / Neighborhood Event
9. Class & Workshop (Cooking, Dance, Fitness)
10. Hackathon / Competitive Tournament

---

## 1) Social Birthday (Adult & Kids variants)
Overview
- One-off social events with RSVP/ticketing, scheduled activities, and high media-sharing volume. Kids variant includes parental controls and allergy/diet fields.

Planning (pre-event)
- Quick-start wizard: Title, date/time, venue, public/private, guest import (contacts/csv), template variant (adult/kids).
- RSVP settings: capacity limits, plus-ones, ticket types (free/paid), dietary/allergy fields, kid-specific permissions (parent approval for uploads).
- Timeline builder: add blocks (arrival, cake, games, toast) with push reminders and host cues.
- Roles & tasks: assign co-hosts and volunteers, set photo/playlist owners.

In-app engagement (during event)
- One-tap check-in / QR code ticket scanning for entry.
- Live activity modules: photo scavenger hunts, song voting (poll), quick trivia, and leaderboard integration.
- Social wall: curated live feed (host-moderated) that highlights photos, videos, and short text moments; optionally sync to host display (presenter mode).
- Push micro-notifications for activity start ("Cake cutting in 5 minutes"), plus ephemeral overlays for winners of mini-games.

Post-event (memories & retention)
- Auto-collect gallery with smart deduping and basic auto-tagging (by time/host tags).
- Automated highlight reel (30–90s) with selectable style templates sent via push/email within 24–48 hours.
- Printable collages and thank-you email templates with album links and crediting (who took which photo).
- Monetization hooks: photo prints, extra editing, premium highlight themes.

Phases (user flow)
1. Create event (wizard) — 3–5 screens.
2. Invite & confirm — import contacts, send invites, RSVPs fill.
3. Run event — live modules, host controls.
4. Post-event — gallery processing, share & monetize.

Data contract (minimal)
- Inputs: event{title, start/end, venue{geo, address}, hostId}, guestList[{name,email,phone,role}], tickets[{type,price,qty}], timeline[{blockId,label,start,duration}], permissions{mediaShare,moderation}.
- Outputs: rsvps[{guestId,status,ticketId}], media[{id,uploaderId,type,url,tags,timestamp}], analytics{rsvpRate,engagementRate,topPhotos}.

Success metrics
- RSVP conversion, media uploads per guest, engagement rate in mini-games, highlight reel open rate.

Edge cases
- Parental consent and COPPA concerns for kids events.
- Guests without smartphones (SMS or kiosk check-in fallback).
- Offline media capture (store locally and sync).

Key integrations
- Payment (Stripe), ticket scanning (QR libs), image CDN (e.g., Cloudinary), push notifications (Expo/Firebase).

User problems this solves
- Unclear RSVPs and headcount chaos: fast RSVP nudges, plus-one prompts, and soft caps prevent overbooking.
- Activity drop-off during parties: prebuilt mini-games and timed nudges keep energy high without host micromanagement.
- Photo fragmentation across devices: unified gallery with background uploads and automatic dedupe.
- For kids: parental consent and safe-sharing defaults reduce privacy risk and anxiety for parents.

Key mobile UX patterns & microcopy
- Home card with three big CTAs: "Check-in", "Join Game", "Share a Photo".
- Smart nudge copy: "Cake in 5—grab your shot!"; "Vote the next song in 10s".
- One-tap host actions: "Start/End activity", "Announce winner", "Project to screen".
- Kid mode: "Ask a parent to approve your photo before it posts" with guardian link.

Accessibility, privacy, and safety
- Content moderation queue for the social wall with safe search filters and block/report.
- High-contrast color option for game leaderboards; caption prompts for videos.
- Private album mode for kids events with default blurred faces until approved.

Offline & performance
- Background photo/video upload with retry; low-bandwidth image compression on device.
- QR check-in works offline and syncs later; cache guest list locally.

Instrumentation notes
- Track RSVP funnel (invited -> opened -> responded), per-activity participation, media uploads per guest, and time-to-first-share.
- Cohort analysis by event size and adult/kids variant to tune nudges and default settings.

---

## 2) Wedding — Intimate & Full
Overview
- High-touch template with multi-stakeholder collaboration (couple, planner, vendors). Emphasize timelines, seating, vendor contracts, guest dietary needs, and keepsakes.

Planning
- Multi-user client portal: shared timelines, approval comments, vendor contracts attached to timeline milestones.
- Seating & RSVP engine: meal choices, plus-ones, family blocks, plus logistics (transport, hotel blocks).
- Vendor workspace: store contracts, payment schedules, contact details, delivery windows.
- Gift registry linkage and premium invite templates.

In-app engagement
- Ceremony cues & timeline prompts to guests and vendor checklists for timing.
- Photo capture zones and guest prompts for specific shots (e.g., "Take a photo with the couple").
- Memory activities: message board for guests to leave video/text wishes; live slideshow in presenter mode.

Post-event
- Professional highlight reel + long form video option; printable guestbook compiled from messages and photos.
- Archive with vendor payments, contracts, and invoices for lifetime access.
- A "first-year" follow-up: reminders for 6-month/1-year anniversary album offers and anniversary photo packages.

Phases
1. Planning & vendor coordination.
2. Guest management & RSVPs.
3. Day-of execution with presenter controls.
4. Post-event production & keepsakes.

Data contract
- Inputs: coupleProfile, vendors[{name,role,contact,contractUrl}], seatingPlan{tables:[{seatIds}]}, guestDietaryTags.
- Outputs: payments, gallery assets, compiled guestbook, vendor deliverables.

Success metrics
- On-time vendor deliveries, RSVP completeness, guestbook contributions, highlight reel share rate.

Edge cases
- Sensitive guest privacy settings (opt-in media), seating changes after RSVPs, vendor disputes (audit logs).

Integrations
- Payment, CRM for vendor contacts, print-on-demand partners, video editing/transcoding pipeline.

User problems this solves
- Last-minute changes causing stress: change log with approvals and automatic re-notifications to vendors/guests.
- Seating complexity: drag-and-drop seating with constraint hints (dietary, family groups).
- Vendor accountability: task checklists tied to contracts and timeline milestones with SLA reminders.
- Guest privacy: opt-in media capture and restricted sharing for sensitive moments.

Key mobile UX patterns & microcopy
- "Day-of Binder" view: timeline, contact rolodex, and emergency sheet with one-tap call/text.
- Microcopy for approvals: "Send to caterer and update the table counts?" with impact summary.
- Quick seat swap flow: long-press to move guest; toast confirms "Anna moved to Table 6".

Accessibility, privacy, and safety
- Silent mode cues for ceremony; on-device haptic cues for planners instead of loud alerts.
- Private guestbooks requiring event code; granular roles for vendors vs couple vs guests.

Offline & performance
- Cache seating chart and timeline locally; degrade gracefully if venue Wi‑Fi fails.

Instrumentation notes
- Measure vendor task on-time rate, seating edit churn, and guestbook contribution rate; correlate with highlight reel orders.

---

## 3) Product Launch / Small Business Demo
Overview
- Short, brand-forward events for product demos, press, and lead capture. Focus on PR-ready outputs and lead funnels.

Planning
- Tiered invites (press, VIP customers, general), demo station mapping, time-slot scheduling for product walkthroughs.
- Pre-event assets upload (press kit, product specs) and sample distribution logistics.
- Lead capture forms customized per station.

In-app engagement
- Live demos with CTA overlays ("Sign up for early access"), instant polls and feedback forms, QR codes at stations to capture interest.
- Gamified demos (challenges) to incentivize engagement and social sharing.

Post-event
- Exportable lead lists segmented by interest, automated follow-up sequences with discounts/early-bird offers, highlight clips for marketing.
- Feedback synthesis: feature requests and bug reports tagged and forwarded to product/engineering.

Phases
1. Asset & invite preparation.
2. Day-of demo scheduling & lead capture.
3. Post-event marketing and product follow-ups.

Data contract
- Inputs: stations[{id,name,host,formSchema}], assets[], attendeeInterestTags.
- Outputs: leads[{contact,interestScore,stationId}], analytics{conversionRate,topFeedback}.

Success metrics
- Lead conversion rate, demos completed per attendee, net new signups.

Edge cases
- Duplicate leads, GDPR consent for marketing, on-the-spot demo cancellations.

Integrations
- CRM (HubSpot/Salesforce), email marketing (Mailchimp), payment if selling on-site.

User problems this solves
- Low lead capture quality: per-station forms with interest scoring and duped contact merging.
- Dead time at demos: micro-challenges and queue visibility to reduce churn.
- Post-event follow-up drop: automated segmented campaigns prewired to captured intents.

Key mobile UX patterns & microcopy
- Station card CTA: "Scan to get the spec sheet + 10% off".
- Presenter companion: swipe to trigger next demo step and capture FAQs.
- Quick-note templates: "Bug", "Feature request", "Pricing" tagged with one tap.

Accessibility, privacy, and safety
- Privacy-first lead capture with explicit marketing consent checkboxes and clear copy.

Offline & performance
- Lead capture works offline and syncs; QR codes resolve to locally cached pages if network drops.

Instrumentation notes
- Attribute conversions by station and CTA copy; A/B test incentive size vs conversion; track time-to-follow-up.

---

## 4) Fundraiser / Charity Gala
Overview
- High-value ticketing, donor recognition, live and silent auctions, sponsor deliverables and robust post-event stewardship.

Planning
- Multi-tier ticketing, table management, donation processing, auction item intake and pre-bid options.
- Sponsor benefit mapping and deliverable tracking (e.g., on-stage mentions, logo placement).

In-app engagement
- Mobile bidding for auctions (real-time updates), donation thermometers, sponsor shout-outs in the event feed, impact stories with call-to-donate CTAs.
- VIP communications for major donors and backstage access check-ins.

Post-event
- Donor receipts, personalized thank-you videos, sponsor metric packages (attendance, engagement), and consolidated impact reports.
- Recurring donation signups and stewardship plans integrated with CRM.

Phases
1. Ticketing & sponsorship sales.
2. Auction & live event engagement.
3. Post-event donor reporting & retention.

Data contract
- Inputs: tickets, sponsors[{level,deliverables}], auctionItems[{id,desc,startBid}].
- Outputs: donations[{donorId,amount,method}], sponsorReports, taxReceipts.

Success metrics
- Total funds raised, average donation, sponsor ROI metrics, retained donors after 6 months.

Edge cases
- Payment disputes, chargebacks, tax receipt accuracy, last-minute high-value donations handling.

Integrations
- PCI-compliant payments (Stripe), CRM (Raiser’s Edge, Salesforce Nonprofit Cloud), email & video hosting.

User problems this solves
- Paddle fatigue in auctions: mobile bid proxy and max-bid auto-increments keep bidders engaged without constant attention.
- Donor recognition anxiety: real-time recognition (opt-in) and tier badges reduce uncertainty.
- Sponsor ROI ambiguity: deliverable tracker with automated proof (impressions, mentions, wall time).

Key mobile UX patterns & microcopy
- Donation CTA ladder: $25, $50, $100 with impact microcopy ("Feeds a family for a day").
- Live "You’re leading" and "You’ve been outbid" concise banners.
- VIP lane: persistent bottom sheet with concierge chat and backstage passes.

Accessibility, privacy, and safety
- Quiet mode for live programming; captions on stage streams; anonymous donation mode.

Offline & performance
- Bids queue offline with conflict resolution; receipts generated once online.

Instrumentation notes
- Track bid engagement per item, donation funnel drop-offs, and sponsor deliverable completion rate.

---

## 5) Music Festival / Multi-stage Event
Overview
- Large-scale events with complex scheduling, geofenced maps, vendor management, and stage-specific engagement.

Planning
- Stage scheduling, artist routing and rider checklists, volunteer passes and crowd-flow modeling.
- Ticketing with timed entries, VIP experiences, and wristband integrations.

In-app engagement
- Real-time schedule updates, push notifications for set reminders, geofenced help points (maps), scavenger hunts across stages.
- Crowd voting for best sets, maps with vendor filters, and cashless payment integration for vendors.

Post-event
- Stage-specific highlight reels, sponsor deliverable packages, attendee playlists, and demographic/engagement analytics for future bookings.
- Merchandise and replays store.

Phases
1. Booking & schedule creation.
2. Attendee routing & day-of engagement.
3. Post-event deliverables for sponsors and artists.

Data contract
- Inputs: stages[{id,name,location}], artistSlots[{stageId, start,end,artistId}], vendorList.
- Outputs: attendanceHeatmaps, setVotingResults, revenueByVendor.

Success metrics
- On-time schedule adherence, attendee satisfaction (NPS), sponsor retention.

Edge cases
- Weather contingency plans, capacity limits, emergency communications.

Integrations
- Ticketing providers, access control vendors, mapping services, streaming partners.

User problems this solves
- Schedule overwhelm: personal "My Day" planner with conflict warnings and walking time estimates.
- Getting lost: geofenced notifications ("You’re near Stage B—set starts in 5m") and SOS help points.
- Long lines: vendor wait-time hints and mobile ordering integrations reduce friction.

Key mobile UX patterns & microcopy
- Map-first home with stage pins and quick filters (Stages, Food, Restrooms).
- Set reminders: "Notify me 10m before Artist X" with one tap.
- Crowd games with low effort: "Snap a checkpoint photo near Stage C".

Accessibility, privacy, and safety
- High-contrast map mode, wheelchair route filters, and safety broadcast channel.

Offline & performance
- Offline map tiles and schedule cache; background sync for vendor updates.

Instrumentation notes
- Heatmaps from anonymous pings, reminder opt-ins per set, vendor conversion from map taps to purchases.

---

## 6) Conference / Hybrid Meetup
Overview
- Multi-track events combining in-person and virtual audiences. Focus on session management, streaming, and analytics.

Planning
- Track/session builder, speaker bios & slide upload, virtual room provisioning and AV requirements.
- Distinct ticketing for virtual vs onsite; sponsor booths for both channels.

In-app engagement
- Live Q&A (upvote), synced polls, breakout rooms for virtual participants, and a session scheduler with personal agenda builder.
- Networking suggestions and calendar integrations for follow-ups.

Post-event
- Session recordings, transcript exports, engagement analytics per session, sponsor lead exports.
- Offer on-demand package and certificate of attendance (continuing education credits where applicable).

Phases
1. Program creation & speaker management.
2. Live moderation & cross-channel engagement.
3. Post-event content distribution & analytics.

Data contract
- Inputs: sessions[{id,track,speakerIds}], virtualRoomLinks, speakerAssets.
- Outputs: recordings, transcripts, sessionAnalytics{watchTime,pollResponses}.

Success metrics
- Session attendance, virtual watch time, sponsor leads generated, post-event package purchases.

Edge cases
- Streaming reliability, timezone scheduling, simultaneous speaker edits.

Integrations
- Streaming/CDN, Zoom/Hubilo/Remo, transcription services, LMS integrations.

User problems this solves
- Context switching between tracks: personal agenda builder with conflict alerts and "watch later" queue.
- Low virtual participation: question upvotes and speaker callbacks to increase inclusion.
- Sponsor booth invisibility: lead magnets and calendar booking inside the booth page.

Key mobile UX patterns & microcopy
- Session card microcopy: "Join live • 2m left to poll"; "Recording available in 24h".
- One-swipe Q&A: swipe right to upvote, left to save for later.

Accessibility, privacy, and safety
- Live captions and transcript downloads; color-safe poll charts; privacy toggle for attendee list visibility.

Offline & performance
- Adaptive bitrate streaming; prefetch slides; continue-on-audio mode for commuters.

Instrumentation notes
- Track watch time per session, poll participation, Q&A resolved rate, booth-to-meeting conversion.

---

## 7) Group Travel / Multi-day Trip
Overview
- Multi-day itinerary-focused template for small groups (friends/families) with shared budgets, tasks, and day-by-day engagement.

Planning
- Day-by-day itinerary builder with meeting points, reservations (with links), shared packing lists, and role assignments (driver, cook).
- Shared budget with expense entries and split calculations.

In-app engagement
- Daily micro-challenges (photo-of-the-day), location check-ins, group polls for next steps, and offline maps for low-connectivity areas.
- Real-time itinerary updates and push reminders for departures and reservations.

Post-event
- Auto-grouped travel album by day and location, compiled "trip story" video, expense reconciliation report, and souvenir collages.
- Follow-up recommendations and discount codes from partners.

Phases
1. Trip planning & reservations.
2. Day-by-day execution & micro-engagement.
3. Post-trip album, reconciliation, and share.

Data contract
- Inputs: itinerary[{day,items[{time,place,notes}]}], expenses[{payer,amount,category}], participants.
- Outputs: tripAlbum, reconciliationReport, participantRatings.

Success metrics
- Expense reconciliation completeness, photos per traveler, repeat trip creation rates.

Edge cases
- Offline-first behaviors, currency conversions, lost reservation handling.

Integrations
- Payment splits (Splitwise-like), map providers, booking partners (Airbnb/booking APIs), currency conversion APIs.

User problems this solves
- Expense confusion: real-time splits with "settle up" suggestions and multi-currency support.
- Missed meetups: location-aware pings and fallback meeting points.
- Itinerary churn: simple drag reorder with change notifications to all.

Key mobile UX patterns & microcopy
- Day chips at the top for quick jump; sticky next-up card ("Depart in 15m to Museum").
- Quick expense add with camera receipt scan; auto-categorize.

Accessibility, privacy, and safety
- Low-vision friendly day view; emergency contact card; private location sharing for select members only.

Offline & performance
- Offline maps and stored reservations; batched sync when connectivity returns.

Instrumentation notes
- Measure expense reconciliation time, check-in rates at meeting points, and album contributions per traveler.

---

## 8) Community Block Party / Neighborhood Event
Overview
- Public-facing local events with permit checklists, volunteer coordination, sponsor showcases, and family-friendly engagement.

Planning
- Permit & safety checklist templates, volunteer signups, vendor zones and power/waste logistics.
- Public RSVP with volunteer role selection and sponsor booth mapping.

In-app engagement
- Community voting (music/vendors), kid-friendly games, volunteer check-in and QR-based shift verification, and live bulletin updates.

Post-event
- Community gallery, sponsor impact reports, local press kit export, and a year-over-year timeline for neighborhood events.

Phases
1. Permits & volunteer recruitment.
2. Day-of coordination & community engagement.
3. Post-event community deliverables & sponsor follow-ups.

Data contract
- Inputs: volunteers, permits{status,docs}, sponsors.
- Outputs: volunteerHoursReport, sponsorMetrics, communityGallery.

Success metrics
- Volunteer fill-rate, permit compliance, sponsor renewals.

Edge cases
- Public safety incidents, permit denials, large-scale cancellations.

Integrations
- Local government permit portals (where available), payment for vendor fees, local news/social.

User problems this solves
- Volunteer no-shows: shift reminders and easy swaps; QR attendance for accountability.
- Permit uncertainty: checklist with due dates and owner, plus example docs.
- Family engagement gaps: kids’ corner activities and simple bulletin posts.

Key mobile UX patterns & microcopy
- Volunteer shift cards: "Check in • 2h left"; fast handoff flow.
- Community bulletin: templates for "Lost & Found", "Vendor Highlight", "Weather Update".

Accessibility, privacy, and safety
- Multilingual announcements; accessible fonts; moderation of public posts with report tools.

Offline & performance
- Staff tools work offline; bulletin caches to avoid blank states.

Instrumentation notes
- Volunteer fill and attendance rates, bulletin post reach, sponsor clickthrough from highlights.

---

## 9) Class & Workshop (Cooking, Dance, Fitness)
Overview
- Recurrent or one-off learning experiences with capacity limits, registration rules, station assignments, and lesson plans.

Planning
- Session calendar with recurrence, skill-level tagging, equipment lists, waitlist handling, and instructor profiles.
- Payment capture for paid classes and materials fee handling.

In-app engagement
- Step-by-step in-class prompts (timers, videos), live Q&A, and progress badges/certificates of completion.
- Attendance tracking and instructor notes tied to participant profiles.

Post-event
- Digital recipe or lesson booklets, individual progress highlights (short clips/photos), and repeat-class recommendations.
- Upsell opportunities for advanced classes and merch.

Phases
1. Course/session creation & registration.
2. In-class interactive guidance & tracking.
3. Follow-up materials & continued learning suggestions.

Data contract
- Inputs: sessions, instructorProfiles, materialsChecklist.
- Outputs: attendanceRecords, completionCertificates, resourcePacks.

Success metrics
- Completion rate, repeat bookings, instructor ratings.

Edge cases
- No-shows, late cancellations, equipment shortages.

Integrations
- Payment, calendar invites, LMS or content hosting for lesson videos.

User problems this solves
- Overwhelm in class: step timers and visual cues reduce uncertainty.
- Skill mismatch: level tags and prerequisites at registration prevent poor fit.
- Attendance tracking pain: quick tap roll-call and auto-certificates.

Key mobile UX patterns & microcopy
- "Next step" tile with video gif preview; haptics for timers.
- Simple Q&A: long-press to bookmark a question and notify instructor after class.

Accessibility, privacy, and safety
- Captions on all videos; left-handed layout toggle for some activities.

Offline & performance
- Pre-download lesson assets; low-bandwidth mode for remote locations.

Instrumentation notes
- Track step completion times, Q&A volume, and repeat enrollment by course level.

---

## 10) Hackathon / Competitive Tournament
Overview
- Competitive, deadline-driven events focused on team formation, submissions, judging, and sponsor interactions.

Planning
- Team formation tools, challenge tracks, mentor scheduling, sponsor/problem statements, and submission rules.
- Resource provisioning (APIs, data sets) and infrastructure notes.

In-app engagement
- Live submission tracker, mentor office hours booking, judging UI with rubric scoring, and audience voting categories.
- Timers and countdowns with automated milestone reminders.

Post-event
- Project archives with repo links and demos, winner highlight reels, participant portfolios, and recruiter lead exports.

Phases
1. Registration & team formation.
2. Build window with mentor support & checkpoints.
3. Judging, awards, and post-event recruitment follow-ups.

Data contract
- Inputs: teams[{members,repoLink}], mentors, challengeTracks[{id,desc}].
- Outputs: submissions, judgingScores, participantPortfolios.

Success metrics
- Submission rate, judged completeness, sponsor satisfaction and recruiting matches.

Edge cases
- Late submissions, plagiarism/duplicate projects, repo access issues.

Integrations
- GitHub/GitLab, judging platforms, sponsor APIs, video hosting.

User problems this solves
- Team formation friction: interest tags and matchmaking lobby reduce random mismatches.
- Submission chaos: guardrails with schema validation and late-submission grace window.
- Judge overload: rubric presets and quick-compare view; conflict-of-interest flags.

Key mobile UX patterns & microcopy
- Milestone tracker: "Idea", "Prototype", "Demo" with progress rings.
- One-tap mentor booking with "office hour" slots; push reminders 5m before.

Accessibility, privacy, and safety
- Code of conduct acknowledgment; anonymous project feedback option for peers.

Offline & performance
- Draft submissions saved locally; background video upload; resume after app switch.

Instrumentation notes
- Track mentor utilization, submission error rates, judge time per project, and sponsor API usage.

---

## Priorities & Implementation Notes (quick wins)
1. Build the event wizard with configurable template presets (title/date/venue/guest import) — reusable across templates.
2. Implement RSVP & ticketing core model (free/paid, plus-ones, dietary tags) — required by >70% of templates.
3. Media pipeline & gallery with mobile upload, dedupe, and lightweight editing (auto highlight reel) — drives retention.
4. Timeline/agenda module with host cues and push notifications — common need across templates.
5. Simple modular activities (polls, photo scavenger, leaderboards) — pluggable UI components.

Next steps
- Wireframe 3 mobile flows: event creation wizard, host presenter controls, and gallery/highlight share flow.
- Define APIs for tickets, media, timeline, and activity modules (I can draft OpenAPI snippets on request).

---

File Notes
- Saved in project root as `coretemplates.md` on feature branch `feature/mobile-expo`.
- If you want, I can now: create wireframe mockups, draft API contracts for the top 3 modules, or scaffold mobile screens in the `apps/mobile` workspace.

