/**
 * PartyCrew Feed API
 * GET /api/feed/crew?limit=20&cursor={postId}
 * Returns personalized feed with 5-factor ranking algorithm
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface FeedPost {
  id: string;
  creator: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    is_verified: boolean;
  };
  content_type: string;
  title: string | null;
  body: string | null;
  media_urls: string[];
  event_id: string | null;
  poll_options: any;
  poll_ends_at: string | null;
  
  // Engagement
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  
  // User interaction
  viewer_has_liked: boolean;
  viewer_has_commented: boolean;
  viewer_has_shared: boolean;
  
  // Metadata
  published_at: string;
  created_at: string;
  
  // Feed algorithm score (for debugging)
  feed_score?: number;
}

interface FeedResponse {
  posts: FeedPost[];
  next_cursor: string | null;
  has_more: boolean;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const limit = Math.min(parseInt(req.query.limit as string || '20'), 50);
    const cursor = req.query.cursor as string | undefined;
    const contentTypeFilter = req.query.content_type as string | undefined;

    // Get list of creators user is following
    const { data: following } = await supabase
      .from('connections')
      .select('following_id, notify_on_posts')
      .eq('follower_id', user.id);

    if (!following || following.length === 0) {
      // No following, return empty feed
      return res.status(200).json({
        posts: [],
        next_cursor: null,
        has_more: false
      });
    }

    const followingIds = following.map(f => f.following_id);
    const priorityCreatorIds = following
      .filter(f => f.notify_on_posts)
      .map(f => f.following_id);

    // Build query for posts from followed creators
    let postsQuery = supabase
      .from('partycrew_posts')
      .select(`
        *,
        user_profiles!partycrew_posts_creator_id_fkey (
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        )
      `)
      .in('creator_id', followingIds)
      .in('visibility', ['crew', 'public'])
      .lte('published_at', new Date().toISOString());

    if (contentTypeFilter) {
      postsQuery = postsQuery.eq('content_type', contentTypeFilter);
    }

    if (cursor) {
      // Cursor-based pagination
      const { data: cursorPost } = await supabase
        .from('partycrew_posts')
        .select('published_at')
        .eq('id', cursor)
        .single();
      
      if (cursorPost) {
        postsQuery = postsQuery.lt('published_at', cursorPost.published_at);
      }
    }

    // Get posts (fetch more than limit for ranking)
    const { data: posts, error: postsError } = await postsQuery
      .order('published_at', { ascending: false })
      .limit(limit * 3); // Fetch 3x to have ranking candidates

    if (postsError) {
      console.error('[Feed Posts Error]:', postsError);
      return res.status(500).json({ error: 'Failed to fetch feed' });
    }

    if (!posts || posts.length === 0) {
      return res.status(200).json({
        posts: [],
        next_cursor: null,
        has_more: false
      });
    }

    // Get user's content interactions for personalization
    const { data: userInteractions } = await supabase
      .from('content_interactions')
      .select('post_id, interaction_type')
      .eq('user_id', user.id)
      .in('post_id', posts.map(p => p.id));

    const interactionsMap = new Map();
    userInteractions?.forEach((interaction: any) => {
      if (!interactionsMap.has(interaction.post_id)) {
        interactionsMap.set(interaction.post_id, new Set());
      }
      interactionsMap.get(interaction.post_id).add(interaction.interaction_type);
    });

    // Get posts user has already seen
    const { data: readStatus } = await supabase
      .from('feed_read_status')
      .select('post_id')
      .eq('user_id', user.id)
      .in('post_id', posts.map(p => p.id));

    const seenPostIds = new Set(readStatus?.map(r => r.post_id) || []);

    // FEED ALGORITHM: 5-Factor Ranking
    const rankedPosts = posts.map((post: any) => {
      const ageHours = (Date.now() - new Date(post.published_at).getTime()) / (1000 * 60 * 60);
      const interactions = interactionsMap.get(post.id);
      const hasSeen = seenPostIds.has(post.id);
      
      // Factor 1: Recency Score (25%) - Decay over time
      const recencyScore = Math.max(0, 1 - (ageHours / 168)); // 7 days = 0
      
      // Factor 2: Engagement Score (20%) - Normalized by age
      const engagementRate = (post.likes_count + post.comments_count * 2 + post.shares_count * 3) / 
                            Math.max(ageHours, 1);
      const engagementScore = Math.min(1, engagementRate / 10);
      
      // Factor 3: Creator Affinity (25%) - Prioritize certain creators
      const isPriorityCreator = priorityCreatorIds.includes(post.creator_id);
      const affinityScore = isPriorityCreator ? 1 : 0.7;
      
      // Factor 4: Content Preference (15%) - Based on past interactions
      let preferenceScore = 0.5;
      if (interactions) {
        if (interactions.has('like')) preferenceScore = 1;
        else if (interactions.has('comment')) preferenceScore = 0.9;
        else if (interactions.has('share')) preferenceScore = 1;
        else if (interactions.has('skip')) preferenceScore = 0.2;
      }
      
      // Factor 5: Social Proof (15%) - High engagement from others
      const socialProofScore = Math.min(1, (post.likes_count + post.comments_count) / 50);
      
      // Penalty for already seen posts
      const seenPenalty = hasSeen ? 0.3 : 1;
      
      // Calculate final score
      const feedScore = (
        recencyScore * 0.25 +
        engagementScore * 0.20 +
        affinityScore * 0.25 +
        preferenceScore * 0.15 +
        socialProofScore * 0.15
      ) * seenPenalty;
      
      return { ...post, feed_score: feedScore };
    });

    // Sort by feed score
    rankedPosts.sort((a, b) => b.feed_score - a.feed_score);

    // Take top N posts
    const topPosts = rankedPosts.slice(0, limit);

    // Get user's likes, comments, shares for these posts
    const postIds = topPosts.map(p => p.id);
    
    const { data: userLikes } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', user.id)
      .in('post_id', postIds);

    const { data: userComments } = await supabase
      .from('post_comments')
      .select('post_id')
      .eq('user_id', user.id)
      .in('post_id', postIds);

    const { data: userShares } = await supabase
      .from('post_shares')
      .select('post_id')
      .eq('user_id', user.id)
      .in('post_id', postIds);

    const likedPostIds = new Set(userLikes?.map(l => l.post_id) || []);
    const commentedPostIds = new Set(userComments?.map(c => c.post_id) || []);
    const sharedPostIds = new Set(userShares?.map(s => s.post_id) || []);

    // Format response
    const formattedPosts: FeedPost[] = topPosts.map((post: any) => ({
      id: post.id,
      creator: {
        id: post.user_profiles.id,
        username: post.user_profiles.username,
        display_name: post.user_profiles.display_name,
        avatar_url: post.user_profiles.avatar_url,
        is_verified: post.user_profiles.is_verified
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
      feed_score: post.feed_score
    }));

    // Mark posts as viewed
    const viewRecords = formattedPosts.map(post => ({
      user_id: user.id,
      post_id: post.id,
      viewed_at: new Date().toISOString()
    }));

    await supabase
      .from('feed_read_status')
      .upsert(viewRecords, { onConflict: 'user_id,post_id' });

    // Determine next cursor
    const nextCursor = formattedPosts.length > 0 
      ? formattedPosts[formattedPosts.length - 1].id 
      : null;

    const response: FeedResponse = {
      posts: formattedPosts,
      next_cursor: nextCursor,
      has_more: rankedPosts.length > limit
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('[Feed Error]:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
