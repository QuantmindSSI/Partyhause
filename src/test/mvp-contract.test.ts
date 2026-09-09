import { describe, expect, it } from 'vitest';

import {
  MvpError,
  parseCorrection,
  parseEventCreate,
  parseEventPatch,
  parseGuestCreate,
  parseGuestPatch,
  parseIdempotencyKey,
  toMvpEvent,
  toMvpGuest,
} from '../../server/lib/mvp-contract';

function expectCode(operation: () => unknown, code: string): void {
  try {
    operation();
  } catch (error) {
    expect(error).toBeInstanceOf(MvpError);
    expect((error as MvpError).code).toBe(code);
    return;
  }
  throw new Error(`Expected ${code}`);
}

const eventInput = {
  name: ' Dinner ',
  description: ' Bring a coat ',
  start: '2030-01-01T18:00:00.000Z',
  end: '2030-01-01T20:00:00.000Z',
  timezone: 'Europe/London',
  location: ' The Hall ',
};

describe('MVP request contracts', () => {
  it('normalizes the complete event body and rejects unknown fields', () => {
    expect(parseEventCreate(eventInput)).toMatchObject({
      name: 'Dinner',
      description: 'Bring a coat',
      timezone: 'Europe/London',
      location: 'The Hall',
    });
    expectCode(() => parseEventCreate({ ...eventInput, privacy: 'public' }), 'UNKNOWN_FIELDS');
  });

  it('rejects invalid timezones, equal dates, and missing event fields', () => {
    expectCode(() => parseEventCreate({ ...eventInput, timezone: 'Mars/Olympus' }), 'INVALID_TIMEZONE');
    expectCode(() => parseEventCreate({ ...eventInput, end: eventInput.start }), 'INVALID_EVENT_TIME');
    expectCode(() => parseEventCreate({ ...eventInput, start: '2029-02-29T18:00:00.000Z' }), 'INVALID_EVENT_TIME');
    const missingLocation = { ...eventInput } as Record<string, unknown>;
    delete missingLocation.location;
    expectCode(() => parseEventCreate(missingLocation), 'INVALID_REQUEST');
  });

  it('requires a revision and at least one editable field for event patches', () => {
    expect(parseEventPatch({ location: 'New venue', expectedRevision: 4 })).toEqual({
      expectedRevision: 4,
      changes: { location: 'New venue' },
    });
    expectCode(() => parseEventPatch({ expectedRevision: 4 }), 'EMPTY_UPDATE');
    expectCode(() => parseEventPatch({ name: 'Changed', expectedRevision: 0 }), 'INVALID_REVISION');
  });

  it('accepts one guest or at most 50 strict guest entries', () => {
    expect(parseGuestCreate({ name: ' Ada ', email: ' ADA@Example.COM ' })).toEqual({
      guests: [{ name: 'Ada', email: 'ada@example.com' }],
      isBatch: false,
    });
    const guests = Array.from({ length: 50 }, (_, index) => ({
      name: `Guest ${index}`,
      email: `guest-${index}@example.com`,
    }));
    expect(parseGuestCreate({ guests }).guests).toHaveLength(50);
    expectCode(() => parseGuestCreate({ guests: [...guests, guests[0]] }), 'INVALID_GUEST_BATCH');
    expectCode(() => parseGuestCreate({ name: 'Ada', email: 'bad', phone: 'x' }), 'UNKNOWN_FIELDS');
  });

  it('keeps generic updates separate from attendance commands', () => {
    expect(parseGuestPatch({ name: 'Ada', expectedRevision: 2 })).toEqual({
      name: 'Ada',
      expectedRevision: 2,
    });
    expectCode(
      () => parseGuestPatch({ checkedIn: true, expectedRevision: 2 }),
      'UNKNOWN_FIELDS',
    );
    expect(parseCorrection({ checkedIn: false, expectedRevision: 2 })).toEqual({
      checkedIn: false,
      expectedRevision: 2,
    });
  });

  it('requires a bounded nonempty idempotency key', () => {
    expect(parseIdempotencyKey(' command-1 ')).toBe('command-1');
    expectCode(() => parseIdempotencyKey(undefined), 'IDEMPOTENCY_KEY_REQUIRED');
    expectCode(() => parseIdempotencyKey('x'.repeat(201)), 'INVALID_IDEMPOTENCY_KEY');
  });
});

describe('MVP response allowlists', () => {
  it('does not expose event internals', () => {
    const row = {
      id: 'event-1',
      name: 'Dinner',
      description: null,
      start_date: new Date('2030-01-01T18:00:00Z'),
      end_date: new Date('2030-01-01T20:00:00Z'),
      timezone: 'UTC',
      location: 'Hall',
      status: 'draft',
      privacy: 'private',
      max_guests: 50,
      revision: 1,
      published_at: null,
      cancelled_at: null,
      completed_at: null,
      created_at: new Date('2029-01-01T00:00:00Z'),
      updated_at: new Date('2029-01-01T00:00:00Z'),
      host_id: 'secret-host',
      settings: { secret: true },
    };
    const event = toMvpEvent(row);
    expect(event).not.toHaveProperty('host_id');
    expect(event).not.toHaveProperty('settings');
    expect(event).toHaveProperty('maxGuests', 50);
  });

  it('does not expose guest internals', () => {
    const row = {
      id: 'guest-1',
      event_id: 'event-1',
      name: 'Ada',
      email: 'ada@example.com',
      rsvp_status: 'accepted',
      rsvp_responded_at: null,
      checked_in: false,
      checked_in_at: null,
      revision: 1,
      created_at: new Date('2029-01-01T00:00:00Z'),
      updated_at: new Date('2029-01-01T00:00:00Z'),
      token_hash: 'secret',
      metadata: { secret: true },
    };
    const guest = toMvpGuest(row);
    expect(guest).not.toHaveProperty('token_hash');
    expect(guest).not.toHaveProperty('metadata');
    expect(guest.rsvpStatus).toBe('accepted');
  });
});
