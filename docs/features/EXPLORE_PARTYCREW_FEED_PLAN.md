# Explore Page: Unified PartyCrew Content Feed
**Created:** November 1, 2025  
**Status:** Feature Specification  
**Priority:** High - Core Social Feature

---

## 🎯 Feature Vision

Transform the **Explore page** from a static template browser into a **dynamic social content feed** showing updates, events, and posts from **all PartyCrew members** the user is following.

**Key Concept:** Users join multiple PartyCrew (follow different creators), and the Explore page becomes their personalized discovery hub showing content from all their crews.

---

## 📱 Current vs New Explore Page

### Current Explore Page (Template Browser)

```
┌─────────────────────────────────┐
│  🔍 Explore                     │
│                                  │
│  [Search Templates]              │
│                                  │
│  🎉 Event Templates             │
│  ┌────────┐ ┌────────┐         │
│  │Birthday│ │Wedding │         │
│  │  🎂    │ │  💒    │         │
│  └────────┘ └────────┘         │
│  ┌────────┐ ┌────────┐         │
│  │ Pool   │ │Corporate│        │
│  │ Party  │ │  Event │         │
│  └────────┘ └────────┘         │
└─────────────────────────────────┘
```

**Problem:** Static, no personalization, no social element

---

### New Explore Page (PartyCrew Feed)

```
┌─────────────────────────────────────────────┐
│  🔍 Explore                                 │
│                                             │
│  [All Crews] [Templates] [Discover]        │
│      ↑ Active tab                          │
│                                             │
│  🎭 Crewing With (5):                      │
│  ┌──┐┌──┐┌──┐┌──┐┌──┐ [See All]          │
│  │🎵││💍││🏢││🎨││🎪│                      │
│  └──┘└──┘└──┘└──┘└──┘                      │
│   DJ  Wed Rest Dsgn Comm                   │
│                                             │
│  📣 Feed from Your Crews                   │
│  ┌───────────────────────────────────┐    │
│  │ 🎵 DJ Marcus • 2h ago             │    │
│  │ 📸 Behind the decks tonight!       │    │
│  │ [Image: DJ booth setup]            │    │
│  │ ❤️ 127  💬 23  🔗 Share           │    │
│  └───────────────────────────────────┘    │
│                                             │
│  ┌───────────────────────────────────┐    │
│  │ 💍 Sarah • 5h ago                 │    │
│  │ 🎉 New Event: Summer Wedding Fair  │    │
│  │ [Event Card Preview]               │    │
│  │ 📅 July 20 • 150 guests           │    │
│  │ 🎟️ [RSVP Now]                     │    │
│  └───────────────────────────────────┘    │
│                                             │
│  ┌───────────────────────────────────┐    │
│  │ 🏢 Urban Venue • 8h ago           │    │
│  │ 📊 Poll: Which menu for Friday?   │    │
│  │ 🍕 Pizza (45%)  ██████             │    │
│  │ 🌮 Tacos (30%)  ████               │    │
│  │ 🍔 Burgers (25%) ███               │    │
│  │ [Vote • 2 days left]               │    │
│  └───────────────────────────────────┘    │
│                                             │
│  [Load More]                               │
└─────────────────────────────────────────────┘
```

**Benefits:**
- ✅ Personalized content from creators you care about
- ✅ Discover events through social connections
- ✅ Engage with content (like, comment, share)
- ✅ See what your crews are up to in real-time
- ✅ Templates still accessible via tab

---

## 🏗️ Architecture Overview

### Page Structure

```
Explore Page (Tabs)
├── All Crews Tab (Default) ← NEW PRIMARY FEATURE
│   ├── Crewing With Section (Horizontal Scroll)
│   ├── Content Feed (Infinite Scroll)
│   └── Empty State (If not crewing with anyone)
│
├── Templates Tab (Existing, Moved)
│   ├── Search Bar
│   ├── Category Filters
│   └── Template Grid
│
└── Discover Tab (New)
    ├── Suggested Creators
    ├── Trending Events
    └── Popular in Your Area
```

---

## 📊 Database Schema

### Content Posts Table

