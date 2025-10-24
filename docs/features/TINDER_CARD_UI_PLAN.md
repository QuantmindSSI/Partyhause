# Tinder-Style Card UI Implementation Plan - PartyHause

## Overview
Transform the event browsing experience into an immersive, engaging Tinder-style card interface with 3D physics-based swiping and template-specific background imagery.

---

## Vision Statement

**"Turn event discovery into an experience"**

Instead of traditional list views, users will explore their events through beautiful, interactive cards that respond to touch with realistic physics. Each swipe reveals the next event in a smooth, carousel-like motion with depth perception.

---

## Core Features

### 1. 3D Card Carousel
**Visual Structure:**
```
┌─────────────────────────────────┐
│   [Card -1]  [CARD 0]  [Card 1] │
│   (blurred)  (focused)  (blurred)│
│      ↖️        🎯        ↗️      │
│    smaller   MAIN     smaller   │
│   z-index:1  z:10    z-index:1  │
└─────────────────────────────────┘
```

**Key Characteristics:**
- **Center Card (Focus):** Full opacity, largest scale (1.0), sharp details
- **Side Cards (Preview):** 80% scale, 50% opacity, slightly blurred
- **Depth Effect:** Parallax motion - cards at different z-indices move at different speeds
- **Smooth Transitions:** Spring physics animations (React Native Reanimated)

### 2. Swipe Gestures
**Interactions:**
- **Swipe Left:** Move to next event
- **Swipe Right:** Move to previous event
- **Swipe Up:** Quick view event details (modal)
- **Swipe Down:** Dismiss/archive event (with confirmation)
- **Tap Center Card:** Open full event details
- **Tap Side Cards:** Bring that card to center

**Physics Behavior:**
- **Velocity-based:** Fast swipe = card flies off screen
- **Slow drag:** Card follows finger with elastic resistance
- **Release:** Spring animation to snap to nearest position
- **Overscroll:** Rubber band effect at first/last event

### 3. Template-Specific Backgrounds
Each event card displays a unique background based on template type:

#### Background Mapping
```typescript
const templateBackgrounds = {
  'birthday': '/images/backgrounds/birthday-balloons.jpg',
  'kids-birthday': '/images/backgrounds/kids-party-fun.jpg',
  'wedding': '/images/backgrounds/wedding-elegance.jpg',
  'product-launch': '/images/backgrounds/modern-tech.jpg',
  'conference': '/images/backgrounds/business-venue.jpg',
  'festival': '/images/backgrounds/music-crowd.jpg',
  'fundraiser': '/images/backgrounds/charity-community.jpg',
  'block-party': '/images/backgrounds/neighborhood-bbq.jpg',
  'travel': '/images/backgrounds/scenic-destination.jpg',
  'hackathon': '/images/backgrounds/coding-workspace.jpg',
  'corporate': '/images/backgrounds/office-event.jpg',
  'default': '/images/backgrounds/party-generic.jpg'
};
```

#### Background Effects
- **Blur Layer:** 20px Gaussian blur for readability
- **Gradient Overlay:** Dark gradient from top (α:0.7) to bottom (α:0.3)
- **Color Tint:** Subtle template-specific color overlay
- **Parallax:** Background moves slower than card content when swiping

---

## Technical Implementation

### Technology Stack
```typescript
// Core Libraries
- react-native-reanimated (v3+) - Smooth 60fps animations
- react-native-gesture-handler - Touch gesture recognition
- expo-blur - Native blur effects for backgrounds
- react-native-fast-image - Optimized image loading with cache

// Optional Enhancements
- @shopify/flash-list - Optimized card list rendering
- react-native-skia - Advanced graphics for custom effects
```

### Component Architecture

