# Guest Interface Implementation Plan

## Overview
This document outlines the complete guest experience flow for the PartyHause mobile application. Guests will have a streamlined, intuitive interface focused on their role as attendees rather than event organizers.

---

## Guest Journey Flow

### 1. **Invitation Reception**
**Entry Points:**
- Email invitation link
- SMS invitation link
- In-app invitation notification
- Shared event link

**First-Time Experience:**
```
Invitation Link → Guest Landing Page → View Event Details → RSVP
                                    ↓
                            (Optional) Create Account
                                    ↓
                            Save Event to Profile
```

---

## Core Guest Features

### 🎟️ **Feature 1: Invitation Acceptance**

**Screen: `apps/mobile/app/guest/invite/[inviteId].tsx`**

**Purpose:** First touchpoint for guests to view invitation and RSVP

**UI Components:**
- Event banner with hero image/template design
- Host information (name, photo)
- Event details card:
  - Event name & description
  - Date & time
  - Location with map preview
  - Dress code (if specified)
  - Special instructions
- RSVP buttons:
  - ✅ "I'm Coming!" (Accept)
  - ❌ "Can't Make It" (Decline)
  - ❓ "Maybe" (Tentative)
- Plus-one/guest count selector
- Dietary restrictions input
- Optional message to host

**Data Flow:**
```typescript
interface GuestInviteResponse {
  invite_id: string;
  guest_email: string;
  guest_name: string;
  status: 'accepted' | 'declined' | 'tentative';
  plus_ones: number;
  dietary_restrictions?: string;
  message_to_host?: string;
  responded_at: Date;
}
```

**API Endpoint:** `POST /api/invitations/respond`

---

### 📅 **Feature 2: Guest Event Dashboard**

**Screen: `apps/mobile/app/guest/events/index.tsx`**

**Purpose:** Central hub for all events guest is invited to or attending

**Sections:**
1. **Upcoming Events** (accepted invitations)
   - Card view with countdown
   - Quick actions: View Details, Get Directions, Check-in
   
2. **Pending Invitations** (awaiting RSVP)
   - Alert badge with count
   - Quick RSVP from list
   
3. **Past Events** (attended)
   - Photo memories
   - Downloadable photos
   - Thank you notes from host

**Features:**
- Filter by status (upcoming, pending, past)
- Search events
- Calendar view toggle
- Add to device calendar

---

### 🎉 **Feature 3: Guest Event Details View**

**Screen: `apps/mobile/app/guest/events/[eventId]/index.tsx`**

**Purpose:** Complete event information for confirmed guests

**Tabs/Sections:**

#### **Overview Tab**
- Event header (title, date, location)
- Event description
- Host information
- RSVP status indicator
- Guest count ("You and 47 others")
- Directions button (opens maps)
- Add to calendar button
- Share event button

#### **Timeline Tab**
- Event schedule with visible activities
- Countdown to event start
- Activity notifications opt-in
- "What's Next" current activity indicator (during event)

#### **Details Tab**
- What to bring
- Parking information
- Dress code
- Gift registry link (if applicable)
- Special instructions
- Weather forecast (for outdoor events)

#### **Guests Tab**
- Other attendees (if host enabled visibility)
- Profile photos
- RSVP status
- Mutual connections highlight
- Optional: Chat with other guests

#### **Media Tab**
- Event photos (shared album)
- Upload photos
- Download all
- Tag people

---

### ✅ **Feature 4: Event Check-In**

**Screen: `apps/mobile/app/guest/events/[eventId]/checkin.tsx`**

**Purpose:** Seamless arrival confirmation

**Methods:**
1. **QR Code Scan**
   - Guest shows QR code
   - Host scans with event app
   
2. **Self Check-In**
   - Button press: "I've Arrived!"
   - Location verification (within event radius)
   - Confirmation animation
   
3. **NFC Tap** (future enhancement)
   - Tap phone at check-in station

**Benefits:**
- Triggers welcome notification to host
- Unlocks event-day features (live feed, games)
- Updates guest count in real-time

