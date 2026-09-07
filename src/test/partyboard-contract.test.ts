/**
 * Tests for the PartyBoard request-validation and serialisation contract.
 *
 * WHY THIS EXISTS
 *   src/features/partyboard is 1,320 lines of canvas that has been mounted in
 *   EventManagement.tsx since it was written, and all seven of its fetches
 *   pointed at /api/partyboard/stickies. That router did not exist. Every call
 *   fell through to the SPA catch-all and returned 404, so a sticky survived
 *   only until the ten-second auto-refresh replaced local state with the empty
 *   server response.
 *
 *   Nothing surfaced it, because the hook swallows the failure into an `error`
 *   string and PartyBoardSection renders an empty board on error. A feature
 *   that silently discards every write looks like a feature nobody has used
 *   yet.
 *
 * WHAT IS ASSERTED
 *   The three properties that make the board trustworthy rather than merely
 *   present:
 *
 *   1. Derived state is derived. `votes`, `user_has_voted`, `reactions` and
 *      `converted_to_task` are computed from the votes and tasks tables, never
 *      accepted from the request. A client that posts votes: 9999 gets zero.
 *   2. Malformed geometry is refused, not clamped. A 201 that silently
 *      relocates someone's sticky is worse than a 400 that says why.
 *   3. Two viewers of the same sticky see the same total and their own vote
 *      state. This is the specific thing a counter column cannot express, and
 *      the reason partyboard_sticky_votes is a table.
 *
 *   The functions are pure over plain values, so these run with no database
 *   and no server. Route-level authorization and persistence are exercised
 *   separately by scripts/e2e-partyboard.mjs against a real Postgres.
 */

import { describe, it, expect } from 'vitest';
import {
  STICKY_TYPES,
  CATEGORIES,
  POSITION_MAX,
  MAX_CONTENT_LENGTH,
  MAX_ESTIMATED_COST,
  DEFAULT_SIZE,
  parsePosition,
  parseSize,
  parseCategory,
  parseStickyData,
  toBoundedInt,
  toStickyDTO,
  taskTitleFrom,
  estimatedCostFrom,
  type StickyRowLike,
} from '../../server/lib/partyboard-dto';

const NOW = new Date('2026-09-07T12:00:00.000Z');

function row(over: Partial<StickyRowLike> = {}): StickyRowLike {
  return {
    id: 'sticky-1',
    event_id: 'event-1',
    session_id: null,
    type: 'idea',
    position_x: 10,
    position_y: 20,
    width: 200,
    height: 200,
    rotation: null,
    z_index: 3,
    category: 'food',
    data: { content: 'Taco truck', converted_to_task: false },
    created_by: 'user-a',
    created_at: NOW,
    updated_at: NOW,
    votes: [],
    creator: { name: 'Ada' },
    task: null,
    ...over,
  };
}

// ---------------------------------------------------------------------------

describe('sticky type allowlist', () => {
  it('accepts the two types the canvas can create', () => {
    expect(STICKY_TYPES.has('note')).toBe(true);
    expect(STICKY_TYPES.has('idea')).toBe(true);
  });

  it('refuses the six types declared in the client union but never built', () => {
    // CreateStickyDialog builds only notes and ideas. Storing a 'poll' or
    // 'video' would produce a row that PartyBoardCanvas's switch falls through
    // to `return null` on: a 201 followed by an invisible sticky.
    for (const unbuilt of ['poll', 'image', 'link', 'video', 'checklist', 'cost']) {
      expect(STICKY_TYPES.has(unbuilt)).toBe(false);
    }
  });
});

describe('category parsing', () => {
  it('accepts every category the constants file defines', () => {
    for (const category of ['venue', 'entertainment', 'food', 'activities', 'decor', 'other']) {
      expect(parseCategory(category)).toBe(category);
      expect(CATEGORIES.has(category)).toBe(true);
    }
  });

  it("refuses 'all', which is a filter tab and not a category", () => {
    // A sticky stored as 'all' would render under every filter, including the
    // ones it does not belong to.
    expect(parseCategory('all')).toBeNull();
  });

  it('treats absent, null and empty string as "no category"', () => {
    expect(parseCategory(undefined)).toBeUndefined();
    expect(parseCategory(null)).toBeUndefined();
    expect(parseCategory('')).toBeUndefined();
  });

  it('refuses a non-string', () => {
    expect(parseCategory(7)).toBeNull();
    expect(parseCategory({ id: 'food' })).toBeNull();
  });
});

