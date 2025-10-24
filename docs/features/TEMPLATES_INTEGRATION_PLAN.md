# 🎨 Event Templates Integration Plan

**Version:** 1.0  
**Date:** October 21, 2025  
**Status:** Planning → Implementation  
**Priority:** High  
**Timeline:** 3-4 sprints (6-8 weeks)

---

## 📋 Executive Summary

Add an event templates system that allows users to **pick ready-made event experiences** and customize them to their needs. This reduces activation friction, speeds time-to-first-event, increases feature discovery, and opens new revenue streams through premium templates.

**Core Value Prop:** "Create your event in 3 minutes instead of 30."

---

## 🎯 Goals & Success Metrics

### Business Goals
- Reduce time-to-first-event by 60% (from ~10 min to ~4 min)
- Increase free-to-paid conversion by 2-3% (premium templates)
- Improve feature adoption (games, polls, budgets) by 40%
- Enable future marketplace for user-created templates

### Key Metrics
- **Activation:** % of signups using templates (target: 70%)
- **Conversion:** Template picked → Event created (target: 85%)
- **Speed:** Median time-to-first-invite for template users (target: <5 min)
- **Engagement:** Feature usage rate for template-recommended features (target: 60%)
- **Revenue:** Premium template purchases (target: 10% of template users)

---

## 🗺️ User Flow Integration

### Entry Points

#### 1. Primary Flow: Create Event Button
```
Dashboard → "Create Event" CTA → Template Picker Screen → [Choose Template] → 
→ Event Wizard (pre-filled) → Review & Create → Event Created
```

#### 2. Quick Create Flow (Fast Path)
```
Dashboard → "Quick Create" button → Template Picker Modal → 
→ 3-field form (Title, Date, Location) → Event Created (instant)
```

#### 3. Browse Templates (Discovery)
```
Navigation → "Templates" → Template Gallery → [Preview/Details] → 
→ "Use Template" → Event Wizard (pre-filled)
```

#### 4. Event Reuse (Future)
```
Event Details → "..." menu → "Save as Template" → Template Editor → 
→ Save to My Templates
```

### UX Principles
- **Always offer "Blank/Start from scratch"** option
- **Show estimated setup time** on each template card
- **Preview before committing** via details modal
- **Mobile-first design** with horizontal card scrolling
- **Keyboard accessible** with clear focus states

---

## 🎨 Screen Designs & Components

### A. Template Picker Screen

**Layout (Desktop):**
```
┌─────────────────────────────────────────────────────┐
│  [Search templates...]        [Filter: All ▾]       │
│                                                      │
│  📌 Recommended for you                             │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │
│  │ Kids │ │Large │ │Corp. │ │Blank │              │
│  │Birth │ │Birth │ │Off-  │ │      │              │
│  │ 3min │ │ 5min │ │site  │ │Start │              │
│  └──────┘ └──────┘ └──────┘ └──────┘              │
│                                                      │
│  🎉 Personal Events                                 │
│  [card grid...]                                     │
│                                                      │
│  💼 Corporate Events                                │
│  [card grid...]                                     │
└─────────────────────────────────────────────────────┘
```

**Layout (Mobile):**
```
┌─────────────────────┐
│ [← Back]  Templates │
│                     │
│ [Search...]         │
│                     │
│ 📌 Recommended      │
│ ← [Card][Card][Card]→
│                     │
│ 🎉 Personal         │
│ ← [Card][Card][Card]→
│                     │
│ 💼 Corporate        │
│ ← [Card][Card][Card]→
└─────────────────────┘
```

**Template Card Contents:**
- Hero image (600x400)
- Title + category badge
- Short description (1 line)
- Setup time estimate ("~5 min")
- Feature badges (🎮 Games, 📊 Polls, 💰 Budget)
- Price badge (FREE / PREMIUM / $X)
- CTA: "Use Template" + "..." menu for preview

### B. Template Details/Preview Modal

**Contents:**
- Full description (3-4 paragraphs)
- Sample agenda/timeline visualization
- Included features list with checkboxes (visual only)
- Sample assets (hero image, email preview)
- Reviews/ratings (future)
- CTAs: "Use Template" | "Customize First"

