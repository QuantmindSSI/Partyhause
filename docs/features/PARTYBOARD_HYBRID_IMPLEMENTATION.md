# PartyBoard: Hybrid Sticky Implementation Spec

## 🎨 Overview

**Hybrid Sticky + Structured** interface combining:
- **Top Half:** Freeform sticky canvas (mood board)
- **Bottom Half:** Organized action list (structured planning)

**Goal:** Visual inspiration meets practical decision-making in ONE view.

---

## 📐 Layout Specifications

### **Screen Division**

```
┌─────────────────────────────────────────────────┐
│ PartyBoard           [🎨][📋] [+]              │ ← Header (60px)
├─────────────────────────────────────────────────┤
│                                                 │
│ ═══════ MOOD BOARD (Sticky Canvas) ═══════    │
│ Height: 40% of viewport (min 300px)            │
│                                                 │
│  [🖼️]   [💜]    [🔗]                           │
│  Photo  Theme   Link                            │
│                                                 │
│  [🎵]   [💰]                                   │
│  Music  Cost                                    │
│                                                 │
│ [Double tap anywhere to add sticky]            │
│                                                 │
├─────────────────────────────────────────────────┤ ← Divider (40px, draggable)
│ ═══════ ACTION ITEMS (List) ═══════            │
│ Height: 60% of viewport                         │
│                                                 │
│ Stats: 12 ideas | 3 tasks | 45 votes           │
│ [All][Venue][Food][Decor][Entertainment]       │
│                                                 │
│ ┌─────────────────────────────────────────┐    │
│ │ 🎨 String lights - $150 • ❤️ 20 [✓]    │    │
│ └─────────────────────────────────────────┘    │
│ ┌─────────────────────────────────────────┐    │
│ │ 🎵 Photo booth - $500 • ❤️ 15  [Vote]  │    │
│ └─────────────────────────────────────────┘    │
│                                                 │
│ [+ Add New Item]                                │
└─────────────────────────────────────────────────┘
```

### **Responsive Breakpoints**

**Mobile Portrait (< 768px):**
- Canvas: 35% of height (min 250px)
- List: 65% of height
- Single column layout

**Tablet (768px - 1024px):**
- Canvas: 40% of height
- List: 60% of height
- Can show more items

**Desktop (> 1024px):**
- Canvas: 45% of height
- List: 55% of height
- Side-by-side mode option

---

## 🎨 Sticky Canvas (Top Half)

### **Item Types & Data Structures**

```typescript
type StickyType = 'image' | 'link' | 'note' | 'video' | 'cost' | 'checklist';

interface StickyItem {
  id: string;
  type: StickyType;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation?: number; // -15 to 15 degrees
  z_index: number;
  category?: string;
  reactions: Reaction[];
  created_by: string;
  created_at: string;
  
  // Type-specific data
  data: ImageStickyData | LinkStickyData | NoteStickyData | VideoStickyData | CostStickyData | ChecklistStickyData;
}

interface ImageStickyData {
  url: string;
  caption?: string;
  aspect_ratio: number;
}

interface LinkStickyData {
  url: string;
  title: string;
  description?: string;
  preview_image?: string;
  favicon?: string;
}

interface NoteStickyData {
  content: string;
  color: string; // sticky note color
  font_size: number;
}

interface VideoStickyData {
  url: string; // YouTube, Vimeo, etc.
  thumbnail: string;
  title: string;
  duration?: string;
}

interface CostStickyData {
  item_name: string;
  amount: number;
  currency: string;
  vendor?: string;
  notes?: string;
}

interface ChecklistStickyData {
  title: string;
  items: Array<{ text: string; completed: boolean }>;
}
```

### **Sticky Visual Designs**

#### **1. Image Sticky**
```
┌────────────────────┐
│ [📸 Image]         │
│                    │
│  [Photo/graphic]   │
│                    │
├────────────────────┤
│ Caption text here  │
│ ❤️ 5  💬 2         │
└────────────────────┘
Size: 120x160px (portrait) or 160x120px (landscape)
Shadow: 0px 2px 8px rgba(0,0,0,0.15)
```

