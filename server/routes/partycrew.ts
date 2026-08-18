// Express route: /api/partycrew
// PartyCrew social network operations (members, crewing-with, toggle, requests)
// Replaces Vercel serverless functions in api/partycrew/*.ts

import { Router } from 'express';
import type { Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import type { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// ---------------------------------------------------------------------------
// GET /api/partycrew/members - list crew members (followers of a creator)
// ---------------------------------------------------------------------------
router.get('/members', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const targetUserId = req.query.userId as string;
    const parsedLimit = parseInt((req.query.limit as string) || '20', 10);
    const limit = Math.min(Math.max(Number.isNaN(parsedLimit) ? 20 : parsedLimit, 1), 100);
    const parsedOffset = parseInt((req.query.offset as string) || '0', 10);
    const offset = Math.max(Number.isNaN(parsedOffset) ? 0 : parsedOffset, 0);

    if (!targetUserId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    // Check if profile exists and is accessible
    const targetProfile = await prisma.userProfile.findUnique({
      where: { id: targetUserId },
      select: { id: true, username: true, is_private: true, show_partycrew_list: true },
    });

    if (!targetProfile) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Privacy: two INDEPENDENT gates (the old conjunction leaked private
    // accounts' member lists whenever show_partycrew_list kept its default
    // `true`, and gave public accounts with the list hidden zero protection).
    if (targetUserId !== userId) {
      // Gate 1: hidden member list — owner only, regardless of privacy.
      if (!targetProfile.show_partycrew_list) {
        return res.status(403).json({
          error: 'This member list is hidden',
          message: 'The owner has hidden their PartyCrew list',
        });
      }

      // Gate 2: private account — followers only.
      if (targetProfile.is_private) {
        const isFollowing = await prisma.connection.findFirst({
          where: { follower_id: userId, following_id: targetUserId },
          select: { id: true },
        });

        if (!isFollowing) {
          return res.status(403).json({
            error: 'This account is private',
            message: 'Join their PartyCrew to see their members',
          });
        }
      }
    }

    // Get total count
    const totalCount = await prisma.connection.count({
      where: { following_id: targetUserId },
    });

    // Get members (followers) with their profile info
    const connections = await prisma.connection.findMany({
      where: { following_id: targetUserId },
      select: {
        follower_id: true,
        created_at: true,
        follower: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            bio: true,
            is_verified: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: limit,
    });

    // Check which members the current user is also following (mutual)
    const memberIds = connections.map((c) => c.follower_id);
    const mutualConnections = memberIds.length
      ? await prisma.connection.findMany({
          where: {
            follower_id: userId,
            following_id: { in: memberIds },
          },
          select: { following_id: true },
        })
      : [];

    const mutualSet = new Set(mutualConnections.map((c) => c.following_id));

    // Format response
    const members: Array<{
      id: string;
      username: string;
      display_name: string;
      avatar_url: string | null;
      bio: string | null;
      is_verified: boolean;
      is_mutual: boolean;
      followed_at: Date;
      mutual_crew_count?: number;
    }> = connections.map((conn) => ({
      id: conn.follower.id,
      username: conn.follower.username,
      display_name: conn.follower.display_name,
      avatar_url: conn.follower.avatar_url,
      bio: conn.follower.bio,
      is_verified: conn.follower.is_verified,
      is_mutual: mutualSet.has(conn.follower.id),
      followed_at: conn.created_at,
    }));

    // Optionally get mutual crew count for each member.
    // Computed in two queries (viewer's following set + one grouped count)
    // instead of the previous per-member `get_mutual_crew_count(::uuid)` RPC
    // loop — which was an N+1 AND type-incompatible with the prisma-pushed
    // TEXT id columns. Semantics match the SQL INTERSECT definition:
    // |following(viewer) ∩ following(member)|.
    if (req.query.include_mutual_count === 'true' && members.length > 0) {
      const viewerFollowing = await prisma.connection.findMany({
        where: { follower_id: userId },
        select: { following_id: true },
      });
      const viewerFollowingIds = viewerFollowing.map((c) => c.following_id);

      if (viewerFollowingIds.length > 0) {
        const grouped = await prisma.connection.groupBy({
          by: ['follower_id'],
          where: {
            follower_id: { in: members.map((m) => m.id) },
            following_id: { in: viewerFollowingIds },
          },
          _count: { following_id: true },
        });
        const countByMember = new Map(
          grouped.map((g) => [g.follower_id, g._count.following_id]),
        );
        members.forEach((m) => {
          m.mutual_crew_count = countByMember.get(m.id) || 0;
        });
      } else {
        members.forEach((m) => {
          m.mutual_crew_count = 0;
        });
      }
    }

    return res.status(200).json({
      members,
      total: totalCount,
      has_more: offset + limit < totalCount,
      limit,
      offset,
    });
  } catch (error: unknown) {
    console.error('[PartyCrew Members Error]:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ---------------------------------------------------------------------------
// GET /api/partycrew/crewing-with - list who a user is following
// ---------------------------------------------------------------------------
router.get('/crewing-with', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const targetUserId = req.query.userId as string;
    const parsedLimit = parseInt((req.query.limit as string) || '20', 10);
    const limit = Math.min(Math.max(Number.isNaN(parsedLimit) ? 20 : parsedLimit, 1), 100);
    const parsedOffset = parseInt((req.query.offset as string) || '0', 10);
    const offset = Math.max(Number.isNaN(parsedOffset) ? 0 : parsedOffset, 0);

    if (!targetUserId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    // Check if profile exists
    const targetProfile = await prisma.userProfile.findUnique({
      where: { id: targetUserId },
      select: { id: true, username: true, is_private: true },
    });

    if (!targetProfile) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Privacy check - can only see own following list or if profile is public
    if (targetUserId !== userId && targetProfile.is_private) {
      const isFollowing = await prisma.connection.findFirst({
        where: { follower_id: userId, following_id: targetUserId },
        select: { id: true },
      });

      if (!isFollowing) {
        return res.status(403).json({
          error: 'This account is private',
          message: "Join their PartyCrew to see who they're crewing with",
        });
      }
    }

    // Get total count
    const totalCount = await prisma.connection.count({
      where: { follower_id: targetUserId },
    });

    // Get following list (crewing with)
    const connections = await prisma.connection.findMany({
      where: { follower_id: targetUserId },
      select: {
        following_id: true,
        created_at: true,
        following: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            bio: true,
            is_verified: true,
            account_type: true,
            events_hosted: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: limit,
    });

    // Check which creators also follow the user back (mutual)
    const creatorIds = connections.map((c) => c.following_id);
    const mutualConnections = creatorIds.length
      ? await prisma.connection.findMany({
          where: {
            following_id: targetUserId,
            follower_id: { in: creatorIds },
          },
          select: { follower_id: true },
        })
      : [];

    const mutualSet = new Set(mutualConnections.map((c) => c.follower_id));

    // Format response
    const creators = connections.map((conn) => ({
      id: conn.following.id,
      username: conn.following.username,
      display_name: conn.following.display_name,
      avatar_url: conn.following.avatar_url,
      bio: conn.following.bio,
      is_verified: conn.following.is_verified,
      is_mutual: mutualSet.has(conn.following.id),
      account_type: conn.following.account_type,
      events_hosted: conn.following.events_hosted,
      followed_at: conn.created_at,
    }));

    return res.status(200).json({
      creators,
      total: totalCount,
      has_more: offset + limit < totalCount,
      limit,
      offset,
    });
  } catch (error: unknown) {
    console.error('[Crewing With Error]:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ---------------------------------------------------------------------------
// GET /api/partycrew/toggle - check connection status with a creator
// ---------------------------------------------------------------------------
router.get('/toggle', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const creatorId = req.query.creatorId as string;

    if (!creatorId) {
      return res.status(400).json({ error: 'Missing creatorId parameter' });
    }

    // Check if following
    const connection = await prisma.connection.findFirst({
      where: { follower_id: userId, following_id: creatorId },
      select: { id: true, created_at: true, notify_on_events: true, notify_on_posts: true },
    });

    // Check if pending request
    const pendingRequest = await prisma.connectionRequest.findFirst({
      where: {
        requester_id: userId,
        target_id: creatorId,
        status: 'pending',
      },
      select: { id: true, status: true, created_at: true },
    });

    // Check if mutual
    const mutualConnection = await prisma.connection.findFirst({
      where: { follower_id: creatorId, following_id: userId },
      select: { id: true },
    });

    return res.status(200).json({
      isFollowing: !!connection,
      isPending: !!pendingRequest,
      isMutual: !!connection && !!mutualConnection,
      connection: connection || null,
      request: pendingRequest || null,
    });
  } catch (error: unknown) {
    console.error('[PartyCrew Status Check Error]:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/partycrew/toggle - join or leave a creator's PartyCrew
// ---------------------------------------------------------------------------
router.post('/toggle', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { creatorId, action } = req.body;

    if (!creatorId) {
      return res.status(400).json({
        success: false,
        action: 'joined',
        message: 'Missing creatorId',
      });
    }

    // Can't follow yourself
    if (creatorId === userId) {
      return res.status(400).json({
        success: false,
        action: 'joined',
        message: 'Cannot join your own PartyCrew',
      });
    }

    // Check if user is blocked (either direction)
    const blockCheck = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blocker_id: creatorId, blocked_id: userId },
          { blocker_id: userId, blocked_id: creatorId },
        ],
      },
      select: { id: true },
    });

    if (blockCheck) {
      return res.status(403).json({
        success: false,
        action: 'joined',
        message: 'Cannot join PartyCrew due to block',
      });
    }

    // Get creator profile to check if private
    const creator = await prisma.userProfile.findUnique({
      where: { id: creatorId },
      select: { id: true, display_name: true, is_private: true, partycrew_count: true },
    });

    if (!creator) {
      return res.status(404).json({
        success: false,
        action: 'joined',
        message: 'Creator not found',
      });
    }

    // Check if already following
    const existingConnection = await prisma.connection.findFirst({
      where: { follower_id: userId, following_id: creatorId },
      select: { id: true },
    });

    const isFollowing = !!existingConnection;

    // Determine action if not explicitly provided
    const finalAction = action || (isFollowing ? 'leave' : 'join');

    // LEAVE PARTYCREW
    if (finalAction === 'leave') {
      if (!isFollowing) {
        return res.status(400).json({
          success: false,
          action: 'left',
          message: 'Not currently in this PartyCrew',
        });
      }

      await prisma.connection.deleteMany({
        where: { follower_id: userId, following_id: creatorId },
      });

      // Also delete any request rows so a future join starts clean
      // (rejected/cancelled rows are unique-key tombstones otherwise).
      await prisma.connectionRequest.deleteMany({
        where: { requester_id: userId, target_id: creatorId },
      });

      // Re-read the trigger-maintained count instead of doing ±1 arithmetic
      // on the pre-write value (stale under any concurrency).
      const freshProfile = await prisma.userProfile.findUnique({
        where: { id: creatorId },
        select: { partycrew_count: true },
      });

      return res.status(200).json({
        success: true,
        action: 'left',
        partycrew_count: freshProfile?.partycrew_count ?? 0,
        message: `Left ${creator.display_name}'s PartyCrew`,
      });
    }

    // JOIN PARTYCREW
    if (isFollowing) {
      return res.status(400).json({
        success: false,
        action: 'joined',
        message: 'Already in this PartyCrew',
      });
    }

    // Check for an existing request row of ANY status. Rejected/cancelled
    // rows persist under the (requester_id, target_id) unique key — a bare
    // create after one rejection used to throw P2002 → 500 forever.
    const existingRequest = await prisma.connectionRequest.findFirst({
      where: { requester_id: userId, target_id: creatorId },
      select: { id: true, status: true },
    });

    // PRIVATE ACCOUNT - Create (or revive) a request
    if (creator.is_private) {
      if (existingRequest?.status === 'pending') {
        return res.status(200).json({
          success: true,
          action: 'requested',
          message: `Request already pending for ${creator.display_name}'s PartyCrew`,
        });
      }

      // Upsert revives rejected/cancelled tombstones back to pending.
      await prisma.connectionRequest.upsert({
        where: {
          requester_id_target_id: { requester_id: userId, target_id: creatorId },
        },
        update: { status: 'pending', message: null },
        create: {
          requester_id: userId,
          target_id: creatorId,
          status: 'pending',
        },
      });

      // Create notification for creator
      await prisma.notification.create({
        data: {
          user_id: creatorId,
          type: 'connection_request',
          title: 'New PartyCrew Request',
          body: 'wants to join your PartyCrew',
          actor_id: userId,
          action_data: { request_type: 'partycrew_join' },
        },
      });

      return res.status(200).json({
        success: true,
        action: 'requested',
        message: `Request sent to ${creator.display_name}`,
      });
    }

    // PUBLIC ACCOUNT - Create connection immediately.
    // P2002 (concurrent double-join) is idempotent success, not a 500.
    let alreadyJoined = false;
    try {
      await prisma.connection.create({
        data: {
          follower_id: userId,
          following_id: creatorId,
        },
      });
    } catch (createError: unknown) {
      if (
        createError &&
        typeof createError === 'object' &&
        'code' in createError &&
        (createError as { code: string }).code === 'P2002'
      ) {
        alreadyJoined = true;
      } else {
        throw createError;
      }
    }

    // If a pending request predates the account going public, resolve it.
    if (existingRequest?.status === 'pending') {
      await prisma.connectionRequest.update({
        where: { id: existingRequest.id },
        data: { status: 'accepted' },
      });
    }

    if (!alreadyJoined) {
      // Create notification for creator
      await prisma.notification.create({
        data: {
          user_id: creatorId,
          type: 'new_partycrew_member',
          title: 'New PartyCrew Member! 🎉',
          body: 'joined your PartyCrew',
          actor_id: userId,
        },
      });
    }

    // Trigger-maintained count, re-read after the write.
    const freshCreator = await prisma.userProfile.findUnique({
      where: { id: creatorId },
      select: { partycrew_count: true },
    });

    return res.status(200).json({
      success: true,
      action: 'joined',
      partycrew_count: freshCreator?.partycrew_count ?? 0,
      message: alreadyJoined
        ? `Already in ${creator.display_name}'s PartyCrew`
        : `Joined ${creator.display_name}'s PartyCrew!`,
    });
  } catch (error: unknown) {
    console.error('[PartyCrew Toggle Error]:', error);
    return res.status(500).json({
      success: false,
      action: 'joined',
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ---------------------------------------------------------------------------
// GET /api/partycrew/requests - list pending requests (received or sent)
// ---------------------------------------------------------------------------
router.get('/requests', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const parsedLimit = parseInt((req.query.limit as string) || '20', 10);
    const limit = Math.min(Math.max(Number.isNaN(parsedLimit) ? 20 : parsedLimit, 1), 100);
    const parsedOffset = parseInt((req.query.offset as string) || '0', 10);
    const offset = Math.max(Number.isNaN(parsedOffset) ? 0 : parsedOffset, 0);
    const type = (req.query.type as string) || 'received';

    if (type !== 'received' && type !== 'sent') {
      return res.status(400).json({ error: "type must be 'received' or 'sent'" });
    }

    const where = {
      status: 'pending' as string,
      ...(type === 'received' ? { target_id: userId } : { requester_id: userId }),
    };

    const profileSelect = {
      id: true,
      username: true,
      display_name: true,
      avatar_url: true,
      is_verified: true,
      bio: true,
    } as const;

    const [requests, totalCount] = await Promise.all([
      prisma.connectionRequest.findMany({
        where,
        select: {
          id: true,
          message: true,
          created_at: true,
          requester_id: true,
          target_id: true,
          // For received requests the interesting party is the requester;
          // for sent requests it is the target (the previous version
          // returned N copies of the caller's own profile for type=sent).
          requester: { select: profileSelect },
          target: { select: profileSelect },
        },
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.connectionRequest.count({ where }),
    ]);

    const formattedRequests = requests.map((r) => {
      const counterpart = type === 'received' ? r.requester : r.target;
      return {
        id: r.id,
        // Kept under the `requester` key for backward compatibility with
        // existing clients; semantically it is "the other party".
        requester: {
          id: counterpart.id,
          username: counterpart.username,
          display_name: counterpart.display_name,
          avatar_url: counterpart.avatar_url,
          is_verified: counterpart.is_verified,
          bio: counterpart.bio,
        },
        message: r.message,
        created_at: r.created_at,
      };
    });

    return res.status(200).json({
      requests: formattedRequests,
      total: totalCount,
      has_more: offset + limit < totalCount,
    });
  } catch (error: unknown) {
    console.error('[Get Requests Error]:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/partycrew/requests - accept a connection request
// ---------------------------------------------------------------------------
router.post('/requests', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({ error: 'Missing requestId' });
    }

    // Get the request
    const request = await prisma.connectionRequest.findFirst({
      where: {
        id: requestId,
        target_id: userId,
        status: 'pending',
      },
      select: { id: true, requester_id: true, target_id: true, status: true },
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found or already processed' });
    }

    // Create the connection. P2002 means the connection already exists
    // (e.g. requester followed while the account was public) — that is an
    // acceptance, not an error: the request must still be marked accepted,
    // otherwise it stays pending in the inbox forever and every re-accept
    // fails the same way.
    try {
      await prisma.connection.create({
        data: {
          follower_id: request.requester_id,
          following_id: request.target_id,
        },
      });
    } catch (error) {
      const isDuplicate =
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code: string }).code === 'P2002';
      if (!isDuplicate) {
        console.error('[Create Connection Error]:', error);
        return res.status(500).json({ error: 'Failed to create connection' });
      }
    }

    // Update request status
    await prisma.connectionRequest.update({
      where: { id: requestId },
      data: { status: 'accepted' },
    });

    // Create notification for requester
    await prisma.notification.create({
      data: {
        user_id: request.requester_id,
        type: 'connection_request',
        title: 'Request Accepted! 🎉',
        body: 'accepted your PartyCrew request',
        actor_id: userId,
        action_data: { request_id: requestId },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Request accepted',
      request_id: requestId,
    });
  } catch (error: unknown) {
    console.error('[Accept Request Error]:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/partycrew/requests - reject/cancel a connection request
// ---------------------------------------------------------------------------
router.delete('/requests', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { requestId, reason } = req.body;

    if (!requestId) {
      return res.status(400).json({ error: 'Missing requestId' });
    }

    // Get the request (can be target rejecting or requester canceling)
    const request = await prisma.connectionRequest.findFirst({
      where: {
        id: requestId,
        status: 'pending',
        OR: [{ target_id: userId }, { requester_id: userId }],
      },
      select: { id: true, requester_id: true, target_id: true, status: true },
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found or already processed' });
    }

    const isRejection = request.target_id === userId;
    const newStatus = isRejection ? 'rejected' : 'cancelled';

    // Update request status
    await prisma.connectionRequest.update({
      where: { id: requestId },
      data: { status: newStatus },
    });

    // Optionally create notification if rejected (not cancelled).
    // NOTE: `reason` is the rejecter's private note — it is deliberately NOT
    // copied into the requester-visible notification payload.
    if (isRejection && reason) {
      await prisma.notification.create({
        data: {
          user_id: request.requester_id,
          type: 'connection_request',
          title: 'Request Not Accepted',
          body: 'Your PartyCrew request was not accepted',
          actor_id: userId,
          action_data: { request_id: requestId },
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: isRejection ? 'Request rejected' : 'Request cancelled',
      request_id: requestId,
      status: newStatus,
    });
  } catch (error: unknown) {
    console.error('[Reject Request Error]:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
