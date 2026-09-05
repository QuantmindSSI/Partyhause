/**
 * Tests for granular co-host permission checks.
 *
 * WHY THIS EXISTS
 *   `EventCoHost.permissions` is a Prisma Json column whose schema default is
 *   `{"can_edit": true, "can_invite": true, "can_moderate": true}`, so the
 *   value reaches the server as a JavaScript boolean.
 *
 *   `canEditEvent` and `canInviteGuests` compared it to the STRING 'true'.
 *   A boolean `true` is never equal to `'true'`, so both were permanently
 *   false. Every co-host silently held no permissions, including the ones the
 *   schema had just granted them by default.
 *
 *   Nothing surfaced it, because the symptom is a co-host being refused an
 *   action they were explicitly given rights to, which reads as a product
 *   decision rather than a bug. That is GAP-EVT-09, BLOCKER.
 *
 * WHAT IS ASSERTED
 *   Booleans grant. Strings still grant, because rows may have been written
 *   that way before and no migration has run. Everything else refuses,
 *   including a missing key: an unrecognised permission value must never be
 *   read as permission.
 *
 * The functions are pure over an EventAccess record, so these run with no
 * database and no server.
 */

import { describe, it, expect } from 'vitest';
import {
  canEditEvent,
  canInviteGuests,
  canModerate,
  canDeleteEvent,
  isEventParticipant,
  type EventAccess,
} from '../../server/lib/event-access';

function access(over: Partial<EventAccess> = {}): EventAccess {
  return {
    exists: true,
    isHost: false,
    isCoHost: false,
    coHostPermissions: null,
    isGuest: false,
    guestRsvpStatus: null,
    isPublic: false,
    hostId: 'host-1',
    ...over,
  } as EventAccess;
}

const coHost = (perms: Record<string, unknown> | null) =>
  access({ isCoHost: true, coHostPermissions: perms });

describe('co-host permissions: the boolean the schema actually writes', () => {
  it('grants edit when can_edit is boolean true, the schema default', () => {
    // This is the case that was broken. It is the only one the product
    // produces on its own, via the EventCoHost.permissions default.
    expect(canEditEvent(coHost({ can_edit: true }))).toBe(true);
  });

  it('grants invite when can_invite is boolean true', () => {
    expect(canInviteGuests(coHost({ can_invite: true }))).toBe(true);
  });

  it('grants moderate when can_moderate is boolean true', () => {
    expect(canModerate(coHost({ can_moderate: true }))).toBe(true);
  });

  it('grants all three from a single default-shaped permissions object', () => {
    const a = coHost({ can_edit: true, can_invite: true, can_moderate: true });
    expect([canEditEvent(a), canInviteGuests(a), canModerate(a)]).toEqual([true, true, true]);
  });
});

describe('co-host permissions: legacy string rows still work', () => {
  it('accepts the string "true", since older rows may hold one', () => {
    expect(canEditEvent(coHost({ can_edit: 'true' }))).toBe(true);
  });

  it('accepts "TRUE" case-insensitively', () => {
    expect(canInviteGuests(coHost({ can_invite: 'TRUE' }))).toBe(true);
  });
});

describe('co-host permissions: everything else refuses', () => {
  it('refuses boolean false', () => {
    expect(canEditEvent(coHost({ can_edit: false }))).toBe(false);
  });

  it('refuses the string "false"', () => {
    expect(canEditEvent(coHost({ can_edit: 'false' }))).toBe(false);
  });

  it('refuses a missing key rather than defaulting to permitted', () => {
    expect(canEditEvent(coHost({ can_invite: true }))).toBe(false);
  });

  it('refuses when permissions is null', () => {
    expect(canEditEvent(coHost(null))).toBe(false);
  });

  it('refuses unrecognised values, which must never read as permission', () => {
    for (const v of [1, 'yes', 'TrUe ', {}, [], null, undefined]) {
      expect(canEditEvent(coHost({ can_edit: v }))).toBe(false);
    }
  });

  it('refuses a co-host who is not actually a co-host', () => {
    expect(canEditEvent(access({ coHostPermissions: { can_edit: true } }))).toBe(false);
  });
});

describe('co-host permissions: host and existence still dominate', () => {
  it('grants a host everything regardless of permissions', () => {
    const host = access({ isHost: true });
    expect([canEditEvent(host), canInviteGuests(host), canModerate(host)]).toEqual([true, true, true]);
  });

  it('refuses everything when the event does not exist', () => {
    const gone = access({ exists: false, isHost: true, isCoHost: true, coHostPermissions: { can_edit: true } });
    expect([canEditEvent(gone), canInviteGuests(gone), canModerate(gone)]).toEqual([false, false, false]);
  });

  it('never grants delete to a co-host, whatever their permissions say', () => {
    // Deletion is host-only by design. No permission key escalates to it.
    expect(canDeleteEvent(coHost({ can_edit: true, can_moderate: true }))).toBe(false);
  });
});

/**
 * GAP-INV-14: appearing on a guest list is not the same as attending.
 *
 * `isEventParticipant` returned true for any guest row regardless of RSVP, so
 * someone who had explicitly declined, or who was merely invited and never
 * replied, counted as a participant. Four endpoints in server/routes/polls.ts
 * gate on it, so a declined guest could read, create and vote on that event's
 * polls.
 */
describe('event participation requires an accepted RSVP', () => {
  const guest = (rsvp: string | null) =>
    access({ isGuest: true, guestRsvpStatus: rsvp });

  it('admits a guest who accepted', () => {
    expect(isEventParticipant(guest('accepted'))).toBe(true);
  });

  it('admits "confirmed", which is legacy vocabulary for accepted', () => {
    // Both spellings exist in live data; events.ts counts them together too.
    expect(isEventParticipant(guest('confirmed'))).toBe(true);
  });

  it('is case-insensitive, since the column is free text', () => {
    expect(isEventParticipant(guest('Accepted'))).toBe(true);
  });

  it('refuses a guest who declined', () => {
    // The headline defect: a declined guest could vote in the poll.
    expect(isEventParticipant(guest('declined'))).toBe(false);
  });

  it('refuses a guest who has not replied', () => {
    expect(isEventParticipant(guest('pending'))).toBe(false);
  });

  it('refuses "maybe", which is not attendance', () => {
    expect(isEventParticipant(guest('maybe'))).toBe(false);
  });

  it('refuses a guest row with no RSVP recorded', () => {
    expect(isEventParticipant(guest(null))).toBe(false);
  });

  it('still admits the host and co-hosts, who run the event', () => {
    expect(isEventParticipant(access({ isHost: true }))).toBe(true);
    expect(isEventParticipant(access({ isCoHost: true }))).toBe(true);
  });

  it('refuses everyone when the event does not exist', () => {
    expect(isEventParticipant(access({ exists: false, isHost: true }))).toBe(false);
  });
});
