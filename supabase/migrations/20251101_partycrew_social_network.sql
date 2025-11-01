-- PartyCrew Social Network Schema
-- Phase 1: Core Social Features
-- Created: November 1, 2025

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================
-- USER PROFILES (Extended Social Profiles)
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Info
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  cover_photo_url TEXT,
  location TEXT,
  website_url TEXT,
  
  -- PartyCrew Stats (denormalized for performance)
  partycrew_count INTEGER DEFAULT 0 NOT NULL, -- Number of followers
  crewing_count INTEGER DEFAULT 0 NOT NULL,   -- Number following
  events_hosted INTEGER DEFAULT 0 NOT NULL,
  events_attended INTEGER DEFAULT 0 NOT NULL,
  haus_score INTEGER DEFAULT 0 NOT NULL,
  
  -- Privacy Settings
  is_private BOOLEAN DEFAULT false NOT NULL,
  show_attending_events BOOLEAN DEFAULT true NOT NULL,
  show_partycrew_list BOOLEAN DEFAULT true NOT NULL,
  show_activity_status BOOLEAN DEFAULT true NOT NULL,
  
  -- Verification & Account Type
  is_verified BOOLEAN DEFAULT false NOT NULL,
  account_type TEXT DEFAULT 'personal' NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_active_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$'),
  CONSTRAINT account_type_check CHECK (account_type IN ('personal', 'business', 'creator'))
);

