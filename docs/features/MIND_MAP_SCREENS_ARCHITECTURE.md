# 📱 Mind Map Planning - Screen Architecture

**Version:** 1.0  
**Date:** October 25, 2025  
**Platform:** React Native (Expo)  
**Navigation:** Expo Router (File-based)  

---

## 📐 Current Screen Structure

```
apps/mobile/
├─ app/
│  ├─ (tabs)/
│  │  ├─ index.tsx              → Dashboard/Home
│  │  └─ explore.tsx            → Explore Events
│  │
│  ├─ events/
│  │  ├─ [id]/                  → Event Details
│  │  ├─ create/                → Event Creation Wizard
│  │  └─ drafts.tsx             → Draft Events
│  │
│  └─ modal.tsx                 → Generic Modals
│
└─ components/screens/
   ├─ AuthScreen.tsx
   ├─ DashboardScreen.tsx
   ├─ EventCreationScreen.tsx
   ├─ EventDetailsScreen.tsx
   ├─ GuestManagementScreen.tsx
   ├─ LandingScreen.tsx
   └─ LandingScreenEnhanced.tsx
```

---

## 🆕 New Mind Map Planning Screens

### **File Structure:**

```
apps/mobile/
├─ app/
│  ├─ events/
│  │  └─ [id]/
│  │     ├─ index.tsx           → Event Details (existing)
│  │     ├─ planning/           → NEW: Mind Map Planning
│  │     │  ├─ _layout.tsx      → Planning Layout
│  │     │  ├─ index.tsx        → Main Mind Map View
│  │     │  ├─ node/
│  │     │  │  └─ [nodeId].tsx  → Node Details Modal
│  │     │  ├─ collaborators.tsx → Team Management
│  │     │  ├─ vendors.tsx      → Vendor Management
│  │     │  └─ activity.tsx     → Activity Feed
│  │     │
│  │     └─ guests.tsx          → Guest Management (existing)
│  │
│  └─ vendor/                    → NEW: Vendor Portal
│     ├─ _layout.tsx
│     ├─ dashboard.tsx          → Vendor Dashboard
│     ├─ events.tsx             → Vendor's Events List
│     └─ event/
│        └─ [eventId].tsx       → Vendor Event View
│
└─ components/
   ├─ screens/
   │  ├─ MindMapScreen.tsx              → NEW: Main mind map
   │  ├─ NodeDetailsScreen.tsx          → NEW: Task details
   │  ├─ CollaboratorsScreen.tsx        → NEW: Team management
   │  ├─ VendorDashboardScreen.tsx      → NEW: Vendor portal
   │  └─ ActivityFeedScreen.tsx         → NEW: Activity timeline
   │
   └─ mindmap/                           → NEW: Mind map components
      ├─ MindMapCanvas.tsx              → Interactive canvas
      ├─ MindMapTree.tsx                → Hierarchical tree view
      ├─ NodeCard.tsx                   → Individual node card
      ├─ NodeDetailsModal.tsx           → Edit/view node
      ├─ QuickActionsMenu.tsx           → Long-press menu
      ├─ StatusPicker.tsx               → Status selector
      ├─ AssignmentPicker.tsx           → User/vendor picker
      ├─ CollaboratorsList.tsx          → Team list
      ├─ VendorCard.tsx                 → Vendor assignment
      ├─ ActivityFeed.tsx               → Activity timeline
      ├─ PresenceIndicator.tsx          → Live presence
      └─ CommentThread.tsx              → Comments UI
```

---

## 📱 Screen Details

### **1. Main Mind Map Screen** 
**Route:** `/events/[id]/planning`  
**Component:** `MindMapScreen.tsx`

```typescript
// Purpose: Central planning hub for event
// Access: Host, Co-planners, Task owners (filtered view)

┌─────────────────────────────────────────┐
│ ← 🎉 Sarah's Birthday Party             │
│ [View Mode ▼] [👥] [🔔] [⚙️]           │
├─────────────────────────────────────────┤
│                                         │
│ [Overview] [Tree] [Timeline] [Vendors] │
│                                         │
│ ───────────────────────────────────────  │
│                                         │
│        🎉 Sarah's Birthday              │
│         Nov 15, 2025                    │
│      Progress: ███████░░░ 65%          │
│                                         │
│         ┌───────┼───────┐               │
│         │       │       │               │
│      🍽️Food  📍Venue  💌Invites         │
│       (3/5)   (2/4)    (1/3)           │
│         │                               │
│    ┌────┼────┐                          │
│    │    │    │                          │
│  🍕Pizza 🥤Drinks 🎂Cake                │
│   ✅    ⏳     🤝                        │
│                                         │
│ ───────────────────────────────────────  │
│                                         │
│ 👥 Active Now (3):                      │
│ • Mike editing "Decorations" 🔵         │
│ • Joe's Liquor updating status 🟣      │
│ • You                                   │
│                                         │
│ [+ Add Category] [💬 Chat] [📊 Stats]  │
└─────────────────────────────────────────┘
```

