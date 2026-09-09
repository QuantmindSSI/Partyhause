import type { PrismaClient } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import type {
  InvitationProvider,
  InvitationProviderResult,
} from '../../server/lib/invitation-provider';
import { MvpInvitationsService, parseInvitationSend } from '../../server/lib/mvp-invitations';
import { deriveInvitationToken, hashInvitationToken } from '../../server/lib/invitation-token';

const SECRET = 'invitation-test-secret-with-more-than-thirty-two-bytes';
const START = new Date('2030-02-01T18:00:00.000Z');
const END = new Date('2030-02-01T20:00:00.000Z');

interface EventState {
  id: string;
  host_id: string;
  name: string;
  start_date: Date;
  end_date: Date;
  timezone: string;
  location: string;
  status: string;
}

interface GuestState {
  id: string;
  event_id: string;
  name: string;
  email: string;
  rsvp_status: string;
  revision: number;
}

interface InvitationState {
  id: string;
  guest_id: string;
  event_id: string;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
  created_at: Date;
}

interface DeliveryState {
  id: string;
  command_id: string;
  invitation_id: string;
  event_id: string;
  guest_id: string;
  status: string;
  provider: string;
  provider_message_id: string | null;
  attempt_count: number;
  error_code: string | null;
  processing_started_at: Date | null;
  lease_expires_at: Date | null;
  lease_token: string | null;
  accepted_at: Date | null;
  delivered_at: Date | null;
  bounced_at: Date | null;
  failed_at: Date | null;
  created_at: Date;
}

interface CommandState {
  id: string;
  actor_id: string;
  idempotency_key: string;
  operation: string;
  request_hash: string;
  status: string;
  request_payload: unknown;
  response: unknown;
  expires_at: Date;
}

function matchesId(value: string, condition: unknown): boolean {
  if (typeof condition === 'string') return value === condition;
  if (condition && typeof condition === 'object' && 'in' in condition) {
    return Array.isArray((condition as { in?: unknown }).in)
      && ((condition as { in: string[] }).in).includes(value);
  }
  return true;
}

function commandKey(actorId: string, idempotencyKey: string): string {
  return `${actorId}:${idempotencyKey}`;
}

class InvitationDatabase {
  readonly events = new Map<string, EventState>();
  readonly guests = new Map<string, GuestState>();
  readonly invitations = new Map<string, InvitationState>();
  readonly deliveries = new Map<string, DeliveryState>();
  readonly commands = new Map<string, CommandState>();
  readonly client: PrismaClient;
  inTransaction = false;
  failNextDeliveryPersistence = false;
  failNextFinalize = false;
  private commandNumber = 0;
  private transactionQueue: Promise<void> = Promise.resolve();

  constructor() {
    this.events.set('event-1', {
      id: 'event-1',
      host_id: 'host-1',
      name: 'Dinner',
      start_date: START,
      end_date: END,
      timezone: 'UTC',
      location: 'Hall',
      status: 'published',
    });
    this.guests.set('guest-1', {
      id: 'guest-1', event_id: 'event-1', name: 'Ada', email: 'ada@example.com', rsvp_status: 'pending', revision: 1,
    });
    this.guests.set('guest-2', {
      id: 'guest-2', event_id: 'event-1', name: 'Grace', email: 'grace@example.com', rsvp_status: 'pending', revision: 1,
    });

    const models = {
      event: { findFirst: (args: Record<string, unknown>) => this.findEvent(args) },
      guest: { findMany: (args: Record<string, unknown>) => this.findGuests(args) },
      guestInvitation: {
        create: (args: { data: InvitationState }) => this.createInvitation(args.data),
        update: (args: { where: { id: string }; data: Partial<InvitationState> }) => this.updateInvitation(args),
      },
      invitationDelivery: {
        count: (args: Record<string, unknown>) => this.countDeliveries(args),
        create: (args: { data: DeliveryState }) => this.createDelivery(args.data),
        findMany: (args: Record<string, unknown>) => this.findDeliveries(args),
        updateMany: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => this.updateDeliveries(args),
      },
      mvpCommand: {
        findUnique: (args: Record<string, unknown>) => this.findCommand(args),
        create: (args: { data: Omit<CommandState, 'id' | 'status' | 'response'> }) => this.createCommand(args.data),
        update: (args: { where: { id: string }; data: Partial<CommandState> }) => this.updateCommand(args),
        updateMany: (args: { where: Record<string, unknown>; data: Partial<CommandState> }) => this.updateCommands(args),
      },
      $queryRaw: (query: { values?: unknown[] }) => this.lockedEvent(query),
    };
    this.client = {
      ...models,
      $transaction: (work: (transaction: typeof models) => Promise<unknown>) => this.transaction(work, models),
    } as unknown as PrismaClient;
  }