describe('geometry: refused, never clamped', () => {
  it('accepts an in-bounds position', () => {
    expect(parsePosition({ x: 120, y: -40 })).toEqual({ x: 120, y: -40 });
  });

  it('rounds fractional drag deltas to whole pixels', () => {
    // dnd-kit produces fractional deltas. Sub-pixel precision buys nothing and
    // the column is an integer.
    expect(parsePosition({ x: 120.4, y: -40.6 })).toEqual({ x: 120, y: -41 });
  });

  it('refuses a position beyond the canvas rather than clamping it', () => {
    // Clamping would answer 201 and put the sticky somewhere the user did not.
    expect(parsePosition({ x: POSITION_MAX + 1, y: 0 })).toBeNull();
    expect(parsePosition({ x: 0, y: -POSITION_MAX - 1 })).toBeNull();
  });

  it('refuses NaN and Infinity, which JSON.parse can produce via 1e999', () => {
    expect(parsePosition({ x: Number.NaN, y: 0 })).toBeNull();
    expect(parsePosition({ x: Number.POSITIVE_INFINITY, y: 0 })).toBeNull();
  });

  it('refuses a numeric string, so "10" cannot become a coordinate', () => {
    expect(parsePosition({ x: '10', y: '10' })).toBeNull();
  });

  it('refuses a missing axis', () => {
    expect(parsePosition({ x: 10 })).toBeNull();
    expect(parsePosition({})).toBeNull();
    expect(parsePosition(null)).toBeNull();
  });

  it('defaults an omitted size to the canvas default', () => {
    expect(parseSize(undefined)).toEqual(DEFAULT_SIZE);
    expect(parseSize(null)).toEqual(DEFAULT_SIZE);
  });

  it('refuses a size that is present and malformed', () => {
    expect(parseSize({ width: 0, height: 200 })).toBeNull();
    expect(parseSize({ width: 200 })).toBeNull();
    expect(parseSize({ width: 99_999, height: 200 })).toBeNull();
  });

  it('bounds an integer at both ends inclusively', () => {
    expect(toBoundedInt(5, 5, 10)).toBe(5);
    expect(toBoundedInt(10, 5, 10)).toBe(10);
    expect(toBoundedInt(4, 5, 10)).toBeNull();
    expect(toBoundedInt(11, 5, 10)).toBeNull();
  });
});

