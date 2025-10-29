# 📱 Real-Time Collaboration - Screens & User Flow

**Version:** 1.0  
**Date:** October 25, 2025  
**Document Type:** Screen Architecture & User Scenarios  

---

## 📐 Required Screens

### **File Structure:**

```
apps/mobile/
├─ app/
│  └─ events/
│     └─ [id]/
│        ├─ planning/
│        │  └─ collaborate/          → NEW: Collaboration Hub
│        │     ├─ index.tsx          → Main collaboration screen
│        │     ├─ polls/
│        │     │  ├─ index.tsx       → Active polls list
│        │     │  ├─ [pollId].tsx    → Poll details & voting
│        │     │  └─ create.tsx      → Create new poll
│        │     ├─ debates/
│        │     │  ├─ index.tsx       → Active debates list
│        │     │  ├─ [debateId].tsx  → Debate view
│        │     │  └─ create.tsx      → Create debate
│        │     ├─ brainstorm/
│        │     │  ├─ index.tsx       → Brainstorm sessions
│        │     │  ├─ [sessionId].tsx → Live brainstorm
│        │     │  └─ create.tsx      → Start session
│        │     ├─ decisions/
│        │     │  └─ [roomId].tsx    → Decision room
│        │     └─ activity.tsx       → Live activity feed
│        │
│        └─ reactions.tsx            → Reaction overlay/modal
│
└─ components/
   └─ collaboration/                  → NEW: Collaboration components
      ├─ PollCard.tsx                → Poll display card
      ├─ PollVotingScreen.tsx        → Voting interface
      ├─ CreatePollModal.tsx         → Poll creation
      ├─ DebateScreen.tsx            → Debate interface
      ├─ DebatePointCard.tsx         → Pro/con point
      ├─ BrainstormCanvas.tsx        → Sticky note canvas
      ├─ IdeaCard.tsx                → Brainstorm idea card
      ├─ DecisionRoomScreen.tsx      → Live decision UI
      ├─ QuickConsensus.tsx          → Quick yes/no buttons
      ├─ ReactionPicker.tsx          → Emoji reaction picker
      ├─ ActivityFeedItem.tsx        → Activity feed item
      ├─ LivePresence.tsx            → Who's active indicator
      ├─ TypingIndicator.tsx         → Who's typing
      ├─ SentimentBadge.tsx          → Sentiment indicator
      ├─ ConsensusBar.tsx            → Progress to consensus
      ├─ CollaborationPoints.tsx     → Points/gamification
      └─ BudgetAllocationSlider.tsx  → Budget planning tool
```

---

## 📱 Screen Details

### **1. Collaboration Hub Screen** 
**Route:** `/events/[id]/planning/collaborate`

```typescript
┌─────────────────────────────────────────┐
│ ← 🤝 Collaboration Hub                  │
│ [Activity] [Polls] [Debates] [Ideas]   │
├─────────────────────────────────────────┤
│                                         │
│ 🔴 LIVE NOW (3)                         │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🗳️ Active Poll                      │ │
│ │ "What main course?"                 │ │
│ │ ██████░░░░ Pizza winning (65%)     │ │
│ │ 5/8 voted • Ends in 1h              │ │
│ │ [Vote Now]                          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🧠 Brainstorm Session               │ │
│ │ "Decoration Ideas"                  │ │
│ │ 👥 Mike, Jessica active             │ │
│ │ 12 ideas • 45 reactions             │ │
│ │ [Join Session]                      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ⚖️ Debate                           │ │
│ │ "DJ vs Live Band"                   │ │
│ │ DJ: 16 pts • Band: 10 pts           │ │
│ │ 6/8 participated                    │ │
│ │ [View Debate]                       │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 📊 Recent Decisions                     │
│ • Food menu ✅ Pizza chosen             │
│ • Venue ✅ Riverside Park               │
│ • Theme ⏳ Voting in progress           │
│                                         │
│ [+ Create Poll] [+ Start Brainstorm]    │
│ [+ Start Debate] [+ Quick Vote]         │
│                                         │
│ 👥 Team Activity (Last 24h):            │
│ • 23 votes cast                         │
│ • 15 ideas contributed                  │
│ • 8 decisions made                      │
│ • 🏆 Mike: Top collaborator!            │
└─────────────────────────────────────────┘
```

