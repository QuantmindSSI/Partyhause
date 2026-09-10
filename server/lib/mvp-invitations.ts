import { randomUUID } from 'node:crypto';
import { Prisma, type PrismaClient } from '@prisma/client';

import { hashMvpRequest, mapMvpDatabaseError } from './mvp-command';
import { MvpError, parseIdempotencyKey, type MvpHttpResponse, type MvpRsvpStatus } from './mvp-contract';
import { AcsInvitationProvider, type InvitationProvider, type InvitationProviderResult } from './invitation-provider';
import {
  fixedInvitationPreview,
  renderFixedInvitation,
  type FixedInvitationDetails,
  type FixedInvitationPreview,
} from './invitation-renderer';
import {
  deriveInvitationToken,
  getInvitationTokenSecret,
  hashInvitationToken,
} from './invitation-token';

const MAX_RECIPIENTS = 50;
const HOST_HOURLY_RECIPIENT_LIMIT = 100;
const RATE_WINDOW_MS = 60 * 60 * 1_000;
const COMMAND_TTL_MS = 24 * 60 * 60 * 1_000;
const DELIVERY_LEASE_MS = 30_000;
const COMMAND_WAIT_ATTEMPTS = 100;
const COMMAND_WAIT_DELAY_MS = 100;
const GUEST_ID_LIMIT = 200;
const RECIPIENT_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TERMINAL_DELIVERY_STATUSES = new Set(['accepted', 'delivered', 'bounced', 'failed']);
const NON_RETRYABLE_DELIVERY_STATUSES = new Set(['queued', 'processing', 'accepted', 'delivered', 'bounced']);
const INVITATION_OPERATION = 'invitation.send';
const PENDING_PAYLOAD_VERSION = 1;

export type MvpInvitationDeliveryStatus = 'not_sent' | 'queued' | 'accepted' | 'delivered' | 'bounced' | 'failed';

export interface MvpInvitationCandidate {
  guestId: string;
  name: string;
  email: string;
  rsvpStatus: MvpRsvpStatus;
  guestRevision: number;
  deliveryStatus: MvpInvitationDeliveryStatus;
  canSend: boolean;
}

export interface MvpInvitationPage {
  event: { id: string; status: 'published'; start: string; end: string };
  preview: FixedInvitationPreview;
  candidates: MvpInvitationCandidate[];
}

export interface MvpInvitationSendItem {
  guestId: string;
  name: string;
  status: Exclude<MvpInvitationDeliveryStatus, 'not_sent'>;
  attempted: boolean;
  provider: 'acs';
  providerMessageId: string | null;
  errorCode: string | null;
}

export interface MvpInvitationSendResult {
  eventId: string;
  requestedCount: number;
  attemptedCount: number;
  results: MvpInvitationSendItem[];
}

interface InvitationEventRow extends FixedInvitationDetails {
  id: string;
  status: string;
}

interface DeliveryRow {
  id: string;
  command_id: string;
  guest_id: string;
  status: string;
  provider: string;
  provider_message_id: string | null;
  error_code: string | null;
  attempt_count: number;
}

interface GuestRow {
  id: string;
  name: string;
  email: string;
  rsvp_status: string;
  revision: number;
  guest_invitation: {
    id: string;
    token_hash: string;
    revoked_at: Date | null;
    expires_at: Date;
    deliveries: DeliveryRow[];
  } | null;
}

interface PendingInvitationCommand {
  version: 1;
  eventId: string;
  guestIds: string[];
  deliveryIds: string[];
  eventSnapshot: {
    eventName: string;
    hostName: string;
    start: string;
    end: string;
    timezone: string;
    location: string;
  };
  deliverySnapshots: Array<{
    deliveryId: string;
    invitationId: string;
    guestId: string;
    guestName: string;
    recipient: string;
  }>;
}

interface PendingPreparation {
  kind: 'pending';
  commandId: string;
  payload: PendingInvitationCommand;
}

interface CompletedPreparation {
  kind: 'completed';
  response: MvpHttpResponse<MvpInvitationSendResult>;
}

type CommandPreparation = PendingPreparation | CompletedPreparation;

interface ClaimedDelivery {
  id: string;
  leaseToken: string;
  invitationId: string;
  invitationTokenHash: string;
  invitationExpiresAt: Date;
  invitationRevokedAt: Date | null;
  guestId: string;
  guestName: string;
  recipient: string;
  event: InvitationEventRow;
}

interface ClaimedDeliveryRow {
  id: string;
  invitation_id: string;
  event_id: string;
  guest_id: string;
  invitation: {
    token_hash: string;
    expires_at: Date;
    revoked_at: Date | null;
  };
}

interface InvitationServiceOptions {
  provider?: InvitationProvider;
  clock?: () => Date;
  idFactory?: () => string;
  secret?: () => string;
  wait?: (milliseconds: number) => Promise<void>;
}