  private async transaction<T>(work: (transaction: never) => Promise<T>, models: unknown): Promise<T> {
    let release = (): void => undefined;
    const prior = this.transactionQueue;
    this.transactionQueue = new Promise<void>((resolve) => { release = resolve; });
    await prior;
    const snapshot = structuredClone({
      invitations: this.invitations,
      deliveries: this.deliveries,
      commands: this.commands,
    });
    this.inTransaction = true;
    try {
      return await work(models as never);
    } catch (error) {
      this.restore(this.invitations, snapshot.invitations);
      this.restore(this.deliveries, snapshot.deliveries);
      this.restore(this.commands, snapshot.commands);
      throw error;
    } finally {
      this.inTransaction = false;
      release();
    }
  }

  private restore<T>(target: Map<string, T>, source: Map<string, T>): void {
    target.clear();
    for (const [key, value] of source) target.set(key, value);
  }

  private findEvent(args: Record<string, unknown>): unknown {
    const where = args.where as { id?: string; host_id?: string };
    const event = where.id ? this.events.get(where.id) : undefined;
    if (!event || (where.host_id && event.host_id !== where.host_id)) return null;
    return { ...event, host: { name: 'Host' } };
  }

  private lockedEvent(query: { values?: unknown[] }): unknown[] {
    const [eventId, actorId] = query.values ?? [];
    const event = this.events.get(String(eventId));
    if (!event || event.host_id !== actorId) return [];
    return [{ ...event, host_name: 'Host' }];
  }

  private findGuests(args: Record<string, unknown>): unknown[] {
    const where = args.where as { event_id?: string; id?: unknown };
    return [...this.guests.values()]
      .filter((guest) => (!where.event_id || guest.event_id === where.event_id) && matchesId(guest.id, where.id))
      .map((guest) => this.guestRow(guest));
  }

  private guestRow(guest: GuestState): unknown {
    const invitation = [...this.invitations.values()].find((row) => row.guest_id === guest.id);
    if (!invitation) return { ...guest, guest_invitation: null };
    const deliveries = [...this.deliveries.values()]
      .filter((row) => row.invitation_id === invitation.id)
      .sort((left, right) => right.created_at.getTime() - left.created_at.getTime() || right.id.localeCompare(left.id));
    return { ...guest, guest_invitation: { ...invitation, deliveries: deliveries.slice(0, 1) } };
  }

  private createInvitation(data: InvitationState): InvitationState {
    this.invitations.set(data.id, { ...data, revoked_at: data.revoked_at ?? null });
    return this.invitations.get(data.id)!;
  }

  private updateInvitation(args: { where: { id: string }; data: Partial<InvitationState> }): InvitationState {
    const current = this.invitations.get(args.where.id);
    if (!current) throw new Error('Invitation missing');
    const updated = { ...current, ...args.data };
    this.invitations.set(current.id, updated);
    return updated;
  }

  private createDelivery(data: DeliveryState): DeliveryState {
    const row: DeliveryState = {
      ...data,
      error_code: data.error_code ?? null,
      processing_started_at: data.processing_started_at ?? null,
      lease_expires_at: data.lease_expires_at ?? null,
      lease_token: data.lease_token ?? null,
      accepted_at: data.accepted_at ?? null,
      delivered_at: data.delivered_at ?? null,
      bounced_at: data.bounced_at ?? null,
      failed_at: data.failed_at ?? null,
    };
    this.deliveries.set(row.id, row);
    return row;
  }

  private countDeliveries(args: Record<string, unknown>): number {
    const created = ((args.where as { created_at?: { gte?: Date } }).created_at?.gte)?.getTime() ?? 0;
    return [...this.deliveries.values()].filter((row) => row.created_at.getTime() >= created).length;
  }