---

### **2. Poll Details & Voting Screen**
**Route:** `/events/[id]/planning/collaborate/polls/[pollId]`

```typescript
┌─────────────────────────────────────────┐
│ ← 🗳️ Poll: Main Course Selection       │
│ Created by Sarah • 2 hours ago          │
├─────────────────────────────────────────┤
│                                         │
│ "What should we serve as main course    │
│  for 50 guests?"                        │
│                                         │
│ 📊 Live Results (5/8 voted):            │
│                                         │
│ ○ 🍕 Pizza Bar                          │
│   ████████████░░░░ 3 votes (60%)       │
│   👤 Sarah, Mike, Jessica               │
│   💬 2 comments                         │
│                                         │
│ ○ 🌮 Taco Station                       │
│   ████░░░░░░░░░░░░ 1 vote (20%)        │
│   👤 David                              │
│   💬 1 comment                          │
│                                         │
│ ○ 🍝 Pasta Buffet                       │
│   ████░░░░░░░░░░░░ 1 vote (20%)        │
│   👤 Emily                              │
│   💬 No comments                        │
│                                         │
│ [Select & Vote]                         │
│                                         │
│ ⏰ Ends in: 1 hour 23 minutes           │
│ 🎯 Auto-close at 70% consensus          │
│                                         │
│ ───────────────────────────────────────  │
│                                         │
│ 💬 Discussion (3):                      │
│                                         │
│ Mike: "Pizza is always a crowd pleaser! │
│        Easy to serve too." 😍           │
│ └─ 👍 5 • 💬 Reply                     │
│                                         │
│ Jessica: "What about dietary needs?     │
│           We need veggie options 🌱"    │
│ └─ 👍 3 • 💬 Reply                     │
│                                         │
│ Sarah: "Good point! All options can     │
│         include vegan choices ✨"       │
│ └─ 👍 4 • 💬 Reply                     │
│                                         │
│ [Add Comment] [+ Add Option]            │
│                                         │
│ ✨ 70% consensus will auto-close poll   │
│    and update task automatically        │
└─────────────────────────────────────────┘
```

**After voting:**

```typescript
┌─────────────────────────────────────────┐
│ ✅ You voted for 🍕 Pizza Bar!          │
│                                         │
│ Current results updated:                │
│ ████████████████ 4 votes (67%)         │
│                                         │
│ Almost at consensus! (Need 70%)         │
│ 1 more vote needed 🎯                   │
│                                         │
│ [Change Vote] [Share Poll]              │
└─────────────────────────────────────────┘
```

---

### **3. Create Poll Screen**
**Route:** `/events/[id]/planning/collaborate/polls/create`