interface CommandRow {
  id: string;
  operation: string;
  request_hash: string;
  status: string;
  request_payload: Prisma.JsonValue | null;
  response: Prisma.JsonValue | null;
}

type DeliverySnapshot = PendingInvitationCommand['deliverySnapshots'][number];

class CommandClaimConflict extends Error {
  constructor() {
    super('Invitation command key was claimed concurrently');
    this.name = 'CommandClaimConflict';
  }
}

function requestObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new MvpError(400, 'INVALID_REQUEST', 'Request body must be a JSON object');
  }
  return value as Record<string, unknown>;
}

function hasControlCharacter(value: string): boolean {
  return [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127;
  });
}

/** Parse the exact invitation send body. Addresses and content are never accepted. */
export function parseInvitationSend(value: unknown): string[] {
  const body = requestObject(value);
  if (Object.keys(body).length !== 1 || !Object.prototype.hasOwnProperty.call(body, 'guestIds')) {
    throw new MvpError(400, 'UNKNOWN_FIELDS', 'Request body must contain only guestIds');
  }
  if (!Array.isArray(body.guestIds) || body.guestIds.length < 1 || body.guestIds.length > MAX_RECIPIENTS) {
    throw new MvpError(400, 'INVALID_RECIPIENTS', 'guestIds must contain between 1 and 50 entries');
  }
  const guestIds = body.guestIds.map((value) => {
    if (typeof value !== 'string') {
      throw new MvpError(400, 'INVALID_RECIPIENTS', 'Every guestId must be a string');
    }
    const id = value.trim();
    if (!id || id.length > GUEST_ID_LIMIT || hasControlCharacter(id)) {
      throw new MvpError(400, 'INVALID_RECIPIENTS', 'Every guestId must be valid');
    }
    return id;
  });
  if (new Set(guestIds).size !== guestIds.length) {
    throw new MvpError(400, 'DUPLICATE_RECIPIENTS', 'guestIds must be unique');
  }
  return guestIds;
}

function eventWhere(id: string, actorId: string): Prisma.EventWhereInput {
  return {
    id,
    host_id: actorId,
    privacy: 'private',
    is_public: false,
    max_guests: 50,
    host: { account_status: 'active' },
  };
}

function invitationDetails(event: {
  name: string;
  start_date: Date;
  end_date: Date;
  timezone: string | null;
  location: string;
  host: { name: string | null };
}): FixedInvitationDetails {
  return {
    eventName: event.name,
    hostName: event.host.name?.trim() || 'Your host',
    start: event.start_date,
    end: event.end_date,
    timezone: event.timezone || 'UTC',
    location: event.location,
  };
}

function assertFuturePublished(event: { status: string; start_date: Date }, now: Date): void {
  if (event.status !== 'published') {
    throw new MvpError(409, 'EVENT_NOT_PUBLISHED', 'Invitations can be sent only for a published event');
  }
  if (event.start_date.getTime() <= now.getTime()) {
    throw new MvpError(409, 'EVENT_NOT_FUTURE', 'Invitations can be sent only before the event starts');
  }
}

function publicDeliveryStatus(value: string | undefined): MvpInvitationDeliveryStatus {
  if (value === 'processing') return 'queued';
  if (value === 'queued' || value === 'accepted' || value === 'delivered' || value === 'bounced' || value === 'failed') {
    return value;
  }
  return 'not_sent';
}

function candidate(guest: GuestRow): MvpInvitationCandidate {
  const status = publicDeliveryStatus(guest.guest_invitation?.deliveries[0]?.status);
  return {
    guestId: guest.id,
    name: guest.name,
    email: guest.email.trim().toLowerCase(),
    rsvpStatus: guest.rsvp_status as MvpRsvpStatus,
    guestRevision: guest.revision,
    deliveryStatus: status,
    canSend: status === 'not_sent' || status === 'failed',
  };
}

const DELIVERY_SELECT = {
  id: true,
  command_id: true,
  guest_id: true,
  status: true,
  provider: true,
  provider_message_id: true,
  error_code: true,
  attempt_count: true,
} satisfies Prisma.InvitationDeliverySelect;

const GUEST_SELECT = {
  id: true,
  name: true,
  email: true,
  rsvp_status: true,
  revision: true,
  guest_invitation: {
    select: {
      id: true,
      token_hash: true,
      revoked_at: true,
      expires_at: true,
      deliveries: {
        orderBy: [
          { created_at: 'desc' as const },
          { id: 'desc' as const },
        ],
        take: 1,
        select: DELIVERY_SELECT,
      },
    },
  },
} satisfies Prisma.GuestSelect;

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function stringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.length > MAX_RECIPIENTS) {
    throw new MvpError(500, 'INVALID_COMMAND_STATE', `Stored ${field} metadata is invalid`);
  }
  const values = value.map((entry) => boundedString(entry, field, GUEST_ID_LIMIT));
  if (new Set(values).size !== values.length) {
    throw new MvpError(500, 'INVALID_COMMAND_STATE', `Stored ${field} metadata is invalid`);
  }
  return values;
}