#### **2. Link Sticky**
```
┌────────────────────┐
│ [🔗]  pinterest.com│
│ ┌────────────────┐ │
│ │ [Preview img]  │ │
│ └────────────────┘ │
│ "Party Decor Ideas"│
│ ❤️ 3               │
└────────────────────┘
Size: 140x140px
Border: 2px solid #E5E7EB
```

#### **3. Note Sticky**
```
┌────────────────────┐
│ Purple & gold      │
│ theme with         │
│ confetti           │
│                    │
│          by Sarah  │
└────────────────────┘
Size: 120x120px
Colors: Yellow (#FEFCE8), Pink (#FCE7F3), Blue (#DBEAFE), Green (#DCFCE7)
Shadow: 0px 4px 6px rgba(0,0,0,0.1)
Slight rotation: Random -5° to +5°
```

#### **4. Cost Sticky**
```
┌────────────────────┐
│ 💰 COST            │
│                    │
│    $500            │
│ Photo Booth        │
│                    │
│ Party Booth Co.    │
│ ❤️ 15  [Convert]   │
└────────────────────┘
Size: 140x160px
Background: Linear gradient #10B981 to #059669
Text: White
```

#### **5. Video Sticky**
```
┌────────────────────┐
│ [▶ Thumbnail]      │
│   [Play button]    │
│                    │
│ "DJ Performance"   │
│ 2:45  ❤️ 8         │
└────────────────────┘
Size: 160x120px
Border: 2px solid #EF4444
```

### **Canvas Interactions**

#### **Gestures:**

1. **Single Tap (on sticky)**
   - Opens detail modal
   - Shows full content
   - Edit/delete options
   - More reactions

2. **Long Press (on sticky)**
   - Enters "move mode"
   - Sticky lifts up (scale 1.1, shadow increases)
   - Can drag anywhere
   - Drop to place

3. **Double Tap (on empty space)**
   - Opens "Add Sticky" menu
   - Quick creation modal

4. **Pinch (two fingers)**
   - Zoom in/out on canvas
   - Scale: 0.5x to 2.0x
   - Canvas boundaries expand

5. **Two-finger Pan**
   - Move entire canvas
   - Reveals more space
   - Infinite canvas (within limits)

6. **Drag (from list to canvas)**
   - Pick up item from list
   - Drop onto canvas
   - Auto-creates sticky version

#### **Add Sticky Menu:**

```
┌─────────────────────────────────────┐
│     Add to Mood Board               │
├─────────────────────────────────────┤
│ 📸  Upload Image                    │
│ 🔗  Paste Link                      │
│ 📝  Write Note                      │
│ 🎥  Add Video                       │
│ 💰  Track Cost                      │
│ ✓  Create Checklist                │
├─────────────────────────────────────┤
│           Cancel                    │
└─────────────────────────────────────┘
```

### **Canvas Features**

#### **Background Options:**
- White (default)
- Dot grid (subtle gray dots)
- Cork board texture
- Chalkboard
- Custom uploaded image (blurred)

#### **Grid Snapping:**
- Toggle on/off
- 20px grid increments
- Visual grid overlay when dragging

#### **Clustering:**
- Auto-detect nearby items (<50px apart)
- Suggest grouping with dashed outline
- "Group these items?" prompt

#### **Zoom Levels:**
- 50% - Bird's eye view
- 75% - Overview
- 100% - Default (comfortable)
- 125% - Close up
- 150% - Detail view
- 200% - Maximum zoom

#### **Canvas Bounds:**
- Width: 2000px virtual space
- Height: 2000px virtual space
- Scrollable/pannable
- Mini-map in corner showing position

---

## 📋 Action List (Bottom Half)

### **List View Components**

#### **Stats Bar:**
```
┌─────────────────────────────────────────────┐
│ 💡 12 ideas  |  ✓ 3 tasks  |  ❤️ 45 votes   │
└─────────────────────────────────────────────┘
Height: 40px
Background: #F9FAFB
Border-bottom: 1px solid #E5E7EB
```

