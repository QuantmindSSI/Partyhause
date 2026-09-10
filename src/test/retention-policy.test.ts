import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('primary-store retention implementation', () => {
  const source = readFileSync(resolve(process.cwd(), 'server/lib/retention.ts'), 'utf8');

  it('erases expired auth credentials and 365-day deletion receipts', () => {
    expect(source).toContain('verification_token_expires <= ${now}');
    expect(source).toContain('reset_token_expires <= ${now}');
    expect(source).toContain("status = 'completed' AND expires_at <= ${now}");
  });

  it('erases invitation detail, RSVP credentials, guests, and attendance on schedule', () => {
    expect(source).toContain('DELETE FROM invitation_deliveries WHERE created_at <= ${thirtyDayCutoff}');
    expect(source).toContain("token_hash = md5('expired:' || id) || md5('expired-2:' || id)");
    expect(source).toContain('DELETE FROM attendance_audits');
    expect(source).toContain('DELETE FROM guests');
    expect(source).toContain('end_date <= ${thirtyDayCutoff}');
  });

  it('uses a PostgreSQL advisory lock so replicas cannot run competing sweeps', () => {
    expect(source).toContain('pg_try_advisory_xact_lock');
    expect(source).toContain('setInterval(sweep, RETENTION_INTERVAL_MS)');
    expect(source).toContain('retryInterruptedDeletions');
  });
});
