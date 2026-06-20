# PartyHaus Current Features Extension Guide

## Technical Roadmap for Extending Existing Features

This document provides specific technical recommendations for extending PartyHaus's current features into a comprehensive event management platform.

---

## 1. Guest Management System Extensions

### Current State
- Basic guest CRUD (`@/Users/startferanmi/partyhause/Partyhause/src/components/GuestList.tsx`)
- Simple status: `pending | confirmed | checked_in | no_show`
- QR code check-in
- Email invitation via templates

### Extension Roadmap

#### Phase 1: Enhanced Guest Profiles (2 weeks)

```typescript
// Extend Guest interface in @/Users/startferanmi/partyhause/Partyhause/src/store/usePartyStore.ts
export interface Guest {
  // ... existing fields ...
  
  // NEW FIELDS
  dietary_restrictions: string[];
  accessibility_needs: string[];
  meal_preference: 'vegetarian' | 'vegan' | 'gluten-free' | 'halal' | 'kosher' | 'none';
  seating_preference: string;
  companion_details: {
    name: string;
    relationship: string;
    age_group: 'child' | 'teen' | 'adult';
  }[];
  rsvp_notes: string;
  arrival_time_estimate: string;
  departure_time_estimate: string;
  gift_registry_contribution?: number;
  photos_shared: string[]; // URLs to uploaded photos
}
```

**Implementation:**
1. Add migration: `supabase/migrations/20251201_enhanced_guest_profiles.sql`
2. Create `GuestProfileForm` component with sections:
   - Dietary & Allergies
   - Accessibility Requirements
   - Companion Details (dynamic add/remove)
   - Preferences
3. Update `GuestList.tsx` to show dietary badges

#### Phase 2: Waitlist System (2 weeks)

```typescript
// New table: waitlist_entries
interface WaitlistEntry {
  id: string;
  event_id: string;
  email: string;
  name: string;
  phone?: string;
  position: number;
  status: 'waiting' | 'offered' | 'accepted' | 'expired';
  invited_at?: string;
  expires_at?: string;
  created_at: string;
}
```

**Key Features:**
- Auto-promote when guest cancels
- Time-limited offers (24h to accept)
- Batch notifications when capacity increases
- Position indicator for guests

**API Endpoint:**
```typescript
// @/Users/startferanmi/partyhause/Partyhause/api/waitlist.ts
export async function joinWaitlist(eventId: string, guestInfo: GuestInfo) {}
export async function promoteFromWaitlist(eventId: string, count: number) {}
export async function handleWaitlistOffer(entryId: string, accept: boolean) {}
```

#### Phase 3: Guest Segments & Tiers (2 weeks)

```typescript
// New table: guest_segments
interface GuestSegment {
  id: string;
  event_id: string;
  name: string; // e.g., "VIP", "Early Entry", "General"
  color: string;
  benefits: string[]; // e.g., ["Free drinks", "Priority seating"]
  check_in_time: string; // e.g., "18:00" for early entry
  special_instructions?: string;
}

// Update Guest interface
guest_segment_id?: string;
```

**UI Components:**
- `GuestSegmentManager` - CRUD for tiers
- `GuestSegmentAssignment` - Bulk assign guests to segments
- `CheckInBySegment` - Filter check-in by tier

#### Phase 4: Bulk Operations & Import (1 week)

```typescript
// New service: @/Users/startferanmi/partyhause/Partyhause/src/lib/guest-import.ts
export const guestImportService = {
  importFromCSV: async (file: File, eventId: string) => {
    // Parse CSV with columns: name, email, phone, dietary, plus_ones
    // Validate emails
    // Bulk insert with progress tracking
  },
  importFromGoogleContacts: async (eventId: string) => {
    // OAuth to Google
    // Select contacts to import
  },
  duplicateFromPreviousEvent: async (sourceEventId: string, targetEventId: string) => {
    // Copy guest list with option to modify
  }
};
```

#### Phase 5: Guest Communication Hub (3 weeks)

```typescript
// Extend email system (@/Users/startferanmi/partyhause/Partyhause/src/lib/email-tracking.ts)
interface GuestCommunication {
  id: string;
  guest_id: string;
  event_id: string;
  type: 'invitation' | 'reminder' | 'update' | 'thank_you' | 'custom';
  channel: 'email' | 'sms' | 'push';
  subject?: string;
  content: string;
  sent_at: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  status: 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed';
}

// New features:
// - Scheduled sends
// - A/B testing subject lines
// - Engagement tracking dashboard
// - Automated sequences (invite → reminder → thank you)
```

