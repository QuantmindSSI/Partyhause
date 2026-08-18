// Express route: /api/users
// User profile and suggested creators endpoints
// Replaces Vercel serverless functions api/users/[id].ts and api/users/suggested.ts

import { Router } from 'express';
import type { Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, optionalAuth } from '../middleware/auth';
import type { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// ---------------------------------------------------------------------------
// GET /api/users/suggested - get suggested creators to follow
// NOTE: Must be defined before /:id to avoid route shadowing.
// ---------------------------------------------------------------------------
router.get('/suggested', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const parsedLimit = parseInt((req.query.limit as string) || '10', 10);
    const limit = Math.min(Math.max(Number.isNaN(parsedLimit) ? 10 : parsedLimit, 1), 50);

    // Get user's profile
    const userProfile = await prisma.userProfile.findUnique({
      where: { id: userId },
      select: { location: true },
    });

    // Get users already following, blocked (either direction), and users
    // with a pending outgoing request — none should be suggested.
    const [following, blocks, pendingRequests] = await Promise.all([
      prisma.connection.findMany({
        where: { follower_id: userId },
        select: { following_id: true },
      }),
      prisma.userBlock.findMany({
        where: { OR: [{ blocker_id: userId }, { blocked_id: userId }] },
        select: { blocker_id: true, blocked_id: true },
      }),
      prisma.connectionRequest.findMany({
        where: { requester_id: userId, status: 'pending' },
        select: { target_id: true },
      }),
    ]);

    const followingIds = following.map((f) => f.following_id);
    const blockedIds = blocks.flatMap((b) =>
      [b.blocker_id, b.blocked_id].filter((id) => id !== userId),
    );
    const pendingTargetIds = pendingRequests.map((r) => r.target_id);
    const excludeIds = [
      ...new Set([...followingIds, ...blockedIds, ...pendingTargetIds, userId]),
    ];

    // STRATEGY 1: Users with mutual connections
    // Find users followed by the people I follow (friends-of-friends)
    const mutualCrewSuggestions: Map<
      string,
      {
        id: string;
        username: string;
        display_name: string;
        avatar_url: string | null;
        bio: string | null;
        is_verified: boolean;
        account_type: string;
        partycrew_count: number;
        events_hosted: number;
        haus_score: number;
        reason: string;
        mutual_crew_count: number;
        same_location: boolean;
      }
    > = new Map();

    if (followingIds.length > 0) {
      // Friends-of-friends, aggregated in ONE grouped query: candidates are
      // ranked by how many of MY follows also follow them. (The previous
      // version took 20 arbitrary connection ROWS with no orderBy — heap
      // order, nondeterministic — then ran a per-candidate RPC that was
      // type-incompatible with the prisma-pushed TEXT id columns.)
      const grouped = await prisma.connection.groupBy({
        by: ['following_id'],
        where: {
          follower_id: { in: followingIds },
          following_id: { notIn: excludeIds },
        },
        _count: { following_id: true },
        orderBy: { _count: { following_id: 'desc' } },
        take: 20,
      });

      const candidateIds = grouped.map((g) => g.following_id);
      const countByCandidate = new Map(
        grouped.map((g) => [g.following_id, g._count.following_id]),
      );

      const candidateProfiles = candidateIds.length
        ? await prisma.userProfile.findMany({
            where: { id: { in: candidateIds }, is_private: false },
            select: {
              id: true,
              username: true,
              display_name: true,
              avatar_url: true,
              bio: true,
              is_verified: true,
              account_type: true,
              partycrew_count: true,
              events_hosted: true,
              haus_score: true,
              location: true,
            },
          })
        : [];

      for (const profile of candidateProfiles) {
        // "Followed by K of the people I follow" — the shared-third-party
        // INTERSECT definition of mutual crew.
        const mutualCount = countByCandidate.get(profile.id) || 0;
        mutualCrewSuggestions.set(profile.id, {
          id: profile.id,
          username: profile.username,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          is_verified: profile.is_verified,
          account_type: profile.account_type,
          partycrew_count: profile.partycrew_count,
          events_hosted: profile.events_hosted,
          haus_score: profile.haus_score,
          reason: `${mutualCount} mutual PartyCrew member${mutualCount === 1 ? '' : 's'}`,
          mutual_crew_count: mutualCount,
          same_location: userProfile?.location === profile.location && !!profile.location,
        });
      }
    }

    const mutualSuggestions = Array.from(mutualCrewSuggestions.values()).sort(
      (a, b) => b.mutual_crew_count - a.mutual_crew_count,
    );

    // STRATEGY 2: Popular creators in same location
    const locationSuggestions: typeof mutualSuggestions = [];

    if (userProfile?.location && mutualSuggestions.length < limit) {
      const alreadySuggestedIds = [
        ...excludeIds,
        ...mutualSuggestions.map((s) => s.id),
      ];

      const locationCreators = await prisma.userProfile.findMany({
        where: {
          location: userProfile.location,
          id: { notIn: alreadySuggestedIds },
          is_private: false,
          events_hosted: { gte: 1 },
        },
        orderBy: { partycrew_count: 'desc' },
        take: 10,
      });

      for (const profile of locationCreators) {
        locationSuggestions.push({
          id: profile.id,
          username: profile.username,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          is_verified: profile.is_verified,
          account_type: profile.account_type,
          partycrew_count: profile.partycrew_count,
          events_hosted: profile.events_hosted,
          haus_score: profile.haus_score,
          reason: `Popular in ${userProfile.location}`,
          mutual_crew_count: 0,
          same_location: true,
        });
      }
    }

    // STRATEGY 3: Verified creators with high engagement
    const verifiedSuggestions: typeof mutualSuggestions = [];

    if (mutualSuggestions.length + locationSuggestions.length < limit) {
      const alreadySuggestedIds = [
        ...excludeIds,
        ...mutualSuggestions.map((s) => s.id),
        ...locationSuggestions.map((s) => s.id),
      ];

      const verifiedCreators = await prisma.userProfile.findMany({
        where: {
          is_verified: true,
          id: { notIn: alreadySuggestedIds },
          is_private: false,
          events_hosted: { gte: 3 },
        },
        orderBy: { haus_score: 'desc' },
        take: 10,
      });

      for (const profile of verifiedCreators) {
        verifiedSuggestions.push({
          id: profile.id,
          username: profile.username,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          is_verified: profile.is_verified,
          account_type: profile.account_type,
          partycrew_count: profile.partycrew_count,
          events_hosted: profile.events_hosted,
          haus_score: profile.haus_score,
          reason: 'Verified creator',
          mutual_crew_count: 0,
          same_location: false,
        });
      }
    }

    // Combine and limit suggestions
    const allSuggestions = [
      ...mutualSuggestions,
      ...locationSuggestions,
      ...verifiedSuggestions,
    ].slice(0, limit);

    return res.status(200).json({
      suggestions: allSuggestions,
      total: allSuggestions.length,
    });
  } catch (error: unknown) {
    console.error('[Suggested Creators Error]:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ---------------------------------------------------------------------------
// GET /api/users/:id - get user profile with connection info
// ---------------------------------------------------------------------------
router.get('/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.params.id;
    const viewerId = req.user?.id || null;

    if (!userId) {
      return res.status(400).json({ error: 'Missing user ID' });
    }

    // Get user profile
    const profile = await prisma.userProfile.findUnique({
      where: { id: userId },
    });

    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Initialize viewer relationship data
    let viewerIsFollowing = false;
    let viewerIsFollower = false;
    let viewerIsMutual = false;
    let viewerHasPendingRequest = false;
    let viewerIsBlocked = false;
    let viewerHasBlocked = false;
    let mutualCrewCount: number | undefined;

    if (viewerId) {
      // Check if viewer is following this user
      const followingConn = await prisma.connection.findFirst({
        where: { follower_id: viewerId, following_id: userId },
        select: { id: true },
      });
      viewerIsFollowing = !!followingConn;

      // Check if this user is following viewer
      const followerConn = await prisma.connection.findFirst({
        where: { follower_id: userId, following_id: viewerId },
        select: { id: true },
      });
      viewerIsFollower = !!followerConn;
      viewerIsMutual = viewerIsFollowing && viewerIsFollower;

      // Check for pending request
      const pendingRequest = await prisma.connectionRequest.findFirst({
        where: {
          requester_id: viewerId,
          target_id: userId,
          status: 'pending',
        },
        select: { id: true },
      });
      viewerHasPendingRequest = !!pendingRequest;

      // Check if viewer is blocked
      const blocked = await prisma.userBlock.findFirst({
        where: { blocker_id: userId, blocked_id: viewerId },
        select: { id: true },
      });
      viewerIsBlocked = !!blocked;

      // Check if viewer has blocked this user
      const hasBlocked = await prisma.userBlock.findFirst({
        where: { blocker_id: viewerId, blocked_id: userId },
        select: { id: true },
      });
      viewerHasBlocked = !!hasBlocked;

      // Mutual crew count = |following(viewer) ∩ following(target)|.
      // Computed with two Prisma queries instead of the get_mutual_crew_count
      // RPC, whose uuid-typed params cannot bind against the prisma-pushed
      // TEXT id columns. Skipped for self-view (it would just equal
      // crewing_count and mean nothing).
      if (viewerId !== userId) {
        const viewerFollowing = await prisma.connection.findMany({
          where: { follower_id: viewerId },
          select: { following_id: true },
        });
        const viewerFollowingIds = viewerFollowing.map((c) => c.following_id);
        mutualCrewCount = viewerFollowingIds.length
          ? await prisma.connection.count({
              where: {
                follower_id: userId,
                following_id: { in: viewerFollowingIds },
              },
            })
          : 0;
      }
    }

    // A viewer the owner has blocked should not see the profile at all —
    // indistinguishable from a nonexistent account.
    if (viewerIsBlocked) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isSelf = viewerId === userId;

    const viewerFlags = {
      viewer_is_following: viewerIsFollowing,
      viewer_is_follower: viewerIsFollower,
      viewer_is_mutual: viewerIsMutual,
      viewer_has_pending_request: viewerHasPendingRequest,
      viewer_is_blocked: viewerIsBlocked,
      viewer_has_blocked: viewerHasBlocked,
      mutual_crew_count: mutualCrewCount,
    };

    // Private account viewed by a non-follower: minimal public card only.
    // (Under the original Supabase RLS, private profiles were not selectable
    // by other users at all — see 20251101 migration "Public profiles are
    // viewable by everyone" policy.)
    if (profile.is_private && !isSelf && !viewerIsFollowing) {
      return res.status(200).json({
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name,
        bio: null,
        avatar_url: profile.avatar_url,
        cover_photo_url: null,
        location: null,
        website_url: null,

        partycrew_count: profile.partycrew_count,
        crewing_count: profile.crewing_count,
        events_hosted: profile.events_hosted,
        haus_score: profile.haus_score,

        is_verified: profile.is_verified,
        is_private: profile.is_private,
        account_type: profile.account_type,

        ...viewerFlags,

        created_at: profile.created_at,
        last_active_at: null,
      });
    }

    return res.status(200).json({
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name,
      bio: profile.bio,
      avatar_url: profile.avatar_url,
      cover_photo_url: profile.cover_photo_url,
      location: profile.location,
      website_url: profile.website_url,

      partycrew_count: profile.partycrew_count,
      crewing_count: profile.crewing_count,
      events_hosted: profile.events_hosted,
      haus_score: profile.haus_score,

      is_verified: profile.is_verified,
      is_private: profile.is_private,
      account_type: profile.account_type,

      ...viewerFlags,

      created_at: profile.created_at,
      // Honor the owner's activity-visibility preference.
      last_active_at: isSelf || profile.show_activity_status ? profile.last_active_at : null,
    });
  } catch (error: unknown) {
    console.error('[User Profile Error]:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
