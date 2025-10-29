# 🧠 Mind Map Event Planning System - Design Document

**Version:** 1.0  
**Date:** October 25, 2025  
**Status:** 🎨 Design & Concept Phase  
**Priority:** High  
**Timeline:** 6-8 weeks

---

## 🎯 Why Mind Map for Event Planning?

### **Cognitive Benefits:**

1. **Natural Thinking Process**
   - Mirrors how people actually plan events (brain-storming style)
   - See the whole picture and details simultaneously
   - Non-linear - add ideas as they come, not in sequence
   - Reduces cognitive load - visual hierarchy helps memory

2. **Relationship Visualization**
   - See dependencies between tasks clearly
   - Understand how one decision affects others
   - Group related items visually
   - Spot gaps in planning instantly

3. **Collaborative Planning**
   - Everyone can see the same "mental model"
   - Easy to point at specific areas during discussions
   - Natural for brainstorming sessions
   - Feels less overwhelming than long task lists

4. **Flexible Organization**
   - Reorganize on the fly without "undoing" work
   - Add sub-tasks infinitely deep
   - Branch out new ideas without disrupting structure
   - Collapse/expand sections to focus

---

## 🎨 Visual Design Concept

### **Central Node (Event)**
```
              ┌─────────────┐
              │  🎉 Sarah's │
              │   Birthday  │
              │   Party     │
              │             │
              │ 50 guests   │
              │ Nov 15      │
              │ $2,500      │
              └──────┬──────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
```

### **Main Branches (Categories)**
```
🍽️ Food         📍 Venue        🎵 Entertainment
  & Drinks        & Setup          & Activities
```

### **Sub-branches (Tasks)**
```
🍽️ Food & Drinks
   ├─ 🍕 Main Course
   │   ├─ Pizza order (50 pcs) ✅
   │   ├─ Vegetarian options ⏳
   │   └─ Serving dishes 📋
   │
   ├─ 🥤 Beverages  
   │   ├─ Soft drinks ✅
   │   ├─ Alcohol 🤝 [Vendor: Joe's Liquor]
   │   └─ Ice & coolers 📋
   │
   └─ 🎂 Cake
       ├─ Order custom cake 🤝 [Sweet Treats]
       ├─ Candles & decorations ⏳
       └─ Cake cutting setup ✅
```

### **Visual Status Indicators**
```
📋 Not Started     (Gray - outline only)
⏳ In Progress     (Blue - pulsing)
🤝 Vendor Working  (Purple - with vendor badge)
✅ Completed       (Green - checkmark)
🔴 Blocked/Issue   (Red - attention needed)
⭐ Priority/VIP    (Gold star overlay)
```

---

## 📱 Mobile Interaction Design

### **Approach 1: Touch-First Mind Map**

```
┌─────────────────────────────────────────┐
│ 🎉 Sarah's Birthday Party               │
│ [← Back]  [⚙️ Settings]  [+ Add Node]   │
├─────────────────────────────────────────┤
│                                         │
│         Pinch to zoom                   │
│         Drag to pan                     │
│         Tap to expand                   │
│                                         │
│           ┌─────────┐                   │
│      ┌────┤  🎉     ├────┐             │
│      │    │ Event   │    │             │
│      │    └─────────┘    │             │
│      │                   │             │
│   ┌──┴──┐            ┌──┴──┐          │
│   │ 🍽️  │            │ 📍  │          │
│   │Food │            │Venue│          │
│   └──┬──┘            └──┬──┘          │
│      │                  │              │
│   ┌──┴──┐            ┌──┴──┐          │
│   │Main │            │Book │          │
│   │     │            │Hall │          │
│   └─────┘            └─────┘          │
│                                         │
│ [🔍 Focus Mode] [📊 List View]         │
└─────────────────────────────────────────┘
```