---

## 2. Timeline & Scheduling Extensions

### Current State
- Timeline blocks: activity, meal, speech, performance, break, custom
- Basic CRUD with time sorting
- Guest visibility toggle
- Pre-activity notifications

### Extension Roadmap

#### Phase 1: Advanced Timeline Features (2 weeks)

```typescript
// Extend TimelineBlock in @/Users/startferanmi/partyhause/Partyhause/src/features/timeline/types.ts
export interface TimelineBlock {
  // ... existing fields ...
  
  // NEW FIELDS
  location?: string; // Specific room/area within venue
  assigned_vendors?: string[]; // Vendor IDs from vendor management
  required_setup_time: number; // minutes before for setup
  required_breakdown_time: number; // minutes after for cleanup
  dependencies: string[]; // Block IDs that must complete before this
  contingency_plan?: string; // What to do if this runs late
  materials_needed: string[];
  estimated_cost?: number;
  actual_cost?: number;
  staff_required: number;
  max_capacity?: number; // For limited capacity activities
  signup_required: boolean;
  attendees: string[]; // Guest IDs who signed up
  weather_dependent: boolean;
  rain_location?: string;
}
```

#### Phase 2: Multi-Day Event Support (2 weeks)

```typescript
// New structure for multi-day events
export interface EventDay {
  id: string;
  event_id: string;
  day_number: number;
  date: string;
  theme?: string;
  timeline_blocks: TimelineBlock[];
  dress_code?: string;
  special_notes?: string;
}

// Update Event interface
timeline_days?: EventDay[]; // For complex multi-day events
current_timeline_structure: 'simple' | 'multi-day';
```

**UI Changes:**
- Day selector tabs in TimelineManagement
- Cross-day dependencies
- Daily summaries and stats

#### Phase 3: Drag-and-Drop Reordering (1 week)

```typescript
// Use @dnd-kit (already in dependencies!)
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable } from '@dnd-kit/sortable';

// Update TimelineManagement component
// - Wrap blocks in SortableContext
// - Enable drag handles
// - Auto-recalculate times on drop
// - Conflict detection (overlapping blocks)
```

#### Phase 4: Timeline Templates (1 week)

```typescript
// New table: timeline_templates
interface TimelineTemplate {
  id: string;
  name: string;
  description: string;
  event_type: string;
  duration_hours: number;
  blocks: Omit<TimelineBlock, 'id' | 'order'>[];
  is_public: boolean;
  created_by?: string;
  usage_count: number;
}

// Features:
// - "Wedding Reception Classic" template
// - "Corporate Networking Event" template
// - "Birthday Party 4-Hour" template
// - Auto-adjust times based on event start
```

#### Phase 5: Resource Conflict Detection (2 weeks)

```typescript
// Real-time validation
export function detectConflicts(blocks: TimelineBlock[]): Conflict[] {
  const conflicts: Conflict[] = [];
  
  // Check for overlapping venue spaces
  // Check for overbooked staff
  // Check for equipment double-booking
  // Check for impossible transitions (travel time)
  
  return conflicts;
}

// UI: Visual conflict indicators in timeline
// Suggest resolutions (move, shorten, reassign)
```

---

## 3. Event Creation Flow Extensions

### Current State
- 7-step wizard: template → details → form → timeline → invite-template → invite-customize → curate
- Template-based event creation
- Basic form with date/time/location

### Extension Roadmap

#### Phase 1: Draft Mode & Autosave (1 week)

```typescript
// Extend usePartyStore
interface DraftEvent {
  id: string; // draft_ + timestamp
  user_id: string;
  created_at: string;
  updated_at: string;
  step: string;
  formData: EventFormData;
  timelineBlocks: TimelineBlock[];
  selectedTemplate: EventTemplate | null;
  inviteData: CustomInviteData | null;
  completion_percentage: number;
}

// Features:
// - Autosave every 30 seconds
// - Recover draft on return
// - Multiple drafts per user
// - Draft expiration (30 days)
```