```typescript
┌─────────────────────────────────────────┐
│ ← Create Poll                     [Post]│
├─────────────────────────────────────────┤
│                                         │
│ 🗳️ Poll Question:                      │
│ [What main course should we serve?_]    │
│                                         │
│ 📋 Options:                             │
│                                         │
│ 1. [🍕 Pizza Bar_______________] [×]    │
│    Description (optional):              │
│    [Variety of pizzas, $15/person_]     │
│                                         │
│ 2. [🌮 Taco Station___________] [×]    │
│    Description:                         │
│    [Build-your-own tacos, $12/p___]     │
│                                         │
│ 3. [🍝 Pasta Buffet___________] [×]    │
│    Description:                         │
│    [Italian spread, $18/person____]     │
│                                         │
│ [+ Add Option]                          │
│                                         │
│ ⚙️ Settings:                            │
│                                         │
│ Poll Type:                              │
│ ○ Single choice (one vote)              │
│ ○ Multiple choice (select many)         │
│ ○ Ranked choice (order preferences)     │
│                                         │
│ Duration:                               │
│ [4_] hours  [or]  [Custom___]          │
│                                         │
│ Auto-close options:                     │
│ ☑️ Close at 70% consensus               │
│ ☐ Allow vote changes                    │
│ ☑️ Show who voted for what              │
│ ☑️ Allow comments                       │
│                                         │
│ 🔗 Link to task (optional):             │
│ [Select task___] 🔍                    │
│                                         │
│ 📢 Notify:                              │
│ ☑️ All team members                     │
│ ☐ Specific people [Select___]          │
│                                         │
│ [Create Poll] [Save as Draft]           │
└─────────────────────────────────────────┘
```

---

### **4. Debate Screen**
**Route:** `/events/[id]/planning/collaborate/debates/[debateId]`

```typescript
┌─────────────────────────────────────────┐
│ ← ⚖️ Debate: DJ vs Live Band           │
│ Started by Sarah • 6 hours ago          │
├─────────────────────────────────────────┤
│                                         │
│ [Pros] [Cons] [Neutral] [Vote]          │
│                                         │
│ Decision Question:                      │
│ "Should we hire a DJ or a live band     │
│  for entertainment?"                    │
│                                         │
│ ───────────────────────────────────────  │
│                                         │
│ 🟢 PROS: Hire DJ                        │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ✅ More affordable                  │ │
│ │ By Mike • 5h ago                    │ │
│ │                                     │ │
│ │ "DJ costs $200 vs band at $800.     │ │
│ │  That's $600 we can use elsewhere!" │ │
│ │                                     │ │
│ │ 👍 8 agree  👎 1 disagree           │ │
│ │ 💬 3 comments                       │ │
│ │ [Upvote] [Downvote] [Comment]       │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ✅ Can play any song instantly      │ │
│ │ By Jessica • 4h ago                 │ │
│ │                                     │ │
│ │ "Guests can request songs and DJ    │ │
│ │  plays them immediately. More       │ │
│ │  interactive!"                      │ │
│ │                                     │ │
│ │ 👍 6 agree  👎 0 disagree           │ │
│ │ [Upvote] [Downvote] [Comment]       │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [+ Add Pro Argument]                    │
│                                         │
│ ───────────────────────────────────────  │
│                                         │
│ 🔴 CONS: Hire DJ                        │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ❌ Less "live" atmosphere           │ │
│ │ By Emily • 3h ago                   │ │
│ │                                     │ │
│ │ "Live music creates special energy  │ │
│ │  that recorded music can't match.   │ │
│ │  It's a birthday party!"            │ │
│ │                                     │ │
│ │ 👍 5 agree  👎 2 disagree           │ │
│ │ 💬 4 comments                       │ │
│ │ [Upvote] [Downvote] [Comment]       │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [+ Add Con Argument]                    │
│                                         │
│ ───────────────────────────────────────  │
│                                         │
│ 📊 Debate Score:                        │
│ Pros: 14 upvotes                        │
│ Cons: 5 upvotes                         │
│ 🟢 DJ leading by 73%                    │
│                                         │
│ 🗳️ Final Decision Vote:                │
│ [Vote for DJ] [Vote for Live Band]      │
│                                         │
│ Current votes: 4 DJ • 2 Band            │
│ Decision locks in: 2 hours              │
└─────────────────────────────────────────┘
```

---

### **5. Live Brainstorm Screen**
**Route:** `/events/[id]/planning/collaborate/brainstorm/[sessionId]`

