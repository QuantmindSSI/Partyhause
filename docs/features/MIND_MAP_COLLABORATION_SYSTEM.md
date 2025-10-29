# 🤝 Mind Map Collaborative Planning System

**Version:** 1.0  
**Date:** October 25, 2025  
**Status:** 🎨 Design Phase  
**Priority:** Critical for Multi-User Events  

---

## 🎯 Core Concept: Role-Based Interactive Mind Map

**Vision:** Every person involved in event planning has **exactly the view and controls they need** - no more, no less.

---

## 👥 User Roles & Permissions

### **1. Host / Event Creator** (Full Control)
- Create/edit/delete any node
- Assign tasks to anyone
- Invite vendors and collaborators
- Change event settings
- See all financial information
- Archive/delete event

### **2. Co-Planner** (Planning Partner)
- Create/edit/delete nodes they created
- Assign tasks (except to vendors)
- See all event details
- Comment on any node
- Cannot delete event
- Cannot manage finances

### **3. Task Owner** (Responsible Person)
- Edit only their assigned tasks
- Update status (Not Started → In Progress → Completed)
- Add sub-tasks under their tasks
- Upload photos/attachments
- Comment on their tasks
- See context (parent tasks)

### **4. Vendor** (Service Provider)
- See only their assigned branch + context
- Update their task status
- Add checklist items they need
- Request information from host
- Upload quotes/contracts/invoices
- Mark deliverables complete
- Track payments received

### **5. Guest** (View Only)
- See public portions of mind map
- Example: "What to bring" branch
- Cannot edit anything
- Can comment if host allows

---

## 📱 Mobile Interface for Each Role

### **HOST VIEW**

```
┌─────────────────────────────────────────┐
│ 🎉 Sarah's Birthday Party               │
│ [Settings] [+ Invite] [Share]           │
├─────────────────────────────────────────┤
│                                         │
│ ▼ 🍽️ Food & Drinks (3/5) ──────────┐  │
│   │                                  │  │
│   ├─ ▼ 🍕 Main Course (2/3)         │  │
│   │   ├─ ✅ Pizza order              │  │
│   │   │   👤 Sarah (you)             │  │
│   │   │   [Edit] [Reassign]          │  │
│   │   │                              │  │
│   │   ├─ ⏳ Vegetarian options       │  │
│   │   │   👤 Mike                    │  │
│   │   │   💬 Mike: "On it!"          │  │
│   │   │   [View] [Edit] [Reassign]   │  │
│   │   │                              │  │
│   │   └─ 📋 Serving dishes           │  │
│   │       [Assign to someone]        │  │
│   │                                  │  │
│   ├─ ▼ 🥤 Beverages (1/3)           │  │
│   │   ├─ ✅ Soft drinks              │  │
│   │   ├─ 🤝 Alcohol supply           │  │
│   │   │   🏪 Joe's Liquor Store      │  │
│   │   │   Quote: $280 • Confirmed    │  │
│   │   │   [Message Vendor] [Track]   │  │
│   │   └─ 📋 Ice & coolers            │  │
│   │                                  │  │
│   └─ ▼ 🎂 Cake (2/2) ✅             │  │
│       └─ 🤝 Custom cake order        │  │
│           🍰 Sweet Treats Bakery     │  │
│           Status: Vendor confirmed   │  │
│           [View Details] [Message]   │  │
│                                      │  │
│ [+ Add Category]                     │  │
│                                      │  │
│ 👥 Collaborators (4):                │  │
│ • Sarah (Host)                       │  │
│ • Mike (Co-planner)                  │  │
│ • Joe's Liquor (Vendor) 🏪          │  │
│ • Sweet Treats (Vendor) 🍰          │  │
│ [+ Invite More]                      │  │
└─────────────────────────────────────────┘
```