function boundedString(value: unknown, field: string, maximum: number): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > maximum || hasControlCharacter(value)) {
    throw new MvpError(500, 'INVALID_COMMAND_STATE', `Stored ${field} metadata is invalid`);
  }
  return value;
}

function eventSnapshot(value: unknown): PendingInvitationCommand['eventSnapshot'] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new MvpError(500, 'INVALID_COMMAND_STATE', 'Stored event snapshot is invalid');
  }
  const row = value as Record<string, unknown>;
  const start = boundedString(row.start, 'event start', 40);
  const end = boundedString(row.end, 'event end', 40);
  if (Number.isNaN(new Date(start).getTime()) || Number.isNaN(new Date(end).getTime())) {
    throw new MvpError(500, 'INVALID_COMMAND_STATE', 'Stored event snapshot is invalid');
  }
  return {
    eventName: boundedString(row.eventName, 'event name', 120),
    hostName: boundedString(row.hostName, 'host name', 255),
    start,
    end,
    timezone: boundedString(row.timezone, 'event timezone', 50),
    location: boundedString(row.location, 'event location', 255),
  };
}

function deliverySnapshots(value: unknown): DeliverySnapshot[] {
  if (!Array.isArray(value) || value.length > MAX_RECIPIENTS) {
    throw new MvpError(500, 'INVALID_COMMAND_STATE', 'Stored delivery snapshots are invalid');
  }
  return value.map((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new MvpError(500, 'INVALID_COMMAND_STATE', 'Stored delivery snapshots are invalid');
    }
    const row = entry as Record<string, unknown>;
    return {
      deliveryId: boundedString(row.deliveryId, 'delivery id', GUEST_ID_LIMIT),
      invitationId: boundedString(row.invitationId, 'invitation id', GUEST_ID_LIMIT),
      guestId: boundedString(row.guestId, 'guest id', GUEST_ID_LIMIT),
      guestName: boundedString(row.guestName, 'guest name', 120),
      recipient: boundedString(row.recipient, 'recipient', 254),
    };
  });
}

function pendingPayload(value: Prisma.JsonValue | null): PendingInvitationCommand {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new MvpError(500, 'INVALID_COMMAND_STATE', 'Stored invitation command metadata is unavailable');
  }
  const row = value as Record<string, unknown>;
  if (row.version !== PENDING_PAYLOAD_VERSION) {
    throw new MvpError(500, 'INVALID_COMMAND_STATE', 'Stored invitation command metadata is unavailable');
  }
  const guestIds = stringArray(row.guestIds, 'guestIds');
  const deliveryIds = stringArray(row.deliveryIds, 'deliveryIds');
  const snapshots = deliverySnapshots(row.deliverySnapshots);
  const snapshotIds = snapshots.map((snapshot) => snapshot.deliveryId);
  if (guestIds.length < 1
    || deliveryIds.length > guestIds.length
    || snapshots.length !== deliveryIds.length
    || snapshotIds.some((id, index) => id !== deliveryIds[index])
    || snapshots.some((snapshot) => !guestIds.includes(snapshot.guestId))) {
    throw new MvpError(500, 'INVALID_COMMAND_STATE', 'Stored invitation command metadata is unavailable');
  }
  return {
    version: 1,
    eventId: boundedString(row.eventId, 'eventId', GUEST_ID_LIMIT),
    guestIds,
    deliveryIds,
    eventSnapshot: eventSnapshot(row.eventSnapshot),
    deliverySnapshots: snapshots,
  };
}

function storedResponse(value: Prisma.JsonValue | null): MvpHttpResponse<MvpInvitationSendResult> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new MvpError(500, 'INVALID_COMMAND_STATE', 'Stored invitation response is unavailable');
  }
  const row = value as Record<string, unknown>;
  if (!Number.isInteger(row.status) || !row.body || typeof row.body !== 'object' || Array.isArray(row.body)) {
    throw new MvpError(500, 'INVALID_COMMAND_STATE', 'Stored invitation response is unavailable');
  }
  return { status: row.status as number, body: row.body as unknown as MvpInvitationSendResult };
}

function resolveCommand(row: CommandRow, requestHash: string): CommandPreparation {
  if (row.operation !== INVITATION_OPERATION || row.request_hash !== requestHash) {
    throw new MvpError(409, 'IDEMPOTENCY_KEY_CONFLICT', 'Idempotency key was used for a different request');
  }
  if (row.status === 'completed') return { kind: 'completed', response: storedResponse(row.response) };
  if (row.status !== 'pending') {
    throw new MvpError(409, 'COMMAND_FAILED', 'The invitation command cannot be resumed');
  }
  return { kind: 'pending', commandId: row.id, payload: pendingPayload(row.request_payload) };
}