### C. Event Wizard (Pre-filled Mode)

**Left Sidebar Addition:**
```
┌────────────────────┐
│ Template Summary   │
│ ────────────────── │
│ ✅ PartyBoard tasks│
│ ✅ Games: Trivia   │
│ ✅ Budget tracker  │
│ ✅ Email sequence  │
│                    │
│ [Customize →]      │
└────────────────────┘
```

**Main Wizard:**
- All fields pre-filled with template defaults
- User can override any field
- "Reset to template" button per section
- Visual diff indicators for changed fields (optional)

### D. Quick Create Modal

**Minimal 3-field form:**
```
┌──────────────────────────────┐
│  Quick Create from Template  │
│  ──────────────────────────  │
│  Using: Birthday - Kids 🎂   │
│                              │
│  Event Title*                │
│  [My Child's 6th Birthday]   │
│                              │
│  Date & Time*                │
│  [Oct 28, 2025 2:00 PM]      │
│                              │
│  Location*                   │
│  [123 Main St...]            │
│                              │
│  [Cancel]    [Create Event]  │
└──────────────────────────────┘
```

---

## 🗄️ Data Model

### Database Schema

#### templates table
```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- 'personal', 'corporate', 'travel', 'wedding', 'fundraiser'
  hero_image_url TEXT,
  price_tier VARCHAR(20) DEFAULT 'free', -- 'free', 'premium', 'purchase'
  price_amount INTEGER, -- cents, if purchase
  author_id UUID REFERENCES users(id), -- null for system templates
  default_payload JSONB NOT NULL, -- full event seed
  required_fields_schema JSONB, -- JSON Schema for validation
  featured BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_featured ON templates(featured) WHERE featured = true;
CREATE INDEX idx_templates_slug ON templates(slug);
```

#### template_usage table (analytics)
```sql
CREATE TABLE template_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES templates(id),
  user_id UUID REFERENCES users(id),
  event_id UUID REFERENCES events(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Template JSON Structure (default_payload)

```json
{
  "event": {
    "title": "Birthday Party - Kids",
    "description": "A fun-filled birthday celebration for children",
    "duration_hours": 3,
    "visibility": "private",
    "category": "birthday",
    "tags": ["kids", "birthday", "party"]
  },
  "partyboard": [
    {
      "title": "Book entertainer or activities",
      "description": "Hire a magician, face painter, or plan games",
      "due_offset_days": 21,
      "assignee_role": "host",
      "priority": "high"
    },
    {
      "title": "Order cake",
      "due_offset_days": 7,
      "assignee_role": "host",
      "priority": "high"
    },
    {
      "title": "Send invitations",
      "due_offset_days": 14,
      "assignee_role": "host",
      "priority": "high"
    }
  ],
  "features": {
    "games": ["photo_bingo", "scavenger_hunt"],
    "polls": ["food_preferences"],
    "budget": true,
    "emailSequence": ["invitation", "reminder_7d", "reminder_1d", "thankyou"]
  },
  "budget": {
    "items": [
      { "label": "Venue/Space", "estimated": 0 },
      { "label": "Food & Cake", "estimated": 150 },
      { "label": "Decorations", "estimated": 50 },
      { "label": "Entertainment", "estimated": 200 },
      { "label": "Party Favors", "estimated": 75 }
    ]
  },
  "emails": {
    "invitation": "kids_birthday_invite_v1",
    "reminder_7d": "kids_birthday_reminder",
    "thankyou": "kids_birthday_thankyou"
  },
  "customization_hints": {
    "required_fields": ["title", "date", "location"],
    "recommended_guest_count": "15-30",
    "setup_time_minutes": 3
  }
}
```

### Required Fields Schema (JSON Schema)
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["title", "date", "location"],
  "properties": {
    "title": { "type": "string", "minLength": 3 },
    "date": { "type": "string", "format": "date-time" },
    "location": { "type": "string", "minLength": 3 }
  }
}
```

---

## 🔌 API Contracts