**Features:**
- Interactive mind map canvas
- Pan/zoom gestures
- Tap to expand/collapse nodes
- Long-press for quick actions
- Real-time presence indicators
- Progress visualization
- View mode switcher (Overview/Tree/Timeline)

**Navigation:**
```typescript
// From Event Details
router.push(`/events/${eventId}/planning`);

// Open node details
router.push(`/events/${eventId}/planning/node/${nodeId}`);
```

---

### **2. Node Details Screen**
**Route:** `/events/[id]/planning/node/[nodeId]`  
**Component:** `NodeDetailsScreen.tsx`

```typescript
// Purpose: View and edit individual task/node
// Access: Based on permissions (host sees all, others see assigned)

┌─────────────────────────────────────────┐
│ ← Node Details                    [⋮]   │
├─────────────────────────────────────────┤
│                                         │
│ 🍕 Order Pizza for 50 guests            │
│ Category: 🍽️ Food & Drinks → Main      │
│                                         │
│ Status: ⏳ In Progress                  │
│ [Change Status ▼]                       │
│                                         │
│ 👤 Assigned to: Sarah (you)             │
│ [Reassign]                              │
│                                         │
│ 📅 Due: Nov 10, 2025 (5 days)          │
│ [Change Date]                           │
│                                         │
│ 💰 Budget: $350                         │
│ [Edit Budget]                           │
│                                         │
│ ───────────────────────────────────────  │
│                                         │
│ 📝 Description:                         │
│ Order vegetarian and meat options.      │
│ Ensure gluten-free available.           │
│ [Edit]                                  │
│                                         │
│ ✓ Sub-tasks (2/3):                      │
│ ☑️ Choose pizza place                   │
│ ☑️ Get menu options                     │
│ ☐ Finalize order                        │
│ [+ Add Sub-task]                        │
│                                         │
│ 🔗 Related Tasks:                       │
│ → 🍽️ Serving dishes (depends on this)  │
│ → 📍 Venue capacity (affects quantity)  │
│ [Link Task]                             │
│                                         │
│ 📎 Attachments (2):                     │
│ • Menu.pdf                              │
│ • Quote_Nov5.pdf                        │
│ [+ Upload]                              │
│                                         │
│ 💬 Comments (3):                        │
│ Mike: "Make sure we have veggie!"       │
│ You: "Got it, ordering 10 veggie"       │
│ Sarah: "Perfect 👍"                     │
│ [Add Comment]                           │
│                                         │
│ ───────────────────────────────────────  │
│                                         │
│ ⚡ Quick Actions:                       │
│ [✅ Mark Complete] [🗑️ Delete]         │
│ [📸 Add Photo] [🔄 Convert to Vendor]  │
│                                         │
└─────────────────────────────────────────┘
```

**Features:**
- Full task details
- Status update
- Assignment management
- Budget tracking
- Sub-task checklist
- Related task linking
- File attachments
- Comment thread
- Activity history

---

### **3. Collaborators Management Screen**
**Route:** `/events/[id]/planning/collaborators`  
**Component:** `CollaboratorsScreen.tsx`

