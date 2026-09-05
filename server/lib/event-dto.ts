/**
 * Event serialisation for the wire.
 *
 * WHY THIS EXISTS
 * ---------------
 * Routes returned raw Prisma rows. `res.json({ events })` and
 * `res.json({ event })` handed every column to whoever asked, and each route
 * then re-derived, or forgot to derive, what that particular caller was allowed
 * to see. Two blockers come directly out of that:
 *
 *   GAP-EVT-13  a readable event returns the full row plus host-oriented counts
 *               to every actor, so a guest receives host fields
 *   GAP-PLAN-02 full event reads expose the JSON timeline and host notes to
 *               guests, despite /api/timeline filtering them correctly
 *
 * The pattern underneath is P4: authorization computed per call site rather than
 * once. Adding a column to Event silently widened every response, because
 * nothing between the database and the client decided what belonged there.
 *
 * This module is that decision point. A row goes in, a viewer-appropriate shape
 * comes out, and adding a column changes nothing until someone deliberately
 * lists it here.
 *
 * THE TIMELINE DECISION (P3)
 * --------------------------
 * Timeline exists twice: `Event.timeline_blocks`, an untyped Json column, and
 * `TimelineBlock`, a relational table. Relational wins, and the JSON is never
 * serialised to a client by this module.
 *
 * It is not a preference. `TimelineBlock` carries `guest_visible` and
 * `host_notes`; the JSON blob has no way to express either. `/api/timeline`
 * already applies the correct rule, hosts and co-hosts see every block and
 * everyone else sees only `guest_visible: true`. The blob structurally cannot
 * be filtered that way, so any response containing it leaks host notes to
 * guests. That is why GAP-PLAN-02 is a data-model defect rather than a
 * filtering defect, and why the fix is to stop emitting the column rather than
 * to filter it better.
 *
 * The column is still written by existing create and update paths, so it is not
 * dropped here. Removing it needs a backfill into TimelineBlock and a
 * migration, and this repository has no migrations directory yet. Cutting the
 * read path first is the half that stops the leak today.
 */

import type { Prisma } from '@prisma/client';
import type { EventAccess } from './event-access';
import { canEditEvent, canManageGuests, canDeleteEvent, canInviteGuests } from './event-access';

/** Fields every viewer of an event may see. */
export interface PublicEventDTO {
  id: string;
  name: string;
  description: string | null;
  start_date: Date | null;
  end_date: Date | null;
  timezone: string | null;
  location: string | null;
  event_type: string | null;
  template_type: string | null;
  privacy: string | null;
  status: string | null;
  cover_image_url: string | null;
  host_id: string;
  created_at: Date | null;
}

/** What the caller is permitted to do, computed once and sent explicitly. */
export interface EventCapabilities {
  can_edit: boolean;
  can_delete: boolean;
  can_manage_guests: boolean;
  can_invite: boolean;
  can_view_insights: boolean;
}

/** Host and co-host additions. Never present in a guest or public response. */
export interface HostEventDTO extends PublicEventDTO {
  settings: Prisma.JsonValue | null;
  template_data: Prisma.JsonValue | null;
  capacity: number | null;
  budget: Prisma.JsonValue | null;
}

/**
 * The wire shape: event fields at the top level, with capabilities and
 * relationship as siblings.
 *
 * Deliberately flat rather than `{ event, capabilities }`. Clients already read
 * `events[0].name`, and `packages/core` types `list()` as `PartyEvent[]`.
 * Nesting would have been a silent breaking change that `audit:contracts` does
 * not catch, because it compares envelope keys and not nested shape. Adding
 * sibling keys is additive: existing readers keep working and new ones can stop
 * inferring permissions.
 */
export type SerialisedEvent = (PublicEventDTO | HostEventDTO) & {
  capabilities: EventCapabilities;
  relationship: EventRelationship;
};

export type EventRelationship = 'host' | 'co_host' | 'guest' | 'public';

/**
 * Any Event-shaped row. Deliberately loose: routes select different column
 * sets, and this module reads only what it lists below.
 */
type EventRow = Record<string, unknown> & { id: string; host_id: string };

function str(v: unknown): string | null {
  return typeof v === 'string' ? v : null;
}

function date(v: unknown): Date | null {
  return v instanceof Date ? v : null;
}

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

export function relationshipOf(access: EventAccess): EventRelationship {
  if (access.isHost) return 'host';
  if (access.isCoHost) return 'co_host';
  if (access.isGuest) return 'guest';
  return 'public';
}

export function capabilitiesOf(access: EventAccess): EventCapabilities {
  return {
    can_edit: canEditEvent(access),
    can_delete: canDeleteEvent(access),
    can_manage_guests: canManageGuests(access),
    can_invite: canInviteGuests(access),
    // Attendance and engagement counts are host-oriented. A guest learning how
    // many people declined is a disclosure, not a feature.
    can_view_insights: access.isHost || access.isCoHost,
  };
}

/**
 * The allowlist. Every field a non-host may see, and nothing else.
 *
 * `timeline_blocks` is absent by design, as is `host_notes` and anything the
 * host records privately. Guests read the timeline through /api/timeline, which
 * applies `guest_visible` per block.
 */
function publicShape(row: EventRow): PublicEventDTO {
  return {
    id: row.id,
    // Schema has both `name` and, historically, `title`. Emit one.
    name: str(row.name) ?? str(row.title) ?? '',
    description: str(row.description),
    start_date: date(row.start_date),
    end_date: date(row.end_date),
    timezone: str(row.timezone),
    location: str(row.location),
    event_type: str(row.event_type),
    template_type: str(row.template_type),
    privacy: str(row.privacy),
    status: str(row.status),
    cover_image_url: str(row.cover_image_url),
    host_id: row.host_id,
    created_at: date(row.created_at),
  };
}

function hostShape(row: EventRow): HostEventDTO {
  return {
    ...publicShape(row),
    settings: (row.settings ?? null) as Prisma.JsonValue | null,
    template_data: (row.template_data ?? null) as Prisma.JsonValue | null,
    capacity: num(row.capacity),
    budget: (row.budget ?? null) as Prisma.JsonValue | null,
  };
}

/**
 * Serialise one event for one viewer.
 *
 * The caller passes the access record it already computed for its own
 * authorization check, so this adds no queries and cannot disagree with the
 * decision that let the request through.
 */
export function serialiseEvent(row: EventRow, access: EventAccess): SerialisedEvent {
  const privileged = access.isHost || access.isCoHost;
  return {
    ...(privileged ? hostShape(row) : publicShape(row)),
    capabilities: capabilitiesOf(access),
    relationship: relationshipOf(access),
  };
}

/**
 * Serialise a list where the viewer's relationship differs per row.
 *
 * `accessFor` is supplied by the caller rather than resolved here, because the
 * list routes already know each row's relationship from the query that produced
 * it and a per-row lookup would be N+1.
 */
export function serialiseEventList(
  rows: EventRow[],
  accessFor: (row: EventRow) => EventAccess,
): SerialisedEvent[] {
  return rows.map((row) => serialiseEvent(row, accessFor(row)));
}