**Host Actions:**
- Tap any node → Full edit menu
- Long press → Quick actions (assign, delete, move)
- Swipe right → Assign task
- Swipe left → Delete task
- Tap user avatar → Change assignment
- Tap vendor → Message/view contract

---

### **CO-PLANNER VIEW** (Mike)

```
┌─────────────────────────────────────────┐
│ 🎉 Sarah's Birthday Party               │
│ [Activity] [My Tasks] [Full Map]        │
├─────────────────────────────────────────┤
│                                         │
│ 📋 My Tasks (2 active)                  │
│                                         │
│ ⏳ Vegetarian options                   │
│ 🍽️ Food & Drinks → Main Course         │
│ Due: Nov 10                             │
│ [Mark Completed] [Add Note]             │
│                                         │
│ 📋 Setup decorations                    │
│ 🎨 Decorations → Room setup             │
│ Due: Nov 12                             │
│ [Update Status] [Add Photo]             │
│                                         │
│ ─────────────────────────────────       │
│                                         │
│ 🌳 Full Mind Map:                       │
│                                         │
│ ▼ 🍽️ Food & Drinks (3/5)               │
│   ├─ 🍕 Main Course                     │
│   │   └─ ⏳ Vegetarian options (ME) ⭐  │
│   │       Status: In Progress           │
│   │       [✅ Mark Done] [+ Sub-task]   │
│   │       [📸 Add Photo] [💬 Comment]   │
│   │                                     │
│   └─ 🥤 Beverages                       │
│       └─ 🤝 Alcohol (Vendor working)    │
│           [View only - assigned to Joe] │
│                                         │
│ ▼ 🎨 Decorations (1/3)                  │
│   └─ 📋 Setup decorations (ME) ⭐       │
│       [Can edit]                        │
│                                         │
│ ▶ 📍 Venue (Locked - Sarah only)        │
│   [View only - restricted]              │
│                                         │
│ [+ Add Task] [💬 Chat]                  │
└─────────────────────────────────────────┘
```

**Co-Planner Actions:**
- ✅ Edit own tasks
- ✅ Add sub-tasks to own tasks
- ✅ Update status of own tasks
- ✅ Create new tasks (requires host approval)
- ✅ Comment anywhere
- ❌ Cannot assign vendors
- ❌ Cannot delete main categories
- ❌ Cannot see financials (unless host shares)

---

### **VENDOR VIEW** (Joe's Liquor Store)

```
┌─────────────────────────────────────────┐
│ 🏪 Joe's Liquor Store                   │
│ Event: Sarah's Birthday Party           │
│ [My Tasks] [Messages] [Invoice]         │
├─────────────────────────────────────────┤
│                                         │
│ 📦 Your Assignments:                    │
│                                         │
│ ⏳ Alcohol supply                       │
│ ┌─────────────────────────────────┐    │
│ │ Customer: Sarah Johnson         │    │
│ │ Event Date: Nov 15, 2025        │    │
│ │ Guests: 50 people               │    │
│ │ Budget: $280                    │    │
│ │                                 │    │
│ │ Your Quote: $280 ✅ Confirmed   │    │
│ │                                 │    │
│ │ Status: ⏳ In Progress           │    │
│ │ [Update Status ▼]               │    │
│ │ • Not Started                   │    │
│ │ • In Progress (current)         │    │
│ │ • Ready for Delivery            │    │
│ │ • Completed                     │    │
│ │                                 │    │
│ │ Your Checklist:                 │    │
│ │ ✅ Quote sent & approved        │    │
│ │ ⏳ Finalize selection           │    │
│ │ 📋 Arrange delivery             │    │
│ │ 📋 Payment (50% due)            │    │
│ │                                 │    │
│ │ [+ Add Checklist Item]          │    │
│ │                                 │    │
│ │ 📋 Need from Host:              │    │
│ │ • Delivery address & time       │    │
│ │ • Ice requirements?             │    │
│ │ • Cups/glassware provided?      │    │
│ │                                 │    │
│ │ [Request Info from Host]        │    │
│ │                                 │    │
│ │ 📎 Attachments:                 │    │
│ │ • Quote_Nov5.pdf                │    │
│ │ • Product_list.pdf              │    │
│ │ [+ Upload File]                 │    │
│ │                                 │    │
│ │ 💬 Messages with Sarah:         │    │
│ │ Sarah: "Can we add wine?"       │    │
│ │ You: "Yes, updated quote..."    │    │
│ │ [Send Message]                  │    │
│ └─────────────────────────────────┘    │
│                                         │
│ 🌳 Context (Read-only):                 │
│ ▼ 🍽️ Food & Drinks                     │
│   ├─ 🍕 Main Course (for 50)           │
│   ├─ 🥤 Beverages ← YOU ARE HERE       │
│   │   ├─ Soft drinks (host handling)   │
│   │   ├─ 🏪 Alcohol (YOU) ⏳           │
│   │   └─ Ice (needs coordination)      │
│   └─ 🎂 Cake                           │
│                                         │
│ [View Event Timeline] [Payment Status]  │
└─────────────────────────────────────────┘
```