```sql
CREATE TABLE partycrew_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Content
  content_type TEXT NOT NULL, -- 'update', 'photo', 'video', 'poll', 'event_announcement', 'tip', 'recap'
  title TEXT,
  body TEXT,
  media_urls TEXT[], -- Array of image/video URLs
  
  -- Event Link (if type = event_announcement)
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  
  -- Poll Data (if type = poll)
  poll_options JSONB, -- [{"id": "1", "text": "Pizza", "votes": 45}, ...]
  poll_ends_at TIMESTAMPTZ,
  poll_allow_multiple BOOLEAN DEFAULT false,
  
  -- Metadata
  visibility TEXT DEFAULT 'crew', -- 'crew', 'public', 'private'
  is_pinned BOOLEAN DEFAULT false, -- Pin to top of profile
  
  -- Engagement Metrics (denormalized)
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_at TIMESTAMPTZ, -- For scheduled posts
  published_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_partycrew_posts_creator ON partycrew_posts(creator_id, published_at DESC);
CREATE INDEX idx_partycrew_posts_type ON partycrew_posts(content_type);
CREATE INDEX idx_partycrew_posts_event ON partycrew_posts(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX idx_partycrew_posts_published ON partycrew_posts(published_at DESC);

-- Content Engagement
CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES partycrew_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX idx_post_likes_post ON post_likes(post_id);
CREATE INDEX idx_post_likes_user ON post_likes(user_id);

CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES partycrew_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE, -- For replies
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_post_comments_post ON post_comments(post_id, created_at);
CREATE INDEX idx_post_comments_user ON post_comments(user_id);
CREATE INDEX idx_post_comments_parent ON post_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;

CREATE TABLE post_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES partycrew_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  shared_to TEXT, -- 'feed', 'external', 'message'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_post_shares_post ON post_shares(post_id);
CREATE INDEX idx_post_shares_user ON post_shares(user_id);

CREATE TABLE poll_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES partycrew_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  option_id TEXT NOT NULL, -- References poll_options JSON
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id, option_id) -- Allow multiple if poll allows
);

CREATE INDEX idx_poll_votes_post ON poll_votes(post_id);
CREATE INDEX idx_poll_votes_user ON poll_votes(user_id);
```

### Feed Algorithm Tables

```sql
-- Track what user has seen (for "mark as read")
CREATE TABLE feed_read_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES partycrew_posts(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

CREATE INDEX idx_feed_read_user ON feed_read_status(user_id, viewed_at DESC);

-- Track content preferences for algorithm
CREATE TABLE content_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES partycrew_posts(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL, -- 'view', 'like', 'comment', 'share', 'click', 'skip'
  duration_seconds INTEGER, -- For 'view' interactions
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_interactions_user ON content_interactions(user_id, created_at DESC);
CREATE INDEX idx_content_interactions_type ON content_interactions(interaction_type);
```

---

## 🔌 API Endpoints

### Content Feed APIs

```typescript
// GET /api/feed/crew - Get personalized feed from crews user is following
// Query params:
// - page: number (pagination)
// - limit: number (default 20)
// - content_types: string[] (filter by type)
// - creator_id: UUID (filter by specific creator)
// Response: { posts: Post[], nextPage: number, hasMore: boolean }

// GET /api/posts/[id] - Get single post details
// Response: Post with full comments, likes count, etc.

// GET /api/posts/trending - Get trending posts across platform
// Query params: time_range ('day', 'week', 'month')

// POST /api/posts - Create new post
// Body: { content_type, title, body, media_urls, event_id?, poll_options?, visibility }
// Auth: Required (must be event creator)

// PATCH /api/posts/[id] - Update post
// Body: { title?, body?, media_urls? }
// Auth: Required (must be post creator)

// DELETE /api/posts/[id] - Delete post
// Auth: Required (must be post creator)
```

### Engagement APIs

```typescript
// POST /api/posts/[id]/like - Like a post
// DELETE /api/posts/[id]/like - Unlike a post

// GET /api/posts/[id]/likes - Get users who liked post
// Query params: page, limit

// POST /api/posts/[id]/comment - Add comment
// Body: { body, parent_comment_id? }

// GET /api/posts/[id]/comments - Get post comments
// Query params: page, limit, sort ('recent', 'top')

// DELETE /api/comments/[id] - Delete comment
// Auth: Required (comment author or post creator)

// POST /api/posts/[id]/share - Share post
// Body: { shared_to: 'feed' | 'external' }

// POST /api/polls/[postId]/vote - Vote on poll
// Body: { option_id: string }

// GET /api/polls/[postId]/results - Get poll results
```

