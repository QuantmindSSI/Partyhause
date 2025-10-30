# PartyHause UI/UX Design Guide

**Version:** 1.0  
**Last Updated:** October 30, 2025  
**Applies To:** All frontend implementations (Web PWA & Mobile)

---

## Core Design Principles

This document establishes the design standards for PartyHause to ensure consistency, accessibility, and excellent user experience across all platforms.

---

## 1. Layout & Spacing

### Use Space to Group Related Elements
- **Group related content** with consistent spacing (12px-24px)
- **Separate unrelated sections** with larger spacing (32px-48px)
- **Use whitespace** to create breathing room and improve readability
- **Card-based layouts** should have 16px internal padding minimum

**Example:**
```tsx
// ✅ Good - Related elements grouped
<View style={{ gap: 12 }}>
  <Text style={styles.label}>Event Name</Text>
  <TextInput style={styles.input} />
</View>

// ❌ Bad - Inconsistent spacing
<View>
  <Text style={{ marginBottom: 5 }}>Event Name</Text>
  <TextInput style={{ marginTop: 10 }} />
</View>
```

---

## 2. Consistency

### Be Consistent Across the Application
- **Button styles** must be identical for the same action types
- **Input fields** must have uniform styling
- **Spacing units** should follow 4px/8px/12px/16px/24px/32px/48px scale
- **Border radius** should be consistent (8px for cards, 12px for buttons, 24px for pills)
- **Icon sizes** should be standardized (16px, 20px, 24px, 32px)

**Standards:**
```tsx
const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

const BORDER_RADIUS = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};
```

### Ensure Similar Looking Elements Function Similarly
- **Blue buttons** = Primary actions
- **Gray buttons** = Secondary actions
- **Red buttons** = Destructive actions
- **Links** should always be underlined or clearly indicated
- **Disabled states** must be visually obvious (opacity: 0.5)

---

## 3. Visual Hierarchy

### Create a Clear Visual Hierarchy
- **Primary actions** should be most prominent
- **Use size, weight, and color** to establish importance
- **Headlines** should be immediately distinguishable from body text
- **Critical information** should stand out

**Typography Hierarchy:**
```tsx
const TYPOGRAPHY = {
  h1: { fontSize: 32, fontWeight: '700', lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: '700', lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  small: { fontSize: 14, fontWeight: '400', lineHeight: 21 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 18 },
};
```

### Remove Unnecessary Styles
- **Avoid decorative elements** that don't serve a purpose
- **Don't use shadows** unless creating depth is necessary
- **Minimize borders** - use spacing instead
- **Remove gradients** unless they serve a specific UX purpose
- **Simplify color palettes** - fewer colors is better

---

## 4. Color Usage

