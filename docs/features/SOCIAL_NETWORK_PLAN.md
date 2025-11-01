# PartyHaus Social Network Feature Plan
**Created:** November 1, 2025  
**Status:** Planning Phase  
**Priority:** High - Core Feature

## 🎯 Vision

Transform PartyHaus from an event management tool into a **social event discovery platform** where users can:
- Build their event creator network ("Crew")
- Discover events through social connections
- Follow favorite hosts and venues
- See social proof (friends attending)
- Create communities around event experiences

---

## 🏷️ Brand Identity & Terminology

### ✅ SELECTED: **"PartyCrew"** 🎉

**The official brand name for PartyHaus's social network feature.**

#### PartyCrew Terminology

- **Follow** → **"Join PartyCrew"**
- **Followers** → **"PartyCrew"** or **"PartyCrew Members"**
- **Following** → **"Crewing With"**
- **Feed** → **"Crew Feed"** or **"PartyCrew Feed"**
- **Follower Count** → **"PartyCrew Size"** or **"Crew Count"**
- **Social Network** → **"Your PartyCrew"**

#### Why "PartyCrew" Works:
- ✅ Distinct from "Guests" (attendees) - clear differentiation
- ✅ Brand-aligned with "PartyHaus" name
- ✅ Energetic and action-oriented
- ✅ Works for all event types (parties, weddings, corporate)
- ✅ Memorable and unique to the platform
- ✅ Natural verbs ("Crew up", "Join crew", "Crewing with")

#### Critical Distinction:
**PartyCrew ≠ Guests**
- **PartyCrew** = Your followers on the platform (persistent social network)
- **Guests** = People attending a specific event (temporary, event-specific)
- See `/docs/features/CREW_VS_GUESTS_GUIDE.md` for complete differentiation

---

## 📊 Database Schema Design

### New Tables

```sql
-- User Profiles (Extended)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL, -- @partyking123
  display_name TEXT NOT NULL, -- "Alex the Party King"
  bio TEXT, -- 500 char max
  avatar_url TEXT,
  cover_photo_url TEXT,
  location TEXT, -- "Los Angeles, CA"
  website_url TEXT,
  
  -- PartyCrew Stats (denormalized for performance)
  partycrew_count INTEGER DEFAULT 0, -- followers (people who joined your crew)
  crewing_count INTEGER DEFAULT 0, -- following (crews you're part of)
  events_hosted INTEGER DEFAULT 0,
  events_attended INTEGER DEFAULT 0,
  haus_score INTEGER DEFAULT 0, -- reputation points
  
  -- Privacy Settings
  is_private BOOLEAN DEFAULT false,
  show_attending_events BOOLEAN DEFAULT true,
  show_crew_list BOOLEAN DEFAULT true,
  
  -- Verification
  is_verified BOOLEAN DEFAULT false, -- blue check for popular hosts
  account_type TEXT DEFAULT 'personal', -- personal, business, creator
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_haus_score ON user_profiles(haus_score DESC);
CREATE INDEX idx_user_profiles_location ON user_profiles(location);

-- Connections (Follows)
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Settings
  notify_on_events BOOLEAN DEFAULT true, -- notify when they create events
  notify_on_posts BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate follows
  UNIQUE(follower_id, following_id),
  -- Prevent self-follows
  CHECK (follower_id != following_id)
);

-- Indexes for fast lookups
CREATE INDEX idx_connections_follower ON connections(follower_id);
CREATE INDEX idx_connections_following ON connections(following_id);
CREATE INDEX idx_connections_created ON connections(created_at DESC);

-- Composite index for mutual follows check
CREATE INDEX idx_connections_mutual ON connections(follower_id, following_id);

-- Connection Requests (for private accounts)
CREATE TABLE connection_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- pending, accepted, rejected
  message TEXT, -- optional message with request
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(requester_id, target_id),
  CHECK (requester_id != target_id)
);

CREATE INDEX idx_connection_requests_target ON connection_requests(target_id, status);
CREATE INDEX idx_connection_requests_requester ON connection_requests(requester_id);

-- Event Attendees (enhanced with social features)
ALTER TABLE event_attendees ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES user_profiles(id);
ALTER TABLE event_attendees ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
CREATE INDEX idx_event_attendees_user ON event_attendees(user_id);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- new_follower, event_invite, friend_attending, event_reminder
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  
  -- Related entities
  actor_id UUID REFERENCES user_profiles(id), -- who triggered the notification
  event_id UUID REFERENCES events(id),
  
  -- State
  read BOOLEAN DEFAULT false,
  clicked BOOLEAN DEFAULT false,
  
  -- Action data (JSON for flexibility)
  action_data JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ -- auto-delete old notifications
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read, created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_expires ON notifications(expires_at) WHERE expires_at IS NOT NULL;

-- User Blocks (for moderation)
CREATE TABLE user_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

CREATE INDEX idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX idx_user_blocks_blocked ON user_blocks(blocked_id);
```