```typescript
┌─────────────────────────────────────────┐
│ ← 🧠 Brainstorm: Decoration Ideas      │
│ ⏱️ 8:34 remaining • 👥 3 active         │
├─────────────────────────────────────────┤
│                                         │
│ Sarah is typing... ⌨️                   │
│                                         │
│ [Sticky Notes] [List] [Canvas]          │
│                                         │
│ ┌──────────┐  ┌──────────┐  ┌─────────┐│
│ │🎈 Balloon│  │🌸 Flower │  │✨ String││
│ │  Arch    │  │ Center-  │  │  Lights ││
│ │          │  │ pieces   │  │         ││
│ │ $150 💰  │  │ $80 💰   │  │ $120 💰 ││
│ │          │  │          │  │         ││
│ │ 😍 8     │  │ 🤔 3     │  │ 🔥 12   ││
│ │ 💬 2     │  │ 💬 1     │  │ 💬 5    ││
│ │ Sarah ✏️ │  │ Mike ✏️  │  │ Jess ✏️ ││
│ └──────────┘  └──────────┘  └─────────┘│
│                                         │
│ ┌──────────┐  ┌──────────┐             │
│ │🎨 Photo  │  │🎭 Theme  │             │
│ │  Booth   │  │  Props   │  [+ Add]   │
│ │          │  │          │             │
│ │ $200 💰  │  │ $50 💰   │             │
│ │          │  │          │             │
│ │ 💡 5     │  │ 😍 6     │             │
│ │ 💬 3     │  │ 💬 2     │             │
│ │ David ✏️ │  │ Emily ✏️ │             │
│ └──────────┘  └──────────┘             │
│                                         │
│ 💬 Live Chat:                           │
│ Mike: "Balloon arch at entrance!"       │
│ Jessica: "String lights = cozy vibe"    │
│ Sarah: "Photo booth is fun but $$$"     │
│                                         │
│ [Type message..._______________] [Send] │
│                                         │
│ ───────────────────────────────────────  │
│                                         │
│ 📊 Session Stats:                       │
│ 5 ideas • 34 reactions • 13 comments    │
│                                         │
│ [End Session] [Add 5 Minutes]           │
│                                         │
│ Top 3 ideas convert to tasks ✨         │
└─────────────────────────────────────────┘
```

**When tapping an idea:**

```typescript
┌─────────────────────────────────────────┐
│ 💡 Idea Details                         │
├─────────────────────────────────────────┤
│                                         │
│ ✨ String Lights                        │
│ Created by Jessica • 3 min ago          │
│                                         │
│ Description:                            │
│ "Hang warm white string lights across   │
│  the ceiling and outdoor area. Creates  │
│  cozy ambiance for evening party."      │
│                                         │
│ Estimated Cost: $120                    │
│                                         │
│ Reactions (12):                         │
│ 🔥 Amazing: Sarah, Mike, +5 more        │
│ 😍 Love it: Jessica, David, Emily       │
│ 💡 Great idea: Tom                      │
│                                         │
│ Comments (5):                           │
│ Mike: "This would look amazing!"        │
│ Sarah: "Perfect for night photos"       │
│ Emily: "Can rent from party store"      │
│                                         │
│ [React] [Comment] [Edit Cost]           │
│ [Convert to Task]                       │
└─────────────────────────────────────────┘
```

---

### **6. Quick Consensus Overlay**

Appears anywhere when needed:

```typescript
┌─────────────────────────────────────────┐
│ ⚡ Quick Decision                       │
├─────────────────────────────────────────┤
│                                         │
│ Mike asked:                             │
│ "Should we add vegan options to menu?"  │
│                                         │
│ [👍 Yes] [👎 No] [🤷 Don't Care]       │
│                                         │
│ Live results:                           │
│ 👍 Yes: ████████░ 6 (75%) ✅           │
│ 👎 No: ██░░░░░░░ 1 (12%)               │
│ 🤷 Don't Care: █░░░░░░░░ 1             │
│                                         │
│ ✨ Consensus reached!                   │
│ "Vegan options" added to menu task      │
│                                         │
│ [View Task] [Dismiss]                   │
└─────────────────────────────────────────┘
```

