import { createHash } from 'node:crypto';
import { Prisma, type PrismaClient } from '@prisma/client';

import { mapMvpDatabaseError } from './mvp-command';
import { MvpError, type MvpHttpResponse } from './mvp-contract';

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const RSVP_STATUSES = ['accepted', 'maybe', 'declined'] as const;
export type PublicRsvpStatus = (typeof RSVP_STATUSES)[number];

export interface PublicRsvpInvitation {
  event: {
    name: string;
    hostName: string;
    start: string;
    end: string;
    timezone: string;
    location: string;
  };
  rsvp: {
    status: 'pending' | PublicRsvpStatus;
    revision: number;
    respondedAt: string | null;
  };
}

interface InvitationRow {
  event_id: string;
  expires_at: Date;
  revoked_at: Date | null;
  event: {
    id: string;
    name: string;
    start_date: Date;
    end_date: Date;
    timezone: string | null;
    location: string;
    status: string;
    privacy: string;
    is_public: boolean;
    cancelled_at: Date | null;
    host: { name: string | null; account_status: string };
  };
  guest: {
    id: string;
    event_id: string;
    rsvp_status: string;
    rsvp_responded_at: Date | null;
    revision: number;
  };
}

interface ParsedRsvpUpdate {
  token: string;
  status: PublicRsvpStatus;
  expectedRevision: number;
}

const INVITATION_SELECT = {
  event_id: true,
  expires_at: true,
  revoked_at: true,
  event: {
    select: {
      id: true,
      name: true,
      start_date: true,
      end_date: true,
      timezone: true,
      location: true,
      status: true,
      privacy: true,
      is_public: true,
      cancelled_at: true,
      host: { select: { name: true, account_status: true } },
    },
  },
  guest: {
    select: {
      id: true,
      event_id: true,
      rsvp_status: true,
      rsvp_responded_at: true,
      revision: true,
    },
  },
} satisfies Prisma.GuestInvitationSelect;

function bodyRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new MvpError(400, 'INVALID_REQUEST', 'Request body must be a JSON object');
  }
  return value as Record<string, unknown>;
}

function exactKeys(body: Record<string, unknown>, keys: readonly string[]): void {
  if (Object.keys(body).length !== keys.length || keys.some((key) => !Object.prototype.hasOwnProperty.call(body, key))) {
    throw new MvpError(400, 'UNKNOWN_FIELDS', 'Request body contains unsupported fields');
  }
}

function tokenHash(value: unknown): string {
  if (typeof value !== 'string' || !TOKEN_PATTERN.test(value)) {
    throw unavailable();
  }
  return createHash('sha256').update(value).digest('hex');
}

function unavailable(): MvpError {
  return new MvpError(404, 'RSVP_UNAVAILABLE', 'This invitation is unavailable');
}

/** Parse the read-only token resolution request without exposing token diagnostics. */
export function parseRsvpResolve(value: unknown): string {
  const body = bodyRecord(value);
  exactKeys(body, ['token']);
  return tokenHash(body.token);
}

/** Parse a revision-bound RSVP update. */
export function parseRsvpUpdate(value: unknown): ParsedRsvpUpdate {
  const body = bodyRecord(value);
  exactKeys(body, ['token', 'status', 'expectedRevision']);
  if (!RSVP_STATUSES.includes(body.status as PublicRsvpStatus)) {
    throw new MvpError(400, 'INVALID_RSVP_STATUS', 'status must be accepted, maybe, or declined');
  }
  if (!Number.isSafeInteger(body.expectedRevision) || (body.expectedRevision as number) < 1) {
    throw new MvpError(400, 'INVALID_REVISION', 'expectedRevision must be a positive integer');
  }
  return {
    token: tokenHash(body.token),
    status: body.status as PublicRsvpStatus,
    expectedRevision: body.expectedRevision as number,
  };
}