#### 1. EventCardCarousel (Main Container)
```typescript
// apps/mobile/components/EventCardCarousel.tsx
interface EventCardCarouselProps {
  events: Event[];
  initialIndex?: number;
  onEventChange?: (event: Event) => void;
  onEventPress?: (event: Event) => void;
  onEventArchive?: (event: Event) => void;
}

const EventCardCarousel: React.FC<EventCardCarouselProps> = ({
  events,
  initialIndex = 0,
  ...props
}) => {
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  
  // Gesture handling
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      // Snap to next/prev card based on velocity
      if (e.velocityX > 500) {
        goToPrevious();
      } else if (e.velocityX < -500) {
        goToNext();
      } else {
        snapToCurrent();
      }
    });

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.carousel}>
        {/* Render 3 cards: previous, current, next */}
        <EventCard 
          event={events[currentIndex - 1]} 
          position="left"
          animated={translateX}
        />
        <EventCard 
          event={events[currentIndex]} 
          position="center"
          animated={translateX}
        />
        <EventCard 
          event={events[currentIndex + 1]} 
          position="right"
          animated={translateX}
        />
      </View>
    </GestureDetector>
  );
};
```

#### 2. EventCard (Individual Card)
```typescript
// apps/mobile/components/EventCard.tsx
interface EventCardProps {
  event: Event;
  position: 'left' | 'center' | 'right';
  animated: SharedValue<number>;
}

const EventCard: React.FC<EventCardProps> = ({ 
  event, 
  position, 
  animated 
}) => {
  const backgroundImage = getTemplateBackground(event.template_type);
  
  // Calculate position-based styles
  const animatedStyle = useAnimatedStyle(() => {
    const isCenter = position === 'center';
    const offset = position === 'left' ? -CARD_WIDTH * 1.2 
                 : position === 'right' ? CARD_WIDTH * 1.2 
                 : 0;
    
    return {
      transform: [
        { translateX: offset + animated.value },
        { scale: isCenter ? 1 : 0.8 },
        { rotateY: `${(offset / 10)}deg` }, // 3D perspective
      ],
      opacity: isCenter ? 1 : 0.5,
      zIndex: isCenter ? 10 : 1,
    };
  });

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      {/* Background Image with Blur */}
      <Image 
        source={{ uri: backgroundImage }}
        style={StyleSheet.absoluteFill}
        blurRadius={20}
      />
      
      {/* Gradient Overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'transparent', 'rgba(0,0,0,0.3)']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Card Content */}
      <View style={styles.cardContent}>
        <EventCardHeader event={event} />
        <EventCardBody event={event} />
        <EventCardFooter event={event} />
      </View>
    </Animated.View>
  );
};
```

#### 3. Background Image System
```typescript
// apps/mobile/utils/templateBackgrounds.ts
export const getTemplateBackground = (templateType: string): string => {
  const backgrounds: Record<string, any> = {
    'birthday': require('@/assets/backgrounds/birthday.jpg'),
    'kids-birthday': require('@/assets/backgrounds/kids-party.jpg'),
    'wedding': require('@/assets/backgrounds/wedding.jpg'),
    'product-launch': require('@/assets/backgrounds/product-launch.jpg'),
    'conference': require('@/assets/backgrounds/conference.jpg'),
    'festival': require('@/assets/backgrounds/festival.jpg'),
    'fundraiser': require('@/assets/backgrounds/fundraiser.jpg'),
  };
  
  return backgrounds[templateType] || backgrounds['default'];
};

// Color themes per template
export const getTemplateColors = (templateType: string) => {
  const colors: Record<string, { primary: string; accent: string }> = {
    'birthday': { primary: '#f59e0b', accent: '#fbbf24' },
    'kids-birthday': { primary: '#ec4899', accent: '#f472b6' },
    'wedding': { primary: '#f43f5e', accent: '#fb7185' },
    'product-launch': { primary: '#8b5cf6', accent: '#a78bfa' },
    'conference': { primary: '#0ea5e9', accent: '#38bdf8' },
    'festival': { primary: '#f97316', accent: '#fb923c' },
    'fundraiser': { primary: '#10b981', accent: '#34d399' },
  };
  
  return colors[templateType] || { primary: '#9333ea', accent: '#a855f7' };
};
```

---

## UI/UX Design Specifications

### Card Dimensions
```typescript
const CARD_WIDTH = Dimensions.get('window').width * 0.85; // 85% of screen
const CARD_HEIGHT = Dimensions.get('window').height * 0.65; // 65% of screen
const CARD_SPACING = 20; // Space between cards
const CARD_RADIUS = 24; // Corner radius
const SIDE_CARD_SCALE = 0.8; // Scale for side cards
```

### Animation Timings
```typescript
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 150,
  mass: 1,
  overshootClamping: false,
};

const SWIPE_VELOCITY_THRESHOLD = 500; // px/s
const SNAP_DURATION = 300; // ms
const EXIT_ANIMATION_DURATION = 200; // ms
```

