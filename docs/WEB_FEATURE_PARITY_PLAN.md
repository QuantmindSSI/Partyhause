# Web Application Feature Parity Plan
## Bringing Web to Mobile App Level

**Date**: November 2, 2025  
**Goal**: Implement all PartyCrew social network features on the web platform  
**Target**: Match mobile app functionality for desktop users

---

## Current State Analysis

### ✅ Mobile App Features (Complete)
- [x] Full PartyCrew social network
  - [x] User profiles with stats (followers, following, events created)
  - [x] Follow/Unfollow functionality (PartyCrew toggle)
  - [x] Social feed (content from followed users)
  - [x] Suggested users discovery
  - [x] Connection requests management
  - [x] User profile viewing
- [x] Event management (create, edit, invite)
- [x] Real-time timeline updates
- [x] Guest management
- [x] PWA support
- [x] Supabase authentication
- [x] React Query for data fetching
- [x] Custom hooks for all features

### ❌ Web App Features (Missing/Incomplete)
- [ ] No PartyCrew social features
- [ ] No user profiles
- [ ] No follow system
- [ ] No social feed
- [ ] No suggested users
- [ ] Limited event features
- [ ] No social navigation

---

## Implementation Phases

## Phase 1: Core Social Infrastructure (Week 1)
**Priority**: CRITICAL  
**Estimated Time**: 3-5 days

### 1.1 Setup Web Project Structure
```
src/
├── features/
│   └── partycrew/
│       ├── components/
│       │   ├── UserProfile.tsx
│       │   ├── UserCard.tsx
│       │   ├── FollowButton.tsx
│       │   ├── SocialFeed.tsx
│       │   └── SuggestedUsers.tsx
│       ├── hooks/
│       │   ├── useUserProfile.ts
│       │   ├── usePartyCrew.ts
│       │   ├── useCrewFeed.ts
│       │   ├── useCrewStatus.ts
│       │   └── useSuggestedUsers.ts
│       ├── types/
│       │   └── partycrew.ts
│       └── api/
│           └── partycrew.ts
```

**Tasks**:
- [ ] Create folder structure
- [ ] Copy mobile types to web
- [ ] Set up React Query on web
- [ ] Configure API client for Netlify endpoints

**Files to Create**:
1. `src/features/partycrew/types/index.ts`
2. `src/features/partycrew/api/client.ts`
3. `src/lib/queryClient.ts` (React Query setup)

---

### 1.2 Port Custom Hooks from Mobile
**Source**: `apps/mobile/hooks/partycrew/*`  
**Destination**: `src/features/partycrew/hooks/*`

**Priority Order**:
1. ✅ **useUserProfile** - Fetch user profile data
   - Port from: `apps/mobile/hooks/partycrew/useUserProfile.ts`
   - API: GET `/api/users/:id`
   - Returns: User stats, profile info

2. ✅ **usePartyCrew** - Follow/unfollow functionality
   - Port from: `apps/mobile/hooks/partycrew/usePartyCrew.ts`
   - API: POST `/api/partycrew/toggle`
   - Actions: join, leave

3. ✅ **useCrewStatus** - Check follow status
   - Port from: `apps/mobile/hooks/partycrew/useCrewStatus.ts`
   - API: GET `/api/partycrew/members`
   - Returns: Is following, follow status

4. ✅ **useCrewFeed** - Social feed content
   - Port from: `apps/mobile/hooks/partycrew/useCrewFeed.ts`
   - API: GET `/api/feed/crew`
   - Returns: Posts from followed users

5. ✅ **useSuggestedUsers** - User discovery
   - Port from: `apps/mobile/hooks/partycrew/useSuggestedUsers.ts`
   - API: GET `/api/users/suggested`
   - Returns: Recommended users to follow

6. ✅ **useCrewingWith** - Following list
   - Port from: `apps/mobile/hooks/partycrew/useCrewingWith.ts`
   - API: GET `/api/partycrew/crewing-with`
   - Returns: List of users you follow

**Conversion Notes**:
```typescript
// Mobile uses:
import { useAuth } from '@/lib/supabase';

// Web should use:
import { useAuth } from '@/lib/auth'; // or your web auth system

// API URLs - already configured:
// Mobile: process.env.EXPO_PUBLIC_API_URL
// Web: import.meta.env.VITE_API_URL
```