---

### **7. Live Activity Feed Screen**
**Route:** `/events/[id]/planning/collaborate/activity`

```typescript
┌─────────────────────────────────────────┐
│ ← 📡 Live Activity                      │
│ [All] [Decisions] [Updates] [Me]        │
├─────────────────────────────────────────┤
│                                         │
│ 🔴 LIVE • Just now                      │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🗳️ Mike voted in "Main Course"     │ │
│ │ Selected: 🍕 Pizza                  │ │
│ │ Pizza now winning (67%)             │ │
│ │ [View Poll]                         │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 🔴 LIVE • 15 seconds ago                │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 💬 Jessica commented                │ │
│ │ On: "Venue Selection"               │ │
│ │ "What about parking situation?"     │ │
│ │ [Reply]                             │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 🔴 LIVE • 23 seconds ago                │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 😍 Emily reacted to idea            │ │
│ │ "90s throwback theme"               │ │
│ │ 12 people now love this idea!       │ │
│ │ [View Idea]                         │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ⚪ 2 minutes ago                        │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ⚡ Quick consensus reached          │ │
│ │ "Add vegan options" - 75% yes       │ │
│ │ Task automatically updated ✨       │ │
│ │ [View Task]                         │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ⚪ 5 minutes ago                        │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🎯 Sarah started decision room      │ │
│ │ "Venue Selection"                   │ │
│ │ 5/8 members joined                  │ │
│ │ [Join Now]                          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Load More...]                          │
│                                         │
│ ───────────────────────────────────────  │
│                                         │
│ 👥 Currently Active (5):                │
│ Sarah, Mike, Jessica, Emily, David 🟢   │
│                                         │
│ [Filter ▼] [Search]                     │
└─────────────────────────────────────────┘
```

---

### **8. Reaction Picker (Bottom Sheet)**

```typescript
┌─────────────────────────────────────────┐
│ 😊 React to this                        │
├─────────────────────────────────────────┤
│                                         │
│ Quick Reactions:                        │
│                                         │
│ 😍 🎉 🔥 👍 💡 🤔 ❌ 💰                │
│                                         │
│ All Reactions:                          │
│                                         │
│ Positive:                               │
│ 😍 Love it  🎉 Excited  🔥 Amazing      │
│ 👍 Good     💯 Perfect   🚀 Let's go    │
│                                         │
│ Thinking:                               │
│ 🤔 Not sure 💡 Good idea ⭐ Priority    │
│                                         │
│ Concerns:                               │
│ ❌ Against   💰 Too $    ⏰ No time     │
│                                         │
│ [Close]                                 │
└─────────────────────────────────────────┘
```

---

### **9. Collaboration Points Screen**

