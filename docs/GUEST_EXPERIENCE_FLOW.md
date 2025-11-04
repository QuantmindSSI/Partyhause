# 🎉 Guest Experience Flow - Complete Guide

**Date**: November 4, 2025  
**Context**: What guests see when they accept an event invitation and RSVP

---

## 📬 Step 1: Guest Receives Invitation

### Email Invitation
Guests receive a beautifully styled email invitation with:

```
┌─────────────────────────────────────┐
│         PartyHause 🎊               │
│                                     │
│   You're Invited!                   │
│                                     │
│   [Event Name]                      │
│   📅 [Date & Time]                  │
│   📍 [Location]                     │
│   [Description]                     │
│                                     │
│   [ ✨ RSVP Now ✨ ]  <- Button     │
│                                     │
│   Click to confirm your attendance  │
│   and get all event details         │
└─────────────────────────────────────┘
```

**Email Contains:**
- Event name and description
- Date, time, and location
- Host information
- **RSVP URL** (unique link for guest)
- Call-to-action button

**Email Template:**
- Located in: `apps/mobile/lib/email.ts` (`buildInvitationEmail()`)
- Sent via: MailerSend API
- Includes: Beautiful gradient design, responsive layout

### Alternative: QR Code Invite
- Guests can scan a QR code at the venue
- Opens same RSVP flow
- Ideal for walk-ins or in-person invites

---

## 🔗 Step 2: Click RSVP Link

When guest clicks the RSVP button, they're redirected to:

### URL Format
```
https://www.partyhause.com/guest/{guestId}?event={eventId}
```

### What Happens:
1. **Web App Loads GuestView Component** (`src/components/GuestView.tsx`)
2. **Fetches guest and event data** from Supabase
3. **Displays personalized invitation page**

---

## 🎨 Step 3: Guest View Screen (Web PWA)

### Visual Layout:

```
┌────────────────────────────────────────┐
│                                        │
│    ✨ You're Invited! ✨             │
│    Hey [Guest Name],                   │
│    get ready to party! 🎉             │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  [Event Card]                    │ │
│  │                                  │ │
│  │  🎊 [Event Name]                 │ │
│  │  You're invited to join the      │ │
│  │  celebration!                    │ │
│  │                                  │ │
│  │  ┌───────────────────────┐       │ │
│  │  │ 📅 When                │       │ │
│  │  │ Friday, November 8th   │       │ │
│  │  │ 8:00 PM                │       │ │
│  │  └───────────────────────┘       │ │
│  │                                  │ │
│  │  ┌───────────────────────┐       │ │
│  │  │ 📍 Where               │       │ │
│  │  │ The Grand Ballroom     │       │ │
│  │  └───────────────────────┘       │ │
│  │                                  │ │
│  │  ┌───────────────────────┐       │ │
│  │  │ 👤 Your Details        │       │ │
│  │  │ John Doe               │       │ │
│  │  │ john@example.com       │       │ │
│  │  └───────────────────────┘       │ │
│  │                                  │ │
│  │  [ 📱 Show My QR Code ]          │ │
│  │                                  │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  🎵 Party Playlist (Spotify)    │ │
│  │  [Embedded Spotify Player]       │ │
│  └──────────────────────────────────┘ │
│                                        │
└────────────────────────────────────────┘
```

### Interactive Elements:

#### 1. **Event Information Display**
- ✅ Event name (large, gradient text with neon glow effect)
- ✅ Date and time (formatted: "Friday, November 8th, 2025 at 8:00 PM")
- ✅ Location with map pin icon
- ✅ Guest's personal info (name and email)

#### 2. **QR Code Button**
**Default State:**
```
[ 📱 Show My QR Code ]
"Present this QR code at the event for quick check-in"
```

**After Clicking:**
```
┌──────────────────────┐
│  Your Entry QR Code  │
│                      │
│  ┌──────────────┐    │
│  │  ███ ███ ██  │    │
│  │  █ ███ █  █  │    │
│  │  ██  ███ ███ │    │
│  └──────────────┘    │
│                      │
│  Guest ID encoded    │
│  [ Hide QR Code ]    │
└──────────────────────┘
```

**QR Code Features:**
- Encodes: Guest ID for instant check-in
- Size: 200x200 pixels
- Quality: High (Level H error correction)
- Background: White with rounded corners
- Can be saved to phone
- Used at entrance for contactless check-in

#### 3. **Spotify Playlist** (if available)
- Embedded Spotify player
- Collaborative playlist
- Guests can add songs before the event
- Shows: "Add your favorite songs to make this party even better!"

#### 4. **Animations**
- Sparkling effects on title
- Gentle bounce animation on icons
- Fade-in transitions for sections
- Neon glow pulse on primary elements

---

## 📊 Step 4: Guest Status Tracking

### RSVP Status Options:
The guest's status in the database can be:

| Status | Icon | Color | Meaning |
|--------|------|-------|---------|
| `pending` | ⏰ | Gray | Invited, not responded yet |
| `accepted` | ✅ | Green | Confirmed attendance |
| `declined` | ❌ | Red | Not attending |
| `maybe` | ❓ | Yellow | Tentative response |
| `confirmed` | ✅ | Green | Auto-accepted (QR join) |

### Database Fields Tracked:
```typescript
{
  id: "uuid",
  event_id: "event-uuid",
  name: "John Doe",
  email: "john@example.com",
  phone: "+1234567890",
  
  // RSVP Status
  rsvp_status: "accepted",
  rsvp_responded_at: "2025-11-03T14:30:00Z",
  
  // Additional Info
  plus_ones: 2,
  plus_ones_names: ["Jane Doe", "Baby Doe"],
  dietary_restrictions: "Vegetarian, No nuts",
  notes: "Arriving at 8:30 PM",
  
  // Check-in
  checked_in: false,
  checked_in_at: null,
  
  // Metadata
  invited_at: "2025-11-01T10:00:00Z",
  email_sent: true,
  email_opened: true,
  email_clicked: true
}
```

---

## 🎯 Step 5: Event Day Check-in

### At the Venue:

#### Option 1: QR Code Scan (Recommended)
1. Guest opens their invitation link
2. Clicks "Show My QR Code"
3. Host scans QR code with mobile app
4. Guest is instantly checked in
5. Status updates to `checked_in: true`

#### Option 2: Manual Check-in
1. Host opens Guest List screen
2. Searches for guest by name/email
3. Taps "Check In" button
4. Guest marked as present

### Check-in Confirmation:
```
┌────────────────────────┐
│  ✅ John Doe           │
│  [ ✓ Checked In ]      │
│  Arrived: 8:15 PM      │
└────────────────────────┘
```

---

## 👥 What the Host Sees

### Guest List View (Mobile)
Location: `apps/mobile/app/events/[id]/guests.tsx`

```
┌────────────────────────────────────┐
│  Guest List                        │
│  ┌─────┐ ┌─────┐ ┌─────┐          │
│  │ 50  │ │ 35  │ │ 12  │          │
│  │Total│ │Accpt│ │Chkd │          │
│  └─────┘ └─────┘ └─────┘          │
│                                    │
│  [ All | Accepted | Pending | ... ]│
│                                    │
│  ┌──────────────────────────────┐ │
│  │ ✅ John Doe                  │ │
│  │ john@example.com             │ │
│  │ +1234567890                  │ │
│  │ Status: Accepted             │ │
│  │ Plus Ones: 2                 │ │
│  │ ┌─────────────────────────┐  │ │
│  │ │ ✓ Checked In - 8:15 PM  │  │ │
│  │ └─────────────────────────┘  │ │
│  └──────────────────────────────┘ │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ ⏰ Jane Smith                │ │
│  │ jane@example.com             │ │
│  │ Status: Pending              │ │
│  │ [ Check In ]                 │ │
│  └──────────────────────────────┘ │
└────────────────────────────────────┘
```

### Guest List View (Web)
Location: `src/components/GuestListWithCrew.tsx`

Features:
- Real-time RSVP stats
- Filter by status (All/Accepted/Declined/Pending/Maybe)
- Search by name or email
- Quick actions: Check-in, Edit, Delete
- Export guest list
- Send reminders to pending guests

---

## 🔄 Complete User Journey

### 1. **Pre-Event (Days Before)**
```
Host → Creates Event
  ↓
Host → Adds Guests
  ↓
System → Sends Email Invitations
  ↓
Guest → Receives Email
  ↓
Guest → Clicks "RSVP Now"
  ↓
Guest → Views GuestView Page
  ↓
Guest → Status: "accepted" (automatically)
```

### 2. **Leading Up to Event**
- Guest can revisit invitation link anytime
- Guest can view/save QR code
- Guest can listen to Spotify playlist
- Host tracks RSVP responses in real-time
- Host can send reminders to pending guests

### 3. **Day of Event**
```
Guest → Arrives at Venue
  ↓
Guest → Opens Invitation Link
  ↓
Guest → Shows QR Code
  ↓
Host → Scans QR Code
  ↓
System → Marks Guest as Checked In
  ↓
Guest → Enjoys Party! 🎉
```

### 4. **Post-Event**
- Host can see who attended (checked_in_at timestamps)
- Export guest list with check-in data
- Analytics: attendance rate, check-in times, etc.

---

## 📱 Mobile App Integration

### Guest Can Also:
1. **Download Mobile App** (React Native Expo)
2. **Create Account** with same email
3. **See Invitation in App**
4. **Quick QR Access** from home screen
5. **Get Push Notifications** for event reminders

### Mobile Guest View:
Location: `apps/mobile/app/events/[id]/index.tsx` (when guest user logs in)

Features:
- Same event details as web
- Native QR code viewer
- Calendar integration
- Directions to venue (Apple/Google Maps)
- Share event with friends