```typescript
// Purpose: Manage team members and permissions
// Access: Host only (full control), Co-planners (view only)

┌─────────────────────────────────────────┐
│ ← Team & Collaborators                  │
│ [+ Invite] [Settings]                   │
├─────────────────────────────────────────┤
│                                         │
│ 👥 Active Collaborators (4)             │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 👤 Sarah Johnson (You)              │ │
│ │    Host • Full access               │ │
│ │    [View Profile]                   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 👤 Mike Rodriguez                   │ │
│ │    Co-planner • Can edit tasks      │ │
│ │    Active now 🟢                    │ │
│ │    Tasks: 5 • Completed: 2          │ │
│ │    [Message] [Change Role ▼]        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 👤 Jessica Chen                     │ │
│ │    Task Owner • Limited access      │ │
│ │    Last active: 2h ago              │ │
│ │    Tasks: 1 • Completed: 0          │ │
│ │    [Message] [Change Role ▼]        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 👤 David Kim                        │ │
│ │    Viewer • View only               │ │
│ │    Invitation pending ⏳            │ │
│ │    Sent: 2 days ago                 │ │
│ │    [Resend] [Cancel]                │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ───────────────────────────────────────  │
│                                         │
│ 🏪 Vendors (2)                          │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🍰 Sweet Treats Bakery              │ │
│ │    Vendor • Cake delivery           │ │
│ │    Status: ✅ Confirmed             │ │
│ │    Tasks: 1 • Progress: 80%         │ │
│ │    [View Details] [Message]         │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🏪 Joe's Liquor Store               │ │
│ │    Vendor • Beverage supply         │ │
│ │    Status: ⏳ In Progress           │ │
│ │    Tasks: 1 • Progress: 50%         │ │
│ │    [View Details] [Message]         │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [+ Invite People] [+ Find Vendors]      │
│                                         │
└─────────────────────────────────────────┘
```

**Features:**
- List all collaborators
- Role management (Host, Co-planner, Task owner, Viewer)
- Permission settings
- Activity status (online/offline)
- Task statistics per person
- Direct messaging
- Invitation management
- Vendor list

---

### **4. Vendor Management Screen**
**Route:** `/events/[id]/planning/vendors`  
**Component:** `VendorsScreen.tsx`

```typescript
// Purpose: Manage all vendors for event
// Access: Host and Co-planners

┌─────────────────────────────────────────┐
│ ← Vendors & Services                    │
│ [+ Find Vendor] [Filter ▼]             │
├─────────────────────────────────────────┤
│                                         │
│ [Active] [Pending] [Completed] [All]   │
│                                         │
│ 🏪 Active Vendors (2)                   │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🍰 Sweet Treats Bakery              │ │
│ │ Category: 🎂 Catering • Desserts    │ │
│ │                                     │ │
│ │ Task: Custom birthday cake          │ │
│ │ Status: ⏳ In Progress (80%)        │ │
│ │                                     │ │
│ │ Quote: $150 ✅ Approved             │ │
│ │ Payment: $75 paid (50%)             │ │
│ │ Due: Nov 14 (delivery)              │ │
│ │                                     │ │
│ │ ⭐⭐⭐⭐⭐ 4.8 (127 reviews)           │ │
│ │                                     │ │
│ │ Latest Update:                      │ │
│ │ "Cake design approved, starting     │ │
│ │  production tomorrow" - 2h ago      │ │
│ │                                     │ │
│ │ [Message] [View Details] [Track]    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🏪 Joe's Liquor Store               │ │
│ │ Category: 🥤 Beverages              │ │
│ │                                     │ │
│ │ Task: Alcohol & beverage supply     │ │
│ │ Status: ⏳ In Progress (50%)        │ │
│ │                                     │ │
│ │ Quote: $280 ✅ Approved             │ │
│ │ Payment: $140 paid (50%)            │ │
│ │ Due: Nov 15 (day-of delivery)       │ │
│ │                                     │ │
│ │ ⭐⭐⭐⭐☆ 4.2 (89 reviews)            │ │
│ │                                     │ │
│ │ ⚠️ Action needed:                   │ │
│ │ Joe requested delivery address      │ │
│ │                                     │ │
│ │ [Message] [View Details] [Respond]  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ───────────────────────────────────────  │
│                                         │
│ 💡 Recommended Vendors                  │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🎵 DJ Party Vibes                   │ │
│ │ Entertainment • Music               │ │
│ │ ⭐⭐⭐⭐⭐ 4.9 (203 reviews)           │ │
│ │ "Great for birthday parties"        │ │
│ │ Starting at: $200                   │ │
│ │ [Request Quote] [View Profile]      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Browse Vendor Marketplace]             │
│                                         │
└─────────────────────────────────────────┘
```

**Features:**
- List of hired vendors
- Vendor status tracking
- Quote/payment management
- Direct messaging
- Delivery tracking
- Recommended vendors (AI-powered)
- Marketplace access

---

### **5. Activity Feed Screen**
**Route:** `/events/[id]/planning/activity`  
**Component:** `ActivityFeedScreen.tsx`