#### **Category Filters:**
```
┌─────────────────────────────────────────────┐
│ [All][Venue][Entertainment][Food][Decor]... │
└─────────────────────────────────────────────┘
Height: 50px
Horizontal scroll
Active: Purple background, white text
Inactive: White background, gray text
```

#### **Item Card:**
```
┌──────────────────────────────────────────────┐
│ 🎨 DECOR                    ❤️ 20    $150   │
│                                              │
│ String lights across ceiling for starry     │
│ night effect                                 │
│                                              │
│ 👤 Emma W. • 2h ago              [✓ Task]   │
└──────────────────────────────────────────────┘
Height: 100px
Padding: 12px
Background: White
Border: 1px solid #E5E7EB
Border-radius: 8px
Margin-bottom: 8px
```

### **List Item Data Structure**

```typescript
interface ListItem {
  id: string;
  content: string;
  category: string;
  estimated_cost?: number;
  reaction_count: number;
  user_id: string;
  user_name: string;
  converted_to_task: boolean;
  sticky_id?: string; // Link to canvas sticky
  created_at: string;
  updated_at: string;
}
```

### **Sorting & Filtering**

**Sort Options:**
- Popular (votes desc)
- Recent (time desc)
- Low to High Cost
- High to Low Cost
- By Author

**Filters:**
- Category (Venue, Entertainment, Food, Activities, Decor, Other)
- Price Range (Free, <$100, $100-$500, $500-$1000, >$1000)
- Status (All, Not converted, Converted to tasks)
- Has image
- Has cost
- My items only

### **List Actions**

#### **Swipe Actions:**

**Swipe Left:**
```
┌─────────────────────────────────┬───────┬───────┐
│ Item content...                 │ ❤️    │ 🗑️   │
│                                 │ Vote  │Delete │
└─────────────────────────────────┴───────┴───────┘
```

**Swipe Right:**
```
┌───────┬───────┬─────────────────────────────────┐
│ ✓     │ 📝    │ Item content...                 │
│ Task  │ Edit  │                                 │
└───────┴───────┴─────────────────────────────────┘
```

#### **Long Press (on list item):**
Shows action sheet:
- Vote (heart)
- Convert to Task
- Edit
- Delete
- Share
- Add to Canvas (create sticky)

---

## 🔄 Synchronization Between Views

### **Bidirectional Sync Rules:**

1. **Creating in List → Creates in Canvas**
   - New list item auto-generates sticky
   - Places sticky in random available spot
   - Links ids: `list_item.sticky_id = sticky.id`

2. **Creating in Canvas → Creates in List**
   - New sticky auto-generates list item
   - Extracts relevant data (title, cost, etc.)
   - Links ids: `sticky.list_item_id = list_item.id`

3. **Editing in Either → Updates Both**
   - Change content: Updates everywhere
   - Change category: Updates color/badge
   - Add cost: Updates both views
   - Real-time sync via Supabase Realtime

4. **Deleting in Either → Deletes Both**
   - Confirmation modal: "Delete from both views?"
   - Option: "Delete from canvas only" or "Delete from list only"
   - Default: Delete from both

5. **Reactions Sync**
   - Vote on list item → Updates sticky reaction count
   - React on sticky → Updates list item votes
   - Real-time counter updates

### **Sync Indicators:**

**While Syncing:**
```
┌─────────────────┐
│ Syncing... ⟳    │
└─────────────────┘
```

**Sync Error:**
```
┌─────────────────┐
│ Offline ⚠️      │
│ Changes saved   │
│ locally         │
└─────────────────┘
```

**Sync Complete:**
```
┌─────────────────┐
│ Synced ✓        │
└─────────────────┘
```

---

## 🎯 Divider Interaction

### **Draggable Divider Features:**

```
═════════════════════════════════════
         ⋮⋮⋮  (Drag handle)
═════════════════════════════════════
```

**Functionality:**
- Drag up: Expand list, shrink canvas
- Drag down: Expand canvas, shrink list
- Minimums: 
  - Canvas: 200px (collapsed)
  - List: 200px (collapsed)
- Maximums:
  - Canvas: 80% of screen
  - List: 80% of screen
