# Card UI Visual Reference

## 🎨 Layout Structure

```
┌─────────────────────────────────────┐
│         Dashboard Header            │
│  Hey there! 👋                      │
│  thecommodore30@gmail.com           │
│                    [Drafts][Sign Out]│
├─────────────────────────────────────┤
│                                     │
│  Your Events                        │
│  4 events • Swipe to navigate      │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ ╔═══════════════════════════╗ │ │  
│  │ ║    [Left Card Preview]    ║ │ │  <- Scale: 0.8, Opacity: 0.5
│  │ ╚═══════════════════════════╝ │ │     Rotated slightly right
│  │                               │ │
│  │   ╔═══════════════════════╗   │ │
│  │   ║                       ║   │ │
│  │   ║   [CENTER CARD]       ║   │ │  <- Scale: 1.0, Opacity: 1.0
│  │   ║   (In Focus)          ║   │ │     Main interaction target
│  │   ║                       ║   │ │
│  │   ╚═══════════════════════╝   │ │
│  │                               │ │
│  │ ╔═══════════════════════════╗ │ │
│  │ ║   [Right Card Preview]    ║ │ │  <- Scale: 0.8, Opacity: 0.5
│  │ ╚═══════════════════════════╝ │ │     Rotated slightly left
│  └───────────────────────────────┘ │
│                                     │
│                          ┌────┐    │
│                          │ +  │    │  <- Floating Action Button
│                          └────┘    │
└─────────────────────────────────────┘
```

## 📏 Card Dimensions

```
Card Size:
- Width: 85% of screen width (~320px on typical phone)
- Height: 65% of screen height (~550px on typical phone)
- Border Radius: 24px
- Shadow: Elevation 10 (soft shadow below card)

Side Card Transform:
- Scale: 0.8 (80% of center card size)
- Opacity: 0.5 (50% transparency)
- Translate X: ±(Card Width + 20px spacing)
- Rotate Y: ±10-20 degrees (perspective effect)

Center Card:
- Scale: 1.0 (full size)
- Opacity: 1.0 (fully opaque)
- Translate X: 0
- Rotate Y: 0 degrees
```

## 🎴 Individual Card Structure

```
┌─────────────────────────────────────┐
│ Background: Template-specific image │
│ Blur: 20px Gaussian                 │
│ Overlay: Dark gradient              │
│ ┌─────────────────────────────────┐ │
│ │ ┌──────────┐        ┌────────┐ │ │  <- HEADER
│ │ │🎂 BIRTHDAY│        │PUBLISHED│ │ │     Template Badge + Status
│ │ └──────────┘        └────────┘ │ │
│ │                                 │ │
│ │                                 │ │
│ │         John's 30th             │ │  <- BODY
│ │         Birthday Bash           │ │     Title (large, bold)
│ │                                 │ │
│ │  An epic celebration...         │ │     Description (2 lines max)
│ │                                 │ │
│ │  📍 Downtown Loft               │ │     Location
│ │  📅 Dec 15, 2025 • 8:00 PM     │ │     Date & Time
│ │                                 │ │
│ │  👥 Guests  ⏱ Timeline  🖼 Media│ │     Quick Stats
│ │                                 │ │
│ │                                 │ │
│ │  ┌───────────────────────────┐ │ │  <- FOOTER
│ │  │   View Details        →   │ │ │     CTA Button
│ │  └───────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## 🌈 Template Color Schemes

### Birthday (Orange/Amber)
```
Primary:   #f59e0b (amber-500)
Accent:    #fbbf24 (amber-400)
Background: #fef3c7 (amber-100)
Text:      #78350f (amber-900)
Icon:      🎂 balloon
Image:     Party balloons & confetti
```

### Wedding (Pink/Rose)
```
Primary:   #ec4899 (pink-500)
Accent:    #f472b6 (pink-400)
Background: #fce7f3 (pink-100)
Text:      #831843 (pink-900)
Icon:      💕 heart
Image:     Wedding venue & flowers
```

### Product Launch (Purple/Violet)
```
Primary:   #8b5cf6 (violet-500)
Accent:    #a78bfa (violet-400)
Background: #ede9fe (violet-100)
Text:      #4c1d95 (violet-900)
Icon:      🚀 rocket
Image:     Tech/product display
```

### Conference (Blue)
```
Primary:   #3b82f6 (blue-500)
Accent:    #60a5fa (blue-400)
Background: #dbeafe (blue-100)
Text:      #1e3a8a (blue-900)
Icon:      👥 people
Image:     Conference hall
```

### Corporate (Indigo)
```
Primary:   #6366f1 (indigo-500)
Accent:    #818cf8 (indigo-400)
Background: #e0e7ff (indigo-100)
Text:      #312e81 (indigo-900)
Icon:      💼 briefcase
Image:     Office/business setting
```

## 🎬 Animation Timeline

### Swipe Left Animation (400-600ms)
```
Frame 1 (0ms):     Center card at position 0, scale 1.0
                   Right card at +340px, scale 0.8

