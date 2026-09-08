// server/lib/event-access.ts — event-scoped authorization helper.
//
// This module is the ground truth for event-scoped authorization. The rules
// below were originally enforced by database row-level-security policies; they
// now live here because the schema is applied with `prisma db push`, which
// does not create policies, so a rule left in SQL would be a rule enforced
// nowhere. Changing the matrix below changes the product's access control.
//
// Matrix:
//   events   READ:   public | host | co-host | invited guest (email match)
//            UPDATE: host | co-host with permissions.can_edit
//            DELETE: host only
//   guests   LIST/UPDATE/DELETE: host | co-host
//            ADD:    host | co-host with permissions.can_invite
//            SELF:   a guest may read/update their own record (email/user_id)
//   timeline READ:   host/co-host all blocks; participants/public only
//                    guest_visible blocks
//            WRITE:  host | co-host
//   polls    READ/CREATE/VOTE: event participants (host or guest)
//            UPDATE/CLOSE:     poll creator | event host

import { prisma } from './prisma';

export interface EventAccess {
  /** Event row exists. */
  exists: boolean;
  isHost: boolean;
  isCoHost: boolean;
  /** Raw co-host permissions JSON (e.g. { can_edit: 'true', can_invite: 'true' }). */
  coHostPermissions: Record<string, unknown> | null;
  /** Caller appears on the guest list (by user_id or email). */
  isGuest: boolean;
  /**
   * The guest row's rsvp_status, or null when the caller is not a guest.
   *
   * Appearing on a guest list is not the same as attending. Someone invited and
   * still pending, or who has explicitly declined, is on the list but is not a
   * participant. Without this field that distinction could not be made, and
   * `isEventParticipant` treated all three identically.
   */
  guestRsvpStatus: string | null;
  isPublic: boolean;
  hostId: string | null;
}

const NO_ACCESS: EventAccess = {
  exists: false,
  isHost: false,
  isCoHost: false,
  coHostPermissions: null,
  isGuest: false,
  guestRsvpStatus: null,
  isPublic: false,
  hostId: null,
};

/**
 * Resolve the caller's relationship to an event in three indexed lookups.
 *
 * @param eventId - target event id
 * @param userId  - authenticated user id (JWT sub)
 * @param userEmail - authenticated user email (JWT claim), used for the
 *                    guest-list email match exactly like the RLS policies
 */
export async function getEventAccess(
  eventId: string,
  userId: string,
  userEmail?: string,
): Promise<EventAccess> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, host_id: true, privacy: true, is_public: true },
  });

  if (!event) return NO_ACCESS;

  const isHost = event.host_id === userId;
  const isPublic = event.privacy === 'public' || event.is_public === true;

  // Hosts need no further lookups.
  if (isHost) {
    return {
      exists: true,
      isHost: true,
      isCoHost: false,
      coHostPermissions: null,
      isGuest: false,
      guestRsvpStatus: null,
      isPublic,
      hostId: event.host_id,
    };
  }

  const [coHost, guest] = await Promise.all([
    prisma.eventCoHost.findFirst({
      where: { event_id: eventId, user_id: userId },
      select: { permissions: true },
    }),
    prisma.guest.findFirst({
      where: {
        event_id: eventId,
        OR: [
          { user_id: userId },
          ...(userEmail ? [{ email: userEmail }] : []),
        ],
      },
      select: { id: true, rsvp_status: true },
    }),
  ]);

  return {
    exists: true,
    isHost: false,
    isCoHost: !!coHost,
    coHostPermissions:
      coHost && coHost.permissions && typeof coHost.permissions === 'object'
        ? (coHost.permissions as Record<string, unknown>)
        : null,
    isGuest: !!guest,
    guestRsvpStatus: guest?.rsvp_status ?? null,
    isPublic,
    hostId: event.host_id,
  };
}