### Creator Content APIs

```typescript
// GET /api/users/[id]/posts - Get creator's posts
// Query params: page, limit, content_types

// GET /api/users/[id]/stats - Get creator's content stats
// Response: { total_posts, total_likes, total_comments, avg_engagement }

// POST /api/posts/schedule - Schedule future post
// Body: { ...post_data, scheduled_at: timestamp }

// GET /api/posts/scheduled - Get user's scheduled posts
```

---

## 📱 UI Components

### 1. CrewingWithBar Component

**Purpose:** Horizontal scrollable list of creators user is following

```typescript
// /apps/mobile/components/partycrew/CrewingWithBar.tsx

interface CrewingWithBarProps {
  onCrewSelect?: (creatorId: string | null) => void; // null = show all
  selectedCrewId?: string | null;
}

<CrewingWithBar 
  onCrewSelect={(id) => filterFeedByCreator(id)}
  selectedCrewId={activeFilter}
/>
```

**Design:**
```
┌────────────────────────────────────────┐
│  🎭 Crewing With (5):                 │
│  ┌────┐┌────┐┌────┐┌────┐┌────┐      │
│  │ 🎵 ││ 💍 ││ 🏢 ││ 🎨 ││ +  │      │
│  │ DJ ││Wed ││Rest││Dsgn││All │      │
│  └────┘└────┘└────┘└────┘└────┘      │
│  Marcus Sarah Urban Emma  (12)        │
└────────────────────────────────────────┘
```

**Features:**
- Avatar with online indicator (green dot)
- Unread content badge (red dot)
- Tap to filter feed by that creator
- "+All" button shows full list modal
- Empty state: "Join a PartyCrew to see content"

---

### 2. ContentFeedCard Component

**Purpose:** Display different content types in unified feed

```typescript
// /apps/mobile/components/partycrew/ContentFeedCard.tsx

interface ContentFeedCardProps {
  post: PartyCrewPost;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onCreatorPress: () => void;
  onEventPress?: () => void; // If event announcement
}
```

**Content Type Variations:**

#### A. Update/Text Post
```
┌─────────────────────────────────────┐
│ 🎵 DJ Marcus • 2h ago              │
│ [Join PartyCrew] ←(if not crewing) │
│                                     │
│ "Setting up for tonight's set!     │
│  Who's coming out? 🔥"             │
│                                     │
│ ❤️ 127  💬 23  🔗 Share            │
└─────────────────────────────────────┘
```

#### B. Photo/Video Post
```
┌─────────────────────────────────────┐
│ 💍 Sarah • 5h ago                  │
│                                     │
│ "Behind-the-scenes of today's      │
│  wedding setup ✨"                 │
│                                     │
│ [┌───────────────────────┐]        │
│  │   [Image Gallery]     │         │
│  │   1/5 →               │         │
│  └───────────────────────┘         │
│                                     │
│ ❤️ 234  💬 45  🔗 Share            │
└─────────────────────────────────────┘
```

#### C. Event Announcement
```
┌─────────────────────────────────────┐
│ 🏢 Urban Venue • 8h ago            │
│                                     │
│ 🎉 New Event Posted!               │
│ ┌─────────────────────────────┐   │
│ │ 🎵 Summer Night Vibes       │   │
│ │ 📅 July 15 • 8:00 PM        │   │
│ │ 📍 Urban Rooftop            │   │
│ │ 👥 120/150 guests           │   │
│ │                              │   │
│ │ 💡 5 from your crew are     │   │
│ │    attending                 │   │
│ │                              │   │
│ │ [RSVP Now →]                │   │
│ └─────────────────────────────┘   │
│                                     │
│ ❤️ 89  💬 12  🔗 Share             │
└─────────────────────────────────────┘
```

#### D. Poll Post
```
┌─────────────────────────────────────┐
│ 🎪 Community Hub • 1d ago          │
│                                     │
│ 📊 What should we do next weekend? │
│                                     │
│ 🎬 Movie Night                     │
│ ████████████░░░░░░░░ 45%           │
│                                     │
│ 🎮 Game Tournament                 │
│ ████████░░░░░░░░░░░░ 30%           │
│                                     │
│ 🎨 Art Workshop                    │
│ ██████░░░░░░░░░░░░░░ 25%           │
│                                     │
│ [Vote] • 234 votes • 1 day left    │
│                                     │
│ ❤️ 156  💬 34  🔗 Share            │
└─────────────────────────────────────┘
```

