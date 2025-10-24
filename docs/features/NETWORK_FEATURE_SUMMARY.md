# 🌐 Network Discovery - Quick Summary

## Feature Goal
Allow users to discover and view parties/events from other users in their network.

---

## 🤝 Network Criteria (Recommended Hybrid Approach)

### 1. **Mutual Connections** (Primary - Like LinkedIn)
- Both users accept connection
- Highest privacy level
- Best for close friends/colleagues
- **Status:** `pending` → `accepted` → `connected`

### 2. **Following System** (Secondary - Like Instagram)  
- One-way following
- No acceptance needed
- For public figures/popular hosts
- **Status:** Instant following

### 3. **Interest Groups** (Tertiary - Phase 3)
- Join communities (EDM fans, Birthday planners, etc.)
- Group members see each other's group events
- **Status:** Join → Member

### 4. **Location-Based** (Optional - Phase 3)
- Discover nearby events/users
- Requires location permission
- **Status:** Opt-in only

---

## 🎯 Event Visibility Levels

```
┌─────────────┬──────────────────────────────────────┐
│ Visibility  │ Who Can See                          │
├─────────────┼──────────────────────────────────────┤
│ Private     │ Host only (default)                  │
│ Network     │ Host + Direct connections            │
│ Public      │ Everyone (appears in discover)       │
│ Group       │ Host + Specific group members        │
└─────────────┴──────────────────────────────────────┘
```

---

## 📊 Key Features

### For Users:
✅ **Discover Page** - Feed of events from network  
✅ **Network Management** - Add/manage connections  
✅ **User Profiles** - View other hosts  
✅ **Interest Expression** - Mark events as "interested"  
✅ **Request Invites** - Ask to attend private events  
✅ **Trending Events** - Popular events algorithm  

### For Hosts:
✅ **Privacy Controls** - Choose event visibility  
✅ **Network Analytics** - See who's interested  
✅ **Connection Management** - Build audience  
✅ **Group Events** - Create for specific communities  

---

## 🏗️ New Database Tables

1. **`user_connections`** - Mutual friend connections
2. **`user_follows`** - One-way following
3. **`interest_groups`** - Community groups
4. **`group_members`** - Group membership
5. **`event_interactions`** - Views, interests, shares
6. Enhanced **`users`** - Profile, bio, location
7. Enhanced **`events`** - Visibility, trending score, tags

---

## 🎨 Main UI Components

### 1. Discover Page (`/discover`)
```
[Filters: All | Connections | Following | Trending | Nearby]

📸 Event Card
   Summer Music Festival
   By: John Doe (2nd connection)
   500 interested • Music • Outdoors
   [View] [Interested] [Request Invite]
```

### 2. Network Page (`/network`)
```
Tabs: [Connections (45)] [Following (120)] [Followers (89)]

👤 John Doe - Host of 3 events
   [Message] [View Profile]
   
[Pending Requests (3)]
   • Sarah wants to connect [Accept] [Decline]
```

### 3. User Profile (`/profile/:userId`)
```
👤 John Doe
   @johndoe • New York
   45 Connections • 120 Following
   
   [Connect] [Follow] [Message]
   
   Upcoming Events (5)
   Past Events (12)
```

---

## 🚀 Implementation Phases

### **Phase 1: MVP (4-6 weeks)**
- [x] Database schema
- [ ] Mutual connections system
- [ ] Event visibility controls  
- [ ] Network events feed
- [ ] Basic discovery page
- [ ] Connection management UI

**Launch Criteria:** Users can connect and see each other's network events

### **Phase 2: Social (4-6 weeks)**
- [ ] Following system
- [ ] Trending algorithm
- [ ] Interest expressions
- [ ] Enhanced discovery
- [ ] User search

**Launch Criteria:** Full social discovery experience

### **Phase 3: Communities (4-6 weeks)**
- [ ] Interest groups
- [ ] Group events
- [ ] Location discovery
- [ ] Advanced recommendations

**Launch Criteria:** Community-driven discovery

---

## 🎯 Success Metrics

### Network Growth:
- **Target:** 10 connections per user (avg)
- **Measure:** Connection growth rate
- **Goal:** 80% acceptance rate

### Discovery Engagement:
- **Target:** 30% of users visit discover weekly
- **Measure:** DAU/MAU for discover page
- **Goal:** 5 events viewed per session

### Event Visibility:
- **Target:** 40% of events set to network/public
- **Measure:** Visibility distribution
- **Goal:** 50% increase in event attendance

---

## 🔐 Privacy First Approach

1. **Default Private** - Events are private by default
2. **Explicit Opt-in** - Location requires permission
3. **Granular Controls** - Per-event visibility
4. **Block/Report** - Safety features
5. **Data Export** - GDPR compliance

---

## 💡 Key Decisions Made

| Question | Decision | Rationale |
|----------|----------|-----------|
| Connection model? | **Hybrid** (mutual + following) | Flexibility for different use cases |
| Default visibility? | **Private** | Privacy-first approach |
| Location tracking? | **Opt-in only** | Privacy concerns |
| MVP includes groups? | **No** (Phase 3) | Focus on core network first |
| Connection degrees? | **Show up to 2nd** | Balance discovery vs spam |

---

## 🎨 User Flow Example

```
1. User signs up
   ↓
2. Invited to connect with friends
   ↓
3. Discovers trending events (public)
   ↓
4. Marks event as "interested"
   ↓
5. Sees more events from that host
   ↓
6. Follows the host
   ↓
7. Gets notified of new events
   ↓
8. Requests invitation
   ↓
9. Gets added as guest
   ↓
10. Shares event with network
```

---

## 📱 Mobile Considerations

- ✅ All features available on mobile
- ✅ Native sharing (iOS/Android)
- ✅ Push notifications for connections
- ✅ QR codes for easy connecting
- ✅ Location services integration

---

## 🐛 Technical Considerations

### Performance:
- **Indexing:** GIN indexes for full-text search
- **Caching:** Redis for trending events
- **Pagination:** Infinite scroll with cursor-based
- **Real-time:** Supabase subscriptions for notifications

### Security:
- **RLS Policies:** Strict row-level security
- **Rate Limiting:** Prevent connection spam
- **Input Validation:** Sanitize all user input
- **CORS:** Proper API protection

### Scalability:
- **Materialized Views:** For analytics
- **Background Jobs:** Trending score calculation
- **CDN:** Event images/assets
- **Database Partitioning:** For large tables (future)

---

## 📚 Related Documentation

- 📄 **Full Plan:** `SOCIAL_NETWORK_FEATURE_PLAN.md`
- 📊 **Database Schema:** `schema.sql`
- 🎨 **UI Components:** `/src/components/`
- 📱 **Mobile Screens:** `/apps/mobile/components/screens/`

---

## ✅ Next Actions

1. **Review plan** with team
2. **Get stakeholder approval** on approach
3. **Create detailed wireframes** (Figma)
4. **Set up dev branch:** `feature/social-network`
5. **Create first migration:** Database tables
6. **Begin Phase 1 development**

---

**🎉 Ready to transform PartyHause into a social event discovery platform!**

**Status:** 📋 Awaiting approval  
**Timeline:** 12-18 weeks (all phases)  
**MVP:** 4-6 weeks