#### Phase 2: Event Duplication & Templates (1 week)

```typescript
// New feature: Duplicate existing event
export async function duplicateEvent(
  sourceEventId: string, 
  options: {
    copyGuests: boolean;
    copyTimeline: boolean;
    copyVendors: boolean;
    shiftDates: boolean; // Auto-adjust to new date
  }
): Promise<Event> {}

// UI: "Create Similar Event" button on past events
// Smart date shifting (maintain day-of-week, time patterns)
```

#### Phase 3: Collaborative Event Creation (3 weeks)

```typescript
// New table: event_collaborators
interface EventCollaborator {
  id: string;
  event_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  invited_by: string;
  invited_at: string;
  joined_at?: string;
  permissions: {
    canEditDetails: boolean;
    canManageGuests: boolean;
    canEditTimeline: boolean;
    canSendInvites: boolean;
    canViewAnalytics: boolean;
    canDeleteEvent: boolean;
  };
}

// Real-time collaboration:
// - Presence indicators (who's editing)
// - Live cursors in form fields
// - Conflict resolution for simultaneous edits
// - Activity log
// - Comments on specific sections
```

#### Phase 4: AI-Powered Event Assistant (4 weeks)

```typescript
// Integration with OpenAI/Anthropic
interface EventAssistant {
  suggestTimeline: (eventType: string, duration: number, preferences: any) => TimelineBlock[];
  suggestVendors: (eventType: string, location: string, budget: number) => VendorRecommendation[];
  optimizeSchedule: (blocks: TimelineBlock[], constraints: any) => TimelineBlock[];
  generateInviteCopy: (eventDetails: any, tone: string) => string;
  predictAttendance: (historicalData: any, eventDetails: any) => number;
}

// Features:
// - "Help me plan this event" chat interface
// - Auto-generate timeline from description
// - Smart vendor recommendations
// - Budget optimization suggestions
```

---

## 4. PartyCrew Social Network Extensions

### Current State
- Basic user connections
- Convert guests to crew members
- Profile pages

### Extension Roadmap

#### Phase 1: Enhanced Profiles (1 week)

```typescript
// Extend user_profiles
interface UserProfile {
  // ... existing fields ...
  
  // NEW FIELDS
  bio: string;
  interests: string[];
  event_preferences: {
    favorite_types: string[];
    preferred_times: string[];
    typical_budget_range: string;
    dietary_restrictions: string[];
  };
  event_history: {
    events_attended: number;
    events_hosted: number;
    crew_members_count: number;
    average_rating_received: number;
  };
  privacy_settings: {
    profile_visible_to: 'public' | 'crew_only' | 'private';
    events_visible_to: 'public' | 'crew_only' | 'private';
    allow_crew_suggestions: boolean;
  };
}
```

#### Phase 2: Crew Recommendations (2 weeks)

```typescript
// ML-based recommendations
export function suggestCrewMembers(
  userId: string,
  context: 'event' | 'general'
): Promise<SuggestedConnection[]> {
  // Factors:
  // - Mutual connections
  // - Attended same events
  // - Similar interests
  // - Location proximity
  // - Activity patterns
}

// UI: "People You May Know" section
// "Invite crew to this event" suggestions
```

#### Phase 3: Event Discovery (2 weeks)

```typescript
// New feed algorithm
interface EventDiscoveryEngine {
  // Public events from crew members
  // Events in your area matching interests
  // Trending events among your network
  // Friends attending (even if not crew)
}

// Features:
// - Map view of nearby events
// - Interest-based filtering
// - "Your crew is attending" indicators
```

#### Phase 4: Crew Groups (2 weeks)

```typescript
// New table: crew_groups
interface CrewGroup {
  id: string;
  name: string;
  description: string;
  created_by: string;
  members: string[]; // user_ids
  is_private: boolean;
  join_code?: string;
  avatar_url?: string;
  event_count: number;
  member_count: number;
}

// Use cases:
// - "College Friends" group
// - "Work Team" group
// - "Book Club" group
// - Bulk invite group to events
```

---

## 5. Polls & Voting Extensions

### Current State
- Basic poll creation
- Real-time voting
- Results display

### Extension Roadmap

#### Phase 1: Advanced Poll Types (1 week)

