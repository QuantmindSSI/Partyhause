// server/lib/event-access.ts — event-scoped authorization helper.
//
// Ports the Supabase RLS policies (the documented business rules) to the
// Express layer. Ground truth:
//   supabase/migrations/20251022000001_template_implementation_rls.sql
//   supabase/migrations/20251107_polls_feature.sql
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
  isPublic: boolean;
  hostId: string | null;
}

const NO_ACCESS: EventAccess = {
  exists: false,
  isHost: false,
  isCoHost: false,
  coHostPermissions: null,
  isGuest: false,
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
      select: { id: true },
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
    isPublic,
    hostId: event.host_id,
  };
}

/** RLS: SELECT on events — public, host, co-host, or invited guest. */
export function canReadEvent(a: EventAccess): boolean {
  return a.exists && (a.isPublic || a.isHost || a.isCoHost || a.isGuest);
}

/** RLS: UPDATE on events — host, or co-host with can_edit. */
export function canEditEvent(a: EventAccess): boolean {
  if (!a.exists) return false;
  if (a.isHost) return true;
  return a.isCoHost && a.coHostPermissions?.['can_edit'] === 'true';
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
  return a.isCoHost && a.coHostPermissions?.['can_invite'] === 'true';
}

/** RLS: timeline WRITE — host or co-host. */
export function canEditTimeline(a: EventAccess): boolean {
  return a.exists && (a.isHost || a.isCoHost);
}

/** RLS: polls READ/CREATE/VOTE — any event participant. */
export function isEventParticipant(a: EventAccess): boolean {
  return a.exists && (a.isHost || a.isCoHost || a.isGuest);
}

export default {
  getEventAccess,
  canReadEvent,
  canEditEvent,
  canDeleteEvent,
  canManageGuests,
  canInviteGuests,
  canEditTimeline,
  isEventParticipant,
};