-- Indexes for user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON public.user_profiles(display_name);
CREATE INDEX IF NOT EXISTS idx_user_profiles_location ON public.user_profiles(location);
CREATE INDEX IF NOT EXISTS idx_user_profiles_haus_score ON public.user_profiles(haus_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_partycrew_count ON public.user_profiles(partycrew_count DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_active ON public.user_profiles(last_active_at DESC);

-- Full-text search index for username and display_name
CREATE INDEX IF NOT EXISTS idx_user_profiles_search 
  ON public.user_profiles USING gin(to_tsvector('english', username || ' ' || display_name || ' ' || COALESCE(bio, '')));

-- ============================================
-- CONNECTIONS (PartyCrew Relationships)
-- ============================================

CREATE TABLE IF NOT EXISTS public.connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  
  -- Notification Settings
  notify_on_events BOOLEAN DEFAULT true NOT NULL,
  notify_on_posts BOOLEAN DEFAULT true NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Indexes for connections
CREATE INDEX IF NOT EXISTS idx_connections_follower ON public.connections(follower_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_connections_following ON public.connections(following_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_connections_mutual ON public.connections(follower_id, following_id);

-- ============================================
-- CONNECTION REQUESTS (For Private Accounts)
-- ============================================

CREATE TABLE IF NOT EXISTS public.connection_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' NOT NULL,
  message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  UNIQUE(requester_id, target_id),
  CHECK (requester_id != target_id),
  CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled'))
);

-- Indexes for connection_requests
CREATE INDEX IF NOT EXISTS idx_connection_requests_target ON public.connection_requests(target_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_connection_requests_requester ON public.connection_requests(requester_id, created_at DESC);

-- ============================================
-- USER BLOCKS (Moderation)
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

-- Indexes for user_blocks
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON public.user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON public.user_blocks(blocked_id);

-- ============================================
-- PARTYCREW POSTS (Content Feed)
-- ============================================

CREATE TABLE IF NOT EXISTS public.partycrew_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  
  -- Content
  content_type TEXT NOT NULL,
  title TEXT,
  body TEXT,
  media_urls TEXT[],
  
  -- Event Link (if type = event_announcement)
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  
  -- Poll Data (if type = poll)
  poll_options JSONB,
  poll_ends_at TIMESTAMPTZ,
  poll_allow_multiple BOOLEAN DEFAULT false,
  
  -- Metadata
  visibility TEXT DEFAULT 'crew' NOT NULL,
  is_pinned BOOLEAN DEFAULT false NOT NULL,
  
  -- Engagement Metrics (denormalized)
  likes_count INTEGER DEFAULT 0 NOT NULL,
  comments_count INTEGER DEFAULT 0 NOT NULL,
  shares_count INTEGER DEFAULT 0 NOT NULL,
  views_count INTEGER DEFAULT 0 NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CHECK (content_type IN ('update', 'photo', 'video', 'poll', 'event_announcement', 'tip', 'recap')),
  CHECK (visibility IN ('crew', 'public', 'private'))
);

-- Indexes for partycrew_posts
CREATE INDEX IF NOT EXISTS idx_partycrew_posts_creator ON public.partycrew_posts(creator_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_partycrew_posts_type ON public.partycrew_posts(content_type);
CREATE INDEX IF NOT EXISTS idx_partycrew_posts_event ON public.partycrew_posts(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_partycrew_posts_published ON public.partycrew_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_partycrew_posts_visibility ON public.partycrew_posts(visibility);

-- Full-text search for posts
CREATE INDEX IF NOT EXISTS idx_partycrew_posts_search 
  ON public.partycrew_posts USING gin(to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(body, '')));

-- ============================================
-- POST LIKES
-- ============================================

CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.partycrew_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(post_id, user_id)
);

-- Indexes for post_likes
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON public.post_likes(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON public.post_likes(user_id, created_at DESC);

-- ============================================
-- POST COMMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.partycrew_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CHECK (char_length(body) > 0 AND char_length(body) <= 1000)
);

-- Indexes for post_comments
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON public.post_comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_post_comments_user ON public.post_comments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON public.post_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;

-- ============================================
-- POST SHARES
-- ============================================

CREATE TABLE IF NOT EXISTS public.post_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.partycrew_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  shared_to TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CHECK (shared_to IN ('feed', 'external', 'message'))
);

-- Indexes for post_shares
CREATE INDEX IF NOT EXISTS idx_post_shares_post ON public.post_shares(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_shares_user ON public.post_shares(user_id, created_at DESC);

-- ============================================
-- POLL VOTES
-- ============================================

CREATE TABLE IF NOT EXISTS public.poll_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.partycrew_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  option_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(post_id, user_id, option_id)
);

-- Indexes for poll_votes
CREATE INDEX IF NOT EXISTS idx_poll_votes_post ON public.poll_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_user ON public.poll_votes(user_id);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  
  -- Related entities
  actor_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  post_id UUID REFERENCES public.partycrew_posts(id) ON DELETE SET NULL,
  
  -- State
  read BOOLEAN DEFAULT false NOT NULL,
  clicked BOOLEAN DEFAULT false NOT NULL,
  
  -- Action data (JSON for flexibility)
  action_data JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ,
  
  CHECK (type IN ('new_partycrew_member', 'event_invite', 'crew_rsvp', 'event_reminder', 
                  'post_like', 'post_comment', 'post_share', 'new_post', 'connection_request'))
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_expires ON public.notifications(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================
-- FEED READ STATUS
-- ============================================

CREATE TABLE IF NOT EXISTS public.feed_read_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.partycrew_posts(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(user_id, post_id)
);

-- Indexes for feed_read_status
CREATE INDEX IF NOT EXISTS idx_feed_read_user ON public.feed_read_status(user_id, viewed_at DESC);

-- ============================================
-- CONTENT INTERACTIONS (For Feed Algorithm)
-- ============================================

CREATE TABLE IF NOT EXISTS public.content_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.partycrew_posts(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CHECK (interaction_type IN ('view', 'like', 'comment', 'share', 'click', 'skip'))
);

-- Indexes for content_interactions
CREATE INDEX IF NOT EXISTS idx_content_interactions_user ON public.content_interactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_interactions_post ON public.content_interactions(post_id);
CREATE INDEX IF NOT EXISTS idx_content_interactions_type ON public.content_interactions(interaction_type);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update PartyCrew counts
CREATE OR REPLACE FUNCTION update_partycrew_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment follower's crewing_count
    UPDATE public.user_profiles 
    SET crewing_count = crewing_count + 1, updated_at = NOW()
    WHERE id = NEW.follower_id;
    
    -- Increment following's partycrew_count
    UPDATE public.user_profiles 
    SET partycrew_count = partycrew_count + 1, updated_at = NOW()
    WHERE id = NEW.following_id;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement counts
    UPDATE public.user_profiles 
    SET crewing_count = GREATEST(crewing_count - 1, 0), updated_at = NOW()
    WHERE id = OLD.follower_id;
    
    UPDATE public.user_profiles 
    SET partycrew_count = GREATEST(partycrew_count - 1, 0), updated_at = NOW()
    WHERE id = OLD.following_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_partycrew_counts
AFTER INSERT OR DELETE ON public.connections
FOR EACH ROW EXECUTE FUNCTION update_partycrew_counts();

-- Auto-update events_hosted count
CREATE OR REPLACE FUNCTION update_events_hosted()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.user_profiles 
    SET events_hosted = events_hosted + 1, updated_at = NOW()
    WHERE id = NEW.host_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.user_profiles 
    SET events_hosted = GREATEST(events_hosted - 1, 0), updated_at = NOW()
    WHERE id = OLD.host_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_events_hosted
AFTER INSERT OR DELETE ON public.events
FOR EACH ROW EXECUTE FUNCTION update_events_hosted();

-- Auto-update post engagement counts
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.partycrew_posts 
    SET likes_count = likes_count + 1, updated_at = NOW()
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.partycrew_posts 
    SET likes_count = GREATEST(likes_count - 1, 0), updated_at = NOW()
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_likes_count
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.partycrew_posts 
    SET comments_count = comments_count + 1, updated_at = NOW()
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.partycrew_posts 
    SET comments_count = GREATEST(comments_count - 1, 0), updated_at = NOW()
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_comments_count
AFTER INSERT OR DELETE ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

CREATE OR REPLACE FUNCTION update_post_shares_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.partycrew_posts 
    SET shares_count = shares_count + 1, updated_at = NOW()
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.partycrew_posts 
    SET shares_count = GREATEST(shares_count - 1, 0), updated_at = NOW()
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_shares_count
AFTER INSERT OR DELETE ON public.post_shares
FOR EACH ROW EXECUTE FUNCTION update_post_shares_count();

-- Auto-update updated_at timestamps
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_connection_requests_updated_at
BEFORE UPDATE ON public.connection_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partycrew_posts_updated_at
BEFORE UPDATE ON public.partycrew_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_post_comments_updated_at
BEFORE UPDATE ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partycrew_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_read_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_interactions ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.user_profiles
  FOR SELECT USING (is_private = false OR id = auth.uid());

CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- Connections Policies
CREATE POLICY "Users can view their connections" ON public.connections
  FOR SELECT USING (follower_id = auth.uid() OR following_id = auth.uid());

CREATE POLICY "Users can create connections" ON public.connections
  FOR INSERT WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can delete their connections" ON public.connections
  FOR DELETE USING (follower_id = auth.uid());

-- Connection Requests Policies
CREATE POLICY "Users can view their connection requests" ON public.connection_requests
  FOR SELECT USING (requester_id = auth.uid() OR target_id = auth.uid());

CREATE POLICY "Users can create connection requests" ON public.connection_requests
  FOR INSERT WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Users can update their received requests" ON public.connection_requests
  FOR UPDATE USING (target_id = auth.uid());

CREATE POLICY "Users can delete their sent requests" ON public.connection_requests
  FOR DELETE USING (requester_id = auth.uid());

-- Posts Policies
CREATE POLICY "Crew posts are viewable by crew members" ON public.partycrew_posts
  FOR SELECT USING (
    visibility = 'public' OR
    creator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.connections
      WHERE following_id = creator_id AND follower_id = auth.uid()
    )
  );

CREATE POLICY "Users can create posts" ON public.partycrew_posts
  FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update their own posts" ON public.partycrew_posts
  FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "Users can delete their own posts" ON public.partycrew_posts
  FOR DELETE USING (creator_id = auth.uid());

-- Engagement Policies (Likes, Comments, Shares, Votes)
CREATE POLICY "Users can view likes" ON public.post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can like posts" ON public.post_likes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unlike posts" ON public.post_likes
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Users can view comments" ON public.post_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can comment" ON public.post_comments
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their comments" ON public.post_comments
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their comments" ON public.post_comments
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Users can share posts" ON public.post_shares
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can vote on polls" ON public.poll_votes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view poll results" ON public.poll_votes
  FOR SELECT USING (true);

-- Notifications Policies
CREATE POLICY "Users can view their notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their notifications" ON public.notifications
  FOR DELETE USING (user_id = auth.uid());

-- Feed Read Status Policies
CREATE POLICY "Users can manage their read status" ON public.feed_read_status
  FOR ALL USING (user_id = auth.uid());

-- Content Interactions Policies
CREATE POLICY "Users can track their interactions" ON public.content_interactions
  FOR ALL USING (user_id = auth.uid());

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Check if user is following another user
CREATE OR REPLACE FUNCTION is_following(follower UUID, following UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.connections
    WHERE follower_id = follower AND following_id = following
  );
$$ LANGUAGE SQL STABLE;

-- Check if users are mutual crew (both follow each other)
CREATE OR REPLACE FUNCTION is_mutual_crew(user1 UUID, user2 UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.connections c1
    JOIN public.connections c2 ON c1.follower_id = c2.following_id AND c1.following_id = c2.follower_id
    WHERE c1.follower_id = user1 AND c1.following_id = user2
  );
$$ LANGUAGE SQL STABLE;

-- Get mutual crew count between two users
CREATE OR REPLACE FUNCTION get_mutual_crew_count(user1 UUID, user2 UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM (
    SELECT following_id FROM public.connections WHERE follower_id = user1
    INTERSECT
    SELECT following_id FROM public.connections WHERE follower_id = user2
  ) AS mutual;
$$ LANGUAGE SQL STABLE;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.user_profiles IS 'Extended user profiles with PartyCrew social features';
COMMENT ON TABLE public.connections IS 'PartyCrew follow relationships (follower → following)';
COMMENT ON TABLE public.connection_requests IS 'Pending PartyCrew join requests for private accounts';
COMMENT ON TABLE public.partycrew_posts IS 'Content posts from creators to their PartyCrew';
COMMENT ON TABLE public.post_likes IS 'Likes on PartyCrew posts';
COMMENT ON TABLE public.post_comments IS 'Comments on PartyCrew posts (supports nested replies)';
COMMENT ON TABLE public.poll_votes IS 'Votes on poll posts';
COMMENT ON TABLE public.notifications IS 'User notifications for PartyCrew activity';

COMMENT ON COLUMN public.user_profiles.partycrew_count IS 'Number of users following this creator';
COMMENT ON COLUMN public.user_profiles.crewing_count IS 'Number of creators this user is following';
COMMENT ON COLUMN public.user_profiles.haus_score IS 'Reputation score based on events, attendance, and engagement';
COMMENT ON COLUMN public.connections.follower_id IS 'User who is joining the PartyCrew (follower)';
COMMENT ON COLUMN public.connections.following_id IS 'Creator being followed (has the PartyCrew)';