**Gestures:**
- **Tap node** → Expand/collapse children
- **Long press** → Quick actions menu
- **Double tap** → Edit node
- **Drag node** → Move/reorganize
- **Pinch** → Zoom in/out
- **Two-finger drag** → Pan around canvas
- **Tap connection line** → Add node between

---

### **Approach 2: Hierarchical Expandable View**

```
┌─────────────────────────────────────────┐
│ 🎉 Sarah's Birthday Party               │
│ Overall Progress: ████████░░ 75%        │
├─────────────────────────────────────────┤
│                                         │
│ ▼ 🍽️ Food & Drinks (3/5) ─────────────┐│
│   │                                     ││
│   ├─ ▼ 🍕 Main Course (2/3)            ││
│   │   ├─ ✅ Pizza order (Sarah)        ││
│   │   ├─ ⏳ Vegetarian opt. (Mike)     ││
│   │   └─ 📋 Serving dishes             ││
│   │                                     ││
│   ├─ ▶ 🥤 Beverages (1/3)              ││
│   └─ ▼ 🎂 Cake (2/2) ───────────────┐  ││
│       ├─ ✅ Order cake                │  ││
│       │   🤝 Sweet Treats Bakery      │  ││
│       │   Quote: $150 • Due: Nov 10   │  ││
│       └─ ✅ Candles ready             │  ││
│                                       │  ││
│ ▶ 📍 Venue & Setup (0/4)              │  ││
│                                       │  ││
│ ▶ 🎵 Entertainment (2/3)              │  ││
│                                       │  ││
│ [+ Add Main Category]                 │  ││
└───────────────────────────────────────┴──┘│
                                            │
  Tap ▶ to expand, ▼ to collapse           │
  Tap card for details                      │
  Swipe left for quick actions              │
```

**Features:**
- Infinite nesting levels
- Drag to reorder at same level
- Swipe actions (Edit, Delete, Add Child, Assign)
- Progress bars at each level
- Vendor badges integrated inline
- Color-coded by status

---

### **Approach 3: Radial/Circular Mind Map** (Most Visual)

```
┌─────────────────────────────────────────┐
│                                         │
│         Touch categories to expand      │
│                                         │
│               🎵 Entertainment          │
│                  (2/3)                  │
│                    ↑                    │
│                    │                    │
│      📍 Venue ─────🎉─────🍽️ Food      │
│       (0/4)      Event      (3/5)       │
│                    │                    │
│                    ↓                    │
│              🎁 Gifts (1/2)             │
│                                         │
│ Selected: 🍽️ Food & Drinks             │
│ ┌─────────────────────────────────┐    │
│ │ 🍕 Main Course                  │    │
│ │ 🥤 Beverages                    │    │
│ │ 🎂 Cake ✅ (Sweet Treats)       │    │
│ └─────────────────────────────────┘    │
│                                         │
│ [Back to Overview] [Add Category]       │
└─────────────────────────────────────────┘
```

**Interaction:**
- Categories orbit the central event
- Tap category → Zooms in, shows sub-items
- Size of bubble = number of tasks
- Color intensity = completion percentage
- Animated transitions between levels

---

## 🎮 How It Helps Users

### **1. Reduces Overwhelm**

**Problem:** Event planning has 100+ tasks that feel impossible
**Solution:** Mind map shows bite-sized pieces with clear structure

**Example:**
```
Instead of seeing:
[ ] Order cake
[ ] Choose cake flavor
[ ] Find bakery
[ ] Get cake stand
[ ] Plan cake cutting
... (95 more tasks)

User sees:
🎂 Cake (0/5) ▶ [Tap to expand]
```

User tackles one branch at a time, not drowning in a massive list.

---

### **2. Natural Decision Flow**

**How People Actually Plan:**
"I need food... oh that means I need dishes... oh that means I need tables... oh that means I need venue space!"

