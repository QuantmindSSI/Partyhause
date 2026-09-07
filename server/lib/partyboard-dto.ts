/**
 * PartyBoard request validation and wire serialisation.
 *
 * WHY THIS EXISTS
 * ---------------
 * Two reasons, one structural and one practical.
 *
 * Structural: the canvas posts a free-form `data` blob whose shape depends on
 * the sticky type, and reads back a shape with fields the client must not be
 * able to set. `votes`, `user_has_voted` and `converted_to_task` are rendered
 * as facts by the UI but are derived from the votes and tasks tables. If the
 * route accepted them from the request body, a caller could mint their own
 * vote count. Keeping the projection in one function is what makes that
 * impossible to forget in a sixth route.
 *
 * Practical: server/routes/partyboard.ts binds an Express router and a Prisma
 * client at module load, which a jsdom test cannot do. These functions are
 * pure over plain values, so extracting them is the difference between the
 * validation rules being tested and being asserted about in prose.
 *
 * Contract source: src/features/partyboard/types/index.ts (StickyItem,
 * NoteStickyData, IdeaStickyData) and src/features/partyboard/constants.ts
 * (CATEGORIES, DEFAULT_STICKY_SIZE).
 */

/**
 * Sticky types this endpoint accepts.
 *
 * The client type union lists eight, but CreateStickyDialog only builds 'note'
 * and 'idea' and no other creator exists. Accepting the other six would store
 * shapes no component can render, which is a 201 that produces an invisible
 * sticky.
 */
export const STICKY_TYPES = new Set(['note', 'idea']);

/** Mirrors CATEGORIES in src/features/partyboard/constants.ts, minus the 'all' filter tab. */
export const CATEGORIES = new Set(['venue', 'entertainment', 'food', 'activities', 'decor', 'other']);

/** Canvas bounds. Beyond these a sticky is unreachable by pan and zoom. */
export const POSITION_MIN = -20_000;
export const POSITION_MAX = 20_000;
export const SIZE_MIN = 40;
export const SIZE_MAX = 2_000;

/** Matches DEFAULT_STICKY_SIZE in src/features/partyboard/constants.ts. */
export const DEFAULT_SIZE = { width: 200, height: 200 };

/** Where a sticky lands when the client sends no position. */
export const DEFAULT_POSITION = { x: 100, y: 100 };

/** Longest sticky body accepted. NoteSticky and IdeaSticky clamp display at ~5 lines. */
export const MAX_CONTENT_LENGTH = 2_000;

/** Upper bound on one board, so a single event cannot exhaust the table. */
export const MAX_STICKIES_PER_EVENT = 500;

/** Longest task title, matching the slice applied on conversion. */
export const MAX_TASK_TITLE_LENGTH = 200;

/** Highest estimated_cost accepted, matching the Decimal(10,2) column. */
export const MAX_ESTIMATED_COST = 99_999_999.99;

export interface Vec2 {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

/**
 * Coerce an unknown value to an integer inside [min, max].
 *
 * @returns the rounded integer, or null when the value is not a finite number
 *          or falls outside the range.
 *
 * Returns null rather than clamping. A clamped position places a sticky
 * somewhere the user did not put it, and a 201 that silently relocates
 * someone's note is worse than a 400 that says why.
 */
export function toBoundedInt(value: unknown, min: number, max: number): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const rounded = Math.round(value);
  if (rounded < min || rounded > max) return null;
  return rounded;
}

/** Parse a `{ x, y }` position. @returns null if malformed or out of bounds. */
export function parsePosition(raw: unknown): Vec2 | null {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as Record<string, unknown>;
  const x = toBoundedInt(candidate.x, POSITION_MIN, POSITION_MAX);
  const y = toBoundedInt(candidate.y, POSITION_MIN, POSITION_MAX);
  if (x === null || y === null) return null;
  return { x, y };
}

/**
 * Parse a `{ width, height }` size.
 *
 * Absent size is the canvas default, since the dialog omits it for quick
 * creates. Present but malformed is null, i.e. a client bug worth a 400.
 */
