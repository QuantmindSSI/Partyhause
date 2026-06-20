# AI Event Planning Assistant
## Conversational AI with UI Rendering for PartyHaus

---

## Overview

The AI Event Planning Assistant transforms PartyHaus from a tool into a **collaborative planning partner**. Users chat naturally with the AI, which understands context, suggests ideas, and **dynamically renders UI components** directly in the chat interface for immediate action.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Planning Assistant                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐    ┌──────────────┐    ┌────────────────┐  │
│  │   Chat UI   │◄──►│  AI Engine   │◄──►│  UI Renderer   │  │
│  │  (React)    │    │ (OpenAI/     │    │  (Component    │  │
│  │             │    │  Anthropic)  │    │   Registry)    │  │
│  └─────────────┘    └──────────────┘    └────────────────┘  │
│         ▲                   ▲                   ▲           │
│         │                   │                   │           │
│         └───────────────────┴───────────────────┘           │
│                         │                                   │
│                    ┌────┴────┐                              │
│                    │ Context │                              │
│                    │ Manager │                              │
│                    └─────────┘                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Features

### 1. Conversational Event Planning Chat

```typescript
// @/Users/startferanmi/partyhause/Partyhause/src/features/ai-planner/types.ts

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  uiComponents?: UIComponent[]; // Embedded interactive components
  suggestions?: string[]; // Quick reply suggestions
  actions?: ChatAction[]; // One-click actions
}

export interface UIComponent {
  type: 'timeline-block' | 'guest-segment' | 'poll' | 'theme-preview' | 'vendor-card' | 'budget-item' | 'checklist-item';
  props: Record<string, any>;
  editable: boolean;
  onConfirm?: (data: any) => void;
  onEdit?: (data: any) => void;
}

export interface ChatAction {
  id: string;
  label: string;
  icon: string;
  action: 'add_to_timeline' | 'create_poll' | 'send_invite' | 'book_vendor' | 'save_theme' | 'share_idea';
  payload?: any;
}
```

### 2. Context-Aware Intelligence

```typescript
// @/Users/startferanmi/partyhause/Partyhause/src/features/ai-planner/ContextManager.ts

export class PlanningContextManager {
  private context: PlanningContext = {
    // User's current event (if any)
    currentEvent: null,
    
    // User's planning history
    pastEvents: [],
    
    // User preferences learned over time
    userPreferences: {
      preferredThemes: [],
      likedVendors: [],
      budgetRange: null,
      partyStyle: null,
      guestManagementStyle: null,
    },
    
    // Current planning session state
    sessionState: {
      stage: 'brainstorming' | 'planning' | 'finalizing' | 'ready',
      confirmedDetails: {},
      openQuestions: [],
      suggestedIdeas: [],
    },
    
    // PartyCrew context
    crewContext: {
      crewMembers: [],
      crewPreferences: {},
      pastCrewEvents: [],
    }
  };

  // Build rich context for AI prompts
  buildSystemPrompt(): string {
    return `
You are PartyHaus AI, an expert event planning assistant.

CURRENT EVENT CONTEXT:
${this.formatEventContext()}

USER PREFERENCES (learned from ${this.context.pastEvents.length} past events):
${this.formatUserPreferences()}

PARTYCREW CONTEXT:
${this.formatCrewContext()}

YOUR CAPABILITIES:
1. Suggest creative event themes and ideas
2. Build timelines with specific activities
3. Recommend vendors from the marketplace
4. Create polls for group decisions
5. Generate guest segments and invitations
6. Estimate budgets and suggest cost-saving tips
7. Render interactive UI components for immediate action

RULES:
- Always be enthusiastic and creative
- Suggest specific, actionable ideas (not generic advice)
- When suggesting something concrete, RENDER A UI COMPONENT
- Learn from user feedback and preferences
- Consider PartyCrew dynamics when planning
- Suggest themes that match the user's past style
    `;
  }
}
```

---

## UI Rendering System

### Component Registry

