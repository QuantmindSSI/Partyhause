// Express route: /api/partyboard
//
// Storage for the collaborative planning canvas at src/features/partyboard.
//
// The canvas has been mounted in EventManagement.tsx since it was written and
// every one of its seven fetches targeted this path, which did not exist. Each
// call fell through to the SPA catch-all and returned 404, so a sticky survived
// only until the ten-second auto-refresh replaced local state with the empty
// server response. This file is the missing half.
//
// Authorization is the same rule polls use: event participants (host, co-host,
// or a guest who accepted) may read and write the board. Deleting a sticky is
// narrower: its author, or someone who can moderate the event.

import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';
import {
  getEventAccess,
  isEventParticipant,
  canModerate,
  type EventAccess,
} from '../lib/event-access';
import { broadcastEvent } from '../lib/pubsub';
import {
  STICKY_TYPES,
  CATEGORIES,
  POSITION_MAX,
  SIZE_MIN,
  SIZE_MAX,
  DEFAULT_POSITION,
  MAX_STICKIES_PER_EVENT,
  parsePosition,
  parseSize,
  parseCategory,
  parseStickyData,
  toBoundedInt,
  toStickyDTO,
  taskTitleFrom,
  estimatedCostFrom,
} from '../lib/partyboard-dto';

const router = Router();

router.use(requireAuth);

/**
 * The joins every sticky read needs.
 *
 * Declared through `Prisma.validator` rather than an `as const` object literal:
 * `as const` marks the nested selects readonly, which stops Prisma's
 * `GetPayload` conditional types from matching, and every query silently came
 * back typed as the bare row without `votes`, `creator` or `task`.
 */
const STICKY_ARGS = Prisma.validator<Prisma.PartyBoardStickyDefaultArgs>()({
  include: {
    votes: { select: { user_id: true } },
    creator: { select: { name: true } },
    task: { select: { id: true, status: true } },
  },
});

/** Shape of a sticky row joined with its votes, creator and task. */
type StickyRow = Prisma.PartyBoardStickyGetPayload<typeof STICKY_ARGS>;

/**
 * Result of loading a sticky and resolving the caller's access to its event.
 *
 * Flat rather than a discriminated union, for the reason given on `ParsedData`.
 * `sticky` is non-null exactly when `error` is null.
 *
 * Both failure modes answer 404 rather than 403. A sticky that does not exist
 * and a sticky on a board the caller cannot see must be indistinguishable,
 * otherwise the status code leaks which private boards hold which ids.
 */
interface StickyLookup {
  sticky: StickyRow | null;
  access: EventAccess | null;
  error: string | null;
}

const NOT_FOUND: StickyLookup = { sticky: null, access: null, error: 'Sticky not found' };

async function loadSticky(
  stickyId: string,
  userId: string,
  userEmail: string | undefined,
): Promise<StickyLookup> {
  const sticky = await prisma.partyBoardSticky.findUnique({
    where: { id: stickyId },
    include: STICKY_ARGS.include,
  });

  if (!sticky) return NOT_FOUND;

  const access = await getEventAccess(sticky.event_id, userId, userEmail);
  if (!isEventParticipant(access)) return NOT_FOUND;

  return { sticky, access, error: null };
}

