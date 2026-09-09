import { describe, expect, it, vi } from 'vitest';

import {
  createSignupAccount,
  isDuplicateEmailError,
  normalizeEmail,
  usernameFromUuid,
} from '../../server/routes/auth';

const USER_ID = '123e4567-e89b-42d3-a456-426614174000';

function transactionDatabase(profileCreate = vi.fn().mockResolvedValue({ id: USER_ID })) {
  const user = {
    id: USER_ID,
    email: 'person@example.com',
    name: 'Person',
    password_hash: 'hash',
  };
  const tx = {
    user: { create: vi.fn().mockResolvedValue(user) },
    userProfile: { create: profileCreate },
  };
  const database = {
    $transaction: vi.fn(async (operation: (client: typeof tx) => Promise<unknown>) => operation(tx)),
  } as unknown as Parameters<typeof createSignupAccount>[0];
  return { database, tx, user };
}

describe('signup transaction helpers', () => {
  it('normalizes valid email identity and rejects malformed input', () => {
    expect(normalizeEmail(' Person@Example.COM ')).toBe('person@example.com');
    expect(normalizeEmail('missing-domain')).toBeNull();
    expect(normalizeEmail('')).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
  });

  it('derives a deterministic, constraint-safe username from the complete UUID', () => {
    const username = usernameFromUuid(USER_ID);

    expect(username).toBe(usernameFromUuid(USER_ID));
    expect(username).toMatch(/^[a-z0-9_]{3,30}$/);
    expect(usernameFromUuid('123e4567-e89b-42d3-a456-426614174001')).not.toBe(username);
  });

  it('rejects values that are not UUIDs', () => {
    expect(() => usernameFromUuid('not-a-uuid')).toThrow(/must be a UUID/);
  });

  it('creates the user and required profile inside one transaction', async () => {
    const { database, tx, user } = transactionDatabase();

    const result = await createSignupAccount(database, {
      email: user.email,
      name: user.name,
      displayName: user.name,
      passwordHash: user.password_hash,
      ageEligible: true,
      termsVersion: '2026-09-06',
      privacyVersion: '2026-09-06',
    }, USER_ID);

    expect(database.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.user.create).toHaveBeenCalledWith({
      data: {
        id: USER_ID,
        email: user.email,
        name: user.name,
        password_hash: user.password_hash,
        age_eligible: true,
        terms_version: '2026-09-06',
        privacy_version: '2026-09-06',
      },
    });
    expect(tx.userProfile.create).toHaveBeenCalledWith({
      data: {
        id: USER_ID,
        username: usernameFromUuid(USER_ID),
        display_name: user.name,
      },
    });
    expect(result).toBe(user);
  });

  it('rejects the transaction when profile creation fails', async () => {
    const failure = new Error('profile write failed');
    const { database } = transactionDatabase(vi.fn().mockRejectedValue(failure));

    await expect(createSignupAccount(database, {
      email: 'person@example.com',
      name: 'Person',
      displayName: 'Person',
      passwordHash: 'hash',
      ageEligible: true,
      termsVersion: '2026-09-06',
      privacyVersion: '2026-09-06',
    }, USER_ID)).rejects.toBe(failure);
  });

  it('recognizes concurrent email conflicts without masking other unique conflicts', () => {
    expect(isDuplicateEmailError({ code: 'P2002', meta: { target: ['email'] } })).toBe(true);
    expect(isDuplicateEmailError({ code: 'P2002', meta: { target: 'users_email_key' } })).toBe(true);
    expect(isDuplicateEmailError({ code: 'P2002', meta: { target: ['username'] } })).toBe(false);
    expect(isDuplicateEmailError(new Error('database unavailable'))).toBe(false);
  });
});
