// Express route: /api/polls
// Polls & voting (Prisma-based replacement for api/polls.ts and
// api/poll-actions.ts)

import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';
import { getEventAccess, isEventParticipant } from '../lib/event-access';

const router = Router();

// All poll routes require authentication
router.use(requireAuth);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface TransformedOption {
  id: string;
  text: string;
  description: string | null;
  votes: number;
  voters: string[];
  user_has_voted: boolean;
}

interface TransformedPoll {
  id: string;
  event_id: string;
  node_id: string | null;
  created_by: string;
  creator_name: string;
  question: string;
  poll_type: string;
  options: TransformedOption[];
  ends_at: Date | null;
  auto_close_on_consensus: boolean;
  consensus_threshold: number;
  status: string;
  total_votes: number;
  total_voters: number;
  created_at: Date;
  closed_at: Date | null;
}

/**
 * Transform a Prisma poll (with options, votes, creator) into the
 * response shape expected by the frontend.
 */
function transformPoll(
  poll: {
    id: string;
    event_id: string;
    node_id: string | null;
    created_by: string;
    question: string;
    poll_type: string;
    ends_at: Date | null;
    auto_close_on_consensus: boolean;
    consensus_threshold: number;
    status: string;
    created_at: Date;
    closed_at: Date | null;
    options: { id: string; text: string; description: string | null }[];
    votes: { id: string; user_id: string; option_id: string; voted_at: Date }[];
    creator: { name: string | null } | null;
  },
  userId: string,
): TransformedPoll {
  const optionsMap = new Map<string, { votes: number; voters: string[] }>();

  // Count votes per option (deduplicate voters per option)
  poll.votes?.forEach((vote) => {
    if (!optionsMap.has(vote.option_id)) {
      optionsMap.set(vote.option_id, { votes: 0, voters: [] });
    }
    const opt = optionsMap.get(vote.option_id)!;
    if (!opt.voters.includes(vote.user_id)) {
      opt.votes++;
      opt.voters.push(vote.user_id);
    }
  });

  const options: TransformedOption[] =
    poll.options?.map((opt) => {
      const voteData = optionsMap.get(opt.id) || { votes: 0, voters: [] };
      return {
        id: opt.id,
        text: opt.text,
        description: opt.description,
        votes: voteData.votes,
        voters: voteData.voters,
        user_has_voted: voteData.voters.includes(userId),
      };
    }) || [];

  const uniqueVoters = new Set(poll.votes?.map((v) => v.user_id) || []);

  return {
    id: poll.id,
    event_id: poll.event_id,
    node_id: poll.node_id,
    created_by: poll.created_by,
    creator_name: poll.creator?.name || 'Unknown',
    question: poll.question,
    poll_type: poll.poll_type,
    options,
    ends_at: poll.ends_at,
    auto_close_on_consensus: poll.auto_close_on_consensus,
    consensus_threshold: poll.consensus_threshold,
    status: poll.status,
    total_votes: poll.votes?.length || 0,
    total_voters: uniqueVoters.size,
    created_at: poll.created_at,
    closed_at: poll.closed_at,
  };
}

/**
 * Fetch a poll with all relations and transform it for the response.
 */
