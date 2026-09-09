import { Prisma, type PrismaClient } from '@prisma/client';

const RETENTION_INTERVAL_MS = 60 * 60 * 1_000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1_000;
const RETENTION_LOCK_ID = 7_206_091;

export interface RetentionSweepResult {
  acquired: boolean;
  affectedRows: number;
}

function retentionStatements(now: Date, thirtyDayCutoff: Date): Prisma.Sql[] {
  return [
    Prisma.sql`UPDATE users SET verification_token = NULL, verification_token_expires = NULL WHERE verification_token_expires <= ${now}`,
    Prisma.sql`UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE reset_token_expires <= ${now}`,
    Prisma.sql`DELETE FROM invitation_deliveries WHERE created_at <= ${thirtyDayCutoff}`,
    Prisma.sql`UPDATE guest_invitations SET revoked_at = COALESCE(revoked_at, ${now}), token_hash = md5('expired:' || id) || md5('expired-2:' || id) WHERE (expires_at <= ${now} OR event_id IN (SELECT id FROM events WHERE end_date <= ${now})) AND token_hash <> (md5('expired:' || id) || md5('expired-2:' || id))`,
    Prisma.sql`UPDATE event_invite_tokens SET is_active = false WHERE is_active = true AND (expires_at <= ${now} OR event_id IN (SELECT id FROM events WHERE end_date <= ${now}))`,
    Prisma.sql`UPDATE guests SET email_log_id = NULL WHERE email_log_id IN (SELECT id FROM email_logs WHERE sent_at <= ${thirtyDayCutoff})`,
    Prisma.sql`DELETE FROM email_events WHERE email_log_id IN (SELECT id FROM email_logs WHERE sent_at <= ${thirtyDayCutoff})`,
    Prisma.sql`DELETE FROM email_logs WHERE sent_at <= ${thirtyDayCutoff}`,
    Prisma.sql`DELETE FROM attendance_audits WHERE event_id IN (SELECT id FROM events WHERE end_date <= ${thirtyDayCutoff})`,
    Prisma.sql`DELETE FROM cost_split_requests WHERE event_id IN (SELECT id FROM events WHERE end_date <= ${thirtyDayCutoff})`,
    Prisma.sql`DELETE FROM guest_crew_conversions WHERE event_id IN (SELECT id FROM events WHERE end_date <= ${thirtyDayCutoff})`,
    Prisma.sql`DELETE FROM guests WHERE event_id IN (SELECT id FROM events WHERE end_date <= ${thirtyDayCutoff})`,
    Prisma.sql`DELETE FROM mvp_commands command WHERE expires_at <= ${now} AND NOT EXISTS (SELECT 1 FROM invitation_deliveries WHERE command_id = command.id) AND NOT EXISTS (SELECT 1 FROM attendance_audits WHERE command_id = command.id)`,
    Prisma.sql`DELETE FROM account_deletion_requests WHERE status = 'completed' AND expires_at <= ${now}`,
  ];
}

/** Apply the complete primary-store retention schedule under one cluster-wide lock. */
export async function runRetentionSweep(
  database: PrismaClient,
  now = new Date(),
): Promise<RetentionSweepResult> {
  const thirtyDayCutoff = new Date(now.getTime() - THIRTY_DAYS_MS);
  return database.$transaction(async (transaction) => {
    const [lock] = await transaction.$queryRaw<Array<{ acquired: boolean }>>`
      SELECT pg_try_advisory_xact_lock(${RETENTION_LOCK_ID}) AS acquired
    `;
    if (!lock?.acquired) return { acquired: false, affectedRows: 0 };
    let affectedRows = 0;
    for (const statement of retentionStatements(now, thirtyDayCutoff)) {
      affectedRows += await transaction.$executeRaw(statement);
    }
    return { acquired: true, affectedRows };
  }, { maxWait: 5_000, timeout: 60_000 });
}

/** Start the hourly retention pass and run one pass immediately. */
export function startRetentionSweeper(
  database: PrismaClient,
  retryInterruptedDeletions?: () => Promise<unknown>,
): NodeJS.Timeout | null {
  if (process.env.NODE_ENV === 'test') return null;
  const sweep = () => {
    void (async () => {
      if (retryInterruptedDeletions) {
        try {
          await retryInterruptedDeletions();
        } catch {
          console.error('[account-deletion] scheduled batch failed');
        }
      }
      try {
        await runRetentionSweep(database);
      } catch {
        console.error('[retention] scheduled sweep failed');
      }
    })();
  };
  sweep();
  const timer = setInterval(sweep, RETENTION_INTERVAL_MS);
  timer.unref();
  return timer;
}
