import { createHmac } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';

import {
  assertInvitationTokenSecretConfigured,
  deriveInvitationToken,
  getInvitationTokenSecret,
  hashInvitationToken,
} from '../../server/lib/invitation-token';

const originalNodeEnv = process.env.NODE_ENV;
const originalSecret = process.env.INVITATION_TOKEN_SECRET;
const originalJwtSecret = process.env.JWT_SECRET;

function restoreEnvironment(): void {
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
  if (originalSecret === undefined) delete process.env.INVITATION_TOKEN_SECRET;
  else process.env.INVITATION_TOKEN_SECRET = originalSecret;
  if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalJwtSecret;
}

function expectedToken(secret: string, parts: string[]): string {
  const hmac = createHmac('sha256', secret);
  for (const part of parts) {
    hmac.update(String(Buffer.byteLength(part, 'utf8')));
    hmac.update(':');
    hmac.update(part);
  }
  return hmac.digest('base64url');
}

describe.sequential('invitation token derivation', () => {
  afterEach(restoreEnvironment);

  it('derives the exact stable 32-byte token from version and persisted IDs', () => {
    const secret = 'stable-invitation-secret-over-thirty-two-bytes';
    const token = deriveInvitationToken(secret, 'invitation-1', 'guest-1', 'event-1');

    expect(token).toBe(expectedToken(secret, ['v1', 'invitation-1', 'guest-1', 'event-1']));
    expect(Buffer.from(token, 'base64url')).toHaveLength(32);
    expect(deriveInvitationToken(secret, 'invitation-1', 'guest-1', 'event-1')).toBe(token);
    expect(deriveInvitationToken(secret, 'invitation-2', 'guest-1', 'event-1')).not.toBe(token);
    expect(hashInvitationToken(token)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('requires a configured secret in every environment', () => {
    process.env.NODE_ENV = 'test';
    delete process.env.INVITATION_TOKEN_SECRET;

    expect(() => getInvitationTokenSecret()).toThrow('INVITATION_TOKEN_SECRET is required');
  });

  it('fails closed on a production secret shorter than 32 UTF-8 bytes', () => {
    process.env.NODE_ENV = 'production';
    process.env.INVITATION_TOKEN_SECRET = 'too-short';

    expect(() => assertInvitationTokenSecretConfigured()).toThrow('at least 32 bytes');
    process.env.INVITATION_TOKEN_SECRET = 'x'.repeat(32);
    expect(() => assertInvitationTokenSecretConfigured()).not.toThrow();
    process.env.JWT_SECRET = process.env.INVITATION_TOKEN_SECRET;
    expect(() => assertInvitationTokenSecretConfigured()).toThrow('independent from JWT_SECRET');
  });
});
