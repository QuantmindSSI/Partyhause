# Unified Poll Component - UX Design Document

## Overview
The PartyHub now features a **unified Poll component** that combines quick voting and discussion capabilities in a single, intuitive interface.

## Problem Statement
**Before:** Users had to choose between:
- **Polls** - For simple voting
- **Debates** - For discussions with arguments

This created:
- Decision paralysis (which one to use?)
- Navigation overhead (switching between features)
- Cognitive load (understanding two similar features)
- Maintenance burden (2 components doing similar things)

## Solution: Unified Poll with Discussion Mode

### Two Modes, One Component

#### **Quick Vote Mode** (Default)
Perfect for simple, fast decisions:
- "What time should we meet?"
- "Pizza or tacos?"
- "Indoor or outdoor venue?"

**Features:**
- Radio buttons (single choice) or checkboxes (multiple choice)
- Real-time vote counts and percentages
- Progress bars with color coding
- Consensus detection (auto-close when threshold reached)
- Time remaining countdown
- Simple and fast

#### **Discussion Mode** (Optional Upgrade)
When you need deeper exploration:
- Toggle on when poll needs arguments/reasoning
- Adds For/Against sections
- Users can add points with voting
- Shows score comparison
- Resolution field when decided

**Use Cases:**
- Venue selection with pros/cons
- Activity planning with trade-offs
- Budget discussions
- Any decision needing context

## User Flow

```
Create Poll
    ↓
Quick Vote (default)
    ↓
[Optional] Enable Discussion
    ↓
Vote + Add Arguments
    ↓
Reach Consensus or Resolution
    ↓
Close Poll
```

## Key Benefits

### 1. **Natural Progression**
Start simple, add complexity only when needed:
```
Quick Vote → (if needed) → Enable Discussion → (when done) → Resolution
```

### 2. **One Mental Model**
Users learn ONE tool for all collaborative decisions:
- "Need a quick vote? → Poll"
- "Need discussion? → Poll with discussion on"

### 3. **Fewer Buttons**
Before: "Create Poll" | "Create Debate" | "Create Idea"
After: "Create Poll" | "Create Idea"

### 4. **Better Discoverability**
Users discover discussion mode organically through the toggle button, rather than needing to know about a separate "Debate" feature.

### 5. **Simpler Codebase**
- 2 components instead of 3
- ~450 lines of code eliminated
- Easier testing and maintenance
- Single component to update for improvements

## Component Interface

```typescript
interface PollStickyProps {
  data: PollStickyData;
  stickyId: string;
  currentUserId: string;
  
  // Quick vote
  onVote?: (stickyId: string, optionId: string) => void;
  
  // Discussion mode
  onVotePoint?: (stickyId: string, pointId: string, side: 'for' | 'against') => void;
  onAddPoint?: (stickyId: string, side: 'for' | 'against') => void;
  
  // Mode switching
  onToggleMode?: (stickyId: string) => void;
  
  // Common
  onComment?: (stickyId: string) => void;
  isInteractive?: boolean;
}
```

## Data Structure

```typescript
interface PollStickyData {
  question: string;
  description?: string;
  poll_type: 'single-choice' | 'multiple-choice' | 'ranking';
  
  // Quick Vote (always present)
  options: PollOption[];
  status: 'active' | 'closed' | 'consensus-reached';
  total_votes: number;
  total_voters: number;
  ends_at?: string;
  auto_close_on_consensus: boolean;
  consensus_threshold: number;
  
  // Discussion Mode (optional)
  discussion_mode?: boolean;
  allow_arguments?: boolean;
  positions?: {
    for: DebatePoint[];
    against: DebatePoint[];
    neutral?: DebatePoint[];
  };
  for_score?: number;
  against_score?: number;
  resolution?: string;
}
```

## UI States

