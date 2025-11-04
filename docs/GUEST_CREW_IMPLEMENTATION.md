# 🎉 Guest vs Crew: Complete Implementation Guide
## Drake Concert Scenario - Join Event Bubble Feature

**Created:** November 3, 2025  
**Status:** Backend Complete, Frontend Ready for Implementation

---

## 📋 Executive Summary

This implementation adds the ability for users to:
1. **Join events via QR code** as a guest (immediate participation)
2. **Optionally add to crew** (long-term connection)
3. **Split costs** among confirmed guests
4. **Convert guests to crew** after events

**Use Case:** You're at Drake's concert. Your friends are using PartyHause for their event bubble. They generate a QR code. You scan it, join as a guest immediately, and optionally add them to your crew to see future events.

---

## 🎯 Guest vs Crew: Core Distinction

### Guest
- **Scope:** Event-specific (one bubble)
- **Persistence:** Exists for that event only
- **Purpose:** Attend/participate in specific event activities
- **Permissions:**
  - See event details
  - Join games and activities
  - RSVP and check-in
  - Part of cost splits
  - Receive event notifications
- **When to use:** Someone attending your event (ticketed or planned activity)

### Crew
- **Scope:** User-to-user connection (global)
- **Persistence:** Long-term relationship
- **Purpose:** Maintain ongoing social connection
- **Permissions:**
  - See crew-visible events in Explore feed
  - Automatic notifications for new events
  - Easy one-tap invites to future events
  - Appears in host's crew list
- **When to use:** Want to stay connected and coordinate multiple events

### The Perfect Flow (Drake Concert Example)
1. **Immediate:** Add as **Guest** → Join event bubble now
2. **Optional:** Convert to **Crew** → See their future events automatically
3. **Result:** Best of both worlds

---

## 🗄️ Database Schema (Implemented)

### 1. Extended `guests` Table
```sql
-- New columns added to existing guests table
ALTER TABLE public.guests ADD COLUMN:
  - user_id UUID (linked account, nullable)
  - rsvp_status TEXT ('pending', 'confirmed', 'declined', 'maybe')
  - plus_ones INTEGER
  - cost_share_enabled BOOLEAN
  - cost_share_amount DECIMAL(10,2)
  - payment_status TEXT ('unpaid', 'paid', 'refunded', 'partial')
  - payment_intent_id TEXT
  - checked_in_at TIMESTAMPTZ
```

### 2. `event_invite_tokens` (NEW)
```sql
CREATE TABLE event_invite_tokens (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  token TEXT UNIQUE NOT NULL,
  token_type TEXT CHECK IN ('guest_join', 'crew_invite', 'guest_and_crew'),
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  allowed_emails TEXT[],
  require_approval BOOLEAN DEFAULT false,
  uses_log JSONB
);
```

### 3. `cost_split_requests` (NEW)
```sql
CREATE TABLE cost_split_requests (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  guest_id UUID REFERENCES guests(id),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  description TEXT,
  status TEXT CHECK IN ('pending', 'sent', 'paid', 'overdue', 'cancelled'),
  payment_method TEXT,
  payment_reference TEXT,
  paid_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id)
);
```

### 4. `guest_crew_conversions` (NEW - Audit Trail)
```sql
CREATE TABLE guest_crew_conversions (
  id UUID PRIMARY KEY,
  event_id UUID,
  guest_id UUID,
  user_id UUID,
  converted_by UUID,
  conversion_type TEXT CHECK IN ('host_promoted', 'guest_accepted', 'auto_mutual'),
  connection_id UUID REFERENCES connections(id),
  connection_status TEXT,
  created_at TIMESTAMPTZ
);
```

### 5. `event_cost_summaries` (NEW - Denormalized)
```sql
CREATE TABLE event_cost_summaries (
  event_id UUID PRIMARY KEY,
  total_event_cost DECIMAL(10,2),
  total_collected DECIMAL(10,2),
  total_pending DECIMAL(10,2),
  guests_with_splits INTEGER,
  guests_paid INTEGER,
  split_enabled BOOLEAN
);
```

