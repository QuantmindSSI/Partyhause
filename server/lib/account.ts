import { createHash, randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Prisma, type PrismaClient } from '@prisma/client';

import { deleteOwnedBlobUrls, type BlobOwnership } from './blob-storage';
import {
  CURRENT_PRIVACY_VERSION,
  CURRENT_TERMS_VERSION,
  LEGAL_EFFECTIVE_DATE,
  LEGAL_URLS,
  MINIMUM_ACCOUNT_AGE,
} from './legal';

const CONFIRMATION_TTL_MS = 15 * 60 * 1_000;
const PROCESSING_LEASE_MS = 5 * 60 * 1_000;
const PRIMARY_ERASURE_TTL_MS = 24 * 60 * 60 * 1_000;
const AUDIT_RETENTION_MS = 365 * 24 * 60 * 60 * 1_000;
const MAX_DELETION_RETRIES_PER_SWEEP = 25;
export const ACCOUNT_DELETION_CONFIRMATION = 'DELETE';

type DeletionStatus = 'pending' | 'processing' | 'completed' | 'failed';
type BlobDeleter = (urls: readonly string[], ownership: BlobOwnership) => Promise<number>;

interface DeletionRequestRow {
  id: string;
  user_id: string | null;
  subject_hash: string | null;
  status: DeletionStatus;
  requested_at: Date;
  confirmation_expires_at: Date | null;
  erase_by: Date;
  processing_started_at: Date | null;
  completed_at: Date | null;
  expires_at: Date;
  error_code: string | null;
}

export interface DeletionStatusView {
  receipt: string;
  status: DeletionStatus;
  requestedAt: string;
  eraseBy: string;
  completedAt: string | null;
  confirmationExpiresAt: string | null;
  retryable: boolean;
}

export class AccountServiceError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AccountServiceError';
  }
}

function deletionView(request: DeletionRequestRow): DeletionStatusView {
  return {
    receipt: request.id,
    status: request.status,
    requestedAt: request.requested_at.toISOString(),
    eraseBy: request.erase_by.toISOString(),
    completedAt: request.completed_at?.toISOString() ?? null,
    confirmationExpiresAt: request.confirmation_expires_at?.toISOString() ?? null,
    retryable: request.status === 'failed' || request.status === 'pending',
  };
}

function validReceipt(receipt: unknown): receipt is string {
  return typeof receipt === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(receipt);
}

async function executeStatements(
  transaction: Prisma.TransactionClient,
  statements: readonly Prisma.Sql[],
): Promise<void> {
  for (const statement of statements) await transaction.$executeRaw(statement);
}

function crossOwnedStatements(userId: string): Prisma.Sql[] {
  return [
    Prisma.sql`UPDATE guests SET user_id = NULL WHERE user_id = ${userId}`,
    Prisma.sql`UPDATE vendor_tasks SET assigned_to = NULL WHERE assigned_to = ${userId}`,
    Prisma.sql`UPDATE timeline_blocks SET assigned_to = array_remove(assigned_to, ${userId}) WHERE ${userId} = ANY(assigned_to)`,
    Prisma.sql`UPDATE email_logs SET template_id = NULL WHERE template_id IN (SELECT id FROM invite_templates WHERE host_id = ${userId})`,
    Prisma.sql`UPDATE guest_crew_conversions SET connection_id = NULL WHERE connection_id IN (SELECT id FROM connections WHERE follower_id = ${userId} OR following_id = ${userId})`,
    Prisma.sql`
      UPDATE event_invite_tokens
      SET uses_log = (
        SELECT COALESCE(jsonb_agg(entry), '[]'::jsonb)
        FROM jsonb_array_elements(event_invite_tokens.uses_log) AS entry
        WHERE entry ->> 'user_id' IS DISTINCT FROM ${userId}
      )
      WHERE jsonb_typeof(event_invite_tokens.uses_log) = 'array'
        AND EXISTS (
          SELECT 1 FROM jsonb_array_elements(event_invite_tokens.uses_log) AS entry
          WHERE entry ->> 'user_id' = ${userId}
        )
    `,
    Prisma.sql`
      UPDATE partyboard_stickies
      SET voter_ids = (
            SELECT COALESCE(jsonb_agg(entry), '[]'::jsonb)
            FROM jsonb_array_elements(partyboard_stickies.voter_ids) AS entry
            WHERE entry #>> '{}' IS DISTINCT FROM ${userId}
          ),
          vote_count = GREATEST(vote_count - 1, 0)
      WHERE jsonb_typeof(partyboard_stickies.voter_ids) = 'array'
        AND EXISTS (
          SELECT 1 FROM jsonb_array_elements(partyboard_stickies.voter_ids) AS entry
          WHERE entry #>> '{}' = ${userId}
        )
    `,
  ];
}