```typescript
┌─────────────────────────────────────────┐
│ ← 🏆 Team Collaboration                 │
│ [Leaderboard] [My Stats] [Badges]       │
├─────────────────────────────────────────┤
│                                         │
│ 📊 Event: Sarah's Birthday Party        │
│ Team Level: 🔥 On Fire! (2,150 pts)    │
│                                         │
│ Progress to next level:                 │
│ ████████░░░░░░ 2,150 / 2,500           │
│ 350 pts to "Party Pro" 🎖️              │
│                                         │
│ 🥇 Top Collaborators:                   │
│                                         │
│ 1. 👤 Mike Rodriguez - 850 pts 🥇       │
│    • 12 tasks completed                 │
│    • 45 votes cast                      │
│    • 23 ideas contributed               │
│    • Badge: "Super Collaborator" 🎖️    │
│    [View Profile]                       │
│                                         │
│ 2. 👤 Sarah Johnson - 720 pts 🥈        │
│    • 15 decisions made                  │
│    • 6 vendors managed                  │
│    • Badge: "Host Hero" 👑             │
│    [View Profile]                       │
│                                         │
│ 3. 👤 Jessica Chen - 580 pts 🥉         │
│    • 8 tasks completed                  │
│    • 32 reactions given                 │
│    • Badge: "Early Adopter" 🚀         │
│    [View Profile]                       │
│                                         │
│ 4. You (David Kim) - 420 pts            │
│    • 5 tasks completed                  │
│    • 28 votes cast                      │
│    • Room to improve! 💪               │
│                                         │
│ 📈 Recent Points Activity:              │
│ • +50 pts: Completed "Invitations"      │
│ • +15 pts: Helpful comment on venue     │
│ • +10 pts: Contributed idea             │
│ • +5 pts: Voted in poll                 │
│                                         │
│ 🎖️ Available Badges:                   │
│ ☐ Quick Decider (Vote in 10 polls)     │
│ ☐ Idea Machine (20 ideas contributed)   │
│ ☑️ Team Player (Help 5 teammates)      │
│                                         │
│ [Earn More Points] [Team Stats]         │
└─────────────────────────────────────────┘
```

---

## 🎬 Complete User Flow Scenario

### **Scenario: Sarah's Team Decides on Food Menu**

---

### **ACT 1: Sarah Creates Poll (2 min)**

**Step 1:** Sarah in mind map, taps Food category

```
Mind Map → Food & Drinks → Main Course task
```

**Step 2:** Long-press on "Main Course" task

```
Quick Actions Menu appears:
[Edit] [Assign] [🗳️ Create Poll] [Start Debate]
```

**Step 3:** Taps "Create Poll"

```
Navigation: /events/[id]/planning/collaborate/polls/create

Create Poll Screen opens:
- Question: "What main course should we serve?"
- Adds options: Pizza, Tacos, Pasta
- Sets duration: 4 hours
- Enables: Auto-close at 70%, Show voters, Allow comments
- Links to: "Main Course" task
- Notifies: All team members
```

**Step 4:** Taps "Create Poll"

```
Poll published ✨
Push notifications sent to all 8 team members
Sarah returns to mind map
```

---

### **ACT 2: Team Members Vote (15 min)**

**Step 5:** Mike receives notification

```
📱 "Sarah created a poll: What main course?"
[View Poll]
```

**Step 6:** Mike taps notification

```
Navigation: /events/[id]/planning/collaborate/polls/[pollId]

Poll screen opens:
- Shows 3 options with 0 votes
- Mike reads options
```

**Step 7:** Mike votes for Pizza

```
Taps: ○ 🍕 Pizza Bar
Taps: [Vote]

Confirmation appears:
"✅ You voted for Pizza!"

Results update:
████░░░░░░░░ 1 vote (100%)
```

**Step 8:** Mike adds comment

```
Types: "Pizza is always a crowd pleaser!"
Adds: 😍 emoji
Posts comment

Live activity feed updates for everyone
```

**Step 9:** Jessica votes + comments

```
Jessica opens poll (sees Mike voted Pizza)
Votes: Pizza
Comments: "What about dietary needs? 🌱"

Results:
Pizza: ████████░░░░ 2 votes (100%)
```

**Step 10:** Sarah responds

```
Sarah sees Jessica's comment notification
Replies: "Good point! All options include vegan"
Jessica: 👍 reacts to reply

Poll discussion thread growing
```

**Step 11:** David votes Tacos

```
David: Votes Tacos
Comments: "Taco stations are interactive!"

Results:
Pizza: ████████░░░░ 2 votes (67%)
Tacos: ████░░░░░░░░ 1 vote (33%)
```

**Step 12:** Emily votes Pasta

```
Emily: Votes Pasta
No comment

Results:
Pizza: ██████░░░░░░ 2 votes (50%)
Tacos: ███░░░░░░░░░ 1 vote (25%)
Pasta: ███░░░░░░░░░ 1 vote (25%)
```

