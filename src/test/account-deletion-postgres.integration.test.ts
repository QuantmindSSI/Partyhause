import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { afterAll, describe, expect, it, vi } from 'vitest';

import { AccountService } from '../../server/lib/account';
import { prisma } from '../../server/lib/prisma';

const databaseAvailable = Boolean(process.env.DATABASE_URL);
const now = new Date('2030-01-01T12:00:00.000Z');
const password = 'deletion-password';
const createdUserIds: string[] = [];
const createdReceipts: string[] = [];

async function createUser(label: string) {
  const id = randomUUID();
  createdUserIds.push(id);
  await prisma.user.create({
    data: {
      id,
      email: `${label}-${id}@deletion.invalid`,
      name: label,
      password_hash: await bcrypt.hash(password, 4),
      email_verified: true,
      age_eligible: true,
      terms_version: '2026-09-06',
      privacy_version: '2026-09-06',
    },
  });
  await prisma.userProfile.create({
    data: { id, username: `u_${id.replace(/-/g, '').slice(0, 20)}`, display_name: label },
  });
  return id;
}

async function createEvent(hostId: string, name: string) {
  return prisma.event.create({
    data: {
      host_id: hostId,
      name,
      location: 'Test Hall',
      start_date: new Date('2030-02-01T18:00:00.000Z'),
      end_date: new Date('2030-02-01T20:00:00.000Z'),
      max_guests: 50,
    },
  });
}

afterAll(async () => {
  if (!databaseAvailable) return;
  await prisma.accountDeletionRequest.deleteMany({ where: { id: { in: createdReceipts } } });
  await prisma.userProfile.deleteMany({ where: { id: { in: createdUserIds } } });
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
});

