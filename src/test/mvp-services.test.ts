import type { PrismaClient } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { MvpEventsService } from '../../server/lib/mvp-events';
import { MvpGuestsService } from '../../server/lib/mvp-guests';

const now = new Date('2030-01-01T00:00:00.000Z');

function eventRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'event-1',
    name: 'Dinner',
    description: null,
    start_date: new Date('2030-02-01T18:00:00.000Z'),
    end_date: new Date('2030-02-01T20:00:00.000Z'),
    timezone: 'UTC',
    location: 'Hall',
    status: 'draft',
    privacy: 'private',
    max_guests: 50,
    revision: 1,
    published_at: null,
    cancelled_at: null,
    completed_at: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

function guestRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'guest-1',
    event_id: 'event-1',
    name: 'Ada',
    email: 'ada@example.com',
    normalized_email: 'ada@example.com',
    rsvp_status: 'accepted',
    rsvp_responded_at: now,
    checked_in: false,
    checked_in_at: null,
    revision: 1,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

function databaseWithTransaction(transaction: Record<string, unknown>): PrismaClient {
  return {
    ...transaction,
    $transaction: vi.fn(async (work: (client: typeof transaction) => Promise<unknown>) => work(transaction)),
  } as unknown as PrismaClient;
}

function commandModel() {
  return {
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({ id: 'command-1' }),
    update: vi.fn().mockResolvedValue({ id: 'command-1' }),
  };
}

describe('MVP event service', () => {
  it('scopes reads to the host and returns privacy-safe not found', async () => {
    const event = { findFirst: vi.fn().mockResolvedValue(null) };
    const service = new MvpEventsService({ event } as unknown as PrismaClient);

    await expect(service.get('other-host', 'event-1')).rejects.toMatchObject({
      status: 404,
      code: 'EVENT_NOT_FOUND',
    });
    expect(event.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 'event-1', host_id: 'other-host' }),
    }));
  });

  it('creates only a private draft owned by the authenticated actor', async () => {
    const event = { create: vi.fn().mockResolvedValue(eventRow()) };
    const transaction = { event, mvpCommand: commandModel() };
    const service = new MvpEventsService(databaseWithTransaction(transaction));

    const response = await service.create('host-1', {
      name: 'Dinner',
      description: null,
      start: '2030-02-01T18:00:00.000Z',
      end: '2030-02-01T20:00:00.000Z',
      timezone: 'UTC',
      location: 'Hall',
    }, 'create-key');

    expect(response.status).toBe(201);
    expect(event.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        host_id: 'host-1',
        status: 'draft',
        privacy: 'private',
        is_public: false,
        max_guests: 50,
        revision: 1,
      }),
    }));
  });

  it('uses revision compare-and-swap and reports a stale edit', async () => {
    const event = {
      findFirst: vi.fn().mockResolvedValue(eventRow()),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    };
    const service = new MvpEventsService(databaseWithTransaction({ event }));

    await expect(service.update('host-1', 'event-1', {
      location: 'New hall',
      expectedRevision: 1,
    })).rejects.toMatchObject({ status: 409, code: 'REVISION_CONFLICT' });
    expect(event.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 'event-1', host_id: 'host-1', revision: 1 }),
    }));
  });

  it('publishes only a draft and increments its revision', async () => {
    const event = {
      findFirst: vi.fn()
        .mockResolvedValueOnce(eventRow())
        .mockResolvedValueOnce(eventRow({ status: 'published', revision: 2, published_at: now })),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    };
    const transaction = { event, mvpCommand: commandModel() };
    const service = new MvpEventsService(databaseWithTransaction(transaction));

    const response = await service.publish(
      'host-1',
      'event-1',
      { expectedRevision: 1 },
      'publish-key',
    );

    expect(response.body.event.status).toBe('published');
    expect(response.body.event.revision).toBe(2);
    expect(event.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ revision: 1, status: 'draft' }),
      data: expect.objectContaining({ status: 'published', revision: { increment: 1 } }),
    }));
  });

  it('rejects an invalid cancellation transition', async () => {
    const event = { findFirst: vi.fn().mockResolvedValue(eventRow()) };
    const transaction = { event, mvpCommand: commandModel() };
    const service = new MvpEventsService(databaseWithTransaction(transaction));

    await expect(service.cancel(
      'host-1',
      'event-1',
      { expectedRevision: 1 },
      'cancel-key',
    )).rejects.toMatchObject({ status: 409, code: 'INVALID_EVENT_TRANSITION' });
  });

  it('cancels a published event and revokes its active RSVP credentials', async () => {
    const event = {
      findFirst: vi.fn()
        .mockResolvedValueOnce(eventRow({ status: 'published', revision: 2, published_at: now }))
        .mockResolvedValueOnce(eventRow({ status: 'cancelled', revision: 3, published_at: now, cancelled_at: now })),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    };
    const guestInvitation = { updateMany: vi.fn().mockResolvedValue({ count: 2 }) };
    const transaction = { event, guestInvitation, mvpCommand: commandModel() };
    const service = new MvpEventsService(databaseWithTransaction(transaction));

    const response = await service.cancel(
      'host-1',
      'event-1',
      { expectedRevision: 2 },
      'cancel-published-key',
    );

    expect(response.body.event.status).toBe('cancelled');
    expect(guestInvitation.updateMany).toHaveBeenCalledWith({
      where: { event_id: 'event-1', revoked_at: null },
      data: { revoked_at: expect.any(Date) },
    });
  });

  it('allows deletion only for draft, completed, or cancelled events', async () => {
    const event = { findFirst: vi.fn().mockResolvedValue(eventRow({ status: 'published' })) };
    const transaction = { event, mvpCommand: commandModel() };
    const service = new MvpEventsService(databaseWithTransaction(transaction));

    await expect(service.remove(
      'host-1',
      'event-1',
      { expectedRevision: 1 },
      'delete-key',
    )).rejects.toMatchObject({ status: 409, code: 'EVENT_NOT_DELETABLE' });
  });

  it.each(['draft', 'completed', 'cancelled'])('deletes an event in %s state', async (status) => {
    const event = {
      findFirst: vi.fn().mockResolvedValue(eventRow({ status })),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    };
    const guest = { deleteMany: vi.fn().mockResolvedValue({ count: 2 }) };
    const transaction = { event, guest, mvpCommand: commandModel() };
    const service = new MvpEventsService(databaseWithTransaction(transaction));

    const response = await service.remove(
      'host-1',
      'event-1',
      { expectedRevision: 1 },
      `delete-${status}`,
    );

    expect(response).toEqual({ status: 200, body: { deleted: true, eventId: 'event-1' } });
    expect(event.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ revision: 1, status: { in: ['draft', 'completed', 'cancelled'] } }),
    }));
    expect(guest.deleteMany).toHaveBeenCalledWith({ where: { event_id: 'event-1' } });
    expect(event.deleteMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ revision: 2 }),
    }));
  });
});