**Step 13:** Tom joins and votes

```
Tom (late joiner): Opens poll
Sees discussion about dietary needs
Votes: Pizza
Comments: "Plus kids love pizza!"

Results:
Pizza: ████████░░░░ 3 votes (60%)
Tacos: ██░░░░░░░░░░ 1 vote (20%)
Pasta: ██░░░░░░░░░░ 1 vote (20%)
```

---

### **ACT 3: Consensus Reached (5 min)**

**Step 14:** Lisa votes Pizza

```
Lisa: Votes Pizza

Results:
Pizza: ██████████░░ 4 votes (67%)
Tacos: ██░░░░░░░░░░ 1 vote (16%)
Pasta: ██░░░░░░░░░░ 1 vote (16%)

System message: "Almost at consensus! (Need 70%)"
```

**Step 15:** Alex (final voter) votes

```
Alex opens poll
Sees Pizza leading
Reads comments (positive about pizza)
Votes: Pizza

Results:
Pizza: ████████████ 5 votes (71%)
Tacos: ██░░░░░░░░░░ 1 vote (14%)
Pasta: ██░░░░░░░░░░ 1 vote (14%)

🎉 CONSENSUS REACHED! (71% > 70%)
```

**Step 16:** Poll auto-closes

```
✨ Poll closed automatically!

Winner: 🍕 Pizza Bar (71% consensus)

Notifications sent to all:
"Poll closed: Pizza chosen by team!"
```

**Step 17:** Task auto-updates

```
Mind Map automatic changes:

BEFORE:
📋 Main Course
   Not decided • Not assigned

AFTER:
🍕 Main Course: Pizza Bar
   ✅ Team decision (71% consensus)
   📋 Status: Not started
   💰 Budget: $15/person = $750 total
   
   [Assign to someone] [Find vendor]
```

**Step 18:** Activity feed logs everything

```
📡 Live Activity:

✅ Decision made: Main Course
   Team chose: 🍕 Pizza Bar
   Final vote: 5-1-1 (71% consensus)
   Participants: 7/8 team members
   
   [View Poll Results] [View Task]
```

---

### **ACT 4: Follow-Up Collaboration (10 min)**

**Step 19:** Sarah creates quick follow-up

```
Sarah sees consensus reached
Taps: [Quick Vote] on task

Quick Consensus appears:
"Should we add gluten-free pizza option?"

[👍 Yes] [👎 No] [🤷 Don't Care]
```

**Step 20:** Team responds instantly

```
Within 2 minutes:
👍 Yes: 6 votes (75%)
👎 No: 0 votes
🤷 Don't Care: 2 votes (25%)

✨ Consensus reached!
"Gluten-free option" added to task notes
```

**Step 21:** Sarah finds vendor

```
Sarah: [Find Vendor] button on task

Navigation: /vendor/marketplace?category=catering

Browses pizza caterers
Sends quote request to "Mario's Pizza"
```

**Step 22:** Team sees activity

```
Live feed updates:
"Sarah requested quote from Mario's Pizza"
"Estimated $750 for 50 people"

Mike: 😍 reacts
Jessica: 💬 "Mario's is great!"
```

---

### **ACT 5: Points & Gamification (Background)**

**Throughout the process, points awarded:**

```
Sarah:
+10 pts: Created poll
+15 pts: Helpful comment
+5 pts: Finding vendor
= 30 pts

Mike:
+5 pts: Voted
+15 pts: Helpful comment  
+10 pts: Early response bonus
= 30 pts

Jessica:
+5 pts: Voted
+15 pts: Important question (dietary)
= 20 pts

Everyone who voted:
+5 pts each

Team total: +85 pts
Progress bar updates: 2,065 → 2,150 pts
```

**Badges earned:**

