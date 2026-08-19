// Prisma client singleton for the API server.
// Uses the @prisma/adapter-pg driver adapter (required by Prisma 7).

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

function partsUrl(): string {
  return `postgresql://${process.env.POSTGRES_USER || 'partyadmin'}:${encodeURIComponent(
    process.env.POSTGRES_PASSWORD || '',
  )}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT || '5432'}/${process.env.POSTGRES_DB || 'partyhause'}?sslmode=require`;
}

/**
 * Resolve the connection string defensively: DATABASE_URL wins only when it
 * actually parses. A raw password containing URL-reserved characters ('#'
 * cuts the string at the fragment) produced an unparseable DATABASE_URL in
 * production — every query failed while health checks stayed green. The
 * discrete POSTGRES_* parts are URL-encoded here and cannot have that
 * problem.
 */
function resolveConnectionString(): string {
  const fromEnv = process.env.DATABASE_URL;
  if (fromEnv) {
    try {
      new URL(fromEnv);
      return fromEnv;
    } catch {
      if (process.env.POSTGRES_HOST) {
        console.warn(
          '[prisma] DATABASE_URL is not a parseable URL (likely unencoded password characters); using POSTGRES_* parts instead',
        );
        return partsUrl();
      }
      console.warn('[prisma] DATABASE_URL is not a parseable URL and no POSTGRES_* fallback is set');
      return fromEnv;
    }
  }
  return partsUrl();
}

const adapter = new PrismaPg({ connectionString: resolveConnectionString() });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