#### E. Tip/Educational Post
```
┌─────────────────────────────────────┐
│ 💍 Sarah • 2d ago                  │
│                                     │
│ 💡 Tip: 5 Ways to Save on Your     │
│    Wedding Budget                   │
│                                     │
│ 1. Buffet-style (40% savings)      │
│ 2. Friday weddings (30% off)       │
│ 3. DIY centerpieces                │
│ [Read More →]                      │
│                                     │
│ 🔖 Save for later                  │
│                                     │
│ ❤️ 567  💬 89  🔗 Share            │
└─────────────────────────────────────┘
```

#### F. Event Recap Post
```
┌─────────────────────────────────────┐
│ 🎵 DJ Marcus • 12h ago             │
│                                     │
│ 🎉 Last night was LEGENDARY!       │
│                                     │
│ [Photo Carousel: 8 photos]         │
│                                     │
│ 📊 By the numbers:                 │
│ • 200 amazing humans               │
│ • 6 hours non-stop                 │
│ • 100% energy                      │
│                                     │
│ Tagged: @alex @maria +15 others    │
│                                     │
│ ❤️ 890  💬 156  🔗 Share           │
└─────────────────────────────────────┘
```

---

### 3. ContentCreationModal Component

**Purpose:** Allow creators to post content

```typescript
// /apps/mobile/components/partycrew/ContentCreationModal.tsx

<ContentCreationModal 
  visible={showCreateModal}
  onClose={() => setShowCreateModal(false)}
  onSuccess={(post) => refreshFeed()}
/>
```

**Design:**
```
┌─────────────────────────────────────┐
│  ← Create Post               [Post] │
│                                     │
│  📝 What's happening?               │
│  ┌─────────────────────────────┐   │
│  │ Type your update...         │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  Post Type:                         │
│  [📸 Photo] [📊 Poll] [🎉 Event]   │
│  [💡 Tip] [🎬 Recap]                │
│                                     │
│  📷 Add Photos/Videos (0/10)        │
│  [+ Add Media]                      │
│                                     │
│  🔒 Visible to: PartyCrew ▼         │
│                                     │
│  ⏰ Schedule for later (optional)   │
│  [Set Date/Time]                    │
│                                     │
└─────────────────────────────────────┘
```

**Features:**
- Rich text editor with formatting
- Media upload (photos/videos)
- Content type selector
- Visibility settings (crew/public)
- Schedule future posts
- Event linking (for announcements)
- Poll creation interface
- Preview before posting

---

### 4. FeedFilterTabs Component

**Purpose:** Switch between feed views

```
┌──────────────────────────────────┐
│ [All Crews] [Templates] [Discover]│
│     ↑ Active                      │
└──────────────────────────────────┘
```

**Tabs:**
1. **All Crews** - Personalized feed from followed creators
2. **Templates** - Browse event templates (existing feature)
3. **Discover** - Find new creators, trending content

---

### 5. EmptyStateView Component

**When user isn't crewing with anyone:**

```
┌─────────────────────────────────────┐
│                                     │
│           🎭                        │
│                                     │
│    Join a PartyCrew to see         │
│    content here!                    │
│                                     │
│    Follow event creators to get:   │
│    • Early event access            │
│    • Behind-the-scenes content     │
│    • Exclusive updates             │
│                                     │
│    [Discover Creators →]           │
│                                     │
└─────────────────────────────────────┘
```

---

## 🎨 Feed Algorithm Logic

### Content Ranking Formula

```typescript
interface FeedScore {
  recency_score: number;      // 0-100 (newer = higher)
  engagement_score: number;   // 0-100 (likes, comments, shares)
  creator_affinity: number;   // 0-100 (user's interaction with creator)
  content_type_pref: number;  // 0-100 (user's content type preferences)
  social_proof: number;       // 0-100 (mutual crew engagement)
}

function calculateFeedRank(post: Post, user: User): number {
  const scores = {
    recency_score: calculateRecency(post.published_at),
    engagement_score: calculateEngagement(post),
    creator_affinity: getUserCreatorAffinity(user.id, post.creator_id),
    content_type_pref: getUserContentTypePref(user.id, post.content_type),
    social_proof: getMutualCrewEngagement(post.id, user.id)
  };
  
  // Weighted average
  return (
    scores.recency_score * 0.25 +
    scores.engagement_score * 0.20 +
    scores.creator_affinity * 0.25 +
    scores.content_type_pref * 0.15 +
    scores.social_proof * 0.15
  );
}
```