### Card Layout Structure
```
┌─────────────────────────────────────┐
│  ┌─────────────────────────────┐   │
│  │  🎂 BIRTHDAY (Badge)        │   │ ← Header
│  │  Status: Published          │   │
│  ├─────────────────────────────┤   │
│  │                             │   │
│  │  Emma's 30th Birthday       │   │ ← Title (Large)
│  │                             │   │
│  │  📍 Rooftop Bar, NYC        │   │ ← Location
│  │  📅 Oct 28, 2025 8:00 PM    │   │ ← Date/Time
│  │                             │   │
│  │  👥 45 Guests • ✅ 32       │   │ ← Quick Stats
│  │  🎵 Timeline • 📸 Media     │   │
│  │                             │   │
│  ├─────────────────────────────┤   │
│  │  [View Details →]           │   │ ← Footer CTA
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Visual Effects
1. **Card Shadow:**
   ```typescript
   shadowColor: '#000',
   shadowOffset: { width: 0, height: 10 },
   shadowOpacity: 0.3,
   shadowRadius: 20,
   elevation: 10,
   ```

2. **Blur Background:**
   - Gaussian blur: 20px
   - Background scale: 1.1 (slight zoom for edge coverage)

3. **Gradient Overlay:**
   - Top: `rgba(0,0,0,0.7)` - Protects header text
   - Middle: `transparent` - Shows background
   - Bottom: `rgba(0,0,0,0.3)` - Subtle footer darkening

4. **Template Color Accent:**
   - Status badge: Template primary color
   - Icons: Template accent color
   - CTA button: Template primary color

---

## Implementation Phases

### Phase 1: Core Card System (Week 1)
**Goal:** Basic 3-card carousel with swipe gestures

**Tasks:**
- [ ] Create EventCardCarousel component
- [ ] Implement basic EventCard component
- [ ] Add pan gesture handling with Reanimated
- [ ] Set up spring animations for snapping
- [ ] Add prev/next card navigation
- [ ] Test on iOS and Android

**Files to Create:**
- `apps/mobile/components/cards/EventCardCarousel.tsx`
- `apps/mobile/components/cards/EventCard.tsx`
- `apps/mobile/components/cards/EventCardHeader.tsx`
- `apps/mobile/components/cards/EventCardBody.tsx`
- `apps/mobile/components/cards/EventCardFooter.tsx`

### Phase 2: Background Image System (Week 1)
**Goal:** Template-specific backgrounds with blur effects

**Tasks:**
- [ ] Source/create background images for each template type
- [ ] Set up background image mapping utility
- [ ] Implement blur effect with expo-blur
- [ ] Add gradient overlays
- [ ] Optimize image loading with react-native-fast-image
- [ ] Add fallback for missing images

**Files to Create:**
- `apps/mobile/utils/templateBackgrounds.ts`
- `apps/mobile/utils/templateColors.ts`
- `apps/mobile/assets/backgrounds/` (image folder)

**Background Images Needed:**
1. birthday.jpg - Colorful balloons, confetti
2. kids-party.jpg - Playful, bright colors, toys
3. wedding.jpg - Elegant venue, flowers
4. product-launch.jpg - Modern tech, sleek design
5. conference.jpg - Professional venue, networking
6. festival.jpg - Concert crowd, lights
7. fundraiser.jpg - Community gathering
8. default.jpg - Generic celebration

### Phase 3: 3D Physics & Polish (Week 2)
**Goal:** Advanced 3D effects and smooth animations

**Tasks:**
- [ ] Add 3D perspective transforms (rotateY, rotateZ)
- [ ] Implement velocity-based swipe animations
- [ ] Add overscroll rubber band effect
- [ ] Create card flip animation for quick view
- [ ] Add haptic feedback on swipe
- [ ] Polish spring animations
- [ ] Add loading skeletons for images

**Advanced Features:**
- Parallax scrolling (background moves slower)
- Card rotation on drag (subtle tilt effect)
- Shadow intensity changes with z-position
- Smooth opacity transitions

### Phase 4: Integration & Testing (Week 2)
**Goal:** Replace existing list views with card interface

**Tasks:**
- [ ] Replace DashboardScreen event list with EventCardCarousel
- [ ] Add template browser with card preview
- [ ] Integrate with existing event fetch logic
- [ ] Add empty state (no events)
- [ ] Add loading state (skeleton cards)
- [ ] Test with large event lists (performance)
- [ ] Test gesture conflicts with ScrollView
- [ ] Cross-platform testing (iOS/Android)

**Files to Modify:**
- `apps/mobile/components/screens/DashboardScreen.tsx`
- `apps/mobile/app/templates/index.tsx` (template browser)

---

## User Interactions

### Gesture Map
```typescript
// Swipe Gestures
Swipe Left  → Next Event
Swipe Right → Previous Event
Swipe Up    → Quick View (Modal with details)
Swipe Down  → Archive/Dismiss (with undo option)