**UI:**
```
┌─────────────────────────┐
│   Your Check-In QR      │
│                         │
│   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓        │
│   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓        │
│   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓        │
│                         │
│   Show this to host     │
│                         │
│   ── OR ──              │
│                         │
│ [I've Arrived! Button]  │
└─────────────────────────┘
```

---

### 🎮 **Feature 5: Games Participation**

**Screen: `apps/mobile/app/guest/events/[eventId]/games.tsx`**

**Purpose:** Interactive party games for guests

**Available Games:**
- **Trivia Challenge** - Event/group themed questions
- **Icebreaker Questions** - Get to know other guests
- **Photo Hunt** - Scavenger hunt with photo submissions
- **Polls** - Vote on group decisions
- **Truth or Dare** - Party game classic
- **Karaoke Queue** - Request songs

**Game Flow:**
```
Games Lobby → Select Game → Join Session → Play → View Results → Share Score
```

**Leaderboard:**
- Real-time scoring
- Top 10 players
- Prizes/recognition from host
- Badges and achievements

---

### 💬 **Feature 6: Live Event Feed**

**Screen: `apps/mobile/app/guest/events/[eventId]/feed.tsx`**

**Purpose:** Real-time event updates and social interaction

**Features:**
- Live updates from host
- Photo sharing stream
- Activity announcements
- Toast notifications
- Reactions (👍 ❤️ 😂 🎉)
- Comment threads
- @mentions

**Feed Items:**
- "🎂 Cake cutting in 10 minutes!"
- "📸 Sarah shared 3 photos"
- "🎵 DJ is taking requests"
- "🍕 Pizza has arrived!"

---

### 📍 **Feature 7: Event Navigation**

**Screen: `apps/mobile/app/guest/events/[eventId]/directions.tsx`**

**Purpose:** Help guests find venue and navigate event space

**Features:**
- Integrated maps (Google Maps/Apple Maps)
- Turn-by-turn directions
- Parking instructions
- Venue floor plan (for large venues)
- Meet-up point marker
- Real-time ETA updates
- Share ETA with host

---

### 🎁 **Feature 8: Gift Registry Integration** (Optional)

**Screen: `apps/mobile/app/guest/events/[eventId]/gifts.tsx`**

**Purpose:** Easy gift giving for birthdays, weddings, etc.

**Features:**
- View gift registry
- Mark item as purchased
- Group gift contributions
- Gift notes to celebrant
- Digital gift cards
- Cash fund contributions

---

### 📸 **Feature 9: Photo Sharing**

**Screen: `apps/mobile/app/guest/events/[eventId]/photos.tsx`**

**Purpose:** Collaborative event photo album

**Features:**
- Upload photos/videos
- View all event media
- Download full album
- Facial recognition tagging
- Privacy settings
- Slideshow mode
- Create highlight reel

---

### 🔔 **Feature 10: Notifications**

**Types:**
- Invitation received
- Event reminder (24h, 1h before)
- Timeline updates (next activity)
- Host announcements
- Photo tags
- Game invitations
- Thank you message from host

**Settings:**
- Push notifications
- Email notifications
- SMS reminders
- Quiet hours

---

## Guest App Architecture

### Navigation Structure
```
Guest App Root
├── Invitations
│   ├── Pending
│   └── [inviteId] (RSVP page)
├── My Events
│   ├── Upcoming
│   ├── Today
│   ├── Past
│   └── [eventId]
│       ├── Overview
│       ├── Timeline
│       ├── Details
│       ├── Guests
│       ├── Games
│       ├── Photos
│       ├── Feed
│       └── Check-In
├── Profile
│   ├── Personal Info
│   ├── Dietary Preferences
│   └── Notification Settings
└── Settings
```

---

## Technical Implementation

### File Structure
```
apps/mobile/app/
├── guest/
│   ├── _layout.tsx (Guest navigation)
│   ├── invite/
│   │   └── [inviteId].tsx
│   ├── events/
│   │   ├── index.tsx (Event list)
│   │   └── [eventId]/
│   │       ├── index.tsx (Event details)
│   │       ├── checkin.tsx
│   │       ├── games.tsx
│   │       ├── photos.tsx
│   │       ├── feed.tsx
│   │       ├── directions.tsx
│   │       └── gifts.tsx
│   └── profile/
│       ├── index.tsx
│       └── settings.tsx
```