### Recency Calculation

```typescript
function calculateRecency(publishedAt: Date): number {
  const hoursAgo = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60);
  
  if (hoursAgo < 1) return 100;
  if (hoursAgo < 6) return 90;
  if (hoursAgo < 24) return 75;
  if (hoursAgo < 48) return 50;
  if (hoursAgo < 168) return 25; // 1 week
  return 10;
}
```

### Engagement Score

```typescript
function calculateEngagement(post: Post): number {
  const totalInteractions = 
    post.likes_count + 
    (post.comments_count * 2) + // Comments worth 2x
    (post.shares_count * 3);    // Shares worth 3x
    
  const viewRate = post.likes_count / Math.max(post.views_count, 1);
  
  // Normalize to 0-100
  const rawScore = Math.log10(totalInteractions + 1) * 20;
  const qualityBoost = viewRate * 20;
  
  return Math.min(rawScore + qualityBoost, 100);
}
```

### Creator Affinity

```typescript
function getUserCreatorAffinity(userId: string, creatorId: string): number {
  // How often user engages with this creator's content
  const recentInteractions = getRecentInteractions(userId, creatorId, 30); // 30 days
  const totalCreatorPosts = getCreatorPostCount(creatorId, 30);
  
  const interactionRate = recentInteractions / Math.max(totalCreatorPosts, 1);
  
  // Bonus for event attendance
  const hasAttendedEvents = hasAttendedCreatorEvents(userId, creatorId);
  const attendanceBonus = hasAttendedEvents ? 20 : 0;
  
  return Math.min((interactionRate * 80) + attendanceBonus, 100);
}
```

### Content Type Preference

```typescript
function getUserContentTypePref(userId: string, contentType: string): number {
  // What types of content does user engage with most?
  const userInteractions = getUserContentInteractions(userId, 30);
  
  const typeInteractions = userInteractions.filter(i => i.content_type === contentType).length;
  const totalInteractions = userInteractions.length;
  
  if (totalInteractions === 0) return 50; // Neutral for new users
  
  const preference = (typeInteractions / totalInteractions) * 100;
  return Math.min(preference * 1.2, 100); // Slight boost to preferred types
}
```

### Social Proof Score

```typescript
function getMutualCrewEngagement(postId: string, userId: string): number {
  // How many of user's crew have engaged with this post?
  const mutualCrew = getMutualCrewMembers(userId);
  const engagedMutualCrew = getPostEngagements(postId, mutualCrew.map(c => c.id));
  
  if (mutualCrew.length === 0) return 0;
  
  const engagementRate = engagedMutualCrew.length / mutualCrew.length;
  return engagementRate * 100;
}
```

---

## 🔔 Real-Time Updates

### WebSocket Events

```typescript
// Subscribe to feed updates
socket.on('feed:new-post', (post: Post) => {
  // Show notification banner: "New post from DJ Marcus"
  prependToFeed(post);
});

socket.on('feed:post-updated', (postId: string, changes: Partial<Post>) => {
  // Update post in feed (edit, new comments, like count)
  updatePostInFeed(postId, changes);
});

socket.on('feed:post-deleted', (postId: string) => {
  // Remove from feed
  removePostFromFeed(postId);
});

// Real-time engagement updates
socket.on('post:like', ({ postId, count }) => {
  updateLikeCount(postId, count);
});

socket.on('post:comment', ({ postId, count }) => {
  updateCommentCount(postId, count);
});
```

### Optimistic UI Updates

```typescript
// When user likes a post
async function likePost(postId: string) {
  // 1. Update UI immediately (optimistic)
  updateLocalLikeState(postId, true);
  incrementLocalLikeCount(postId);
  
  try {
    // 2. Send to server
    await api.post(`/api/posts/${postId}/like`);
  } catch (error) {
    // 3. Rollback on failure
    updateLocalLikeState(postId, false);
    decrementLocalLikeCount(postId);
    showError('Failed to like post');
  }
}
```

---

## 📊 Content Analytics for Creators

### Creator Dashboard