```typescript
// Extend poll types
export type PollType = 
  | 'single_choice'
  | 'multiple_choice' 
  | 'ranked_choice' // NEW
  | 'rating_scale' // NEW
  | 'open_ended' // NEW
  | 'date_time' // NEW - for scheduling
  | 'budget_allocation'; // NEW - divide budget across options

interface PollOption {
  // ... existing ...
  image_url?: string; // Visual options
  description?: string;
  estimated_cost?: number; // For budget-aware decisions
}
```

#### Phase 2: Conditional Logic (1 week)

```typescript
interface PollCondition {
  if_poll_id: string;
  if_option_selected: string;
  then_show_poll_id: string;
}

// Example flow:
// 1. "What type of food?" (Italian, Mexican, Indian)
// 2. If Italian → "Which Italian restaurant?"
// 3. If Mexican → "Which Mexican restaurant?"
```

#### Phase 3: Anonymous vs Named Voting (1 week)

```typescript
interface Poll {
  // ... existing ...
  voting_mode: 'anonymous' | 'named' | 'weighted';
  weighted_by?: 'seniority' | 'investment' | 'custom';
  allow_changing_vote: boolean;
  voting_deadline?: string;
  show_results: 'always' | 'after_voting' | 'after_deadline' | 'never';
}
```

---

## 6. Cost Split & Financial Extensions

### Current State
- Basic cost splitting among guests

### Extension Roadmap

#### Phase 1: Full Expense Management (2 weeks)

```typescript
// New table: event_expenses
interface EventExpense {
  id: string;
  event_id: string;
  category: 'venue' | 'catering' | 'decor' | 'entertainment' | 'transportation' | 'gifts' | 'other';
  description: string;
  amount: number;
  currency: string;
  paid_by: string; // user_id
  split_type: 'equal' | 'percentage' | 'custom';
  splits: {
    user_id: string;
    amount: number;
    status: 'pending' | 'paid';
    paid_at?: string;
  }[];
  receipt_url?: string;
  created_at: string;
}

// Features:
// - Expense categories with budgets
// - Receipt photo upload
// - Split calculations
// - Payment tracking
```

#### Phase 2: Payment Collection (3 weeks)

```typescript
// Integration with Stripe/Square/Venmo
interface PaymentCollection {
  id: string;
  event_id: string;
  type: 'ticket' | 'contribution' | 'split';
  amount: number;
  service_fee: number; // Platform fee
  total_to_charge: number;
  stripe_payment_intent_id?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  refund_amount?: number;
  refund_reason?: string;
}

// Host payout:
// - Automatic transfer to host
// - Payout schedule (daily/weekly/monthly)
// - Tax document generation (1099-K)
```

---

## 7. Communication & Notification Extensions

### Current State
- Email sending with tracking
- Basic webhooks

### Extension Roadmap

#### Phase 1: Multi-Channel Notifications (2 weeks)

```typescript
// Unified notification system
interface NotificationChannel {
  email: {
    enabled: boolean;
    templates: EmailTemplate[];
    tracking: boolean;
  };
  sms: {
    enabled: boolean;
    provider: 'twilio' | 'messagebird';
    short_code?: string;
  };
  push: {
    enabled: boolean;
    vapid_keys?: string;
    fcm_config?: any;
  };
  in_app: {
    enabled: boolean;
    badge_count: boolean;
  };
}

// Notification preferences per user
interface NotificationPreferences {
  event_reminders: { email: boolean; sms: boolean; push: boolean; hours_before: number[] };
  guest_rsvps: { email: boolean; push: boolean; };
  crew_activity: { email: boolean; in_app: boolean; };
  messages: { email: boolean; push: boolean; in_app: boolean; };
  marketing: { email: boolean; frequency: 'daily' | 'weekly' | 'monthly' | 'never' };
}
```

#### Phase 2: Real-Time Chat System (4 weeks)

```typescript
// New infrastructure: WebSocket or Ably/Pusher
interface ChatSystem {
  // Event-wide group chat
  // Direct messages between guests
  // Host announcements (pinned messages)
  // Media sharing (photos, files)
  // Message reactions
  // @mentions
  // Typing indicators
  // Read receipts
}

// Tables:
// - chat_channels (event-wide, direct)
// - chat_messages
// - chat_participants
// - chat_reactions
```

---