**Mind Map Matches This:**
```
🍽️ Food
   └─ 🍕 Catering
       └─ 🍽️ Serving dishes
           └─ 📦 Tables & chairs
               └─ 📍 Venue space needed
                   └─ Automatically links to Venue branch!
```

**Smart Suggestions:**
"You added 'DJ equipment' - this needs power outlets. Want me to add that to your Venue checklist?"

---

### **3. Collaborative Brainstorming**

**Scenario:** Planning with friends/family

**Traditional List:**
- Hard to contribute simultaneously
- No context for suggestions
- Changes feel disruptive
- Can't see the big picture

**Mind Map:**
- Everyone adds branches in real-time
- See where others are working (live cursors)
- Context is visual - see parent/sibling tasks
- Feels creative, not administrative

**Real-time Collaboration:**
```
┌─────────────────────────────────────────┐
│ 🍽️ Food & Drinks                       │
│                                         │
│ Sarah is here 👤                        │
│ Mike is typing... ⌨️                    │
│                                         │
│ ├─ 🍕 Main Course                       │
│ │   └─ Sarah: "What about tacos?" 💬   │
│ │                                       │
│ ├─ 🥤 Beverages                         │
│ │   └─ Mike just added: "Mocktails!" ✨ │
│                                         │
│ └─ 🎂 Cake                              │
│     └─ Mom: "I'll handle this!" 🙋      │
└─────────────────────────────────────────┘
```

---

### **4. Dependency Awareness**

**Visual Connections Show Impact:**

```
🎵 DJ Equipment
   │
   ├─ Requires: ⚡ Power outlets
   │            (links to Venue branch)
   │
   └─ Blocks: 🎤 Live band
              (can't have both, space conflict)
```

**Smart Warnings:**
"⚠️ You marked 'Venue' as completed, but 3 tasks in other branches need venue details first!"

---

### **5. Vendor Integration Points**

**Where Vendors Fit Naturally:**

```
🍽️ Food Branch
   │
   └─ 🍕 Catering
       │
       ├─ [🔍 Find Caterers] ← Opens marketplace
       │
       └─ 🤝 Mario's Catering (hired)
           │
           ├─ Menu selection ⏳ (Mario working)
           ├─ Final headcount 📋
           └─ Delivery setup ✅ (Mario completed)
```

**Vendor Can:**
- See only their branch + related context
- Update their tasks
- Add sub-tasks they need host to handle
- Flag dependencies ("I need kitchen access time")

---

### **6. Templates with Smart Suggestions**

**AI-Powered Mind Map Building:**

```
User: "I'm planning a birthday party for 50 people"

AI creates base structure:
🎉 Birthday Party
   ├─ 🍽️ Food (essential for 50 people)
   ├─ 📍 Venue (recommended: needs space for 50)
   ├─ 💌 Invitations (50 guests = high priority)
   ├─ 🎂 Cake (birthday requirement)
   └─ 🎁 Party favors (optional, tap to add)

User: "It's for kids"

AI adds:
   ├─ 🎮 Games & Activities (essential for kids)
   ├─ 🎈 Decorations (kids love balloons!)
   └─ 👨‍👩‍👧 Parent supervision area (suggested)

User: "Budget is $1000"

AI highlights:
   🟡 Food ($400-500 for 50 kids)
   🟡 Venue ($200-300)
   🔴 Entertainment ($150-200) ← Priority!
   🟢 Decorations ($50-100)
```

---

## 🔄 Mind Map vs Traditional Lists

### **Traditional Todo List:**
```
☐ Order cake
☐ Book venue
☐ Send invitations
☐ Buy decorations
☐ Hire DJ
☐ Order food
... (50 more items)

Problems:
- No context between items
- No priorities visible
- No relationships
- Feels overwhelming
- Hard to collaborate
```

