# Timeline/Activities vs Games Feature Clarification

## Overview
PartyHause has **two distinct features** that should not be confused:

1. **Timeline/Activities** - Event schedule planning
2. **Games** - Interactive party games library

---

## 1. Timeline/Activities Feature

### Purpose
A structured **schedule builder** for planning and managing the sequence of activities during an event.

### What It Is
- **Event Schedule Management**: Create a timeline of planned activities for your event
- **Time-based Planning**: Each activity has a start time and duration
- **Guest Communication**: Share the schedule with guests so they know what to expect

### Use Cases
- **Wedding Timeline**: Cocktail hour (6:00 PM), Ceremony (6:30 PM), Reception (7:30 PM), First Dance (8:00 PM)
- **Birthday Party**: Arrival & Mingling (3:00 PM), Cake Cutting (4:00 PM), Games (4:30 PM), Dinner (5:30 PM)
- **Conference Agenda**: Keynote (9:00 AM), Panel Discussion (10:30 AM), Lunch (12:00 PM), Workshops (1:30 PM)
- **Festival Schedule**: Band A (2:00 PM), Band B (3:30 PM), Food Break (5:00 PM), Headliner (7:00 PM)

### Timeline Block Types
```typescript
type TimelineBlockType = 
  | 'activity'      // General activities (arrival, mingling, photos)
  | 'meal'          // Food service (dinner, cake, cocktails)
  | 'speech'        // Speeches and toasts
  | 'performance'   // Performances, shows, entertainment
  | 'break'         // Breaks and transitions
  | 'custom'        // Custom activities
```

### Key Features
- **Time-based**: Each block has start time + duration
- **Schedule visibility**: Share timeline with guests
- **Reminders**: Notify guests before activities start
- **Host notes**: Private notes visible only to hosts/organizers
- **Multi-location**: Different activities at different locations
- **Assignment**: Assign activities to co-hosts or vendors

### Example Timeline Block
```typescript
{
  id: "block_123",
  label: "Dinner Service",
  description: "Three-course meal with wine pairing",
  start_time: "19:00",    // 7:00 PM
  duration: 90,           // 90 minutes
  type: "meal",
  guest_visible: true,
  notify_before: 15,      // Notify 15 min before
  location: "Main Hall"
}
```

### Files & Implementation
**Web:**
- `src/features/timeline/types.ts` - Timeline types
- `src/features/timeline/components/TimelineManagement.tsx` - Timeline builder
- `src/lib/timeline.ts` - Timeline service
- `api/timeline.ts` - Timeline API endpoint

**Mobile:**
- `apps/mobile/app/events/create/timeline.tsx` - Mobile timeline builder

**Database:**
- `events.timeline_blocks` - JSONB column storing timeline blocks
- `timeline_blocks` table - Legacy table (being migrated to JSONB)

---

## 2. Games Feature

### Purpose
A **library of interactive party games** that can be played during events to entertain guests and break the ice.

### What It Is
- **Pre-built Game Library**: 30+ ready-to-play party games
- **Interactive Entertainment**: Real-time games guests play together
- **Icebreakers & Fun**: Games to help guests mingle and have fun

### Use Cases
- **Icebreaker Games**: "Two Truths and a Lie", "Getting to Know You", "Would You Rather"
- **Trivia Games**: General knowledge, pop culture, themed trivia
- **Creative Games**: "Story Chain", "Pictionary", "Caption This"
- **Physical Games**: "Scavenger Hunt", "Dance Challenge"
- **Social Games**: Polls, voting, group challenges

### Game Categories
```typescript
type GameCategory = 
  | 'icebreaker'     // Games to help guests meet
  | 'trivia'         // Knowledge-based quiz games
  | 'creative'       // Creative/artistic challenges
  | 'physical'       // Movement/action games
  | 'social'         // Social interaction games
  | 'professional'   // Corporate team-building games
```

### Key Features
- **Game Templates**: Pre-configured games ready to start
- **Real-time Play**: Guests join and play together
- **Scoring & Leaderboards**: Track winners and scores
- **Customizable**: Modify games for your event
- **Host Controls**: Start, pause, end games
- **Participant Management**: See who's playing

### Example Game
```typescript
{
  id: "trivia-general",
  name: "General Trivia",
  description: "Fast-paced knowledge questions",
  category: "trivia",
  difficulty: "medium",
  energy: "medium",
  duration: 10,              // 10 minutes typical play time
  minPlayers: 2,
  maxPlayers: null,          // Unlimited
  instructions: "Answer each question before time runs out...",
  tags: ["knowledge", "competitive"],
  icon: "🧠"
}
```

### Files & Implementation
**Web:**
- `src/types/gameTypes.ts` - Game types and interfaces
- `src/lib/games.ts` - Game templates and logic
- `src/components/GamesPage.tsx` - Games page component
- `src/components/games/GameManager.tsx` - Game orchestration

**Mobile:**
- `apps/mobile/app/(tabs)/games.tsx` - Mobile games screen

**Database:**
- Games are currently template-based (no DB tables yet)
- Future: `game_sessions`, `game_results` tables for tracking plays

---

## Key Differences