```typescript
// @/Users/startferanmi/partyhause/Partyhause/src/features/ai-planner/components/ComponentRegistry.tsx

import { TimelineBlockPreview } from './ui-components/TimelineBlockPreview';
import { VendorRecommendationCard } from './ui-components/VendorRecommendationCard';
import { ThemeConceptCard } from './ui-components/ThemeConceptCard';
import { PollCreator } from './ui-components/PollCreator';
import { GuestSegmentPreview } from './ui-components/GuestSegmentPreview';
import { BudgetEstimator } from './ui-components/BudgetEstimator';
import { ChecklistItem } from './ui-components/ChecklistItem';

export const COMPONENT_REGISTRY = {
  'timeline-block': TimelineBlockPreview,
  'vendor-card': VendorRecommendationCard,
  'theme-preview': ThemeConceptCard,
  'poll-creator': PollCreator,
  'guest-segment': GuestSegmentPreview,
  'budget-item': BudgetEstimator,
  'checklist-item': ChecklistItem,
};

// AI returns JSON that gets rendered as React components
export interface AIComponentResponse {
  component: keyof typeof COMPONENT_REGISTRY;
  props: any;
  actions: {
    confirm: { label: string; action: string };
    edit: { label: string };
    dismiss: { label: string };
  };
}
```

### Example: Timeline Block Component

```typescript
// @/Users/startferanmi/partyhause/Partyhause/src/features/ai-planner/components/ui-components/TimelineBlockPreview.tsx

import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Users } from 'lucide-react';

interface TimelineBlockPreviewProps {
  label: string;
  description: string;
  startTime: string;
  duration: number;
  type: string;
  suggestedVendors?: { name: string; category: string }[];
  guestVisible: boolean;
  onConfirm: () => void;
  onEdit: () => void;
  onDismiss: () => void;
}

export function TimelineBlockPreview(props: TimelineBlockPreviewProps) {
  return (
    <Card className="ai-rendered-component border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">
            {props.type === 'meal' && '🍽️'}
            {props.type === 'activity' && '🎮'}
            {props.type === 'speech' && '🎤'}
            {props.type === 'performance' && '🎭'}
          </span>
          <div>
            <h4 className="font-semibold">{props.label}</h4>
            <p className="text-sm text-muted-foreground">AI Suggested</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <p className="text-sm">{props.description}</p>
        
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {props.startTime} ({props.duration} min)
          </span>
          {props.guestVisible && (
            <span className="flex items-center gap-1 text-green-600">
              <Users className="h-4 w-4" />
              Guests see this
            </span>
          )}
        </div>
        
        {props.suggestedVendors && props.suggestedVendors.length > 0 && (
          <div className="bg-muted p-2 rounded-lg">
            <p className="text-xs font-medium mb-1">Suggested vendors:</p>
            <div className="flex gap-2 flex-wrap">
              {props.suggestedVendors.map((vendor, i) => (
                <span key={i} className="text-xs bg-primary/10 px-2 py-1 rounded">
                  {vendor.name} ({vendor.category})
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="gap-2">
        <Button onClick={props.onConfirm} className="flex-1">
          Add to Timeline
        </Button>
        <Button variant="outline" onClick={props.onEdit}>
          Edit
        </Button>
        <Button variant="ghost" onClick={props.onDismiss}>
          Skip
        </Button>
      </CardFooter>
    </Card>
  );
}
```

---

## AI Prompt Engineering

### Structured Output Format