Frame 2 (50ms):    User starts dragging left
                   translateX begins decreasing

Frame 3 (150ms):   Card follows finger at -120px
                   rotateY increases to -5deg

Frame 4 (200ms):   User releases (velocity > 500px/s)
                   Spring animation starts

Frame 5 (300ms):   Card animates to -340px
                   Scale decreases to 0.8
                   Opacity fades to 0.5
                   rotateY reaches -15deg

Frame 6 (400ms):   Right card animates to 0
                   Scale increases to 1.0
                   Opacity increases to 1.0
                   rotateY resets to 0deg

Frame 7 (500ms):   Spring settles
                   New card snaps into center
                   Haptic feedback triggers
```

### Canceled Swipe (Spring Back)
```
Frame 1:  User drags card -80px (below threshold)
Frame 2:  User releases
Frame 3:  Spring animation starts
Frame 4:  Card bounces back toward 0
Frame 5:  Card overshoots to +10px (spring overshoot)
Frame 6:  Card settles back to 0 (damping effect)
```

## 🎯 Touch Zones

```
┌─────────────────────────────────────┐
│ [Template Badge] [Status Badge]     │ <- Tap: No action (display only)
│                                     │
│                                     │
│         [Event Title]               │ <- Tap: Navigate to details
│         [Event Description]         │    Haptic: Medium impact
│                                     │
│     [Location] [Date/Time]          │ <- Tap: Navigate to details
│     [Quick Stats Row]               │
│                                     │
│  ┌───────────────────────────────┐ │
│  │   [View Details Button]       │ │ <- Tap: Navigate to details
│  └───────────────────────────────┘ │    Haptic: Medium impact
└─────────────────────────────────────┘

Swipe Gestures (anywhere on card):
- Swipe Left:  Next card (if available)
- Swipe Right: Previous card (if available)
- Swipe Up:    Quick preview (Phase 2)
- Swipe Down:  Archive/hide (Phase 2)
```

## 🎨 Background Effects Breakdown

```
Layer 1: Background Image (bottom)
         │ Source: Unsplash or custom asset
         │ Size: Cover (fills card)
         │ Quality: 800x600 @ 80% quality
         └─────────────────────────────

Layer 2: Blur Effect
         │ Blur Radius: 20px Gaussian
         │ Applied to: Background image
         └─────────────────────────────

Layer 3: Gradient Overlay
         │ Type: Linear gradient
         │ Direction: Top to bottom
         │ Stops:
         │   0%:   rgba(0,0,0,0.7)  <- Dark at top
         │   50%:  rgba(0,0,0,0.0)  <- Transparent middle
         │   100%: rgba(0,0,0,0.3)  <- Semi-dark bottom
         └─────────────────────────────

Layer 4: Content (top)
         │ All text, badges, buttons
         │ Color: White (#ffffff)
         │ Text Shadow: 0 2px 4px rgba(0,0,0,0.3)
         └─────────────────────────────
```

## 📱 Responsive Behavior

### Small Phones (< 375px width)
- Card width: 90% of screen
- Card height: 60% of screen
- Font sizes reduced by 10%
- Padding reduced to 16px

### Large Phones (> 400px width)
- Card width: 85% of screen (default)
- Card height: 65% of screen
- Standard font sizes
- Padding: 20px

### Tablets
- Card width: 600px max (fixed)
- Card height: 70% of screen
- Increased font sizes by 15%
- Padding: 24px

## 🔄 State Transitions

```
State: Loading
├─ Show loading skeleton
├─ Pulse animation on placeholder
└─ Fade in when images load

State: Empty (No Events)
├─ Hide carousel
├─ Show empty state card
├─ Display "Create First Event" CTA
└─ No gestures active

State: Single Event
├─ Show only center card
├─ Hide side preview cards
├─ Disable swipe gestures
└─ Tap to view details works

State: Multiple Events
├─ Show 3-card layout
├─ Enable all gestures
├─ Show card counter/indicator
└─ Full interaction enabled

State: First Card
├─ Hide left preview
├─ Disable right swipe
├─ Show only center + right preview
└─ Left swipe active

State: Last Card
├─ Hide right preview
├─ Disable left swipe
├─ Show only center + left preview
└─ Right swipe active
```

## 🎭 Performance Targets

```
Metric                Target    Critical
─────────────────────────────────────────
Frame Rate           60 FPS    > 50 FPS
Animation Start      < 16ms    < 50ms
Image Load Time      < 500ms   < 1000ms
Gesture Latency      < 16ms    < 33ms
Memory Usage         < 80MB    < 120MB
JS Thread Block      < 16ms    < 50ms
UI Thread Block      < 8ms     < 16ms
```

---

**Visual Reference Version**: 1.0  
**Last Updated**: October 23, 2025  
**Implementation Phase**: Phase 1 Complete
