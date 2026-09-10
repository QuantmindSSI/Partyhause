import type { PrismaClient } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { executeMvpCommand, hashMvpRequest, mapMvpDatabaseError } from '../../server/lib/mvp-command';
import { MvpError } from '../../server/lib/mvp-contract';

interface CommandRecord {
  id: string;
  actor_id: string;
  idempotency_key: string;
  operation: string;
  request_hash: string;
  status: string;
  response: unknown;
}

function commandDatabase() {
  let stored: CommandRecord | null = null;
  const mvpCommand = {
    findUnique: vi.fn(async () => stored),
    create: vi.fn(async ({ data }: { data: Omit<CommandRecord, 'id' | 'status' | 'response'> }) => {
      if (stored) {
        throw { code: 'P2002', meta: { target: ['actor_id', 'idempotency_key'] } };
      }
      stored = { ...data, id: 'command-1', status: 'pending', response: null };
      return { id: stored.id };
    }),
    update: vi.fn(async ({ data }: { data: Pick<CommandRecord, 'status' | 'response'> }) => {
      if (!stored) throw new Error('Missing command');
      stored = { ...stored, ...data };
      return stored;
    }),
  };
  const transaction = { mvpCommand };
  const database = {
    mvpCommand,
    $transaction: vi.fn(async (work: (client: typeof transaction) => Promise<unknown>) => work(transaction)),
  } as unknown as PrismaClient;
  return { database, mvpCommand };
}

describe('MVP command idempotency', () => {
  it('hashes normalized object keys deterministically', () => {
    expect(hashMvpRequest('event.create', { b: 2, a: 1 })).toBe(
      hashMvpRequest('event.create', { a: 1, b: 2 }),
    );
    expect(hashMvpRequest('event.create', { a: 1 })).not.toBe(
      hashMvpRequest('event.publish', { a: 1 }),
    );
  });

  it('replays the exact stored status and body without running the action twice', async () => {
    const { database } = commandDatabase();
    const action = vi.fn(async () => ({ status: 201, body: { event: { id: 'event-1' } } }));

    const first = await executeMvpCommand(database, 'host-1', 'key-1', 'event.create', { name: 'Dinner' }, action);
    const replay = await executeMvpCommand(database, 'host-1', 'key-1', 'event.create', { name: 'Dinner' }, action);

    expect(first).toEqual({ status: 201, body: { event: { id: 'event-1' } } });
    expect(replay).toEqual(first);
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('rejects one key reused with a different operation or request hash', async () => {
    const { database } = commandDatabase();
    const action = vi.fn(async () => ({ status: 200, body: { ok: true } }));
    await executeMvpCommand(database, 'host-1', 'same-key', 'event.publish', { id: 'one' }, action);

    await expect(executeMvpCommand(
      database,
      'host-1',
      'same-key',
      'event.cancel',
      { id: 'one' },
      action,
    )).rejects.toMatchObject({ status: 409, code: 'IDEMPOTENCY_KEY_CONFLICT' });
    await expect(executeMvpCommand(
      database,
      'host-1',
      'same-key',
      'event.publish',
      { id: 'two' },
      action,
    )).rejects.toMatchObject({ status: 409, code: 'IDEMPOTENCY_KEY_CONFLICT' });
  });

  it('maps database capacity and uniqueness failures without exposing raw messages', () => {
    expect(mapMvpDatabaseError({ code: 'P2010', message: 'GUEST_LIMIT_REACHED' })).toMatchObject({
      status: 409,
      code: 'GUEST_LIMIT_REACHED',
    });
    expect(mapMvpDatabaseError({ code: 'P2002', meta: { target: ['normalized_email'] } })).toMatchObject({
      status: 409,
      code: 'GUEST_EMAIL_EXISTS',
    });
    expect(mapMvpDatabaseError({
      code: 'P2002',
      message: 'Unique constraint failed on guests_event_id_normalized_email_key',
    })).toMatchObject({ status: 409, code: 'GUEST_EMAIL_EXISTS' });
    const unknown = mapMvpDatabaseError(new Error('password=secret'));
    expect(unknown).toBeInstanceOf(MvpError);
    expect(unknown.message).toBe('The request could not be completed');
    expect(unknown.message).not.toContain('secret');
  });
});