function hostedEventStatements(userId: string): Prisma.Sql[] {
  return [
    Prisma.sql`DELETE FROM invitation_deliveries WHERE event_id IN (SELECT id FROM events WHERE host_id = ${userId})`,
    Prisma.sql`DELETE FROM attendance_audits WHERE event_id IN (SELECT id FROM events WHERE host_id = ${userId})`,
    Prisma.sql`DELETE FROM guest_invitations WHERE event_id IN (SELECT id FROM events WHERE host_id = ${userId})`,
    Prisma.sql`DELETE FROM email_events WHERE email_log_id IN (SELECT id FROM email_logs WHERE event_id IN (SELECT id FROM events WHERE host_id = ${userId}) OR guest_id IN (SELECT id FROM guests WHERE event_id IN (SELECT id FROM events WHERE host_id = ${userId})))`,
    Prisma.sql`UPDATE guests SET email_log_id = NULL WHERE event_id IN (SELECT id FROM events WHERE host_id = ${userId})`,
    Prisma.sql`DELETE FROM email_logs WHERE event_id IN (SELECT id FROM events WHERE host_id = ${userId}) OR guest_id IN (SELECT id FROM guests WHERE event_id IN (SELECT id FROM events WHERE host_id = ${userId}))`,
    Prisma.sql`DELETE FROM cost_split_requests WHERE event_id IN (SELECT id FROM events WHERE host_id = ${userId})`,
    Prisma.sql`DELETE FROM guest_crew_conversions WHERE event_id IN (SELECT id FROM events WHERE host_id = ${userId})`,
    Prisma.sql`DELETE FROM poll_votes WHERE poll_id IN (SELECT id FROM polls WHERE event_id IN (SELECT id FROM events WHERE host_id = ${userId}))`,
    Prisma.sql`DELETE FROM poll_options WHERE poll_id IN (SELECT id FROM polls WHERE event_id IN (SELECT id FROM events WHERE host_id = ${userId}))`,
    Prisma.sql`DELETE FROM polls WHERE event_id IN (SELECT id FROM events WHERE host_id = ${userId})`,
    Prisma.sql`DELETE FROM activity_participants WHERE activity_id IN (SELECT id FROM activities WHERE event_id IN (SELECT id FROM events WHERE host_id = ${userId}))`,
    Prisma.sql`DELETE FROM activities WHERE event_id IN (SELECT id FROM events WHERE host_id = ${userId})`,
    Prisma.sql`DELETE FROM vendor_tasks WHERE vendor_id IN (SELECT id FROM vendors WHERE event_id IN (SELECT id FROM events WHERE host_id = ${userId}))`,
    Prisma.sql`DELETE FROM vendors WHERE event_id IN (SELECT id FROM events WHERE host_id = ${userId})`,
    Prisma.sql`UPDATE events SET active_game_id = NULL WHERE active_game_id IN (SELECT id FROM games WHERE event_id IN (SELECT id FROM events WHERE host_id = ${userId}))`,
    Prisma.sql`DELETE FROM game_sessions WHERE game_id IN (SELECT id FROM games WHERE event_id IN (SELECT id FROM events WHERE host_id = ${userId}))`,
    Prisma.sql`DELETE FROM games WHERE event_id IN (SELECT id FROM events WHERE host_id = ${userId})`,
    Prisma.sql`DELETE FROM notifications WHERE event_id IN (SELECT id FROM events WHERE host_id = ${userId}) OR post_id IN (SELECT id FROM partycrew_posts WHERE event_id IN (SELECT id FROM events WHERE host_id = ${userId}))`,
    Prisma.sql`DELETE FROM feed_read_status WHERE post_id IN (SELECT id FROM partycrew_posts WHERE event_id IN (SELECT id FROM events WHERE host_id = ${userId}))`,
    Prisma.sql`DELETE FROM content_interactions WHERE post_id IN (SELECT id FROM partycrew_posts WHERE event_id IN (SELECT id FROM events WHERE host_id = ${userId}))`,
    Prisma.sql`DELETE FROM post_likes WHERE post_id IN (SELECT id FROM partycrew_posts WHERE event_id IN (SELECT id FROM events WHERE host_id = ${userId}))`,
    Prisma.sql`DELETE FROM post_comments WHERE post_id IN (SELECT id FROM partycrew_posts WHERE event_id IN (SELECT id FROM events WHERE host_id = ${userId}))`,
    Prisma.sql`DELETE FROM post_shares WHERE post_id IN (SELECT id FROM partycrew_posts WHERE event_id IN (SELECT id FROM events WHERE host_id = ${userId}))`,
    Prisma.sql`DELETE FROM partycrew_posts WHERE event_id IN (SELECT id FROM events WHERE host_id = ${userId})`,
    Prisma.sql`DELETE FROM event_cost_summaries WHERE event_id IN (SELECT id FROM events WHERE host_id = ${userId})`,
    Prisma.sql`DELETE FROM partyboard_stickies WHERE event_id IN (SELECT id FROM events WHERE host_id = ${userId})`,
    Prisma.sql`DELETE FROM saved_events WHERE event_id IN (SELECT id FROM events WHERE host_id = ${userId})`,
    Prisma.sql`DELETE FROM template_usage WHERE event_id IN (SELECT id FROM events WHERE host_id = ${userId})`,
    Prisma.sql`DELETE FROM event_invite_tokens WHERE event_id IN (SELECT id FROM events WHERE host_id = ${userId})`,
    Prisma.sql`DELETE FROM event_co_hosts WHERE event_id IN (SELECT id FROM events WHERE host_id = ${userId})`,
    Prisma.sql`DELETE FROM tickets WHERE event_id IN (SELECT id FROM events WHERE host_id = ${userId})`,
    Prisma.sql`DELETE FROM timeline_blocks WHERE event_id IN (SELECT id FROM events WHERE host_id = ${userId})`,
    Prisma.sql`DELETE FROM media WHERE event_id IN (SELECT id FROM events WHERE host_id = ${userId})`,
    Prisma.sql`DELETE FROM guests WHERE event_id IN (SELECT id FROM events WHERE host_id = ${userId})`,
    Prisma.sql`DELETE FROM events WHERE host_id = ${userId}`,
  ];
}