```
┌─────────────────────────────────────┐
│  📊 Your Content Stats (30 days)   │
│                                     │
│  📝 Posts: 24                       │
│  👁️ Views: 12,450                  │
│  ❤️ Likes: 1,890                   │
│  💬 Comments: 234                   │
│  🔗 Shares: 89                      │
│                                     │
│  📈 Engagement Rate: 18.2%          │
│  🎯 Avg. Post Reach: 518 people    │
│                                     │
│  🔥 Top Post:                       │
│  "Behind-the-scenes setup"          │
│  2,340 views • 456 likes           │
│                                     │
│  📅 Best Time to Post:              │
│  Friday 6-8 PM                      │
│                                     │
│  [View Full Analytics →]            │
└─────────────────────────────────────┘
```

### Post Performance Metrics

```typescript
interface PostAnalytics {
  views: number;
  unique_viewers: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number; // Bookmarks
  clicks: number; // Link/event clicks
  
  // Calculated
  engagement_rate: number; // (likes + comments + shares) / views
  click_through_rate: number; // clicks / views
  
  // Audience
  viewer_demographics: {
    age_ranges: Record<string, number>;
    locations: Record<string, number>;
    crew_vs_non_crew: { crew: number; public: number };
  };
  
  // Time-based
  views_by_hour: Record<number, number>; // 0-23
  peak_engagement_time: string;
}
```

---

## 🎯 User Flows

### Flow 1: Discovering Content from Crews

```
1. User opens Explore tab
2. Sees "All Crews" tab (default)
3. Top: Horizontal scroll of creators they're crewing with
4. Below: Feed of content from those creators
5. User scrolls through feed (infinite scroll)
6. Sees mix of: updates, photos, events, polls, tips
7. User likes a post → Optimistic UI update
8. User comments → Comment modal opens
9. User taps creator avatar → Profile screen
10. User taps event card → Event details
```

---

### Flow 2: Filtering Feed by Specific Creator

```
1. User in "All Crews" feed
2. Taps on specific creator avatar in CrewingWithBar
3. Feed filters to show only that creator's content
4. Breadcrumb shows: "Showing: DJ Marcus" [x]
5. User can tap [x] to return to all crews
```

---

### Flow 3: Creating Content (Creators Only)

```
1. Creator taps [+] FAB in Explore tab
2. ContentCreationModal opens
3. Creator selects content type (photo, poll, event, tip)
4. Fills in title, body, media
5. Selects visibility (PartyCrew / Public)
6. Optionally schedules for later
7. Taps [Post]
8. Success toast: "Posted to your PartyCrew!"
9. Post appears at top of feed
10. Crew members get notification
```

---

### Flow 4: Engaging with Poll

```
1. User sees poll in feed
2. Reads poll question and options
3. Taps desired option
4. UI updates immediately (optimistic)
5. Shows updated vote percentages
6. Displays "You voted for Pizza"
7. User can change vote (if allowed)
8. User can see who voted for what (if public)
```

---

### Flow 5: Joining PartyCrew from Content

```
1. User sees content from creator they don't follow
2. Post shows "Join PartyCrew" button
3. User taps button
4. Button changes to "Crewing ✓"
5. Creator avatar appears in CrewingWithBar
6. User now sees future posts from this creator
7. Creator gets notification: "New crew member!"
```

---

## 🎨 Design System Integration

### Colors

```typescript
// Add to /apps/mobile/constants/design-system.ts

export const ContentColors = {
  // Post Types
  update: colors.neutral600,
  photo: colors.accent,
  video: colors.primary,
  poll: colors.warning,
  event: colors.success,
  tip: colors.info,
  recap: colors.secondary,
  
  // Engagement
  liked: colors.error, // Red heart
  unliked: colors.neutral400,
  commented: colors.primary,
  shared: colors.success,
  
  // States
  unread: colors.primary,
  read: colors.neutral300,
};
```

### Typography

```typescript
export const ContentTypography = {
  creatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  timestamp: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    color: colors.text,
  },
  postBody: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  engagementCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
};
```

### Icons

```typescript
export const ContentIcons = {
  update: '📝',
  photo: '📸',
  video: '🎬',
  poll: '📊',
  event: '🎉',
  tip: '💡',
  recap: '🎪',
  
  like: '❤️',
  comment: '💬',
  share: '🔗',
  save: '🔖',
  
  verified: '✓',
  pinned: '📌',
};
```