async function fetchAndTransformPoll(pollId: string, userId: string): Promise<TransformedPoll | null> {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: {
      options: true,
      votes: {
        select: { id: true, user_id: true, option_id: true, voted_at: true },
      },
      creator: {
        select: { name: true },
      },
    },
  });

  if (!poll) return null;
  return transformPoll(poll, userId);
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// GET /api/polls?eventId=xxx - Get all polls for an event
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { eventId } = req.query;

    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({ error: 'eventId query parameter is required' });
    }

    // RLS parity: polls are visible to event participants (host or guest).
    const access = await getEventAccess(eventId, userId, req.user?.email);
    if (!isEventParticipant(access)) {
      return res.status(403).json({ error: 'Only event participants can view polls' });
    }

    const polls = await prisma.poll.findMany({
      where: { event_id: eventId },
      include: {
        options: true,
        votes: {
          select: { id: true, user_id: true, option_id: true, voted_at: true },
        },
        creator: {
          select: { name: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const transformedPolls = polls.map((poll) => transformPoll(poll, userId));

    return res.status(200).json({ polls: transformedPolls });
  } catch (error: unknown) {
    console.error('Polls API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/polls - Create a new poll
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const {
      event_id,
      question,
      poll_type,
      options,
      ends_at,
      auto_close_on_consensus,
      consensus_threshold,
    } = req.body;

    if (!event_id || !question || !poll_type || !options || options.length < 2) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Grounded in the polls table CHECK constraints
    // (supabase/migrations/20251107_polls_feature.sql).
    const VALID_POLL_TYPES = ['single-choice', 'multiple-choice', 'ranking'];
    if (!VALID_POLL_TYPES.includes(poll_type)) {
      return res.status(400).json({
        error: `poll_type must be one of: ${VALID_POLL_TYPES.join(', ')}`,
      });
    }

    if (
      consensus_threshold !== undefined &&
      consensus_threshold !== null &&
      (typeof consensus_threshold !== 'number' ||
        consensus_threshold < 50 ||
        consensus_threshold > 100)
    ) {
      return res.status(400).json({ error: 'consensus_threshold must be between 50 and 100' });
    }

    // RLS parity ("Event participants can create polls"): host or guest.
    const access = await getEventAccess(event_id, userId, req.user?.email);
    if (!isEventParticipant(access)) {
      return res.status(403).json({ error: 'Only event participants can create polls' });
    }

    // Create poll with options in a transaction
    const poll = await prisma.$transaction(async (tx) => {
      const createdPoll = await tx.poll.create({
        data: {
          event_id,
          created_by: userId,
          question,
          poll_type,
          ends_at: ends_at || null,
          auto_close_on_consensus: auto_close_on_consensus || false,
          consensus_threshold: consensus_threshold || 70,
          status: 'active',
        },
      });

      const optionsData = options.map((opt: any) => ({
        poll_id: createdPoll.id,
        text: opt.text,
        description: opt.description || null,
      }));

      const createdOptions = await tx.pollOption.createManyAndReturn({
        data: optionsData,
      });

      return { poll: createdPoll, options: createdOptions };
    });

    // Get creator name
    const profile = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    // Return formatted poll
    const formattedPoll = {
      ...poll.poll,
      creator_name: profile?.name || 'Unknown',
      options: poll.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        description: opt.description,
        votes: 0,
        voters: [],
        user_has_voted: false,
      })),
      total_votes: 0,
      total_voters: 0,
    };

    return res.status(201).json({ poll: formattedPoll });
  } catch (error: unknown) {
    console.error('Polls API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/polls/:id - Get single poll with options and votes
router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Poll ID is required' });
    }

    // RLS parity: participants of the poll's event only.
    const pollRow = await prisma.poll.findUnique({
      where: { id },
      select: { event_id: true },
    });
    if (!pollRow) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    const access = await getEventAccess(pollRow.event_id, userId, req.user?.email);
    if (!isEventParticipant(access)) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    const transformedPoll = await fetchAndTransformPoll(id, userId);

    if (!transformedPoll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    return res.status(200).json({ poll: transformedPoll });
  } catch (error: unknown) {
    console.error('Polls API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/polls/:id/vote - Cast vote on a poll
router.post('/:id/vote', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id: pollId } = req.params;
    const { option_ids } = req.body;

    if (!option_ids || !Array.isArray(option_ids) || option_ids.length === 0) {
      return res.status(400).json({ error: 'option_ids array is required' });
    }

    // Get poll
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: true },
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // RLS parity ("Event participants can vote"): host or guest of the
    // poll's event. Checked BEFORE any poll-state responses so outsiders
    // learn nothing about the poll (row-invisibility semantics).
    const voteAccess = await getEventAccess(poll.event_id, userId, req.user?.email);
    if (!isEventParticipant(voteAccess)) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    if (poll.status !== 'active') {
      return res.status(400).json({ error: 'Poll is not active' });
    }

    // Enforce the poll deadline: ends_at is a business rule, not advisory.
    if (poll.ends_at && new Date(poll.ends_at) <= new Date()) {
      return res.status(400).json({ error: 'Poll has ended' });
    }

    // Every submitted option must belong to THIS poll — otherwise cross-poll
    // option ids create vote rows that inflate total_votes while appearing
    // under no option.
    const validOptionIds = new Set(poll.options.map((o) => o.id));
    const invalidIds = (option_ids as string[]).filter((id) => !validOptionIds.has(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        error: `Invalid option_ids for this poll: ${invalidIds.join(', ')}`,
      });
    }

    // Single-choice polls accept exactly one option
    // (poll_type CHECK: 'single-choice' | 'multiple-choice' | 'ranking').
    if (poll.poll_type === 'single-choice' && option_ids.length > 1) {
      return res.status(400).json({ error: 'This poll only allows one choice' });
    }

    // Remove existing votes by this user, then insert new votes
    await prisma.$transaction(async (tx) => {
      await tx.pollVote.deleteMany({
        where: {
          poll_id: pollId,
          user_id: userId,
        },
      });

      const votes = option_ids.map((optionId: string) => ({
        poll_id: pollId,
        user_id: userId,
        option_id: optionId,
      }));

      await tx.pollVote.createMany({
        data: votes,
      });
    });

    // Check for consensus if auto-close is enabled
    if (poll.auto_close_on_consensus) {
      const allVotes = await prisma.pollVote.findMany({
        where: { poll_id: pollId },
        select: { option_id: true, user_id: true },
      });

      if (allVotes.length > 0) {
        const uniqueVoters = new Set(allVotes.map((v) => v.user_id)).size;
        const optionCounts = new Map<string, number>();

        allVotes.forEach((vote) => {
          optionCounts.set(vote.option_id, (optionCounts.get(vote.option_id) || 0) + 1);
        });

        const maxVotes = Math.max(...Array.from(optionCounts.values()));
        const percentage = uniqueVoters > 0 ? (maxVotes / uniqueVoters) * 100 : 0;

        if (percentage >= poll.consensus_threshold) {
          await prisma.poll.update({
            where: { id: pollId },
            data: {
              status: 'consensus-reached',
              closed_at: new Date(),
            },
          });
        }
      }
    }

    // Fetch and return updated poll
    const transformedPoll = await fetchAndTransformPoll(pollId, userId);

    if (!transformedPoll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    return res.status(200).json({ poll: transformedPoll });
  } catch (error: unknown) {
    console.error('Polls API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/polls/:id/close - Close a poll
router.post('/:id/close', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id: pollId } = req.params;

    // Verify user is poll creator or event host
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        event: {
          select: { host_id: true },
        },
      },
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    const isCreator = poll.created_by === userId;
    const isHost = poll.event?.host_id === userId;

    if (!isCreator && !isHost) {
      return res.status(403).json({ error: 'Only poll creator or event host can close polls' });
    }

    // Close the poll
    await prisma.poll.update({
      where: { id: pollId },
      data: {
        status: 'closed',
        closed_at: new Date(),
      },
    });

    // Fetch and return updated poll
    const transformedPoll = await fetchAndTransformPoll(pollId, userId);

    if (!transformedPoll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    return res.status(200).json({ poll: transformedPoll });
  } catch (error: unknown) {
    console.error('Polls API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
