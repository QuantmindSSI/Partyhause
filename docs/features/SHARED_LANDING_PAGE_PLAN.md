# 🎨 Shared Landing Page Implementation Plan

**Goal:** Use the same landing page on both web and mobile applications

**Current Status:** Web app uses `LandingPageCreative.tsx` with framer-motion animations

---

## 📋 Implementation Strategy

### **Option 1: Create Shared Package (Recommended)**
Move the landing page to `packages/core` and make it platform-agnostic

**Pros:**
- ✅ True code sharing
- ✅ Single source of truth
- ✅ Easy to maintain
- ✅ Can add platform-specific optimizations

**Cons:**
- ⚠️ Need to adapt web-specific dependencies
- ⚠️ framer-motion needs React Native equivalent

### **Option 2: React Native Web in Mobile**
Use react-native-web to render web components in mobile

**Pros:**
- ✅ Minimal changes to existing code
- ✅ Can use existing web components

**Cons:**
- ⚠️ May have performance issues
- ⚠️ Styling conflicts possible
- ⚠️ Bundle size increases

### **Option 3: Platform-Specific Implementations**
Create separate but visually identical landing pages

**Pros:**
- ✅ Optimized for each platform
- ✅ No compatibility issues
- ✅ Best performance

**Cons:**
- ❌ Code duplication
- ❌ Hard to maintain consistency
- ❌ Double work for updates

---

## 🎯 Recommended Approach: Hybrid Strategy

1. **Create shared core package** with:
   - Landing page content (text, data)
   - Layout structure (components)
   - Business logic

2. **Platform-specific rendering**:
   - Web: Use existing framer-motion
   - Mobile: Use react-native-reanimated (similar API)

3. **Shared styles**:
   - Define design tokens
   - Use platform-appropriate styling

---

## 📦 Dependencies to Address

### Web Dependencies (Current):
```tsx
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { usePartyStore } from '@/store/usePartyStore';
import { Calendar, Sparkles, ArrowRight, Play, Heart, Wand2, Lightbulb, Coffee, BookOpen, ChevronDown } from 'lucide-react';
```

### Mobile Equivalents:
- `framer-motion` → `react-native-reanimated` + `react-native-gesture-handler`
- `@/components/ui/button` → React Native `Pressable` + custom styling
- `lucide-react` → `@expo/vector-icons` or `react-native-vector-icons`
- `usePartyStore` → Already using Zustand (✅ works on both)

---

## 🛠️ Implementation Steps

### Phase 1: Setup Shared Package
1. Create `packages/shared-ui/`
2. Extract landing page data to shared package
3. Create platform-agnostic component structure

### Phase 2: Adapt for Mobile
1. Install React Native animation libraries
2. Create mobile-specific Button component
3. Replace Lucide icons with Expo icons
4. Test responsive layout

### Phase 3: Integration
1. Import shared components in mobile app
2. Connect to navigation system
3. Test on iOS and Android
4. Polish animations and transitions

---

## 🎨 Design Considerations

### Elements to Preserve:
- ✅ Hero section with video background
- ✅ Experience archetypes cards
- ✅ Features showcase
- ✅ Social proof / testimonials
- ✅ CTA buttons
- ✅ Color scheme and branding

### Platform-Specific Adaptations:
- **Mobile:** Vertical scrolling (no horizontal scroll)
- **Mobile:** Touch-optimized button sizes
- **Mobile:** Native video player
- **Mobile:** Simplified animations (better performance)
- **Mobile:** Bottom navigation instead of top nav

---

## 📱 Mobile Landing Page Structure

```
┌─────────────────────────────────────────┐
│  🎉 PartyHause Logo                     │
├─────────────────────────────────────────┤
│                                         │
│  [Hero Video/Image Background]          │
│                                         │
│  Create Unforgettable                   │
│  Experiences                            │
│                                         │
│  Transform ordinary moments into        │
│  extraordinary memories                 │
│                                         │
│  [Get Started] [Sign In]                │
│                                         │
├─────────────────────────────────────────┤
│  ✨ Features                            │
│                                         │
│  📅 Smart Event Planning                │
│  📧 Beautiful Invitations               │
│  👥 Guest Management                    │
│  📊 Real-time Analytics                 │
│                                         │
├─────────────────────────────────────────┤
│  🎭 Experience Archetypes               │
│                                         │
│  [Card 1: The Intimate Curator]         │
│  [Card 2: The Bold Creator]             │
│  [Card 3: The Mindful Host]             │
│  [Card 4: The Culture Catalyst]         │
│                                         │
├─────────────────────────────────────────┤
│  💬 Testimonials                        │
│  ⭐⭐⭐⭐⭐                              │
│                                         │
├─────────────────────────────────────────┤
│  [Start Creating Events]                │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔄 Data Structure (Shared)

```typescript
// packages/shared-ui/landing-data.ts

export interface LandingPageData {
  hero: {
    title: string;
    subtitle: string;
    video?: string;
    ctaButtons: Array<{
      label: string;
      variant: 'primary' | 'secondary';
      action: string;
    }>;
  };
  
  features: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  
  archetypes: Array<{
    title: string;
    description: string;
    icon: string;
    color: string;
  }>;
  
  testimonials: Array<{
    name: string;
    quote: string;
    rating: number;
    image?: string;
  }>;
}

export const landingPageData: LandingPageData = {
  hero: {
    title: "Create Unforgettable Experiences",
    subtitle: "Transform ordinary moments into extraordinary memories",
    video: "/videos/Video_concept_lively_202509130901.mp4",
    ctaButtons: [
      { label: "Get Started", variant: "primary", action: "create_event" },
      { label: "Sign In", variant: "secondary", action: "sign_in" }
    ]
  },
  // ... rest of data
};
```

---

## 🚀 Quick Implementation (Mobile-First)

If you want to start quickly, I can:

1. **Create a simplified mobile landing screen** that matches web design
2. **Use React Native components** (ScrollView, View, Text, Pressable)
3. **Add basic animations** with react-native-reanimated
4. **Connect to existing navigation** (Expo Router)
5. **Share business logic** via Zustand store

This approach gets you up and running fast, then we can refine later.

---

## ✅ Next Steps

**Choose your approach:**

**A) Quick Mobile Implementation** (2-3 hours)
- Create mobile-native landing screen
- Match web design visually
- Connect to auth flow

**B) Shared Package Approach** (1-2 days)
- Extract to shared package
- Platform-specific rendering
- Full feature parity

**C) React Native Web Approach** (1 day)
- Configure react-native-web
- Import web components
- Test compatibility

---

**Which approach would you like to take?** 🎯

I recommend **Option A (Quick Mobile Implementation)** to get something working fast, then gradually refactor to shared package later.