### **Mind Map View:**
```
        🎉 Event (6 categories)
              ├─ 🍽️ Food (80% done) ✨
              ├─ 📍 Venue (100% done) ✅
              ├─ 💌 Invites (60% done) ⏳
              ├─ 🎨 Decor (20% done) 📋
              ├─ 🎵 Music (0% done) 🔴
              └─ 🎂 Cake (100% done) ✅

Benefits:
- Visual progress at-a-glance
- Related items grouped
- Priority clear (Music needs attention!)
- Feels manageable (tackle one branch)
- Easy to delegate (assign whole branches)
```

---

## 🎯 Key Features for Mobile Mind Map

### **1. Smart Node Types**

**Category Node** (Main branches)
```
┌─────────────────────┐
│ 🍽️ Food & Drinks   │
│ ───────────────────  │
│ 3 of 5 complete     │
│ $800 / $1000 budget │
│ 2 vendors hired     │
│ Due: Nov 10         │
└─────────────────────┘
```

**Task Node** (Leaf items)
```
┌──────────────────┐
│ ✅ Order pizza   │
│ Sarah • Nov 8    │
│ $350            │
└──────────────────┘
```

**Vendor Node** (Special type)
```
┌────────────────────┐
│ 🤝 Mario's Catering│
│ Quote: $450        │
│ Rating: ⭐⭐⭐⭐⭐   │
│ Status: Confirmed  │
│ [Message] [Track]  │
└────────────────────┘
```

**Milestone Node** (Time-based)
```
┌──────────────────┐
│ 🎯 1 Week Before │
│ 8 tasks due      │
│ Nov 8, 2025      │
└──────────────────┘
```

---

### **2. Focus Modes**

**Overview Mode** - See everything
```
All branches visible, collapsed to category level
Perfect for: Planning sessions, status checks
```

**Category Focus** - Zoom into one branch
```
Selected branch fills screen, others dimmed
Perfect for: Working on specific area
```

**Timeline Mode** - Sort by dates
```
Reorganizes mind map by due dates
Perfect for: Day-of-event planning
```

**Vendor Mode** - Filter by vendors
```
Shows only vendor-related nodes
Perfect for: Checking vendor status
```

**Critical Path** - Smart highlights
```
AI highlights tasks blocking others
Perfect for: Understanding what to do next
```

---

### **3. Quick Actions Menu**

**Long-press any node:**
```
┌─────────────────────┐
│ • Edit details      │
│ • Add sub-task      │
│ • Assign to someone │
│ • Find vendor       │
│ • Set due date      │
│ • Change status     │
│ • Add notes         │
│ • Link to another   │
│ • Delete           │
└─────────────────────┘
```

---

### **4. Smart Connections**

**Auto-linking related tasks:**
```
User adds: "Setup DJ equipment"
AI suggests: 
"Link to 'Venue sound system' in Venue branch?"
[Yes] [No] [Always ask]
```

**Dependency tracking:**
```
       ┌─────────┐
       │ Venue   │ (Completed)
       └────┬────┘
            │
     ┌──────┴──────┐
     │             │
┌────┴────┐   ┌────┴────┐
│Catering │   │  Setup  │ (Can now start)
└─────────┘   └─────────┘
```

---

## 🗄️ Database Schema for Mind Map

### **mind_map_nodes**
```sql
CREATE TABLE mind_map_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  
  -- Hierarchy
  parent_id UUID REFERENCES mind_map_nodes(id) ON DELETE CASCADE,
  node_level INTEGER DEFAULT 0, -- 0=root, 1=category, 2=task, etc.
  position_order INTEGER DEFAULT 0,
  
  -- Node Data
  node_type VARCHAR(50), -- 'category', 'task', 'vendor', 'milestone'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(10),
  color VARCHAR(7),
  
  -- Status
  status VARCHAR(50) DEFAULT 'not-started',
  progress_percentage INTEGER DEFAULT 0,
  
  -- Assignment
  assigned_to UUID REFERENCES users(id),
  vendor_id UUID REFERENCES vendors(id),
  
  -- Timeline
  due_date TIMESTAMP,
  start_date TIMESTAMP,
  completed_date TIMESTAMP,
  
  -- Budget
  estimated_cost DECIMAL(10, 2),
  actual_cost DECIMAL(10, 2),
  
  -- Visual Position (for canvas layout)
  position_x INTEGER,
  position_y INTEGER,
  
  -- State
  is_expanded BOOLEAN DEFAULT TRUE,
  is_visible BOOLEAN DEFAULT TRUE,
  is_collapsed BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_mind_map_event ON mind_map_nodes(event_id);
CREATE INDEX idx_mind_map_parent ON mind_map_nodes(parent_id);
CREATE INDEX idx_mind_map_level ON mind_map_nodes(node_level);
```

