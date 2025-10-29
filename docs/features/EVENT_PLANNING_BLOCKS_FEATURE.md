# 🎯 Event Planning Blocks & Vendor Marketplace Feature Plan

**Version:** 1.0  
**Date:** October 25, 2025  
**Status:** 🎨 Concept & Design Phase  
**Priority:** High  
**Timeline:** 8-12 weeks (Phased Implementation)

---

## 🌟 Vision Statement

Transform PartyHaus into a **collaborative event planning workspace** where event creators can:
- Build events using **visual planning blocks** (like LEGO pieces)
- Assign tasks to **team members and vendors**
- Track progress in **real-time** (like food delivery tracking)
- Connect with **verified vendors** through an integrated marketplace
- Manage the entire event lifecycle from planning to execution

**Tagline:** "Build your event. Block by block. Person by person."

---

## 🎯 Core Concepts

### 1. **Planning Blocks** (Visual Building System)
Think: Notion blocks + Trello cards + LEGO pieces

Each block represents a **category of event requirements**:
- 🍽️ **Catering Block** (Food & Beverage)
- 🎵 **Entertainment Block** (DJ, Band, Performers)
- 📍 **Venue Block** (Location, Setup, Breakdown)
- 📸 **Photography Block** (Photos, Videos, Live Streaming)
- 🎨 **Decoration Block** (Theme, Flowers, Balloons)
- 🎁 **Gifts & Favors Block** (Party favors, Gift bags)
- 🚗 **Transportation Block** (Parking, Shuttles, Valet)
- 💌 **Invitations Block** (Digital, Print, RSVP tracking)
- 🎂 **Cake & Desserts Block** (Birthday cake, Dessert bar)
- 🎤 **Audio/Visual Block** (Sound system, Lighting, Projector)
- 👔 **Attire Block** (Dress code, Costume planning)
- 🎮 **Activities Block** (Games, Icebreakers, Team building)

### 2. **Kanban Timeline Stages**
```
📋 To Plan → 💭 In Planning → 🤝 Vendor Assigned → 
✅ Confirmed → 🚀 In Progress → ✔️ Completed
```

### 3. **Vendor Marketplace Integration**
- Vendors can **browse public events** seeking services
- Event creators can **invite specific vendors** to bid
- Vendors join as **collaborators** once hired
- Real-time updates visible to both parties

### 4. **Real-Time Tracking** (Like Uber/DoorDash)
- See who's working on what **right now**
- Live progress updates with timestamps
- Push notifications for status changes
- Visual progress bars on each block

---

## 🎨 Design Concepts & UI Approaches

### **Approach A: Card-Based Kanban (Mobile-First)**

```
┌─────────────────────────────────────────┐
│ 🎉 Sarah's Birthday Party               │
│ Timeline View    [≡] Board View         │
├─────────────────────────────────────────┤
│                                         │
│ 📋 TO PLAN (3)                          │
│ ┌─────────────────────────────────┐    │
│ │ 🍽️ Catering                     │    │
│ │ Budget: $500 • Unassigned       │    │
│ │ [+ Assign Vendor]               │    │
│ └─────────────────────────────────┘    │
│                                         │
│ 💭 IN PLANNING (2)                      │
│ ┌─────────────────────────────────┐    │
│ │ 🎵 DJ & Music                   │    │
│ │ Sarah • 60% Complete            │    │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━      │    │
│ │ 3 of 5 tasks done              │    │
│ │ [View Tasks →]                  │    │
│ └─────────────────────────────────┘    │
│                                         │
│ ✅ CONFIRMED (1)                        │
│ ┌─────────────────────────────────┐    │
│ │ 📍 Venue Booked                 │    │
│ │ Manhattan Hall • Confirmed      │    │
│ │ John (Venue Manager)            │    │
│ │ Last update: 2 hours ago        │    │
│ └─────────────────────────────────┘    │
│                                         │
│ [+ Add Planning Block]                  │
└─────────────────────────────────────────┘
```

**Mobile Interaction:**
- Horizontal swipe to move cards between stages
- Tap card to expand details
- Long-press to drag and reorder
- Pull down to refresh status

---

### **Approach B: Visual Block Builder (LEGO Style)**