---

## Phase 2: User Profile Pages (Week 1-2)
**Priority**: HIGH  
**Estimated Time**: 2-3 days

### 2.1 Profile Screen Component
**Reference**: `apps/mobile/app/profile/[id].tsx`

**Create**:
- `src/pages/profile/[id].tsx` (or `/profile/:id` route)

**Features to Port**:
- [ ] User avatar and name display
- [ ] Stats display (followers, following, events)
- [ ] Follow/Unfollow button
- [ ] Loading states
- [ ] Error handling
- [ ] Back navigation

**UI Components Needed**:
```typescript
// src/features/partycrew/components/
- ProfileHeader.tsx       // Avatar, name, bio
- ProfileStats.tsx        // Follower/following counts
- FollowButton.tsx        // Follow/unfollow action
- ProfileSkeleton.tsx     // Loading state
- ProfileError.tsx        // Error display
```

### 2.2 User Card Component
**Reference**: `apps/mobile/components/partycrew/UserCard.tsx`

**Create**: `src/features/partycrew/components/UserCard.tsx`

**Props**:
```typescript
interface UserCardProps {
  userId: string;
  name: string;
  email?: string;
  avatar?: string;
  followersCount?: number;
  followingCount?: number;
  eventsCreatedCount?: number;
  isFollowing?: boolean;
  onPress?: () => void;
}
```

**Features**:
- [ ] Compact user display
- [ ] Click to view profile
- [ ] Follow button inline
- [ ] Hover states
- [ ] Avatar with fallback

---

## Phase 3: Social Feed (Week 2)
**Priority**: HIGH  
**Estimated Time**: 3-4 days

### 3.1 PartyCrew Feed Screen
**Reference**: `apps/mobile/app/(tabs)/explore.tsx`

**Create**: `src/pages/explore/index.tsx` or add to existing explore

**Components to Create**:
1. **FeedContainer.tsx**
   - Infinite scroll
   - Pull to refresh (desktop: button)
   - Loading skeleton
   - Empty state

2. **ContentFeedCard.tsx**
   - Post preview
   - User info
   - Timestamp
   - Event details if applicable
   - Like/comment buttons (future)

3. **FeedFilters.tsx**
   - All / Following / Events
   - Sort options
   - Search

**API Integration**:
```typescript
const { data, isLoading, error, fetchNextPage, hasNextPage } = useCrewFeed({
  limit: 20,
  filter: 'following' // or 'all'
});
```

---

## Phase 4: Discovery & Suggested Users (Week 2)
**Priority**: MEDIUM  
**Estimated Time**: 2 days

### 4.1 Suggested Users Widget
**Reference**: `apps/mobile/components/partycrew/SuggestedUsers.tsx`

**Create**: `src/features/partycrew/components/SuggestedUsers.tsx`

**Features**:
- [ ] Sidebar widget (desktop)
- [ ] Bottom sheet (mobile web)
- [ ] User cards with quick follow
- [ ] Refresh button
- [ ] "See all" link

**Placement**:
- Dashboard sidebar
- Explore page sidebar
- Profile page (other users)

