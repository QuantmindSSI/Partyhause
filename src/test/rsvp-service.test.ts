import { createHash } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { RsvpService } from '../../server/lib/rsvp';

const now = new Date('2030-01-01T00:00:00.000Z');
const token = Buffer.alloc(32, 7).toString('base64url');
const hash = createHash('sha256').update(token).digest('hex');

function invitation(overrides: Record<string, unknown> = {}) {
  return {
    event_id: 'event-1',
    expires_at: new Date('2030-02-01T20:00:00.000Z'),
    revoked_at: null,
    event: {
      id: 'event-1',
      name: 'Dinner',
      start_date: new Date('2030-02-01T18:00:00.000Z'),
      end_date: new Date('2030-02-01T20:00:00.000Z'),
      timezone: 'UTC',
      location: 'Hall',
      status: 'published',
      privacy: 'private',
      is_public: false,
      cancelled_at: null,
      host: { name: 'Host Name', account_status: 'active' },
    },
    guest: {
      id: 'guest-1',
      event_id: 'event-1',
      rsvp_status: 'pending',
      rsvp_responded_at: null,
      revision: 1,
    },
    ...overrides,
  };
}

function databaseWithRows(...rows: Array<ReturnType<typeof invitation> | null>) {
  const guestInvitation = { findUnique: vi.fn() };
  for (const row of rows) guestInvitation.findUnique.mockResolvedValueOnce(row);
  const guest = { updateMany: vi.fn().mockResolvedValue({ count: 1 }) };
  const transaction = {
    $queryRaw: vi.fn().mockResolvedValue(rows.length > 0 ? [{ id: 'invitation-1' }] : []),
    guestInvitation,
    guest,
  };
  const database = {
    ...transaction,
    $transaction: vi.fn(async (work: (client: typeof transaction) => Promise<unknown>) => work(transaction)),
  } as unknown as PrismaClient;
  return { database, guest, guestInvitation, service: new RsvpService(database, () => now) };
}

describe('public RSVP service', () => {
  it('resolves a token without mutating or exposing guest identity', async () => {
    const fixture = databaseWithRows(invitation());
    const response = await fixture.service.resolve({ token });

    expect(response.body).toEqual({
      event: {
        name: 'Dinner',
        hostName: 'Host Name',
        start: '2030-02-01T18:00:00.000Z',
        end: '2030-02-01T20:00:00.000Z',
        timezone: 'UTC',
        location: 'Hall',
      },
      rsvp: { status: 'pending', revision: 1, respondedAt: null },
    });
    expect(fixture.guestInvitation.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { token_hash: hash },
    }));
    expect(fixture.guest.updateMany).not.toHaveBeenCalled();
    expect(JSON.stringify(response.body)).not.toContain('guest-1');
  });

  it('updates only the existing token-bound guest using its revision', async () => {
    const respondedAt = now;
    const updated = invitation({
      guest: {
        id: 'guest-1',
        event_id: 'event-1',
        rsvp_status: 'maybe',
        rsvp_responded_at: respondedAt,
        revision: 2,
      },
    });
    const fixture = databaseWithRows(invitation(), updated);
    const response = await fixture.service.update({ token, status: 'maybe', expectedRevision: 1 });

    expect(fixture.guest.updateMany).toHaveBeenCalledWith({
      where: { id: 'guest-1', event_id: 'event-1', revision: 1 },
      data: { rsvp_status: 'maybe', rsvp_responded_at: now, revision: { increment: 1 } },
    });
    expect(response.body.rsvp).toEqual({ status: 'maybe', revision: 2, respondedAt: now.toISOString() });
  });

  it('replays the same state without rewriting its response timestamp', async () => {
    const firstResponseAt = new Date('2029-12-20T10:00:00.000Z');
    const current = invitation({
      guest: {
        id: 'guest-1',
        event_id: 'event-1',
        rsvp_status: 'accepted',
        rsvp_responded_at: firstResponseAt,
        revision: 4,
      },
    });
    const fixture = databaseWithRows(current);
    const response = await fixture.service.update({ token, status: 'accepted', expectedRevision: 1 });

    expect(response.body.rsvp).toEqual({
      status: 'accepted',
      revision: 4,
      respondedAt: firstResponseAt.toISOString(),
    });
    expect(fixture.guest.updateMany).not.toHaveBeenCalled();
  });

  it('rejects a different state submitted against a stale revision', async () => {
    const current = invitation({
      guest: {
        id: 'guest-1',
        event_id: 'event-1',
        rsvp_status: 'accepted',
        rsvp_responded_at: now,
        revision: 3,
      },
    });
    const fixture = databaseWithRows(current);

    await expect(fixture.service.update({ token, status: 'declined', expectedRevision: 2 }))
      .rejects.toMatchObject({ status: 409, code: 'REVISION_CONFLICT' });
    expect(fixture.guest.updateMany).not.toHaveBeenCalled();
  });

  it.each([
    ['unknown', null],
    ['expired', invitation({ expires_at: new Date('2029-12-31T23:59:59.000Z') })],
    ['revoked', invitation({ revoked_at: new Date('2029-12-31T00:00:00.000Z') })],
    ['cancelled', invitation({ event: { ...invitation().event, status: 'cancelled', cancelled_at: now } })],
  ])('returns the same unavailable result for an %s invitation', async (_label, row) => {
    const fixture = databaseWithRows(row);
    await expect(fixture.service.resolve({ token })).rejects.toMatchObject({
      status: 404,
      code: 'RSVP_UNAVAILABLE',
      message: 'This invitation is unavailable',
    });
  });

  it('returns the same unavailable result for a malformed token', async () => {
    const fixture = databaseWithRows();
    await expect(fixture.service.resolve({ token: 'short' })).rejects.toMatchObject({
      status: 404,
      code: 'RSVP_UNAVAILABLE',
      message: 'This invitation is unavailable',
    });
    expect(fixture.guestInvitation.findUnique).not.toHaveBeenCalled();
  });
});