```typescript
// The AI returns structured JSON that gets parsed and rendered

interface AIResponse {
  message: string; // Natural language response
  components?: AIComponentResponse[]; // UI components to render
  suggestions?: string[]; // Quick reply chips
  contextUpdates?: Partial<PlanningContext>; // Update session state
  actions?: ChatAction[]; // One-click actions
}

// Example AI Response:
const exampleResponse: AIResponse = {
  message: "I love the 'Retro Arcade Night' concept! Here's a suggested timeline block for a vintage gaming tournament that would fit perfectly with your 90s theme.",
  
  components: [
    {
      component: 'timeline-block',
      props: {
        label: "Retro Gaming Tournament",
        description: "Classic arcade games competition - Street Fighter II, Pac-Man, and pinball. Winner gets a vintage prize!",
        startTime: "20:00",
        duration: 60,
        type: "activity",
        guestVisible: true,
        suggestedVendors: [
          { name: "RetroArcade Rentals", category: "Entertainment" }
        ]
      },
      actions: {
        confirm: { label: "Add to Timeline", action: "ADD_TIMELINE_BLOCK" },
        edit: { label: "Customize" },
        dismiss: { label: "Not for me" }
      }
    },
    {
      component: 'vendor-card',
      props: {
        name: "RetroArcade Rentals",
        category: "Entertainment",
        rating: 4.8,
        priceRange: "$$",
        image: "/vendors/retroarcade.jpg",
        description: "Authentic arcade machines from the 80s and 90s",
        available: true
      },
      actions: {
        confirm: { label: "Contact Vendor", action: "CONTACT_VENDOR" },
        edit: { label: "View Details" },
        dismiss: { label: "Dismiss" }
      }
    }
  ],
  
  suggestions: [
    "Add more arcade games",
    "Suggest prizes for winners",
    "Create a costume contest",
    "What about 90s snacks?"
  ],
  
  actions: [
    {
      id: "create-poll",
      label: "Ask crew about game preferences",
      icon: "poll",
      action: "create_poll",
      payload: { question: "Which retro games should we have?", options: ["Street Fighter", "Pac-Man", "Pinball", "Dance Dance Revolution"] }
    }
  ],
  
  contextUpdates: {
    sessionState: {
      suggestedIdeas: [...currentIdeas, "Retro Gaming Tournament"]
    }
  }
};
```

---

## Feature: Event Expounding/Expansion

### Concept Development Flow

```
User: "I want to throw a birthday party"
    ↓
AI: "What vibe are you going for? Here are some popular themes based on your PartyCrew's preferences:"
    ↓
[Renders Theme Cards with PartyCrew voting data]
    ↓
User: "Retro 90s arcade sounds fun"
    ↓
AI: "🎮 EXCELLENT CHOICE! Let me expand this into a full 'Retro Arcade Night' concept..."
    ↓
[Renders Full Event Concept with multiple components]
```

### Event Concept Card

```typescript
// @/Users/startferanmi/partyhause/Partyhause/src/features/ai-planner/components/ui-components/EventConceptCard.tsx

interface EventConcept {
  title: string;
  theme: string;
  tagline: string;
  description: string;
  vibe: {
    music: string[];
    decor: string[];
    dressCode: string;
    colors: string[];
  };
  activities: {
    name: string;
    description: string;
    duration: number;
  }[];
  foodAndDrink: {
    menuTheme: string;
    signatureCocktails: { name: description: string }[];
    foodStations: string[];
  };
  photoOps: string[];
  suggestedVendors: Vendor[];
  estimatedBudget: {
    min: number;
    max: number;
    breakdown: Record<string, number>;
  };
  timeline: TimelineBlock[];
}

export function EventConceptCard({ concept, onUseConcept, onCustomize }: { 
  concept: EventConcept;
  onUseConcept: () => void;
  onCustomize: () => void;
}) {
  return (
    <Card className="event-concept-card">
      <CardHeader className="concept-header" style={{ background: `linear-gradient(135deg, ${concept.vibe.colors[0]}, ${concept.vibe.colors[1]})` }}>
        <h2 className="text-3xl font-bold text-white">{concept.title}</h2>
        <p className="text-white/90 text-lg">{concept.tagline}</p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Theme Description */}
        <p className="text-lg">{concept.description}</p>
        
        {/* Vibe Section */}
        <div className="vibe-section">
          <h3 className="font-semibold mb-2">The Vibe</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Music</span>
              <p>{concept.vibe.music.join(" • ")}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Dress Code</span>
              <p>{concept.vibe.dressCode}</p>
            </div>
          </div>
        </div>
        
        {/* Activities Preview */}
        <div className="activities-preview">
          <h3 className="font-semibold mb-2">🎮 Featured Activities</h3>
          <div className="space-y-2">
            {concept.activities.slice(0, 3).map((activity, i) => (
              <div key={i} className="flex justify-between items-center p-2 bg-muted rounded">
                <span>{activity.name}</span>
                <span className="text-sm text-muted-foreground">{activity.duration} min</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Signature Elements */}
        <div className="signatures">
          <h3 className="font-semibold mb-2">🍹 Signature Elements</h3>
          <div className="flex gap-2 flex-wrap">
            {concept.foodAndDrink.signatureCocktails.map((cocktail, i) => (
              <Badge key={i} variant="secondary">{cocktail.name}</Badge>
            ))}
          </div>
        </div>
        
        {/* Budget Estimate */}
        <div className="budget-estimate">
          <h3 className="font-semibold mb-2">💰 Estimated Budget</h3>
          <p className="text-2xl font-bold text-primary">
            ${concept.estimatedBudget.min.toLocaleString()} - ${concept.estimatedBudget.max.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">Based on 50 guests</p>
        </div>
      </CardContent>
      
      <CardFooter className="gap-2">
        <Button onClick={onUseConcept} className="flex-1" size="lg">
          <Sparkles className="mr-2 h-4 w-4" />
          Use This Concept
        </Button>
        <Button variant="outline" onClick={onCustomize}>
          Customize
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### AI Expounding Prompt

```typescript
// System prompt for event concept generation