describe('MVP guest service', () => {
  it('uses privacy-safe 404 behavior for a guest outside the host boundary', async () => {
    const guest = { findUnique: vi.fn().mockResolvedValue(guestRow()) };
    const event = { findFirst: vi.fn().mockResolvedValue(null) };
    const service = new MvpGuestsService(databaseWithTransaction({ event, guest }));

    await expect(service.get('other-host', 'guest-1')).rejects.toMatchObject({
      status: 404,
      code: 'GUEST_NOT_FOUND',
    });
    expect(event.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 'event-1', host_id: 'other-host' }),
    }));
  });
  it('returns an existing normalized duplicate without inserting or consuming capacity', async () => {
    const existing = guestRow({ email: 'Ada@Example.com', normalized_email: 'ada@example.com' });
    const guest = {
      findMany: vi.fn().mockResolvedValue([existing]),
      count: vi.fn().mockResolvedValue(50),
      createManyAndReturn: vi.fn(),
    };
    const event = { findFirst: vi.fn().mockResolvedValue({ id: 'event-1', status: 'draft', max_guests: 50 }) };
    const transaction = { event, guest, mvpCommand: commandModel() };
    const service = new MvpGuestsService(databaseWithTransaction(transaction));

    const response = await service.create(
      'host-1',
      'event-1',
      { name: 'Ada Again', email: ' ADA@example.com ' },
      'guest-key',
    );

    expect(response.status).toBe(200);
    expect(response.body.createdCount).toBe(0);
    expect(response.body.guests[0].id).toBe('guest-1');
    expect(guest.createManyAndReturn).not.toHaveBeenCalled();
  });

  it('rejects a batch crossing the 50 guest cap before any insert', async () => {
    const guest = {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(49),
      createManyAndReturn: vi.fn(),
    };
    const event = { findFirst: vi.fn().mockResolvedValue({ id: 'event-1', status: 'draft', max_guests: 50 }) };
    const transaction = { event, guest, mvpCommand: commandModel() };
    const service = new MvpGuestsService(databaseWithTransaction(transaction));

    await expect(service.create('host-1', 'event-1', {
      guests: [
        { name: 'Ada', email: 'ada@example.com' },
        { name: 'Grace', email: 'grace@example.com' },
      ],
    }, 'batch-key')).rejects.toMatchObject({ status: 409, code: 'GUEST_LIMIT_REACHED' });
    expect(guest.createManyAndReturn).not.toHaveBeenCalled();
  });

  it('records one accepted-guest check-in and preserves the same timestamp on repeat', async () => {
    const checkedAt = new Date('2030-02-01T18:01:00.000Z');
    const initial = guestRow();
    const updated = guestRow({ checked_in: true, checked_in_at: checkedAt, revision: 2 });
    const guest = {
      findUnique: vi.fn().mockResolvedValueOnce(initial).mockResolvedValueOnce(updated),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    };
    const event = { findFirst: vi.fn().mockResolvedValue({ id: 'event-1', status: 'published', max_guests: 50 }) };
    const attendanceAudit = { create: vi.fn().mockResolvedValue({ id: 'audit-1' }) };
    const transaction = { event, guest, attendanceAudit, mvpCommand: commandModel() };
    const service = new MvpGuestsService(databaseWithTransaction(transaction));

    const response = await service.checkIn('host-1', 'guest-1', { expectedRevision: 1 }, 'check-in-key');

    expect(response.body.guest.checkedInAt).toBe(checkedAt.toISOString());
    expect(attendanceAudit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'check_in',
        prior_state: false,
        new_state: true,
        guest_revision: 2,
      }),
    });

    const repeatedGuest = guestRow({ checked_in: true, checked_in_at: checkedAt, revision: 2 });
    const repeatGuestModel = {
      findUnique: vi.fn().mockResolvedValue(repeatedGuest),
      updateMany: vi.fn(),
    };
    const repeatAudit = { create: vi.fn() };
    const repeatTransaction = {
      event,
      guest: repeatGuestModel,
      attendanceAudit: repeatAudit,
      mvpCommand: commandModel(),
    };
    const repeatService = new MvpGuestsService(databaseWithTransaction(repeatTransaction));
    const repeat = await repeatService.checkIn(
      'host-1',
      'guest-1',
      { expectedRevision: 1 },
      'second-check-in-key',
    );

    expect(repeat.body.guest.checkedInAt).toBe(checkedAt.toISOString());
    expect(repeatGuestModel.updateMany).not.toHaveBeenCalled();
    expect(repeatAudit.create).not.toHaveBeenCalled();
  });

  it('rejects check-in for an unaccepted guest or an unpublished event', async () => {
    const event = { findFirst: vi.fn().mockResolvedValue({ id: 'event-1', status: 'published', max_guests: 50 }) };
    const guest = { findUnique: vi.fn().mockResolvedValue(guestRow({ rsvp_status: 'pending' })) };
    const transaction = { event, guest, mvpCommand: commandModel() };
    const service = new MvpGuestsService(databaseWithTransaction(transaction));

    await expect(service.checkIn(
      'host-1',
      'guest-1',
      { expectedRevision: 1 },
      'pending-key',
    )).rejects.toMatchObject({ status: 409, code: 'GUEST_NOT_ACCEPTED' });

    event.findFirst.mockResolvedValue({ id: 'event-1', status: 'draft', max_guests: 50 });
    guest.findUnique.mockResolvedValue(guestRow());
    await expect(service.checkIn(
      'host-1',
      'guest-1',
      { expectedRevision: 1 },
      'draft-key',
    )).rejects.toMatchObject({ status: 409, code: 'EVENT_NOT_PUBLISHED' });
  });

  it('records an explicit correction with its prior and new state', async () => {
    const initial = guestRow({ checked_in: true, checked_in_at: now, revision: 2 });
    const corrected = guestRow({ checked_in: false, checked_in_at: null, revision: 3 });
    const guest = {
      findUnique: vi.fn().mockResolvedValueOnce(initial).mockResolvedValueOnce(corrected),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    };
    const event = { findFirst: vi.fn().mockResolvedValue({ id: 'event-1', status: 'published', max_guests: 50 }) };
    const attendanceAudit = { create: vi.fn().mockResolvedValue({ id: 'audit-2' }) };
    const transaction = { event, guest, attendanceAudit, mvpCommand: commandModel() };
    const service = new MvpGuestsService(databaseWithTransaction(transaction));

    const response = await service.correctCheckIn(
      'host-1',
      'guest-1',
      { checkedIn: false, expectedRevision: 2 },
      'correction-key',
    );

    expect(response.body.guest.checkedIn).toBe(false);
    expect(attendanceAudit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'correction',
        prior_state: true,
        new_state: false,
        guest_revision: 3,
      }),
    });
  });

  it('uses guest revision compare-and-swap for profile edits', async () => {
    const guest = {
      findUnique: vi.fn().mockResolvedValue(guestRow()),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    };
    const event = { findFirst: vi.fn().mockResolvedValue({ id: 'event-1', status: 'draft', max_guests: 50 }) };
    const service = new MvpGuestsService(databaseWithTransaction({ event, guest }));

    await expect(service.update('host-1', 'guest-1', {
      name: 'Ada B',
      expectedRevision: 1,
    })).rejects.toMatchObject({ status: 409, code: 'REVISION_CONFLICT' });
    expect(guest.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'guest-1', event_id: 'event-1', revision: 1 },
    }));
  });
});
