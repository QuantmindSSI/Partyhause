# Tinder-Style Card UI Testing Guide

## 🚀 Implementation Status

### ✅ Phase 1 Complete - Core Card System
All components have been successfully implemented and integrated:

1. **EventCard Component** (`apps/mobile/components/cards/EventCard.tsx`)
   - ✅ Template-specific background images (12 template types)
   - ✅ 20px Gaussian blur effect
   - ✅ Gradient overlay for text contrast
   - ✅ Animated 3D transforms (scale, opacity, rotateY)
   - ✅ Header with template badge and status
   - ✅ Body with title, description, location, date
   - ✅ Footer with CTA button

2. **EventCardCarousel Component** (`apps/mobile/components/cards/EventCardCarousel.tsx`)
   - ✅ 3-card layout (center + left/right previews)
   - ✅ Pan gesture handling
   - ✅ Spring animations (damping:20, stiffness:150)
   - ✅ Swipe thresholds (500 px/s velocity, 25% distance)
   - ✅ Haptic feedback on navigation and tap
   - ✅ Automatic navigation to event details

3. **DashboardScreen Integration**
   - ✅ Replaced list view with EventCardCarousel
   - ✅ Event data transformation
   - ✅ Maintained empty state handling
   - ✅ Added swipe hint in subtitle

4. **Configuration**
   - ✅ Reanimated plugin added to app.json
   - ✅ GestureHandlerRootView wrapper added
   - ✅ All dependencies installed (reanimated, gesture-handler, blur, haptics, linear-gradient)

---

## 📱 Testing Instructions

### Prerequisites
- ✅ Expo server is running with tunnel: `npx expo start --tunnel`
- ✅ Mobile device with Expo Go app installed
- ✅ Logged in as: thecommodore30@gmail.com
- ✅ 4 events exist in Supabase database

### Test Scenarios

#### 1. **Initial Load Test**
**Goal**: Verify cards load and display correctly

**Steps**:
1. Open Expo Go and scan QR code
2. Log in if not already authenticated
3. Navigate to Dashboard (home tab)

**Expected Results**:
- [ ] Cards load without errors
- [ ] Center card is fully visible and in focus
- [ ] Side cards (left/right) are partially visible at reduced scale (0.8x)
- [ ] Background images load from Unsplash
- [ ] Blur effect is visible on background
- [ ] Gradient overlay provides good text contrast
- [ ] Template badge shows correct template type
- [ ] Status badge shows event status (PUBLISHED/DRAFT/etc)
- [ ] Event title, location, and date are clearly readable

#### 2. **Swipe Navigation Test**
**Goal**: Test gesture-based navigation

**Left Swipe (Next Card)**:
1. Swipe center card to the left quickly
2. Observe animation and card transition

**Expected**:
- [ ] Haptic feedback triggers (light impact)
- [ ] Card animates smoothly to the left
- [ ] Next card slides into center position
- [ ] Spring animation feels natural (not too stiff)
- [ ] Card scales up to 1.0 and opacity to 1.0
- [ ] Previous cards remain visible on left side

**Right Swipe (Previous Card)**:
1. Swipe center card to the right quickly
2. Observe animation and card transition

**Expected**:
- [ ] Haptic feedback triggers
- [ ] Card animates smoothly to the right
- [ ] Previous card slides into center position
- [ ] Animation timing matches left swipe

**Slow Drag (Cancel Swipe)**:
1. Drag card slowly to the left/right (below threshold)
2. Release without completing swipe

**Expected**:
- [ ] Card springs back to center position
- [ ] No navigation occurs
- [ ] Animation is smooth and responsive

#### 3. **3D Transform Test**
**Goal**: Verify perspective and rotation effects

**Steps**:
1. Swipe cards and observe rotation during animation
2. Notice scale and opacity changes on side cards

**Expected**:
- [ ] Center card has rotateY: 0deg
- [ ] Left card has positive rotateY (appears rotated)
- [ ] Right card has negative rotateY
- [ ] Perspective effect is noticeable but not excessive
- [ ] Side cards are at 0.8 scale and 0.5 opacity
- [ ] Transforms interpolate smoothly during swipe

#### 4. **Template Variety Test**
**Goal**: Verify different template types render correctly

**Steps**:
1. Swipe through all 4 events
2. Check if each has appropriate template styling

**Expected** (for each template type):
- [ ] Birthday: Orange/amber theme, balloons icon, party image
- [ ] Wedding: Pink/rose theme, heart icon, wedding image
- [ ] Product Launch: Purple theme, rocket icon, product image
- [ ] Conference: Blue theme, people icon, conference image
- [ ] Corporate: Indigo theme, briefcase icon, office image
- [ ] (Others if available): Appropriate colors, icons, and images

#### 5. **Card Tap Test**
**Goal**: Verify navigation to event details

**Steps**:
1. Tap on the center card (anywhere except scrollable content)
2. Verify navigation occurs

**Expected**:
- [ ] Haptic feedback triggers (medium impact)
- [ ] Navigates to `/events/[id]` route
- [ ] Event details page loads correctly
- [ ] Back navigation returns to dashboard
- [ ] Card position is maintained after returning

#### 6. **Edge Cases Test**

