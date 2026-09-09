/**
 * The enrollment plan in scripts/enroll-production-migrations.cjs must agree
 * with prisma/migrations/ on both membership and content.
 *
 * That script is how a production database built by `prisma db push` adopts a
 * migration history: it writes rows into `_prisma_migrations` marking the
 * baseline as already applied, then runs the migrations that came after. It
 * carries a hardcoded list of migration names and a SHA-256 per file, and
 * refuses to run a migration whose bytes no longer match.
 *
 * Both halves of that plan drift silently:
 *
 *   * Adding a migration and forgetting to add an entry means enrollment
 *     records fewer migrations than exist, and the next `migrate deploy`
 *     re-runs the missing one against tables it has already altered.
 *   * Editing a migration and forgetting to update its checksum means
 *     enrollment throws partway through, against production.
 *
 * Both have already happened once. `npm run test:migrations` cannot catch
 * either: it replays from an empty database and never reads this plan.
 *
 * These assertions are static. The script calls `main()` at import and would
 * open a database connection, so its source is parsed rather than executed.
 */

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const REPOSITORY_ROOT = process.cwd();
const SCRIPT = join(REPOSITORY_ROOT, 'scripts/enroll-production-migrations.cjs');
const MIGRATIONS_DIR = join(REPOSITORY_ROOT, 'prisma/migrations');

/** Migration directories on disk, which is the source of truth. */
function migrationsOnDisk(): string[] {
  return readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

/**
 * The `{ name, checksum }` pairs declared in the script.
 *
 * Read with a regex rather than by importing, for the reason in the header.
 * The pattern requires the two keys adjacent and in order, which is how every
 * entry is written; a reordered entry fails here loudly rather than being
 * skipped silently.
 */
function plannedEntries(): Array<{ name: string; checksum: string }> {
  const source = readFileSync(SCRIPT, 'utf8');
  const pattern = /name: '([^']+)',\s*\n\s*checksum: '([0-9a-f]{64})'/g;
  const entries: Array<{ name: string; checksum: string }> = [];
  for (let match = pattern.exec(source); match !== null; match = pattern.exec(source)) {
    entries.push({ name: match[1], checksum: match[2] });
  }
  return entries;
}

function sha256OfMigration(name: string): string {
  const sql = readFileSync(join(MIGRATIONS_DIR, name, 'migration.sql'), 'utf8');
  return createHash('sha256').update(sql).digest('hex');
}

describe('production migration enrollment plan', () => {
  const onDisk = migrationsOnDisk();
  const planned = plannedEntries();

  it('finds at least one migration to check, so a broken parse cannot pass vacuously', () => {
    expect(onDisk.length).toBeGreaterThan(0);
    expect(planned.length).toBeGreaterThan(0);
  });

  it('plans exactly the migrations that exist on disk, in the same set', () => {
    expect(planned.map((entry) => entry.name).sort()).toEqual(onDisk);
  });

  it('pins a checksum matching the bytes of every migration it will run', () => {
    const mismatched = planned
      .map((entry) => ({ ...entry, actual: sha256OfMigration(entry.name) }))
      .filter((entry) => entry.actual !== entry.checksum)
      .map((entry) => `${entry.name}: planned ${entry.checksum}, file hashes ${entry.actual}`);

    expect(mismatched).toEqual([]);
  });

  it('declares the baseline first and marks it as not executed', () => {
    const source = readFileSync(SCRIPT, 'utf8');
    expect(planned[0]?.name).toBe(onDisk[0]);
    expect(planned[0]?.name).toMatch(/_baseline$/);

    // The baseline describes tables production already has. Running it would
    // try to create them again, so it is recorded as applied and never
    // executed. That is the whole reason enrollment exists rather than a plain
    // `migrate deploy`.
    expect(source).toMatch(/name: '[^']*_baseline',[\s\S]{0,200}?baseline: true/);
  });

  it('carries an executable file path for every migration except the baseline', () => {
    const source = readFileSync(SCRIPT, 'utf8');
    for (const entry of planned.filter((candidate) => !candidate.name.endsWith('_baseline'))) {
      expect(source).toContain(`prisma/migrations/${entry.name}/migration.sql`);
    }
  });
});
