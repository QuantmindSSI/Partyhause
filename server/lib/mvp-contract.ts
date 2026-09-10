export const MVP_EVENT_STATUSES = ['draft', 'published', 'completed', 'cancelled'] as const;
export type MvpEventStatus = (typeof MVP_EVENT_STATUSES)[number];

export const MVP_RSVP_STATUSES = ['pending', 'accepted', 'declined', 'maybe'] as const;
export type MvpRsvpStatus = (typeof MVP_RSVP_STATUSES)[number];

export interface MvpEventDto {
  id: string;
  name: string;
  description: string | null;
  start: string;
  end: string;
  timezone: string;
  location: string;
  status: MvpEventStatus;
  privacy: 'private';
  maxGuests: 50;
  revision: number;
  publishedAt: string | null;
  cancelledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MvpGuestDto {
  id: string;
  eventId: string;
  name: string;
  email: string;
  rsvpStatus: MvpRsvpStatus;
  rsvpRespondedAt: string | null;
  checkedIn: boolean;
  checkedInAt: string | null;
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export interface MvpGuestStats {
  total: number;
  pending: number;
  accepted: number;
  declined: number;
  maybe: number;
  checkedIn: number;
}

export interface MvpHttpResponse<T> {
  status: number;
  body: T;
}

export interface ParsedEventFields {
  name: string;
  description: string | null;
  start: Date;
  end: Date;
  timezone: string;
  location: string;
}

export interface ParsedEventPatch {
  expectedRevision: number;
  changes: Partial<ParsedEventFields>;
}

export interface ParsedGuestInput {
  name: string;
  email: string;
}

export interface ParsedGuestCreate {
  guests: ParsedGuestInput[];
  isBatch: boolean;
}

export interface ParsedCorrection {
  expectedRevision: number;
  checkedIn: boolean;
}

interface EventRow {
  id: string;
  name: string;
  description: string | null;
  start_date: Date;
  end_date: Date;
  timezone: string | null;
  location: string;
  status: string;
  privacy: string;
  max_guests: number;
  revision: number;
  published_at: Date | null;
  cancelled_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface GuestRow {
  id: string;
  event_id: string;
  name: string;
  email: string;
  rsvp_status: string;
  rsvp_responded_at: Date | null;
  checked_in: boolean;
  checked_in_at: Date | null;
  revision: number;
  created_at: Date;
  updated_at: Date;
}

const EVENT_CREATE_KEYS = ['name', 'description', 'start', 'end', 'timezone', 'location'] as const;
const EVENT_PATCH_KEYS = [...EVENT_CREATE_KEYS, 'expectedRevision'] as const;
const GUEST_KEYS = ['name', 'email'] as const;
const MAX_BATCH_GUESTS = 50;
const ISO_INSTANT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-](\d{2}):(\d{2}))$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function hasControlCharacter(value: string): boolean {
  return [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127;
  });
}

/** A safe API error whose message may be returned to an untrusted client. */
export class MvpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'MvpError';
  }
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new MvpError(400, 'INVALID_REQUEST', 'Request body must be a JSON object');
  }
  return value as Record<string, unknown>;
}

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function exactKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  required: readonly string[],
): void {
  if (Object.keys(value).some((key) => !allowed.includes(key))) {
    throw new MvpError(400, 'UNKNOWN_FIELDS', 'Request body contains unsupported fields');
  }
  if (required.some((key) => !hasOwn(value, key))) {
    throw new MvpError(400, 'INVALID_REQUEST', 'Request body is missing required fields');
  }
}

function text(value: unknown, field: string, maximum: number): string {
  if (typeof value !== 'string') {
    throw new MvpError(400, 'INVALID_REQUEST', `${field} must be a string`);
  }
  const normalized = value.trim();
  if (!normalized || normalized.length > maximum || hasControlCharacter(normalized)) {
    throw new MvpError(400, 'INVALID_REQUEST', `${field} has an invalid length or format`);
  }
  return normalized;
}

function description(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== 'string') {
    throw new MvpError(400, 'INVALID_REQUEST', 'description must be a string or null');
  }
  const normalized = value.trim();
  if (normalized.length > 2_000 || normalized.includes('\u0000')) {
    throw new MvpError(400, 'INVALID_REQUEST', 'description has an invalid length or format');
  }
  return normalized || null;
}