describe('sticky data: derived fields are never taken from the request', () => {
  it('strips a client-supplied vote count', () => {
    // This is the attack the votes table exists to prevent. Without the strip,
    // any participant could post an idea that renders as the most popular on
    // the board.
    const parsed = parseStickyData('idea', { content: 'Forged', votes: 9999, user_has_voted: true });
    expect(parsed.error).toBeNull();
    expect(parsed.value).not.toHaveProperty('votes');
    expect(parsed.value).not.toHaveProperty('user_has_voted');
    expect(parsed.value).not.toHaveProperty('reactions');
  });

  it('forces converted_to_task false regardless of what the client sent', () => {
    const parsed = parseStickyData('idea', {
      content: 'Pre-converted',
      converted_to_task: true,
      task_id: 'task-i-made-up',
    });
    expect(parsed.value?.converted_to_task).toBe(false);
    expect(parsed.value).not.toHaveProperty('task_id');
  });

  it('keeps the fields a note legitimately owns', () => {
    const parsed = parseStickyData('note', { content: 'Book the hall', color: 'blue', font_size: 18 });
    expect(parsed.error).toBeNull();
    expect(parsed.value).toEqual({ content: 'Book the hall', color: 'blue', font_size: 18 });
  });

  it('defaults a note colour and font size rather than failing', () => {
    // The dialog always sends both, but a note with no colour is renderable;
    // refusing it would fail a write for a cosmetic omission.
    const parsed = parseStickyData('note', { content: 'Quick note' });
    expect(parsed.value).toEqual({ content: 'Quick note', color: 'yellow', font_size: 14 });
  });

  it('trims content so whitespace cannot pass as a body', () => {
    expect(parseStickyData('note', { content: '   ' }).error).toMatch(/non-empty/);
    expect(parseStickyData('note', { content: '  hi  ' }).value?.content).toBe('hi');
  });

  it('refuses content over the length cap', () => {
    const parsed = parseStickyData('note', { content: 'x'.repeat(MAX_CONTENT_LENGTH + 1) });
    expect(parsed.value).toBeNull();
    expect(parsed.error).toMatch(/at most/);
  });

  it('refuses a missing or non-object data blob', () => {
    expect(parseStickyData('note', undefined).error).toMatch(/required/);
    expect(parseStickyData('note', 'a string').error).toMatch(/required/);
    expect(parseStickyData('note', ['array']).error).toMatch(/required/);
  });

  it('rounds an estimated cost to the two decimals the column stores', () => {
    expect(parseStickyData('idea', { content: 'DJ', estimated_cost: 450.567 }).value?.estimated_cost)
      .toBe(450.57);
  });

  it('refuses a negative or oversized cost', () => {
    expect(parseStickyData('idea', { content: 'DJ', estimated_cost: -1 }).error).toMatch(/estimated_cost/);
    expect(
      parseStickyData('idea', { content: 'DJ', estimated_cost: MAX_ESTIMATED_COST + 1 }).error,
    ).toMatch(/estimated_cost/);
  });

  it('omits estimated_cost entirely when absent, rather than writing zero', () => {
    // "No estimate" and "free" are different planning statements.
    const parsed = parseStickyData('idea', { content: 'Playlist' });
    expect(parsed.value).not.toHaveProperty('estimated_cost');
  });

  it('refuses an invalid category inside the data blob', () => {
    expect(parseStickyData('idea', { content: 'x', category: 'nonsense' }).error).toMatch(/category/);
  });

  it('reports exactly one of value and error, never both', () => {
    const good = parseStickyData('note', { content: 'ok' });
    expect(good.error).toBeNull();
    expect(good.value).not.toBeNull();

    const bad = parseStickyData('note', { content: '' });
    expect(bad.value).toBeNull();
    expect(bad.error).not.toBeNull();
  });
});