describe.skipIf(!databaseAvailable)('account deletion PostgreSQL graph', () => {
  it('revokes first, retries the same receipt, erases owned data, and preserves cross-owned guest facts', async () => {
    const hostId = await createUser('Deleting Host');
    const otherId = await createUser('Other Host');
    const hostedEvent = await createEvent(hostId, 'Hosted event');
    const otherEvent = await createEvent(otherId, 'Other event');
    await prisma.event.update({
      where: { id: hostedEvent.id },
      data: {
        invite_image_url: `https://stphgipkzrenusqpy.blob.core.windows.net/event-invites/${hostId}/invite.png`,
      },
    });

    const hostedGuest = await prisma.guest.create({
      data: {
        event_id: hostedEvent.id,
        name: 'Hosted Guest',
        email: 'hosted-guest@deletion.invalid',
        normalized_email: 'hosted-guest@deletion.invalid',
        dietary_restrictions: [],
      },
    });
    const crossOwnedGuest = await prisma.guest.create({
      data: {
        event_id: otherEvent.id,
        name: 'Deleting Host As Guest',
        email: `deleting-${hostId}@deletion.invalid`,
        normalized_email: `deleting-${hostId}@deletion.invalid`,
        user_id: hostId,
        rsvp_status: 'accepted',
        dietary_restrictions: [],
      },
    });
    const hostedInvitation = await prisma.guestInvitation.create({
      data: {
        guest_id: hostedGuest.id,
        event_id: hostedEvent.id,
        token_hash: 'a'.repeat(64),
        expires_at: new Date('2030-03-01T00:00:00.000Z'),
      },
    });
    const foreignInvitation = await prisma.guestInvitation.create({
      data: {
        guest_id: crossOwnedGuest.id,
        event_id: otherEvent.id,
        token_hash: 'b'.repeat(64),
        expires_at: new Date('2030-03-01T00:00:00.000Z'),
      },
    });
    await prisma.eventInviteToken.create({
      data: {
        event_id: hostedEvent.id,
        token: `legacy-${randomUUID()}`,
        token_type: 'guest_join',
        created_by: hostId,
        allowed_emails: [],
      },
    });
    const vendor = await prisma.vendor.create({
      data: { event_id: otherEvent.id, name: 'Venue', role: 'venue' },
    });
    const vendorTask = await prisma.vendorTask.create({
      data: { vendor_id: vendor.id, description: 'Call venue', assigned_to: hostId },
    });
    const timeline = await prisma.timelineBlock.create({
      data: {
        event_id: otherEvent.id,
        label: 'Doors',
        start_time: new Date('2030-02-01T18:00:00.000Z'),
        duration: 30,
        type: 'activity',
        assigned_to: [hostId, otherId],
        order_index: 0,
      },
    });
    await prisma.eventCoHost.create({
      data: { event_id: otherEvent.id, user_id: hostId },
    });
    await prisma.media.create({
      data: {
        event_id: otherEvent.id,
        uploader_id: hostId,
        type: 'photo',
        url: 'https://example.invalid/legacy-image.jpg',
        tags: [],
      },
    });
    const activity = await prisma.activity.create({
      data: { event_id: otherEvent.id, type: 'poll', title: 'Legacy activity' },
    });
    await prisma.activityParticipant.create({
      data: { activity_id: activity.id, user_id: hostId },
    });
    const poll = await prisma.poll.create({
      data: { event_id: otherEvent.id, created_by: hostId, question: 'Legacy poll', poll_type: 'single-choice' },
    });
    const option = await prisma.pollOption.create({ data: { poll_id: poll.id, text: 'Yes' } });
    await prisma.pollVote.create({ data: { poll_id: poll.id, option_id: option.id, user_id: otherId } });
    const command = await prisma.mvpCommand.create({
      data: {
        actor_id: hostId,
        idempotency_key: randomUUID(),
        operation: 'test',
        request_hash: 'c'.repeat(64),
        expires_at: new Date('2030-01-02T12:00:00.000Z'),
      },
    });
    await prisma.invitationDelivery.create({
      data: {
        command_id: command.id,
        invitation_id: foreignInvitation.id,
        event_id: otherEvent.id,
        guest_id: crossOwnedGuest.id,
        provider: 'test',
      },
    });
    await prisma.attendanceAudit.create({
      data: {
        event_id: otherEvent.id,
        guest_id: crossOwnedGuest.id,
        actor_id: hostId,
        command_id: command.id,
        action: 'check_in',
        prior_state: false,
        new_state: true,
        guest_revision: 1,
      },
    });

    let failBlobDeletion = true;
    const blobDelete = vi.fn(async () => {
      if (failBlobDeletion) throw new Error('injected blob failure');
      return 1;
    });
    const service = new AccountService(prisma, () => now, blobDelete);
    const intent = await service.createDeletionIntent(hostId, password);
    createdReceipts.push(intent.receipt);

    const failed = await service.confirmDeletion(intent.receipt, 'DELETE');
    const inaccessible = await prisma.user.findUnique({ where: { id: hostId } });
    const revokedInvitation = await prisma.guestInvitation.findUnique({ where: { id: hostedInvitation.id } });
    expect(failed).toMatchObject({ receipt: intent.receipt, status: 'failed', retryable: true });
    expect(inaccessible).toMatchObject({ account_status: 'deletion_pending', token_version: 1 });
    expect(revokedInvitation?.revoked_at).toEqual(now);

    failBlobDeletion = false;
    expect(await service.retryInterruptedDeletions()).toBe(1);
    const completed = await service.status(intent.receipt);
    const repeated = await service.confirmDeletion(intent.receipt, 'DELETE');

    expect(completed.status).toBe('completed');
    expect(repeated).toEqual(completed);
    expect(await prisma.user.findUnique({ where: { id: hostId } })).toBeNull();
    expect(await prisma.userProfile.findUnique({ where: { id: hostId } })).toBeNull();
    expect(await prisma.event.findUnique({ where: { id: hostedEvent.id } })).toBeNull();
    expect(await prisma.guest.findUnique({ where: { id: hostedGuest.id } })).toBeNull();
    expect(await prisma.guest.findUnique({ where: { id: crossOwnedGuest.id } })).toMatchObject({ user_id: null });
    expect(await prisma.vendorTask.findUnique({ where: { id: vendorTask.id } })).toMatchObject({ assigned_to: null });
    expect(await prisma.timelineBlock.findUnique({ where: { id: timeline.id } })).toMatchObject({ assigned_to: [otherId] });
    expect(await prisma.media.count({ where: { uploader_id: hostId } })).toBe(0);
    expect(await prisma.eventCoHost.count({ where: { user_id: hostId } })).toBe(0);
    expect(await prisma.activityParticipant.count({ where: { user_id: hostId } })).toBe(0);
    expect(await prisma.poll.count({ where: { created_by: hostId } })).toBe(0);
    expect(await prisma.mvpCommand.count({ where: { actor_id: hostId } })).toBe(0);
    expect(await prisma.accountDeletionRequest.findUnique({ where: { id: intent.receipt } }))
      .toMatchObject({
        user_id: null,
        subject_hash: expect.stringMatching(/^[0-9a-f]{64}$/),
        status: 'completed',
        error_code: null,
      });
    expect(blobDelete).toHaveBeenCalledTimes(2);

    const cleanup = new AccountService(prisma, () => now, async () => 0);
    const otherIntent = await cleanup.createDeletionIntent(otherId, password);
    createdReceipts.push(otherIntent.receipt);
    expect((await cleanup.confirmDeletion(otherIntent.receipt, 'DELETE')).status).toBe('completed');
  });
});