### 4.2 People Directory Page
**New Feature** (doesn't exist in mobile)

**Create**: `src/pages/people/index.tsx`

**Features**:
- [ ] Grid/list view toggle
- [ ] Search users
- [ ] Filter by activity
- [ ] Pagination
- [ ] Alphabetical sorting

---

## Phase 5: Navigation Updates (Week 2-3)
**Priority**: MEDIUM  
**Estimated Time**: 1 day

### 5.1 Add Social Nav Items

**Desktop Navigation** (`src/components/Navigation.tsx`):
```typescript
const navItems = [
  // Existing
  { label: 'Dashboard', href: '/', icon: Home },
  { label: 'Events', href: '/events', icon: Calendar },
  
  // NEW - Add these
  { label: 'Explore', href: '/explore', icon: Compass },
  { label: 'People', href: '/people', icon: Users },
  { label: 'Profile', href: '/profile/me', icon: User },
];
```

**Mobile Navigation** (bottom bar):
```typescript
const mobileNav = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Explore', href: '/explore', icon: Compass }, // NEW
  { label: 'Events', href: '/events', icon: Calendar },
  { label: 'Profile', href: '/profile/me', icon: User }, // NEW
];
```

### 5.2 User Menu Updates
Add to user dropdown:
- [ ] "View Profile" link
- [ ] "My PartyCrew" (following list)
- [ ] "Settings" (social preferences)

---

## Phase 6: Integration & Polish (Week 3)
**Priority**: HIGH  
**Estimated Time**: 2-3 days

### 6.1 Dashboard Integration
**Update**: `src/pages/Dashboard.tsx`

**Add**:
- [ ] PartyCrew stats widget
  - Followers count
  - Following count
  - Quick link to profile
- [ ] Recent crew activity feed
- [ ] Suggested users sidebar
- [ ] Social CTA if no followers

### 6.2 Event Details Integration
**Update**: Event detail pages

**Add**:
- [ ] Event creator profile link
- [ ] Follow event creator button
- [ ] See creator's other events
- [ ] Attendees you follow

### 6.3 Responsive Design
**Breakpoints**:
```css
/* Mobile: < 768px */
- Stack vertically
- Full-width components
- Bottom navigation

/* Tablet: 768px - 1024px */
- 2-column layout
- Sidebar condensed
- Top navigation

/* Desktop: > 1024px */
- 3-column layout
- Full sidebar
- Floating widgets
```

---

## Phase 7: Advanced Features (Week 4)
**Priority**: LOW  
**Estimated Time**: Variable

### 7.1 Notifications
- [ ] Follow notifications
- [ ] Activity feed
- [ ] Browser notifications (PWA)

### 7.2 Privacy Controls
- [ ] Private profile toggle
- [ ] Block users
- [ ] Hide activity

### 7.3 Analytics
- [ ] Profile views
- [ ] Post reach
- [ ] Engagement metrics

---

## Technical Requirements

### Dependencies to Add
```json
{
  "@tanstack/react-query": "^5.0.0",
  "@tanstack/react-query-devtools": "^5.0.0",
  "react-router-dom": "^6.20.0", // if not already
  "zustand": "^4.4.0", // state management (optional)
  "date-fns": "^2.30.0", // date formatting
  "react-intersection-observer": "^9.5.0" // infinite scroll
}
```

### API Client Setup
```typescript
// src/lib/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://partyhause.netlify.app';

export const apiClient = {
  get: async (endpoint: string, options?: RequestInit) => {
    const token = await getAuthToken();
    return fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options?.headers,
      },
    });
  },
  // ... post, put, delete
};
```

### React Query Setup
```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

---

## Testing Strategy

### 1. Component Tests
```typescript
// Example: FollowButton.test.tsx
describe('FollowButton', () => {
  it('shows "Follow" when not following', () => {});
  it('shows "Following" when following', () => {});
  it('calls onFollow when clicked', () => {});
  it('shows loading state during API call', () => {});
});
```

### 2. Hook Tests
```typescript
// Example: usePartyCrew.test.ts
describe('usePartyCrew', () => {
  it('follows user successfully', () => {});
  it('unfollows user successfully', () => {});
  it('handles API errors', () => {});
  it('updates cache after follow', () => {});
});
```

### 3. Integration Tests
- [ ] Complete user journey: signup → discover → follow → view feed
- [ ] Profile viewing and editing
- [ ] Feed loading and pagination

---

## Migration Checklist

### Pre-Development
- [x] Create root .env file with Supabase credentials
- [x] Verify Netlify API endpoints are working
- [ ] Set up React Query on web
- [ ] Create feature folder structure

### Phase 1: Infrastructure (Days 1-3)
- [ ] Port TypeScript types from mobile
- [ ] Create API client utilities
- [ ] Port 6 custom hooks
- [ ] Set up React Query
- [ ] Create base components

### Phase 2: Profile Pages (Days 4-6)
- [ ] Build ProfilePage component
- [ ] Create ProfileHeader, ProfileStats
- [ ] Implement FollowButton
- [ ] Add loading/error states
- [ ] Set up routing

### Phase 3: Social Feed (Days 7-10)
- [ ] Create FeedContainer
- [ ] Build ContentFeedCard
- [ ] Implement infinite scroll
- [ ] Add empty states
- [ ] Port feed filtering

### Phase 4: Discovery (Days 11-12)
- [ ] Create SuggestedUsers widget
- [ ] Build UserCard component
- [ ] Add People directory page
- [ ] Implement search

### Phase 5: Navigation (Day 13)
- [ ] Update nav with social links
- [ ] Add profile menu items
- [ ] Create mobile bottom nav
- [ ] Update breadcrumbs

### Phase 6: Integration (Days 14-16)
- [ ] Add PartyCrew to Dashboard
- [ ] Integrate with Events
- [ ] Polish responsive design
- [ ] Fix UI inconsistencies

### Phase 7: Testing & Launch (Days 17-20)
- [ ] Write unit tests
- [ ] Integration testing
- [ ] User acceptance testing
- [ ] Bug fixes
- [ ] Performance optimization
- [ ] Deploy to production

---

## Success Metrics

### Must Have (MVP)
- [ ] User can view any profile
- [ ] User can follow/unfollow
- [ ] User can see their own profile stats
- [ ] User can view social feed
- [ ] Suggested users appear on dashboard

### Nice to Have
- [ ] Infinite scroll works smoothly
- [ ] Search users by name
- [ ] Filter feed content
- [ ] Profile edit functionality
- [ ] Notification system

### Stretch Goals
- [ ] Private profiles
- [ ] Block users
- [ ] Activity analytics
- [ ] Social sharing
- [ ] Export data

---

## Resources

### Code References
**Mobile Implementation**:
- Hooks: `apps/mobile/hooks/partycrew/`
- Components: `apps/mobile/components/partycrew/`
- Screens: `apps/mobile/app/profile/[id].tsx`, `apps/mobile/app/(tabs)/explore.tsx`

**API Documentation**:
- Endpoints: `docs/ENDPOINT_STATUS.md`
- API Reference: `docs/API_REFERENCE.md` (create if needed)

### Design System
- Use existing Shadcn UI components
- Follow mobile color scheme
- Match mobile spacing/typography

---

## Quick Start Commands

```bash
# 1. Verify environment
cat .env | grep SUPABASE

# 2. Create feature structure
mkdir -p src/features/partycrew/{components,hooks,types,api}

# 3. Copy first hook
cp apps/mobile/hooks/partycrew/useUserProfile.ts src/features/partycrew/hooks/

# 4. Install dependencies
npm install @tanstack/react-query @tanstack/react-query-devtools

# 5. Start dev server
npm run dev

# 6. Test API connection
curl https://partyhause.netlify.app/api/health
```

---

## Timeline Summary

| Week | Focus | Deliverables |
|------|-------|--------------|
| **Week 1** | Infrastructure + Profiles | Hooks ported, Profile page working |
| **Week 2** | Feed + Discovery | Social feed live, Suggested users |
| **Week 3** | Integration + Polish | Dashboard updated, Responsive design |
| **Week 4** | Advanced Features | Notifications, Privacy, Analytics |

**Total Estimated Time**: 15-20 days (3-4 weeks)

---

## Next Immediate Steps

1. **Right Now** (5 minutes):
   ```bash
   # Verify .env is loaded
   cd /Users/startferanmi/Data-Scientist/Partyhause
   cat .env | grep EXPO_PUBLIC
   
   # Try running Expo
   cd apps/mobile
   npx expo start --tunnel
   ```

2. **Today** (1 hour):
   - Create feature folder structure
   - Install React Query on web
   - Copy first 2 hooks (useUserProfile, usePartyCrew)

3. **This Week** (3-5 hours):
   - Port all 6 hooks
   - Create ProfilePage
   - Test with Netlify APIs

4. **Next Week**:
   - Build social feed
   - Add suggested users
   - Update navigation

---

## Questions to Answer Before Starting

1. **Web Framework**: Are you using Vite + React? (assumed yes based on VITE_ env vars)
2. **Routing**: React Router? File-based routing?
3. **UI Library**: Shadcn UI? Tailwind? (seems like yes)
4. **Auth System**: Using Supabase Auth on web already?
5. **State Management**: Redux? Context? Zustand? (recommend React Query only)

---

**Created**: November 2, 2025  
**Status**: Ready to implement  
**Blocked By**: None - all APIs are live!  
**Est. Completion**: November 22-29, 2025