function errorCode(error: unknown): string {
  if (!error || typeof error !== 'object') return '';
  return String((error as { code?: unknown }).code ?? '');
}

function uniqueConflict(error: unknown): boolean {
  const code = errorCode(error);
  return code === 'P2002' || code === '23505';
}

function safeMessageId(value: string | undefined): string | null {
  if (!value) return null;
  const normalized = [...value].filter((character) => {
    const code = character.charCodeAt(0);
    return code >= 32 && code !== 127;
  }).join('').trim();
  return normalized ? normalized.slice(0, 500) : null;
}

function safeProviderResult(result: InvitationProviderResult): InvitationProviderResult {
  const messageId = safeMessageId(result.messageId) ?? undefined;
  if (result.outcome === 'accepted') return { outcome: 'accepted', provider: 'acs', messageId };
  const error = /^[a-z0-9_]{1,80}$/.test(result.errorCode ?? '')
    ? result.errorCode
    : 'provider_unavailable';
  return { outcome: result.outcome, provider: 'acs', messageId, errorCode: error };
}

function claimedDelivery(
  row: ClaimedDeliveryRow,
  snapshot: DeliverySnapshot | undefined,
  payload: PendingInvitationCommand,
  eventStatus: string,
  leaseToken: string,
): ClaimedDelivery {
  if (!snapshot
    || snapshot.invitationId !== row.invitation_id
    || snapshot.guestId !== row.guest_id
    || row.event_id !== payload.eventId) {
    throw new MvpError(500, 'INVALID_COMMAND_STATE', 'Invitation delivery snapshot is inconsistent');
  }
  return {
    id: row.id,
    leaseToken,
    invitationId: row.invitation_id,
    invitationTokenHash: row.invitation.token_hash,
    invitationExpiresAt: row.invitation.expires_at,
    invitationRevokedAt: row.invitation.revoked_at,
    guestId: row.guest_id,
    guestName: snapshot.guestName,
    recipient: snapshot.recipient,
    event: {
      id: payload.eventId,
      eventName: payload.eventSnapshot.eventName,
      hostName: payload.eventSnapshot.hostName,
      start: new Date(payload.eventSnapshot.start),
      end: new Date(payload.eventSnapshot.end),
      timezone: payload.eventSnapshot.timezone,
      location: payload.eventSnapshot.location,
      status: eventStatus,
    },
  };
}

