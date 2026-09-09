import type { Prisma, PrismaClient } from '@prisma/client';

import { executeMvpCommand, mapMvpDatabaseError } from './mvp-command';
import {
  MVP_EVENT_STATUSES,
  MvpError,
  mvpGuestStats,
  parseCorrection,
  parseGuestCreate,
  parseGuestPatch,
  parseIdempotencyKey,
  parseRevisionBody,
  toMvpGuest,
  type MvpEventStatus,
  type MvpGuestDto,
  type MvpGuestStats,
  type MvpHttpResponse,
  type ParsedGuestCreate,
} from './mvp-contract';

const GUEST_SELECT = {
  id: true,
  event_id: true,
  name: true,
  email: true,
  normalized_email: true,
  rsvp_status: true,
  rsvp_responded_at: true,
  checked_in: true,
  checked_in_at: true,
  revision: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.GuestSelect;

const CREATE_ATTEMPTS = 2;

interface OwnedEvent {
  id: string;
  status: string;
  max_guests: number;
}

function ownedEventWhere(id: string, actorId: string): Prisma.EventWhereInput {
  return {
    id,
    host_id: actorId,
    privacy: 'private',
    is_public: false,
    max_guests: 50,
    status: { in: [...MVP_EVENT_STATUSES] },
  };
}

async function requireOwnedEvent(
  transaction: Prisma.TransactionClient,
  id: string,
  actorId: string,
): Promise<OwnedEvent> {
  const event = await transaction.event.findFirst({
    where: ownedEventWhere(id, actorId),
    select: { id: true, status: true, max_guests: true },
  });
  if (!event) throw new MvpError(404, 'EVENT_NOT_FOUND', 'Event not found');
  return event;
}

async function requireOwnedGuest(
  transaction: Prisma.TransactionClient,
  id: string,
  actorId: string,
) {
  const guest = await transaction.guest.findUnique({ where: { id }, select: GUEST_SELECT });
  if (!guest) throw new MvpError(404, 'GUEST_NOT_FOUND', 'Guest not found');
  const event = await transaction.event.findFirst({
    where: ownedEventWhere(guest.event_id, actorId),
    select: { id: true, status: true, max_guests: true },
  });
  if (!event) throw new MvpError(404, 'GUEST_NOT_FOUND', 'Guest not found');
  return { guest, event };
}

function uniqueGuestInputs(input: ParsedGuestCreate) {
  const byEmail = new Map<string, ParsedGuestCreate['guests'][number]>();
  for (const guest of input.guests) {
    if (!byEmail.has(guest.email)) byEmail.set(guest.email, guest);
  }
  return [...byEmail.values()];
}

function guestCreatePayload(eventId: string, input: ParsedGuestCreate): Record<string, unknown> {
  return { eventId, isBatch: input.isBatch, guests: input.guests };
}

function guestCreateData(eventId: string, guest: ParsedGuestCreate['guests'][number]): Prisma.GuestCreateManyInput {
  return {
    event_id: eventId,
    name: guest.name,
    email: guest.email,
    rsvp_status: 'pending',
    checked_in: false,
    is_checked_in: false,
    revision: 1,
    dietary_restrictions: [],
  };
}

function assertRevision(actual: number, expected: number): void {
  if (actual !== expected) {
    throw new MvpError(409, 'REVISION_CONFLICT', 'The record was changed by another request');
  }
}

function assertAttendanceAllowed(event: OwnedEvent, rsvpStatus: string): void {
  if (event.status !== 'published') {
    throw new MvpError(409, 'EVENT_NOT_PUBLISHED', 'Attendance is available only for published events');
  }
  if (rsvpStatus !== 'accepted') {
    throw new MvpError(409, 'GUEST_NOT_ACCEPTED', 'Only an accepted guest can be checked in');
  }
}

async function readUpdatedGuest(transaction: Prisma.TransactionClient, id: string): Promise<MvpGuestDto> {
  const guest = await transaction.guest.findUnique({ where: { id }, select: GUEST_SELECT });
  if (!guest) throw new MvpError(404, 'GUEST_NOT_FOUND', 'Guest not found');
  return toMvpGuest(guest);
}

export interface MvpGuestListBody {
  event: { id: string; status: MvpEventStatus; capacity: 50 };
  guests: MvpGuestDto[];
  stats: MvpGuestStats;
}

export interface MvpGuestCreateBody {
  guests: MvpGuestDto[];
  createdCount: number;
  existingCount: number;
}

/** Database-backed implementation of strict host-only guest and attendance APIs. */
export class MvpGuestsService {
  constructor(private readonly database: PrismaClient) {}

  async list(
    actorId: string,
    eventId: string,
  ): Promise<MvpHttpResponse<MvpGuestListBody>> {
    const event = await this.database.event.findFirst({
      where: ownedEventWhere(eventId, actorId),
      select: { id: true, status: true, max_guests: true },
    });
    if (!event) throw new MvpError(404, 'EVENT_NOT_FOUND', 'Event not found');
    const rows = await this.database.guest.findMany({
      where: { event_id: eventId },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      select: GUEST_SELECT,
    });
    const guests = rows.map(toMvpGuest);
    return {
      status: 200,
      body: {
        event: { id: event.id, status: event.status as MvpEventStatus, capacity: 50 },
        guests,
        stats: mvpGuestStats(guests),
      },
    };
  }

  async get(actorId: string, id: string): Promise<MvpHttpResponse<{ guest: MvpGuestDto }>> {
    const response = await this.database.$transaction(async (transaction) => {
      const { guest } = await requireOwnedGuest(transaction, id, actorId);
      return { status: 200, body: { guest: toMvpGuest(guest) } };
    });
    return response;
  }

  async create(
    actorId: string,
    eventId: string,
    body: unknown,
    idempotencyHeader: string | undefined,
  ): Promise<MvpHttpResponse<MvpGuestCreateBody>> {
    const input = parseGuestCreate(body);
    const idempotencyKey = parseIdempotencyKey(idempotencyHeader);
    for (let attempt = 1; attempt <= CREATE_ATTEMPTS; attempt += 1) {
      try {
        return await executeMvpCommand(
          this.database,
          actorId,
          idempotencyKey,
          'guest.create',
          guestCreatePayload(eventId, input),
          (transaction) => this.createInTransaction(transaction, actorId, eventId, input),
        );
      } catch (error) {
        const mapped = mapMvpDatabaseError(error);
        const retryableRace = mapped.code === 'GUEST_EMAIL_EXISTS'
          || mapped.code === 'GUEST_LIMIT_REACHED';
        if (!retryableRace || attempt === CREATE_ATTEMPTS) throw mapped;
      }
    }
    throw new MvpError(409, 'GUEST_EMAIL_EXISTS', 'A guest with this email already exists');
  }

  async update(
    actorId: string,
    id: string,
    body: unknown,
  ): Promise<MvpHttpResponse<{ guest: MvpGuestDto }>> {
    const input = parseGuestPatch(body);
    try {
      return await this.database.$transaction(async (transaction) => {
        const { guest } = await requireOwnedGuest(transaction, id, actorId);
        assertRevision(guest.revision, input.expectedRevision);
        const data: Prisma.GuestUpdateManyMutationInput = { revision: { increment: 1 } };
        if (input.name !== undefined) data.name = input.name;
        if (input.email !== undefined) data.email = input.email;
        const updated = await transaction.guest.updateMany({
          where: { id, event_id: guest.event_id, revision: input.expectedRevision },
          data,
        });
        if (updated.count !== 1) {
          throw new MvpError(409, 'REVISION_CONFLICT', 'The record was changed by another request');
        }
        return { status: 200, body: { guest: await readUpdatedGuest(transaction, id) } };
      });
    } catch (error) {
      throw mapMvpDatabaseError(error);
    }
  }

  async remove(
    actorId: string,
    id: string,
    body: unknown,
    idempotencyHeader: string | undefined,
  ): Promise<MvpHttpResponse<{ deleted: true; guestId: string; eventId: string }>> {
    const expectedRevision = parseRevisionBody(body);
    const idempotencyKey = parseIdempotencyKey(idempotencyHeader);
    try {
      return await executeMvpCommand(
        this.database,
        actorId,
        idempotencyKey,
        'guest.delete',
        { id, expectedRevision },
        async (transaction) => {
          const { guest } = await requireOwnedGuest(transaction, id, actorId);
          assertRevision(guest.revision, expectedRevision);
          const deleted = await transaction.guest.deleteMany({
            where: { id, event_id: guest.event_id, revision: expectedRevision },
          });
          if (deleted.count !== 1) {
            throw new MvpError(409, 'REVISION_CONFLICT', 'The record was changed by another request');
          }
          return {
            status: 200,
            body: { deleted: true as const, guestId: id, eventId: guest.event_id },
          };
        },
      );
    } catch (error) {
      throw mapMvpDatabaseError(error);
    }
  }

  async checkIn(
    actorId: string,
    id: string,
    body: unknown,
    idempotencyHeader: string | undefined,
  ): Promise<MvpHttpResponse<{ guest: MvpGuestDto }>> {
    const expectedRevision = parseRevisionBody(body);
    return this.attendanceCommand(actorId, id, expectedRevision, true, 'check_in', idempotencyHeader);
  }

  async correctCheckIn(
    actorId: string,
    id: string,
    body: unknown,
    idempotencyHeader: string | undefined,
  ): Promise<MvpHttpResponse<{ guest: MvpGuestDto }>> {
    const input = parseCorrection(body);
    return this.attendanceCommand(
      actorId,
      id,
      input.expectedRevision,
      input.checkedIn,
      'correction',
      idempotencyHeader,
    );
  }

  private async createInTransaction(
    transaction: Prisma.TransactionClient,
    actorId: string,
    eventId: string,
    input: ParsedGuestCreate,
  ): Promise<MvpHttpResponse<MvpGuestCreateBody>> {
    await requireOwnedEvent(transaction, eventId, actorId);
    const uniqueInputs = uniqueGuestInputs(input);
    const emails = uniqueInputs.map((guest) => guest.email);
    const existing = await transaction.guest.findMany({
      where: { event_id: eventId, normalized_email: { in: emails } },
      select: GUEST_SELECT,
    });
    const existingEmails = new Set(existing.map((guest) => guest.normalized_email));
    const missing = uniqueInputs.filter((guest) => !existingEmails.has(guest.email));
    const currentCount = await transaction.guest.count({ where: { event_id: eventId } });
    if (currentCount + missing.length > 50) {
      throw new MvpError(409, 'GUEST_LIMIT_REACHED', 'This event already has 50 guests');
    }
    const created = missing.length === 0
      ? []
      : await transaction.guest.createManyAndReturn({
          data: missing.map((guest) => guestCreateData(eventId, guest)),
          select: GUEST_SELECT,
        });
    const byEmail = new Map([...existing, ...created].map((guest) => [guest.normalized_email, guest]));
    const guests = input.guests.map((guest) => {
      const row = byEmail.get(guest.email);
      if (!row) throw new MvpError(500, 'INVALID_COMMAND_STATE', 'A guest result is unavailable');
      return toMvpGuest(row);
    });
    return {
      status: created.length > 0 ? 201 : 200,
      body: {
        guests,
        createdCount: created.length,
        existingCount: input.guests.length - created.length,
      },
    };
  }

  private async attendanceCommand(
    actorId: string,
    id: string,
    expectedRevision: number,
    checkedIn: boolean,
    action: 'check_in' | 'correction',
    idempotencyHeader: string | undefined,
  ): Promise<MvpHttpResponse<{ guest: MvpGuestDto }>> {
    const idempotencyKey = parseIdempotencyKey(idempotencyHeader);
    try {
      return await executeMvpCommand(
        this.database,
        actorId,
        idempotencyKey,
        `guest.${action}`,
        { id, expectedRevision, checkedIn },
        (transaction, commandId) => this.applyAttendance(
          transaction,
          actorId,
          id,
          expectedRevision,
          checkedIn,
          action,
          commandId,
        ),
      );
    } catch (error) {
      throw mapMvpDatabaseError(error);
    }
  }

  private async applyAttendance(
    transaction: Prisma.TransactionClient,
    actorId: string,
    id: string,
    expectedRevision: number,
    checkedIn: boolean,
    action: 'check_in' | 'correction',
    commandId: string,
  ): Promise<MvpHttpResponse<{ guest: MvpGuestDto }>> {
    const { guest, event } = await requireOwnedGuest(transaction, id, actorId);
    assertAttendanceAllowed(event, guest.rsvp_status);
    if (action === 'check_in' && guest.checked_in) {
      return { status: 200, body: { guest: toMvpGuest(guest) } };
    }
    assertRevision(guest.revision, expectedRevision);
    if (action === 'correction' && guest.checked_in === checkedIn) {
      throw new MvpError(409, 'NO_ATTENDANCE_CHANGE', 'Correction must change the attendance state');
    }
    const occurredAt = new Date();
    const nextRevision = guest.revision + 1;
    const updated = await transaction.guest.updateMany({
      where: { id, event_id: guest.event_id, revision: expectedRevision },
      data: {
        checked_in: checkedIn,
        is_checked_in: checkedIn,
        checked_in_at: checkedIn ? occurredAt : null,
        revision: { increment: 1 },
      },
    });
    if (updated.count !== 1) {
      throw new MvpError(409, 'REVISION_CONFLICT', 'The record was changed by another request');
    }
    await transaction.attendanceAudit.create({
      data: {
        event_id: guest.event_id,
        guest_id: guest.id,
        actor_id: actorId,
        command_id: commandId,
        action,
        prior_state: guest.checked_in,
        new_state: checkedIn,
        guest_revision: nextRevision,
        occurred_at: occurredAt,
      },
    });
    return { status: 200, body: { guest: await readUpdatedGuest(transaction, id) } };
  }
}