### 6. `connections` (Already Exists from Social Network Migration)
```sql
-- From 20251101_partycrew_social_network.sql
CREATE TABLE connections (
  follower_id UUID REFERENCES user_profiles(id),
  following_id UUID REFERENCES user_profiles(id),
  notify_on_events BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ
);
```

---

## 🔌 API Endpoints (All Implemented)

### 1. **POST /api/generate-invite**
Generate QR code invite token for event

**Request:**
```json
POST /api/generate-invite?event_id={uuid}
Authorization: Bearer {token}
{
  "token_type": "guest_and_crew",
  "max_uses": 50,
  "expires_in_hours": 24,
  "allowed_emails": null,
  "require_approval": false
}
```

**Response:**
```json
{
  "token": {
    "id": "...",
    "token": "inv_abc123xyz...",
    "token_type": "guest_and_crew",
    "event_id": "...",
    "expires_at": "2025-11-04T20:00:00Z",
    "max_uses": 50,
    "current_uses": 0
  },
  "invite_url": "https://www.partyhause.com/join/inv_abc123xyz...",
  "qr_data": "https://www.partyhause.com/join/inv_abc123xyz..."
}
```

---

### 2. **POST /api/join-event**
Join event via token (QR scan)

**Request:**
```json
POST /api/join-event
Authorization: Bearer {token} (optional)
{
  "token": "inv_abc123xyz...",
  "name": "John Doe",
  "email": "john@example.com",
  "also_add_to_crew": false
}
```

**Response:**
```json
{
  "message": "Successfully joined event",
  "guest": {
    "id": "...",
    "event_id": "...",
    "name": "John Doe",
    "user_id": "...",
    "rsvp_status": "confirmed"
  },
  "event": {
    "id": "...",
    "name": "Drake Concert After Party",
    "host_id": "...",
    "start_date": "2025-11-05T22:00:00Z"
  },
  "connection": null,
  "show_crew_prompt": true
}
```

**If `also_add_to_crew: true`:**
```json
{
  "connection": {
    "type": "connected",
    "connection": {
      "id": "...",
      "follower_id": "...",
      "following_id": "..."
    }
  },
  "show_crew_prompt": false
}
```

---

### 3. **POST /api/convert-guest-to-crew**
Host promotes guest to crew member

**Request:**
```json
POST /api/convert-guest-to-crew
Authorization: Bearer {host_token}
{
  "guest_id": "...",
  "event_id": "..."
}
```

**Response:**
```json
{
  "message": "Guest promoted to crew successfully",
  "connection": {
    "id": "...",
    "created_at": "...",
    "user_profiles": {
      "id": "...",
      "username": "johndoe",
      "display_name": "John Doe",
      "avatar_url": "..."
    }
  },
  "connection_id": "..."
}
```

**Error Cases:**
```json
// Guest has no account
{
  "error": "Guest must sign up for an account before being added to crew",
  "code": "GUEST_NO_ACCOUNT"
}

// Already in crew
{
  "error": "Guest is already in your crew"
}
```

---

### 4. **GET /api/user-connections**
List crew connections

**Request:**
```
GET /api/user-connections?type=following
Authorization: Bearer {token}
```

**Query Parameters:**
- `type`: `following` | `followers` | `mutual`

**Response:**
```json
{
  "connections": [
    {
      "id": "...",
      "following_id": "...",
      "created_at": "...",
      "user_profiles": {
        "username": "sarah_party",
        "display_name": "Sarah Smith",
        "avatar_url": "...",
        "partycrew_count": 245,
        "events_hosted": 12
      }
    }
  ]
}
```

---

### 5. **POST /api/user-connections**
Follow user or accept request

**Follow Public User:**
```json
POST /api/user-connections
Authorization: Bearer {token}
{
  "action": "follow",
  "target_user_id": "..."
}
```

**Response:**
```json
{
  "connection": { "id": "...", "follower_id": "...", "following_id": "..." },
  "message": "Now following"
}
```