export function parseSize(raw: unknown): Size | null {
  if (raw === undefined || raw === null) return { ...DEFAULT_SIZE };
  if (typeof raw !== 'object') return null;
  const candidate = raw as Record<string, unknown>;
  const width = toBoundedInt(candidate.width, SIZE_MIN, SIZE_MAX);
  const height = toBoundedInt(candidate.height, SIZE_MIN, SIZE_MAX);
  if (width === null || height === null) return null;
  return { width, height };
}

/**
 * Parse an optional category.
 *
 * @returns `undefined` when absent (a category is optional), `null` when
 *          present and not a member of CATEGORIES, otherwise the value.
 *
 * 'all' is a filter tab in the UI and is deliberately not accepted: a sticky
 * categorised 'all' would render under every filter including its own.
 */
export function parseCategory(raw: unknown): string | null | undefined {
  if (raw === undefined || raw === null || raw === '') return undefined;
  if (typeof raw !== 'string') return null;
  if (!CATEGORIES.has(raw)) return null;
  return raw;
}

/**
 * Result of parsing a request fragment.
 *
 * A flat object with both fields always present, rather than a discriminated
 * union on an `ok` flag. tsconfig.server.json sets `strict: false`, which
 * disables `strictNullChecks`, and without it TypeScript does not narrow a
 * union by a boolean literal discriminant. The union compiled and then every
 * access to the failure branch was an error.
 *
 * Exactly one of `value` and `error` is non-null.
 */
export interface ParsedData {
  value: Record<string, unknown> | null;
  error: string | null;
}

/**
 * Parse and normalise the type-specific `data` blob for a new sticky.
 *
 * @param type - 'note' or 'idea'; callers must validate membership of
 *               STICKY_TYPES first
 * @param raw  - the request's `data` property, entirely untrusted
 * @returns the storable blob, or the specific field that failed
 *
 * Derived fields are never taken from the request. `votes`, `user_has_voted`
 * and `reactions` are computed from partyboard_sticky_votes at read time, and
 * `converted_to_task` from the presence of a partyboard_tasks row, so a body
 * carrying them is silently stripped rather than trusted.
 *
 * Complexity: O(n) in content length.
 */
export function parseStickyData(type: string, raw: unknown): ParsedData {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { value: null, error: 'data object is required' };
  }
  const candidate = raw as Record<string, unknown>;

  const content = candidate.content;
  if (typeof content !== 'string' || content.trim().length === 0) {
    return { value: null, error: 'data.content must be a non-empty string' };
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    return { value: null, error: `data.content must be at most ${MAX_CONTENT_LENGTH} characters` };
  }

  if (type === 'note') {
    const color = typeof candidate.color === 'string' ? candidate.color : 'yellow';
    const fontSize = toBoundedInt(candidate.font_size, 8, 72) ?? 14;
    return { value: { content: content.trim(), color, font_size: fontSize }, error: null };
  }

  let estimatedCost: number | undefined;
  if (candidate.estimated_cost !== undefined && candidate.estimated_cost !== null) {
    const cost = candidate.estimated_cost;
    if (typeof cost !== 'number' || !Number.isFinite(cost) || cost < 0 || cost > MAX_ESTIMATED_COST) {
      return {
        value: null,
        error: `data.estimated_cost must be a number between 0 and ${MAX_ESTIMATED_COST}`,
      };
    }
    estimatedCost = Math.round(cost * 100) / 100;
  }

  const ideaCategory = parseCategory(candidate.category);
  if (ideaCategory === null) {
    return { value: null, error: `data.category must be one of: ${[...CATEGORIES].join(', ')}` };
  }

  const value: Record<string, unknown> = { content: content.trim(), converted_to_task: false };
  if (ideaCategory !== undefined) value.category = ideaCategory;
  if (estimatedCost !== undefined) value.estimated_cost = estimatedCost;

  return { value, error: null };
}

/**
 * The subset of a joined sticky row this module reads.
 *
 * Declared structurally rather than as a Prisma payload type so the test suite
 * can build one without a generated client or a database.
 */