### GET /api/templates
**Query params:**
- `category` (optional): filter by category
- `featured` (optional): boolean
- `price_tier` (optional): 'free' | 'premium'

**Response:**
```json
{
  "templates": [
    {
      "id": "uuid",
      "name": "Birthday - Kids",
      "slug": "birthday-kids",
      "description": "Perfect for children's birthday parties...",
      "category": "personal",
      "hero_image_url": "https://...",
      "price_tier": "free",
      "featured": true,
      "usage_count": 1243,
      "customization_hints": {
        "setup_time_minutes": 3,
        "recommended_guest_count": "15-30"
      }
    }
  ]
}
```

### GET /api/templates/:slug
**Response:**
```json
{
  "id": "uuid",
  "name": "Birthday - Kids",
  "slug": "birthday-kids",
  "description": "...",
  "category": "personal",
  "hero_image_url": "...",
  "price_tier": "free",
  "default_payload": { /* full JSON */ },
  "required_fields_schema": { /* JSON Schema */ }
}
```

### POST /api/events/from-template
**Body:**
```json
{
  "template_id": "uuid",
  "overrides": {
    "event": {
      "title": "Emma's 6th Birthday",
      "date": "2025-11-15T14:00:00Z",
      "location": "123 Main St, Apt 4B"
    },
    "budget": {
      "items": [
        { "label": "Food & Cake", "estimated": 200 }
      ]
    }
  }
}
```

**Response:**
```json
{
  "event_id": "uuid",
  "success": true,
  "created": {
    "event": true,
    "partyboard_tasks": 5,
    "features_enabled": ["games", "polls", "budget"],
    "email_sequence": 4
  }
}
```

**Error Response:**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Required field missing: date",
  "details": {
    "field": "date",
    "schema_error": "..."
  }
}
```

### POST /api/templates (admin only)
**Body:** Full template object
**Response:** Created template

### PUT /api/templates/:id (admin only)
**Body:** Template updates
**Response:** Updated template

---

## 🛠️ Implementation Details

### Frontend Components (React + TypeScript)

#### Component Tree
```
TemplatePickerScreen
├── TemplateSearchBar
├── TemplateCategoryFilter
├── TemplateFeaturedSection
│   └── TemplateCard (multiple)
├── TemplateCategorySection
│   └── TemplateCard (multiple)
└── TemplateDetailsModal
    ├── TemplateHero
    ├── TemplateFeatureList
    ├── TemplateSampleAgenda
    └── TemplateActionButtons

EventWizard (enhanced)
├── TemplateSummarySidebar (new)
│   ├── TemplateFeatureCheckList
│   └── CustomizeButton
├── EventBasicInfo (pre-filled)
├── GuestManagement (pre-filled)
└── FeatureToggles (pre-filled)

QuickCreateModal
├── TemplatePreview
├── QuickForm (3 fields)
└── CreateButton
```

#### State Management (React Query + Zustand)

**React Query hooks:**
```typescript
// Fetch templates
const { data: templates } = useTemplates({ category, featured });

// Fetch single template
const { data: template } = useTemplate(slug);

