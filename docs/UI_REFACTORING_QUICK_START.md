# UI Refactoring Quick Start Guide

## 🎯 Current Progress
✅ Design system created  
✅ 3 professional components built  
✅ Explore screen refactored  
✅ Expo server running  

## 🚀 Test the New Design Now

### On Your Phone
1. Open **Expo Go** app
2. Scan the QR code in your terminal
3. Navigate to the **Explore** tab
4. See the new gradient cards and professional UI!

### On Simulator
```bash
# iOS
cd apps/mobile && npm run ios

# Android
cd apps/mobile && npm run android

# Web
cd apps/mobile && npm run web
```

---

## 🎨 Apply Design to Other Screens

### Next Screens to Refactor

#### 1. Home/Dashboard (`/apps/mobile/app/(tabs)/index.tsx`)
**Current:** Default template  
**Needs:**
- Hero section with user greeting
- Event cards using `ModernCard`
- Professional button for "Create Event"
- Stats/metrics section

**Quick Start:**
```tsx
import { ProfessionalButton } from '@/components/ui/ProfessionalButton';
import { ModernCard } from '@/components/ui/ModernCard';
import { Colors, Typography, Spacing } from '@/constants/design-system';
```

#### 2. Event Details (`/apps/mobile/app/events/[id]/index.tsx`)
**Current:** Basic details view  
**Needs:**
- Hero image/gradient header
- ModernCard for sections (details, guests, timeline)
- Professional action buttons
- Status badges with new colors

#### 3. Guest Management (`/apps/mobile/components/screens/GuestManagementScreen.tsx`)
**Current:** Table-like list  
**Needs:**
- Guest cards using ModernCard
- RSVP status with new color palette
- Professional filter/sort controls
- Empty state design

---

## 🧩 Create More Components

### Recommended Next Components

#### 1. ProfessionalInput
```typescript
// Location: /apps/mobile/components/ui/ProfessionalInput.tsx
// Features: Label, error states, icons, validation
```

#### 2. StatusBadge
```typescript
// Location: /apps/mobile/components/ui/StatusBadge.tsx
// Features: RSVP statuses with new color palette
// Variants: attending, declined, maybe, pending
```

#### 3. EmptyState
```typescript
// Location: /apps/mobile/components/ui/EmptyState.tsx
// Features: Icon/emoji, title, subtitle, CTA button
```

#### 4. SectionHeader
```typescript
// Location: /apps/mobile/components/ui/SectionHeader.tsx
// Features: Title, subtitle, optional action button
```

#### 5. GuestCard
```typescript
// Location: /apps/mobile/components/ui/GuestCard.tsx
// Features: Avatar, name, status, swipe actions
```

---

## 📖 Design System Usage

### Import What You Need
```typescript
import {
  Colors,          // Color palette
  Typography,      // Font styles
  Spacing,         // Margins/padding
  Radius,          // Border radius
  Shadows,         // Elevation shadows
  ButtonVariants,  // Button styles
  Layout,          // Container sizes
} from '@/constants/design-system';
```

### Example: Create a Styled View
```typescript
const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    borderRadius: Radius.md,
    backgroundColor: Colors.background.elevated,
    ...Shadows.md,
  },
  title: {
    ...Typography.h2,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
});
```

---

## 🎨 Color Usage Guide

### When to Use Each Color

#### Brand Colors
```typescript
// Primary actions, headers, CTAs
Colors.brand[500]  // Main brand color
Colors.brand[600]  // Hover/pressed state
Colors.brand[400]  // Lighter variant
```

#### Accent Colors
```typescript
// Important CTAs, highlights, badges
Colors.accent[500]  // Main accent
Colors.accent[600]  // Hover state
```

#### Success/Error/Warning
```typescript
// Status indicators, notifications
Colors.success[500]  // Completed, confirmed
Colors.error[500]    // Failed, declined
Colors.warning[500]  // Pending, attention needed
```

#### Neutrals
```typescript
// Backgrounds, borders, disabled states
Colors.neutral[0]    // Pure white
Colors.neutral[50]   // Light background
Colors.neutral[200]  // Borders
Colors.neutral[500]  // Secondary text
Colors.neutral[900]  // Primary text
```

---