**Vendor Actions:**
- ✅ Update status of assigned tasks
- ✅ Add checklist items (their process)
- ✅ Upload quotes, invoices, photos
- ✅ Request information from host
- ✅ Message host directly
- ✅ See related context (read-only)
- ✅ Mark deliverables complete
- ❌ Cannot see other vendors' info
- ❌ Cannot see budget details
- ❌ Cannot edit event structure

---

### **TASK OWNER VIEW** (Friend helping)

```
┌─────────────────────────────────────────┐
│ 👋 Hi Jessica!                          │
│ Sarah invited you to help plan         │
│ Sarah's Birthday Party                  │
├─────────────────────────────────────────┤
│                                         │
│ 🎯 Your Task:                           │
│                                         │
│ 📋 Send invitations                     │
│ ┌─────────────────────────────────┐    │
│ │ Category: 💌 Invitations        │    │
│ │ Due: Nov 8, 2025                │    │
│ │ Status: 📋 Not Started          │    │
│ │                                 │    │
│ │ [Change Status ▼]               │    │
│ │ • Not Started (current)         │    │
│ │ • In Progress                   │    │
│ │ • Need Help                     │    │
│ │ • Completed                     │    │
│ │                                 │    │
│ │ 📝 Details:                     │    │
│ │ Send invites to 50 guests       │    │
│ │ RSVP deadline: Nov 10           │    │
│ │                                 │    │
│ │ Your Sub-tasks:                 │    │
│ │ ⏳ Draft invitation text        │    │
│ │ 📋 Get guest list from Sarah    │    │
│ │ 📋 Choose platform (email/text) │    │
│ │ 📋 Send invitations            │    │
│ │ 📋 Track RSVPs                 │    │
│ │ [+ Add Sub-task]               │    │
│ │                                 │    │
│ │ 📸 Add Photos/Files:            │    │
│ │ [Upload] [Take Photo]           │    │
│ │                                 │    │
│ │ 💬 Questions for Sarah:         │    │
│ │ [Ask Question]                  │    │
│ │                                 │    │
│ │ ℹ️ Context (what you need):     │    │
│ │ • Guest list → See "Guest Mgmt" │    │
│ │ • Event details → Nov 15, 7pm   │    │
│ │ • Theme → 90s throwback         │    │
│ └─────────────────────────────────┘    │
│                                         │
│ 🌳 Related Tasks:                       │
│ ▼ 💌 Invitations                        │
│   ├─ ✅ Design invitation (Sarah)      │
│   ├─ ⏳ Send invitations (YOU) ⭐      │
│   └─ 📋 Track RSVPs (shared)           │
│                                         │
│ 👋 Other Helpers:                       │
│ • Mike - Working on decorations         │
│ • David - Handling music               │
│ [Chat with team]                        │
└─────────────────────────────────────────┘
```