---

## 🚀 Implementation Phases

### Phase 1: Core Feed (Week 1-2)

**Goals:**
- Display basic feed from followed creators
- Show text posts with engagement buttons
- Implement like functionality
- Basic infinite scroll

**Deliverables:**
- ✅ Database schema created
- ✅ Feed API endpoint
- ✅ ContentFeedCard component (text posts)
- ✅ Like/unlike functionality
- ✅ Basic feed algorithm (recency-based)

---

### Phase 2: Content Types (Week 3-4)

**Goals:**
- Support multiple content types
- Add photo/video posts
- Add event announcements
- Add polls

**Deliverables:**
- ✅ Media upload functionality
- ✅ Photo/video post rendering
- ✅ Event announcement cards
- ✅ Poll creation and voting
- ✅ Content type icons/badges

---

### Phase 3: Engagement (Week 5-6)

**Goals:**
- Comments system
- Share functionality
- Real-time updates
- Engagement analytics

**Deliverables:**
- ✅ Comment modal
- ✅ Nested comments/replies
- ✅ Share functionality
- ✅ WebSocket integration
- ✅ Optimistic UI updates
- ✅ Basic analytics dashboard

---

### Phase 4: Discovery & Filtering (Week 7-8)

**Goals:**
- CrewingWithBar component
- Feed filtering
- Empty states
- Discover tab

**Deliverables:**
- ✅ Horizontal creator scroll
- ✅ Filter by creator
- ✅ Empty state designs
- ✅ Suggested creators
- ✅ Trending content

---

### Phase 5: Content Creation (Week 9-10)

**Goals:**
- Creator content posting
- Media upload
- Scheduling
- Rich editor

**Deliverables:**
- ✅ ContentCreationModal
- ✅ Media picker/uploader
- ✅ Content scheduling
- ✅ Draft saving
- ✅ Preview before post

---

### Phase 6: Advanced Features (Week 11-12)

**Goals:**
- Advanced algorithm
- Notifications
- Analytics dashboard
- Performance optimization

**Deliverables:**
- ✅ ML-based feed ranking
- ✅ Push notifications
- ✅ Creator analytics
- ✅ Feed caching
- ✅ Image optimization

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Feed algorithm tests
test('calculateRecency: recent posts score higher', () => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  expect(calculateRecency(oneHourAgo)).toBeGreaterThan(calculateRecency(oneDayAgo));
});

// Engagement tests
test('likePost: optimistic update then API call', async () => {
  const { result } = renderHook(() => useLikePost());
  
  await act(async () => {
    await result.current.likePost('post-123');
  });
  
  expect(result.current.isLiked).toBe(true);
  expect(mockApi.post).toHaveBeenCalledWith('/api/posts/post-123/like');
});
```

### Integration Tests

```typescript
// Feed loading test
test('loads feed from followed creators', async () => {
  const { getByTestId } = render(<ExploreFeed />);
  
  await waitFor(() => {
    expect(getByTestId('feed-container')).toBeTruthy();
  });
  
  // Should show posts from followed creators
  expect(getByTestId('post-from-dj-marcus')).toBeTruthy();
  expect(getByTestId('post-from-sarah')).toBeTruthy();
});