### Key Components
```typescript
// apps/mobile/components/guest/
├── InvitationCard.tsx
├── EventCard.tsx
├── RSVPButtons.tsx
├── CheckInQRCode.tsx
├── GuestList.tsx
├── TimelineView.tsx
├── PhotoUpload.tsx
├── LiveFeed.tsx
└── GameLobby.tsx
```

### API Endpoints Needed
```
POST   /api/invitations/respond
GET    /api/guest/events
GET    /api/guest/events/:eventId
POST   /api/guest/checkin/:eventId
GET    /api/guest/timeline/:eventId
POST   /api/guest/photos/upload
GET    /api/guest/photos/:eventId
POST   /api/guest/games/join
GET    /api/guest/feed/:eventId
```

---

## Database Schema Additions

### Guest RSVP Table
```sql
CREATE TABLE guest_rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  guest_email TEXT NOT NULL,
  guest_name TEXT,
  guest_phone TEXT,
  status TEXT CHECK (status IN ('accepted', 'declined', 'tentative')),
  plus_ones INTEGER DEFAULT 0,
  dietary_restrictions TEXT,
  message_to_host TEXT,
  responded_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Guest Check-Ins Table
```sql
CREATE TABLE guest_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  guest_email TEXT NOT NULL,
  checked_in_at TIMESTAMP DEFAULT NOW(),
  check_in_method TEXT CHECK (check_in_method IN ('qr_scan', 'self_checkin', 'nfc')),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8)
);
```

---

## UI/UX Design Principles

### Guest-First Design
1. **Minimal Friction**: RSVP in 2 taps
2. **Clear Hierarchy**: Most important info first
3. **Mobile-Optimized**: Touch targets, thumb zones
4. **Offline Support**: Cache event details
5. **Accessibility**: Screen reader support, high contrast

### Visual Theme
- **Colors**: Softer, more celebratory palette
- **Typography**: Friendly, readable fonts
- **Icons**: Clear, universally understood
- **Animations**: Delightful micro-interactions

---

## Privacy & Security

### Guest Data Protection
- Email addresses visible only to host
- Guest list visibility controlled by host
- Photo sharing opt-in
- No tracking without consent
- Easy account deletion

### Access Control
- Unique invitation tokens
- Email verification for account creation
- Event-specific permissions
- Revokable access

---

## Testing Strategy

### User Flows to Test
1. ✅ Receive invitation → RSVP → Save event
2. ✅ Update RSVP (change from maybe to yes)
3. ✅ Check-in at event
4. ✅ Join game session
5. ✅ Upload photos
6. ✅ View timeline
7. ✅ Get directions
8. ✅ Withdraw RSVP

### Demo Scenarios
- **Birthday Party Guest**: Kid's birthday, RSVP with dietary note
- **Wedding Guest**: Plus-one, check gift registry
- **Corporate Event**: Check-in, network with attendees
- **House Party**: Casual RSVP, share photos live

---

## Phase 1: MVP Features (Priority)

### Must-Have
1. ✅ Invitation viewing & RSVP
2. ✅ Event details display
3. ✅ Basic check-in
4. ✅ Event list (upcoming/past)
5. ✅ Directions integration

### Nice-to-Have
6. Photo sharing
7. Live feed
8. Games participation
9. Guest list viewing
10. Timeline view

---

## Phase 2: Enhanced Features

1. Gift registry integration
2. Advanced games (multiplayer)
3. Social features (chat, meet guests)
4. AR experiences (photo filters)
5. NFC check-in
6. Offline mode
7. Apple Wallet/Google Pay integration

---

## Success Metrics

### Guest Engagement
- RSVP rate
- Check-in rate
- Photo upload rate
- Game participation rate
- App retention rate
- Event rating/feedback

### Technical Performance
- Page load time < 2s
- Check-in success rate > 99%
- Photo upload success rate > 95%
- Crash-free rate > 99.5%

---

## Guest vs Host Interface Comparison

| Feature | Guest Interface | Host Interface |
|---------|-----------------|----------------|
| **Event Creation** | ❌ None | ✅ Full wizard |
| **Event Viewing** | ✅ Details only | ✅ Full management |
| **Guest List** | ✅ View (if enabled) | ✅ Full CRUD |
| **Check-In** | ✅ Self check-in | ✅ Scan guests |
| **Timeline** | ✅ View schedule | ✅ Edit schedule |
| **Games** | ✅ Participate | ✅ Host & manage |
| **Photos** | ✅ View/Upload | ✅ Moderate/Download |
| **Notifications** | ✅ Event updates | ✅ Send broadcasts |
| **Analytics** | ❌ None | ✅ Full dashboard |

---

## Implementation Timeline

### Week 1: Foundation
- Create guest navigation structure
- Design guest components
- Setup API endpoints
- Database schema

### Week 2: Core Features
- Invitation viewing
- RSVP functionality
- Event details display
- Event list

### Week 3: Interactive Features
- Check-in system
- Timeline view
- Directions integration
- Notifications

### Week 4: Enhancement & Polish
- Photo sharing
- Live feed
- Games integration
- Testing & bug fixes

---

## Code Examples

### Guest Invitation Screen
```tsx
// apps/mobile/app/guest/invite/[inviteId].tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function GuestInvitation() {
  const { inviteId } = useLocalSearchParams<{ inviteId: string }>();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleRSVP = async (status: 'accepted' | 'declined' | 'tentative') => {
    // API call to update RSVP
    await fetch(`${API_URL}/api/invitations/respond`, {
      method: 'POST',
      body: JSON.stringify({
        invite_id: inviteId,
        status,
        guest_name: guestName,
        plus_ones: plusOnes,
        dietary_restrictions: dietaryNotes
      })
    });
  };

  return (
    <ScrollView>
      <Image source={{ uri: event.banner_url }} style={styles.banner} />
      <View style={styles.content}>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.description}>{event.description}</Text>
        
        {/* Event Details */}
        <EventDetailsCard event={event} />
        
        {/* RSVP Buttons */}
        <View style={styles.rsvpButtons}>
          <TouchableOpacity 
            style={[styles.button, styles.acceptButton]}
            onPress={() => handleRSVP('accepted')}
          >
            <Text style={styles.buttonText}>✅ I'm Coming!</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.declineButton]}
            onPress={() => handleRSVP('declined')}
          >
            <Text style={styles.buttonText}>❌ Can't Make It</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