function directUserStatements(userId: string): Prisma.Sql[] {
  return [
    Prisma.sql`DELETE FROM poll_votes WHERE user_id = ${userId} OR poll_id IN (SELECT id FROM polls WHERE created_by = ${userId})`,
    Prisma.sql`DELETE FROM poll_options WHERE poll_id IN (SELECT id FROM polls WHERE created_by = ${userId})`,
    Prisma.sql`DELETE FROM polls WHERE created_by = ${userId}`,
    Prisma.sql`DELETE FROM activity_participants WHERE user_id = ${userId}`,
    Prisma.sql`DELETE FROM media WHERE uploader_id = ${userId}`,
    Prisma.sql`DELETE FROM event_invite_tokens WHERE created_by = ${userId}`,
    Prisma.sql`DELETE FROM cost_split_requests WHERE created_by = ${userId}`,
    Prisma.sql`DELETE FROM guest_crew_conversions WHERE user_id = ${userId} OR converted_by = ${userId}`,
    Prisma.sql`DELETE FROM invitation_deliveries WHERE command_id IN (SELECT id FROM mvp_commands WHERE actor_id = ${userId})`,
    Prisma.sql`DELETE FROM attendance_audits WHERE actor_id = ${userId} OR command_id IN (SELECT id FROM mvp_commands WHERE actor_id = ${userId})`,
    Prisma.sql`DELETE FROM mvp_commands WHERE actor_id = ${userId}`,
    Prisma.sql`DELETE FROM template_usage WHERE user_id = ${userId} OR template_id IN (SELECT id FROM templates WHERE author_id = ${userId})`,
    Prisma.sql`DELETE FROM templates WHERE author_id = ${userId}`,
    Prisma.sql`DELETE FROM invite_templates WHERE host_id = ${userId}`,
    Prisma.sql`DELETE FROM partyboard_stickies WHERE created_by = ${userId}`,
    Prisma.sql`DELETE FROM event_co_hosts WHERE user_id = ${userId}`,
  ];
}