// Create event from template
const createFromTemplate = useCreateEventFromTemplate();
```

**Zustand store:**
```typescript
interface TemplateStore {
  selectedTemplate: Template | null;
  setSelectedTemplate: (template: Template) => void;
  overrides: Partial<EventPayload>;
  setOverride: (path: string, value: any) => void;
  resetOverrides: () => void;
}
```

### Backend Implementation (Node.js + Supabase)

#### Template Service (api/services/templateService.ts)
```typescript
class TemplateService {
  async getTemplates(filters: TemplateFilters): Promise<Template[]>
  async getTemplateBySlug(slug: string): Promise<Template>
  async createEventFromTemplate(
    userId: string, 
    templateId: string, 
    overrides: Partial<EventPayload>
  ): Promise<CreateEventResult>
  async createTemplate(template: TemplateInput): Promise<Template> // admin
  async updateTemplate(id: string, updates: Partial<Template>): Promise<Template> // admin
}
```

#### Merge Logic (deep merge with validation)
```typescript
function mergeTemplateWithOverrides(
  template: Template,
  overrides: Partial<EventPayload>
): EventPayload {
  // Deep merge template.default_payload with overrides
  // Overrides take precedence
  // Validate against template.required_fields_schema
  // Return merged payload or throw ValidationError
}
```

#### Transaction Flow
```typescript
async function createEventFromTemplate(
  userId: string,
  templateId: string,
  overrides: Partial<EventPayload>
): Promise<CreateEventResult> {
  const client = await supabase.rpc.begin_transaction();
  
  try {
    // 1. Load template
    const template = await getTemplate(templateId);
    
    // 2. Merge and validate
    const payload = mergeTemplateWithOverrides(template, overrides);
    
    // 3. Create event
    const event = await createEvent(client, userId, payload.event);
    
    // 4. Create PartyBoard tasks
    const tasks = await createPartyBoardTasks(client, event.id, payload.partyboard);
    
    // 5. Enable features
    await enableFeatures(client, event.id, payload.features);
    
    // 6. Create budget items
    if (payload.budget) {
      await createBudgetItems(client, event.id, payload.budget.items);
    }
    
    // 7. Schedule email sequence
    await scheduleEmailSequence(client, event.id, payload.emails);
    
    // 8. Track usage
    await trackTemplateUsage(client, templateId, userId, event.id);
    
    await client.commit();
    
    return { event_id: event.id, success: true };
  } catch (error) {
    await client.rollback();
    throw error;
  }
}
```

---

## 🎯 MVP Template Definitions

### 1. Birthday - Kids
- **Category:** Personal
- **Setup time:** ~3 min
- **Features:** Photo games, food polls, budget tracker, kid-safe content
- **PartyBoard:** 8 tasks (book entertainer, order cake, decorations, etc.)
- **Budget:** 5 line items (~$500 total)
- **Guests:** 15-30

### 2. Birthday - Large (Adult)
- **Category:** Personal
- **Setup time:** ~5 min
- **Features:** Trivia, music voting, photo scavenger hunt, budget
- **PartyBoard:** 10 tasks (venue, catering, DJ/music, decorations, etc.)
- **Budget:** 8 line items (~$1500 total)
- **Guests:** 40-80

### 3. Corporate Offsite / Team Building
- **Category:** Corporate
- **Setup time:** ~7 min
- **Features:** Team challenges, polls, feedback forms, analytics dashboard
- **PartyBoard:** 15 tasks (venue, agenda, sessions, facilitators, AV, etc.)
- **Budget:** 10 line items (~$5000 total)
- **Guests:** 20-50

### 4. Wedding - Intimate
- **Category:** Wedding
- **Setup time:** ~10 min
- **Features:** Guest management, seating, vendor portal, timeline, photo gallery
- **PartyBoard:** 25 tasks (venue, vendors, timeline, ceremony, reception, etc.)
- **Budget:** 15 line items (~$15000 total)
- **Guests:** 50-100

### 5. Group Travel Trip
- **Category:** Travel
- **Setup time:** ~8 min
- **Features:** Multi-day itinerary, expense splitting, shared packing list, location tracking
- **PartyBoard:** 12 tasks (flights, lodging, activities, meals, transport, etc.)
- **Budget:** 8 line items with split payment support
- **Guests:** 8-20

---

## 🧪 Testing Strategy

### Unit Tests
- Template merge logic (deep merge, overrides precedence)
- Validation against JSON Schema
- Transaction rollback on failure
- Component rendering with various template states

### Integration Tests
- GET /templates endpoint with filters
- POST /events/from-template full flow
- Admin template creation/update
- Template usage tracking

### E2E Tests (Playwright)
- User selects template → creates event → sends invite
- Quick Create flow (3 fields → instant event)
- Template customization in Event Wizard
- Mobile template picker interaction

### Accessibility Tests
- Keyboard navigation through template picker
- Screen reader announcements for template cards
- Focus management in modals
- Color contrast for badges and CTAs

### Performance Tests
- Template list load time (<500ms)
- Event creation from template (<2s)
- Large payload merge (wedding template)
- Mobile template picker scroll performance

---

## 📊 Analytics & Telemetry

### Events to Track
```typescript
// Template interactions
track('template_viewed', { template_id, slug, category });
track('template_previewed', { template_id, source });
track('template_selected', { template_id, flow: 'picker' | 'quick_create' });