// Tap Gestures
Tap Center Card → Open Full Details
Tap Side Card   → Bring to Center (animate)
Double Tap      → Quick RSVP/Action

// Press & Hold
Long Press → Edit Menu (Edit, Delete, Share)
```

### Feedback Mechanisms
```typescript
// Visual Feedback
- Card scales slightly on press (1.0 → 0.98)
- Swipe direction indicator (arrow overlay)
- Progress dots at bottom (current position)

// Haptic Feedback
- Light impact on card change
- Medium impact on card focus
- Heavy impact on archive/delete
- Selection feedback on tap
```

### Accessibility
```typescript
// Screen Reader Support
- Card position announcement: "Event 3 of 12"
- Event summary on focus
- Swipe alternative: Next/Previous buttons

// Motion Preferences
- Detect "Reduce Motion" setting
- Disable spring animations
- Use instant transitions instead
- Keep functionality intact
```

---

## Performance Optimization

### Image Loading Strategy
```typescript
// Lazy Loading
- Load current card image immediately
- Preload adjacent cards (±1)
- Cache images with react-native-fast-image
- Compress images to max 1080p

// Progressive Loading
1. Show blur placeholder (low-res, 50x50)
2. Load medium-res version (500x500)
3. Fade in high-res version (1080x1080)
```

### Animation Performance
```typescript
// Reanimated Worklets
- Run animations on UI thread (60fps guaranteed)
- Use useSharedValue for smooth updates
- Batch state updates
- Avoid JS bridge calls during animation

// Render Optimization
- Use React.memo for EventCard
- Virtualize cards (render only visible + adjacent)
- Disable offscreen card updates
```

### Memory Management
```typescript
// Card Recycling
- Render maximum 5 cards at once (center ±2)
- Unmount cards outside viewport
- Clear image cache when memory pressure

// Background Image Pool
- Preload common templates
- Limit cache size to 50MB
- Use disk cache for persistence
```

---

## Design System Integration

### Color Palette
```typescript
// Card Background Overlays
const darkGradient = ['rgba(0,0,0,0.7)', 'transparent', 'rgba(0,0,0,0.3)'];

// Template Colors (from existing design system)
birthday: { bg: '#fef3c7', text: '#f59e0b' }
wedding: { bg: '#fce7f3', text: '#f43f5e' }
conference: { bg: '#dbeafe', text: '#0ea5e9' }
// ... etc
```

### Typography
```typescript
// Card Text Hierarchy
Title: {
  fontSize: 32,
  fontWeight: '700',
  color: '#fff',
  textShadowColor: 'rgba(0,0,0,0.3)',
}

Subtitle: {
  fontSize: 16,
  fontWeight: '500',
  color: 'rgba(255,255,255,0.9)',
}

Body: {
  fontSize: 14,
  fontWeight: '400',
  color: 'rgba(255,255,255,0.8)',
}
```

### Spacing
```typescript
const SPACING = {
  cardPadding: 20,
  contentGap: 16,
  elementGap: 8,
  iconTextGap: 6,
};
```

---

## Template Browser Enhancement

### Carousel for Template Selection
When creating a new event, show template options in the same card carousel:

```typescript
// apps/mobile/app/templates/index.tsx
<TemplateCardCarousel
  templates={availableTemplates}
  onTemplateSelect={(template) => {
    router.push(`/events/create?template=${template.type}`);
  }}
