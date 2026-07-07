// Express route: /api/connections
// Manage crew connections (follow/unfollow, accept/decline requests)
// Replaces Vercel serverless function api/user-connections.ts

import { Router } from 'express';
import type { Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import type { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/connections - list user's connections (following / followers / mutual)
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const type = (req.query.type as string) || 'following';

    if (type === 'following') {
      // Users this user is following
      const connections = await prisma.connection.findMany({
        where: { follower_id: userId },
        select: {
          id: true,
          following_id: true,
          created_at: true,
          notify_on_events: true,
          following: {
            select: {
              id: true,
              username: true,
              display_name: true,
              avatar_url: true,
              bio: true,
              partycrew_count: true,
              events_hosted: true,
              is_verified: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });
      return res.status(200).json({ connections });
    }

    if (type === 'followers') {
      // Users following this user
      const connections = await prisma.connection.findMany({
        where: { following_id: userId },
        select: {
          id: true,
          follower_id: true,
          created_at: true,
          follower: {
            select: {
              id: true,
              username: true,
              display_name: true,
              avatar_url: true,
              bio: true,
              crewing_count: true,
              events_attended: true,
              is_verified: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });
      return res.status(200).json({ connections });
    }

    if (type === 'mutual') {
      // Mutual connections
      const following = await prisma.connection.findMany({
        where: { follower_id: userId },
        select: { following_id: true },
      });
      const followers = await prisma.connection.findMany({
        where: { following_id: userId },
        select: { follower_id: true },
      });

      const followingIds = new Set(following.map((f) => f.following_id));
      const followerIds = new Set(followers.map((f) => f.follower_id));
      const mutualIds = [...followingIds].filter((id) => followerIds.has(id));

      const mutualProfiles = await prisma.userProfile.findMany({
        where: { id: { in: mutualIds } },
        select: {
          id: true,
          username: true,
          display_name: true,
          avatar_url: true,
          bio: true,
          is_verified: true,
        },
      });
      return res.status(200).json({ connections: mutualProfiles });
    }

    return res.status(400).json({ error: 'Invalid type parameter' });
  } catch (error: unknown) {
    console.error('User connections error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'Internal server error', message: errorMessage });
  }
});

// POST /api/connections - create connection (follow) or accept/decline request
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { action, target_user_id, connection_request_id } = req.body;

    if (action === 'follow') {
      if (!target_user_id) {
        return res.status(400).json({ error: 'target_user_id required' });
      }

      // Check if target user is private
      const targetProfile = await prisma.userProfile.findUnique({
        where: { id: target_user_id },
        select: { is_private: true },
      });

      if (targetProfile?.is_private) {
        // Create connection request instead
        const request = await prisma.connectionRequest.create({
          data: {
            requester_id: userId,
            target_id: target_user_id,
            status: 'pending',
          },
        });
        return res.status(201).json({
          type: 'request_sent',
          request,
          message: 'Connection request sent',
        });
      }

      // Public account: create connection directly
      try {
        const connection = await prisma.connection.create({
          data: {
            follower_id: userId,
            following_id: target_user_id,
          },
        });
        return res.status(201).json({ connection, message: 'Now following' });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          return res.status(400).json({ error: 'Already following' });
        }
        throw error;
      }
    }

    if (action === 'accept_request') {
      if (!connection_request_id) {
        return res.status(400).json({ error: 'connection_request_id required' });
      }

      // Get and verify request
      const request = await prisma.connectionRequest.findFirst({
        where: {
          id: connection_request_id,
          target_id: userId,
          status: 'pending',
        },
      });

      if (!request) {
        return res.status(404).json({ error: 'Request not found or already processed' });
      }

      // Create connection
      const connection = await prisma.connection.create({
        data: {
          follower_id: request.requester_id,
          following_id: userId,
        },
      });

      // Update request status
      await prisma.connectionRequest.update({
        where: { id: connection_request_id },
        data: { status: 'accepted' },
      });

      return res.status(201).json({
        connection,
        message: 'Connection request accepted',
      });
    }

    if (action === 'decline_request') {
      if (!connection_request_id) {
        return res.status(400).json({ error: 'connection_request_id required' });
      }

      await prisma.connectionRequest.updateMany({
        where: {
          id: connection_request_id,
          target_id: userId,
        },
        data: { status: 'rejected' },
      });

      return res.status(200).json({ message: 'Request declined' });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error: unknown) {
    console.error('User connections error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'Internal server error', message: errorMessage });
  }
});

// DELETE /api/connections/:id - remove connection (unfollow)
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const targetUserId = req.params.id;

    await prisma.connection.deleteMany({
      where: {
        follower_id: userId,
        following_id: targetUserId,
      },
    });

    return res.status(200).json({ message: 'Unfollowed successfully' });
  } catch (error: unknown) {
    console.error('User connections error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'Internal server error', message: errorMessage });
  }
});

export default router;