const EXPound_SYSTEM_PROMPT = `
You are PartyHaus's Creative Director - an expert at transforming simple ideas into unforgettable event experiences.

When a user gives you a basic concept (like "90s arcade birthday"), you MUST:

1. CREATE A FULL EVENT CONCEPT including:
   - Catchy title and tagline
   - Rich thematic description
   - Complete vibe (music, decor, dress code, color palette)
   - 5-7 themed activities with timing
   - Signature food/drink menu with creative names
   - Photo opportunity spots
   - Curated vendor recommendations
   - Estimated budget breakdown
   - Suggested timeline

2. RENDER THESE UI COMPONENTS:
   - EventConceptCard (the full vision)
   - 2-3 TimelineBlockPreviews (key activities)
   - 1-2 VendorRecommendationCards
   - BudgetEstimator

3. CONSIDER PARTYCREW CONTEXT:
   - Reference crew members' past preferences
   - Suggest crew-specific activities
   - Note if certain crew members would love/hate elements

4. BE SPECIFIC, NOT GENERIC:
   - "Neon-lit cocktail called 'Power Up Punch' with glow sticks" 
   - NOT "Themed drinks"
   
   - "Street Fighter II tournament with vintage joystick controllers"
   - NOT "Arcade games"

5. SUGGEST SURPRISE MOMENTS:
   - What unexpected delight will guests remember?
   - How can we exceed expectations?

Always return structured JSON that renders the full concept.
`;
```

---

## Feature: Interactive Planning Modes

### 1. Brainstorm Mode

```typescript
// Free-form idea generation

interface BrainstormMode {
  type: 'brainstorm';
  features: {
    // AI asks clarifying questions
    clarifyingQuestions: string[];
    
    // Suggests wild, creative ideas
    wildIdeas: string[];
    
    // Shows similar past events from PartyCrew
    crewInspiration: Event[];
    
    // Mood board generation
    generateMoodBoard: (theme: string) => Promise<MoodBoard>;
  };
}
```

### 2. Guided Planning Mode

```typescript
// Structured step-by-step planning