function validInvitation(row: InvitationRow | null, now: Date): InvitationRow {
  const valid = row
    && row.revoked_at === null
    && row.expires_at.getTime() > now.getTime()
    && row.event.status === 'published'
    && row.event.privacy === 'private'
    && row.event.is_public === false
    && row.event.cancelled_at === null
    && row.event.end_date.getTime() > now.getTime()
    && row.event.host.account_status === 'active'
    && row.guest.event_id === row.event_id
    && row.event.id === row.event_id;
  if (!valid) throw unavailable();
  return row;
}

function publicInvitation(row: InvitationRow): PublicRsvpInvitation {
  const status = row.guest.rsvp_status;
  if (status !== 'pending' && !RSVP_STATUSES.includes(status as PublicRsvpStatus)) {
    throw unavailable();
  }
  return {
    event: {
      name: row.event.name,
      hostName: row.event.host.name?.trim() || 'Your host',
      start: row.event.start_date.toISOString(),
      end: row.event.end_date.toISOString(),
      timezone: row.event.timezone || 'UTC',
      location: row.event.location,
    },
    rsvp: {
      status: status as PublicRsvpInvitation['rsvp']['status'],
      revision: row.guest.revision,
      respondedAt: row.guest.rsvp_responded_at?.toISOString() ?? null,
    },
  };
}

async function findInvitation(
  database: Pick<Prisma.TransactionClient, 'guestInvitation'>,
  hash: string,
): Promise<InvitationRow | null> {
  const row = await database.guestInvitation.findUnique({
    where: { token_hash: hash },
    select: INVITATION_SELECT,
  });
  return row as InvitationRow | null;
}

async function lockInvitation(
  transaction: Prisma.TransactionClient,
  hash: string,
): Promise<void> {
  const locked = await transaction.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT gi.id
    FROM guest_invitations gi
    JOIN events e ON e.id = gi.event_id
    JOIN guests g ON g.id = gi.guest_id
    JOIN users u ON u.id = e.host_id
    WHERE gi.token_hash = ${hash}
    FOR UPDATE OF gi, e, g, u
  `);
  if (locked.length === 0) throw unavailable();
}

/** Anonymous, token-scoped RSVP reads and compare-and-swap updates. */
export class RsvpService {
  constructor(
    private readonly database: PrismaClient,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async resolve(body: unknown): Promise<MvpHttpResponse<PublicRsvpInvitation>> {
    const hash = parseRsvpResolve(body);
    const row = validInvitation(await findInvitation(this.database, hash), this.clock());
    return { status: 200, body: publicInvitation(row) };
  }

  async update(body: unknown): Promise<MvpHttpResponse<PublicRsvpInvitation>> {
    const input = parseRsvpUpdate(body);
    try {
      return await this.database.$transaction(async (transaction) => {
        const now = this.clock();
        await lockInvitation(transaction, input.token);
        const current = validInvitation(await findInvitation(transaction, input.token), now);
        if (current.guest.rsvp_status === input.status) {
          return { status: 200, body: publicInvitation(current) };
        }
        if (current.guest.revision !== input.expectedRevision) {
          throw new MvpError(409, 'REVISION_CONFLICT', 'The RSVP was changed by another request');
        }
        const updated = await transaction.guest.updateMany({
          where: {
            id: current.guest.id,
            event_id: current.event_id,
            revision: input.expectedRevision,
          },
          data: {
            rsvp_status: input.status,
            rsvp_responded_at: now,
            revision: { increment: 1 },
          },
        });
        if (updated.count !== 1) {
          return this.resolveConcurrentUpdate(transaction, input, now);
        }
        const confirmed = validInvitation(await findInvitation(transaction, input.token), now);
        return { status: 200, body: publicInvitation(confirmed) };
      });
    } catch (error) {
      throw mapMvpDatabaseError(error);
    }
  }

  private async resolveConcurrentUpdate(
    transaction: Prisma.TransactionClient,
    input: ParsedRsvpUpdate,
    now: Date,
  ): Promise<MvpHttpResponse<PublicRsvpInvitation>> {
    const latest = validInvitation(await findInvitation(transaction, input.token), now);
    if (latest.guest.rsvp_status === input.status) {
      return { status: 200, body: publicInvitation(latest) };
    }
    throw new MvpError(409, 'REVISION_CONFLICT', 'The RSVP was changed by another request');
  }
}