```typescript
// Purpose: Timeline of all planning activity
// Access: All collaborators (filtered by permissions)

┌─────────────────────────────────────────┐
│ ← Activity Feed                         │
│ [Filter ▼] [Search]                     │
├─────────────────────────────────────────┤
│                                         │
│ [All] [My Tasks] [Comments] [Vendors]  │
│                                         │
│ 📅 Today                                │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🕐 2 minutes ago                    │ │
│ │ 👤 Mike marked task as complete     │ │
│ │ ✅ Vegetarian pizza options         │ │
│ │ 💬 "Found perfect place!"           │ │
│ │ [View Task] [👍 React]              │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🕐 15 minutes ago                   │ │
│ │ 🏪 Joe's Liquor updated status      │ │
│ │ ⏳ Beverage supply → In Progress    │ │
│ │ 📎 Attached: final_selection.pdf    │ │
│ │ [View] [Download]                   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🕐 1 hour ago                       │ │
│ │ 👤 Sarah assigned task              │ │
│ │ Jessica → 💌 Send invitations      │ │
│ │ Due: Nov 8                          │ │
│ │ [View Task]                         │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🕐 2 hours ago                      │ │
│ │ 🍰 Sweet Treats confirmed booking   │ │
│ │ ✅ Cake order → Confirmed           │ │
│ │ Payment: $75 received (deposit)     │ │
│ │ [View Contract]                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 📅 Yesterday                            │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🕐 18 hours ago                     │ │
│ │ 👤 Mike added comment               │ │
│ │ 💬 On "Decorations setup"           │ │
│ │ "Need help with balloon arch"       │ │
│ │ └─ Sarah replied: "I'll help!"      │ │
│ │ [View Thread]                       │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🕐 Yesterday, 3:30 PM               │ │
│ │ 👤 You created category             │ │
│ │ ➕ 🎁 Party Favors                  │ │
│ │ Added 3 sub-tasks                   │ │
│ │ [View]                              │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Load More Activity...]                 │
│                                         │
└─────────────────────────────────────────┘
```

**Features:**
- Chronological activity timeline
- Filter by type (tasks, comments, vendors)
- Real-time updates
- Quick reactions
- Deep links to tasks
- Search functionality

---

### **6. Vendor Dashboard Screen** (Vendor Portal)
**Route:** `/vendor/dashboard`  
**Component:** `VendorDashboardScreen.tsx`

```typescript
// Purpose: Main dashboard for vendors
// Access: Vendors only

┌─────────────────────────────────────────┐
│ 🏪 Joe's Liquor Store                   │
│ [Settings] [Messages] [Help]            │
├─────────────────────────────────────────┤
│                                         │
│ 📊 Overview                             │
│                                         │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ │   5      │ │    3     │ │  $1,240  │ │
│ │  Active  │ │ Quotes   │ │ Pending  │ │
│ │  Events  │ │ Pending  │ │ Payment  │ │
│ └──────────┘ └──────────┘ └──────────┘ │
│                                         │
│ ⚡ Needs Attention (2)                  │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🎉 Sarah's Birthday Party           │ │
│ │ Your task: Beverage supply          │ │
│ │ ⚠️ Host requested delivery address  │ │
│ │ Due: Nov 15 (20 days)               │ │
│ │ [Respond Now]                       │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 💒 Wilson Wedding                   │ │
│ │ Your task: Full bar service         │ │
│ │ 💰 Quote needs update (price change)│ │
│ │ Due: Nov 20 (25 days)               │ │
│ │ [Update Quote]                      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 🎯 Active Events (5)                    │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🎉 Sarah's Birthday • Nov 15        │ │
│ │ Status: ⏳ In Progress (50%)        │ │
│ │ Payment: $140 / $280 (50%)          │ │
│ │ [View Details]                      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 💒 Wilson Wedding • Nov 20          │ │
│ │ Status: 🤝 Confirmed, not started   │ │
│ │ Payment: $0 / $450 (0%)             │ │
│ │ [View Details]                      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [View All Events]                       │
│                                         │
│ 💬 Recent Messages (3)                  │
│ • Sarah: "Can we add wine selection?"  │
│ • John: "Quote approved!"               │
│ • Emma: "When can you deliver?"         │
│ [View All]                              │
│                                         │
│ ───────────────────────────────────────  │
│                                         │
│ 📊 This Month:                          │
│ • 12 quotes sent                        │
│ • 8 bookings confirmed                  │
│ • $4,280 revenue                        │
│ • ⭐ 4.8 rating (32 reviews)            │
│                                         │
└─────────────────────────────────────────┘
```

**Features:**
- Overview stats
- Urgent actions
- Active events list
- Message inbox
- Performance metrics
- Review management

---

### **7. Vendor Event View Screen**
**Route:** `/vendor/event/[eventId]`  
**Component:** `VendorEventViewScreen.tsx`

