# Collaborative Collaboration Roadmap

PartyHause is more than an RSVP tool; it is a hybrid event OS that blends **smart planning**, **interactive party games**, and **memory capture** across web and mobile. The collaborative layer should reinforce three product pillars:

1. **Plan Together** – streamline how hosts, co-hosts, vendors, and guests co-create the event.
2. **Play Together** – keep energy high with interactive polls, games, and live engagement.
3. **Remember Together** – collect stories, media, and follow-up notes that persist after the party.

The next-generation collaboration features therefore need to serve multiple personas, surfaces (React web, Flutter mobile, Supabase-driven APIs), and stages in the event lifecycle.

---

## Personas & Core Use Cases

| Persona | Key Goals | Collaboration Moments |
| --- | --- | --- |
| **Lead Host** | Define the event vision, manage logistics, delegate tasks | Approve budgets, assign roles, run polls for key decisions |
| **Co-Host / Planner** | Share workload, coordinate vendors, curate experiences | Update itineraries, upload resources, manage guest requests |
| **Guest Squad** | Provide preferences, stay informed, contribute to the vibe | Vote on menus/music, join games, share availability |
| **Vendors & Performers** | Align on schedules and deliverables | Receive task assignments, share files, post updates |
| **After-Party Archivist** | Capture memories, recap outcomes | Upload media, add highlights, help craft post-event stories |

Stages of collaboration: **Discover (idea ↔ invite)**, **Design (plan ↔ confirm)**, **Deliver (day-of execution)**, **Delight (post-event follow-up)**.

---

## Collaboration Goals by Stage

- **Discover**: Collect preferences fast so hosts can lock dates, budgets, and themes.
- **Design**: Translate ideas into actionable boards, tasks, and resource libraries.
- **Deliver**: Coordinate real-time decisions (music, games, logistics) with minimal friction.
- **Delight**: Aggregate media, send thank-yous, and surface insights for future events.

---

## Feature Blueprint (Stage + Persona Mapping)

Each feature below includes the stage it primarily serves, the target persona(s), and technical contours. Priorities reflect impact vs. effort given the current PartyHause stack (React + Supabase + real-time services).

### 1. PartyBoard – Collaborative Mood & Plan Board
- **Stage**: Discover → Design
- **Personas**: Lead Host, Co-Host, Vendors
- **Summary**: Curated inspiration wall mixing agenda cards, checklists, and media tiles. Guests can react, comment, and pin ideas.
- **Why**: Gives shared context before logistics begin.
- **Data**: `partyboards(id, event_id, title, theme)` + `partyboard_tiles(id, board_id, author_id, type, payload jsonb, position)`
- **API**: CRUD for boards/tiles, reorder endpoint; Supabase real-time channel for tile updates.
- **UI**: Drag-and-drop board (web), swipeable lanes (mobile). Presence indicators show who’s editing.
- **Priority**: High

### 2. RSVP Preference Polls
- **Stage**: Discover
- **Personas**: Guests, Lead Host
- **Summary**: Polls for times, menus, activities; supports single, multi, and ranked modes.
- **Why**: Decisions move forward faster when guests contribute early.
- **Data**: `polls`, `poll_options`, `poll_votes` (with ranked vote payload).
- **API**: `POST /api/events/:id/polls`, vote endpoints, WebSocket updates for live results.
- **UI**: Poll cards embedded in landing dashboard and mobile push reminders.
- **Priority**: High

### 3. Attachments & Shared Resource Locker
- **Stage**: Design
- **Personas**: Co-Host, Vendors, Archivist
- **Summary**: Secure file/link uploads attached to the event, PartyBoard tiles, or tasks.
- **Why**: Centralized menus, floor plans, playlists, vendor contracts.
- **Data**: `attachments(id, event_id, uploader_id, scope, scope_id, url, metadata jsonb)`
- **API**: Signed upload endpoint, list/filter endpoint, virus scan hook.
- **UI**: Attachment drawer with quick preview and drag-drop from PartyBoard.
- **Priority**: High