### State 1: Quick Vote (Active)
```
┌─────────────────────────────────┐
│ 📊 POLL              [Live 🔴] │
├─────────────────────────────────┤
│ What time should we meet?        │
│                                  │
│ ○ 6:00 PM         45% ████████  │
│ ● 7:00 PM         55% ██████████│ ← User voted
│                                  │
│ 👥 12 voters · ⏰ 2h 15m        │
│                        [💬]      │
└─────────────────────────────────┘
```

### State 2: Discussion Mode (Active)
```
┌─────────────────────────────────┐
│ 💬 POLL · DISCUSSION  [Live 🔴]│
├─────────────────────────────────┤
│ Indoor vs Outdoor venue?         │
│ Let's weigh the options          │
│                                  │
│ FOR: 15  ████████  AGAINST: 10  │
│                                  │
│ 👍 FOR (5 points)          [▼]  │
│ • Weather-proof            ↑ 8  │
│ • AC available             ↑ 4  │
│ • Easier setup             ↑ 3  │
│      [+ Add point]               │
│                                  │
│ 👎 AGAINST (4 points)      [▼]  │
│ • Less scenic              ↑ 6  │
│ • Smaller space            ↑ 4  │
│      [+ Add point]               │
│                                  │
│ 💬 25 points                [💬]│
└─────────────────────────────────┘
```

### State 3: Consensus Reached
```
┌─────────────────────────────────┐
│ 📊 POLL         [✓ Consensus]   │
├─────────────────────────────────┤
│ What time should we meet?        │
│                                  │
│ ○ 6:00 PM         15% ███       │
│ ● 7:00 PM         85% █████████ │
│                                  │
│ ✓ Consensus reached at 80%      │
│                                  │
│ 👥 20 voters                [💬]│
└─────────────────────────────────┘
```

## Creation Flow

### Modal: Create Poll

```
┌──────────────────────────────────┐
│ Create Poll                  [×] │
├──────────────────────────────────┤
│                                  │
│ Question *                       │
│ ┌──────────────────────────────┐│
│ │ What's your preference?      ││
│ └──────────────────────────────┘│
│                                  │
│ Options *                        │
│ ┌──────────────────────────────┐│
│ │ 1. Option A              [×] ││
│ │ 2. Option B              [×] ││
│ └──────────────────────────────┘│
│ [+ Add option]                   │
│                                  │
│ Poll Type                        │
│ ● Single choice                  │
│ ○ Multiple choice                │
│                                  │
│ ☐ Enable discussion mode         │← NEW TOGGLE
│   Allow participants to add      │
│   arguments for/against options  │
│                                  │
│ ☐ Auto-close on consensus (80%) │
│                                  │
│ Duration: 24 hours [▼]          │
│                                  │
│         [Cancel]  [Create Poll]  │
└──────────────────────────────────┘
```

## Implementation Status

✅ **Completed:**
- Unified PollStickyData interface
- PollSticky component with both modes
- Type guards and helpers
- Mode toggle functionality
- Documentation updated
- TypeScript: 0 errors

⏭️ **Next Steps:**
1. Update PartyBoard to render unified polls
2. Create CreatePollModal with discussion toggle
3. Implement Supabase operations
4. Add real-time sync
5. User testing

## Metrics for Success

1. **Adoption Rate:** % of users who create polls vs old separate features
2. **Mode Upgrade:** % of quick votes that upgrade to discussion mode
3. **Confusion Reduction:** Support tickets about "poll vs debate"
4. **Time to Decision:** Faster consensus reaching with inline discussions

## Conclusion

The unified Poll component provides:
- **Simpler UX** - One tool, multiple capabilities
- **Natural progression** - Start simple, add complexity as needed
- **Better discoverability** - Features revealed contextually
- **Cleaner codebase** - Fewer components, easier maintenance
- **Faster decisions** - Everything in one place

This is the right architecture for collaborative decision-making! 🎉

---

**Document Version:** 1.0  
**Last Updated:** October 27, 2025  
**Author:** GitHub Copilot Assistant