**Follow Private User (Creates Request):**
```json
{
  "type": "request_sent",
  "request": {
    "id": "...",
    "requester_id": "...",
    "target_id": "...",
    "status": "pending"
  },
  "message": "Connection request sent"
}
```

**Accept Request:**
```json
POST /api/user-connections
{
  "action": "accept_request",
  "connection_request_id": "..."
}
```

---

### 6. **POST /api/cost-split**
Create cost split for event

**Request:**
```json
POST /api/cost-split?event_id={uuid}
Authorization: Bearer {host_token}
{
  "split_method": "equal",
  "total_amount": 500.00,
  "description": "Drake concert tickets + Uber",
  "due_date": "2025-11-10T00:00:00Z",
  "currency": "USD"
}
```

**Custom Split:**
```json
{
  "split_method": "custom",
  "total_amount": 500.00,
  "custom_splits": {
    "guest_id_1": 100.00,
    "guest_id_2": 150.00,
    "guest_id_3": 250.00
  }
}
```

**Response:**
```json
{
  "message": "Cost split requests created",
  "splits": [
    {
      "id": "...",
      "guest_id": "...",
      "amount": 100.00,
      "status": "pending",
      "guest": {
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "total_guests": 5,
  "total_amount": 500.00
}
```

---

### 7. **GET /api/cost-split**
Get cost split summary

**Request:**
```
GET /api/cost-split?event_id={uuid}
Authorization: Bearer {host_token}
```

**Response:**
```json
{
  "summary": {
    "event_id": "...",
    "total_event_cost": 500.00,
    "total_collected": 300.00,
    "total_pending": 200.00,
    "guests_with_splits": 5,
    "guests_paid": 3,
    "guests_pending": 2
  },
  "splits": [
    {
      "id": "...",
      "guest_id": "...",
      "amount": 100.00,
      "status": "paid",
      "paid_at": "2025-11-04T15:30:00Z",
      "payment_method": "venmo",
      "guest": {
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ]
}
```

---

### 8. **PUT /api/cost-split**
Mark payment as complete

**Request:**
```json
PUT /api/cost-split?event_id={uuid}
Authorization: Bearer {host_token}
{
  "split_id": "...",
  "status": "paid",
  "payment_method": "venmo",
  "payment_reference": "@johndoe"
}
```

**Response:**
```json
{
  "message": "Cost split updated",
  "split": {
    "id": "...",
    "status": "paid",
    "paid_at": "2025-11-04T16:00:00Z",
    "payment_method": "venmo"
  }
}
```

---

## 🎨 Frontend Implementation Guide

### React Component: QR Code Generation

```typescript
// components/EventQRGenerator.tsx
import { useState } from 'react';
import QRCode from 'react-qr-code';

interface QRGeneratorProps {
  eventId: string;
}

export function EventQRGenerator({ eventId }: QRGeneratorProps) {
  const [inviteData, setInviteData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generateQR = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/generate-invite?event_id=${eventId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          token_type: 'guest_and_crew',
          max_uses: 50,
          expires_in_hours: 48,
        }),
      });

      const data = await response.json();
      setInviteData(data);
    } catch (error) {
      console.error('Failed to generate invite:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="qr-generator">
      <button onClick={generateQR} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Event QR Code'}
      </button>

      {inviteData && (
        <div className="qr-display">
          <QRCode value={inviteData.qr_data} size={256} />
          <p>Scan to join event</p>
          <input
            type="text"
            value={inviteData.invite_url}
            readOnly
            onClick={(e) => e.currentTarget.select()}
          />
          <button onClick={() => navigator.clipboard.writeText(inviteData.invite_url)}>
            Copy Link
          </button>
        </div>
      )}
    </div>
  );
}
```

---

### React Component: Join via QR Scanner