  private findDeliveries(args: Record<string, unknown>): unknown[] {
    const where = args.where as Record<string, unknown>;
    const nested = Boolean((args.select as Record<string, unknown> | undefined)?.invitation);
    return [...this.deliveries.values()]
      .filter((row) => this.deliveryMatches(row, where))
      .map((row) => nested ? {
        ...row,
        invitation: this.invitations.get(row.invitation_id),
        guest: this.guests.get(row.guest_id),
      } : { ...row });
  }

  private deliveryMatches(row: DeliveryState, where: Record<string, unknown>): boolean {
    if (where.id && !matchesId(row.id, where.id)) return false;
    if (where.command_id && row.command_id !== where.command_id) return false;
    if (where.status && row.status !== where.status) return false;
    if (where.lease_token && row.lease_token !== where.lease_token) return false;
    if (Array.isArray(where.OR)) {
      return where.OR.some((entry) => {
        const condition = entry as { status?: string; lease_expires_at?: { lte?: Date } };
        if (condition.status && row.status !== condition.status) return false;
        if (condition.lease_expires_at?.lte) {
          return Boolean(row.lease_expires_at && row.lease_expires_at <= condition.lease_expires_at.lte);
        }
        return true;
      });
    }
    return true;
  }

  private updateDeliveries(args: { where: Record<string, unknown>; data: Record<string, unknown> }): { count: number } {
    const isPersistence = typeof args.where.lease_token === 'string'
      && (args.data.status === 'accepted' || args.data.status === 'failed');
    if (this.failNextDeliveryPersistence && isPersistence) {
      this.failNextDeliveryPersistence = false;
      throw new Error('Simulated process crash before delivery persistence');
    }
    let count = 0;
    for (const row of this.deliveries.values()) {
      if (!this.deliveryMatches(row, args.where)) continue;
      const next = { ...row } as Record<string, unknown>;
      for (const [key, value] of Object.entries(args.data)) {
        next[key] = value && typeof value === 'object' && 'increment' in value
          ? Number(next[key]) + Number((value as { increment: number }).increment)
          : value;
      }
      this.deliveries.set(row.id, next as unknown as DeliveryState);
      count += 1;
    }
    return { count };
  }

  private findCommand(args: Record<string, unknown>): CommandState | null {
    const where = args.where as { id?: string; actor_id_idempotency_key?: { actor_id: string; idempotency_key: string } };
    if (where.id) return [...this.commands.values()].find((row) => row.id === where.id) ?? null;
    if (!where.actor_id_idempotency_key) return null;
    return this.commands.get(commandKey(
      where.actor_id_idempotency_key.actor_id,
      where.actor_id_idempotency_key.idempotency_key,
    )) ?? null;
  }

  private createCommand(data: Omit<CommandState, 'id' | 'status' | 'response'>): { id: string } {
    const key = commandKey(data.actor_id, data.idempotency_key);
    if (this.commands.has(key)) throw { code: 'P2002', meta: { target: ['actor_id', 'idempotency_key'] } };
    this.commandNumber += 1;
    const row: CommandState = {
      ...data,
      id: `command-${this.commandNumber}`,
      status: 'pending',
      response: null,
    };
    this.commands.set(key, row);
    return { id: row.id };
  }

  private updateCommand(args: { where: { id: string }; data: Partial<CommandState> }): CommandState {
    const entry = [...this.commands.entries()].find(([, row]) => row.id === args.where.id);
    if (!entry) throw new Error('Command missing');
    const updated = { ...entry[1], ...args.data };
    this.commands.set(entry[0], updated);
    return updated;
  }

  private updateCommands(args: { where: Record<string, unknown>; data: Partial<CommandState> }): { count: number } {
    if (this.failNextFinalize && args.data.status === 'completed') {
      this.failNextFinalize = false;
      throw new Error('Simulated crash before command completion');
    }
    let count = 0;
    for (const [key, row] of this.commands) {
      if (args.where.id && row.id !== args.where.id) continue;
      if (args.where.status && row.status !== args.where.status) continue;
      if (args.where.request_hash && row.request_hash !== args.where.request_hash) continue;
      this.commands.set(key, { ...row, ...args.data });
      count += 1;
    }
    return { count };
  }
}