**Task Owner Actions:**
- ✅ Update status of assigned task
- ✅ Add sub-tasks
- ✅ Upload progress photos
- ✅ Ask questions/comment
- ✅ See related context
- ✅ Mark task complete (requires host approval for critical items)
- ❌ Cannot reassign to someone else
- ❌ Cannot see unrelated branches
- ❌ Cannot see budget info

---

## 🔄 Real-Time Status Updates

### **Status Flow for All Users:**

```
📋 Not Started
    ↓ (Anyone assigned can start)
⏳ In Progress
    ↓ (User marks progress)
🔍 Review Needed (optional)
    ↓ (Host/co-planner reviews)
✅ Completed
    ↓ (Locked, archived)
```

### **Special Vendor Status Flow:**

```
📋 Quote Requested
    ↓ (Vendor submits quote)
💰 Quote Submitted
    ↓ (Host reviews)
✅ Quote Approved / ❌ Rejected
    ↓ (If approved)
📝 Contract Pending
    ↓ (Both parties sign)
🤝 Vendor Confirmed
    ↓ (Vendor starts work)
⏳ In Progress
    ↓ (Vendor updates)
🚚 Ready for Delivery/Service
    ↓ (Day of event)
✅ Service Completed
    ↓ (Payment processed)
💳 Payment Received
```

---

## 📡 Real-Time Collaboration Features

### **1. Live Presence Indicators**

```
┌─────────────────────────────────────────┐
│ 🍽️ Food & Drinks                       │
│                                         │
│ 👤 Mike is viewing this ⚡              │
│ 👤 Joe's Liquor typing... ⌨️            │
│                                         │
│ ├─ 🍕 Main Course                       │
│ │   └─ ⏳ Vegetarian (Mike working) 🔵  │
│ │                                       │
│ └─ 🥤 Beverages                         │
│     └─ 🤝 Alcohol (Joe updating) 🟣     │
│                                         │
│ Recent activity (live feed):            │
│ • 2 min ago: Mike started "Veg options" │
│ • 5 min ago: Joe uploaded quote PDF    │
│ • 10 min ago: Sarah added comment      │
└─────────────────────────────────────────┘
```

### **2. Live Cursors** (Like Figma)

When multiple people viewing same screen:
```
      Mike's cursor 👆
           ↓
┌─────────────────────┐
│ 🍕 Main Course      │ ← Sarah's cursor 👆
└─────────────────────┘
```

### **3. Instant Notifications**

**For Host:**
```
🔔 Mike marked "Vegetarian options" as completed ✅
   [Review] [Approve]

🔔 Joe's Liquor uploaded a new quote ($280)
   [View] [Approve] [Negotiate]

🔔 Jessica asked: "What time should invites say?"
   [Reply] [Call]
```

**For Co-Planner:**
```
🔔 Sarah assigned you: "Setup decorations"
   [View Task] [Accept]

🔔 Vendor (Joe's Liquor) marked task complete ✅
   [View] [Verify]
```

**For Vendor:**
```
🔔 Sarah approved your quote! 🎉
   [View Contract] [Update Status]

🔔 Host requested info: "Delivery time window?"
   [Reply]

🔔 Payment received: $140 (50% deposit)
   [View Receipt]
```

### **4. Activity Feed**