```typescript
// Purpose: Vendor's view of specific event assignment
// Access: Vendor only (scoped to their tasks)

┌─────────────────────────────────────────┐
│ ← Sarah's Birthday Party                │
│ [Message Host] [Help]                   │
├─────────────────────────────────────────┤
│                                         │
│ 📦 Your Assignment                      │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🥤 Beverage Supply                  │ │
│ │                                     │ │
│ │ Event Date: Nov 15, 2025            │ │
│ │ Time: 7:00 PM - 11:00 PM            │ │
│ │ Guests: 50 people                   │ │
│ │ Budget: $280                        │ │
│ │                                     │ │
│ │ 📍 Delivery Location:               │ │
│ │ [⚠️ Host hasn't provided yet]       │ │
│ │ [Request Info]                      │ │
│ │                                     │ │
│ │ Status: ⏳ In Progress (50%)        │ │
│ │ [Update Status ▼]                   │ │
│ │ • Not Started                       │ │
│ │ • In Progress (current)             │ │
│ │ • Ready for Delivery                │ │
│ │ • Completed                         │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 💰 Financial Details                    │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Your Quote: $280 ✅ Approved        │ │
│ │ Deposit: $140 ✅ Received           │ │
│ │ Balance: $140 ⏳ Due on completion  │ │
│ │ [View Invoice] [Upload Receipt]     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ✓ Your Checklist                        │
│                                         │
│ ☑️ Quote submitted & approved           │
│ ☑️ Deposit received                     │
│ ⏳ Finalize product selection           │
│ ☐ Get delivery address                  │
│ ☐ Arrange delivery truck                │
│ ☐ Confirm delivery time                 │
│ [+ Add Item]                            │
│                                         │
│ 📋 Requirements from Host               │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ❓ Questions for Host:               │ │
│ │ • Delivery address & time?          │ │
│ │ • Ice requirements?                 │ │
│ │ • Cups/glassware provided?          │ │
│ │ • Setup help available?             │ │
│ │ [Send Questions]                    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 📎 Documents & Photos                   │
│                                         │
│ • Quote_Nov5.pdf ✅                     │
│ • Product_Selection.pdf ⏳              │
│ • Contract_Signed.pdf ✅                │
│ [+ Upload File]                         │
│                                         │
│ ℹ️ Event Context (Read-only)            │
│                                         │
│ ▼ 🍽️ Food & Drinks                     │
│   ├─ 🍕 Main Course (for 50)           │
│   │   └─ Pizza delivery at 6:30pm      │
│   ├─ 🥤 Beverages ← YOU ARE HERE       │
│   │   ├─ Soft drinks (host handling)   │
│   │   ├─ 🏪 Alcohol (YOUR TASK) ⏳     │
│   │   └─ Ice (coordinate with you)     │
│   └─ 🎂 Cake                           │
│       └─ Delivery at 7:30pm            │
│                                         │
│ 💬 Messages with Host (3)               │
│                                         │
│ Sarah: "Can we add wine selection?"     │
│ You: "Yes, updated quote attached"      │
│ Sarah: "Perfect! Approved."             │
│ [View All Messages]                     │
│                                         │
│ [Mark Task Complete] [Need Help]        │
│                                         │
└─────────────────────────────────────────┘
```

**Features:**
- Task details scoped to vendor
- Status updates
- Checklist management
- Document uploads
- Host communication
- Payment tracking
- Context visibility (related tasks)

---

## 🎯 Screen Flow Diagrams

### **Host Flow:**

```
Dashboard
   ↓
Event Details
   ↓
Planning Hub (Mind Map) ← Main screen
   ├─→ Node Details (edit any task)
   ├─→ Collaborators (manage team)
   ├─→ Vendors (find & manage vendors)
   └─→ Activity Feed (monitor progress)
```

### **Co-Planner Flow:**

```
Dashboard
   ↓
Event Details (invited event)
   ↓
Planning Hub (Mind Map) ← Filtered view
   ├─→ Node Details (edit own tasks only)
   ├─→ My Tasks (quick view)
   └─→ Activity Feed (see updates)
```

### **Vendor Flow:**

```
Vendor Dashboard
   ├─→ Active Events List
   │     ↓
   │   Specific Event View
   │     ├─→ Update Status
   │     ├─→ Upload Documents
   │     ├─→ Message Host
   │     └─→ View Context
   │
   ├─→ Messages
   ├─→ Quotes Management
   └─→ Payment History
```