```
Sarah: "Decision Maker" 🎯 (Created 5 polls)
Mike: "Quick Responder" ⚡ (Voted within 1 min)
Jessica: "Team Player" 🤝 (Asked important question)
```

---

## 📊 Timeline Visualization

```
┌─────────────────────────────────────────┐
│ Event Timeline: Food Decision           │
├─────────────────────────────────────────┤
│                                         │
│ 0:00 ──► Sarah creates poll             │
│          📢 Notifications sent          │
│                                         │
│ 0:02 ──► Mike votes Pizza               │
│          💬 Comments "crowd pleaser"    │
│                                         │
│ 0:05 ──► Jessica votes Pizza            │
│          💬 Asks about dietary needs    │
│                                         │
│ 0:08 ──► Sarah replies to Jessica       │
│          Clarifies vegan options        │
│                                         │
│ 0:12 ──► David votes Tacos              │
│ 0:15 ──► Emily votes Pasta              │
│                                         │
│ 0:18 ──► Tom votes Pizza                │
│          Close to consensus!            │
│                                         │
│ 0:20 ──► Lisa votes Pizza (67%)         │
│          "Almost there!" notification   │
│                                         │
│ 0:22 ──► Alex votes Pizza (71%)         │
│          ✨ CONSENSUS REACHED!          │
│          🎉 Poll auto-closes            │
│          📋 Task auto-updates           │
│          📢 Everyone notified           │
│                                         │
│ 0:25 ──► Sarah quick vote: gluten-free  │
│          Team responds: 75% yes         │
│          ✨ Quick consensus!            │
│                                         │
│ 0:30 ──► Sarah finds vendor             │
│          Quote request sent             │
│          Team reacts positively         │
│                                         │
│ Total time: 30 minutes                  │
│ Team engagement: 88% (7/8 voted)        │
│ Consensus: 71% (auto-closed)            │
│ Follow-up: Instant (gluten-free)        │
│ Vendor: Found & contacted               │
│                                         │
│ ✅ Decision made efficiently!           │
└─────────────────────────────────────────┘
```

---

## 🎯 Key Interactions Summary

### **User Actions:**

1. **Create poll** - Long-press task → Create Poll
2. **Vote** - Tap option → Vote button
3. **Comment** - Type → Post
4. **React** - Long-press → Pick emoji
5. **Quick vote** - Tap Yes/No/Maybe
6. **View results** - Tap poll card
7. **See activity** - Pull to refresh feed
8. **Earn points** - Automatic for all actions

### **System Actions:**

1. **Send notifications** - Push to all team members
2. **Update live** - Real-time vote counting
3. **Auto-close** - At 70% consensus
4. **Update task** - Link decision to task
5. **Log activity** - Every action recorded
6. **Award points** - Gamification tracking
7. **Show presence** - Who's online/active
8. **Detect sentiment** - AI analysis

### **Collaborative Features:**

1. **Transparency** - See who voted what
2. **Discussion** - Comment threads
3. **Reactions** - Emoji responses
4. **Consensus** - Automatic detection
5. **Speed** - Quick decisions (30 min)
6. **Engagement** - 88% participation
7. **Follow-through** - Task auto-updates
8. **Fun** - Points, badges, gamification

---

## 🚀 Next Steps

**Phase 1: Build Core (Week 1-2)**
- Polling system
- Voting UI
- Live results
- Basic activity feed

**Phase 2: Add Debates (Week 3-4)**
- Debate mode
- Pro/con interface
- Scoring system

**Phase 3: Brainstorm (Week 5-6)**
- Sticky note canvas
- Live collaboration
- Idea management

**Phase 4: Gamification (Week 7-8)**
- Points system
- Badges
- Leaderboards

---

**Total Screens:** 9 main screens + components  
**Development Time:** 8 weeks  
**Team Engagement:** Expected 90%+ participation  
**Decision Speed:** 10x faster than traditional planning  

**This creates the most collaborative event planning experience ever!** 🎉