function accepted(messageId: string): InvitationProviderResult {
  return { outcome: 'accepted', provider: 'acs', messageId };
}

function serviceFixture(providerResult: InvitationProviderResult = accepted('acs-message-1')) {
  const database = new InvitationDatabase();
  let now = new Date('2030-01-01T00:00:00.000Z');
  let id = 0;
  const send = vi.fn(async (): Promise<InvitationProviderResult> => {
    expect(database.inTransaction).toBe(false);
    return providerResult;
  });
  const provider: InvitationProvider = { name: 'acs', send };
  const service = new MvpInvitationsService(database.client, {
    provider,
    clock: () => now,
    idFactory: () => `00000000-0000-4000-8000-${String(++id).padStart(12, '0')}`,
    secret: () => SECRET,
    wait: (milliseconds) => new Promise((resolve) => setTimeout(resolve, Math.min(milliseconds, 2))),
  });
  return {
    database,
    provider,
    service,
    advance(milliseconds: number) { now = new Date(now.getTime() + milliseconds); },
  };
}

describe('MVP invitation input', () => {
  it('accepts only one exact array of 1 to 50 unique guest ids', () => {
    expect(parseInvitationSend({ guestIds: ['guest-1'] })).toEqual(['guest-1']);
    expect(() => parseInvitationSend({ guestIds: ['guest-1'], subject: 'Injected' }))
      .toThrowError(expect.objectContaining({ code: 'UNKNOWN_FIELDS' }));
    expect(() => parseInvitationSend({ guestIds: ['guest-1'], html: '<p>x</p>' }))
      .toThrowError(expect.objectContaining({ code: 'UNKNOWN_FIELDS' }));
    expect(() => parseInvitationSend({ guestIds: ['guest-1'], address: 'stranger@example.com' }))
      .toThrowError(expect.objectContaining({ code: 'UNKNOWN_FIELDS' }));
    expect(() => parseInvitationSend({ guestIds: ['guest-1', ' guest-1 '] }))
      .toThrowError(expect.objectContaining({ code: 'DUPLICATE_RECIPIENTS' }));
    expect(() => parseInvitationSend({ guestIds: Array.from({ length: 51 }, (_, index) => `g-${index}`) }))
      .toThrowError(expect.objectContaining({ code: 'INVALID_RECIPIENTS' }));
  });
});