- Snap points: 30/70, 40/60, 50/50, 60/40, 70/30
- Save user preference

**Visual States:**
- **Idle**: Light gray bar
- **Hover**: Purple gradient bar
- **Dragging**: Purple bar + haptic feedback
- **Snapped**: Brief animation + haptic

---

## 🎨 Theming & Colors

### **Canvas Theme:**
```css
--canvas-bg: #FFFFFF;
--canvas-grid: #F3F4F6;
--canvas-border: #E5E7EB;
--sticky-shadow: rgba(0, 0, 0, 0.1);
--sticky-shadow-hover: rgba(0, 0, 0, 0.2);
```

### **List Theme:**
```css
--list-bg: #F9FAFB;
--card-bg: #FFFFFF;
--card-border: #E5E7EB;
--card-hover: #F3F4F6;
--category-venue: #3B82F6;
--category-entertainment: #10B981;
--category-food: #F59E0B;
--category-activities: #EF4444;
--category-decor: #EC4899;
--category-other: #6B7280;
```

### **Interactive Elements:**
```css
--primary-purple: #8B5CF6;
--success-green: #10B981;
--warning-orange: #F59E0B;
--danger-red: #EF4444;
--heart-red: #EF4444;
--task-green: #10B981;
```

---

## 📱 Mobile-Specific Optimizations

### **Touch Targets:**
- Minimum: 44x44 pt (Apple HIG)
- Sticky items: 120x120 px minimum
- Buttons: 48x48 dp minimum
- Spacing between tappable items: 8px minimum

### **Performance:**
- **Lazy rendering**: Only render visible stickies
- **Virtual scrolling**: List uses windowing
- **Image optimization**: Thumbnails for canvas, full-res on tap
- **Debounced dragging**: Update position every 16ms (60fps)
- **Cached layouts**: Save positions locally

### **Gestures Library:**
- Use `react-native-gesture-handler`
- Smooth animations with `react-native-reanimated`
- Haptic feedback with `expo-haptics`

---

## 🔔 Real-time Collaboration

### **Live Features:**

1. **Presence Indicators**
   - Show who's viewing (avatars at top)
   - Show who's editing (cursor on sticky)
   - Show who just added item (brief flash)

2. **Live Cursor Tracking**
   - Show teammates' cursors on canvas
   - Color-coded by user
   - Name label follows cursor

3. **Real-time Updates**
   - New sticky appears with animation
   - Moved sticky shows path
   - Deleted sticky fades out
   - Vote counters increment live

4. **Conflict Resolution**
   - Last write wins (LWW)
   - Optimistic updates
   - Rollback on conflict
   - Notification: "X updated this item"

### **Supabase Realtime Setup:**

```typescript
// Subscribe to sticky updates
const channel = supabase
  .channel('partyboard_stickies')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'partyboard_stickies',
      filter: `session_id=eq.${sessionId}`
    },
    (payload) => handleStickyChange(payload)
  )
  .subscribe();

// Subscribe to list items
const listChannel = supabase
  .channel('partyboard_items')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'partyboard_items',
      filter: `session_id=eq.${sessionId}`
    },
    (payload) => handleListItemChange(payload)
  )
  .subscribe();
```

---

## 💾 Data Storage

### **Supabase Tables:**