---

## 🎨 Design Features

### Web PWA Guest View:
- **Glassmorphism** cards with blur effects
- **Gradient animations** on text and backgrounds
- **Neon glow effects** that pulse
- **Smooth transitions** between states
- **Responsive design** works on all devices
- **PWA installable** - add to home screen

### Visual Effects:
```css
/* Gradient background */
bg-gradient-hero

/* Neon glow on sparkles */
animate-neon-flicker

/* Party pulse animation */
animate-party-pulse

/* Glass card effect */
glass border-primary/20 shadow-2xl
```

---

## 📊 Analytics & Tracking

### What's Tracked:
1. **Email Engagement**
   - `email_sent`: true
   - `email_opened`: true (via tracking pixel)
   - `email_clicked`: true (RSVP link clicked)

2. **RSVP Response**
   - `rsvp_status`: pending → accepted
   - `rsvp_responded_at`: timestamp

3. **Event Day**
   - `checked_in`: false → true
   - `checked_in_at`: timestamp

### Host Dashboard Shows:
```
📊 Event Analytics
├─ 50 Total Guests
├─ 35 Accepted (70%)
├─ 5 Declined (10%)
├─ 8 Pending (16%)
├─ 2 Maybe (4%)
└─ 12 Checked In (34% of accepted)

📧 Email Performance
├─ 50 Sent
├─ 45 Opened (90%)
└─ 35 Clicked (70%)
```

---

## 🔐 Security & Privacy

### Guest Access:
- **No login required** to view invitation
- **Unique URL** per guest (not guessable)
- **QR code** encodes guest ID only
- **No personal data** visible to other guests
- **HTTPS only** - secure connections

### Data Protection:
- Guest email never exposed publicly
- Phone numbers optional and private
- Dietary restrictions only visible to host
- Notes field for host's eyes only

---

## 🚀 Technical Implementation

### Web Stack:
- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Animations**: Framer Motion
- **QR Codes**: qrcode.react
- **State**: Zustand store
- **Database**: Supabase (PostgreSQL)

### Mobile Stack:
- **Framework**: React Native + Expo
- **Navigation**: Expo Router
- **UI**: React Native + Custom Components
- **QR Scan**: expo-barcode-scanner
- **Storage**: AsyncStorage

### API Endpoints:
```typescript
// Fetch guest and event
GET /api/guests?id={guestId}
GET /api/events?id={eventId}&include_stats=true

// Update RSVP
PATCH /api/guests
Body: { id: guestId, rsvp_status: "accepted" }

// Check-in
POST /api/guests/{guestId}/check-in
```

---

## ✅ Features Checklist

### Current Features (Implemented):
- [x] Email invitation system
- [x] Web guest view with event details
- [x] QR code generation and display
- [x] Spotify playlist embedding
- [x] RSVP status tracking
- [x] Check-in system (QR scan or manual)
- [x] Real-time guest list updates
- [x] Email engagement tracking
- [x] Responsive design (mobile/desktop)
- [x] PWA installable

### Planned Enhancements:
- [ ] In-app RSVP buttons (accept/decline/maybe)
- [ ] Guest can update plus-ones count
- [ ] Guest can specify dietary restrictions
- [ ] Guest can add to calendar (iCal/Google)
- [ ] Push notifications (event reminders)
- [ ] Guest photo upload (pre-event)
- [ ] Event countdown timer
- [ ] Share event with friends
- [ ] Map integration (directions to venue)
- [ ] Weather forecast for event day

---

## 🎯 Key Takeaways

### For Guests:
1. **Simple**: Click email link → See event details → Show QR code at venue
2. **Beautiful**: Stunning animated UI with neon effects
3. **Convenient**: No app download required (works in browser)
4. **Fast**: QR code check-in takes seconds
5. **Interactive**: Can listen to music, see who's attending

### For Hosts:
1. **Easy**: Send invitations with one click
2. **Tracked**: See who opened email, who RSVP'd
3. **Organized**: Real-time guest list with filters
4. **Quick**: QR scan check-in is instant
5. **Insightful**: Analytics on attendance and engagement

---

## 📞 Support

### Common Questions:

**Q: Can guests forward the invitation?**
A: Yes, but the invitation is tied to their email. New guests should be added by host.

**Q: What if guest loses the email?**
A: Host can resend invitation from guest list, or manually check them in.

**Q: Do guests need to create an account?**
A: No, they can view event and check-in without signing up.

**Q: Can guests update their RSVP?**
A: Currently viewing only. Update coming soon for accept/decline buttons.

**Q: Is the QR code reusable?**
A: Yes, guest ID stays same. Can show QR code multiple times if needed.

---

**That's the complete guest experience! 🎉**

From receiving a beautiful email invitation → viewing stunning event details → showing QR code at venue → enjoying the party! All seamlessly integrated with real-time tracking for hosts.