```typescript
// pages/JoinEvent.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export function JoinEventPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showCrewModal, setShowCrewModal] = useState(false);
  const [eventData, setEventData] = useState<any>(null);

  const joinEvent = async (addToCrew: boolean = false) => {
    setLoading(true);
    try {
      const response = await fetch('/api/join-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          token,
          also_add_to_crew: addToCrew,
        }),
      });

      const data = await response.json();
      setEventData(data);

      if (data.show_crew_prompt && !addToCrew) {
        setShowCrewModal(true);
      } else {
        // Navigate to event page
        navigate(`/events/${data.event.id}`);
      }
    } catch (error) {
      console.error('Failed to join event:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      joinEvent(false);
    }
  }, [token]);

  return (
    <div className="join-event-page">
      {loading && <p>Joining event...</p>}

      {showCrewModal && eventData && (
        <div className="crew-modal-overlay">
          <div className="crew-modal">
            <h2>🎉 You're In!</h2>
            <p>Successfully joined: <strong>{eventData.event.name}</strong></p>
            
            <div className="crew-prompt">
              <h3>Add host to your crew?</h3>
              <p>See their future events automatically in your feed</p>
              
              <div className="modal-actions">
                <button
                  className="btn-primary"
                  onClick={() => {
                    setShowCrewModal(false);
                    joinEvent(true); // Re-call with crew flag
                  }}
                >
                  Yes — Add to Crew
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setShowCrewModal(false);
                    navigate(`/events/${eventData.event.id}`);
                  }}
                >
                  No — Just Join Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### React Component: Cost Split Manager

```typescript
// components/CostSplitManager.tsx
import { useState, useEffect } from 'react';

interface CostSplitProps {
  eventId: string;
}