```
┌─────────────────────────────────────────┐
│ 🎉 Build Your Event                     │
│                                         │
│ Drag blocks from library to timeline    │
├─────────────────────────────────────────┤
│                                         │
│ 📚 BLOCK LIBRARY (Common for Birthday)  │
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐        │
│ │🍽️│ │🎵│ │📍│ │📸│ │🎨│        │
│ └───┘ └───┘ └───┘ └───┘ └───┘        │
│ [Show All 12 Blocks →]                  │
│                                         │
│ YOUR EVENT TIMELINE                     │
│ ┌─────────────────────────────────┐    │
│ │ Week 1: Planning                │    │
│ │ ┌─┐ ┌─┐                         │    │
│ │ │🍽│ │📍│ <- Added blocks       │    │
│ │ └─┘ └─┘                         │    │
│ └─────────────────────────────────┘    │
│ ┌─────────────────────────────────┐    │
│ │ Week 2: Vendor Selection        │    │
│ │ [Empty - Drag blocks here]      │    │
│ └─────────────────────────────────┘    │
│ ┌─────────────────────────────────┐    │
│ │ Week 3: Execution               │    │
│ │ [Empty]                         │    │
│ └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

**Features:**
- Drag-and-drop interface
- Visual block assembly
- Timeline segmentation by weeks/dates
- Color-coded blocks by category
- Satisfying "snap" animation when placing blocks

---

### **Approach C: Smart Planner (AI-Assisted)**

```
┌─────────────────────────────────────────┐
│ 🤖 AI Event Planner                     │
│                                         │
│ "I'm planning a birthday party for 50  │
│  people with a $2000 budget"            │
│                                         │
│ ✨ Recommended Planning Blocks:         │
│                                         │
│ ✅ Essential (Auto-added)               │
│  • 🍽️ Catering ($800)                  │
│  • 📍 Venue ($400)                      │
│  • 💌 Invitations ($100)                │
│                                         │
│ 💡 Suggested (Tap to add)               │
│  • 🎵 DJ & Music ($300)                 │
│  • 📸 Photography ($400)                │
│  • 🎨 Decorations ($200)                │
│                                         │
│ [Build My Event] [Customize]            │
└─────────────────────────────────────────┘
```

**AI Features:**
- Budget-based recommendations
- Guest count considerations
- Event type templates
- Vendor suggestions based on location

---

## 🏗️ Block Anatomy (Data Structure)

Each planning block contains:

```typescript
interface PlanningBlock {
  id: string;
  type: BlockType; // 'catering', 'entertainment', 'venue', etc.
  title: string; // "Wedding Catering"
  status: BlockStatus; // 'to-plan', 'in-planning', 'confirmed', etc.
  
  // Assignment
  assignedTo?: {
    userId: string;
    name: string;
    role: 'host' | 'co-host' | 'vendor' | 'team-member';
    avatar?: string;
  };
  
  // Progress Tracking
  progress: {
    percentage: number; // 0-100
    totalTasks: number;
    completedTasks: number;
    lastUpdate: Date;
  };
  
  // Tasks (Sub-items)
  tasks: Task[];
  
  // Budget
  budget?: {
    estimated: number;
    actual?: number;
    currency: string;
  };
  
  // Vendor Connection
  vendor?: {
    vendorId: string;
    businessName: string;
    contactPerson: string;
    status: 'invited' | 'accepted' | 'declined' | 'confirmed';
    quote?: number;
  };
  
  // Timeline
  dueDate?: Date;
  startDate?: Date;
  completedDate?: Date;
  
  // Collaboration
  comments: Comment[];
  attachments: Attachment[];
  
  // Visual
  color: string;
  icon: string;
  position: {
    stage: number; // Kanban column
    order: number; // Position within column
  };
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  assignedTo?: string;
  dueDate?: Date;
  notes?: string;
}
```

---

## 🤝 Vendor Marketplace Features

### **For Event Creators:**

**1. Vendor Discovery**
```
┌─────────────────────────────────────────┐
│ 🔍 Find Vendors for: Catering           │
│                                         │
│ Filters: ⭐ Rating | 💰 Budget | 📍 Near│
│                                         │
│ ┌─────────────────────────────────┐    │
│ │ 🍽️ Delicious Catering Co.       │    │
│ │ ⭐⭐⭐⭐⭐ 4.9 (120 reviews)       │    │
│ │ 💰 $25-50 per person            │    │
│ │ 📍 2.3 miles away               │    │
│ │                                 │    │
│ │ [Request Quote] [View Profile]  │    │
│ └─────────────────────────────────┘    │
│                                         │
│ ┌─────────────────────────────────┐    │
│ │ 🍕 Mario's Catering             │    │
│ │ ⭐⭐⭐⭐ 4.2 (85 reviews)         │    │
│ │ 💰 $15-30 per person            │    │
│ │ [Request Quote]                 │    │
│ └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