// Filtering test
test('filters feed by selected creator', async () => {
  const { getByTestId, queryByTestId } = render(<ExploreFeed />);
  
  // Tap creator filter
  fireEvent.press(getByTestId('creator-filter-marcus'));
  
  await waitFor(() => {
    // Should only show Marcus posts
    expect(getByTestId('post-from-dj-marcus')).toBeTruthy();
    expect(queryByTestId('post-from-sarah')).toBeNull();
  });
});
```

### E2E Tests

```typescript
// Complete flow test
test('user can engage with content in feed', async () => {
  await device.launchApp();
  
  // Navigate to Explore
  await element(by.text('Explore')).tap();
  
  // Wait for feed to load
  await waitFor(element(by.id('feed-container'))).toBeVisible();
  
  // Like first post
  await element(by.id('like-button')).atIndex(0).tap();
  await expect(element(by.id('like-count'))).toHaveText('128');
  
  // Open comments
  await element(by.id('comment-button')).atIndex(0).tap();
  await expect(element(by.id('comment-modal'))).toBeVisible();
  
  // Add comment
  await element(by.id('comment-input')).typeText('Great content!');
  await element(by.id('post-comment-button')).tap();
  await expect(element(by.text('Great content!'))).toBeVisible();
});
```

---

## 📈 Success Metrics

### Engagement Metrics

```
Target (3 months post-launch):
- 40% of users engage with feed daily
- Average 5 posts viewed per session
- 15% engagement rate (like/comment/share per view)
- 3+ comments per post average
- 20% share rate on event announcements
```

### Content Creation Metrics

```
Target:
- 20% of creators post weekly
- Average 3 posts per active creator per week
- 60% of posts get engagement within 24hrs
- 30% conversion: feed view → event RSVP
```

### Growth Metrics

```
Target:
- Feed drives 40% of new crew connections
- 50% of event discoveries come from feed
- 25% increase in event attendance (vs no feed)
```

---

## 🎯 Key Features Summary

### For Users (Crew Members):

1. ✅ **Personalized Feed** - Content from all followed creators
2. ✅ **Filter by Creator** - Focus on specific crews
3. ✅ **Multiple Content Types** - Updates, photos, polls, events, tips
4. ✅ **Engagement** - Like, comment, share on posts
5. ✅ **Discovery** - Find new creators through content
6. ✅ **Real-time Updates** - Live content and engagement
7. ✅ **Empty State Guidance** - Clear CTAs when new

### For Creators:

1. ✅ **Content Publishing** - Post updates to PartyCrew
2. ✅ **Multiple Formats** - Text, photo, video, poll, event
3. ✅ **Scheduling** - Plan content in advance
4. ✅ **Analytics** - Track post performance
5. ✅ **Event Promotion** - Direct link to events
6. ✅ **Audience Growth** - Crew join CTA on every post
7. ✅ **Engagement Insights** - See who's engaging

---

## 🚧 Technical Considerations

### Performance

```typescript
// Pagination
const POSTS_PER_PAGE = 20;

// Caching strategy
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Image optimization
const IMAGE_QUALITY = {
  thumbnail: 0.6,
  feed: 0.8,
  fullscreen: 0.95
};

// Lazy loading
const LAZY_LOAD_THRESHOLD = 3; // Load when 3 posts from bottom
```

### Data Sync

```typescript
// Offline support
const offlineQueue = [];

async function syncWhenOnline() {
  if (!navigator.onLine) {
    offlineQueue.push(action);
    return;
  }
  
  // Process queue when back online
  for (const action of offlineQueue) {
    await executeAction(action);
  }
  offlineQueue.length = 0;
}
```

### Security

```typescript
// Content moderation
async function moderateContent(post: Post): Promise<boolean> {
  // Check for profanity
  const hasProfanity = await profanityFilter.check(post.body);
  if (hasProfanity) return false;
  
  // Check for spam
  const isSpam = await spamDetector.check(post);
  if (isSpam) return false;
  
  // Check image content
  if (post.media_urls.length > 0) {
    const hasInappropriateImage = await imageModeration.check(post.media_urls);
    if (hasInappropriateImage) return false;
  }
  
  return true;
}

// Rate limiting
const POST_RATE_LIMIT = {
  maxPosts: 10,
  windowMinutes: 60
};
```

---

## 📝 Next Steps

### Immediate Actions:

1. ✅ **Review & Approve Plan** with team
2. ✅ **Design UI Mockups** in Figma
3. ✅ **Create Database Schema** in Supabase
4. ✅ **Set Up API Endpoints** structure
5. ✅ **Start Phase 1 Implementation**

### Future Enhancements (V2):

- **Stories** - Instagram-style ephemeral content
- **Live Streaming** - Stream events in real-time
- **Direct Messages** - DM creators
- **Saved Collections** - Bookmark content
- **Content Templates** - Quick post creation
- **Collaboration Posts** - Multi-creator posts
- **Sponsored Content** - Monetization for creators

---

## 🎉 Bottom Line

**Transform Explore page from:**
- ❌ Static template browser
- ❌ No personalization
- ❌ No social engagement

**Into:**
- ✅ Dynamic PartyCrew content feed
- ✅ Personalized to user's crews
- ✅ Rich engagement (like, comment, share, poll)
- ✅ Event discovery through social connections
- ✅ Creator content showcase
- ✅ Real-time updates

**Result:** Users stay engaged between events, discover new events through trusted creators, and build stronger connections with their PartyCrew! 🚀