function validInstantParts(match: RegExpMatchArray): boolean {
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const offsetHour = match[8] ? Number(match[8]) : 0;
  const offsetMinute = match[9] ? Number(match[9]) : 0;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return year >= 1
    && month >= 1
    && month <= 12
    && day >= 1
    && day <= daysInMonth
    && hour <= 23
    && minute <= 59
    && second <= 59
    && offsetHour <= 23
    && offsetMinute <= 59;
}

function instant(value: unknown, field: string): Date {
  const source = typeof value === 'string' ? value : '';
  const match = source.match(ISO_INSTANT);
  if (!match || !validInstantParts(match)) {
    throw new MvpError(400, 'INVALID_EVENT_TIME', `${field} must be an ISO-8601 instant`);
  }
  const parsed = new Date(source);
  if (Number.isNaN(parsed.getTime())) {
    throw new MvpError(400, 'INVALID_EVENT_TIME', `${field} must be an ISO-8601 instant`);
  }
  return parsed;
}

function timezone(value: unknown): string {
  const candidate = text(value, 'timezone', 50);
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: candidate }).format(0);
  } catch {
    throw new MvpError(400, 'INVALID_TIMEZONE', 'timezone must be a valid IANA identifier');
  }
  return candidate;
}

function revision(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 1) {
    throw new MvpError(400, 'INVALID_REVISION', 'expectedRevision must be a positive integer');
  }
  return value as number;
}

function eventFields(value: Record<string, unknown>): ParsedEventFields {
  const fields = {
    name: text(value.name, 'name', 120),
    description: description(value.description),
    start: instant(value.start, 'start'),
    end: instant(value.end, 'end'),
    timezone: timezone(value.timezone),
    location: text(value.location, 'location', 255),
  };
  validateEventWindow(fields.start, fields.end);
  return fields;
}

/** Parse and normalize the exact event-create request contract. */
export function parseEventCreate(value: unknown): ParsedEventFields {
  const body = record(value);
  exactKeys(body, EVENT_CREATE_KEYS, EVENT_CREATE_KEYS);
  return eventFields(body);
}

/** Parse an event patch while rejecting empty updates and unknown fields. */
export function parseEventPatch(value: unknown): ParsedEventPatch {
  const body = record(value);
  exactKeys(body, EVENT_PATCH_KEYS, ['expectedRevision']);
  const changes: Partial<ParsedEventFields> = {};
  if (hasOwn(body, 'name')) changes.name = text(body.name, 'name', 120);
  if (hasOwn(body, 'description')) changes.description = description(body.description);
  if (hasOwn(body, 'start')) changes.start = instant(body.start, 'start');
  if (hasOwn(body, 'end')) changes.end = instant(body.end, 'end');
  if (hasOwn(body, 'timezone')) changes.timezone = timezone(body.timezone);
  if (hasOwn(body, 'location')) changes.location = text(body.location, 'location', 255);
  if (Object.keys(changes).length === 0) {
    throw new MvpError(400, 'EMPTY_UPDATE', 'At least one event field must be provided');
  }
  if (changes.start && changes.end) validateEventWindow(changes.start, changes.end);
  return { expectedRevision: revision(body.expectedRevision), changes };
}

/** Enforce the strict ordering used by create, edit, and publish. */
export function validateEventWindow(start: Date, end: Date): void {
  if (end.getTime() <= start.getTime()) {
    throw new MvpError(400, 'INVALID_EVENT_TIME', 'end must be after start');
  }
}

/** Validate and normalize one guest identity. */
export function parseGuest(value: unknown): ParsedGuestInput {
  const body = record(value);
  exactKeys(body, GUEST_KEYS, GUEST_KEYS);
  const email = text(body.email, 'email', 254).toLowerCase();
  if (!EMAIL.test(email)) {
    throw new MvpError(400, 'INVALID_EMAIL', 'email must be a valid address');
  }
  return { name: text(body.name, 'name', 120), email };
}

/** Parse either one guest object or a bounded `{ guests }` batch. */
export function parseGuestCreate(value: unknown): ParsedGuestCreate {
  const body = record(value);
  if (hasOwn(body, 'guests')) {
    exactKeys(body, ['guests'], ['guests']);
    if (!Array.isArray(body.guests) || body.guests.length < 1 || body.guests.length > MAX_BATCH_GUESTS) {
      throw new MvpError(400, 'INVALID_GUEST_BATCH', 'guests must contain between 1 and 50 entries');
    }
    return { guests: body.guests.map(parseGuest), isBatch: true };
  }
  return { guests: [parseGuest(body)], isBatch: false };
}