```
┌─────────────────────────────────────────┐
│ 📊 Activity Feed                        │
│ [All] [My Tasks] [Vendors] [Comments]   │
├─────────────────────────────────────────┤
│                                         │
│ 🕐 2 minutes ago                        │
│ 👤 Mike marked "Vegetarian options" ✅  │
│    💬 "Found a great vegan caterer!"    │
│    [View] [React 👍]                    │
│                                         │
│ 🕐 15 minutes ago                       │
│ 🏪 Joe's Liquor updated status          │
│    ⏳ "Selection finalized, ready!"     │
│    📎 Attached: final_order.pdf         │
│    [View] [Download]                    │
│                                         │
│ 🕐 1 hour ago                           │
│ 👤 Sarah created new task               │
│    🎈 "Order balloons" → Assigned: Mike │
│    [View] [Comment]                     │
│                                         │
│ 🕐 2 hours ago                          │
│ 🍰 Sweet Treats confirmed booking       │
│    ✅ "Cake design approved"            │
│    [View Details]                       │
│                                         │
│ 🕐 Yesterday                            │
│ 👤 Jessica asked a question             │
│    💬 "Do we need vegetarian cake too?" │
│    └─ Sarah replied: "Great idea, yes!" │
│    [View Thread]                        │
└─────────────────────────────────────────┘
```

---

## 🎯 Smart Interaction Features

### **1. @Mentions & Notifications**

```
💬 Comment on "Food & Drinks":
┌─────────────────────────────────────────┐
│ Sarah: @Mike can you check if the      │
│ venue allows outside catering?         │
│ Also cc @JoesLiquor for bar setup      │
│                                         │
│ [Post Comment]                          │
└─────────────────────────────────────────┘

Result:
• Mike gets notification: "Sarah mentioned you"
• Joe's Liquor gets notification
• Task auto-links to Venue branch
```

### **2. Quick Status Updates**

```
Swipe Actions on Task:

← Swipe Left                Swipe Right →
┌─────────────────────────────────────────┐
│ ⏳ Vegetarian options                   │
│    Mike • Due Nov 10                    │
└─────────────────────────────────────────┘

Left actions:            Right actions:
• ❌ Delete             • ✅ Mark Done
• 🔄 Reassign           • ⏳ Start Working
• 💬 Comment            • 📸 Add Photo
```

### **3. Bulk Actions** (Host only)

```
┌─────────────────────────────────────────┐
│ [Select Mode]                           │
│                                         │
│ ☑️ 🍕 Pizza order                       │
│ ☑️ 🥤 Soft drinks                       │
│ ☐ 🎂 Cake order                        │
│ ☐ 🎈 Balloons                          │
│                                         │
│ Actions for 2 selected:                 │
│ [✅ Mark All Done]                      │
│ [🔄 Reassign All]                       │
│ [📅 Set Same Due Date]                  │
│ [🗑️ Delete All]                         │
└─────────────────────────────────────────┘
```

### **4. Template Quick Actions**

```
┌─────────────────────────────────────────┐
│ 🎯 Suggested Actions:                   │
│                                         │
│ You marked "Venue booked" as done ✅    │
│                                         │
│ 💡 Smart suggestion:                    │
│ Add these related tasks?                │
│                                         │
│ ☑️ Get venue insurance                 │
│ ☑️ Confirm setup time                  │
│ ☑️ Check parking availability          │
│ ☑️ Request floor plan                  │
│                                         │
│ [Add All] [Pick Some] [Skip]           │
└─────────────────────────────────────────┘
```

---

## 🔐 Permission System Implementation

### **Database Schema for Permissions:**