### Triggers for Denormalized Counts

```sql
-- Auto-update PartyCrew counts
CREATE OR REPLACE FUNCTION update_partycrew_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment follower's crewing_count
    UPDATE user_profiles 
    SET crewing_count = crewing_count + 1 
    WHERE id = NEW.follower_id;
    
    -- Increment following's partycrew_count
    UPDATE user_profiles 
    SET partycrew_count = partycrew_count + 1 
    WHERE id = NEW.following_id;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement counts
    UPDATE user_profiles 
    SET crewing_count = crewing_count - 1 
    WHERE id = OLD.follower_id;
    
    UPDATE user_profiles 
    SET partycrew_count = partycrew_count - 1 
    WHERE id = OLD.following_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_partycrew_counts
AFTER INSERT OR DELETE ON connections
FOR EACH ROW EXECUTE FUNCTION update_partycrew_counts();

-- Auto-update events_hosted count
CREATE OR REPLACE FUNCTION update_events_hosted()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_profiles 
    SET events_hosted = events_hosted + 1 
    WHERE id = NEW.organizer_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_profiles 
    SET events_hosted = events_hosted - 1 
    WHERE id = OLD.organizer_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_events_hosted
AFTER INSERT OR DELETE ON events
FOR EACH ROW EXECUTE FUNCTION update_events_hosted();
```

---

## 🔌 API Endpoints

### User Profiles

```typescript
// GET /api/users/[id] - Get user profile (public or own)
// GET /api/users/search?q=alex - Search users
// GET /api/users/suggested - Get suggested users to join their PartyCrew
// PATCH /api/users/me - Update own profile
// POST /api/users/me/avatar - Upload profile photo
```

### PartyCrew Connections (Follow System)

```typescript
// POST /api/partycrew/join - Join someone's PartyCrew (follow)
// POST /api/partycrew/leave - Leave someone's PartyCrew (unfollow)
// GET /api/partycrew/[userId] - Get someone's PartyCrew members (followers)
// GET /api/partycrew/[userId]/crewing-with - Get who they're crewing with (following)
// GET /api/partycrew/requests - Get pending crew join requests (private accounts)
// POST /api/partycrew/requests/[id]/accept - Accept crew join request
// POST /api/partycrew/requests/[id]/reject - Reject crew join request
// GET /api/partycrew/mutual?user_id=xxx - Check if mutual crew members
// GET /api/partycrew/status?user_id=xxx - Check crew membership status
```

### Social Feed (PartyCrew Content)

```typescript
// GET /api/feed - Get personalized feed (events from your PartyCrew)
// GET /api/feed/crew - Get events only from your PartyCrew
// GET /api/feed/trending - Get trending events in your network
// GET /api/feed/activity - Get recent activity from PartyCrew members
```

### Notifications

```typescript
// GET /api/notifications - Get user's notifications
// PATCH /api/notifications/[id]/read - Mark as read
// PATCH /api/notifications/read-all - Mark all as read
// DELETE /api/notifications/[id] - Delete notification
// POST /api/notifications/register-push - Register push token
```