/** Parse the only editable guest fields plus the required revision. */
export function parseGuestPatch(value: unknown): {
  expectedRevision: number;
  name?: string;
  email?: string;
} {
  const body = record(value);
  exactKeys(body, ['name', 'email', 'expectedRevision'], ['expectedRevision']);
  const result: { expectedRevision: number; name?: string; email?: string } = {
    expectedRevision: revision(body.expectedRevision),
  };
  if (hasOwn(body, 'name')) result.name = text(body.name, 'name', 120);
  if (hasOwn(body, 'email')) result.email = parseGuest({ name: 'Guest', email: body.email }).email;
  if (result.name === undefined && result.email === undefined) {
    throw new MvpError(400, 'EMPTY_UPDATE', 'At least one guest field must be provided');
  }
  return result;
}

/** Parse a command body containing only a revision precondition. */
export function parseRevisionBody(value: unknown): number {
  const body = record(value);
  exactKeys(body, ['expectedRevision'], ['expectedRevision']);
  return revision(body.expectedRevision);
}

/** Parse an explicit attendance correction target and revision. */
export function parseCorrection(value: unknown): ParsedCorrection {
  const body = record(value);
  exactKeys(body, ['expectedRevision', 'checkedIn'], ['expectedRevision', 'checkedIn']);
  if (typeof body.checkedIn !== 'boolean') {
    throw new MvpError(400, 'INVALID_REQUEST', 'checkedIn must be a boolean');
  }
  return { expectedRevision: revision(body.expectedRevision), checkedIn: body.checkedIn };
}

/** Validate a retry key without changing its identity. */
export function parseIdempotencyKey(value: string | undefined): string {
  if (!value) {
    throw new MvpError(400, 'IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required');
  }
  const key = value.trim();
  if (!key || key.length > 200 || hasControlCharacter(key)) {
    throw new MvpError(400, 'INVALID_IDEMPOTENCY_KEY', 'Idempotency-Key header is invalid');
  }
  return key;
}

/** Convert an event row to the complete public MVP allowlist. */
export function toMvpEvent(row: EventRow): MvpEventDto {
  if (!MVP_EVENT_STATUSES.includes(row.status as MvpEventStatus)) {
    throw new MvpError(500, 'INVALID_STORED_STATE', 'The event has an unsupported state');
  }
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    start: row.start_date.toISOString(),
    end: row.end_date.toISOString(),
    timezone: row.timezone || 'UTC',
    location: row.location,
    status: row.status as MvpEventStatus,
    privacy: 'private',
    maxGuests: 50,
    revision: row.revision,
    publishedAt: row.published_at?.toISOString() ?? null,
    cancelledAt: row.cancelled_at?.toISOString() ?? null,
    completedAt: row.completed_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

/** Convert a guest row to the complete public MVP allowlist. */
export function toMvpGuest(row: GuestRow): MvpGuestDto {
  if (!MVP_RSVP_STATUSES.includes(row.rsvp_status as MvpRsvpStatus)) {
    throw new MvpError(500, 'INVALID_STORED_STATE', 'The guest has an unsupported RSVP state');
  }
  return {
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    email: row.email.trim().toLowerCase(),
    rsvpStatus: row.rsvp_status as MvpRsvpStatus,
    rsvpRespondedAt: row.rsvp_responded_at?.toISOString() ?? null,
    checkedIn: row.checked_in,
    checkedInAt: row.checked_in_at?.toISOString() ?? null,
    revision: row.revision,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

/** Derive authoritative guest counts from the returned allowlisted rows. */
export function mvpGuestStats(guests: MvpGuestDto[]): MvpGuestStats {
  return {
    total: guests.length,
    pending: guests.filter((guest) => guest.rsvpStatus === 'pending').length,
    accepted: guests.filter((guest) => guest.rsvpStatus === 'accepted').length,
    declined: guests.filter((guest) => guest.rsvpStatus === 'declined').length,
    maybe: guests.filter((guest) => guest.rsvpStatus === 'maybe').length,
    checkedIn: guests.filter((guest) => guest.checkedIn).length,
  };
}