export interface StickyRowLike {
  id: string;
  event_id: string;
  session_id: string | null;
  type: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  rotation: number | null;
  z_index: number;
  category: string | null;
  data: unknown;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  votes: { user_id: string }[];
  creator: { name: string | null } | null;
  task: { id: string; status: string } | null;
}

/** The `StickyItem` contract in src/features/partyboard/types/index.ts. */
export interface StickyDTO {
  id: string;
  session_id: string | null;
  event_id: string;
  type: string;
  position: Vec2;
  size: Size;
  rotation?: number;
  z_index: number;
  category?: string;
  reaction_count: number;
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  data: Record<string, unknown>;
}

/**
 * Project a sticky row into the client contract for one viewer.
 *
 * @param row      - the sticky joined with its votes, creator and task
 * @param viewerId - the authenticated caller, whose own vote state is resolved
 * @returns a StickyItem the canvas can render directly
 *
 * Vote state is computed here rather than stored on the row: `votes` is the
 * row count and `user_has_voted` is membership of `viewerId` in that set, so
 * two people looking at the same sticky see the same total and their own
 * state. A counter column could not answer the second question at all, which
 * is why the votes table exists.
 *
 * Complexity: O(v) in the sticky's vote count.
 */
export function toStickyDTO(row: StickyRowLike, viewerId: string): StickyDTO {
  const data: Record<string, unknown> =
    row.data && typeof row.data === 'object' && !Array.isArray(row.data)
      ? { ...(row.data as Record<string, unknown>) }
      : {};

  const voteCount = row.votes.length;

  if (row.type === 'idea') {
    data.votes = voteCount;
    data.user_has_voted = row.votes.some((vote) => vote.user_id === viewerId);
    data.reactions = voteCount;
    data.converted_to_task = row.task !== null;
    if (row.task) {
      data.task_id = row.task.id;
      data.task_status = row.task.status;
    } else {
      delete data.task_id;
      delete data.task_status;
    }
  }

  const dto: StickyDTO = {
    id: row.id,
    session_id: row.session_id,
    event_id: row.event_id,
    type: row.type,
    position: { x: row.position_x, y: row.position_y },
    size: { width: row.width, height: row.height },
    z_index: row.z_index,
    reaction_count: voteCount,
    created_by: row.created_by,
    created_by_name: row.creator?.name || 'Unknown',
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
    data,
  };

  if (row.rotation !== null && row.rotation !== undefined) dto.rotation = row.rotation;
  if (row.category !== null && row.category !== undefined) dto.category = row.category;

  return dto;
}

/**
 * Derive a task title from a sticky's stored data.
 *
 * @returns the trimmed content capped at MAX_TASK_TITLE_LENGTH, or a stable
 *          fallback when the blob carries no usable content.
 *
 * The fallback matters: partyboard_tasks.title is NOT NULL, and a row written
 * from a malformed blob would otherwise fail the insert and surface as a 500
 * on a button the user just pressed.
 */
export function taskTitleFrom(data: unknown): string {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return 'Untitled task';
  const content = (data as Record<string, unknown>).content;
  if (typeof content !== 'string') return 'Untitled task';
  const trimmed = content.trim();
  return trimmed.length > 0 ? trimmed.slice(0, MAX_TASK_TITLE_LENGTH) : 'Untitled task';
}

/**
 * Read an estimated cost out of a sticky's stored data.
 *
 * @returns the cost rounded to two decimal places, or null when absent or
 *          unusable. Null is correct rather than zero: "no estimate" and "free"
 *          are different planning statements.
 */
export function estimatedCostFrom(data: unknown): number | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const cost = (data as Record<string, unknown>).estimated_cost;
  if (typeof cost !== 'number' || !Number.isFinite(cost)) return null;
  if (cost < 0 || cost > MAX_ESTIMATED_COST) return null;
  return Math.round(cost * 100) / 100;
}

export default {
  STICKY_TYPES,
  CATEGORIES,
  parsePosition,
  parseSize,
  parseCategory,
  parseStickyData,
  toStickyDTO,
  taskTitleFrom,
  estimatedCostFrom,
};