---

## 📱 Mobile UI Components & Screens

### New Screens

#### 1. **ProfileScreen** (`/apps/mobile/app/profile/[id].tsx`)
```typescript
Components:
- ProfileHeader: Cover photo, avatar, display name, bio, location
- ProfileStats: PartyCrew count, events hosted/attended, Haus Score
- JoinCrewButton: States (Join PartyCrew, Crewing ✓, Requested, Edit Profile)
- EventsGrid: User's events in masonry layout
- TabView: Events / About / Reviews
```

#### 2. **PartyCrewListScreen** (`/apps/mobile/app/partycrew/[type].tsx`)
```typescript
// type: 'members' | 'crewing-with'
Components:
- SearchBar: Filter PartyCrew members
- UserCard: Avatar, name, bio snippet, mutual crew status
- JoinCrewButton: Quick join/leave PartyCrew
- SectionList: Alphabetical grouping
- EmptyState: "No PartyCrew members yet" vs "Not crewing with anyone yet"
```

#### 3. **DiscoverScreen** (Enhance Explore Tab)
```typescript
Components:
- SearchBar: Find users and events
- SuggestedCreators: Horizontal scroll cards with "Join PartyCrew" CTA
- CategoryTabs: All / Party Hosts / DJs / Venues / Planners
- UserDiscoveryCard: Large cards showing PartyCrew size, events hosted
- TrendingCreators: Leaderboard style with PartyCrew growth
```

#### 4. **NotificationsScreen** (`/apps/mobile/app/notifications.tsx`)
```typescript
Components:
- NotificationCard: Icon, avatar, message, timestamp, action
- Types: NewFollower, EventInvite, FriendAttending, EventReminder
- Swipe actions: Mark read, delete
- Empty state: "No notifications yet"
```

#### 5. **PartyCrew Feed** (Enhance Home Tab)
```typescript
Transform Dashboard to social feed:
- FilterTabs: All / My PartyCrew / Attending / Hosting
- EventFeedCard: Show creator profile, social proof ("5 from your PartyCrew attending")
- ActivityItem: "Alex joined Sarah's PartyCrew", "Marcus RSVP'd to Pool Party"
- Pull to refresh
- Infinite scroll
- Empty state: "Build your PartyCrew to see events here!"
```

### New Components

```typescript
// /apps/mobile/components/social/FollowButton.tsx
<FollowButton 
  userId="xxx"
  variant="default" | "compact" | "icon-only"
  onFollowChange={(isFollowing) => {}}
/>

// /apps/mobile/components/social/UserCard.tsx
<UserCard 
  user={userProfile}
  showFollowButton={true}
  onPress={() => router.push(`/profile/${user.id}`)}
/>

// /apps/mobile/components/social/CrewPreview.tsx
<CrewPreview 
  eventId="xxx"
  maxAvatars={5}
  showCount={true}
  label="crew attending"
/>

// /apps/mobile/components/social/SocialProof.tsx
<SocialProof 
  eventId="xxx"
  crewAttending={5}
  mutualConnections={["Alex", "Sam"]}
/>

// /apps/mobile/components/social/ProfileHeader.tsx
<ProfileHeader 
  profile={userProfile}
  isOwnProfile={false}
  onEdit={() => {}}
/>

// /apps/mobile/components/social/UserAvatar.tsx
<UserAvatar 
  avatarUrl="xxx"
  size="sm" | "md" | "lg" | "xl"
  verified={true}
  online={false}
/>
```

---

## 🎨 Design System Integration

### New Color Palette (Add to `/apps/mobile/constants/design-system.ts`)