### Use Colour Purposefully
- **Primary brand color** (#6366F1 - Indigo) for main actions and branding
- **Success** (#10B981 - Green) for positive actions and confirmations
- **Warning** (#F59E0B - Amber) for caution states
- **Error** (#EF4444 - Red) for errors and destructive actions
- **Neutral grays** for text and backgrounds

**Color Palette:**
```tsx
const COLORS = {
  primary: {
    main: '#6366F1',
    light: '#818CF8',
    dark: '#4F46E5',
  },
  success: {
    main: '#10B981',
    light: '#34D399',
    dark: '#059669',
  },
  error: {
    main: '#EF4444',
    light: '#F87171',
    dark: '#DC2626',
  },
  warning: {
    main: '#F59E0B',
    light: '#FBBF24',
    dark: '#D97706',
  },
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
};
```

### Don't Rely on Colour Alone as an Indicator
- **Always pair color with icons or text** for status indicators
- **Use patterns or shapes** in addition to color
- **Provide text alternatives** for color-coded information

**Example:**
```tsx
// ✅ Good - Icon + Color + Text
<View style={styles.successBanner}>
  <Icon name="check-circle" color={COLORS.success.main} />
  <Text>Event created successfully</Text>
</View>

// ❌ Bad - Color only
<View style={{ backgroundColor: 'green' }}>
  <Text>Success</Text>
</View>
```

---

## 5. Accessibility Standards

### Ensure Interface Elements Have a 3:1 Contrast Ratio
- **Buttons, inputs, and interactive elements** must have 3:1 contrast with background
- **Focus states** must be clearly visible
- **Test with accessibility tools** regularly

### Ensure Text Has a 4.5:1 Contrast Ratio
- **Body text** must meet WCAG AA standards (4.5:1)
- **Large text** (18pt+) can use 3:1 ratio
- **Use dark gray instead of pure black** for better readability

**Contrast-Safe Text Colors:**
```tsx
const TEXT_COLORS = {
  primary: '#1F2937',    // Gray 800 - 13.6:1 on white
  secondary: '#4B5563',  // Gray 600 - 7.0:1 on white
  tertiary: '#6B7280',   // Gray 500 - 4.6:1 on white
  onDark: '#F9FAFB',     // Gray 50 - high contrast on dark
};
```

---

## 6. Typography

### Use a Single Sans Serif Typeface
- **System font stack** for optimal performance and native feel
- **Fallback to system defaults** on each platform

```tsx
const FONT_FAMILY = {
  ios: 'SF Pro Display',
  android: 'Roboto',
  web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};
```

### Use a Typeface with Taller Lower Case Letters
- **Prefer typefaces with good x-height** for better readability
- **System fonts** already optimized for this
- **Avoid condensed or compressed fonts** for body text

### Limit the Use of Uppercase
- **Only use uppercase for:**
  - Section labels (sparingly)
  - Acronyms
  - Short labels or tags
- **Never use uppercase for:**
  - Body text
  - Paragraphs
  - Long headings

### Use Regular and Bold Font Weights Only
- **Regular (400)** for body text
- **Semibold (600)** for subheadings
- **Bold (700)** for headings and emphasis
- **Avoid** light (300), medium (500), or black (900) weights

**Font Weight Standards:**
```tsx
const FONT_WEIGHTS = {
  regular: '400',
  semibold: '600',
  bold: '700',
};
```

### Avoid Pure Black Text
- **Use #1F2937 (Gray 800)** instead of #000000
- **Pure black** can cause eye strain and appears too harsh
- **Dark gray** provides better reading comfort

### Left Align Text
- **Always left-align** body text and paragraphs
- **Center-align only for:**
  - Empty states
  - Single-line headings (when appropriate)
  - Modals/dialogs (sparingly)
- **Never right-align** in LTR languages

### Use at Least 1.5 Line Height for Body Text
- **Body text:** 1.5-1.6 line height (24px for 16px text)
- **Headings:** 1.2-1.3 line height
- **Small text:** 1.5 line height minimum

```tsx
const LINE_HEIGHTS = {
  tight: 1.2,    // Headings only
  normal: 1.5,   // Body text
  relaxed: 1.6,  // Long-form content
};
```

---

## 7. Component Standards

### Buttons
```tsx
// Primary Button
const primaryButton = {
  backgroundColor: COLORS.primary.main,
  paddingHorizontal: 24,
  paddingVertical: 12,
  borderRadius: BORDER_RADIUS.lg,
  minHeight: 48,
};

// Secondary Button
const secondaryButton = {
  backgroundColor: 'transparent',
  borderWidth: 1,
  borderColor: COLORS.neutral[300],
  paddingHorizontal: 24,
  paddingVertical: 12,
  borderRadius: BORDER_RADIUS.lg,
  minHeight: 48,
};
```

### Input Fields
```tsx
const input = {
  backgroundColor: COLORS.neutral[50],
  borderWidth: 1,
  borderColor: COLORS.neutral[200],
  borderRadius: BORDER_RADIUS.md,
  paddingHorizontal: 16,
  paddingVertical: 12,
  minHeight: 48,
  fontSize: 16,
  lineHeight: 24,
};
```

### Cards
```tsx
const card = {
  backgroundColor: '#FFFFFF',
  borderRadius: BORDER_RADIUS.lg,
  padding: SPACING.lg,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 2,
};
```

---

## 8. Implementation Checklist

Before merging any UI changes, verify:

- [ ] Spacing follows the 4/8/12/16/24/32/48 scale
- [ ] Related elements are grouped with consistent spacing
- [ ] All buttons of the same type look identical
- [ ] Text contrast meets 4.5:1 ratio (use WebAIM contrast checker)
- [ ] Interactive elements contrast meets 3:1 ratio
- [ ] No pure black (#000000) text is used
- [ ] Body text uses 1.5+ line height
- [ ] Only regular (400) and bold (700) font weights are used
- [ ] No uppercase body text or paragraphs
- [ ] Text is left-aligned (except intentional center-align cases)
- [ ] Color is not the only indicator for status/actions
- [ ] Unnecessary decorative styles are removed
- [ ] Clear visual hierarchy is established
- [ ] Focus states are visible for keyboard navigation

---

## 9. Code Review Standards

### CSS/Style Object Review
When reviewing styles, ask:
1. Is this style necessary?
2. Can this be achieved with spacing instead?
3. Does this match existing patterns?
4. Is the contrast ratio sufficient?
5. Are we using standard spacing values?

### Component Review
When reviewing components, ask:
1. Does this look and behave like similar components?
2. Is the hierarchy clear?
3. Can colorblind users understand this?
4. Can keyboard users navigate this?
5. Is unnecessary complexity removed?

---

## 10. Tools & Resources

### Contrast Checkers
- **WebAIM Contrast Checker:** https://webaim.org/resources/contrastchecker/
- **Colorable:** https://colorable.jxnblk.com/

### Design Tokens
All spacing, colors, and typography values should be imported from:
```tsx
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/constants/theme';
```

### Accessibility Testing
- **Screen reader testing** on iOS VoiceOver and Android TalkBack
- **Keyboard navigation** on web
- **Color blindness simulator** before shipping

---

## 11. Migration Plan

For existing components that don't meet these standards:

1. **Audit phase** - Identify non-compliant components
2. **Prioritize** - Focus on high-traffic screens first
3. **Refactor** - Update one component at a time
4. **Test** - Verify accessibility and visual consistency
5. **Document** - Note any exceptions with justification

---

## Questions?

If you're unsure whether a design meets these standards, ask:
- "Is this as simple as it can be?"
- "Would this work for someone with low vision?"
- "Is this consistent with the rest of the app?"
- "Can I understand this without color?"

**When in doubt, simplify.**

---

**Remember:** Good design is invisible. Users shouldn't notice the interface—they should accomplish their goals effortlessly.
