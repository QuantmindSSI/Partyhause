/**
 * Tests for event serialisation.
 *
 * WHY THIS EXISTS
 *   Routes returned raw Prisma rows. `res.json({ event })` handed every column
 *   to anyone who could read the event, and each route separately re-derived,
 *   or forgot to re-derive, what that caller was allowed to see.
 *
 *   Two blockers came straight out of that. GAP-EVT-13: a readable event
 *   returned the full row plus host-oriented counts to every actor.
 *   GAP-PLAN-02: full event reads exposed the JSON timeline and host notes to
 *   guests, even though /api/timeline filtered them correctly.
 *
 *   The second is the interesting one. `Event.timeline_blocks` is an untyped
 *   Json column. `TimelineBlock` is a relational table carrying `guest_visible`
 *   and `host_notes`. The blob cannot express either, so it is not that the
 *   filtering was wrong, it is that a representation existed which could not be
 *   filtered at all. Hence the P3 decision: relational wins and the column is
 *   never serialised.
 *
 * WHAT IS ASSERTED
 *   The allowlist holds under pressure. A guest never receives host fields, and
 *   specifically never receives `timeline_blocks` no matter what the row
 *   contains. Capabilities are reported explicitly so clients stop inferring
 *   them. And a column added to Event does not silently reach a guest, which is
 *   the regression this layer exists to prevent.
 */

import { describe, it, expect } from 'vitest';
import {
  serialiseEvent,
  serialiseEventList,
  capabilitiesOf,
  relationshipOf,
} from '../../server/lib/event-dto';
import type { EventAccess } from '../../server/lib/event-access';

function access(over: Partial<EventAccess> = {}): EventAccess {
  return {
    exists: true,
    isHost: false,
    isCoHost: false,
    coHostPermissions: null,
    isGuest: false,
    isPublic: false,
    hostId: 'host-1',
    ...over,
  } as EventAccess;
}

/** A row shaped like the raw Prisma record, host-private fields included. */
const row = {
  id: 'evt-1',
  host_id: 'host-1',
  name: 'Rooftop',
  description: 'bring a coat',
  start_date: new Date('2026-10-01T18:00:00Z'),
  end_date: null,
  timezone: 'Europe/London',
  location: 'E1',
  event_type: 'party',
  template_type: 'birthday',
  privacy: 'private',
  status: 'draft',
  cover_image_url: null,
  created_at: new Date('2026-09-01T00:00:00Z'),
  // Host-private below this line.
  timeline_blocks: [{ label: 'Speech', host_notes: 'remind Dad to keep it short' }],
  settings: { secret: true },
  template_data: { budget_note: 'do not tell guests' },
  capacity: 40,
  budget: { total: 900 },
};

const HOST_ONLY = ['settings', 'template_data', 'capacity', 'budget'];

describe('the timeline JSON column never reaches a client', () => {
  it('is absent for a guest', () => {
    const event = serialiseEvent(row, access({ isGuest: true }));
    expect(event).not.toHaveProperty('timeline_blocks');
  });

  it('is absent for a host too, who must read /api/timeline like everyone else', () => {
    // The relational table is the only representation that carries
    // guest_visible. Emitting the blob to hosts would keep the second source of
    // truth alive and let clients drift back onto it.
    const event = serialiseEvent(row, access({ isHost: true }));
    expect(event).not.toHaveProperty('timeline_blocks');
  });

  it('does not leak host_notes through any surviving field', () => {
    const event = serialiseEvent(row, access({ isGuest: true }));
    expect(JSON.stringify(event)).not.toContain('remind Dad');
  });
});

describe('host-only fields are withheld from non-hosts', () => {
  it('a guest receives none of them', () => {
    const event = serialiseEvent(row, access({ isGuest: true }));
    for (const f of HOST_ONLY) expect(event).not.toHaveProperty(f);
  });

  it('a public viewer receives none of them', () => {
    const event = serialiseEvent(row, access({ isPublic: true }));
    for (const f of HOST_ONLY) expect(event).not.toHaveProperty(f);
  });

  it('a host receives all of them', () => {
    const event = serialiseEvent(row, access({ isHost: true }));
    for (const f of HOST_ONLY) expect(event).toHaveProperty(f);
  });

  it('a co-host receives them, since they help run the event', () => {
    const event = serialiseEvent(row, access({ isCoHost: true }));
    for (const f of HOST_ONLY) expect(event).toHaveProperty(f);
  });
});

describe('an unknown column cannot leak by being added to the schema', () => {
  it('is dropped for a guest even though it is present on the row', () => {
    // This is the regression the layer exists to prevent. Before it, adding a
    // column to Event silently widened every response.
    const widened = { ...row, internal_risk_notes: 'venue has a noise complaint' };
    const event = serialiseEvent(widened, access({ isGuest: true }));
    expect(event).not.toHaveProperty('internal_risk_notes');
    expect(JSON.stringify(event)).not.toContain('noise complaint');
  });
});

describe('capabilities are stated, not inferred', () => {
  it('gives a host everything', () => {
    const c = capabilitiesOf(access({ isHost: true }));
    expect(c).toEqual({
      can_edit: true, can_delete: true, can_manage_guests: true,
      can_invite: true, can_view_insights: true,
    });
  });

  it('gives a guest nothing', () => {
    const c = capabilitiesOf(access({ isGuest: true }));
    expect(Object.values(c).every((v) => v === false)).toBe(true);
  });

  it('withholds insights from a guest, since decline counts are a disclosure', () => {
    expect(capabilitiesOf(access({ isGuest: true })).can_view_insights).toBe(false);
  });

  it('never grants delete to a co-host', () => {
    const c = capabilitiesOf(access({ isCoHost: true, coHostPermissions: { can_edit: true } }));
    expect(c.can_edit).toBe(true);
    expect(c.can_delete).toBe(false);
  });

  it('honours the co-host boolean the schema actually writes', () => {
    // Regression guard for GAP-EVT-09, where this was compared to 'true'.
    expect(capabilitiesOf(access({ isCoHost: true, coHostPermissions: { can_invite: true } })).can_invite).toBe(true);
  });
});

describe('relationship is reported so clients stop guessing', () => {
  it('ranks host above co-host above guest above public', () => {
    expect(relationshipOf(access({ isHost: true, isCoHost: true }))).toBe('host');
    expect(relationshipOf(access({ isCoHost: true, isGuest: true }))).toBe('co_host');
    expect(relationshipOf(access({ isGuest: true }))).toBe('guest');
    expect(relationshipOf(access({ isPublic: true }))).toBe('public');
  });
});

describe('list serialisation applies the same rules per row', () => {
  it('gives host shape to owned rows and public shape to the rest', () => {
    const mine = { ...row, id: 'mine', host_id: 'me' };
    const theirs = { ...row, id: 'theirs', host_id: 'someone-else' };
    const out = serialiseEventList([mine, theirs], (r) =>
      access({ isHost: r.host_id === 'me', isGuest: r.host_id !== 'me' }),
    );
    expect(out[0]).toHaveProperty('budget');
    expect(out[1]).not.toHaveProperty('budget');
    expect(out[1]).not.toHaveProperty('timeline_blocks');
  });
});