```typescript
export const SocialColors = {
  // Profile & Social
  verified: '#0099FF', // Blue checkmark
  onlineStatus: '#00D66C', // Green dot
  crewBadge: '#FF006B', // Crew member badge (magenta)
  
  // Activity States
  following: colors.primary, // Use existing magenta
  notFollowing: colors.neutral300,
  pending: colors.warning,
  mutual: colors.accent,
  
  // Notification Types
  follower: '#9B51E0', // Purple
  event: colors.primary,
  activity: '#0099FF',
  reminder: colors.warning,
};

export const SocialTypography = {
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  displayName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  bio: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
};
```

### Component Variants

```typescript
export const SocialButtonVariants = {
  follow: {
    background: colors.primary,
    text: colors.white,
    label: 'Join Crew',
  },
  following: {
    background: colors.neutral200,
    text: colors.text,
    label: 'Crewing',
    icon: 'checkmark',
  },
  pending: {
    background: colors.warning + '20',
    text: colors.warning,
    label: 'Requested',
    disabled: true,
  },
};
```

---

## 🔄 User Flows

### Flow 1: Discovering & Following a Creator

```
1. User opens Explore tab
2. Sees "Suggested Creators" section
3. Taps on creator card → ProfileScreen opens
4. Views creator's events, bio, stats
5. Taps "Join Crew" button
   - If public account: Immediately following
   - If private account: Request sent, button shows "Requested"
6. Notification sent to creator (if private)
7. Creator appears in "Crewing With" list
8. User starts seeing creator's events in feed
```

### Flow 2: Social Event Discovery

```
1. User opens Home tab (now social feed)
2. Sees filter tabs: All / Crew / Attending
3. Taps "Crew" tab
4. Sees events from people they follow
5. Each event shows social proof: "3 people in your crew are attending"
6. Taps event → Event Details
7. Sees highlighted crew members in attendee list
8. Can share event to crew or invite specific crew members
```

### Flow 3: Profile Setup (Onboarding)

```
1. New user signs up
2. Modal overlay: "Complete Your Profile"
3. Step 1: Choose username (@partyking)
4. Step 2: Add display name + bio
5. Step 3: Upload profile photo (optional)
6. Step 4: Find friends (optional)
   - Import contacts
   - Search by username
   - See suggested creators
7. Step 5: Follow 3+ creators to personalize feed
8. Completion: "Welcome to the Crew! 🎉"
```

### Flow 4: Notifications & Engagement

```
1. User creates event
2. All crew members get notification: "Alex created a new event: Pool Party 🏊"
3. Crew members tap notification → Event Details
4. RSVP to event
5. Creator gets notification: "Sarah joined Pool Party"
6. Other crew see activity: "Sarah is attending Pool Party"
7. Creates viral loop of discovery
```

---

## 🎯 Gamification: Haus Score System

### How Haus Score is Calculated

```typescript
interface HausScoreFactors {
  eventsHosted: number;        // +10 points per event
  eventsAttended: number;      // +2 points per attendance
  crewSize: number;            // +1 point per 10 followers
  eventRating: number;         // +5 points per 5-star review
  responseRate: number;        // +20 points for >90% response rate
  consistency: number;         // +30 points for hosting monthly
  engagement: number;          // +5 points per event share
}

function calculateHausScore(factors: HausScoreFactors): number {
  return (
    factors.eventsHosted * 10 +
    factors.eventsAttended * 2 +
    Math.floor(factors.crewSize / 10) +
    factors.eventRating * 5 +
    (factors.responseRate > 0.9 ? 20 : 0) +
    (factors.consistency ? 30 : 0) +
    factors.engagement * 5
  );
}
```

### Badges & Achievements