## 8. Analytics & Reporting Extensions

### Current State
- Basic email tracking
- Check-in counts

### Extension Roadmap

#### Phase 1: Event Analytics Dashboard (2 weeks)

```typescript
interface EventAnalytics {
  // Attendance
  invitations_sent: number;
  invitations_delivered: number;
  invitations_opened: number;
  rsvp_rate: number;
  rsvp_breakdown: { confirmed: number; declined: number; pending: number };
  check_in_rate: number;
  no_show_rate: number;
  average_arrival_time: string;
  
  // Engagement
  timeline_views: number;
  playlist_interactions: number;
  poll_participation_rate: number;
  photos_uploaded: number;
  messages_sent: number;
  
  // Financial (if applicable)
  revenue: number;
  average_ticket_price: number;
  refund_rate: number;
  expenses: number;
  profit_margin: number;
}

// Visualization:
// - RSVP funnel chart
// - Check-in timeline (when people arrived)
// - Demographics pie charts
// - Engagement heatmap
```

#### Phase 2: Host Performance Dashboard (2 weeks)

```typescript
interface HostAnalytics {
  // Across all events
  total_events: number;
  total_guests_invited: number;
  average_attendance_rate: number;
  average_event_rating: number;
  revenue_generated: number;
  crew_size: number;
  repeat_attendee_rate: number;
  
  // Benchmarks
  vs_platform_average: {
    attendance: number; // percentage above/below
    rating: number;
    engagement: number;
  };
  
  // Trends
  monthly_growth: number[];
  event_type_performance: Record<string, number>;
}
```

---

## Implementation Priority Matrix

### Immediate (This Month)
1. **Draft Mode** - High impact, low effort
2. **Dietary Dashboard** - Critical for event planning
3. **Bulk Guest Import** - Saves hours for large events

### Short-term (Next 3 Months)
1. **Waitlist System** - Revenue recovery feature
2. **Multi-day Events** - High demand for conferences
3. **Advanced Poll Types** - Better decision making
4. **Enhanced Guest Segments** - VIP management

### Medium-term (Next 6 Months)
1. **Payment Processing** - Enable monetization
2. **Real-time Chat** - Engagement boost
3. **Collaborative Editing** - Team event planning
4. **Analytics Dashboard** - Host retention

### Long-term (Next 12 Months)
1. **AI Event Assistant** - Differentiator feature
2. **White-label Platform** - Enterprise revenue
3. **Mobile App** - Push notifications native
4. **Public API** - Ecosystem building

---

## Technical Debt & Refactoring Notes

### Before Major Extensions

1. **State Management**
   - Current: Single `usePartyStore` growing large
   - Refactor: Split into `useEventStore`, `useGuestStore`, `useUserStore`

2. **API Layer**
   - Current: Mixed direct Supabase calls
   - Refactor: Consistent service layer with caching

3. **Type Safety**
   - Current: Some `any` types in components
   - Refactor: Strict TypeScript across all API responses

4. **Testing**
   - Current: Basic unit tests
   - Add: Integration tests for critical flows

### Database Optimization

```sql
-- Add indexes for new features
CREATE INDEX idx_guests_event_status ON guests(event_id, status);
CREATE INDEX idx_timeline_blocks_event ON events USING GIN(timeline_blocks);
CREATE INDEX idx_waitlist_event_position ON waitlist_entries(event_id, position);
CREATE INDEX idx_expenses_event_category ON event_expenses(event_id, category);

-- Partition large tables
-- events by created_at (monthly)
-- guests by event_id
-- email_logs by sent_at (monthly)
```

---

## Success Metrics for Each Extension

| Feature | Primary Metric | Target | Secondary Metric |
|---------|---------------|--------|------------------|
| Waitlist | Waitlist-to-ticket rate | 60% | Time to fill cancelled spots |
| Bulk Import | Guest addition time | <5 min for 100 guests | Import success rate |
| Chat | Messages per event | 20+ | Active user rate |
| Payments | Payment success rate | 95%+ | Time to payout |
| Analytics | Dashboard views | 3+ per host | Retention impact |
| AI Assistant | Suggestion acceptance | 40%+ | Time saved planning |

---

*Document Version: 1.0*
*Technical Lead Review Required Before Implementation*
*Update with learnings after each phase*
