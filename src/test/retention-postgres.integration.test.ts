import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';

import { prisma } from '../../server/lib/prisma';
import { runRetentionSweep } from '../../server/lib/retention';

const databaseAvailable = Boolean(process.env.DATABASE_URL);
const userIds: string[] = [];
const eventIds: string[] = [];

afterAll(async () => {
  if (!databaseAvailable) return;
  await prisma.event.deleteMany({ where: { id: { in: eventIds } } });
  await prisma.userProfile.deleteMany({ where: { id: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
});

describe.skipIf(!databaseAvailable)('retention PostgreSQL integration', () => {
  it('expires auth secrets, RSVP credentials, person-level event data, logs, and deletion audits', async () => {
    const now = new Date('2030-03-15T12:00:00.000Z');
    const userId = randomUUID();
    userIds.push(userId);
    await prisma.user.create({
      data: {
        id: userId,
        email: `${userId}@retention.invalid`,
        name: 'Retention Host',
        email_verified: true,
        verification_token: `verify-${userId}`,
        verification_token_expires: new Date('2030-03-14T00:00:00.000Z'),
        reset_token: `reset-${userId}`,
        reset_token_expires: new Date('2030-03-14T00:00:00.000Z'),
      },
    });
    await prisma.userProfile.create({
      data: { id: userId, username: `r_${userId.replace(/-/g, '').slice(0, 20)}`, display_name: 'Retention Host' },
    });
    const event = await prisma.event.create({
      data: {
        host_id: userId,
        name: 'Expired event data',
        location: 'Test Hall',
        start_date: new Date('2030-01-01T18:00:00.000Z'),
        end_date: new Date('2030-01-01T20:00:00.000Z'),
        max_guests: 50,
      },
    });
    eventIds.push(event.id);
    const guest = await prisma.guest.create({
      data: {
        event_id: event.id,
        name: 'Expired Guest',
        email: 'expired-guest@retention.invalid',
        normalized_email: 'expired-guest@retention.invalid',
        rsvp_status: 'accepted',
        dietary_restrictions: [],
      },
    });
    const invitation = await prisma.guestInvitation.create({
      data: {
        guest_id: guest.id,
        event_id: event.id,
        token_hash: 'd'.repeat(64),
        expires_at: new Date('2030-01-01T20:00:00.000Z'),
      },
    });
    const command = await prisma.mvpCommand.create({
      data: {
        actor_id: userId,
        idempotency_key: randomUUID(),
        operation: 'retention-test',
        request_hash: 'e'.repeat(64),
        expires_at: new Date('2030-01-02T00:00:00.000Z'),
      },
    });
    await prisma.invitationDelivery.create({
      data: {
        command_id: command.id,
        invitation_id: invitation.id,
        event_id: event.id,
        guest_id: guest.id,
        provider: 'test',
        created_at: new Date('2030-01-01T12:00:00.000Z'),
      },
    });
    await prisma.attendanceAudit.create({
      data: {
        event_id: event.id,
        guest_id: guest.id,
        actor_id: userId,
        command_id: command.id,
        action: 'check_in',
        prior_state: false,
        new_state: true,
        guest_revision: 1,
      },
    });
    const emailLog = await prisma.emailLog.create({
      data: {
        event_id: event.id,
        guest_id: guest.id,
        email_type: 'invitation',
        recipient_email: guest.email,
        subject: 'Expired invitation',
        sent_at: new Date('2030-01-01T12:00:00.000Z'),
      },
    });
    await prisma.guest.update({ where: { id: guest.id }, data: { email_log_id: emailLog.id } });
    await prisma.emailEvent.create({
      data: {
        email_log_id: emailLog.id,
        resend_email_id: 'message-1',
        event_type: 'delivered',
        timestamp: new Date('2030-01-01T12:01:00.000Z'),
      },
    });
    const deletionReceipt = randomUUID();
    await prisma.accountDeletionRequest.create({
      data: {
        id: deletionReceipt,
        user_id: null,
        subject_hash: 'f'.repeat(64),
        status: 'completed',
        requested_at: new Date('2028-01-01T00:00:00.000Z'),
        erase_by: new Date('2028-01-02T00:00:00.000Z'),
        completed_at: new Date('2028-01-01T01:00:00.000Z'),
        expires_at: new Date('2029-01-01T00:00:00.000Z'),
      },
    });

    const result = await runRetentionSweep(prisma, now);

    expect(result.acquired).toBe(true);
    expect(result.affectedRows).toBeGreaterThan(0);
    expect(await prisma.event.findUnique({ where: { id: event.id } })).not.toBeNull();
    expect(await prisma.guest.findUnique({ where: { id: guest.id } })).toBeNull();
    expect(await prisma.guestInvitation.findUnique({ where: { id: invitation.id } })).toBeNull();
    expect(await prisma.invitationDelivery.count({ where: { guest_id: guest.id } })).toBe(0);
    expect(await prisma.attendanceAudit.count({ where: { guest_id: guest.id } })).toBe(0);
    expect(await prisma.emailLog.findUnique({ where: { id: emailLog.id } })).toBeNull();
    expect(await prisma.accountDeletionRequest.findUnique({ where: { id: deletionReceipt } })).toBeNull();
    expect(await prisma.user.findUnique({ where: { id: userId } })).toMatchObject({
      verification_token: null,
      verification_token_expires: null,
      reset_token: null,
      reset_token_expires: null,
    });
  });
});