```sql
-- Sticky canvas items
CREATE TABLE partyboard_stickies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES partyboard_sessions(id),
  type TEXT NOT NULL, -- 'image', 'link', 'note', 'video', 'cost'
  position_x INTEGER NOT NULL,
  position_y INTEGER NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  rotation SMALLINT DEFAULT 0,
  z_index INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  data JSONB NOT NULL, -- Type-specific data
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  linked_item_id UUID REFERENCES partyboard_items(id)
);

-- List items
CREATE TABLE partyboard_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES partyboard_sessions(id),
  content TEXT NOT NULL,
  category TEXT,
  estimated_cost DECIMAL(10, 2),
  reaction_count INTEGER DEFAULT 0,
  converted_to_task BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  linked_sticky_id UUID REFERENCES partyboard_stickies(id)
);

-- Reactions
CREATE TABLE partyboard_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_type TEXT NOT NULL, -- 'sticky' or 'item'
  target_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  reaction_type TEXT NOT NULL DEFAULT 'heart',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(target_id, user_id, reaction_type)
);

-- Sessions
CREATE TABLE partyboard_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id),
  title TEXT DEFAULT 'Untitled Board',
  canvas_settings JSONB DEFAULT '{"background": "white", "grid": false}',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Indexes:**

```sql
CREATE INDEX idx_stickies_session ON partyboard_stickies(session_id);
CREATE INDEX idx_stickies_created ON partyboard_stickies(created_at DESC);
CREATE INDEX idx_items_session ON partyboard_items(session_id);
CREATE INDEX idx_items_category ON partyboard_items(category);
CREATE INDEX idx_reactions_target ON partyboard_reactions(target_id);
```

---

## 🎬 Animations

### **Canvas Animations:**

1. **Add Sticky**
   - Scale from 0 to 1 (spring)
   - Fade in opacity 0 to 1
   - Slight rotation wobble
   - Duration: 300ms

2. **Move Sticky**
   - Follow finger with spring physics
   - Shadow increases while dragging
   - Snap to grid with haptic
   - Duration: Continuous

3. **Delete Sticky**
   - Scale down to 0 (ease-out)
   - Fade out opacity
   - Slight rotation spin
   - Duration: 200ms

4. **React on Sticky**
   - Heart icon pops up from sticky
   - Rises up 50px
   - Fades out
   - Counter increments with bounce
   - Duration: 500ms

### **List Animations:**

1. **Add Item**
   - Slide in from top
   - Fade in
   - Push existing items down
   - Duration: 300ms

2. **Delete Item**
   - Slide out to right
   - Fade out
   - Collapse height
   - Duration: 250ms

3. **Convert to Task**
   - Flash green
   - Checkmark appears
   - Badge animates in
   - Duration: 400ms

4. **Vote**
   - Heart pulses
   - Counter animates
   - Brief color change
   - Duration: 200ms

---

## ✅ Implementation Checklist

### **Phase 1: Foundation (Week 1)**
- [ ] Set up component structure
- [ ] Create layout with divider
- [ ] Implement basic canvas (pan, zoom)
- [ ] Implement basic list (scroll, filter)
- [ ] Set up Supabase tables
- [ ] Connect to backend

### **Phase 2: Canvas Features (Week 2)**
- [ ] Add sticky creation modal
- [ ] Implement note stickies
- [ ] Implement image stickies
- [ ] Implement drag & drop
- [ ] Add zoom/pan gestures
- [ ] Implement reactions

### **Phase 3: List Features (Week 2)**
- [ ] Add category filters
- [ ] Implement sorting
- [ ] Add vote button
- [ ] Add convert to task
- [ ] Implement swipe actions
- [ ] Add search

### **Phase 4: Sync & Collaboration (Week 3)**
- [ ] Bidirectional sync logic
- [ ] Real-time updates
- [ ] Presence indicators
- [ ] Conflict resolution
- [ ] Offline support

### **Phase 5: Advanced Features (Week 4)**
- [ ] Link stickies
- [ ] Video stickies
- [ ] Cost stickies
- [ ] Checklist stickies
- [ ] Background options
- [ ] Export/share

### **Phase 6: Polish (Week 5)**
- [ ] Animations
- [ ] Haptics
- [ ] Performance optimization
- [ ] Error handling
- [ ] Loading states
- [ ] Empty states

### **Phase 7: Testing (Week 6)**
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Performance testing
- [ ] Accessibility testing
- [ ] User testing

---

## 🚀 Success Metrics

### **Engagement:**
- Average time on screen: >3 minutes
- Items added per session: >5
- Return rate: >60%
- Sync completion rate: >95%

### **Functionality:**
- Canvas load time: <1 second
- List render time: <500ms
- Gesture response time: <16ms (60fps)
- Sync delay: <100ms

### **Quality:**
- Crash rate: <0.1%
- Error rate: <1%
- User satisfaction: >4.5/5
- Feature adoption: >70%

---

**Ready to build the most collaborative planning board ever! 🎨🚀**
