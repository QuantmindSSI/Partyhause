import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import bcrypt from 'bcryptjs';
import express from 'express';
import jwt from 'jsonwebtoken';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
  create: vi.fn(),
  profileCreate: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('../../server/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: prismaMocks.findFirst,
      findUnique: prismaMocks.findUnique,
      update: prismaMocks.update,
      create: prismaMocks.create,
    },
    userProfile: { create: prismaMocks.profileCreate },
    $transaction: prismaMocks.transaction,
  },
}));

vi.mock('../../server/lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ ok: true, provider: 'acs', id: 'message-1', status: 'accepted' }),
}));

import authRouter from '../../server/routes/auth';

const secret = 'auth-revocation-test-secret-at-least-32-bytes';

describe('revocable auth routes', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(() => {
    process.env.JWT_SECRET = secret;
    process.env.NODE_ENV = 'test';
    delete process.env.AUTH_BYPASS;
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    const app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', resolve);
    });
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterEach(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  });

  it('signs the current token epoch with HS256 and logout increments it', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 4);
    const user = {
      id: 'user-1',
      email: 'host@example.com',
      name: 'Host',
      password_hash: passwordHash,
      email_verified: true,
      token_version: 7,
      account_status: 'active',
    };
    prismaMocks.findFirst.mockResolvedValueOnce(user);
    prismaMocks.findUnique.mockResolvedValueOnce(user);
    prismaMocks.update.mockResolvedValueOnce({ ...user, token_version: 8 });

    const login = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: 'correct-password' }),
    });
    const body = await login.json() as { token: string };
    const decoded = jwt.verify(body.token, secret, { algorithms: ['HS256'] }) as jwt.JwtPayload;
    expect(decoded.token_version).toBe(7);
    expect(jwt.decode(body.token, { complete: true })?.header.alg).toBe('HS256');

    const logout = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${body.token}` },
    });
    expect(logout.status).toBe(200);
    expect(prismaMocks.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: { token_version: { increment: 1 } },
    });
  });

  it('increments the token epoch on reset and returns no session token', async () => {
    const resetHash = await bcrypt.hash('reset-token', 4);
    prismaMocks.findFirst.mockResolvedValueOnce({
      id: 'user-2',
      email: 'reset@example.com',
      name: 'Reset Host',
      password_hash: await bcrypt.hash('old-password', 4),
      reset_token: resetHash,
      reset_token_expires: new Date(Date.now() + 60_000),
      email_verified: true,
      token_version: 3,
      account_status: 'active',
    });
    prismaMocks.update.mockResolvedValueOnce({ id: 'user-2' });

    const response = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'reset@example.com',
        token: 'reset-token',
        password: 'new-password',
      }),
    });
    const body = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body).not.toHaveProperty('token');
    expect(prismaMocks.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ token_version: { increment: 1 } }),
    }));
  });

  it('rejects signup unless all current consent fields are exact', async () => {
    const response = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'new@example.com',
        password: 'strong-password',
        name: 'New Host',
        ageEligible: true,
        termsVersion: 'old',
        privacyVersion: '2026-09-06',
      }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: 'LEGAL_CONSENT_REQUIRED' });
    expect(prismaMocks.findFirst).not.toHaveBeenCalled();
  });
});