/>
```

**Template Card Content:**
- Large template icon
- Template name
- Brief description
- "Use This Template" CTA
- Template-specific background preview

---

## Testing Strategy

### Unit Tests
```typescript
// Card gesture logic
- Test swipe velocity calculations
- Test snap-to-card logic
- Test boundary conditions (first/last)
- Test spring animation parameters

// Background system
- Test template mapping
- Test fallback images
- Test color theme extraction
```

### Integration Tests
```typescript
// User flows
- Browse through 10+ events
- Swipe to last event
- Quick view event details
- Archive an event
- Navigate from side card tap
```

### Performance Tests
```typescript
// Benchmarks
- Animation FPS (target: 60fps constant)
- Image load time (target: <500ms)
- Memory usage (target: <100MB)
- Gesture response time (target: <16ms)
```

---

## Future Enhancements (Post-MVP)

### Advanced Features
1. **Card Stacking:** Show depth with multiple overlapping cards
2. **Custom Gestures:** Pinch to zoom card details
3. **Animated Transitions:** Card morphs into detail view
4. **Smart Sorting:** AI-powered event order (upcoming first)
5. **Card Themes:** User-customizable card styles
6. **Shared Events:** Show collaborators as avatars on card
7. **Live Updates:** Real-time guest count animation
8. **Weather Integration:** Show weather icon for outdoor events

### Analytics Tracking
```typescript
// User Engagement Metrics
- Swipe velocity (engagement indicator)
- Time spent per card
- Most-viewed events
- Swipe direction patterns
- Card interaction heatmap
```

---

## Success Metrics

### User Engagement
- **Target:** 50% increase in event detail views
- **Target:** 30% more time in app browsing events
- **Target:** 80% user preference for card view over list

### Technical Performance
- **Animation FPS:** 60fps sustained
- **Image Load Time:** <500ms average
- **Crash Rate:** <0.1% on card interactions
- **Memory Usage:** <100MB average

### User Feedback
- **Target NPS:** 8+ rating on new UI
- **Feature Adoption:** 90% of users use card view
- **User Comments:** Positive feedback on "fun" and "engaging"

---

## Resources Required

### Assets
- 10-15 high-quality background images (1080x1920)
- Alternative format images (WebP for size)
- Low-res blur placeholders (50x50)

### Dependencies
```json
{
  "react-native-reanimated": "^3.6.0",
  "react-native-gesture-handler": "^2.14.0",
  "expo-blur": "^13.0.0",
  "react-native-fast-image": "^8.6.3",
  "expo-haptics": "^13.0.0",
  "react-native-linear-gradient": "^2.8.3"
}
```

### Design Time
- UI/UX Design: 2 days
- Prototype: 1 day
- User testing: 1 day

### Development Time
- Phase 1: 3 days (Core card system)
- Phase 2: 2 days (Backgrounds)
- Phase 3: 3 days (3D effects)
- Phase 4: 2 days (Integration)
- **Total:** 10 working days

---

## Implementation Priority

### Must-Have (MVP)
✅ 3-card carousel with swipe
✅ Template-specific backgrounds
✅ Blur and gradient effects
✅ Smooth spring animations
✅ Basic card content display

### Should-Have (V1.1)
🔄 3D perspective transforms
🔄 Velocity-based physics
🔄 Haptic feedback
🔄 Loading skeletons
🔄 Empty/error states

### Nice-to-Have (V2.0)
⏳ Advanced gestures (pinch, rotate)
⏳ Card flip animations
⏳ Custom themes
⏳ Parallax effects
⏳ Analytics tracking

---

## Related Documentation
- `MOBILE_EVENT_PUBLISHING_READY.md` - Current event system
- `MOBILE_IMPLEMENTATION_SUMMARY.md` - Mobile app overview
- Design mockups: `/docs/designs/card-carousel-mockup.fig`
- Animation specs: `/docs/animations/card-physics.md`

---

## Approval & Sign-off

**Product Owner:** _________________  
**Lead Designer:** _________________  
**Lead Developer:** _________________  
**Date:** October 23, 2025

---

**Next Steps:**
1. Review and approve plan
2. Source background images
3. Create design mockups in Figma
4. Begin Phase 1 development
5. Schedule user testing session

**Questions/Concerns:**
- Performance on older devices?
- Background image licensing?
- Accessibility compliance review?
- A/B test with traditional list view?
