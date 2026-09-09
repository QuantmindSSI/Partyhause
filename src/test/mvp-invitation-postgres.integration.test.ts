import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it, vi } from 'vitest';

import type {
  InvitationProvider,
  InvitationProviderMessage,
  InvitationProviderResult,
} from '../../server/lib/invitation-provider';
import { MvpEventsService } from '../../server/lib/mvp-events';
import { MvpGuestsService } from '../../server/lib/mvp-guests';
import { MvpInvitationsService } from '../../server/lib/mvp-invitations';
import { deriveInvitationToken, hashInvitationToken } from '../../server/lib/invitation-token';
import { prisma } from '../../server/lib/prisma';
import { RsvpService } from '../../server/lib/rsvp';

const databaseAvailable = Boolean(process.env.DATABASE_URL);
const userIds: string[] = [];
const clock = () => new Date('2030-01-01T00:00:00.000Z');
const invitationSecret = 'postgres-integration-invitation-secret-over-32-bytes';

async function createUser(label: string): Promise<string> {
  const id = randomUUID();
  userIds.push(id);
  await prisma.user.create({
    data: { id, email: `${label}-${id}@invitation.invalid`, name: label, email_verified: true },
  });
  return id;
}

function eventInput(name: string) {
  return {
    name,
    description: null,
    start: '2030-02-01T18:00:00.000Z',
    end: '2030-02-01T20:00:00.000Z',
    timezone: 'UTC',
    location: 'Integration Hall',
  };
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

describe.skipIf(!databaseAvailable)('invitation and RSVP PostgreSQL integration', () => {
  it('enforces ownership, durable replay, hashed tokens, RSVP CAS, removal, and cancellation', async () => {
    const eventService = new MvpEventsService(prisma);
    const guestService = new MvpGuestsService(prisma);
    const provider: InvitationProvider = {
      name: 'acs',
      send: vi.fn(async ({ operationId }: InvitationProviderMessage): Promise<InvitationProviderResult> => ({
        outcome: 'accepted',
        provider: 'acs',
        messageId: operationId,
      })),
    };
    const invitationService = new MvpInvitationsService(prisma, {
      provider,
      clock,
      secret: () => invitationSecret,
    });
    const rsvpService = new RsvpService(prisma, clock);
    const hostId = await createUser('Invitation Host');
    const otherHostId = await createUser('Other Invitation Host');

    const eventCreated = await eventService.create(hostId, eventInput('Host Dinner'), randomUUID());
    const otherCreated = await eventService.create(otherHostId, eventInput('Other Dinner'), randomUUID());
    const event = (await eventService.publish(
      hostId,
      eventCreated.body.event.id,
      { expectedRevision: eventCreated.body.event.revision },
      randomUUID(),
    )).body.event;
    const otherEvent = (await eventService.publish(
      otherHostId,
      otherCreated.body.event.id,
      { expectedRevision: otherCreated.body.event.revision },
      randomUUID(),
    )).body.event;
    const ownGuest = (await guestService.create(
      hostId,
      event.id,
      { name: 'Own Guest', email: 'own@invitation.invalid' },
      randomUUID(),
    )).body.guests[0];
    const removableGuest = (await guestService.create(
      hostId,
      event.id,
      { name: 'Removed Guest', email: 'removed@invitation.invalid' },
      randomUUID(),
    )).body.guests[0];
    const foreignGuest = (await guestService.create(
      otherHostId,
      otherEvent.id,
      { name: 'Foreign Guest', email: 'foreign@invitation.invalid' },
      randomUUID(),
    )).body.guests[0];

    await expect(invitationService.send(hostId, event.id, {
      guestIds: [ownGuest.id, foreignGuest.id],
    }, randomUUID())).rejects.toMatchObject({ status: 404, code: 'GUEST_NOT_FOUND' });
    expect(provider.send).not.toHaveBeenCalled();

    const [sent, replay] = await Promise.all([
      invitationService.send(hostId, event.id, { guestIds: [ownGuest.id] }, 'send-own'),
      invitationService.send(hostId, event.id, { guestIds: [ownGuest.id] }, 'send-own'),
    ]);
    expect(replay).toEqual(sent);
    expect(provider.send).toHaveBeenCalledTimes(1);
    const stored = await prisma.guestInvitation.findUniqueOrThrow({ where: { guest_id: ownGuest.id } });
    const firstToken = deriveInvitationToken(invitationSecret, stored.id, ownGuest.id, event.id);
    expect(stored.token_hash).toBe(hashInvitationToken(firstToken));
    expect(JSON.stringify(stored)).not.toContain(firstToken);
    expect(await prisma.invitationDelivery.findMany({ where: { guest_id: ownGuest.id } }))
      .toEqual([expect.objectContaining({
        status: 'accepted',
        provider: 'acs',
        attempt_count: 1,
        delivered_at: null,
        lease_expires_at: null,
        lease_token: null,
      })]);
    expect(await prisma.mvpCommand.findUniqueOrThrow({
      where: { actor_id_idempotency_key: { actor_id: hostId, idempotency_key: 'send-own' } },
    })).toMatchObject({ status: 'completed', request_payload: null });

    const resolved = await rsvpService.resolve({ token: firstToken });
    expect(resolved.body.rsvp).toMatchObject({ status: 'pending', revision: ownGuest.revision });
    const accepted = await rsvpService.update({
      token: firstToken,
      status: 'accepted',
      expectedRevision: ownGuest.revision,
    });
    const repeated = await rsvpService.update({
      token: firstToken,
      status: 'accepted',
      expectedRevision: ownGuest.revision,
    });
    expect(repeated.body.rsvp.respondedAt).toBe(accepted.body.rsvp.respondedAt);
    await expect(rsvpService.update({
      token: firstToken,
      status: 'declined',
      expectedRevision: ownGuest.revision,
    })).rejects.toMatchObject({ status: 409, code: 'REVISION_CONFLICT' });

    await invitationService.send(hostId, event.id, { guestIds: [removableGuest.id] }, 'send-removable');
    const removableInvitation = await prisma.guestInvitation.findUniqueOrThrow({
      where: { guest_id: removableGuest.id },
    });
    const secondToken = deriveInvitationToken(
      invitationSecret,
      removableInvitation.id,
      removableGuest.id,
      event.id,
    );
    await guestService.remove(hostId, removableGuest.id, { expectedRevision: removableGuest.revision }, randomUUID());
    await expect(rsvpService.resolve({ token: secondToken })).rejects.toMatchObject({
      status: 404,
      code: 'RSVP_UNAVAILABLE',
    });

    await eventService.cancel(hostId, event.id, { expectedRevision: event.revision }, randomUUID());
    await expect(rsvpService.resolve({ token: firstToken })).rejects.toMatchObject({
      status: 404,
      code: 'RSVP_UNAVAILABLE',
    });
  });

  it('reclaims an expired processing lease with the same ACS operation and content', async () => {
    const eventService = new MvpEventsService(prisma);
    const guestService = new MvpGuestsService(prisma);
    let now = new Date('2030-01-01T00:00:00.000Z');
    const send = vi.fn<InvitationProvider['send']>()
      .mockResolvedValueOnce({
        outcome: 'unknown',
        provider: 'acs',
        errorCode: 'provider_timeout',
      })
      .mockImplementationOnce(async ({ operationId }) => ({
        outcome: 'accepted',
        provider: 'acs',
        messageId: operationId,
      }));
    const invitationService = new MvpInvitationsService(prisma, {
      provider: { name: 'acs', send },
      clock: () => now,
      secret: () => invitationSecret,
    });
    const hostId = await createUser('Lease Recovery Host');
    const created = await eventService.create(hostId, eventInput('Lease Recovery'), randomUUID());
    const event = (await eventService.publish(
      hostId,
      created.body.event.id,
      { expectedRevision: created.body.event.revision },
      randomUUID(),
    )).body.event;
    const guest = (await guestService.create(
      hostId,
      event.id,
      { name: 'Lease Guest', email: 'lease@invitation.invalid' },
      randomUUID(),
    )).body.guests[0];

    await expect(invitationService.send(
      hostId,
      event.id,
      { guestIds: [guest.id] },
      'lease-recovery-key',
    )).rejects.toMatchObject({ status: 409, code: 'COMMAND_IN_PROGRESS' });
    const firstMessage = send.mock.calls[0][0];
    const processing = await prisma.invitationDelivery.findFirstOrThrow({ where: { guest_id: guest.id } });
    expect(processing).toMatchObject({ status: 'processing', attempt_count: 1 });
    const pendingCommand = await prisma.mvpCommand.findUniqueOrThrow({
      where: { actor_id_idempotency_key: { actor_id: hostId, idempotency_key: 'lease-recovery-key' } },
    });
    expect(JSON.stringify(pendingCommand.request_payload)).not.toMatch(/token|html|plainText|subject|secret/i);

    now = new Date(now.getTime() + 31_000);
    const recovered = await invitationService.send(
      hostId,
      event.id,
      { guestIds: [guest.id] },
      'lease-recovery-key',
    );
    const secondMessage = send.mock.calls[1][0];
    const acceptedDelivery = await prisma.invitationDelivery.findUniqueOrThrow({ where: { id: processing.id } });

    expect(recovered.body.results[0].status).toBe('accepted');
    expect(secondMessage).toEqual(firstMessage);
    expect(acceptedDelivery).toMatchObject({
      status: 'accepted',
      attempt_count: 2,
      lease_expires_at: null,
      lease_token: null,
    });
  });
});
