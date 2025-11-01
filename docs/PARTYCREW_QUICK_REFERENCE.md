# PartyCrew Quick Reference Card

## 🚀 Quick Start

### Import Components
```typescript
import {
  JoinCrewButton,
  CrewingWithBar,
  ContentFeedCard
} from '@/components/partycrew';
```

### Import Hooks
```typescript
import {
  usePartyCrew,
  useCrewStatus,
  useCrewingWith,
  useUserProfile,
  useCrewFeed
} from '@/hooks/partycrew';
```

---

## 📱 Components

### JoinCrewButton
```typescript
<JoinCrewButton
  creatorId="abc123"
  variant="default" // "default" | "outline" | "compact"
  onStatusChange={() => refetch()}
/>
```

**States**: "Join Crew" → "Crewing ✓" → "Requested"  
**Colors**: Blue → Green → Yellow

### CrewingWithBar
```typescript
<CrewingWithBar
  userId="abc123" // optional, defaults to current user
  onCreatorPress={(id) => router.push(`/profile/${id}`)}
/>
```

**Features**: Horizontal scroll, verification badges, mutual indicators

### ContentFeedCard
```typescript
<ContentFeedCard
  post={feedPost}
  onLike={() => handleLike(post.id)}
  onComment={() => handleComment(post.id)}
  onShare={() => handleShare(post.id)}
  onCreatorPress={() => router.push(`/profile/${post.creator.id}`)}
/>
```

**Content Types**: update, photo, video, poll, event_announcement, tip, recap

---

## 🪝 Hooks

### usePartyCrew - Actions
```typescript
const { isJoining, error, joinCrew, leaveCrew, toggleCrew } = usePartyCrew();

// Join a creator's PartyCrew
await joinCrew('creator-id');

// Leave a creator's PartyCrew
await leaveCrew('creator-id');

// Toggle based on current status
await toggleCrew('creator-id', currentStatus);
```

### useCrewStatus - Check Status
```typescript
const { status, isLoading, error, refetch, updateLocalStatus } = useCrewStatus('creator-id');

// status contains:
// - isFollowing: boolean
// - isPending: boolean
// - isMutual: boolean
// - connection: { notify_on_events, notify_on_posts }
// - request: { id, status, created_at }
```

### useCrewingWith - Following List
```typescript
const { creators, isLoading, error, refetch, hasMore, loadMore } = useCrewingWith(
  'user-id', // optional
  20 // limit
);

// creators array contains:
// - id, username, display_name, avatar_url
// - is_verified, is_mutual
// - events_hosted, followed_at
```

### useUserProfile - Profile Data
```typescript
const { profile, isLoading, error, refetch } = useUserProfile('user-id');

// profile contains:
// Basic: username, display_name, bio, avatar, cover
// Stats: partycrew_count, crewing_count, events_hosted, haus_score
// Relationship: viewer_is_following, viewer_is_mutual, etc.
// Privacy: is_private, is_verified, account_type
```

### useCrewFeed - Feed Data
```typescript
const { posts, isLoading, error, refetch, loadMore, hasMore } = useCrewFeed(
  'event_announcement', // optional filter
  10 // limit
);

// posts array contains:
// - id, creator, content_type, title, body, media_urls
// - likes_count, comments_count, shares_count
// - viewer_has_liked, viewer_has_commented
// - published_at, feed_score
```

---

## 🔌 API Endpoints

### Toggle Connection
```bash
# Join or leave
POST /api/partycrew/toggle
Body: { "creatorId": "abc123", "action": "join" }

# Check status
GET /api/partycrew/toggle?creatorId=abc123
```

### List Members
```bash
GET /api/partycrew/members?userId=abc123&limit=20&offset=0
```

### List Following
```bash
GET /api/partycrew/crewing-with?userId=abc123&limit=20&offset=0
```

### Get Profile
```bash
GET /api/users/abc123
```

### Get Suggestions
```bash
GET /api/users/suggested?limit=20
```

### Get Feed
```bash
GET /api/feed/crew?limit=10&content_type=event_announcement&cursor=xyz
```

### Manage Requests
```bash
# List requests
GET /api/partycrew/requests?type=received&limit=20

# Accept request
POST /api/partycrew/requests
Body: { "requestId": "xyz", "action": "accept" }

# Reject/cancel request
DELETE /api/partycrew/requests?requestId=xyz
```

---

## 🎨 Common Patterns

### Navigate to Profile
```typescript
import { useRouter } from 'expo-router';

const router = useRouter();
router.push(`/profile/${userId}` as any);
```

### Handle Like Action
```typescript
const handleLike = async (postId: string) => {
  // TODO: Implement
  // POST /api/partycrew/posts/{postId}/like
  console.log('Like post:', postId);
};
```

### Load More Feed
```typescript
<FlatList
  data={posts}
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}
  ListFooterComponent={() => 
    hasMore ? <ActivityIndicator /> : null
  }
/>
```

### Pull to Refresh
```typescript
<FlatList
  refreshControl={
    <RefreshControl
      refreshing={isLoading}
      onRefresh={refetch}
      tintColor="#6366F1"
    />
  }
/>
```