### 4. Shared Itinerary Kanban
- **Stage**: Design → Deliver
- **Personas**: Lead Host, Co-Host, Vendors
- **Summary**: Kanban view for agenda blocks, tasks, and assignments with due times.
- **Why**: Visual alignment across planning sprints and day-of execution.
- **Data**: `boards`, `board_items`, `board_item_activity` for history.
- **API**: CRUD, reorder, assign operations; WebSocket broadcast on state change.
- **UI**: Desktop board with drag-and-drop; condensed timeline on mobile.
- **Priority**: High

### 5. Roles & Access Control Matrix
- **Stage**: Discover → Deliver
- **Personas**: Lead Host, Co-Host
- **Summary**: Role-based permissions (Host, Planner, Vendor, VIP Guest) controlling editing rights, notifications, and analytics access.
- **Why**: Prevents chaos while empowering trusted collaborators.
- **Data**: `event_roles(event_id, user_id, role, granted_by)`
- **API**: Role assignment, audit log integration.
- **UI**: Role manager modal, badge indicators, permission gating wrappers.
- **Priority**: High

### 6. Real-time Chat & Threads
- **Stage**: Design → Deliver
- **Personas**: All
- **Summary**: Event chat with threads, reactions, attachment previews, AI summaries.
- **Why**: Centralizes decisions, reduces reliance on external chats.
- **Data**: `messages`, `message_threads`, `message_reactions`.
- **API**: WebSocket channel, REST history fetch, AI summary worker.
- **UI**: Sidebar chat on web, floating chat bubble on mobile.
- **Priority**: High

### 7. Live Polling & Music Votes
- **Stage**: Deliver
- **Personas**: Guests, Host
- **Summary**: On-the-fly polls for songs, games, or decisions; integrates with PartyHause game engine.
- **Why**: Keeps the crowd engaged during the event.
- **Data**: `live_polls`, `live_poll_votes`, optionally `playlist_votes` for Spotify sync.
- **API**: WebSocket broadcast, `POST /api/events/:id/live-polls`.
- **UI**: Presenter mode for host screen, mobile quick-vote UI, real-time visualizations.
- **Priority**: Medium

### 8. Collaborative Budget & Expense Splitter
- **Stage**: Design
- **Personas**: Lead Host, Co-Host, Guests (shared cost events)
- **Summary**: Track estimated vs. actual spend, let guests commit payments, integrate Stripe for settlement.
- **Why**: Makes group trips/parties financially transparent.
- **Data**: `expenses`, `expense_shares`, `payments`.
- **API**: CRUD, settle, export endpoints.
- **UI**: Budget dashboard, shareable pay links, reminders.
- **Priority**: Medium

### 9. Availability Heatmap
- **Stage**: Discover
- **Personas**: Guests, Host
- **Summary**: Grid showing proposed slots with per-guest availability and AI suggestions for ideal time.
- **Why**: Eliminates tedious schedule coordination.
- **Data**: `availability`, `proposed_slots`.
- **API**: Submit availability, generate best slots.
- **UI**: Heatmap on web, slider-based selection on mobile.
- **Priority**: Medium

### 10. Real-time Co-Editing Notes (PartyPad)
- **Stage**: Design → Delight
- **Personas**: Co-Host, Archivist
- **Summary**: CRDT-backed note for scripts, announcements, or recap drafts with presence cursors.
- **Why**: Keeps communications aligned pre- and post-event.
- **Data**: `notes`, `note_snapshots`.
- **API**: WebSocket sync, REST snapshot restore.
- **UI**: Rich text editor with timeline diff.
- **Priority**: Medium