// Event creation
track('event_created_from_template', {
  template_id,
  user_id,
  event_id,
  time_to_create_seconds,
  fields_overridden: string[],
  features_enabled: string[]
});

// Feature adoption
track('template_feature_used', {
  event_id,
  template_id,
  feature: 'game' | 'poll' | 'budget' | 'partyboard',
  feature_name: string
});

// Funnel
track('template_funnel_step', {
  step: 'impression' | 'click' | 'preview' | 'start' | 'create' | 'invite_sent',
  template_id
});
```

### Dashboards to Build
- Template Picker Conversion Funnel
- Template Usage by Category
- Time-to-Create: Template vs Blank
- Feature Adoption: Template vs Blank
- Template Revenue (premium purchases)

---

## 🚀 Rollout Plan

### Phase 0: Internal Alpha (Week 1-2)
- Deploy templates to staging
- Seed 5 MVP templates
- Admin-only access
- Internal team testing
- Fix critical bugs

### Phase 1: Controlled Beta (Week 3-4)
- Feature flag: 10% of users
- A/B test: Template Picker vs Standard Flow
- Monitor metrics:
  - Time-to-first-event
  - Conversion rate
  - Feature adoption
  - Error rates
- Collect user feedback via in-app survey

### Phase 2: Expanded Beta (Week 5-6)
- Feature flag: 50% of users
- Add Quick Create flow
- Refine templates based on feedback
- Add 3-5 more templates based on demand
- Prepare marketing materials

### Phase 3: General Availability (Week 7-8)
- Feature flag: 100% of users
- Launch announcement (email, blog, social)
- Add coach marks for first-time users
- Monitor for scale issues
- Begin work on premium templates

### Phase 4: Marketplace (Month 3+)
- User-created templates
- Template sharing
- Premium template purchases
- Template ratings/reviews

---

## 🔒 Security & Privacy

### Security Considerations
- **Template payload validation:** Sanitize all HTML in email templates (DOMPurify on server)
- **Injection prevention:** No code execution in templates; pure data
- **Access control:** Only admins can create system templates
- **Rate limiting:** Prevent template spam/abuse
- **Audit logging:** Track template creation/modification

### Privacy Considerations
- **No PII in templates:** System templates contain no user data
- **User-created templates:** Strip user emails/names before sharing
- **COPPA compliance:** Kids templates default to parental consent flags
- **Data export:** Include templates in user data export (GDPR)

### Compliance
- Templates involving minors enforce parental controls
- Premium templates integrate with existing Stripe PCI-compliant flow
- Email templates comply with CAN-SPAM (unsubscribe links)

---

## 💰 Monetization Strategy

### Free Tier
- 5 system templates (most popular)
- "Blank/Start from scratch" always free
- Community templates (future)

### Premium Tier ($19/month)
- All premium templates included
- Early access to new templates
- White-label templates (remove PartyHause branding)
- Priority template requests

### À la Carte Purchases
- Individual premium templates: $2-5 each
- Template packs: $10-15 for bundle of 5
- Custom template creation service: $50-100

### Future Revenue
- Template marketplace: 30% commission on user-created templates
- Enterprise templates: Custom pricing for corporate clients
- Template customization service: Upsell design services

---

## 📅 Implementation Timeline

### Sprint 1 (Weeks 1-2): Foundation
**Backend (5 days)**
- Database schema and migrations
- Seed 5 MVP templates as JSON
- GET /templates endpoint
- Basic template service

**Frontend (5 days)**
- TemplateCard component
- TemplatePicker screen (basic grid)
- React Query hooks
- Basic styling

**Deliverables:**
- Template data seeded
- Template list viewable
- No event creation yet

### Sprint 2 (Weeks 3-4): Core Flow
**Backend (5 days)**
- POST /events/from-template endpoint
- Merge logic with validation
- Transaction-based event creation
- Error handling

**Frontend (6 days)**
- Event Wizard integration (pre-fill)
- Template selection flow
- Override tracking
- Template summary sidebar

**Deliverables:**
- End-to-end template → event flow working
- Can create event from template

### Sprint 3 (Weeks 5-6): Polish & Quick Create
**Backend (3 days)**
- Admin endpoints (create/update templates)
- Usage tracking
- Analytics events

**Frontend (7 days)**
- Quick Create modal
- Template details/preview modal
- Mobile template picker
- Admin template editor (basic)
- Feature flags integration

**QA (3 days)**
- E2E tests
- Accessibility audit
- Performance testing

**Deliverables:**
- Quick Create flow
- Mobile support
- Admin can add templates
- Ready for beta

### Sprint 4 (Weeks 7-8): Launch & Iterate
**Backend (2 days)**
- Performance optimization
- Monitoring and logging
- Scale testing

**Frontend (3 days)**
- Coach marks / onboarding
- Polish and animations
- A/B test setup

**Marketing (ongoing)**
- Blog post
- Email announcement
- Social media campaign
- In-app announcements

**Deliverables:**
- GA launch
- Monitoring dashboard
- User feedback collection

---

## 🎯 Success Criteria

### Must-Have (MVP)
- ✅ 5 templates available
- ✅ Template picker functional on web + mobile
- ✅ Event creation from template works end-to-end
- ✅ Quick Create flow (<3 fields)
- ✅ Analytics tracking template usage
- ✅ Admin can add new templates

### Should-Have (Beta)
- ✅ Template preview/details modal
- ✅ 10+ templates across categories
- ✅ Feature flags for gradual rollout
- ✅ A/B testing infrastructure
- ✅ Mobile-optimized experience

### Nice-to-Have (Future)
- User-created templates
- Template marketplace
- Template ratings/reviews
- Template versioning
- Collaborative template editing

---

## 📝 Open Questions & Decisions Needed

1. **Template versioning:** Should we version templates? What happens when a template updates after events are created?
   - **Decision:** No versioning in MVP; templates are immutable once published. Future: optional "apply updates" flow.

2. **Custom fields:** Should templates support dynamic custom fields?
   - **Decision:** Not in MVP. Use JSON Schema required_fields_schema for now.

3. **Template editing:** Can users edit templates after creating an event?
   - **Decision:** No. Templates are blueprints. Once event is created, it's independent.

4. **Marketplace split:** What commission for user-created templates?
   - **Decision:** 30% (industry standard), implement in Phase 4.

5. **Mobile offline:** Should templates be cached offline?
   - **Decision:** Yes, cache top 10 templates locally on mobile for offline creation.

---

## 🔗 Related Documents

- `use_Cases.md` - Source scenarios for template designs
- `PARTYHAUSE_ESSENCE_COMPREHENSIVE.md` - Product vision and strategy
- `FEATURE_TRACKER.md` - Overall feature roadmap
- `schema.sql` - Database schema (will be updated with templates table)

---

## 📞 Team & Responsibilities

- **PM:** Template strategy, prioritization, user research
- **Backend Engineer:** API endpoints, merge logic, transactions
- **Frontend Engineer (Web):** Template picker, wizard integration
- **Frontend Engineer (Mobile):** Mobile template picker, Quick Create
- **Designer:** Template card designs, preview modal, mobile UX
- **QA Engineer:** Test coverage, E2E tests, accessibility
- **Data Analyst:** Metrics dashboard, A/B test analysis

---

## ✅ Next Steps

### Immediate (This Week)
1. Review and approve this plan with team
2. Create Jira tickets for Sprint 1 tasks
3. Begin database schema design review
4. Start designing template card components

### Week 1
1. Implement templates table migration
2. Create seed JSON for 5 templates
3. Build GET /templates endpoint
4. Design TemplateCard component

### Week 2
1. Build TemplatePicker screen
2. Implement template selection flow
3. Begin merge logic implementation
4. QA review of Sprint 1 deliverables

---

**Document Owner:** Product Team  
**Last Updated:** October 21, 2025  
**Next Review:** Weekly during implementation

---

🎊 **Let's make event creation effortless!** 🎊