```sql
-- Event collaborators with roles
CREATE TABLE event_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Role determines base permissions
  role VARCHAR(50) NOT NULL, -- 'host', 'co-planner', 'task-owner', 'viewer'
  
  -- Custom permissions (override defaults)
  can_edit_event BOOLEAN DEFAULT FALSE,
  can_create_tasks BOOLEAN DEFAULT FALSE,
  can_assign_tasks BOOLEAN DEFAULT FALSE,
  can_delete_tasks BOOLEAN DEFAULT FALSE,
  can_invite_people BOOLEAN DEFAULT FALSE,
  can_manage_vendors BOOLEAN DEFAULT FALSE,
  can_see_financials BOOLEAN DEFAULT FALSE,
  can_see_all_branches BOOLEAN DEFAULT TRUE,
  
  -- Status
  invitation_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
  invited_at TIMESTAMP DEFAULT NOW(),
  joined_at TIMESTAMP,
  invited_by UUID REFERENCES users(id),
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(event_id, user_id)
);

-- Vendor assignments to tasks
CREATE TABLE task_vendor_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_id UUID REFERENCES mind_map_nodes(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  
  -- Quote & Contract
  quote_amount DECIMAL(10, 2),
  quote_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'submitted', 'approved', 'rejected'
  quote_submitted_at TIMESTAMP,
  quote_approved_at TIMESTAMP,
  
  contract_signed BOOLEAN DEFAULT FALSE,
  contract_signed_at TIMESTAMP,
  
  -- Vendor status updates
  vendor_status VARCHAR(50) DEFAULT 'not-started',
  vendor_notes TEXT,
  
  -- Payment tracking
  total_cost DECIMAL(10, 2),
  deposit_paid DECIMAL(10, 2) DEFAULT 0,
  balance_paid DECIMAL(10, 2) DEFAULT 0,
  payment_status VARCHAR(50) DEFAULT 'unpaid', -- 'unpaid', 'deposit-paid', 'paid'
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Task assignments to users
CREATE TABLE task_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_id UUID REFERENCES mind_map_nodes(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  
  -- Status
  status VARCHAR(50) DEFAULT 'not-started',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Notes from assignee
  assignee_notes TEXT,
  
  -- Requires approval?
  requires_approval BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(node_id, assigned_to)
);

-- Real-time presence tracking
CREATE TABLE mind_map_presence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Current location in mind map
  current_node_id UUID REFERENCES mind_map_nodes(id) ON DELETE CASCADE,
  
  -- Activity
  is_active BOOLEAN DEFAULT TRUE,
  last_activity_at TIMESTAMP DEFAULT NOW(),
  
  -- Cursor position (for visual collaboration)
  cursor_x INTEGER,
  cursor_y INTEGER,
  
  -- Status
  is_typing BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(event_id, user_id)
);

-- Activity log for notifications
CREATE TABLE mind_map_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  node_id UUID REFERENCES mind_map_nodes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  
  -- Activity details
  activity_type VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', 'status-changed', 'comment-added', 'assigned', 'completed'
  activity_data JSONB, -- Store details like old/new status, comment text, etc.
  
  -- Mentions
  mentioned_users UUID[], -- Array of user IDs mentioned
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_event ON mind_map_activity(event_id, created_at DESC);
CREATE INDEX idx_activity_mentions ON mind_map_activity USING GIN(mentioned_users);
```

---

## 🔔 Notification System

### **Notification Types:**

```typescript
interface Notification {
  type: 'task_assigned' 
      | 'status_changed' 
      | 'comment_added' 
      | 'mention' 
      | 'vendor_quote' 
      | 'approval_needed'
      | 'task_completed'
      | 'payment_received';
  
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  event: {
    id: string;
    title: string;
  };
  
  node: {
    id: string;
    title: string;
    path: string; // e.g., "Food → Catering → Main Course"
  };
  
  actor: {
    id: string;
    name: string;
    role: string;
  };
  
  action: string; // Human-readable: "marked task as complete"
  
  metadata: {
    old_status?: string;
    new_status?: string;
    comment?: string;
    amount?: number;
  };
  
  created_at: Date;
  read_at?: Date;
}
```

### **Notification Delivery:**

```typescript
// Real-time via Supabase
supabase
  .channel(`event-${eventId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'mind_map_activity',
    filter: `event_id=eq.${eventId}`
  }, (payload) => {
    // Show toast notification
    showNotification({
      title: payload.new.activity_type,
      body: formatActivity(payload.new),
      onClick: () => navigateToNode(payload.new.node_id)
    });
  })
  .subscribe();