## 🔄 Refactoring Pattern

### Step-by-Step Process

1. **Identify Screen/Component**
   - Open the file
   - Note current styling approach

2. **Plan Layout**
   - Sketch on paper or use Figma
   - Identify sections/components
   - Note spacing and hierarchy

3. **Replace Imports**
   ```typescript
   // Remove old
   import { ThemedText } from '@/components/themed-text';
   
   // Add new
   import { Colors, Typography, Spacing } from '@/constants/design-system';
   ```

4. **Update Styles**
   ```typescript
   // Old
   const styles = StyleSheet.create({
     title: {
       fontSize: 24,
       fontWeight: 'bold',
       color: '#1F2937',
       marginBottom: 16,
     },
   });
   
   // New
   const styles = StyleSheet.create({
     title: {
       ...Typography.h2,
       color: Colors.text.primary,
       marginBottom: Spacing.md,
     },
   });
   ```

5. **Add Components**
   ```typescript
   // Replace basic buttons
   <TouchableOpacity style={styles.button}>
     <Text>Click Me</Text>
   </TouchableOpacity>
   
   // With professional button
   <ProfessionalButton
     title="Click Me"
     onPress={handlePress}
     variant="primary"
     size="medium"
   />
   ```

6. **Test & Iterate**
   - Save file (Metro will auto-reload)
   - Check in Expo Go
   - Adjust spacing/colors as needed

---

## 🎬 Create Marketing Screenshots

### Best Screens to Capture

1. **Explore Tab** ✅ (Already done!)
   - Gradient hero header
   - Colorful template cards
   - Shows design system

2. **Event Details** (Next)
   - Hero section
   - Modern cards for info
   - Action buttons

3. **Guest List** (Next)
   - Professional list/cards
   - Status badges
   - Filters/search

4. **Create Event Flow** (Next)
   - Step-by-step wizard
   - Professional inputs
   - Progress indicator

### Screenshot Tips
- Use real (but fake) data
- Fill in all fields
- Show various states (empty, loaded, selected)
- Capture both light backgrounds and gradient headers

---

## 🐛 Troubleshooting

### Common Issues

#### "Module not found" error
```bash
# Clear Metro bundler cache
cd apps/mobile
npx expo start -c
```

#### TypeScript errors
```bash
# Restart TypeScript server in VS Code
Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

#### Expo Go not connecting
```bash
# Ensure same WiFi network
# Check firewall settings
# Try tunnel mode:
npx expo start --tunnel
```

#### Colors not showing
```typescript
// Check import path
import { Colors } from '@/constants/design-system';  // ✅
import { Colors } from '@/constants/theme';          // ❌ Old file
```

---

## 📝 Code Snippets

### Quick Component Template

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadows,
} from '@/constants/design-system';

interface YourComponentProps {
  title: string;
}

export const YourComponent: React.FC<YourComponentProps> = ({ title }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    borderRadius: Radius.md,
    backgroundColor: Colors.background.elevated,
    ...Shadows.md,
  },
  title: {
    ...Typography.h3,
    color: Colors.text.primary,
  },
});
```

---

## 🎯 Goals

### This Week
- [ ] Refactor Home/Dashboard screen
- [ ] Create StatusBadge component
- [ ] Create ProfessionalInput component
- [ ] Refactor Event Details screen

### Next Week
- [ ] Refactor Guest Management
- [ ] Create GuestCard component
- [ ] Refactor Create Event flow
- [ ] Add animations/transitions

### This Month
- [ ] All screens refactored
- [ ] Component library complete
- [ ] Marketing screenshots taken
- [ ] Video storyboards filmed

---

## 🆘 Need Help?

### Resources
- Design System: `/apps/mobile/constants/design-system.ts`
- Components: `/apps/mobile/components/ui/`
- Examples: `/apps/mobile/app/(tabs)/explore.tsx`
- Colors: Use Color palette in design-system.ts
- Typography: Use Typography system in design-system.ts

### Questions?
Check existing components for patterns or reference:
- Airbnb app (for layout inspiration)
- Stripe dashboard (for professional look)
- Linear app (for crisp buttons)

---

**Happy refactoring! The foundation is solid. Now make it beautiful across the entire app! 🎨✨**