describe('durable MVP invitation delivery', () => {
  it('commits command and queued delivery state before invoking the provider', async () => {
    const fixture = serviceFixture();
    vi.mocked(fixture.provider.send).mockImplementationOnce(async (message) => {
      expect(fixture.database.inTransaction).toBe(false);
      const command = [...fixture.database.commands.values()][0];
      expect(command).toMatchObject({ status: 'pending' });
      expect(JSON.stringify(command.request_payload)).not.toMatch(/token|html|plainText|subject|secret/i);
      expect([...fixture.database.deliveries.values()][0]).toMatchObject({
        status: 'processing',
        provider_message_id: message.operationId,
      });
      return accepted(message.operationId);
    });

    const response = await fixture.service.send('host-1', 'event-1', { guestIds: ['guest-1'] }, 'send-key');

    expect(response.body.results[0]).toMatchObject({ status: 'accepted', attempted: true });
    expect(fixture.provider.send).toHaveBeenCalledTimes(1);
    expect([...fixture.database.commands.values()][0]).toMatchObject({ status: 'completed' });
  });

  it('stores only the deterministic token hash and regenerates the exact token for delivery', async () => {
    const fixture = serviceFixture();
    await fixture.service.send('host-1', 'event-1', { guestIds: ['guest-1'] }, 'token-key');

    const invitation = [...fixture.database.invitations.values()][0];
    const expected = deriveInvitationToken(SECRET, invitation.id, 'guest-1', 'event-1');
    const message = vi.mocked(fixture.provider.send).mock.calls[0][0];
    expect(invitation.token_hash).toBe(hashInvitationToken(expected));
    expect(message.html).toContain(`https://partyhause.com/join/${expected}`);
    expect(JSON.stringify([...fixture.database.commands.values()])).not.toContain(expected);
    expect(JSON.stringify([...fixture.database.deliveries.values()])).not.toContain(expected);
  });

  it('allows concurrent same-key calls to invoke the provider once', async () => {
    const fixture = serviceFixture();
    let release: ((result: InvitationProviderResult) => void) | undefined;
    vi.mocked(fixture.provider.send).mockImplementationOnce((message) => new Promise((resolve) => {
      release = resolve;
      expect(message.operationId).toBe([...fixture.database.deliveries.values()][0].id);
    }));

    const first = fixture.service.send('host-1', 'event-1', { guestIds: ['guest-1'] }, 'concurrent-key');
    await vi.waitFor(() => expect(fixture.provider.send).toHaveBeenCalledTimes(1));
    const second = fixture.service.send('host-1', 'event-1', { guestIds: ['guest-1'] }, 'concurrent-key');
    release!(accepted('same-operation'));
    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(secondResult).toEqual(firstResult);
    expect(fixture.provider.send).toHaveBeenCalledTimes(1);
    expect(fixture.database.deliveries.size).toBe(1);
  });

  it('recovers an expired processing lease with the same operation, token, and content', async () => {
    const fixture = serviceFixture();
    fixture.database.failNextDeliveryPersistence = true;

    await expect(fixture.service.send('host-1', 'event-1', {
      guestIds: ['guest-1'],
    }, 'lease-key')).rejects.toMatchObject({ code: 'INTERNAL_ERROR' });
    const firstMessage = vi.mocked(fixture.provider.send).mock.calls[0][0];
    expect([...fixture.database.deliveries.values()][0]).toMatchObject({ status: 'processing', attempt_count: 1 });

    fixture.database.events.get('event-1')!.name = 'Changed after crash';
    fixture.database.events.get('event-1')!.location = 'Changed venue';
    fixture.database.guests.get('guest-1')!.name = 'Changed guest';
    fixture.database.guests.get('guest-1')!.email = 'changed@example.com';
    fixture.advance(31_000);
    vi.mocked(fixture.provider.send).mockResolvedValueOnce(accepted(firstMessage.operationId));
    const resumed = await fixture.service.send('host-1', 'event-1', {
      guestIds: ['guest-1'],
    }, 'lease-key');
    const secondMessage = vi.mocked(fixture.provider.send).mock.calls[1][0];

    expect(resumed.body.results[0].status).toBe('accepted');
    expect(secondMessage).toEqual(firstMessage);
    expect([...fixture.database.deliveries.values()][0]).toMatchObject({ status: 'accepted', attempt_count: 2 });
  });

  it('prevents an expired lease owner from overwriting the recovery winner', async () => {
    const fixture = serviceFixture();
    let releaseFirst: ((result: InvitationProviderResult) => void) | undefined;
    vi.mocked(fixture.provider.send)
      .mockImplementationOnce(() => new Promise((resolve) => { releaseFirst = resolve; }))
      .mockImplementationOnce(async (message) => accepted(message.operationId));

    const first = fixture.service.send('host-1', 'event-1', { guestIds: ['guest-1'] }, 'stale-lease-key');
    await vi.waitFor(() => expect(fixture.provider.send).toHaveBeenCalledTimes(1));
    fixture.advance(31_000);
    const recovered = await fixture.service.send(
      'host-1',
      'event-1',
      { guestIds: ['guest-1'] },
      'stale-lease-key',
    );
    releaseFirst!(accepted('stale-result-must-not-win'));
    const original = await first;
    const messages = vi.mocked(fixture.provider.send).mock.calls.map(([message]) => message);

    expect(original).toEqual(recovered);
    expect(messages[1]).toEqual(messages[0]);
    expect([...fixture.database.deliveries.values()][0]).toMatchObject({
      status: 'accepted',
      provider_message_id: messages[0].operationId,
      attempt_count: 2,
    });
  });

  it('resumes command finalization after a crash without resending an accepted delivery', async () => {
    const fixture = serviceFixture();
    fixture.database.failNextFinalize = true;

    await expect(fixture.service.send('host-1', 'event-1', {
      guestIds: ['guest-1'],
    }, 'finalize-key')).rejects.toMatchObject({ code: 'INTERNAL_ERROR' });
    expect([...fixture.database.deliveries.values()][0].status).toBe('accepted');

    const resumed = await fixture.service.send('host-1', 'event-1', {
      guestIds: ['guest-1'],
    }, 'finalize-key');
    expect(resumed.body.results[0].status).toBe('accepted');
    expect(fixture.provider.send).toHaveBeenCalledTimes(1);
  });

  it('never resends accepted delivery and creates a new attempt only after failure', async () => {
    const fixture = serviceFixture({ outcome: 'failed', provider: 'acs', errorCode: 'provider_rejected' });
    const failed = await fixture.service.send('host-1', 'event-1', { guestIds: ['guest-1'] }, 'failed-key');
    expect(failed.body.results[0].status).toBe('failed');

    vi.mocked(fixture.provider.send).mockResolvedValue(accepted('retry-operation'));
    const retried = await fixture.service.send('host-1', 'event-1', { guestIds: ['guest-1'] }, 'retry-key');
    expect(retried.body.results[0].status).toBe('accepted');
    expect(fixture.provider.send).toHaveBeenCalledTimes(2);
    expect(fixture.database.deliveries.size).toBe(2);

    const skipped = await fixture.service.send('host-1', 'event-1', { guestIds: ['guest-1'] }, 'accepted-key');
    expect(skipped.body.results[0]).toMatchObject({ status: 'accepted', attempted: false });
    expect(fixture.provider.send).toHaveBeenCalledTimes(2);
    expect(fixture.database.deliveries.size).toBe(2);

    const latest = [...fixture.database.deliveries.values()].sort((left, right) => right.id.localeCompare(left.id))[0];
    latest.status = 'delivered';
    const delivered = await fixture.service.send('host-1', 'event-1', { guestIds: ['guest-1'] }, 'delivered-key');
    expect(delivered.body.results[0]).toMatchObject({ status: 'delivered', attempted: false });
    latest.status = 'bounced';
    const bounced = await fixture.service.send('host-1', 'event-1', { guestIds: ['guest-1'] }, 'bounced-key');
    expect(bounced.body.results[0]).toMatchObject({ status: 'bounced', attempted: false });
    expect(fixture.provider.send).toHaveBeenCalledTimes(2);
    expect(fixture.database.deliveries.size).toBe(2);
  });

  it('rejects reuse of one idempotency key for a different guest set', async () => {
    const fixture = serviceFixture();
    await fixture.service.send('host-1', 'event-1', { guestIds: ['guest-1'] }, 'conflict-key');

    await expect(fixture.service.send('host-1', 'event-1', {
      guestIds: ['guest-2'],
    }, 'conflict-key')).rejects.toMatchObject({ code: 'IDEMPOTENCY_KEY_CONFLICT' });
    expect(fixture.provider.send).toHaveBeenCalledTimes(1);
  });

  it('rejects a foreign guest transactionally before durable work or provider invocation', async () => {
    const fixture = serviceFixture();
    fixture.database.guests.set('foreign', {
      id: 'foreign', event_id: 'other-event', name: 'Foreign', email: 'foreign@example.com', rsvp_status: 'pending', revision: 1,
    });

    await expect(fixture.service.send('host-1', 'event-1', {
      guestIds: ['guest-1', 'foreign'],
    }, 'foreign-key')).rejects.toMatchObject({ code: 'GUEST_NOT_FOUND' });
    expect(fixture.database.commands.size).toBe(0);
    expect(fixture.database.deliveries.size).toBe(0);
    expect(fixture.provider.send).not.toHaveBeenCalled();
  });

  it('lists accepted deliveries as non-sendable without writing', async () => {
    const fixture = serviceFixture();
    await fixture.service.send('host-1', 'event-1', { guestIds: ['guest-1'] }, 'list-key');
    const sends = vi.mocked(fixture.provider.send).mock.calls.length;

    const page = await fixture.service.list('host-1', 'event-1');
    expect(page.body.preview).toMatchObject({ kind: 'fixed', eventName: 'Dinner' });
    expect(page.body.candidates.find((row) => row.guestId === 'guest-1'))
      .toMatchObject({ deliveryStatus: 'accepted', canSend: false });
    expect(fixture.provider.send).toHaveBeenCalledTimes(sends);
  });
});