// Push notifications for offline users
const sendPushNotification = async (userId: string, notification: Notification) => {
  // Via Expo Push Notifications
  await expo.sendPushNotificationAsync({
    to: userDeviceToken,
    title: notification.event.title,
    body: `${notification.actor.name} ${notification.action}`,
    data: {
      eventId: notification.event.id,
      nodeId: notification.node.id,
      type: notification.type
    },
    badge: unreadCount
  });
};
```

---

## 📊 Dashboard for Each Role

### **Host Dashboard:**

```
┌─────────────────────────────────────────┐
│ 🎉 Event Overview                       │
├─────────────────────────────────────────┤
│                                         │
│ 📊 Progress: ████████░░ 78%            │
│                                         │
│ ⚠️ Needs Attention (3):                │
│ • Music - No vendor assigned 🔴         │
│ • Invitations - Overdue by 2 days      │
│ • Venue - Awaiting confirmation         │
│                                         │
│ 👥 Team Activity:                       │
│ • Mike completed 2 tasks today ⚡       │
│ • Joe's Liquor uploaded quote 📄        │
│ • 3 pending approvals ⏳                │
│                                         │
│ 💰 Budget:                              │
│ • Spent: $1,850 / $2,500               │
│ • Pending quotes: $420                  │
│ • Remaining: $230                       │
│                                         │
│ [View Full Mind Map] [Activity Feed]    │
└─────────────────────────────────────────┘
```

### **Vendor Dashboard:**

```
┌─────────────────────────────────────────┐
│ 🏪 My Events                            │
├─────────────────────────────────────────┤
│                                         │
│ Active Events (3):                      │
│                                         │
│ 🎉 Sarah's Birthday (Nov 15)            │
│ Your task: Beverage supply              │
│ Status: ⏳ In Progress                  │
│ Payment: $140 received (50%)            │
│ [Update] [Message Host]                 │
│                                         │
│ 💒 Wilson Wedding (Nov 20)              │
│ Your task: Bar service                  │
│ Status: 🤝 Confirmed, not started      │
│ [View Details]                          │
│                                         │
│ 🎊 Corporate Gala (Dec 1)               │
│ Your task: Full bar setup               │
│ Status: 💰 Quote pending approval      │
│ [Check Status]                          │
│                                         │
│ 📊 This Month:                          │
│ • 5 quotes sent                         │
│ • 3 bookings confirmed                  │
│ • $2,340 earned                         │
│ • ⭐⭐⭐⭐⭐ 4.8 rating (12 reviews)      │
└─────────────────────────────────────────┘
```

---

## 🎮 Interactive Features Summary

### **For Hosts:**
1. Drag-and-drop task reassignment
2. Bulk approve vendor quotes
3. One-tap invite collaborators
4. Visual progress tracking
5. Budget alerts and tracking
6. Activity heatmap (who's most active)
7. Export mind map as PDF/image for sharing

### **For Co-Planners:**
1. My Tasks quick view
2. Focus mode (hide unrelated branches)
3. Collaborative brainstorming (real-time)
4. Suggest new tasks (pending host approval)
5. Comment threads on tasks
6. Share ideas via @mentions

### **For Vendors:**
1. Quote builder with templates
2. Checklist for their process
3. Upload contracts/invoices
4. Request missing info from host
5. Delivery tracking integration
6. Payment status visibility
7. Customer review system

### **For Task Owners:**
1. Simple status toggle
2. Photo/file uploads
3. Sub-task creation
4. Ask questions directly
5. See only what they need
6. Completion rewards (gamification)

---

## 🚀 Next Steps

**Phase 1:** Build permission system + role-based views (2 weeks)
**Phase 2:** Real-time collaboration features (2 weeks)
**Phase 3:** Vendor-specific workflows (2 weeks)
**Phase 4:** Advanced features (notifications, presence, etc.) (2 weeks)

**Total:** 8 weeks to fully collaborative mind map system

---

**Ready to build?** Let's start with the database schema and React Native components! 🎉