### **node_connections** (For explicit links)
```sql
CREATE TABLE node_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_node_id UUID REFERENCES mind_map_nodes(id) ON DELETE CASCADE,
  to_node_id UUID REFERENCES mind_map_nodes(id) ON DELETE CASCADE,
  
  connection_type VARCHAR(50), -- 'depends-on', 'blocks', 'relates-to'
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(from_node_id, to_node_id, connection_type)
);
```

### **mind_map_templates**
```sql
CREATE TABLE mind_map_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  event_type VARCHAR(100), -- 'birthday', 'wedding', etc.
  description TEXT,
  
  -- Template structure stored as JSON
  structure JSONB NOT NULL,
  
  -- Metadata
  is_public BOOLEAN DEFAULT FALSE,
  use_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📱 Mobile Component Architecture

### **Component Hierarchy:**
```
<MindMapContainer>
  ├─ <MindMapCanvas> (Pan/Zoom container)
  │   ├─ <CentralNode> (Event root)
  │   ├─ <CategoryBranch> (Main branches)
  │   │   └─ <TaskNode> (Leaf nodes)
  │   └─ <ConnectionLines> (Visual links)
  │
  ├─ <MindMapControls> (Zoom, mode switcher)
  ├─ <QuickActions> (Floating action button)
  └─ <NodeDetailsModal> (Edit panel)
```

---

## 🎨 Implementation Plan

### **Phase 1: Basic Hierarchy (2 weeks)**
- [ ] Expandable tree view (simpler than canvas)
- [ ] Add/edit/delete nodes
- [ ] 3-level hierarchy (event → category → task)
- [ ] Status badges
- [ ] Progress calculation

### **Phase 2: Visual Mind Map (2 weeks)**
- [ ] Canvas-based rendering
- [ ] Drag nodes to reposition
- [ ] Connection lines between nodes
- [ ] Pinch-to-zoom
- [ ] Pan gestures

### **Phase 3: Collaboration (2 weeks)**
- [ ] Real-time updates (Supabase Realtime)
- [ ] Live cursors/presence
- [ ] Activity feed
- [ ] Commenting on nodes
- [ ] @mentions

### **Phase 4: Smart Features (2 weeks)**
- [ ] AI template generation
- [ ] Smart suggestions
- [ ] Dependency detection
- [ ] Critical path highlighting
- [ ] Vendor integration

---

## 🎯 Success Metrics

- **Adoption:** % of events using mind map (target: 80%)
- **Engagement:** Avg nodes per event (target: 30+)
- **Completion:** Events with >75% progress (target: 60%)
- **Collaboration:** Multi-user sessions (target: 40%)
- **Satisfaction:** NPS for planning experience (target: 50+)

---

## 💡 Inspiration & References

- **MindMeister** - Mind mapping tool
- **Notion** - Block-based organization
- **FigJam** - Collaborative whiteboard
- **Trello** - Visual task management
- **Miro** - Online brainstorming

---

**Next Steps:**
1. Create interactive prototype
2. User testing sessions
3. Technical feasibility review
4. Phase 1 development kickoff

---

**Document Owner:** Product Team  
**Status:** Awaiting Approval  
**Last Updated:** October 25, 2025