interface GuidedPlanningMode {
  type: 'guided';
  steps: [
    {
      id: 'basics';
      title: 'Event Basics';
      questions: ['What occasion?', 'How many guests?', 'Indoor or outdoor?'];
      required: true;
    },
    {
      id: 'vibe';
      title: 'Set the Vibe';
      questions: ['Energy level?', 'Theme ideas?', 'Music preferences?'];
      uiComponents: ['mood-selector', 'theme-gallery'];
    },
    {
      id: 'activities';
      title: 'Plan Activities';
      aiAction: 'GENERATE_TIMELINE';
      uiComponents: ['timeline-preview'];
    },
    {
      id: 'food';
      title: 'Food & Drink';
      questions: ['Catering style?', 'Dietary needs?', 'Signature drink?'];
      uiComponents: ['menu-builder'];
    },
    {
      id: 'finalize';
      title: 'Ready to Party!';
      aiAction: 'GENERATE_FULL_PLAN';
      uiComponents: ['event-summary', 'action-checklist'];
    }
  ];
}
```

### 3. Quick Plan Mode

```typescript
// One-shot planning for simple events

interface QuickPlanMode {
  type: 'quick';
  prompt: string; // "Throw together a casual game night for 8 people this Friday"
  
  aiAction: 'GENERATE_COMPLETE_EVENT';
  
  output: {
    event: Event;
    timeline: TimelineBlock[];
    suggestedVendors: Vendor[];
    guestList: Guest[]; // Suggests crew members
    invites: InviteTemplate;
    checklist: ChecklistItem[];
  };
  
  renderComponents: [
    'event-summary',
    'timeline-preview',
    'quick-actions'
  ];
}
```

---

## Integration with Existing PartyHaus Features

### PartyCrew Integration

```typescript
// AI considers crew dynamics

interface CrewAwarePlanning {
  // AI knows:
  // - Who's in the crew
  // - Their past event preferences
  // - Who they enjoy hanging out with
  // - Their availability patterns
  
  suggestGuestList: (crewId: string) => {
    definitelyInvite: CrewMember[]; // Core crew
    probablyInvite: CrewMember[];   // Active members
    considerInviting: CrewMember[]; // Less active
    conflicts: { member: CrewMember; reason: string }[];
  };
  
  suggestGroupActivities: (crewId: string) => {
    // Based on crew's favorite past activities
    // Considers group dynamics (introverts vs extroverts)
    // Suggests icebreakers if new members joining
  };
}
```

### Timeline Integration

```typescript
// AI-generated timeline blocks are immediately actionable

interface TimelineIntegration {
  // When user confirms AI-suggested block:
  onConfirmTimelineBlock: (block: TimelineBlock) => {
    // 1. Add to event timeline
    timelineService.addBlock(eventId, block);
    
    // 2. If vendors suggested, pre-populate vendor contact
    if (block.suggestedVendors) {
      vendorService.createInquiry(block.suggestedVendors[0], eventId);
    }
    
    // 3. Update AI context
    contextManager.addConfirmedDetail('timeline', block);
    
    // 4. Suggest next logical blocks
    aiEngine.suggestFollowUpBlocks(block);
  };
}
```

---

## Implementation Phases

### Phase 1: Basic Chat (2 weeks)

```typescript
// Core infrastructure
- Chat UI component
- OpenAI/Anthropic integration
- Basic context management
- Simple text responses
- Quick reply suggestions
```

### Phase 2: UI Rendering (2 weeks)

```typescript
// Component system
- Component registry
- TimelineBlockPreview
- VendorRecommendationCard
- ThemeConceptCard
- JSON schema validation for AI output
- Error handling for malformed responses
```

### Phase 3: Event Expounding (2 weeks)

```typescript
// Full concept generation
- EventConceptCard
- Multi-component responses
- Theme development prompts
- Budget estimation
- Vendor matching
- Mood board generation
```

### Phase 4: Deep Integration (2 weeks)

```typescript
// Connect to PartyHaus features
- PartyCrew context awareness
- Timeline integration
- Vendor marketplace connection
- Poll creation
- Guest segment suggestions
- Learning from user feedback
```

### Phase 5: Advanced Modes (2 weeks)

```typescript
// Specialized planning modes
- Brainstorm mode
- Guided planning wizard
- Quick plan one-shot
- Template customization AI
- Historical event learning
```

---

## API Design

```typescript
// @/Users/startferanmi/partyhause/Partyhause/api/ai-planner.ts