describe('serialisation: what each viewer sees', () => {
  it('counts votes from the votes table, not from a column', () => {
    const dto = toStickyDTO(row({ votes: [{ user_id: 'u1' }, { user_id: 'u2' }] }), 'u3');
    expect(dto.data.votes).toBe(2);
    expect(dto.reaction_count).toBe(2);
  });

  it('resolves user_has_voted per viewer against the same row', () => {
    // The property a counter column structurally cannot provide, and the whole
    // reason partyboard_sticky_votes exists.
    const shared = row({ votes: [{ user_id: 'u1' }, { user_id: 'u2' }] });
    expect(toStickyDTO(shared, 'u1').data.user_has_voted).toBe(true);
    expect(toStickyDTO(shared, 'u3').data.user_has_voted).toBe(false);
  });

  it('shows the same total to both viewers', () => {
    const shared = row({ votes: [{ user_id: 'u1' }, { user_id: 'u2' }] });
    expect(toStickyDTO(shared, 'u1').data.votes).toBe(toStickyDTO(shared, 'u3').data.votes);
  });

  it('derives converted_to_task from the task row, not the stored blob', () => {
    // The blob still carries `converted_to_task: false` from creation. If the
    // DTO trusted it, a converted idea would render unconverted forever.
    const withTask = row({ task: { id: 'task-9', status: 'open' } });
    const dto = toStickyDTO(withTask, 'u1');
    expect(dto.data.converted_to_task).toBe(true);
    expect(dto.data.task_id).toBe('task-9');
    expect(dto.data.task_status).toBe('open');
  });

  it('strips a stale task_id when no task row exists', () => {
    const stale = row({ data: { content: 'x', converted_to_task: true, task_id: 'ghost' }, task: null });
    const dto = toStickyDTO(stale, 'u1');
    expect(dto.data.converted_to_task).toBe(false);
    expect(dto.data).not.toHaveProperty('task_id');
  });

  it('leaves note data alone: notes have no vote or task state', () => {
    const note = toStickyDTO(row({ type: 'note', data: { content: 'n', color: 'blue', font_size: 14 } }), 'u1');
    expect(note.data).not.toHaveProperty('votes');
    expect(note.data).not.toHaveProperty('user_has_voted');
    expect(note.data).not.toHaveProperty('converted_to_task');
  });

  it('emits the position and size shape the canvas reads', () => {
    // PartyBoardCanvas reads sticky.position.x and sticky.size.width directly
    // into inline styles. Flat position_x columns would render every sticky at
    // the origin.
    const dto = toStickyDTO(row({ position_x: 44, position_y: 55, width: 240, height: 160 }), 'u1');
    expect(dto.position).toEqual({ x: 44, y: 55 });
    expect(dto.size).toEqual({ width: 240, height: 160 });
  });

  it('serialises timestamps as ISO strings, since StickyItem types them as string', () => {
    const dto = toStickyDTO(row(), 'u1');
    expect(dto.created_at).toBe(NOW.toISOString());
    expect(typeof dto.updated_at).toBe('string');
  });

  it('omits rotation and category when the row has neither', () => {
    const dto = toStickyDTO(row({ rotation: null, category: null }), 'u1');
    expect(dto).not.toHaveProperty('rotation');
    expect(dto).not.toHaveProperty('category');
  });

  it('names an unknown creator rather than emitting null', () => {
    expect(toStickyDTO(row({ creator: null }), 'u1').created_by_name).toBe('Unknown');
    expect(toStickyDTO(row({ creator: { name: null } }), 'u1').created_by_name).toBe('Unknown');
  });

  it('survives a corrupt data blob without throwing', () => {
    // data is a Json column; a row written by an older code path could be
    // anything. A 500 on read would take the whole board down.
    expect(() => toStickyDTO(row({ data: null }), 'u1')).not.toThrow();
    expect(() => toStickyDTO(row({ data: 'a string' }), 'u1')).not.toThrow();
    expect(toStickyDTO(row({ data: ['x'] }), 'u1').data.votes).toBe(0);
  });

  it('does not mutate the row it was given', () => {
    const original = row({ votes: [{ user_id: 'u1' }] });
    const before = JSON.stringify(original.data);
    toStickyDTO(original, 'u1');
    expect(JSON.stringify(original.data)).toBe(before);
  });
});

describe('task derivation from a sticky', () => {
  it('takes the title from the idea text', () => {
    expect(taskTitleFrom({ content: '  Hire a DJ  ' })).toBe('Hire a DJ');
  });

  it('caps the title at the column length', () => {
    expect(taskTitleFrom({ content: 'x'.repeat(500) })).toHaveLength(200);
  });

  it('falls back rather than writing null into a NOT NULL column', () => {
    // partyboard_tasks.title is NOT NULL. A failed insert here surfaces as a
    // 500 on a button the user just pressed.
    expect(taskTitleFrom({})).toBe('Untitled task');
    expect(taskTitleFrom({ content: '   ' })).toBe('Untitled task');
    expect(taskTitleFrom(null)).toBe('Untitled task');
    expect(taskTitleFrom('not an object')).toBe('Untitled task');
  });

  it('carries a valid estimated cost across to the task', () => {
    expect(estimatedCostFrom({ estimated_cost: 450.5 })).toBe(450.5);
    expect(estimatedCostFrom({ estimated_cost: 450.567 })).toBe(450.57);
  });

  it('returns null, not zero, when there is no estimate', () => {
    expect(estimatedCostFrom({ content: 'x' })).toBeNull();
    expect(estimatedCostFrom({ estimated_cost: 'free' })).toBeNull();
    expect(estimatedCostFrom({ estimated_cost: Number.NaN })).toBeNull();
    expect(estimatedCostFrom(null)).toBeNull();
  });

  it('refuses a cost outside the column range', () => {
    expect(estimatedCostFrom({ estimated_cost: -5 })).toBeNull();
    expect(estimatedCostFrom({ estimated_cost: MAX_ESTIMATED_COST + 1 })).toBeNull();
  });
});