```typescript
const Badges = {
  // Hosting
  FIRST_EVENT: { name: 'Haus Warming', icon: '🏠', points: 10 },
  EVENT_MASTER: { name: 'Event Master', icon: '🎯', requirement: '10 events hosted' },
  SUPER_HOST: { name: 'Super Host', icon: '⭐', requirement: '50 events hosted' },
  
  // Social
  SOCIAL_BUTTERFLY: { name: 'Social Butterfly', icon: '🦋', requirement: '100 crew members' },
  CONNECTOR: { name: 'Connector', icon: '🔗', requirement: '500 crew members' },
  INFLUENCER: { name: 'Influencer', icon: '👑', requirement: '1000 crew members' },
  
  // Engagement
  PARTY_ANIMAL: { name: 'Party Animal', icon: '🎉', requirement: '25 events attended' },
  VIP: { name: 'VIP', icon: '💎', requirement: '100 events attended' },
  LEGEND: { name: 'Legend', icon: '🏆', requirement: '500 events attended' },
  
  // Quality
  FIVE_STAR: { name: '5-Star Host', icon: '⭐⭐⭐⭐⭐', requirement: '10+ 5-star reviews' },
  TRUSTED: { name: 'Trusted', icon: '✅', requirement: '95% positive feedback' },
};
```

### Leaderboards

```typescript
// Weekly Top Creators
GET /api/leaderboard/creators?period=week

// Categories:
- Most Active Hosts (events this week)
- Fastest Growing Crew (new followers)
- Highest Rated Events (average rating)
- Most Social (engagement score)
- Rising Stars (new accounts with momentum)
```

---

## 🔐 Privacy & Safety Features

### Privacy Controls

```typescript
interface PrivacySettings {
  // Profile Visibility
  profileType: 'public' | 'private'; // Private requires follow approval
  
  // Content Visibility
  showEventsHosting: boolean;
  showEventsAttending: boolean;
  showCrewList: boolean;
  showActivityStatus: boolean; // "Active 2h ago"
  
  // Discovery
  discoverableInSearch: boolean;
  showInSuggestions: boolean;
  allowContactImport: boolean;
  
  // Interactions
  whoCanFollow: 'everyone' | 'crew' | 'nobody';
  whoCanInvite: 'everyone' | 'crew' | 'nobody';
  whoCanMessage: 'everyone' | 'crew' | 'nobody';
}
```

### Safety Features

