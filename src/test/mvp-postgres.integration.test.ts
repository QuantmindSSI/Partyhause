import { createHash, randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';

import { prisma } from '../../server/lib/prisma';
import { MvpEventsService } from '../../server/lib/mvp-events';
import { MvpGuestsService } from '../../server/lib/mvp-guests';

const databaseAvailable = Boolean(process.env.DATABASE_URL);
const eventService = new MvpEventsService(prisma);
const guestService = new MvpGuestsService(prisma);
const userIds: string[] = [];

function eventInput(name: string) {
  return {
    name,
    description: null,
    start: '2030-02-01T18:00:00.000Z',
    end: '2030-02-01T20:00:00.000Z',
    timezone: 'UTC',
    location: 'Test Hall',
  };
}

async function createUser(label: string): Promise<string> {
  const id = randomUUID();
  userIds.push(id);
  await prisma.user.create({
    data: { id, email: `${label}-${id}@mvp-integration.invalid`, name: label, email_verified: true },
  });
  return id;
}

afterAll(async () => {
  if (!databaseAvailable || userIds.length === 0) return;
  const events = await prisma.event.findMany({
    where: { host_id: { in: userIds } },
    select: { id: true },
  });
  const eventIds = events.map((event) => event.id);
  if (eventIds.length > 0) {
    await prisma.guest.deleteMany({ where: { event_id: { in: eventIds } } });
    await prisma.event.deleteMany({ where: { id: { in: eventIds } } });
  }
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
});

describe.skipIf(!databaseAvailable)('MVP PostgreSQL service integration', () => {
  it('persists the event, guest, idempotency, attendance, and cascade invariants', async () => {
    const hostId = await createUser('Host');
    const otherHostId = await createUser('Other Host');
    const created = await eventService.create(hostId, eventInput('Dinner'), 'event-create-key');
    const event = created.body.event;

    const replay = await eventService.create(hostId, eventInput('Dinner'), 'event-create-key');
    expect(replay).toEqual(created);
    expect(await prisma.event.count({ where: { host_id: hostId, name: 'Dinner' } })).toBe(1);
    await expect(eventService.create(
      hostId,
      eventInput('Different dinner'),
      'event-create-key',
    )).rejects.toMatchObject({ code: 'IDEMPOTENCY_KEY_CONFLICT' });
    await expect(eventService.get(otherHostId, event.id)).rejects.toMatchObject({
      status: 404,
      code: 'EVENT_NOT_FOUND',
    });

    const edited = await eventService.update(hostId, event.id, {
      location: 'Updated Hall',
      expectedRevision: event.revision,
    });
    await expect(eventService.update(hostId, event.id, {
      location: 'Stale Hall',
      expectedRevision: event.revision,
    })).rejects.toMatchObject({ code: 'REVISION_CONFLICT' });
    const published = await eventService.publish(
      hostId,
      event.id,
      { expectedRevision: edited.body.event.revision },
      'event-publish-key',
    );
    expect(published.body.event.status).toBe('published');

    const firstGuest = await guestService.create(
      hostId,
      event.id,
      { name: 'Ada', email: ' ADA@Example.COM ' },
      'guest-create-key',
    );
    const guest = firstGuest.body.guests[0];
    const duplicate = await guestService.create(
      hostId,
      event.id,
      { name: 'Duplicate Ada', email: 'ada@example.com' },
      'guest-duplicate-key',
    );
    expect(duplicate.status).toBe(200);
    expect(duplicate.body.guests[0].id).toBe(guest.id);
    expect(duplicate.body.guests[0].email).toBe('ada@example.com');

    await expect(guestService.checkIn(
      hostId,
      guest.id,
      { expectedRevision: guest.revision },
      'pending-check-in-key',
    )).rejects.toMatchObject({ code: 'GUEST_NOT_ACCEPTED' });
    const accepted = await prisma.guest.update({
      where: { id: guest.id },
      data: { rsvp_status: 'accepted', revision: { increment: 1 } },
    });
    const checked = await guestService.checkIn(
      hostId,
      guest.id,
      { expectedRevision: accepted.revision },
      'accepted-check-in-key',
    );
    const repeated = await guestService.checkIn(
      hostId,
      guest.id,
      { expectedRevision: accepted.revision },
      'accepted-check-in-key',
    );
    expect(repeated).toEqual(checked);
    expect(await prisma.attendanceAudit.count({ where: { guest_id: guest.id } })).toBe(1);

    const corrected = await guestService.correctCheckIn(
      hostId,
      guest.id,
      { expectedRevision: checked.body.guest.revision, checkedIn: false },
      'attendance-correction-key',
    );
    expect(corrected.body.guest.checkedIn).toBe(false);
    expect(await prisma.attendanceAudit.count({ where: { guest_id: guest.id } })).toBe(2);

    await prisma.guestInvitation.create({
      data: {
        guest_id: guest.id,
        event_id: event.id,
        token_hash: createHash('sha256').update(randomUUID()).digest('hex'),
        expires_at: new Date('2030-02-01T20:00:00.000Z'),
      },
    });
    await guestService.remove(
      hostId,
      guest.id,
      { expectedRevision: corrected.body.guest.revision },
      'guest-remove-key',
    );
    expect(await prisma.guestInvitation.findUnique({ where: { guest_id: guest.id } })).toBeNull();

    const cancellationGuest = await guestService.create(
      hostId,
      event.id,
      { name: 'Grace', email: 'grace@example.com' },
      'cancellation-guest-key',
    );
    const cancellationGuestId = cancellationGuest.body.guests[0].id;
    await prisma.guestInvitation.create({
      data: {
        guest_id: cancellationGuestId,
        event_id: event.id,
        token_hash: createHash('sha256').update(randomUUID()).digest('hex'),
        expires_at: new Date('2030-02-01T20:00:00.000Z'),
      },
    });

    await expect(eventService.remove(
      hostId,
      event.id,
      { expectedRevision: published.body.event.revision },
      'published-delete-key',
    )).rejects.toMatchObject({ code: 'EVENT_NOT_DELETABLE' });
    const cancelled = await eventService.cancel(
      hostId,
      event.id,
      { expectedRevision: published.body.event.revision },
      'event-cancel-key',
    );
    expect(await prisma.guestInvitation.findUnique({
      where: { guest_id: cancellationGuestId },
    })).toMatchObject({ revoked_at: expect.any(Date) });
    const deleted = await eventService.remove(
      hostId,
      event.id,
      { expectedRevision: cancelled.body.event.revision },
      'event-delete-key',
    );
    expect(deleted.body).toEqual({ deleted: true, eventId: event.id });
  });

  it('converges concurrent retries and normalized duplicate guest inserts', async () => {
    const hostId = await createUser('Concurrent Host');
    const [firstEvent, replayedEvent] = await Promise.all([
      eventService.create(hostId, eventInput('Concurrent Event'), 'concurrent-event-key'),
      eventService.create(hostId, eventInput('Concurrent Event'), 'concurrent-event-key'),
    ]);
    expect(replayedEvent).toEqual(firstEvent);
    expect(await prisma.event.count({
      where: { host_id: hostId, name: 'Concurrent Event' },
    })).toBe(1);

    const eventId = firstEvent.body.event.id;
    const [firstGuest, duplicateGuest] = await Promise.all([
      guestService.create(
        hostId,
        eventId,
        { name: 'Ada One', email: 'ADA@EXAMPLE.COM' },
        'concurrent-guest-one',
      ),
      guestService.create(
        hostId,
        eventId,
        { name: 'Ada Two', email: ' ada@example.com ' },
        'concurrent-guest-two',
      ),
    ]);
    expect(duplicateGuest.body.guests[0].id).toBe(firstGuest.body.guests[0].id);
    expect(await prisma.guest.count({ where: { event_id: eventId } })).toBe(1);

    const fill = Array.from({ length: 48 }, (_, index) => ({
      name: `Concurrent Guest ${index + 2}`,
      email: `concurrent-${index + 2}@capacity.invalid`,
    }));
    await guestService.create(hostId, eventId, { guests: fill }, 'concurrent-fill-key');
    const [finalGuest, finalDuplicate] = await Promise.all([
      guestService.create(
        hostId,
        eventId,
        { name: 'Final One', email: 'FINAL@CAPACITY.INVALID' },
        'concurrent-final-one',
      ),
      guestService.create(
        hostId,
        eventId,
        { name: 'Final Two', email: ' final@capacity.invalid ' },
        'concurrent-final-two',
      ),
    ]);
    expect(finalDuplicate.body.guests[0].id).toBe(finalGuest.body.guests[0].id);
    expect(await prisma.guest.count({ where: { event_id: eventId } })).toBe(50);
  });

  it('keeps batch insertion atomic at 50 and resolves duplicates at capacity', async () => {
    const hostId = await createUser('Capacity Host');
    const created = await eventService.create(hostId, eventInput('Capacity'), 'capacity-event-key');
    const eventId = created.body.event.id;
    const firstFortyNine = Array.from({ length: 49 }, (_, index) => ({
      name: `Guest ${index + 1}`,
      email: `guest-${index + 1}@capacity.invalid`,
    }));
    await guestService.create(hostId, eventId, { guests: firstFortyNine }, 'first-batch-key');

    await expect(guestService.create(hostId, eventId, {
      guests: [
        { name: 'Guest 50', email: 'guest-50@capacity.invalid' },
        { name: 'Guest 51', email: 'guest-51@capacity.invalid' },
      ],
    }, 'cross-cap-key')).rejects.toMatchObject({ code: 'GUEST_LIMIT_REACHED' });
    expect(await prisma.guest.count({ where: { event_id: eventId } })).toBe(49);

    await guestService.create(
      hostId,
      eventId,
      { name: 'Guest 50', email: 'guest-50@capacity.invalid' },
      'final-slot-key',
    );
    const duplicate = await guestService.create(
      hostId,
      eventId,
      { name: 'Guest 50 duplicate', email: ' GUEST-50@CAPACITY.INVALID ' },
      'at-cap-duplicate-key',
    );
    expect(duplicate.status).toBe(200);
    expect(await prisma.guest.count({ where: { event_id: eventId } })).toBe(50);
    await expect(guestService.create(
      hostId,
      eventId,
      { name: 'Guest 51', email: 'guest-51@capacity.invalid' },
      'over-cap-key',
    )).rejects.toMatchObject({ code: 'GUEST_LIMIT_REACHED' });
  });
});