| Aspect | Timeline/Activities | Games |
|--------|-------------------|-------|
| **Purpose** | Schedule planning | Interactive entertainment |
| **Structure** | Time-based sequence | Game templates |
| **Duration** | Event-specific (hours) | Per-game (5-30 min) |
| **Planning** | Pre-event planning | During-event execution |
| **Visibility** | Schedule shared with guests | Real-time participation |
| **Examples** | "Dinner at 7 PM", "Speeches at 8 PM" | "Trivia Game", "Scavenger Hunt" |
| **Data Storage** | `events.timeline_blocks` | Templates + future game sessions |
| **User Role** | Host plans, guests view | Host starts, guests play |

---

## How They Work Together

### Typical Event Flow:

1. **Planning Phase** (Timeline/Activities):
   ```
   6:00 PM - Guest Arrival & Cocktails (60 min)
   7:00 PM - Dinner Service (90 min)
   8:30 PM - Interactive Games (60 min)    ← Games referenced in timeline
   9:30 PM - Cake & Toasts (30 min)
   ```

2. **Execution Phase** (Games Feature):
   - At 8:30 PM, host opens Games page
   - Selects "Two Truths and a Lie" from game library
   - Guests join and play for 20 minutes
   - Host then starts "Trivia Game"
   - Guests play for 30 minutes

### Integration Points:
- **Timeline Block** can reference that "Games" will happen at 8:30 PM
- **Games Feature** is used *during* that timeline block to actually run games
- Timeline = **WHAT** and **WHEN** ("Games at 8:30 PM")
- Games = **HOW** (selecting and playing specific games)

---

## User Experience

### Host Perspective:

**Before Event (Timeline):**
1. Create event
2. Build timeline: "Arrival → Dinner → Games → Dessert"
3. Share timeline with guests

**During Event (Games):**
1. Navigate to Games page when it's "Games time" (8:30 PM)
2. Browse game library
3. Select and start games
4. Guests join and play

### Guest Perspective:

**Before Event:**
- View event timeline
- See "Interactive Games" scheduled for 8:30 PM

**During Event:**
- Check timeline to know what's next
- When 8:30 PM comes, host starts games
- Join games from app

---

## API Endpoints

### Timeline APIs
```
GET  /api/timeline?eventId=xxx - Get event timeline
POST /api/timeline             - Add timeline block
PATCH /api/timeline?id=xxx     - Update timeline block
DELETE /api/timeline?id=xxx    - Delete timeline block
```

### Games APIs
```
Future implementation:
POST   /api/games/sessions       - Start game session
GET    /api/games/sessions/:id  - Get session state
PATCH  /api/games/sessions/:id  - Update session
DELETE /api/games/sessions/:id  - End session
POST   /api/games/sessions/:id/join - Join game
```

---

## Database Schema

### Timeline Storage
```sql
-- Current approach: JSONB column
ALTER TABLE events ADD COLUMN timeline_blocks JSONB DEFAULT '[]';

-- Example data
[
  {
    "id": "block_1",
    "label": "Dinner Service",
    "start_time": "19:00",
    "duration": 90,
    "type": "meal",
    "guest_visible": true
  },
  {
    "id": "block_2",
    "label": "Games & Activities",
    "start_time": "20:30",
    "duration": 60,
    "type": "activity",
    "guest_visible": true
  }
]
```

### Games Storage (Future)
```sql
-- Game sessions tracking
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  game_template_id VARCHAR(100),
  host_id UUID,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  status VARCHAR(20),
  config JSONB
);

-- Game participation
CREATE TABLE game_participants (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES game_sessions(id),
  user_id UUID,
  score INTEGER,
  joined_at TIMESTAMP
);
```

---

## Marketing & Communication

### How to Describe Each Feature:

**Timeline/Activities:**
- "Plan your event schedule with a visual timeline"
- "Create a minute-by-minute agenda for your party"
- "Share your event schedule with all guests"
- "Keep everyone on track with timed activities"

**Games:**
- "30+ built-in party games and icebreakers"
- "Interactive games to entertain your guests"
- "Break the ice with fun group activities"
- "Real-time trivia, polls, and challenges"

---

## Future Enhancements

### Timeline/Activities:
- [ ] Drag-and-drop timeline editor
- [ ] Visual timeline view (Gantt chart style)
- [ ] Automated reminders via push notifications
- [ ] Multi-day event support
- [ ] Parallel tracks (e.g., conference sessions)
- [ ] Vendor assignment to timeline blocks
- [ ] Budget tracking per timeline block

### Games:
- [ ] Custom game creation
- [ ] Game session replay/history
- [ ] Leaderboards across events
- [ ] Team-based games
- [ ] Prize/reward integration
- [ ] Game analytics (most popular games)
- [ ] User-generated game submissions

---

## Migration Path

### Current State:
- ✅ Timeline: Implemented with JSONB storage
- ✅ Games: Template library implemented
- ⏳ Games: Session tracking not yet implemented

### Next Steps:
1. Clarify UI/UX to clearly distinguish Timeline vs Games
2. Add "Start Game" button in Games section during event
3. Implement game session tracking (database + API)
4. Link timeline "Games" blocks to actual game sessions
5. Add game history/analytics

---

## Summary

**Timeline/Activities = Event Schedule Planning**
- "WHAT happens WHEN during your event"
- Pre-event planning tool
- Time-based structure
- Guest-facing schedule

**Games = Interactive Entertainment**
- "Party games library to play during event"
- Real-time execution tool
- Activity-based structure
- Guest participation

**Both features complement each other** but serve distinct purposes:
- Use **Timeline** to plan "Games will happen at 8:30 PM"
- Use **Games** at 8:30 PM to actually run trivia, icebreakers, etc.