1. **Block & Report**
   - Block users (they can't see profile/events)
   - Report users (spam, harassment, fake)
   - Hide specific content

2. **Content Moderation**
   - AI profanity filter for bios/usernames
   - Image moderation for avatars
   - Automatic flag for suspicious patterns

3. **Age Verification** (21+ Events)
   - Verify age for alcohol events
   - Restrict visibility to verified adults

---

## 📈 Analytics & Metrics to Track

### User Engagement Metrics

```typescript
// Creator Analytics Dashboard
interface CreatorAnalytics {
  // Followers
  crewGrowth: TimeSeriesData; // Daily new followers
  crewDemographics: { age: number; location: string; }[];
  
  // Events
  eventViews: number;
  eventClicks: number;
  eventShares: number;
  conversionRate: number; // Views → RSVPs
  
  // Engagement
  profileViews: number;
  avgTimeOnProfile: number;
  topReferralSources: string[];
  
  // Reach
  totalReach: number; // Unique users who saw events
  networkSize: number; // Direct + indirect crew
  viralCoefficient: number; // Avg invites per attendee
}
```

### Platform Metrics

```
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Follow Rate (follows per user)
- Network Density (avg mutual connections)
- Content Creation Rate (events per active creator)
- Discovery Effectiveness (suggested follows → actual follows)
- Notification CTR (click-through rate)
- Feed Engagement (time spent, scrolls, taps)
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1-2)
- ✅ Database schema creation
- ✅ Basic API endpoints (follow, unfollow, get profile)
- ✅ User profile screen
- ✅ Follow button component
- ✅ Username/display name setup

### Phase 2: Discovery (Week 3-4)
- ✅ Search functionality
- ✅ Discover screen with suggestions
- ✅ User cards and lists
- ✅ Crew lists (followers/following screens)
- ✅ Profile privacy settings

### Phase 3: Social Feed (Week 5-6)
- ✅ Feed algorithm (events from crew)
- ✅ Activity feed
- ✅ Social proof in event cards
- ✅ Crew preview in event details
- ✅ Share to crew feature

### Phase 4: Engagement (Week 7-8)
- ✅ Notifications system
- ✅ Push notifications
- ✅ Onboarding flow
- ✅ Profile completion prompts
- ✅ Badge system basics

### Phase 5: Gamification (Week 9-10)
- ✅ Haus Score calculation
- ✅ Badges and achievements
- ✅ Leaderboards
- ✅ Creator analytics dashboard
- ✅ Verification system

### Phase 6: Polish (Week 11-12)
- ✅ Advanced privacy controls
- ✅ Block/report system
- ✅ Performance optimization
- ✅ A/B testing for feed algorithm
- ✅ Launch preparation

---

## 🎨 UI/UX Design Principles

### Design Goals
1. **Frictionless Following**: One-tap to follow, visible everywhere
2. **Social Proof First**: Show crew context before event details
3. **Discovery Delight**: Surprise users with relevant creators
4. **Privacy Respect**: Clear controls, no dark patterns
5. **Performance**: Fast loading, optimistic updates, caching

### Key Interactions
- **Haptic Feedback**: Follow/unfollow button, profile tap
- **Pull to Refresh**: All feed screens
- **Infinite Scroll**: Feed, discover, crew lists
- **Optimistic Updates**: Instant UI response, background sync
- **Skeleton Loaders**: Professional loading states
- **Empty States**: Encouraging, actionable messages

---

## 🧪 Testing Strategy

### Unit Tests
- Follow/unfollow logic
- Privacy filters
- Haus Score calculation
- Feed algorithm

### Integration Tests
- API endpoint flows
- Database triggers
- Notification delivery
- Real-time updates

### E2E Tests
- Complete follow flow
- Profile creation & editing
- Event discovery through network
- Notification interactions

### User Testing
- A/B test: "Follow" vs "Join Crew" terminology
- Test: Feed algorithm variations
- Survey: Privacy concerns and preferences
- Monitor: Feature adoption rates

---

## 📝 Success Metrics

### Launch Targets (3 Months)
- 60% of users have > 5 crew members
- 40% of event RSVPs come from network feed
- 80% of new users complete profile setup
- 30% DAU engage with social features daily
- Average 3 follows per week per active user

### North Star Metric
**"Weekly Active Networked Users"** - Users who both:
1. Have ≥3 crew members
2. Engage with crew content (view events, attend, etc.)

---

## 🔮 Future Enhancements

### V2 Features
- **Direct Messaging**: Chat with crew members
- **Event Co-hosting**: Multiple organizers
- **Crew Events**: Private events only for crew
- **Stories/Updates**: Instagram-style ephemeral content
- **Live Streaming**: Stream events in real-time
- **Event Recommendations ML**: Personalized suggestions

### V3 Features
- **Communities**: Topic-based groups (EDM Fam, Wedding Planners)
- **Verification Program**: Blue check for established creators
- **Monetization**: Paid events, ticketing, sponsorships
- **API for Partners**: Venue integrations, ticket platforms
- **Web Platform**: Full-featured web app with social features

---

## 📚 References & Inspiration

### Platforms to Study
- **Instagram**: Follow UX, profile layouts, stories
- **LinkedIn**: Professional networking, suggestions algorithm
- **Eventbrite**: Event discovery, attendee management
- **Meetup**: Community building, group events
- **BeReal**: Authenticity, minimal design
- **Snapchat**: Ephemeral content, friend discovery

### Key Learnings
1. Make following **effortless and visible everywhere**
2. Show **social proof before commitment** (friends attending)
3. **Notifications drive engagement** but must be valuable
4. **Privacy is non-negotiable** - give users control
5. **Gamification works** when tied to real value

---

## ✅ Next Steps

1. **Choose Brand Terminology** (Crew vs Haus vs Squad)
2. **Review & Approve Schema** with team
3. **Create Design Mockups** in Figma
4. **Set Up Development Timeline**
5. **Start Phase 1: Foundation** implementation

---

**Questions? Feedback? Let's discuss!** 🎉
