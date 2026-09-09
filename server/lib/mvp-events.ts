import type { Prisma, PrismaClient } from '@prisma/client';

import { executeMvpCommand, mapMvpDatabaseError } from './mvp-command';
import {
  MVP_EVENT_STATUSES,
  MvpError,
  parseEventCreate,
  parseEventPatch,
  parseIdempotencyKey,
  parseRevisionBody,
  toMvpEvent,
  validateEventWindow,
  type MvpEventDto,
  type MvpHttpResponse,
  type ParsedEventFields,
} from './mvp-contract';

const EVENT_SELECT = {
  id: true,
  name: true,
  description: true,
  start_date: true,
  end_date: true,
  timezone: true,
  location: true,
  status: true,
  privacy: true,
  max_guests: true,
  revision: true,
  published_at: true,
  cancelled_at: true,
  completed_at: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.EventSelect;

const EDITABLE_STATUSES = ['draft', 'published'];
const DELETABLE_STATUSES = ['draft', 'completed', 'cancelled'];

function ownedEventWhere(id: string | undefined, actorId: string): Prisma.EventWhereInput {
  return {
    ...(id ? { id } : {}),
    host_id: actorId,
    privacy: 'private',
    is_public: false,
    max_guests: 50,
    status: { in: [...MVP_EVENT_STATUSES] },
  };
}

function eventMutationData(changes: Partial<ParsedEventFields>): Prisma.EventUpdateManyMutationInput {
  const data: Prisma.EventUpdateManyMutationInput = { revision: { increment: 1 } };
  if (changes.name !== undefined) {
    data.name = changes.name;
    data.title = changes.name;
  }
  if (changes.description !== undefined) data.description = changes.description;
  if (changes.start !== undefined) data.start_date = changes.start;
  if (changes.end !== undefined) data.end_date = changes.end;
  if (changes.timezone !== undefined) data.timezone = changes.timezone;
  if (changes.location !== undefined) {
    data.location = changes.location;
    data.location_name = changes.location;
  }
  return data;
}

function canonicalEvent(fields: ParsedEventFields): Record<string, unknown> {
  return {
    name: fields.name,
    description: fields.description,
    start: fields.start.toISOString(),
    end: fields.end.toISOString(),
    timezone: fields.timezone,
    location: fields.location,
  };
}

function assertRevision(actual: number, expected: number): void {
  if (actual !== expected) {
    throw new MvpError(409, 'REVISION_CONFLICT', 'The record was changed by another request');
  }
}

async function updatedEvent(
  transaction: Prisma.TransactionClient,
  id: string,
  actorId: string,
): Promise<MvpEventDto> {
  const event = await transaction.event.findFirst({
    where: ownedEventWhere(id, actorId),
    select: EVENT_SELECT,
  });
  if (!event) throw new MvpError(404, 'EVENT_NOT_FOUND', 'Event not found');
  return toMvpEvent(event);
}

/** Database-backed implementation of the strict host-only event API. */
export class MvpEventsService {
  constructor(private readonly database: PrismaClient) {}

  async list(actorId: string): Promise<MvpHttpResponse<{ events: MvpEventDto[] }>> {
    const rows = await this.database.event.findMany({
      where: ownedEventWhere(undefined, actorId),
      orderBy: [{ start_date: 'asc' }, { id: 'asc' }],
      select: EVENT_SELECT,
    });
    return { status: 200, body: { events: rows.map(toMvpEvent) } };
  }

  async get(actorId: string, id: string): Promise<MvpHttpResponse<{ event: MvpEventDto }>> {
    const row = await this.database.event.findFirst({
      where: ownedEventWhere(id, actorId),
      select: EVENT_SELECT,
    });
    if (!row) throw new MvpError(404, 'EVENT_NOT_FOUND', 'Event not found');
    return { status: 200, body: { event: toMvpEvent(row) } };
  }

  async create(
    actorId: string,
    body: unknown,
    idempotencyHeader: string | undefined,
  ): Promise<MvpHttpResponse<{ event: MvpEventDto }>> {
    const fields = parseEventCreate(body);
    const idempotencyKey = parseIdempotencyKey(idempotencyHeader);
    try {
      return await executeMvpCommand(
        this.database,
        actorId,
        idempotencyKey,
        'event.create',
        canonicalEvent(fields),
        async (transaction) => {
          const event = await transaction.event.create({
            data: {
              host_id: actorId,
              name: fields.name,
              title: fields.name,
              description: fields.description,
              start_date: fields.start,
              end_date: fields.end,
              timezone: fields.timezone,
              location: fields.location,
              location_name: fields.location,
              status: 'draft',
              privacy: 'private',
              is_public: false,
              max_guests: 50,
              revision: 1,
            },
            select: EVENT_SELECT,
          });
          return { status: 201, body: { event: toMvpEvent(event) } };
        },
      );
    } catch (error) {
      throw mapMvpDatabaseError(error);
    }
  }

  async update(
    actorId: string,
    id: string,
    body: unknown,
  ): Promise<MvpHttpResponse<{ event: MvpEventDto }>> {
    const input = parseEventPatch(body);
    try {
      return await this.database.$transaction(async (transaction) => {
        const current = await transaction.event.findFirst({
          where: ownedEventWhere(id, actorId),
          select: EVENT_SELECT,
        });
        if (!current) throw new MvpError(404, 'EVENT_NOT_FOUND', 'Event not found');
        assertRevision(current.revision, input.expectedRevision);
        if (!EDITABLE_STATUSES.includes(current.status)) {
          throw new MvpError(409, 'EVENT_NOT_EDITABLE', 'This event can no longer be edited');
        }
        validateEventWindow(input.changes.start ?? current.start_date, input.changes.end ?? current.end_date);
        const result = await transaction.event.updateMany({
          where: {
            ...ownedEventWhere(id, actorId),
            revision: input.expectedRevision,
            status: { in: EDITABLE_STATUSES },
          },
          data: eventMutationData(input.changes),
        });
        if (result.count !== 1) {
          throw new MvpError(409, 'REVISION_CONFLICT', 'The record was changed by another request');
        }
        return { status: 200, body: { event: await updatedEvent(transaction, id, actorId) } };
      });
    } catch (error) {
      throw mapMvpDatabaseError(error);
    }
  }

  async publish(
    actorId: string,
    id: string,
    body: unknown,
    idempotencyHeader: string | undefined,
  ): Promise<MvpHttpResponse<{ event: MvpEventDto }>> {
    return this.transition(actorId, id, body, idempotencyHeader, 'publish');
  }

  async cancel(
    actorId: string,
    id: string,
    body: unknown,
    idempotencyHeader: string | undefined,
  ): Promise<MvpHttpResponse<{ event: MvpEventDto }>> {
    return this.transition(actorId, id, body, idempotencyHeader, 'cancel');
  }

  async remove(
    actorId: string,
    id: string,
    body: unknown,
    idempotencyHeader: string | undefined,
  ): Promise<MvpHttpResponse<{ deleted: true; eventId: string }>> {
    const expectedRevision = parseRevisionBody(body);
    const idempotencyKey = parseIdempotencyKey(idempotencyHeader);
    try {
      return await executeMvpCommand(
        this.database,
        actorId,
        idempotencyKey,
        'event.delete',
        { id, expectedRevision },
        async (transaction) => {
          const current = await transaction.event.findFirst({
            where: ownedEventWhere(id, actorId),
            select: { id: true, revision: true, status: true },
          });
          if (!current) throw new MvpError(404, 'EVENT_NOT_FOUND', 'Event not found');
          assertRevision(current.revision, expectedRevision);
          if (!DELETABLE_STATUSES.includes(current.status)) {
            throw new MvpError(409, 'EVENT_NOT_DELETABLE', 'Cancel this event before deleting it');
          }
          const claimed = await transaction.event.updateMany({
            where: {
              ...ownedEventWhere(id, actorId),
              revision: expectedRevision,
              status: { in: DELETABLE_STATUSES },
            },
            data: { revision: { increment: 1 } },
          });
          if (claimed.count !== 1) {
            throw new MvpError(409, 'REVISION_CONFLICT', 'The record was changed by another request');
          }
          await transaction.guest.deleteMany({ where: { event_id: id } });
          const deleted = await transaction.event.deleteMany({
            where: { ...ownedEventWhere(id, actorId), revision: expectedRevision + 1 },
          });
          if (deleted.count !== 1) {
            throw new MvpError(409, 'REVISION_CONFLICT', 'The record was changed by another request');
          }
          return { status: 200, body: { deleted: true as const, eventId: id } };
        },
      );
    } catch (error) {
      throw mapMvpDatabaseError(error);
    }
  }

  private async transition(
    actorId: string,
    id: string,
    body: unknown,
    idempotencyHeader: string | undefined,
    action: 'publish' | 'cancel',
  ): Promise<MvpHttpResponse<{ event: MvpEventDto }>> {
    const expectedRevision = parseRevisionBody(body);
    const idempotencyKey = parseIdempotencyKey(idempotencyHeader);
    const operation = `event.${action}`;
    try {
      return await executeMvpCommand(
        this.database,
        actorId,
        idempotencyKey,
        operation,
        { id, expectedRevision },
        async (transaction) => this.applyTransition(transaction, actorId, id, expectedRevision, action),
      );
    } catch (error) {
      throw mapMvpDatabaseError(error);
    }
  }

  private async applyTransition(
    transaction: Prisma.TransactionClient,
    actorId: string,
    id: string,
    expectedRevision: number,
    action: 'publish' | 'cancel',
  ): Promise<MvpHttpResponse<{ event: MvpEventDto }>> {
    const current = await transaction.event.findFirst({
      where: ownedEventWhere(id, actorId),
      select: EVENT_SELECT,
    });
    if (!current) throw new MvpError(404, 'EVENT_NOT_FOUND', 'Event not found');
    assertRevision(current.revision, expectedRevision);
    const requiredStatus = action === 'publish' ? 'draft' : 'published';
    if (current.status !== requiredStatus) {
      throw new MvpError(409, 'INVALID_EVENT_TRANSITION', `This event cannot be ${action}ed`);
    }
    if (action === 'publish') {
      parseEventCreate({
        name: current.name,
        description: current.description,
        start: current.start_date.toISOString(),
        end: current.end_date.toISOString(),
        timezone: current.timezone,
        location: current.location,
      });
    }
    const now = new Date();
    const data: Prisma.EventUpdateManyMutationInput = action === 'publish'
      ? { status: 'published', published_at: now, revision: { increment: 1 } }
      : { status: 'cancelled', cancelled_at: now, revision: { increment: 1 } };
    const updated = await transaction.event.updateMany({
      where: { ...ownedEventWhere(id, actorId), revision: expectedRevision, status: requiredStatus },
      data,
    });
    if (updated.count !== 1) {
      throw new MvpError(409, 'REVISION_CONFLICT', 'The record was changed by another request');
    }
    if (action === 'cancel') {
      await transaction.guestInvitation.updateMany({
        where: { event_id: id, revoked_at: null },
        data: { revoked_at: now },
      });
    }
    return { status: 200, body: { event: await updatedEvent(transaction, id, actorId) } };
  }
}