function profileStatements(userId: string): Prisma.Sql[] {
  return [
    Prisma.sql`
      UPDATE post_comments SET parent_comment_id = NULL
      WHERE parent_comment_id IN (
        SELECT id FROM post_comments
        WHERE user_id = ${userId}
          OR post_id IN (SELECT id FROM partycrew_posts WHERE creator_id = ${userId})
      )
    `,
    Prisma.sql`DELETE FROM notifications WHERE user_id = ${userId} OR actor_id = ${userId} OR post_id IN (SELECT id FROM partycrew_posts WHERE creator_id = ${userId})`,
    Prisma.sql`DELETE FROM feed_read_status WHERE user_id = ${userId} OR post_id IN (SELECT id FROM partycrew_posts WHERE creator_id = ${userId})`,
    Prisma.sql`DELETE FROM content_interactions WHERE user_id = ${userId} OR post_id IN (SELECT id FROM partycrew_posts WHERE creator_id = ${userId})`,
    Prisma.sql`DELETE FROM post_likes WHERE user_id = ${userId} OR post_id IN (SELECT id FROM partycrew_posts WHERE creator_id = ${userId})`,
    Prisma.sql`DELETE FROM post_comments WHERE user_id = ${userId} OR post_id IN (SELECT id FROM partycrew_posts WHERE creator_id = ${userId})`,
    Prisma.sql`DELETE FROM post_shares WHERE user_id = ${userId} OR post_id IN (SELECT id FROM partycrew_posts WHERE creator_id = ${userId})`,
    Prisma.sql`DELETE FROM partycrew_posts WHERE creator_id = ${userId}`,
    Prisma.sql`DELETE FROM connections WHERE follower_id = ${userId} OR following_id = ${userId}`,
    Prisma.sql`DELETE FROM connection_requests WHERE requester_id = ${userId} OR target_id = ${userId}`,
    Prisma.sql`DELETE FROM user_blocks WHERE blocker_id = ${userId} OR blocked_id = ${userId}`,
    Prisma.sql`DELETE FROM saved_events WHERE user_id = ${userId}`,
    Prisma.sql`DELETE FROM user_profiles WHERE id = ${userId}`,
  ];
}

async function collectOwnedBlobReferences(database: PrismaClient, userId: string): Promise<{
  urls: string[];
  ownership: BlobOwnership;
}> {
  const [events, profile, media, templates, posts, vendors] = await Promise.all([
    database.event.findMany({ where: { host_id: userId }, select: { id: true, invite_image_url: true } }),
    database.userProfile.findUnique({ where: { id: userId }, select: { avatar_url: true, cover_photo_url: true } }),
    database.media.findMany({
      where: { OR: [{ uploader_id: userId }, { event: { host_id: userId } }] },
      select: { url: true, thumbnail_url: true },
    }),
    database.template.findMany({ where: { author_id: userId }, select: { hero_image_url: true } }),
    database.partycrewPost.findMany({ where: { creator_id: userId }, select: { media_urls: true } }),
    database.vendor.findMany({ where: { event: { host_id: userId } }, select: { contract_url: true } }),
  ]);
  const urls = [
    ...events.map((event) => event.invite_image_url),
    profile?.avatar_url,
    profile?.cover_photo_url,
    ...media.flatMap((item) => [item.url, item.thumbnail_url]),
    ...templates.map((template) => template.hero_image_url),
    ...posts.flatMap((post) => post.media_urls),
    ...vendors.map((vendor) => vendor.contract_url),
  ].filter((url): url is string => typeof url === 'string' && url.length > 0);
  return {
    urls,
    ownership: { userId, hostedEventIds: new Set(events.map((event) => event.id)) },
  };
}