export function CostSplitManager({ eventId }: CostSplitProps) {
  const [summary, setSummary] = useState<any>(null);
  const [splits, setSplits] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [totalAmount, setTotalAmount] = useState('');

  useEffect(() => {
    fetchCostSplits();
  }, [eventId]);

  const fetchCostSplits = async () => {
    const response = await fetch(`/api/cost-split?event_id=${eventId}`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    });
    const data = await response.json();
    setSummary(data.summary);
    setSplits(data.splits);
  };

  const createSplit = async () => {
    await fetch(`/api/cost-split?event_id=${eventId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({
        split_method: 'equal',
        total_amount: parseFloat(totalAmount),
        description: 'Event cost share',
      }),
    });
    fetchCostSplits();
    setShowCreateForm(false);
  };

  const markAsPaid = async (splitId: string) => {
    await fetch(`/api/cost-split?event_id=${eventId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({
        split_id: splitId,
        status: 'paid',
        payment_method: 'cash',
      }),
    });
    fetchCostSplits();
  };

  return (
    <div className="cost-split-manager">
      <h3>Cost Splitting</h3>

      {summary && (
        <div className="summary-card">
          <div className="stat">
            <span>Total Cost:</span>
            <strong>${summary.total_event_cost}</strong>
          </div>
          <div className="stat">
            <span>Collected:</span>
            <strong>${summary.total_collected}</strong>
          </div>
          <div className="stat">
            <span>Pending:</span>
            <strong>${summary.total_pending}</strong>
          </div>
          <div className="stat">
            <span>Paid:</span>
            <strong>{summary.guests_paid}/{summary.guests_with_splits}</strong>
          </div>
        </div>
      )}

      {!showCreateForm && splits.length === 0 && (
        <button onClick={() => setShowCreateForm(true)}>
          Create Cost Split
        </button>
      )}

      {showCreateForm && (
        <div className="create-split-form">
          <input
            type="number"
            placeholder="Total amount"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
          />
          <button onClick={createSplit}>Split Equally</button>
        </div>
      )}

      <div className="splits-list">
        {splits.map((split) => (
          <div key={split.id} className="split-item">
            <div className="split-guest">
              <span>{split.guest.name}</span>
              <span className="email">{split.guest.email}</span>
            </div>
            <div className="split-amount">${split.amount}</div>
            <div className={`split-status status-${split.status}`}>
              {split.status}
            </div>
            {split.status !== 'paid' && (
              <button onClick={() => markAsPaid(split.id)}>
                Mark Paid
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### React Component: Guest List with Crew Conversion

```typescript
// components/GuestListManager.tsx
import { useState, useEffect } from 'react';

export function GuestListManager({ eventId }: { eventId: string }) {
  const [guests, setGuests] = useState<any[]>([]);

  const convertToCrew = async (guestId: string) => {
    try {
      const response = await fetch('/api/convert-guest-to-crew', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          guest_id: guestId,
          event_id: eventId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`${data.connection.user_profiles.display_name} added to your crew!`);
        // Refresh guest list
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Failed to convert guest:', error);
    }
  };

  return (
    <div className="guest-list">
      {guests.map((guest) => (
        <div key={guest.id} className="guest-item">
          <span>{guest.name}</span>
          {guest.user_id && (
            <button
              className="btn-convert-crew"
              onClick={() => convertToCrew(guest.id)}
            >
              Add to Crew
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## 🧪 Testing Checklist

### Manual Testing Flow

**1. Generate QR Code**
- [ ] Host creates event
- [ ] Host clicks "Generate QR Code"
- [ ] QR code displays with shareable link
- [ ] Link can be copied

**2. Join as Guest**
- [ ] User scans QR code (or opens link)
- [ ] Join page loads with event details
- [ ] User clicks "Join Event"
- [ ] Success message appears
- [ ] Crew prompt modal shows

**3. Add to Crew**
- [ ] User clicks "Yes — Add to Crew"
- [ ] Connection created
- [ ] Host appears in user's "Following" list
- [ ] User appears in host's "Followers" list

**4. Cost Splitting**
- [ ] Host creates cost split (equal)
- [ ] Each guest sees their amount
- [ ] Host marks payments as received
- [ ] Summary updates correctly

**5. Guest to Crew Conversion (Host)**
- [ ] Host views guest list
- [ ] Host clicks "Add to Crew" on guest
- [ ] Success notification appears
- [ ] Guest now in crew list

---

## 🚀 Deployment Steps

1. **Run Database Migration**
```bash
supabase db push supabase/migrations/20251103_guest_crew_features.sql
```

2. **Deploy API Endpoints**
```bash
# Netlify will auto-deploy from api/ folder
git add api/
git commit -m "feat: add guest/crew APIs and cost splitting"
git push origin main
```

3. **Update Frontend**
- Implement QR generator component
- Add join-via-token page route
- Add cost split UI to event management
- Add "Add to Crew" buttons on guest lists

4. **Test in Production**
- Create test event
- Generate QR code
- Scan with different account
- Verify guest + crew flow
- Test cost split creation

---

## 📊 Database Helper Functions

Already implemented in migration:

```sql
-- Generate unique token
SELECT generate_invite_token();

-- Validate token
SELECT is_invite_token_valid('inv_abc123...');

-- Increment usage (with concurrency safety)
SELECT increment_token_usage('inv_abc123...', 'user-uuid');

-- Convert guest to crew
SELECT convert_guest_to_crew(
  'guest-uuid',
  'host-uuid',
  'host_promoted'
);

-- Check if following
SELECT is_following('user1-uuid', 'user2-uuid');

-- Check mutual crew
SELECT is_mutual_crew('user1-uuid', 'user2-uuid');
```

---

## 🔒 Security Considerations

### Token Security
- Tokens expire after set duration
- Max uses prevents abuse
- Usage log tracks all scans
- Host can deactivate tokens anytime

### Permission Checks
- Only event hosts can generate tokens
- Only event hosts can manage cost splits
- Only event hosts can convert guests to crew
- RLS policies enforce all permissions at DB level

### Rate Limiting (Recommended)
```typescript
// Add to API endpoints
import rateLimit from 'express-rate-limit';

const inviteRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 invites per 15 min
  message: 'Too many invite generations, try again later',
});
```

---

## 📈 Analytics to Track

### Key Metrics
- **QR Scans:** How many times tokens are used
- **Guest → Crew Conversion Rate:** % of guests who join crew
- **Cost Split Adoption:** % of events using cost splits
- **Payment Completion Rate:** % of splits marked paid
- **Crew Growth:** New connections per event
- **Token Expiration:** Unused tokens vs used

### Queries
```sql
-- Conversion rate
SELECT 
  COUNT(DISTINCT guest_id) as total_guests,
  COUNT(DISTINCT CASE WHEN user_id IS NOT NULL THEN guest_id END) as registered_guests,
  COUNT(DISTINCT gcc.guest_id) as converted_to_crew,
  ROUND(COUNT(DISTINCT gcc.guest_id)::numeric / NULLIF(COUNT(DISTINCT guest_id), 0) * 100, 2) as conversion_rate
FROM guests g
LEFT JOIN guest_crew_conversions gcc ON g.id = gcc.guest_id
WHERE g.created_at > NOW() - INTERVAL '30 days';

-- Most popular events by QR scans
SELECT 
  e.name,
  e.id,
  SUM(eit.current_uses) as total_scans
FROM events e
JOIN event_invite_tokens eit ON e.id = eit.event_id
GROUP BY e.id
ORDER BY total_scans DESC
LIMIT 10;
```

---

## 🎯 Next Steps

### Phase 1 (Completed)
- ✅ Database schema
- ✅ API endpoints
- ✅ Row-level security policies
- ✅ Helper functions

### Phase 2 (Frontend - Ready to Implement)
- [ ] QR code generator UI
- [ ] Join-via-QR page with crew modal
- [ ] Cost split management interface
- [ ] Guest list with "Add to Crew" buttons
- [ ] Crew list page (already exists in social network)

### Phase 3 (Enhancements)
- [ ] Push notifications for join events
- [ ] Email notifications for cost splits
- [ ] Payment integration (Stripe/Venmo)
- [ ] Batch QR generation for multiple events
- [ ] QR code customization (colors, logos)
- [ ] Analytics dashboard

### Phase 4 (Advanced)
- [ ] NFC tap-to-join
- [ ] Bluetooth proximity invites
- [ ] Smart suggestions (suggest crew based on mutual friends)
- [ ] Auto-convert frequent guests to crew
- [ ] Gamification (badges for event participation)

---

## 🐛 Troubleshooting

### Common Issues

**"Token not found"**
- Token expired
- Token deleted
- Max uses reached
- Solution: Generate new token

**"Guest must have account to add to crew"**
- Guest joined anonymously
- Solution: Guest needs to sign up first, then host can convert

**"Already in crew"**
- Connection exists
- Solution: Show message, no action needed

**"Not authorized"**
- Non-host trying to manage event
- Solution: Verify auth token and event ownership

**Cost split not updating**
- Trigger not firing
- Solution: Manually update event_cost_summaries or check trigger logs

---

## 📝 Code Quality

### TypeScript Types
```typescript
// types/invite.ts
export interface InviteToken {
  id: string;
  event_id: string;
  token: string;
  token_type: 'guest_join' | 'crew_invite' | 'guest_and_crew';
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  created_by: string;
  is_active: boolean;
}

export interface CostSplit {
  id: string;
  event_id: string;
  guest_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  payment_method?: string;
  paid_at?: string;
  guest: {
    id: string;
    name: string;
    email: string;
  };
}

export interface JoinEventResponse {
  message: string;
  guest: Guest;
  event: Event;
  connection: {
    type: 'connected' | 'request_sent' | 'already_connected';
    connection?: Connection;
    request?: ConnectionRequest;
  } | null;
  show_crew_prompt: boolean;
}
```

---

## 🎊 Conclusion

**Implementation Status:** Backend Complete ✅

**What's Working:**
- Database schema with RLS
- 8 API endpoints fully functional
- Security policies enforced
- Cost splitting logic
- Guest-to-crew conversion
- Token generation and validation

**What's Next:**
Frontend implementation of:
1. QR code UI components
2. Join flow with crew modal
3. Cost split management screens
4. Guest management with crew buttons

**Ready to Test:**
All backend APIs can be tested with Postman/curl immediately.

---

**Document Version:** 1.0  
**Migration File:** `supabase/migrations/20251103_guest_crew_features.sql`  
**API Files:** `api/generate-invite.ts`, `api/join-event.ts`, `api/convert-guest-to-crew.ts`, `api/cost-split.ts`, `api/user-connections.ts`

🎉 **Where Your Crew Becomes Your Calendar** 🎉