### 11. Game & Activity Lobby Enhancements
- **Stage**: Deliver
- **Personas**: Guests, Host
- **Summary**: Shared lobby for PartyHause mini-games where guests can vote on next challenge, share scores, and post reactions.
- **Why**: Deepens the “play together” pillar.
- **Data**: `game_sessions`, `game_votes`, `game_events`.
- **API**: Real-time game events, scoreboard endpoints.
- **UI**: Dashboard widget, mobile-first lobby screen.
- **Priority**: Medium

### 12. Vendor Hand-off Kit
- **Stage**: Design → Deliver
- **Personas**: Vendors, Lead Host
- **Summary**: Secure workspace for vendors to receive tasks, upload proofs, and tick off requirements.
- **Why**: External collaborators become first-class citizens without exposing all event data.
- **Data**: `vendor_invites`, `vendor_tasks`, `vendor_files`.
- **API**: Magic link invite, vendor-scoped endpoints.
- **UI**: Focused vendor portal with limited navigation.
- **Priority**: Medium

### 13. Activity Feed & Undo Timeline
- **Stage**: All
- **Personas**: Lead Host, Co-Host
- **Summary**: Chronological feed of changes with undo for critical actions (deleted tile, updated task).
- **Why**: Transparency plus safety net for high-collaboration spaces.
- **Data**: `activity`, `activity_context` (jsonb).
- **API**: Append-only logging, undo endpoint for reversible actions.
- **UI**: Feed sidebar, inline toasts.
- **Priority**: Medium

### 14. Post-Event Memory Capsule
- **Stage**: Delight
- **Personas**: Archivist, Guests
- **Summary**: Curated gallery with guest submissions, AI-generated highlight reel, gratitude messages.
- **Why**: Reinforces the brand promise of magical memories.
- **Data**: `memories`, `memory_reactions`, `thank_you_notes`.
- **API**: Media upload, collage generation job, shareable recap links.
- **UI**: Carousel, storytelling layout, export to video.
- **Priority**: Low

### 15. Insight Pulse (Analytics & AI Recap)
- **Stage**: Delight
- **Personas**: Lead Host
- **Summary**: After-action report summarizing engagement metrics, budget variance, and recommendations for next event.
- **Why**: Turns collaborative data into actionable intelligence.
- **Data**: Aggregated event metrics, `insights` table for generated content.
- **API**: Background job generating report, `GET /api/events/:id/insights`.
- **UI**: Dashboard card, PDF export.
- **Priority**: Low

---

## Implementation Waves

- **Wave 1 – Plan Together MVP**: PartyBoard, RSVP Polls, Shared Itinerary, Roles & Access, Attachments, Activity Feed.
- **Wave 2 – Play Together**: Chat + Threads, Live Polling & Music Votes, Game Lobby Enhancements, Availability Heatmap.
- **Wave 3 – Remember Together**: PartyPad Notes, Budgeting, Vendor Kit, Memory Capsule, Insight Pulse.

Each wave should include: Supabase migrations (SQL + RLS), API layer in `src/api`, React components with responsive design and Zustand integration, Flutter endpoints parity where relevant, and Vitest coverage for new flows.

---

## Security & Privacy Anchors

- Enforce Supabase Row-Level Security per event and role.
- Sanitize all collaborative text inputs (reuse `src/lib/sanitization.ts`).
- Signed URLs for attachments, automatic malware scanning hook (Supabase Edge Function or Vercel serverless).
- Rate limiting on high-frequency endpoints (poll creation, chat messages) via Edge middleware.
- Audit trail powering the Activity Feed doubles as compliance backbone.

---

## Next Steps

1. Validate Wave 1 scope with product/design leads; confirm prioritized persona journeys.
2. Create migration RFC covering new tables, indexes, and RLS policies.
3. Scaffold feature flags and UI shells so components can release gradually.
4. Align Flutter client requirements (navigation, offline mode) with web milestones.
5. Schedule usability reviews after PartyBoard + Polls prototype to iterate quickly.

This roadmap keeps PartyHause’s differentiated promise—smart planning, playful engagement, unforgettable memories—front and center for every collaborator who touches the platform.