```

### Guest Event Dashboard
```tsx
// apps/mobile/app/guest/events/index.tsx
import React, { useState, useEffect } from 'react';
import { View, FlatList, Text } from 'react-native';
import { GuestEventCard } from '@/components/guest/GuestEventCard';

export default function GuestEvents() {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState<'upcoming' | 'pending' | 'past'>('upcoming');

  useEffect(() => {
    fetchGuestEvents();
  }, [filter]);

  return (
    <View style={styles.container}>
      <FilterTabs activeFilter={filter} onFilterChange={setFilter} />
      
      <FlatList
        data={events}
        renderItem={({ item }) => (
          <GuestEventCard 
            event={item}
            onPress={() => router.push(`/guest/events/${item.id}`)}
          />
        )}
        keyExtractor={item => item.id}
      />
    </View>
  );
}
```

---

## Next Steps

1. ✅ Review and approve guest interface plan
2. Create guest components library
3. Implement invitation response system
4. Build guest event dashboard
5. Integrate check-in functionality
6. Test with beta users
7. Iterate based on feedback

---

## Questions to Resolve

- Should guests be required to create an account or allow anonymous RSVP?
- What level of guest-to-guest interaction should we enable?
- How to handle privacy for celebrity/VIP events?
- Should guests see other guests' RSVP status?
- Allow guests to bring uninvited plus-ones?

---

**Status**: 📋 Ready for Implementation
**Priority**: 🔥 High - Essential for guest experience
**Estimated Effort**: 3-4 weeks
**Dependencies**: Core event system, authentication, notifications