export class AccountService {
  constructor(
    private readonly database: PrismaClient,
    private readonly clock: () => Date = () => new Date(),
    private readonly deleteBlobs: BlobDeleter = deleteOwnedBlobUrls,
  ) {}

  private async purgeExpiredReceipts(now: Date): Promise<void> {
    await this.database.accountDeletionRequest.deleteMany({
      where: { status: 'completed', expires_at: { lte: now } },
    });
  }

  async summary(userId: string) {
    const user = await this.database.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        email_verified: true,
        created_at: true,
        account_status: true,
        age_eligible: true,
        terms_version: true,
        privacy_version: true,
      },
    });
    if (!user || user.account_status !== 'active') {
      throw new AccountServiceError(404, 'ACCOUNT_NOT_FOUND', 'Account not found');
    }
    return {
      account: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.email_verified,
        createdAt: user.created_at.toISOString(),
      },
      legal: {
        termsVersion: CURRENT_TERMS_VERSION,
        privacyVersion: CURRENT_PRIVACY_VERSION,
        effectiveDate: LEGAL_EFFECTIVE_DATE,
        acceptedTermsVersion: user.terms_version,
        acceptedPrivacyVersion: user.privacy_version,
        ageEligible: user.age_eligible,
        minimumAge: MINIMUM_ACCOUNT_AGE,
        urls: LEGAL_URLS,
      },
    };
  }

  async createDeletionIntent(userId: string, password: unknown): Promise<DeletionStatusView> {
    if (typeof password !== 'string' || password.length < 1 || password.length > 128) {
      throw new AccountServiceError(400, 'PASSWORD_REQUIRED', 'Your current password is required');
    }
    const now = this.clock();
    await this.purgeExpiredReceipts(now);
    const user = await this.database.user.findUnique({
      where: { id: userId },
      select: { password_hash: true, account_status: true },
    });
    if (!user?.password_hash || user.account_status !== 'active') {
      throw new AccountServiceError(403, 'PASSWORD_REAUTH_FAILED', 'Current password is incorrect');
    }
    if (!(await bcrypt.compare(password, user.password_hash))) {
      throw new AccountServiceError(403, 'PASSWORD_REAUTH_FAILED', 'Current password is incorrect');
    }

    const confirmationExpiresAt = new Date(now.getTime() + CONFIRMATION_TTL_MS);
    const eraseBy = new Date(now.getTime() + PRIMARY_ERASURE_TTL_MS);
    const expiresAt = new Date(now.getTime() + AUDIT_RETENTION_MS);
    const requestId = randomUUID();
    const request = await this.database.$transaction(async (transaction) => {
      const [lockedUser] = await transaction.$queryRaw<Array<{ account_status: string }>>`
        SELECT account_status FROM users WHERE id = ${userId} FOR UPDATE
      `;
      if (!lockedUser || lockedUser.account_status !== 'active') {
        throw new AccountServiceError(409, 'ACCOUNT_NOT_ACTIVE', 'Account deletion cannot be started');
      }
      const [saved] = await transaction.$queryRaw<DeletionRequestRow[]>`
        INSERT INTO account_deletion_requests (
          id, user_id, subject_hash, status, requested_at, confirmation_expires_at,
          erase_by, processing_started_at, attempt_count, completed_at,
          expires_at, error_code, error_at
        ) VALUES (
          ${requestId}, ${userId}, NULL, 'pending', ${now}, ${confirmationExpiresAt},
          ${eraseBy}, NULL, 0, NULL, ${expiresAt}, NULL, NULL
        )
        ON CONFLICT (user_id) DO UPDATE SET
          status = 'pending',
          subject_hash = NULL,
          requested_at = EXCLUDED.requested_at,
          confirmation_expires_at = EXCLUDED.confirmation_expires_at,
          erase_by = EXCLUDED.erase_by,
          processing_started_at = NULL,
          attempt_count = 0,
          completed_at = NULL,
          expires_at = EXCLUDED.expires_at,
          error_code = NULL,
          error_at = NULL
        RETURNING *
      `;
      return saved;
    }, { maxWait: 5_000, timeout: 15_000 });
    return deletionView(request);
  }

  private async claimDeletion(receipt: string): Promise<{
    execute: boolean;
    request: DeletionRequestRow;
    userId: string | null;
  }> {
    const now = this.clock();
    const subject = await this.database.accountDeletionRequest.findUnique({
      where: { id: receipt },
      select: { user_id: true },
    });
    return this.database.$transaction(async (transaction) => {
      if (subject?.user_id) {
        await transaction.$queryRaw`SELECT id FROM users WHERE id = ${subject.user_id} FOR UPDATE`;
      }
      const [request] = await transaction.$queryRaw<DeletionRequestRow[]>`
        SELECT * FROM account_deletion_requests WHERE id = ${receipt} FOR UPDATE
      `;
      const auditExpired = request?.status === 'completed' && request.expires_at <= now;
      if (!request || auditExpired) {
        throw new AccountServiceError(404, 'DELETION_RECEIPT_NOT_FOUND', 'Deletion receipt not found');
      }
      if (request.status === 'completed') return { execute: false, request, userId: null };
      if (!request.user_id) {
        throw new AccountServiceError(409, 'DELETION_STATE_INVALID', 'Deletion request cannot be resumed');
      }
      if (request.status === 'pending' && (!request.confirmation_expires_at || request.confirmation_expires_at <= now)) {
        throw new AccountServiceError(410, 'DELETION_CONFIRMATION_EXPIRED', 'Deletion confirmation expired');
      }
      const leaseActive = request.status === 'processing'
        && request.processing_started_at
        && request.processing_started_at.getTime() + PROCESSING_LEASE_MS > now.getTime();
      if (leaseActive) return { execute: false, request, userId: request.user_id };

      if (request.status === 'pending') {
        const updated = await transaction.user.updateMany({
          where: { id: request.user_id, account_status: 'active' },
          data: {
            account_status: 'deletion_pending',
            deletion_requested_at: now,
            token_version: { increment: 1 },
            reset_token: null,
            reset_token_expires: null,
            verification_token: null,
            verification_token_expires: null,
          },
        });
        if (updated.count !== 1) {
          throw new AccountServiceError(409, 'ACCOUNT_NOT_ACTIVE', 'Account deletion cannot be started');
        }
        await transaction.guestInvitation.updateMany({
          where: { event: { host_id: request.user_id }, revoked_at: null },
          data: { revoked_at: now },
        });
        await transaction.eventInviteToken.updateMany({
          where: { event: { host_id: request.user_id }, is_active: true },
          data: { is_active: false },
        });
      }

      const claimed = await transaction.accountDeletionRequest.update({
        where: { id: receipt },
        data: {
          status: 'processing',
          processing_started_at: now,
          attempt_count: { increment: 1 },
          error_code: null,
          error_at: null,
        },
      });
      return {
        execute: true,
        request: claimed as DeletionRequestRow,
        userId: request.user_id,
      };
    }, { maxWait: 5_000, timeout: 15_000 });
  }

  private async markFailed(receipt: string, code: string): Promise<DeletionStatusView> {
    await this.database.accountDeletionRequest.updateMany({
      where: { id: receipt, status: { not: 'completed' } },
      data: {
        status: 'failed',
        processing_started_at: null,
        error_code: code,
        error_at: this.clock(),
      },
    });
    return this.status(receipt);
  }

  private async deletePrimaryData(receipt: string, userId: string): Promise<void> {
    await this.database.$transaction(async (transaction) => {
      const [request] = await transaction.$queryRaw<DeletionRequestRow[]>`
        SELECT * FROM account_deletion_requests WHERE id = ${receipt} FOR UPDATE
      `;
      if (!request || request.status !== 'processing' || request.user_id !== userId) {
        throw new AccountServiceError(409, 'DELETION_STATE_INVALID', 'Deletion request cannot be completed');
      }
      await executeStatements(transaction, crossOwnedStatements(userId));
      await executeStatements(transaction, hostedEventStatements(userId));
      await executeStatements(transaction, directUserStatements(userId));
      await executeStatements(transaction, profileStatements(userId));
      await transaction.user.deleteMany({ where: { id: userId } });
      const completedAt = this.clock();
      await transaction.accountDeletionRequest.update({
        where: { id: receipt },
        data: {
          user_id: null,
          subject_hash: createHash('sha256').update(userId).digest('hex'),
          status: 'completed',
          confirmation_expires_at: null,
          processing_started_at: null,
          completed_at: completedAt,
          expires_at: new Date(completedAt.getTime() + AUDIT_RETENTION_MS),
          error_code: null,
          error_at: null,
        },
      });
    }, { maxWait: 5_000, timeout: 60_000 });
  }

  async confirmDeletion(receipt: unknown, confirmation: unknown): Promise<DeletionStatusView> {
    if (!validReceipt(receipt)) {
      throw new AccountServiceError(404, 'DELETION_RECEIPT_NOT_FOUND', 'Deletion receipt not found');
    }
    if (confirmation !== ACCOUNT_DELETION_CONFIRMATION) {
      throw new AccountServiceError(400, 'DELETION_CONFIRMATION_INVALID', 'Type DELETE exactly to confirm');
    }

    const claim = await this.claimDeletion(receipt);
    if (!claim.execute || !claim.userId) return deletionView(claim.request);
    try {
      const blobs = await collectOwnedBlobReferences(this.database, claim.userId);
      await this.deleteBlobs(blobs.urls, blobs.ownership);
    } catch (error) {
      console.error('[account-deletion] owned blob deletion failed');
      return this.markFailed(receipt, 'BLOB_DELETE_FAILED');
    }
    try {
      await this.deletePrimaryData(receipt, claim.userId);
    } catch (error) {
      console.error('[account-deletion] primary data deletion failed');
      return this.markFailed(receipt, 'DATABASE_DELETE_FAILED');
    }
    return this.status(receipt);
  }

  /** Resume a bounded batch of confirmed work after a process or dependency failure. */
  async retryInterruptedDeletions(): Promise<number> {
    const staleBefore = new Date(this.clock().getTime() - PROCESSING_LEASE_MS);
    const requests = await this.database.accountDeletionRequest.findMany({
      where: {
        user_id: { not: null },
        OR: [
          { status: 'failed' },
          { status: 'processing', processing_started_at: { lte: staleBefore } },
        ],
      },
      select: { id: true },
      orderBy: [{ erase_by: 'asc' }, { requested_at: 'asc' }],
      take: MAX_DELETION_RETRIES_PER_SWEEP,
    });
    let attempted = 0;
    for (const request of requests) {
      try {
        await this.confirmDeletion(request.id, ACCOUNT_DELETION_CONFIRMATION);
      } catch {
        console.error('[account-deletion] scheduled retry failed');
      }
      attempted += 1;
    }
    return attempted;
  }

  async status(receipt: unknown): Promise<DeletionStatusView> {
    if (!validReceipt(receipt)) {
      throw new AccountServiceError(404, 'DELETION_RECEIPT_NOT_FOUND', 'Deletion receipt not found');
    }
    const now = this.clock();
    const request = await this.database.accountDeletionRequest.findUnique({ where: { id: receipt } });
    const auditExpired = request?.status === 'completed' && request.expires_at <= now;
    if (!request || auditExpired) {
      if (request) await this.database.accountDeletionRequest.delete({ where: { id: receipt } });
      throw new AccountServiceError(404, 'DELETION_RECEIPT_NOT_FOUND', 'Deletion receipt not found');
    }
    return deletionView(request as DeletionRequestRow);
  }
}