**2. Vendor Assignment Flow**
```
Block Card Actions:
├─ [🔍 Find Vendors] → Opens marketplace
├─ [💌 Invite Vendor] → Send custom invitation
├─ [📝 Request Quotes] → Multiple vendors
└─ [✅ Hire Vendor] → Add as collaborator
```

### **For Vendors:**

**1. Event Discovery Dashboard**
```
┌─────────────────────────────────────────┐
│ 📊 Available Events Near You            │
│                                         │
│ ┌─────────────────────────────────┐    │
│ │ 🎉 Corporate Holiday Party      │    │
│ │ 200 guests • $5,000 budget      │    │
│ │ Needs: 🍽️ Catering             │    │
│ │ Event Date: Dec 15, 2025        │    │
│ │ Location: Manhattan, NY         │    │
│ │                                 │    │
│ │ [Submit Proposal]               │    │
│ └─────────────────────────────────┘    │
│                                         │
│ ┌─────────────────────────────────┐    │
│ │ 💍 Wedding Reception            │    │
│ │ 150 guests • $8,000 budget      │    │
│ │ Needs: 🍽️ Catering, 🎵 Music   │    │
│ │ [Bid on This Event]             │    │
│ └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

**2. Vendor Collaboration Portal**
Once hired:
```
┌─────────────────────────────────────────┐
│ 🎉 Sarah's Birthday Party               │
│ Your Role: Catering Vendor              │
├─────────────────────────────────────────┤
│                                         │
│ 📋 Your Tasks (3)                       │
│ ☐ Menu selection approval              │
│ ☐ Dietary restrictions confirmation    │
│ ☐ Final headcount 48hrs before         │
│                                         │
│ 💬 Messages (2 new)                     │
│ Sarah: "Can we add vegan options?"      │
│                                         │
│ 📎 Shared Documents                     │
│ • Menu draft.pdf                        │
│ • Venue floor plan.jpg                  │
│                                         │
│ [Update Progress] [Message Host]        │
└─────────────────────────────────────────┘
```

---

## 📱 Real-Time Tracking (Delivery-Style)

### **Live Progress View**

```
┌─────────────────────────────────────────┐
│ 🍽️ Catering Block - LIVE               │
│                                         │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━      │
│ 85% Complete                            │
│                                         │
│ 📍 Current Status:                      │
│ ┌─────────────────────────────────┐    │
│ │ ✅ Menu finalized                │    │
│ │    12:30 PM by Chef Mario        │    │
│ │                                 │    │
│ │ 🟡 Ingredients being sourced     │    │
│ │    NOW - Mario's Catering       │    │
│ │                                 │    │
│ │ ⏳ Final tasting - Pending       │    │
│ │    Scheduled for Oct 28          │    │
│ └─────────────────────────────────┘    │
│                                         │
│ 👥 Active Now:                          │
│ • Chef Mario (updating menu)            │
│ • Sarah (reviewing options)             │
│                                         │
│ 🔔 Recent Activity:                     │
│ • Menu approved (5 min ago)             │
│ • Vegan options added (1 hour ago)      │
│ • Budget confirmed (3 hours ago)        │
└─────────────────────────────────────────┘
```

**Real-Time Features:**
- Live "typing..." indicators
- Instant push notifications
- Progress bar animations
- "Active now" presence indicators
- Time-stamped activity feed
- Status badge updates (🟢 On track, 🟡 Attention needed, 🔴 Delayed)

---

## 🎮 Gamification & Engagement

### **Progress Rewards**
```
🏆 Achievement Unlocked!
"Master Planner"
You completed all planning blocks 
2 weeks before your event!

+100 XP | Unlock: Premium Templates
```

### **Leaderboards** (For Vendors)
- Most events completed
- Highest ratings
- Fastest response time
- Best value awards

### **Milestones**
- 🎯 First block created
- 🤝 First vendor hired
- 📧 First 10 invites sent
- ✅ 50% planning complete
- 🎉 Event successfully executed

---

## 🗄️ Database Schema

### **planning_blocks**
```sql
CREATE TABLE planning_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  
  -- Block Info
  block_type VARCHAR(50) NOT NULL, -- 'catering', 'entertainment', etc.
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'to-plan',
  
  -- Assignment
  assigned_to UUID REFERENCES users(id),
  assigned_role VARCHAR(50), -- 'host', 'vendor', 'team-member'
  vendor_id UUID REFERENCES vendors(id),
  
  -- Progress
  progress_percentage INTEGER DEFAULT 0,
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  
  -- Budget
  estimated_budget DECIMAL(10, 2),
  actual_budget DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Timeline
  due_date TIMESTAMP,
  start_date TIMESTAMP,
  completed_date TIMESTAMP,
  
  -- Visual
  color VARCHAR(7),
  icon VARCHAR(50),
  position_stage INTEGER DEFAULT 0,
  position_order INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_planning_blocks_event ON planning_blocks(event_id);
