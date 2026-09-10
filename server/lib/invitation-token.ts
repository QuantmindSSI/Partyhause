import { createHash, createHmac } from 'node:crypto';

const TOKEN_VERSION = 'v1';
const MIN_PRODUCTION_SECRET_BYTES = 32;

function configuredSecret(): string {
  const value = process.env.INVITATION_TOKEN_SECRET;
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error('INVITATION_TOKEN_SECRET is required');
  }
  if (process.env.NODE_ENV === 'production' && Buffer.byteLength(value, 'utf8') < MIN_PRODUCTION_SECRET_BYTES) {
    throw new Error(`INVITATION_TOKEN_SECRET must be at least ${MIN_PRODUCTION_SECRET_BYTES} bytes in production`);
  }
  if (process.env.NODE_ENV === 'production' && value === process.env.JWT_SECRET) {
    throw new Error('INVITATION_TOKEN_SECRET must be independent from JWT_SECRET');
  }
  return value;
}

function addPart(hmac: ReturnType<typeof createHmac>, value: string): void {
  hmac.update(String(Buffer.byteLength(value, 'utf8')));
  hmac.update(':');
  hmac.update(value);
}

/** Return the required server-side key used only for invitation token derivation. */
export function getInvitationTokenSecret(): string {
  return configuredSecret();
}

/** Fail startup when invitation credentials cannot be derived safely. */
export function assertInvitationTokenSecretConfigured(): void {
  configuredSecret();
}

/** Derive the stable 32-byte opaque token for one invitation identity. */
export function deriveInvitationToken(
  secret: string,
  invitationId: string,
  guestId: string,
  eventId: string,
): string {
  const hmac = createHmac('sha256', secret);
  for (const part of [TOKEN_VERSION, invitationId, guestId, eventId]) addPart(hmac, part);
  return hmac.digest('base64url');
}

/** Produce the only token representation persisted in PostgreSQL. */
export function hashInvitationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