function commandPayload(
  eventId: string,
  guestIds: string[],
  event: InvitationEventRow,
  queued: DeliverySnapshot[],
): PendingInvitationCommand {
  return {
    version: 1,
    eventId,
    guestIds,
    deliveryIds: queued.map((delivery) => delivery.deliveryId),
    eventSnapshot: {
      eventName: event.eventName,
      hostName: event.hostName,
      start: event.start.toISOString(),
      end: event.end.toISOString(),
      timezone: event.timezone,
      location: event.location,
    },
    deliverySnapshots: queued,
  };
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/** Host-only fixed invitation delivery with durable command recovery. */
export class MvpInvitationsService {
  private readonly provider: InvitationProvider;
  private readonly clock: () => Date;
  private readonly idFactory: () => string;
  private readonly secret: () => string;
  private readonly wait: (milliseconds: number) => Promise<void>;

  constructor(private readonly database: PrismaClient, options: InvitationServiceOptions = {}) {
    this.provider = options.provider ?? new AcsInvitationProvider();
    this.clock = options.clock ?? (() => new Date());
    this.idFactory = options.idFactory ?? randomUUID;
    this.secret = options.secret ?? getInvitationTokenSecret;
    this.wait = options.wait ?? delay;
  }

  async list(actorId: string, eventId: string): Promise<MvpHttpResponse<MvpInvitationPage>> {
    const now = this.clock();
    const event = await this.database.event.findFirst({
      where: eventWhere(eventId, actorId),
      select: {
        id: true,
        name: true,
        start_date: true,
        end_date: true,
        timezone: true,
        location: true,
        status: true,
        host: { select: { name: true } },
      },
    });
    if (!event) throw new MvpError(404, 'EVENT_NOT_FOUND', 'Event not found');
    assertFuturePublished(event, now);
    const guests = await this.database.guest.findMany({
      where: { event_id: eventId },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      select: GUEST_SELECT,
    });
    return {
      status: 200,
      body: {
        event: {
          id: event.id,
          status: 'published',
          start: event.start_date.toISOString(),
          end: event.end_date.toISOString(),
        },
        preview: fixedInvitationPreview(invitationDetails(event)),
        candidates: guests.map((guest) => candidate(guest as GuestRow)),
      },
    };
  }

  async send(
    actorId: string,
    eventId: string,
    body: unknown,
    idempotencyHeader: string | undefined,
  ): Promise<MvpHttpResponse<MvpInvitationSendResult>> {
    const guestIds = parseInvitationSend(body).sort();
    const idempotencyKey = parseIdempotencyKey(idempotencyHeader);
    const requestHash = hashMvpRequest(INVITATION_OPERATION, { eventId, guestIds });
    const secret = this.secret();
    try {
      const preparation = await this.prepare(actorId, idempotencyKey, requestHash, eventId, guestIds, secret);
      if (preparation.kind === 'completed') return preparation.response;
      const claimed = await this.claim(preparation);
      const hasUnknown = await this.deliverClaimed(claimed, secret);
      const completed = await this.finalize(actorId, idempotencyKey, requestHash, preparation);
      if (completed) return completed;
      if (!hasUnknown) {
        const replay = await this.waitForCompletion(actorId, idempotencyKey, requestHash);
        if (replay) return replay;
      }
      throw new MvpError(409, 'COMMAND_IN_PROGRESS', 'The invitation command is still being processed');
    } catch (error) {
      throw mapMvpDatabaseError(error);
    }
  }

  private async prepare(
    actorId: string,
    idempotencyKey: string,
    requestHash: string,
    eventId: string,
    guestIds: string[],
    secret: string,
  ): Promise<CommandPreparation> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        return await this.database.$transaction((transaction) => this.prepareInTransaction(
          transaction,
          actorId,
          idempotencyKey,
          requestHash,
          eventId,
          guestIds,
          secret,
        ));
      } catch (error) {
        if (!(error instanceof CommandClaimConflict) || attempt === 1) throw error;
      }
    }
    throw new MvpError(409, 'COMMAND_IN_PROGRESS', 'The invitation command is still being processed');
  }

  private async prepareInTransaction(
    transaction: Prisma.TransactionClient,
    actorId: string,
    idempotencyKey: string,
    requestHash: string,
    eventId: string,
    guestIds: string[],
    secret: string,
  ): Promise<CommandPreparation> {
    const existing = await transaction.mvpCommand.findUnique({
      where: { actor_id_idempotency_key: { actor_id: actorId, idempotency_key: idempotencyKey } },
      select: {
        id: true,
        operation: true,
        request_hash: true,
        status: true,
        request_payload: true,
        response: true,
      },
    });
    if (existing) return resolveCommand(existing, requestHash);
    const commandId = await this.createPendingCommand(
      transaction,
      actorId,
      idempotencyKey,
      requestHash,
      eventId,
      guestIds,
    );
    const now = this.clock();
    const event = await this.lockOwnedEvent(transaction, actorId, eventId);
    assertFuturePublished({ status: event.status, start_date: event.start }, now);
    const guests = await this.requireSelectedGuests(transaction, eventId, guestIds);
    const queued = await this.queueEligibleDeliveries(
      transaction,
      commandId,
      actorId,
      event,
      guests,
      now,
      secret,
    );
    const payload = commandPayload(eventId, guestIds, event, queued);
    await transaction.mvpCommand.update({
      where: { id: commandId },
      data: { request_payload: jsonValue(payload) },
    });
    return { kind: 'pending', commandId, payload };
  }

  private async createPendingCommand(
    transaction: Prisma.TransactionClient,
    actorId: string,
    idempotencyKey: string,
    requestHash: string,
    eventId: string,
    guestIds: string[],
  ): Promise<string> {
    try {
      const command = await transaction.mvpCommand.create({
        data: {
          actor_id: actorId,
          idempotency_key: idempotencyKey,
          operation: INVITATION_OPERATION,
          request_hash: requestHash,
          request_payload: jsonValue({
            version: PENDING_PAYLOAD_VERSION,
            eventId,
            guestIds,
            deliveryIds: [],
          }),
          expires_at: new Date(this.clock().getTime() + COMMAND_TTL_MS),
        },
        select: { id: true },
      });
      return command.id;
    } catch (error) {
      if (uniqueConflict(error)) throw new CommandClaimConflict();
      throw error;
    }
  }

  private async queueEligibleDeliveries(
    transaction: Prisma.TransactionClient,
    commandId: string,
    actorId: string,
    event: InvitationEventRow,
    guests: GuestRow[],
    now: Date,
    secret: string,
  ): Promise<DeliverySnapshot[]> {
    const eligible = guests.filter((guest) => !NON_RETRYABLE_DELIVERY_STATUSES.has(
      guest.guest_invitation?.deliveries[0]?.status ?? '',
    ));
    await this.assertHostRate(transaction, actorId, eligible.length, now);
    const queued: DeliverySnapshot[] = [];
    for (const guest of eligible) {
      queued.push(await this.queueDelivery(transaction, commandId, event, guest, now, secret));
    }
    return queued;
  }

  private async lockOwnedEvent(
    transaction: Prisma.TransactionClient,
    actorId: string,
    eventId: string,
  ): Promise<InvitationEventRow> {
    const rows = await transaction.$queryRaw<Array<{
      id: string;
      name: string;
      start_date: Date;
      end_date: Date;
      timezone: string | null;
      location: string;
      status: string;
      host_name: string | null;
    }>>(Prisma.sql`
      SELECT e.id, e.name, e.start_date, e.end_date, e.timezone, e.location,
             e.status, u.name AS host_name
      FROM events e
      JOIN users u ON u.id = e.host_id
      WHERE e.id = ${eventId}
        AND e.host_id = ${actorId}
        AND e.privacy = 'private'
        AND e.is_public = false
        AND e.max_guests = 50
        AND u.account_status = 'active'
      FOR UPDATE OF u, e
    `);
    const row = rows[0];
    if (!row) throw new MvpError(404, 'EVENT_NOT_FOUND', 'Event not found');
    return {
      id: row.id,
      eventName: row.name,
      hostName: row.host_name?.trim() || 'Your host',
      start: row.start_date,
      end: row.end_date,
      timezone: row.timezone || 'UTC',
      location: row.location,
      status: row.status,
    };
  }

  private async requireSelectedGuests(
    transaction: Prisma.TransactionClient,
    eventId: string,
    guestIds: string[],
  ): Promise<GuestRow[]> {
    const rows = await transaction.guest.findMany({
      where: { event_id: eventId, id: { in: guestIds } },
      select: GUEST_SELECT,
    });
    if (rows.length !== guestIds.length) {
      throw new MvpError(404, 'GUEST_NOT_FOUND', 'One or more guests were not found');
    }
    const byId = new Map(rows.map((guest) => [guest.id, guest as GuestRow]));
    return guestIds.map((id) => {
      const guest = byId.get(id);
      if (!guest) throw new MvpError(404, 'GUEST_NOT_FOUND', 'One or more guests were not found');
      return guest;
    });
  }

  private async assertHostRate(
    transaction: Prisma.TransactionClient,
    actorId: string,
    requested: number,
    now: Date,
  ): Promise<void> {
    if (requested === 0) return;
    const used = await transaction.invitationDelivery.count({
      where: {
        created_at: { gte: new Date(now.getTime() - RATE_WINDOW_MS) },
        event: { host_id: actorId },
      },
    });
    if (used + requested > HOST_HOURLY_RECIPIENT_LIMIT) {
      throw new MvpError(429, 'INVITATION_RATE_LIMITED', 'The hourly invitation limit has been reached');
    }
  }

  private async queueDelivery(
    transaction: Prisma.TransactionClient,
    commandId: string,
    event: InvitationEventRow,
    guest: GuestRow,
    now: Date,
    secret: string,
  ): Promise<DeliverySnapshot> {
    const invitationId = await this.ensureInvitation(transaction, event, guest, now, secret);
    const previousAttempt = guest.guest_invitation?.deliveries[0]?.attempt_count ?? 0;
    const deliveryId = this.idFactory();
    await transaction.invitationDelivery.create({
      data: {
        id: deliveryId,
        command_id: commandId,
        invitation_id: invitationId,
        event_id: event.id,
        guest_id: guest.id,
        status: 'queued',
        provider: this.provider.name,
        provider_message_id: deliveryId,
        attempt_count: previousAttempt,
        created_at: now,
      },
    });
    return {
      deliveryId,
      invitationId,
      guestId: guest.id,
      guestName: guest.name,
      recipient: guest.email.trim().toLowerCase(),
    };
  }

  private async ensureInvitation(
    transaction: Prisma.TransactionClient,
    event: InvitationEventRow,
    guest: GuestRow,
    now: Date,
    secret: string,
  ): Promise<string> {
    const invitationId = guest.guest_invitation?.id ?? this.idFactory();
    const token = deriveInvitationToken(secret, invitationId, guest.id, event.id);
    const tokenHash = hashInvitationToken(token);
    if (guest.guest_invitation) {
      await transaction.guestInvitation.update({
        where: { id: invitationId },
        data: { token_hash: tokenHash, expires_at: event.end, revoked_at: null },
      });
      return invitationId;
    }
    await transaction.guestInvitation.create({
      data: {
        id: invitationId,
        guest_id: guest.id,
        event_id: event.id,
        token_hash: tokenHash,
        expires_at: event.end,
        created_at: now,
      },
    });
    return invitationId;
  }

  private async claim(preparation: PendingPreparation): Promise<ClaimedDelivery[]> {
    if (preparation.payload.deliveryIds.length === 0) return [];
    const leaseToken = this.idFactory();
    const now = this.clock();
    return this.database.$transaction(async (transaction) => {
      const actorId = await this.commandActor(transaction, preparation.commandId);
      if (!actorId) return [];
      const event = await this.lockOwnedEvent(transaction, actorId, preparation.payload.eventId);
      assertFuturePublished({ status: event.status, start_date: event.start }, now);
      const rows = await this.claimRows(transaction, preparation, leaseToken, now);
      const snapshots = new Map(preparation.payload.deliverySnapshots.map((snapshot) => [snapshot.deliveryId, snapshot]));
      return rows.map((row) => claimedDelivery(
        row,
        snapshots.get(row.id),
        preparation.payload,
        event.status,
        leaseToken,
      ));
    });
  }

  private async claimRows(
    transaction: Prisma.TransactionClient,
    preparation: PendingPreparation,
    leaseToken: string,
    now: Date,
  ): Promise<ClaimedDeliveryRow[]> {
    await transaction.invitationDelivery.updateMany({
      where: {
        id: { in: preparation.payload.deliveryIds },
        command_id: preparation.commandId,
        OR: [
          { status: 'queued' },
          { status: 'processing', lease_expires_at: { lte: now } },
        ],
      },
      data: {
        status: 'processing',
        processing_started_at: now,
        lease_expires_at: new Date(now.getTime() + DELIVERY_LEASE_MS),
        lease_token: leaseToken,
        error_code: null,
        attempt_count: { increment: 1 },
      },
    });
    return transaction.invitationDelivery.findMany({
      where: {
        id: { in: preparation.payload.deliveryIds },
        command_id: preparation.commandId,
        status: 'processing',
        lease_token: leaseToken,
      },
      select: {
        id: true,
        invitation_id: true,
        event_id: true,
        guest_id: true,
        invitation: { select: { token_hash: true, expires_at: true, revoked_at: true } },
      },
    });
  }

  private async commandActor(transaction: Prisma.TransactionClient, commandId: string): Promise<string | null> {
    const command = await transaction.mvpCommand.findUnique({
      where: { id: commandId },
      select: { actor_id: true, status: true },
    });
    if (command?.status === 'completed') return null;
    if (!command || command.status !== 'pending') {
      throw new MvpError(409, 'COMMAND_IN_PROGRESS', 'The invitation command is not claimable');
    }
    return command.actor_id;
  }

  private async deliverClaimed(claimed: ClaimedDelivery[], secret: string): Promise<boolean> {
    const outcomes = await Promise.all(claimed.map((delivery) => this.deliver(delivery, secret)));
    return outcomes.some((outcome) => outcome === 'unknown');
  }

  private async deliver(delivery: ClaimedDelivery, secret: string): Promise<InvitationProviderResult['outcome']> {
    const token = deriveInvitationToken(
      secret,
      delivery.invitationId,
      delivery.guestId,
      delivery.event.id,
    );
    const validCredential = delivery.invitationRevokedAt === null
      && delivery.invitationExpiresAt.getTime() > this.clock().getTime()
      && hashInvitationToken(token) === delivery.invitationTokenHash;
    const recipient = delivery.recipient.trim().toLowerCase();
    let result: InvitationProviderResult;
    if (!validCredential) {
      result = { outcome: 'failed', provider: 'acs', errorCode: 'invalid_credential' };
    } else if (!RECIPIENT_EMAIL.test(recipient) || hasControlCharacter(recipient)) {
      result = { outcome: 'failed', provider: 'acs', errorCode: 'invalid_recipient' };
    } else {
      const email = renderFixedInvitation(delivery.event, delivery.guestName, token);
      try {
        result = safeProviderResult(await this.provider.send({
          recipient,
          subject: email.subject,
          html: email.html,
          plainText: email.plainText,
          operationId: delivery.id,
        }));
      } catch {
        result = {
          outcome: 'unknown',
          provider: 'acs',
          messageId: delivery.id,
          errorCode: 'provider_unavailable',
        };
      }
    }
    await this.persistDeliveryResult(delivery, result);
    return result.outcome;
  }

  private async persistDeliveryResult(
    delivery: ClaimedDelivery,
    result: InvitationProviderResult,
  ): Promise<void> {
    const messageId = safeMessageId(result.messageId) ?? delivery.id;
    const error = result.outcome === 'accepted' ? null : result.errorCode ?? 'provider_unavailable';
    const now = this.clock();
    const data: Prisma.InvitationDeliveryUpdateManyMutationInput = result.outcome === 'accepted'
      ? {
          status: 'accepted',
          provider_message_id: messageId,
          error_code: null,
          accepted_at: now,
          lease_expires_at: null,
          lease_token: null,
        }
      : result.outcome === 'failed'
        ? {
            status: 'failed',
            provider_message_id: messageId,
            error_code: error,
            failed_at: now,
            lease_expires_at: null,
            lease_token: null,
          }
        : { provider_message_id: messageId, error_code: error };
    await this.database.invitationDelivery.updateMany({
      where: { id: delivery.id, status: 'processing', lease_token: delivery.leaseToken },
      data,
    });
  }

  private async finalize(
    actorId: string,
    idempotencyKey: string,
    requestHash: string,
    preparation: PendingPreparation,
  ): Promise<MvpHttpResponse<MvpInvitationSendResult> | null> {
    return this.database.$transaction((transaction) => this.finalizeInTransaction(
      transaction,
      actorId,
      idempotencyKey,
      requestHash,
      preparation,
    ));
  }

  private async finalizeInTransaction(
    transaction: Prisma.TransactionClient,
    actorId: string,
    idempotencyKey: string,
    requestHash: string,
    preparation: PendingPreparation,
  ): Promise<MvpHttpResponse<MvpInvitationSendResult> | null> {
    const command = await transaction.mvpCommand.findUnique({
      where: { actor_id_idempotency_key: { actor_id: actorId, idempotency_key: idempotencyKey } },
      select: {
        id: true,
        operation: true,
        request_hash: true,
        status: true,
        request_payload: true,
        response: true,
      },
    });
    if (!command) throw new MvpError(500, 'INVALID_COMMAND_STATE', 'Invitation command is unavailable');
    const state = resolveCommand(command, requestHash);
    if (state.kind === 'completed') return state.response;
    if (state.commandId !== preparation.commandId) {
      throw new MvpError(500, 'INVALID_COMMAND_STATE', 'Invitation command identity changed');
    }
    const currentDeliveries = await transaction.invitationDelivery.findMany({
      where: { command_id: preparation.commandId },
      select: DELIVERY_SELECT,
    });
    this.assertDeliveryMetadata(currentDeliveries, preparation.payload.deliveryIds);
    if (currentDeliveries.some((delivery) => !TERMINAL_DELIVERY_STATUSES.has(delivery.status))) return null;
    const response = await this.buildResponse(transaction, preparation, currentDeliveries);
    return this.completeCommand(transaction, preparation.commandId, requestHash, response);
  }

  private assertDeliveryMetadata(deliveries: DeliveryRow[], expectedIds: string[]): void {
    const deliveryIds = new Set(deliveries.map((delivery) => delivery.id));
    if (deliveries.length !== expectedIds.length || expectedIds.some((id) => !deliveryIds.has(id))) {
      throw new MvpError(500, 'INVALID_COMMAND_STATE', 'Invitation delivery metadata is incomplete');
    }
  }

  private async buildResponse(
    transaction: Prisma.TransactionClient,
    preparation: PendingPreparation,
    currentDeliveries: DeliveryRow[],
  ): Promise<MvpHttpResponse<MvpInvitationSendResult>> {
    const guests = await this.requireSelectedGuests(
      transaction,
      preparation.payload.eventId,
      preparation.payload.guestIds,
    );
    const currentByGuest = new Map(currentDeliveries.map((delivery) => [delivery.guest_id, delivery]));
    return {
      status: 200,
      body: {
        eventId: preparation.payload.eventId,
        requestedCount: preparation.payload.guestIds.length,
        attemptedCount: currentDeliveries.length,
        results: guests.map((guest) => this.deliveryResult(guest, currentByGuest.get(guest.id))),
      },
    };
  }

  private async completeCommand(
    transaction: Prisma.TransactionClient,
    commandId: string,
    requestHash: string,
    response: MvpHttpResponse<MvpInvitationSendResult>,
  ): Promise<MvpHttpResponse<MvpInvitationSendResult>> {
    const completed = await transaction.mvpCommand.updateMany({
      where: { id: commandId, status: 'pending', request_hash: requestHash },
      data: {
        status: 'completed',
        request_payload: Prisma.DbNull,
        response: jsonValue(response),
      },
    });
    if (completed.count === 1) return response;
    const winner = await transaction.mvpCommand.findUnique({
      where: { id: commandId },
      select: { response: true },
    });
    return storedResponse(winner?.response ?? null);
  }

  private deliveryResult(guest: GuestRow, current?: DeliveryRow): MvpInvitationSendItem {
    const delivery = current ?? guest.guest_invitation?.deliveries[0];
    const status = publicDeliveryStatus(delivery?.status);
    if (!delivery || status === 'not_sent') {
      throw new MvpError(500, 'INVALID_COMMAND_STATE', 'Invitation delivery result is unavailable');
    }
    return {
      guestId: guest.id,
      name: guest.name,
      status,
      attempted: Boolean(current),
      provider: 'acs',
      providerMessageId: delivery.provider_message_id,
      errorCode: delivery.error_code,
    };
  }

  private async waitForCompletion(
    actorId: string,
    idempotencyKey: string,
    requestHash: string,
  ): Promise<MvpHttpResponse<MvpInvitationSendResult> | null> {
    for (let attempt = 0; attempt < COMMAND_WAIT_ATTEMPTS; attempt += 1) {
      await this.wait(COMMAND_WAIT_DELAY_MS);
      const command = await this.database.mvpCommand.findUnique({
        where: { actor_id_idempotency_key: { actor_id: actorId, idempotency_key: idempotencyKey } },
        select: {
          id: true,
          operation: true,
          request_hash: true,
          status: true,
          request_payload: true,
          response: true,
        },
      });
      if (!command) throw new MvpError(500, 'INVALID_COMMAND_STATE', 'Invitation command is unavailable');
      const state = resolveCommand(command, requestHash);
      if (state.kind === 'completed') return state.response;
    }
    return null;
  }
}
