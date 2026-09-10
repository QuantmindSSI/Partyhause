import { createHash } from 'node:crypto';
import type { Prisma, PrismaClient } from '@prisma/client';

import { MvpError, type MvpHttpResponse } from './mvp-contract';

const COMMAND_TTL_MS = 24 * 60 * 60 * 1_000;

function canonicalJson(value: unknown): string {
  if (value === null || typeof value === 'boolean' || typeof value === 'number') {
    return JSON.stringify(value);
  }
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`).join(',')}}`;
  }
  throw new MvpError(400, 'INVALID_REQUEST', 'Request contains an unsupported value');
}

/** Produce a stable SHA-256 hash for a normalized command request. */
export function hashMvpRequest(operation: string, payload: unknown): string {
  return createHash('sha256').update(canonicalJson({ operation, payload })).digest('hex');
}

function errorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const value = (error as { code?: unknown }).code;
  return typeof value === 'string' ? value : undefined;
}

function errorTarget(error: unknown): string {
  if (!error || typeof error !== 'object') return '';
  const target = (error as { meta?: { target?: unknown } }).meta?.target;
  return Array.isArray(target) ? target.join(',') : String(target ?? '');
}

function errorMessage(error: unknown): string {
  if (!error || typeof error !== 'object' || !('message' in error)) return '';
  return String((error as { message?: unknown }).message ?? '');
}

function isGuestEmailConstraint(target: string, message: string): boolean {
  return target.includes('normalized_email')
    || target.includes('guests_event_id_normalized_email_key')
    || message.includes('guests_event_id_normalized_email_key');
}

function uniqueConstraintError(target: string, message: string): MvpError {
  return isGuestEmailConstraint(target, message)
    ? new MvpError(409, 'GUEST_EMAIL_EXISTS', 'A guest with this email already exists')
    : new MvpError(409, 'RESOURCE_CONFLICT', 'The request conflicts with existing data');
}

function isUniqueConflict(error: unknown): boolean {
  return errorCode(error) === 'P2002' || errorCode(error) === '23505';
}

function storedResponse<T>(value: Prisma.JsonValue | null): MvpHttpResponse<T> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new MvpError(500, 'INVALID_COMMAND_STATE', 'Stored command response is unavailable');
  }
  const candidate = value as Record<string, unknown>;
  if (!Number.isInteger(candidate.status) || !Object.prototype.hasOwnProperty.call(candidate, 'body')) {
    throw new MvpError(500, 'INVALID_COMMAND_STATE', 'Stored command response is unavailable');
  }
  return { status: candidate.status as number, body: candidate.body as T };
}

function resolveExisting<T>(
  existing: { operation: string; request_hash: string; status: string; response: Prisma.JsonValue | null },
  operation: string,
  requestHash: string,
): MvpHttpResponse<T> {
  if (existing.operation !== operation || existing.request_hash !== requestHash) {
    throw new MvpError(409, 'IDEMPOTENCY_KEY_CONFLICT', 'Idempotency key was used for a different request');
  }
  if (existing.status !== 'completed') {
    throw new MvpError(409, 'COMMAND_IN_PROGRESS', 'The command is still being processed');
  }
  return storedResponse<T>(existing.response);
}

async function replayAfterConflict<T>(
  database: PrismaClient,
  actorId: string,
  idempotencyKey: string,
  operation: string,
  requestHash: string,
): Promise<MvpHttpResponse<T> | null> {
  const existing = await database.mvpCommand.findUnique({
    where: { actor_id_idempotency_key: { actor_id: actorId, idempotency_key: idempotencyKey } },
    select: { operation: true, request_hash: true, status: true, response: true },
  });
  if (!existing) return null;
  return resolveExisting<T>(existing, operation, requestHash);
}

/**
 * Execute one mutation and its durable replay record in the same transaction.
 * A concurrent duplicate waits on the unique key and then returns the winner's response.
 */
export async function executeMvpCommand<T>(
  database: PrismaClient,
  actorId: string,
  idempotencyKey: string,
  operation: string,
  payload: unknown,
  action: (transaction: Prisma.TransactionClient, commandId: string) => Promise<MvpHttpResponse<T>>,
): Promise<MvpHttpResponse<T>> {
  const requestHash = hashMvpRequest(operation, payload);
  try {
    return await database.$transaction(async (transaction) => {
      const existing = await transaction.mvpCommand.findUnique({
        where: { actor_id_idempotency_key: { actor_id: actorId, idempotency_key: idempotencyKey } },
        select: { operation: true, request_hash: true, status: true, response: true },
      });
      if (existing) return resolveExisting<T>(existing, operation, requestHash);

      const command = await transaction.mvpCommand.create({
        data: {
          actor_id: actorId,
          idempotency_key: idempotencyKey,
          operation,
          request_hash: requestHash,
          expires_at: new Date(Date.now() + COMMAND_TTL_MS),
        },
        select: { id: true },
      });
      const response = await action(transaction, command.id);
      const stored = JSON.parse(JSON.stringify(response)) as Prisma.InputJsonValue;
      await transaction.mvpCommand.update({
        where: { id: command.id },
        data: { status: 'completed', response: stored },
      });
      return response;
    });
  } catch (error) {
    if (isUniqueConflict(error)) {
      const replay = await replayAfterConflict<T>(
        database,
        actorId,
        idempotencyKey,
        operation,
        requestHash,
      );
      if (replay) return replay;
    }
    throw error;
  }
}

/** Map known database constraints to stable public errors. */
export function mapMvpDatabaseError(error: unknown): MvpError {
  if (error instanceof MvpError) return error;
  const code = errorCode(error);
  const target = errorTarget(error);
  const message = errorMessage(error);
  if (message.includes('GUEST_LIMIT_REACHED')) {
    return new MvpError(409, 'GUEST_LIMIT_REACHED', 'This event already has 50 guests');
  }
  if (code === 'P2002' || code === '23505') {
    return uniqueConstraintError(target, message);
  }
  if (code === 'P2034' || code === '40001') {
    return new MvpError(409, 'CONCURRENT_MODIFICATION', 'The record changed during this request');
  }
  return new MvpError(500, 'INTERNAL_ERROR', 'The request could not be completed');
}