/** Notify other clients that a board changed. Never allowed to fail a request. */
function announce(eventId: string): void {
  broadcastEvent('partyhause', 'partyboard-updated', { eventId }).catch((error: unknown) => {
    console.error('[partyboard] broadcast failed:', error);
  });
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// GET /api/partyboard/stickies?event_id=xxx[&session_id=yyy]
router.get('/stickies', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const eventId = req.query.event_id;
    const sessionId = req.query.session_id;

    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({ error: 'event_id query parameter is required' });
    }
    if (sessionId !== undefined && typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'session_id must be a string' });
    }

    const access = await getEventAccess(eventId, userId, req.user?.email);
    if (!isEventParticipant(access)) {
      return res.status(403).json({ error: 'Only event participants can view the board' });
    }

    const sessionFilter: string | undefined = typeof sessionId === 'string' ? sessionId : undefined;

    const stickies = await prisma.partyBoardSticky.findMany({
      where: {
        event_id: eventId,
        ...(sessionFilter ? { session_id: sessionFilter } : {}),
      },
      include: STICKY_ARGS.include,
      orderBy: { created_at: 'asc' },
      take: MAX_STICKIES_PER_EVENT,
    });

    return res.status(200).json({
      stickies: stickies.map((sticky) => toStickyDTO(sticky, userId)),
    });
  } catch (error: unknown) {
    console.error('PartyBoard API error (list):', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/partyboard/stickies
router.post('/stickies', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { event_id, session_id, type, position, size, category, data, rotation, z_index } =
      req.body ?? {};

    if (!event_id || typeof event_id !== 'string') {
      return res.status(400).json({ error: 'event_id is required' });
    }
    if (typeof type !== 'string' || !STICKY_TYPES.has(type)) {
      return res.status(400).json({ error: `type must be one of: ${[...STICKY_TYPES].join(', ')}` });
    }
    if (session_id !== undefined && session_id !== null && typeof session_id !== 'string') {
      return res.status(400).json({ error: 'session_id must be a string' });
    }

    // Absent position means "drop it at the default spot"; present but
    // malformed is a client bug and must not be silently defaulted, or a
    // sticky lands somewhere the user did not put it.
    const positionOmitted = position === undefined || position === null;
    const parsedPosition = positionOmitted ? DEFAULT_POSITION : parsePosition(position);
    if (parsedPosition === null) {
      return res
        .status(400)
        .json({ error: `position.x and position.y must be numbers within ±${POSITION_MAX}` });
    }

    const parsedSize = parseSize(size);
    if (parsedSize === null) {
      return res
        .status(400)
        .json({ error: `size.width and size.height must be numbers between ${SIZE_MIN} and ${SIZE_MAX}` });
    }

    const parsedCategory = parseCategory(category);
    if (parsedCategory === null) {
      return res.status(400).json({ error: `category must be one of: ${[...CATEGORIES].join(', ')}` });
    }

    const parsedData = parseStickyData(type, data);
    if (parsedData.error !== null) {
      return res.status(400).json({ error: parsedData.error });
    }

    const parsedRotation =
      rotation === undefined || rotation === null ? null : toBoundedInt(rotation, -180, 180);
    if (rotation !== undefined && rotation !== null && parsedRotation === null) {
      return res.status(400).json({ error: 'rotation must be a number between -180 and 180' });
    }

    const parsedZIndex = z_index === undefined || z_index === null ? null : toBoundedInt(z_index, 0, 10_000);
    if (z_index !== undefined && z_index !== null && parsedZIndex === null) {
      return res.status(400).json({ error: 'z_index must be a number between 0 and 10000' });
    }

    const access = await getEventAccess(event_id, userId, req.user?.email);
    if (!isEventParticipant(access)) {
      return res.status(403).json({ error: 'Only event participants can add to the board' });
    }

    // Bound the board. Without this one event can grow without limit, and the
    // canvas renders every sticky it is given.
    const existing = await prisma.partyBoardSticky.count({ where: { event_id } });
    if (existing >= MAX_STICKIES_PER_EVENT) {
      return res
        .status(409)
        .json({ error: `This board has reached its limit of ${MAX_STICKIES_PER_EVENT} stickies` });
    }

    const sticky = await prisma.partyBoardSticky.create({
      data: {
        event_id,
        session_id: session_id ?? null,
        type,
        position_x: parsedPosition.x,
        position_y: parsedPosition.y,
        width: parsedSize.width,
        height: parsedSize.height,
        rotation: parsedRotation,
        // New stickies land on top. `existing` is the current count, which is
        // monotonic per board and needs no extra query.
        z_index: parsedZIndex ?? existing,
        category: parsedCategory ?? null,
        // parseStickyData returns a plain record; Prisma's InputJsonValue is a
        // structurally narrower type that a Record<string, unknown> cannot
        // satisfy without an assertion. The value is validated field by field
        // above, so the assertion narrows rather than assumes.
        data: parsedData.value as Prisma.InputJsonValue,
        created_by: userId,
      },
      include: STICKY_ARGS.include,
    });

    announce(event_id);
    return res.status(201).json({ sticky: toStickyDTO(sticky, userId) });
  } catch (error: unknown) {
    console.error('PartyBoard API error (create):', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/partyboard/stickies/:id/position
router.patch('/stickies/:id/position', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const parsedPosition = parsePosition(req.body?.position);
    if (parsedPosition === null) {
      return res
        .status(400)
        .json({ error: `position.x and position.y must be numbers within ±${POSITION_MAX}` });
    }

    const lookup = await loadSticky(id, userId, req.user?.email);
    if (lookup.error !== null) {
      return res.status(404).json({ error: lookup.error });
    }

    const updated = await prisma.partyBoardSticky.update({
      where: { id },
      data: { position_x: parsedPosition.x, position_y: parsedPosition.y },
      include: STICKY_ARGS.include,
    });

    announce(updated.event_id);
    return res.status(200).json({ sticky: toStickyDTO(updated, userId) });
  } catch (error: unknown) {
    console.error('PartyBoard API error (position):', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/partyboard/stickies/:id/vote: toggle the caller's vote
router.patch('/stickies/:id/vote', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const lookup = await loadSticky(id, userId, req.user?.email);
    if (lookup.error !== null) {
      return res.status(404).json({ error: lookup.error });
    }

    if (lookup.sticky.type !== 'idea') {
      return res.status(400).json({ error: 'Only idea stickies can be voted on' });
    }

    // Toggle, not increment. The canvas renders a filled heart when
    // user_has_voted, so the same button both casts and withdraws. The unique
    // (sticky_id, user_id) constraint makes a concurrent double-click collapse
    // to one row rather than two.
    const alreadyVoted = lookup.sticky.votes.some((vote) => vote.user_id === userId);

    if (alreadyVoted) {
      await prisma.partyBoardStickyVote.deleteMany({
        where: { sticky_id: id, user_id: userId },
      });
    } else {
      try {
        await prisma.partyBoardStickyVote.create({
          data: { sticky_id: id, user_id: userId },
        });
      } catch (error: unknown) {
        // P2002 is the unique constraint: another request for the same user
        // landed first. The desired end state is already true.
        const isDuplicate =
          error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
        if (!isDuplicate) throw error;
      }
    }

    const votes = await prisma.partyBoardStickyVote.count({ where: { sticky_id: id } });

    announce(lookup.sticky.event_id);
    return res.status(200).json({ votes, user_has_voted: !alreadyVoted });
  } catch (error: unknown) {
    console.error('PartyBoard API error (vote):', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/partyboard/stickies/:id/convert-to-task
router.post('/stickies/:id/convert-to-task', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const lookup = await loadSticky(id, userId, req.user?.email);
    if (lookup.error !== null) {
      return res.status(404).json({ error: lookup.error });
    }

    const { sticky, access } = lookup;

    if (sticky.type !== 'idea') {
      return res.status(400).json({ error: 'Only idea stickies can become tasks' });
    }

    // Promoting an idea to committed work is a planning decision, so it is
    // scoped to whoever runs the event or raised the idea, not to every guest.
    const isAuthor = sticky.created_by === userId;
    if (!isAuthor && !canModerate(access)) {
      return res
        .status(403)
        .json({ error: 'Only the idea author, the host or a moderating co-host can convert it' });
    }

    // Idempotent: the unique sticky_id means a second click returns the first
    // task instead of failing or creating a duplicate.
    if (sticky.task) {
      return res.status(200).json({ task_id: sticky.task.id, status: sticky.task.status });
    }

    const title = taskTitleFrom(sticky.data);
    const cost = estimatedCostFrom(sticky.data);
    const estimatedCost = cost === null ? null : new Prisma.Decimal(cost.toFixed(2));

    const task = await prisma.partyBoardTask.create({
      data: {
        event_id: sticky.event_id,
        sticky_id: sticky.id,
        title,
        estimated_cost: estimatedCost,
        status: 'open',
        created_by: userId,
      },
    });

    announce(sticky.event_id);
    return res.status(201).json({ task_id: task.id, status: task.status });
  } catch (error: unknown) {
    // A race on the unique sticky_id: the other request won, so read its row.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const existing = await prisma.partyBoardTask.findUnique({
        where: { sticky_id: req.params.id },
        select: { id: true, status: true },
      });
      if (existing) {
        return res.status(200).json({ task_id: existing.id, status: existing.status });
      }
    }
    console.error('PartyBoard API error (convert):', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/partyboard/tasks?event_id=xxx
//
// Without this, convert-to-task writes to a table nothing reads, which is the
// same defect as the missing router in miniature.
router.get('/tasks', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const eventId = req.query.event_id;

    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({ error: 'event_id query parameter is required' });
    }

    const access = await getEventAccess(eventId, userId, req.user?.email);
    if (!isEventParticipant(access)) {
      return res.status(403).json({ error: 'Only event participants can view board tasks' });
    }

    const tasks = await prisma.partyBoardTask.findMany({
      where: { event_id: eventId },
      include: { creator: { select: { name: true } } },
      orderBy: { created_at: 'asc' },
      take: MAX_STICKIES_PER_EVENT,
    });

    return res.status(200).json({
      tasks: tasks.map((task) => ({
        id: task.id,
        event_id: task.event_id,
        sticky_id: task.sticky_id,
        title: task.title,
        estimated_cost: task.estimated_cost === null ? null : Number(task.estimated_cost),
        status: task.status,
        created_by: task.created_by,
        created_by_name: task.creator?.name || 'Unknown',
        created_at: task.created_at.toISOString(),
        completed_at: task.completed_at === null ? null : task.completed_at.toISOString(),
      })),
    });
  } catch (error: unknown) {
    console.error('PartyBoard API error (tasks):', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/partyboard/stickies/:id
router.delete('/stickies/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const lookup = await loadSticky(id, userId, req.user?.email);
    if (lookup.error !== null) {
      return res.status(404).json({ error: lookup.error });
    }

    const { sticky, access } = lookup;

    // Narrower than write: a participant may add to the board, but only the
    // author or a moderator may remove someone else's contribution.
    const isAuthor = sticky.created_by === userId;
    if (!isAuthor && !canModerate(access)) {
      return res
        .status(403)
        .json({ error: 'Only the author, the host or a moderating co-host can delete a sticky' });
    }

    // The schema declares no ON DELETE behaviour, matching the rest of this
    // codebase, so dependants are removed explicitly. One transaction, because
    // a sticky deleted with its votes still present would orphan those rows.
    await prisma.$transaction([
      prisma.partyBoardTask.deleteMany({ where: { sticky_id: id } }),
      prisma.partyBoardStickyVote.deleteMany({ where: { sticky_id: id } }),
      prisma.partyBoardSticky.delete({ where: { id } }),
    ]);

    announce(sticky.event_id);
    return res.status(200).json({ success: true, id });
  } catch (error: unknown) {
    console.error('PartyBoard API error (delete):', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
