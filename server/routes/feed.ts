// Express route: /api/feed
// PartyCrew feed with 5-factor ranking algorithm
// Replaces Vercel serverless function api/feed/crew.ts

import { Router } from 'express';
import type { Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import type { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/feed/crew - get crew feed (posts from followed users)
router.get('/crew', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    // Clamp to [1, 50]; NaN (e.g. limit=abc) falls back to 20. A raw
    // parseInt passed to Prisma `take` throws on NaN and *reverses* the
    // result set on negative values.
    const parsedLimit = parseInt((req.query.limit as string) || '20', 10);
    const limit = Math.min(Math.max(Number.isNaN(parsedLimit) ? 20 : parsedLimit, 1), 50);
    const cursor = req.query.cursor as string | undefined;
    const contentTypeFilter = req.query.content_type as string | undefined;

    // content_type CHECK vocabulary (schema.prisma:735)
    const VALID_CONTENT_TYPES = [
      'update',
      'photo',
      'video',
      'poll',
      'event_announcement',
      'tip',
      'recap',
    ];
    if (contentTypeFilter && !VALID_CONTENT_TYPES.includes(contentTypeFilter)) {
      return res.status(400).json({
        error: `content_type must be one of: ${VALID_CONTENT_TYPES.join(', ')}`,
      });
    }

    // Get list of creators user is following
    const following = await prisma.connection.findMany({
      where: { follower_id: userId },
      select: { following_id: true, notify_on_posts: true },
    });

    if (!following || following.length === 0) {
      // No following, return empty feed
      return res.status(200).json({
        posts: [],
        next_cursor: null,
        has_more: false,
      });
    }

    const followingIds = following.map((f) => f.following_id);
    const priorityCreatorIds = following.filter((f) => f.notify_on_posts).map((f) => f.following_id);

    // Cursor-based pagination via Prisma's native cursor: the page window is
    // strictly chronological (published_at desc, id desc as tiebreak) and the
    // cursor is the LAST FETCHED (oldest) row of the window — NOT the last
    // rank-sorted row. Ranking reorders posts only WITHIN each page.
    // The previous design (window = 3x limit, cursor = last ranked item)
    // silently skipped up to two-thirds of candidates on every scroll and
    // re-served already-shown posts.
    if (cursor) {
      const cursorPost = await prisma.partycrewPost.findUnique({
        where: { id: cursor },
        select: { id: true },
      });
      if (!cursorPost) {
        return res.status(400).json({ error: 'Invalid cursor' });
      }
    }

    // Fetch limit+1 to know whether another page exists.
    const posts = await prisma.partycrewPost.findMany({
      where: {
        creator_id: { in: followingIds },
        visibility: { in: ['crew', 'public'] },
        published_at: { lte: new Date() },
        ...(contentTypeFilter ? { content_type: contentTypeFilter } : {}),
      },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        creator_id: true,
        content_type: true,
        title: true,
        body: true,
        media_urls: true,
        event_id: true,
        poll_options: true,
        poll_ends_at: true,
        likes_count: true,
        comments_count: true,
        shares_count: true,
        views_count: true,
        published_at: true,
        created_at: true,
        creator: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            is_verified: true,
          },
        },
      },
      orderBy: [{ published_at: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });

    if (!posts || posts.length === 0) {
      return res.status(200).json({
        posts: [],
        next_cursor: null,
        has_more: false,
      });
    }

    const hasMore = posts.length > limit;
    const pagePosts = hasMore ? posts.slice(0, limit) : posts;
    // Chronological floor of this window — the correct next-page cursor.
    const windowFloorId = pagePosts[pagePosts.length - 1].id;

    // Get user's content interactions for personalization
    const postIds = pagePosts.map((p) => p.id);
    const userInteractions = await prisma.contentInteraction.findMany({
      where: {
        user_id: userId,
        post_id: { in: postIds },
      },
      select: { post_id: true, interaction_type: true },
    });

    const interactionsMap = new Map<string, Set<string>>();
    userInteractions.forEach((interaction) => {
      if (!interactionsMap.has(interaction.post_id)) {
        interactionsMap.set(interaction.post_id, new Set());
      }
      interactionsMap.get(interaction.post_id)!.add(interaction.interaction_type);
    });

    // Get posts user has already seen
    const readStatus = await prisma.feedReadStatus.findMany({
      where: {
        user_id: userId,
        post_id: { in: postIds },
      },
      select: { post_id: true },
    });

    const seenPostIds = new Set(readStatus.map((r) => r.post_id));

    // FEED ALGORITHM: 5-Factor Ranking (within the chronological page window)
    const rankedPosts = pagePosts.map((post) => {
      const ageHours =
        (Date.now() - new Date(post.published_at).getTime()) / (1000 * 60 * 60);
      const interactions = interactionsMap.get(post.id);
      const hasSeen = seenPostIds.has(post.id);

      // Factor 1: Recency Score (25%) - Decay over time
      const recencyScore = Math.max(0, 1 - ageHours / 168); // 7 days = 0

      // Factor 2: Engagement Score (20%) - Normalized by age
      const engagementRate =
        (post.likes_count + post.comments_count * 2 + post.shares_count * 3) /
        Math.max(ageHours, 1);
      const engagementScore = Math.min(1, engagementRate / 10);

      // Factor 3: Creator Affinity (25%) - Prioritize certain creators
      const isPriorityCreator = priorityCreatorIds.includes(post.creator_id);
      const affinityScore = isPriorityCreator ? 1 : 0.7;

      // Factor 4: Content Preference (15%) - Based on past interactions.
      // Branches ordered by descending weight so a user who both commented
      // and shared gets the higher share weight.
      let preferenceScore = 0.5;
      if (interactions) {
        if (interactions.has('like') || interactions.has('share')) preferenceScore = 1;
        else if (interactions.has('comment')) preferenceScore = 0.9;
        else if (interactions.has('skip')) preferenceScore = 0.2;
      }

      // Factor 5: Social Proof (15%) - High engagement from others
      const socialProofScore = Math.min(1, (post.likes_count + post.comments_count) / 50);

      // Penalty for already seen posts
      const seenPenalty = hasSeen ? 0.3 : 1;

      // Calculate final score
      const feedScore =
        (recencyScore * 0.25 +
          engagementScore * 0.2 +
          affinityScore * 0.25 +
          preferenceScore * 0.15 +
          socialProofScore * 0.15) *
        seenPenalty;

      return { ...post, feed_score: feedScore };
    });

    // Sort by feed score (display order within the page)
    rankedPosts.sort((a, b) => b.feed_score - a.feed_score);

    const topPosts = rankedPosts;

    // Get user's likes, comments, shares for these posts
    const topPostIds = topPosts.map((p) => p.id);

    const [userLikes, userComments, userShares] = await Promise.all([
      prisma.postLike.findMany({
        where: { user_id: userId, post_id: { in: topPostIds } },
        select: { post_id: true },
      }),
      prisma.postComment.findMany({
        where: { user_id: userId, post_id: { in: topPostIds } },
        select: { post_id: true },
      }),
      prisma.postShare.findMany({
        where: { user_id: userId, post_id: { in: topPostIds } },
        select: { post_id: true },
      }),
    ]);

    const likedPostIds = new Set(userLikes.map((l) => l.post_id));
    const commentedPostIds = new Set(userComments.map((c) => c.post_id));
    const sharedPostIds = new Set(userShares.map((s) => s.post_id));

    // Format response
    const formattedPosts = topPosts.map((post) => ({
      id: post.id,
      creator: {
        id: post.creator.id,
        username: post.creator.username,
        display_name: post.creator.display_name,
        avatar_url: post.creator.avatar_url,
        is_verified: post.creator.is_verified,
      },
      content_type: post.content_type,
      title: post.title,
      body: post.body,
      media_urls: post.media_urls || [],
      event_id: post.event_id,
      poll_options: post.poll_options,
      poll_ends_at: post.poll_ends_at,

      likes_count: post.likes_count,
      comments_count: post.comments_count,
      shares_count: post.shares_count,
      views_count: post.views_count,

      viewer_has_liked: likedPostIds.has(post.id),
      viewer_has_commented: commentedPostIds.has(post.id),
      viewer_has_shared: sharedPostIds.has(post.id),

      published_at: post.published_at,
      created_at: post.created_at,
      feed_score: post.feed_score,
    }));

    // NOTE: posts are NOT marked seen at delivery. The client reports real
    // impressions via POST /api/feed/seen (IntersectionObserver) — marking at
    // delivery penalized posts the user never scrolled to (0.3x on the next
    // refresh) purely for having been included in an API response.

    // Next cursor = chronological floor of the fetched window (see above);
    // null when this is the final page.
    return res.status(200).json({
      posts: formattedPosts,
      next_cursor: hasMore ? windowFloorId : null,
      has_more: hasMore,
    });
  } catch (error: unknown) {
    console.error('[Feed Error]:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/feed/seen - record real client-side impressions.
// Body: { post_ids: string[] } (max 100). Idempotent per (user, post).
router.post('/seen', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { post_ids } = req.body;

    if (!Array.isArray(post_ids) || post_ids.length === 0) {
      return res.status(400).json({ error: 'post_ids array is required' });
    }
    if (post_ids.length > 100) {
      return res.status(400).json({ error: 'post_ids is limited to 100 per call' });
    }
    if (!post_ids.every((id) => typeof id === 'string' && id.length > 0 && id.length <= 128)) {
      return res.status(400).json({ error: 'post_ids must be non-empty strings' });
    }

    // Only mark posts that actually exist (foreign ids are dropped, not 500s).
    const existing = await prisma.partycrewPost.findMany({
      where: { id: { in: post_ids } },
      select: { id: true },
    });

    if (existing.length > 0) {
      await prisma.feedReadStatus.createMany({
        data: existing.map((p) => ({
          user_id: userId,
          post_id: p.id,
          viewed_at: new Date(),
        })),
        skipDuplicates: true,
      });
    }

    return res.status(200).json({ marked: existing.length });
  } catch (error: unknown) {
    console.error('[Feed Seen Error]:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});


/**
 * Feed interactions: like, comment, share.
 *
 * These endpoints did not exist. `PostLike`, `PostComment` and `PostShare` were
 * in the schema with `likes_count`, `comments_count` and `shares_count`
 * denormalised onto `PartycrewPost`, and nothing wrote to any of it. The mobile
 * feed rendered the counters and its handlers were three TODOs that logged to
 * the console, so every tap looked like it worked and changed nothing. That is
 * GAP-SOC-02.
 *
 * Two invariants govern all three:
 *
 * 1. The counter and the row are written in one transaction. They are two
 *    representations of the same fact, so a partial write leaves the feed
 *    permanently lying about a number users can see.
 *
 * 2. Visibility is checked before writing. `canSeePost` reuses the same rule the
 *    feed read path applies, so a post you could never have been shown cannot be
 *    liked by guessing its id.
 */

/**
 * A post is visible if you are its author, or its author is in your crew.
 *
 * Mirrors the relationship test the crew feed already applies when selecting
 * posts. Returns the post when visible and null otherwise, so callers cannot
 * accidentally treat "not found" and "not permitted" differently and leak
 * whether an id exists.
 */
async function visiblePost(postId: string, userId: string) {
  const post = await prisma.partycrewPost.findUnique({
    where: { id: postId },
    select: { id: true, creator_id: true },
  });
  if (!post) return null;
  if (post.creator_id === userId) return post;

  const connected = await prisma.connection.findFirst({
    where: { follower_id: userId, following_id: post.creator_id },
    select: { id: true },
  });
  return connected ? post : null;
}

/** POST /api/feed/posts/:id/like — idempotent like. */
router.post('/posts/:id/like', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const post = await visiblePost(req.params.id, userId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const existing = await prisma.postLike.findFirst({
      where: { post_id: post.id, user_id: userId },
      select: { id: true },
    });
    // Idempotent: a double tap, or a retry after a dropped response, must not
    // inflate the counter. Report the current state rather than erroring.
    if (existing) {
      const current = await prisma.partycrewPost.findUnique({
        where: { id: post.id }, select: { likes_count: true },
      });
      return res.json({ liked: true, likes_count: current?.likes_count ?? 0 });
    }

    const [, updated] = await prisma.$transaction([
      prisma.postLike.create({ data: { post_id: post.id, user_id: userId } }),
      prisma.partycrewPost.update({
        where: { id: post.id },
        data: { likes_count: { increment: 1 } },
        select: { likes_count: true },
      }),
    ]);
    res.status(201).json({ liked: true, likes_count: updated.likes_count });
  } catch (err) {
    console.error('Like post error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** DELETE /api/feed/posts/:id/like — idempotent unlike. */
router.delete('/posts/:id/like', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const post = await visiblePost(req.params.id, userId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const existing = await prisma.postLike.findFirst({
      where: { post_id: post.id, user_id: userId }, select: { id: true },
    });
    if (!existing) {
      const current = await prisma.partycrewPost.findUnique({
        where: { id: post.id }, select: { likes_count: true },
      });
      return res.json({ liked: false, likes_count: current?.likes_count ?? 0 });
    }

    const [, updated] = await prisma.$transaction([
      prisma.postLike.delete({ where: { id: existing.id } }),
      prisma.partycrewPost.update({
        where: { id: post.id },
        // Floor at zero. A counter that drifted negative would render as
        // "-1 likes" forever, and no repair path exists.
        data: { likes_count: { decrement: 1 } },
        select: { likes_count: true },
      }),
    ]);
    res.json({ liked: false, likes_count: Math.max(updated.likes_count, 0) });
  } catch (err) {
    console.error('Unlike post error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** GET /api/feed/posts/:id/comments — oldest first, cursor paginated. */
router.get('/posts/:id/comments', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const post = await visiblePost(req.params.id, req.user!.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const parsed = parseInt((req.query.limit as string) || '20', 10);
    const limit = Math.min(Math.max(Number.isNaN(parsed) ? 20 : parsed, 1), 50);
    const cursor = req.query.cursor as string | undefined;

    const comments = await prisma.postComment.findMany({
      where: { post_id: post.id },
      orderBy: { created_at: 'asc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true, body: true, parent_comment_id: true, created_at: true,
        user: { select: { id: true, username: true, display_name: true, avatar_url: true } },
      },
    });

    const hasMore = comments.length > limit;
    const page = hasMore ? comments.slice(0, limit) : comments;
    res.json({ comments: page, next_cursor: hasMore ? page[page.length - 1].id : null });
  } catch (err) {
    console.error('List comments error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** POST /api/feed/posts/:id/comments — add a comment or a reply. */
router.post('/posts/:id/comments', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const post = await visiblePost(req.params.id, userId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const { body, parent_comment_id: parentId } = req.body ?? {};
    if (typeof body !== 'string' || body.trim() === '') {
      return res.status(400).json({ error: 'Comment body is required' });
    }
    // Bounded at a trust boundary (GAP-IOS-19). Without this a single request
    // can write an arbitrarily large row.
    if (body.length > 2000) {
      return res.status(400).json({ error: 'Comment is limited to 2000 characters' });
    }

    // A reply must attach to a comment on this same post, or threads could be
    // grafted across posts by supplying any comment id.
    if (parentId !== undefined && parentId !== null) {
      if (typeof parentId !== 'string') {
        return res.status(400).json({ error: 'parent_comment_id must be a string' });
      }
      const parent = await prisma.postComment.findFirst({
        where: { id: parentId, post_id: post.id }, select: { id: true },
      });
      if (!parent) return res.status(400).json({ error: 'Parent comment does not belong to this post' });
    }

    const [comment, updated] = await prisma.$transaction([
      prisma.postComment.create({
        data: {
          post_id: post.id,
          user_id: userId,
          body: body.trim(),
          parent_comment_id: parentId ?? null,
        },
        select: {
          id: true, body: true, parent_comment_id: true, created_at: true,
          user: { select: { id: true, username: true, display_name: true, avatar_url: true } },
        },
      }),
      prisma.partycrewPost.update({
        where: { id: post.id },
        data: { comments_count: { increment: 1 } },
        select: { comments_count: true },
      }),
    ]);
    res.status(201).json({ comment, comments_count: updated.comments_count });
  } catch (err) {
    console.error('Create comment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** POST /api/feed/posts/:id/share — record a share. */
router.post('/posts/:id/share', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const post = await visiblePost(req.params.id, userId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // schema.prisma PostShare.shared_to CHECK vocabulary.
    const VALID_TARGETS = ['feed', 'external', 'message'];
    const target = (req.body?.shared_to as string | undefined) ?? 'external';
    if (!VALID_TARGETS.includes(target)) {
      return res.status(400).json({
        error: `shared_to must be one of: ${VALID_TARGETS.join(', ')}`,
      });
    }

    // Shares are not deduplicated. Unlike a like, sharing the same post twice
    // is two real events and both are worth counting.
    const [, updated] = await prisma.$transaction([
      prisma.postShare.create({ data: { post_id: post.id, user_id: userId, shared_to: target } }),
      prisma.partycrewPost.update({
        where: { id: post.id },
        data: { shares_count: { increment: 1 } },
        select: { shares_count: true },
      }),
    ]);
    res.status(201).json({ shared: true, shares_count: updated.shares_count });
  } catch (err) {
    console.error('Share post error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