// Edge function for AI processing
export async function POST(request: Request) {
  const { messages, context, mode } = await request.json();
  
  // Build system prompt with context
  const systemPrompt = buildSystemPrompt(context);
  
  // Call AI provider
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
    },
    body: JSON.stringify({
      model: 'claude-3-opus-20240229',
      max_tokens: 4096,
      system: systemPrompt,
      messages: messages,
      tools: [
        {
          name: 'render_timeline_block',
          description: 'Render a timeline block component',
          input_schema: { /* schema */ }
        },
        {
          name: 'render_vendor_card',
          description: 'Render a vendor recommendation card',
          input_schema: { /* schema */ }
        },
        {
          name: 'render_event_concept',
          description: 'Render a full event concept card',
          input_schema: { /* schema */ }
        }
      ]
    })
  });
  
  const aiResponse = await response.json();
  
  // Parse and validate structured output
  const parsedResponse = parseAIResponse(aiResponse);
  
  return Response.json(parsedResponse);
}
```

---

## Example User Flows

### Flow 1: Complete Event from Scratch

```
User: "I need to plan something special for my wife's 40th"
AI: "What a milestone! 40th birthdays deserve something unforgettable. What's her style?"
    [Suggestions: "She loves surprises", "She's more low-key", "She loves dancing"]

User: "She loves 90s R&B and surprise parties"
AI: [Renders EventConceptCard: "Surprise '90s R&B Rewind"]
    "I created '90s R&B Rewind' - a surprise party with:
    • Secret venue reveal
    • Live R&B tribute band
    • 'Slow Jam' karaoke contest
    • Butterfly clips and denim dress code
    • 'Poison' signature cocktail"

User: "This is perfect! But can we add a photo booth?"
AI: [Renders TimelineBlockPreview: "Throwback Photo Booth"]
    "Added! 90s props included - oversized glasses, bucket hats, inflatable furniture. 
    I found 3 photo booth vendors with 90s packages:"
    [Renders 3 VendorCards]

User: "Book the second one"
AI: [Creates vendor inquiry]
    "Great choice! Golden Moments has been notified. Here's your updated timeline:"
    [Renders full timeline with new block]
```

### Flow 2: Expand Existing Event

```
User: "My 'Casual Game Night' feels too basic"
AI: "Let's transform it! What if we made it 'Board Game Cafe Night'?
    I'll add atmosphere:"
    
    [Renders EventConceptCard with expansion ideas]
    • Coffee shop ambiance (rent espresso machine)
    • Barista competition between guests
    • Tournament brackets with prizes
    • Late-night menu (sliders, loaded fries)
    • Cozy seating areas with blankets
    
User: "I love the tournament idea"
AI: [Renders PollCreator]
    "Let's ask your crew which games to feature!"

[User creates poll, results come in]

AI: "Catan won! Here's your tournament-ready timeline:"
    [Renders updated timeline with tournament structure]
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| AI chat engagement | 60% of hosts use it | Chat sessions / Total events |
| Component confirmation rate | 70% | Confirmed components / Rendered |
| Concept adoption rate | 40% | Events using AI concepts / Total |
| Planning time reduction | 50% | Time with AI vs without |
| User satisfaction | 4.5/5 | Post-planning survey |
| PartyCrew integration | 80% mention crew context | AI responses referencing crew |

---

## Next Steps

1. **Choose AI Provider**: Anthropic (Claude 3 Opus) recommended for complex reasoning
2. **Set up edge function**: `/api/ai-planner` with streaming responses
3. **Build component library**: Start with 5 core components
4. **Design prompts**: Create system prompts for each mode
5. **Integrate context**: Connect PartyCrew and event data
6. **Test with users**: Beta with 10-20 hosts

---

*Document Version: 1.0*
*Ready for Implementation*