### **Task Owner Flow:**

```
Notification: "You've been assigned a task"
   ↓
Task Details Screen
   ├─→ Update Status
   ├─→ Add Sub-tasks
   ├─→ Upload Photos
   ├─→ Ask Questions
   └─→ Mark Complete
```

---

## 🔄 Navigation Implementation

### **Expo Router File Structure:**

```typescript
// apps/mobile/app/events/[id]/planning/_layout.tsx
export default function PlanningLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Planning" }} />
      <Stack.Screen 
        name="node/[nodeId]" 
        options={{ 
          presentation: "modal",
          title: "Task Details" 
        }} 
      />
      <Stack.Screen name="collaborators" options={{ title: "Team" }} />
      <Stack.Screen name="vendors" options={{ title: "Vendors" }} />
      <Stack.Screen name="activity" options={{ title: "Activity" }} />
    </Stack>
  );
}

// apps/mobile/app/vendor/_layout.tsx
export default function VendorLayout() {
  return (
    <Stack>
      <Stack.Screen name="dashboard" options={{ title: "Dashboard" }} />
      <Stack.Screen name="events" options={{ title: "My Events" }} />
      <Stack.Screen 
        name="event/[eventId]" 
        options={{ title: "Event Details" }} 
      />
    </Stack>
  );
}
```

### **Navigation Examples:**

```typescript
// Navigate to mind map planning
import { router } from 'expo-router';

// From Event Details → Mind Map
router.push(`/events/${eventId}/planning`);

// Open specific node
router.push(`/events/${eventId}/planning/node/${nodeId}`);

// Manage team
router.push(`/events/${eventId}/planning/collaborators`);

// View vendors
router.push(`/events/${eventId}/planning/vendors`);

// Activity feed
router.push(`/events/${eventId}/planning/activity`);

// Vendor portal (if user is vendor)
router.push('/vendor/dashboard');

// Vendor viewing specific event
router.push(`/vendor/event/${eventId}`);
```

---

## 🎨 UI Components Needed

### **Reusable Components:**

```
components/mindmap/
├─ MindMapCanvas.tsx          → Interactive canvas with pan/zoom
├─ MindMapTree.tsx            → Hierarchical tree view
├─ NodeCard.tsx               → Task card component
├─ CategoryNode.tsx           → Main category bubble
├─ TaskNode.tsx               → Leaf task node
├─ VendorNode.tsx             → Vendor assignment node
├─ ConnectionLine.tsx         → Visual links between nodes
├─ NodeDetailsModal.tsx       → Edit/view modal
├─ StatusBadge.tsx            → Status indicator
├─ ProgressBar.tsx            → Visual progress
├─ AssignmentPicker.tsx       → User/vendor selector
├─ DatePicker.tsx             → Due date picker
├─ BudgetInput.tsx            → Cost input
├─ SubTaskList.tsx            → Checklist
├─ CommentThread.tsx          → Comment UI
├─ AttachmentList.tsx         → File uploads
├─ QuickActionsMenu.tsx       → Long-press menu
├─ PresenceIndicator.tsx      → Live user presence
├─ ActivityItem.tsx           → Activity feed item
├─ CollaboratorCard.tsx       → Team member card
├─ VendorCard.tsx             → Vendor info card
├─ InviteModal.tsx            → Invite people
└─ PermissionPicker.tsx       → Role selector
```

---

## 📊 Summary

### **Screen Count:**

**New Screens:** 7 main screens
- MindMapScreen (main planning hub)
- NodeDetailsScreen (task details)
- CollaboratorsScreen (team management)
- VendorsScreen (vendor management)
- ActivityFeedScreen (timeline)
- VendorDashboardScreen (vendor portal)
- VendorEventViewScreen (vendor task view)

**New Components:** ~25 reusable components

**Routes Added:** 
- `/events/[id]/planning/*` (5 routes)
- `/vendor/*` (3 routes)

### **Development Timeline:**

**Phase 1:** Basic mind map UI (2 weeks)
- MindMapScreen with tree view
- NodeDetailsScreen
- Basic CRUD operations

**Phase 2:** Collaboration (2 weeks)
- CollaboratorsScreen
- Real-time updates
- Activity feed

**Phase 3:** Vendor portal (2 weeks)
- Vendor screens
- Quote management
- Payment tracking

**Phase 4:** Advanced features (2 weeks)
- Visual canvas
- Live presence
- Smart suggestions

---

**Ready to start building?** Want me to create any of these screens first? 🚀