/** RLS: SELECT on events — public, host, co-host, or invited guest. */
export function canReadEvent(a: EventAccess): boolean {
  return a.exists && (a.isPublic || a.isHost || a.isCoHost || a.isGuest);
}

/**
 * Read one granular co-host permission.
 *
 * `EventCoHost.permissions` is a Json column whose schema default is
 * `{"can_edit": true, "can_invite": true, "can_moderate": true}`, so the value
 * arrives from Prisma as a JavaScript boolean.
 *
 * The checks below previously compared it to the STRING `'true'`. A boolean
 * `true` is never equal to `'true'`, so both comparisons were permanently
 * false and every co-host silently held no permissions at all, including the
 * ones the schema had just granted them by default. Nothing surfaced, because
 * the failure mode is a co-host being told they may not edit an event they
 * were explicitly given edit rights to.
 *
 * A string is still accepted, because rows may have been written that way by
 * earlier code paths and a migration has not run. Anything else, including a
 * missing key, is false: an unrecognised permission value must not grant
 * access.
 */
function hasCoHostPermission(a: EventAccess, key: string): boolean {
  const raw = a.coHostPermissions?.[key];
  if (raw === true) return true;
  if (typeof raw === 'string') return raw.toLowerCase() === 'true';
  return false;
}

/** RLS: UPDATE on events — host, or co-host with can_edit. */
export function canEditEvent(a: EventAccess): boolean {
  if (!a.exists) return false;
  if (a.isHost) return true;
  return a.isCoHost && hasCoHostPermission(a, 'can_edit');
}

/** RLS: DELETE on events — host only. */
export function canDeleteEvent(a: EventAccess): boolean {
  return a.exists && a.isHost;
}

/** RLS: guests SELECT/UPDATE/DELETE — host or co-host. */
export function canManageGuests(a: EventAccess): boolean {
  return a.exists && (a.isHost || a.isCoHost);
}

/** RLS: guests INSERT — host, or co-host with can_invite. */
export function canInviteGuests(a: EventAccess): boolean {
  if (!a.exists) return false;
  if (a.isHost) return true;
  return a.isCoHost && hasCoHostPermission(a, 'can_invite');
}

/** RLS: moderation — host, or co-host with can_moderate. */
export function canModerate(a: EventAccess): boolean {
  if (!a.exists) return false;
  if (a.isHost) return true;
  return a.isCoHost && hasCoHostPermission(a, 'can_moderate');
}

/** RLS: timeline WRITE — host or co-host. */
export function canEditTimeline(a: EventAccess): boolean {
  return a.exists && (a.isHost || a.isCoHost);
}

/**
 * RSVP values that mean the person is actually coming.
 *
 * 'confirmed' is legacy vocabulary for 'accepted' and both are present in live
 * data, so both count. Anything else, including 'pending', 'declined',
 * 'maybe' and null, does not.
 */
const ATTENDING_RSVP = new Set(['accepted', 'confirmed']);

/**
 * RLS: polls READ/CREATE/VOTE — host, co-host, or a guest who accepted.
 *
 * This previously returned true for `isGuest` alone, so anyone on the guest
 * list counted as a participant regardless of their RSVP. Someone who had
 * explicitly declined, or who was merely invited and never responded, could
 * read, create and vote on that event's polls. Four endpoints in
 * server/routes/polls.ts gate on this function, so the defect applied to all of
 * them. That is GAP-INV-14.
 *
 * Being on a guest list is an invitation. Participation is what you get after
 * accepting one.
 */
export function isEventParticipant(a: EventAccess): boolean {
  if (!a.exists) return false;
  if (a.isHost || a.isCoHost) return true;
  return a.isGuest && ATTENDING_RSVP.has((a.guestRsvpStatus ?? '').toLowerCase());
}

export default {
  getEventAccess,
  canReadEvent,
  canEditEvent,
  canModerate,
  canDeleteEvent,
  canManageGuests,
  canInviteGuests,
  canEditTimeline,
  isEventParticipant,
};