### Empty State
```typescript
const renderEmpty = () => (
  <View style={styles.empty}>
    <Text style={styles.emptyIcon}>🎉</Text>
    <Text style={styles.emptyText}>No content yet</Text>
    <TouchableOpacity onPress={() => router.push('/explore')}>
      <Text style={styles.cta}>Explore Creators</Text>
    </TouchableOpacity>
  </View>
);

<FlatList ListEmptyComponent={renderEmpty} />
```

---

## 🎯 Content Types

| Type | Icon | Use Case |
|------|------|----------|
| `update` | 📝 | General text updates |
| `photo` | 📸 | Single or multiple photos |
| `video` | 🎥 | Video content |
| `poll` | 📊 | Interactive polls |
| `event_announcement` | 🎉 | Event promotion with CTA |
| `tip` | 💡 | Party planning tips |
| `recap` | ✨ | Event recaps with photos |

---

## 🔐 Privacy Rules

### Account Privacy
- **Public**: Anyone can follow, see posts
- **Private**: Requires approval, only followers see posts

### Post Visibility
- **crew**: Only followers see
- **public**: Everyone sees
- **private**: Only creator sees

### Relationship Checks
```typescript
if (profile.viewer_is_blocked || profile.viewer_has_blocked) {
  // Don't show content
}

if (profile.is_private && !profile.viewer_is_following) {
  // Show "Request to Join" or "Requested"
}

if (profile.viewer_is_mutual) {
  // Show mutual badge ↔️
}
```

---

## 📊 Stats Display

```typescript
<View style={styles.stats}>
  <StatBox value={profile.partycrew_count} label="PartyCrew" />
  <StatBox value={profile.crewing_count} label="Crewing" />
  <StatBox value={profile.events_hosted} label="Events" />
  <StatBox value={profile.haus_score} label="Haus Score" />
</View>
```

---

## 🐛 Error Handling

```typescript
const { data, error, isLoading } = useCrewFeed();

if (isLoading) {
  return <ActivityIndicator />;
}

if (error) {
  return (
    <View>
      <Text>Error: {error}</Text>
      <Button onPress={refetch}>Retry</Button>
    </View>
  );
}

if (!data || data.length === 0) {
  return <EmptyState />;
}

return <FlatList data={data} />;
```

---

## 🎨 Color Constants

```typescript
const COLORS = {
  primary: '#6366F1',      // Indigo
  success: '#10B981',      // Green
  info: '#3B82F6',         // Blue
  warning: '#F59E0B',      // Amber
  danger: '#EF4444',       // Red
  
  gray900: '#1F2937',
  gray700: '#374151',
  gray600: '#4B5563',
  gray500: '#6B7280',
  gray400: '#9CA3AF',
  gray300: '#D1D5DB',
  gray200: '#E5E7EB',
  gray100: '#F3F4F6',
  gray50: '#F9FAFB',
};
```

---

## ⚡ Performance Tips

1. **Use FlatList** for lists (built-in virtualization)
2. **Memoize callbacks** with `useCallback`
3. **Debounce search** input
4. **Lazy load images** with `react-native-fast-image`
5. **Prefetch next page** when user scrolls to 70%
6. **Cache API responses** with React Query
7. **Optimize images** before upload (compress, resize)
8. **Use pagination** always (limit + offset or cursor)

---

## 📱 Screen Integration

### Home Tab (Feed)
```typescript
// apps/mobile/app/(tabs)/index.tsx
import { PartyCrewFeedScreen } from '@/components/screens/PartyCrewFeedScreen';

return <PartyCrewFeedScreen />;
```

### Explore Tab
```typescript
// Show suggested creators
const { data: suggestions } = useQuery({
  queryKey: ['suggested-creators'],
  queryFn: async () => {
    const res = await fetch(`${API_URL}/api/users/suggested`);
    return res.json();
  }
});

return (
  <FlatList
    data={suggestions}
    renderItem={({ item }) => (
      <View>
        <Text>{item.display_name}</Text>
        <JoinCrewButton creatorId={item.id} variant="compact" />
      </View>
    )}
  />
);
```

---

## 🧪 Testing Examples

### Test Component Rendering
```typescript
import { render } from '@testing-library/react-native';
import { JoinCrewButton } from '@/components/partycrew';

test('renders join button', () => {
  const { getByText } = render(
    <JoinCrewButton creatorId="123" variant="default" />
  );
  expect(getByText('Join Crew')).toBeTruthy();
});
```

### Test Hook
```typescript
import { renderHook, waitFor } from '@testing-library/react-hooks';
import { useCrewStatus } from '@/hooks/partycrew';

test('fetches crew status', async () => {
  const { result } = renderHook(() => useCrewStatus('creator-123'));
  
  await waitFor(() => !result.current.isLoading);
  
  expect(result.current.status.isFollowing).toBe(false);
});
```

---

## 🔗 Useful Links

- **API Docs**: `/docs/features/PARTYCREW_API_COMPLETE.md`
- **UI Guide**: `/docs/features/PARTYCREW_UI_COMPLETE.md`
- **Architecture**: `/docs/architecture/PARTYCREW_ARCHITECTURE.md`
- **Database Schema**: `/supabase/migrations/20251101_partycrew_social_network.sql`

---

**Quick Deploy**:
1. Deploy database migration
2. Test APIs with curl
3. Integrate PartyCrewFeedScreen
4. Test on device
5. Ship to production 🚀