**Single Event**:
- [ ] Only center card visible
- [ ] No side preview cards
- [ ] Swipe gestures do nothing (no crash)

**No Events**:
- [ ] Empty state displays correctly
- [ ] "Create Your First Event" button visible
- [ ] No card carousel rendered

**Many Events** (if you create more):
- [ ] Smooth navigation through 5+ events
- [ ] Cards are properly recycled (no memory issues)
- [ ] Performance remains smooth at 60fps

#### 7. **Performance Test**
**Goal**: Verify smooth animations and responsiveness

**Steps**:
1. Rapidly swipe between cards (3+ quick swipes)
2. Monitor for frame drops or jank
3. Check memory usage in Expo dev tools

**Expected**:
- [ ] Animations maintain 60fps
- [ ] No stuttering or lag
- [ ] Gestures respond immediately
- [ ] Images load within 500ms
- [ ] App memory stays below 100MB

---

## 🐛 Known Issues & Workarounds

### Issue: Images Not Loading
**Symptoms**: Background shows solid color instead of image
**Cause**: Unsplash API rate limit or network issue
**Workaround**: Wait a moment and refresh, or update `templateBackgrounds.ts` with different image URLs

### Issue: Blur Effect Not Visible
**Symptoms**: Background image is sharp, no blur
**Cause**: expo-blur may need native rebuild
**Workaround**: 
```bash
cd apps/mobile
npx expo prebuild --clean
```

### Issue: Gestures Not Working
**Symptoms**: Can't swipe cards, no response to touch
**Cause**: GestureHandlerRootView not wrapping app
**Fix**: Already implemented in `app/_layout.tsx` - restart Expo if issue persists

### Issue: "Cannot find module @/utils/templateBackgrounds"
**Symptoms**: Import error on card component
**Cause**: TypeScript path mapping issue
**Fix**: Restart Expo dev server and clear cache:
```bash
npx expo start --clear
```

---

## 🎯 Success Criteria

The card UI implementation is successful if:

1. ✅ All cards render with correct backgrounds and content
2. ✅ Swipe gestures work smoothly in both directions
3. ✅ 3D transforms (scale, rotate, opacity) are visible and smooth
4. ✅ Haptic feedback provides tactile response
5. ✅ Navigation to event details works on tap
6. ✅ Animations run at 60fps without jank
7. ✅ Template-specific styling displays correctly
8. ✅ Empty state and single-event scenarios handled gracefully

---

## 🔧 Troubleshooting Commands

### Restart Expo with Clean Cache
```bash
cd apps/mobile
npx expo start --clear --tunnel
```

### Rebuild Native Modules
```bash
cd apps/mobile
npx expo prebuild --clean
npx expo run:android  # or run:ios
```

### Check Installed Packages
```bash
cd apps/mobile
npm list react-native-reanimated react-native-gesture-handler expo-blur
```

### View Expo Logs
```bash
# In Expo Go app: Shake device > Debug Remote JS
# Or check terminal output for errors
```

---

## 📊 Next Steps (Phase 2-4)

### Phase 2: Enhanced Interactions (Week 2, Days 1-2)
- [ ] Swipe up for quick preview modal
- [ ] Swipe down to archive/hide event
- [ ] Long press for action menu
- [ ] Double tap to favorite/bookmark

### Phase 3: Advanced 3D Effects (Week 2, Days 3-4)
- [ ] Velocity-based throw animations
- [ ] Parallax background motion
- [ ] Depth shadows based on card position
- [ ] Card stack depth visualization

### Phase 4: Polish & Optimization (Week 2, Day 5)
- [ ] Custom background images (replace Unsplash)
- [ ] Loading skeletons for cards
- [ ] Error state handling
- [ ] Analytics tracking
- [ ] Performance profiling
- [ ] Memory optimization

---

## 📝 Testing Checklist

Use this checklist during your testing session:

**Visual Checks**:
- [ ] Background images load
- [ ] Blur effect visible (20px)
- [ ] Gradient overlay present
- [ ] Text is readable on all backgrounds
- [ ] Template badges have correct colors
- [ ] Status badges show proper state
- [ ] Icons render correctly

**Interaction Checks**:
- [ ] Left swipe navigates to next card
- [ ] Right swipe navigates to previous card
- [ ] Incomplete swipes spring back
- [ ] Tap opens event details
- [ ] Haptic feedback on all interactions
- [ ] Gestures feel responsive

**Animation Checks**:
- [ ] Spring animation feels natural
- [ ] 3D rotations visible during swipe
- [ ] Scale transitions smooth
- [ ] Opacity fades correctly
- [ ] 60fps maintained throughout

**Edge Case Checks**:
- [ ] First card (can't swipe right)
- [ ] Last card (can't swipe left)
- [ ] Single event scenario
- [ ] Empty state scenario
- [ ] Rapid swipe handling

---

## 📞 Support

If you encounter any issues:

1. Check terminal output for errors
2. Review this guide's troubleshooting section
3. Clear Expo cache and restart
4. Check that all dependencies are installed
5. Verify app.json has reanimated plugin
6. Ensure GestureHandlerRootView is wrapping app

---

**Implementation Date**: October 23, 2025  
**Status**: ✅ Ready for Testing  
**Developer**: GitHub Copilot  
**Version**: Phase 1 Complete
