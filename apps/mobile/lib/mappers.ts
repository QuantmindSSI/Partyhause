/**
 * Adapters between the API's wire shapes and the mobile app's local types.
 *
 * These two models do not agree, and pretending otherwise with a type
 * assertion would hide live defects. `types/event.ts` predates the current
 * API and requires `title`, `template_type` and `status`. The
 * Express API returns `name` and neither of the other two, so a UI reading
 * `event.title` renders undefined today.
 *
 * Mapping explicitly, in one place, keeps the divergence visible and gives a
 * single file to delete once the mobile types are replaced by the shared ones
 * in @partyhause/core.
 */

import type { PartyEvent, Guest as CoreGuest } from '@partyhause/core';
import type { Event } from '@/types/event';
import type { Guest } from '@/types/guest';

/**
 * Convert an API event into the shape the mobile screens expect.
 *
 * @param source Event as returned by GET /api/events.
 * @returns A local Event with every required field populated.
 *
 * Field notes:
 *   title         the API calls this `name`; local type requires `title`
 *   start_date    older rows carry `event_date` instead
 *   template_type absent from the API; defaults to 'default' rather than
 *                 undefined, because the local type requires a string and
 *                 getTemplateBackground() indexes on it
 *   status        absent from the API; every persisted event is published
 */
export function toLocalEvent(source: PartyEvent): Event {
  const legacyDate = (source as { event_date?: string }).event_date;
  return {
    ...(source as unknown as Record<string, unknown>),
    id: source.id,
    title: source.name,
    name: source.name,
    description: source.description ?? undefined,
    location: source.location,
    start_date: source.start_date || legacyDate,
    end_date: source.end_date || legacyDate,
    event_date: legacyDate,
    host_id: source.host_id,
    template_type: source.template_type ?? 'default',
    status: 'published',
  } as Event;
}

/**
 * Convert a list of API events, preserving order.
 *
 * @param source Rows from GET /api/events, already ordered start_date ascending.
 */
export function toLocalEvents(source: PartyEvent[] | null | undefined): Event[] {
  return (source ?? []).map(toLocalEvent);
}

/**
 * Convert an API guest into the local guest shape.
 *
 * `is_checked_in` is populated from `checked_in`. The local type lists both and
 * calls the former an "alternative field name", but nothing ever set it, so
 * check-in counters reading it always showed zero.
 */
export function toLocalGuest(source: CoreGuest): Guest {
  return {
    ...(source as unknown as Record<string, unknown>),
    id: source.id,
    event_id: source.event_id,
    name: source.name,
    checked_in: source.checked_in ?? false,
    is_checked_in: source.checked_in ?? false,
  } as Guest;
}

/** Convert a list of API guests, preserving order. */
export function toLocalGuests(source: CoreGuest[] | null | undefined): Guest[] {
  return (source ?? []).map(toLocalGuest);
}