CREATE INDEX idx_planning_blocks_vendor ON planning_blocks(vendor_id);
CREATE INDEX idx_planning_blocks_status ON planning_blocks(status);
```

### **block_tasks**
```sql
CREATE TABLE block_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  block_id UUID REFERENCES planning_blocks(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  
  assigned_to UUID REFERENCES users(id),
  due_date TIMESTAMP,
  completed_date TIMESTAMP,
  
  position_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **vendors**
```sql
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  
  -- Business Info
  business_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(100)[], -- Array: ['catering', 'photography']
  description TEXT,
  
  -- Contact
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  website VARCHAR(255),
  
  -- Location
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Business Details
  price_range VARCHAR(50), -- '$', '$$', '$$$', '$$$$'
  min_budget DECIMAL(10, 2),
  max_budget DECIMAL(10, 2),
  
  -- Ratings
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_events_completed INTEGER DEFAULT 0,
  
  -- Verification
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,
  
  -- Settings
  accepting_events BOOLEAN DEFAULT TRUE,
  max_concurrent_events INTEGER,
  
  -- Media
  logo_url TEXT,
  cover_image_url TEXT,
  portfolio_images TEXT[],
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_vendors_business_type ON vendors USING GIN (business_type);
CREATE INDEX idx_vendors_location ON vendors(latitude, longitude);
CREATE INDEX idx_vendors_rating ON vendors(average_rating DESC);
```

### **vendor_proposals**
```sql
CREATE TABLE vendor_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  block_id UUID REFERENCES planning_blocks(id),
  
  -- Proposal
  message TEXT,
  quoted_price DECIMAL(10, 2),
  estimated_duration VARCHAR(100),
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'withdrawn'
  
  -- Timestamps
  submitted_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP,
  
  UNIQUE(vendor_id, block_id)
);
```

### **block_activity_log**
```sql
CREATE TABLE block_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  block_id UUID REFERENCES planning_blocks(id) ON DELETE CASCADE,
  
  user_id UUID REFERENCES users(id),
  action_type VARCHAR(50), -- 'created', 'updated', 'completed', 'commented'
  action_details JSONB,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_block_activity_block ON block_activity_log(block_id, created_at DESC);
```

---

## 🚀 Implementation Phases

### **Phase 1: Core Planning Blocks (4 weeks)**
**Goal:** Basic Kanban board with draggable blocks

**Deliverables:**
- [ ] Planning block data model
- [ ] Kanban board UI (mobile)
- [ ] Drag-and-drop functionality
- [ ] 6 basic block types
- [ ] Task creation within blocks
- [ ] Progress tracking
- [ ] Real-time updates (WebSockets)

**Tech Stack:**
- React Native Gesture Handler for drag-drop
- Reanimated for smooth animations
- Supabase Realtime for live updates
- Zustand for state management

---

### **Phase 2: Vendor Marketplace (4 weeks)**
**Goal:** Vendor discovery and hiring

**Deliverables:**
- [ ] Vendor profile system
- [ ] Vendor registration flow
- [ ] Event discovery for vendors
- [ ] Proposal/quote system
- [ ] Vendor assignment to blocks
- [ ] Rating and review system

---

### **Phase 3: Collaboration & Real-Time (3 weeks)**
**Goal:** Multi-user collaboration like Figma

**Deliverables:**
- [ ] Live presence indicators
- [ ] Real-time commenting
- [ ] Activity feed
- [ ] Push notifications
- [ ] File attachments
- [ ] @mentions

---

### **Phase 4: Smart Features (2 weeks)**
**Goal:** AI and automation

**Deliverables:**
- [ ] AI block recommendations
- [ ] Auto-scheduling suggestions
- [ ] Budget optimization
- [ ] Vendor matching algorithm
- [ ] Template library
- [ ] Quick-start wizards

---

## 🎨 Visual Design References

### **Color Palette for Blocks**
```
🍽️ Catering: #FF6B6B (Red)
🎵 Entertainment: #A78BFA (Purple)
📍 Venue: #10B981 (Green)
📸 Photography: #3B82F6 (Blue)
🎨 Decoration: #EC4899 (Pink)
🎁 Gifts: #F59E0B (Amber)
🚗 Transportation: #6366F1 (Indigo)
💌 Invitations: #8B5CF6 (Violet)
🎂 Desserts: #F97316 (Orange)
🎤 Audio/Visual: #14B8A6 (Teal)
👔 Attire: #6B7280 (Gray)
🎮 Activities: #06B6D4 (Cyan)
```

### **Inspiration:**
- **Notion** - Block-based content editing
- **Trello** - Kanban board simplicity
- **Figma** - Real-time collaboration
- **Uber/DoorDash** - Live tracking UI
- **Monday.com** - Project management boards
- **Airtable** - Flexible data views

---

## 📊 Success Metrics

### **Engagement Metrics:**
- Average blocks per event created
- Time spent in planning board
- Collaboration interactions (comments, updates)
- Block completion rate

### **Business Metrics:**
- Vendor signup rate
- Events with vendor hires
- Average quote response time
- Vendor-to-host conversion rate
- Revenue from vendor subscriptions

### **User Satisfaction:**
- Planning feature NPS score
- Event success rate (completed vs cancelled)
- Time saved vs traditional planning
- Vendor satisfaction scores

---

## 🔮 Future Enhancements

### **Advanced Features:**
- 📱 Mobile widget showing event progress
- 🗓️ Calendar integration (Google, Apple)
- 💳 Integrated payments for vendors
- 📊 Analytics dashboard (insights, trends)
- 🎯 Smart reminders based on timeline
- 🌐 Multi-language vendor marketplace
- 🤖 AI chatbot for planning advice
- 📝 Contract management system
- 🔔 WhatsApp/SMS integration for updates
- 🎥 Video call integration for vendor meetings
- 📈 Post-event analytics and feedback
- 🏆 Vendor certification program

---

## 💡 Alternative UI Concepts

### **Concept 1: Timeline View (Horizontal Scroll)**
```
┌────────────────────────────────────────────────────────┐
│ ←  Week 1     Week 2     Week 3     Week 4  →         │
│ ┌────────┐  ┌────────┐ ┌────────┐ ┌────────┐         │
│ │🍽️      │  │🎵      │ │📸      │ │✅      │         │
│ │Catering│  │Music   │ │Photos  │ │Final   │         │
│ │Planning│  │Booking │ │Review  │ │Check   │         │
│ └────────┘  └────────┘ └────────┘ └────────┘         │
└────────────────────────────────────────────────────────┘
```

### **Concept 2: Circular Progress (Dashboard)**
```
        Event Progress: 67%
           ╭───────╮
        ╭──┤  🎉  ├──╮
       │   ╰───────╯   │
    🍽️ 100%         60% 🎵
       │             │
    📍 100%         40% 📸
       │             │
        ╰───────────╯
```

### **Concept 3: Mind Map View**
```
              🎉 Event
            /    |    \
          /      |      \
      🍽️       📍       🎵
     /  \       |      /  \
   Tasks Vendor  ✅    DJ  Band
```

---

## 🎬 Next Steps

1. **Stakeholder Review** (1 week)
   - Present concepts to team
   - Gather feedback
   - Prioritize features

2. **Design Sprint** (2 weeks)
   - Create high-fidelity mockups
   - User flow diagrams
   - Interactive prototype

3. **Technical Architecture** (1 week)
   - Finalize database schema
   - API design
   - Real-time infrastructure

4. **Phase 1 Development** (4 weeks)
   - Core planning blocks
   - Basic Kanban board
   - Testing and refinement

---

**Document Owner:** Development Team  
**Last Updated:** October 25, 2025  
**Next Review:** After stakeholder feedback

---

## 📝 Notes & Discussions

> This feature transforms PartyHaus from a simple event manager into a comprehensive 
> collaborative planning platform. The key differentiator is the visual block-based 
> approach combined with vendor marketplace integration.
> 
> The "real-time delivery tracking" concept for event planning is novel and could 
> become a signature feature that sets us apart from competitors.

**Questions to Address:**
- How do we prevent vendor spam/low-quality proposals?
- What's the monetization strategy (vendor subscriptions, transaction fees)?
- How do we handle vendor disputes or cancellations?
- What happens if a vendor goes offline mid-event?
- Privacy controls for events seeking vendors?
