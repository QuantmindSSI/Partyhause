# PartyBoard Phase 2 - Comprehensive Testing Guide 🧪

## 🚀 Before You Start

### **Start the Expo Server:**

```bash
cd /Users/startferanmi/Data-Scientist/Partyhause/apps/mobile
npm start -- --tunnel --clear
```

**Expected Output:**
```
Starting Metro Bundler
› Metro waiting on exp://...
› Tunnel ready
```

**Scan QR Code:**
- iOS: Use Camera app
- Android: Use Expo Go app

---

## 📋 Phase 2 Testing Checklist

### **Test 1: Navigation to PartyBoard** ✅

**Steps:**
1. Launch app on your device
2. Tap any event (or create a new one)
3. Scroll to "Manage Event" section
4. Tap "Collaboration Hub" card
5. Verify you see 3 options: Polls, Debates, PartyBoard
6. Tap "PartyBoard" button

**Expected Results:**
- ✅ PartyBoard screen loads without crash
- ✅ Header shows "PartyBoard" title
- ✅ Back button visible (left)
- ✅ Three action buttons visible (right): brush, list, add
- ✅ Empty canvas with placeholder message
- ✅ Divider with three dots (⋮⋮⋮)
- ✅ Stats bar shows: "4 ideas | 2 tasks | 65 votes"
- ✅ Category filters visible: All, Venue, Entertainment, Food, etc.
- ✅ Four mock list items visible
- ✅ "Add New Item" button at bottom

**Screenshot:** Take a screenshot of the initial empty state

---

### **Test 2: Modal Opening (3 Methods)** ✅

#### **Method A: Header "+" Button**

**Steps:**
1. Tap the purple "+" button in top-right header
2. Observe modal animation

**Expected Results:**
- ✅ Modal slides up from bottom
- ✅ "Add to Mood Board" title visible
- ✅ 6 sticky type cards displayed:
  - 📝 Write Note (orange)
  - 📸 Upload Image (pink)
  - 🔗 Paste Link (blue)
  - 🎥 Add Video (red)
  - 💰 Track Cost (green)
  - ✓ Create Checklist (purple)
- ✅ Each card shows icon, label, description
- ✅ Close button (X) in top-left

**Test:**
- Tap "X" to close
- ✅ Modal slides down smoothly

#### **Method B: Double-Tap Canvas**

**Steps:**
1. **Double-tap** (two quick taps) on the empty canvas area
2. Watch for modal

**Expected Results:**
- ✅ Modal opens immediately on second tap
- ✅ Same modal as Method A
- ✅ No delay or lag

**Note:** If single tap only, try tapping faster!

#### **Method C: List "Add New Item" Button**

**Steps:**
1. Scroll down to list section
2. Tap dashed "Add New Item" button at bottom
3. Observe modal

**Expected Results:**
- ✅ Modal opens (will be implemented in Phase 3)
- ⏳ For now, might not open - this is OK!

---

### **Test 3: Create Your First Note Sticky** ✅

**Steps:**
1. Open modal (any method above)
2. Tap "Write Note" card
3. Verify note creation form appears:
   - Text input field
   - Color picker (6 colors)
   - Category selector
   - Create button

**Form Testing:**

#### **3a: Text Input**
- Type: "Purple & gold theme with confetti"
- ✅ Text appears as you type
- ✅ Keyboard shows correctly
- ✅ Can delete and re-type

#### **3b: Color Selection**
- Tap each color circle:
  - 🟡 Yellow
  - 💕 Pink (select this one)
  - 💙 Blue
  - 💚 Green
  - 💜 Purple
  - 🟠 Orange
- ✅ Selected color shows checkmark
- ✅ Only one color selected at a time

#### **3c: Category Selection**
- Scroll category chips horizontally
- Tap "Decor" chip
- ✅ Chip turns purple with white text
- ✅ Icon changes to white
- Try tapping "Food" chip
- ✅ Only one category selected at a time

#### **3d: Create Button**
- Verify button is **disabled** when text field is empty
- ✅ Button is gray and cannot be tapped
- Type some text
- ✅ Button becomes purple and enabled
- Tap "Create Sticky Note"

**Expected Results:**
- ✅ **Success haptic vibration** (feel device vibrate)
- ✅ Modal closes automatically
- ✅ **Pink sticky note appears on canvas!**
- ✅ Sticky shows your text: "Purple & gold theme..."
- ✅ Sticky has slight rotation (looks tilted)
- ✅ Sticky has shadow for depth
- ✅ **New item appears in list below!**
- ✅ Stats bar updates: "5 ideas | 2 tasks | 65 votes" (was 4 ideas)

**Screenshot:** Take a photo of your first sticky on canvas!

---

### **Test 4: Create Multiple Stickies** ✅

**Steps:**
1. Create 5-10 more stickies with different:
   - Colors (try all 6!)
   - Categories (Venue, Food, Entertainment, etc.)
   - Content lengths (short and long text)

**Examples to Create:**
```
Sticky 2: "Fairy lights everywhere" - Yellow - Decor
Sticky 3: "DJ for 4 hours" - Blue - Entertainment
Sticky 4: "Taco bar!" - Green - Food
Sticky 5: "Outdoor garden venue" - Orange - Venue
Sticky 6: "Photo booth with props" - Purple - Entertainment
Sticky 7: "Birthday cake $200" - Pink - Food
Sticky 8: "Balloon arch entrance" - Yellow - Decor
```

**Expected Results:**
- ✅ Each sticky appears in a **random position** on canvas
- ✅ Each sticky has a **random rotation** (some tilt left, some right)
- ✅ Different colors are clearly visible
- ✅ All stickies have shadows
- ✅ Stickies don't overlap too much
- ✅ Each sticky creates a **corresponding list item**
- ✅ Stats bar updates: shows "12 ideas | 2 tasks | 65 votes"

**Screenshot:** Canvas full of colorful stickies!

---

### **Test 5: Drag Stickies Around** ✅

**Steps:**
1. **Long press** (hold for 1 second) on any sticky
2. While holding, **drag your finger** around the canvas
3. Release to drop

**Expected Results:**
- ✅ **Haptic feedback** when you start dragging (vibration)
- ✅ Sticky **scales up to 1.1x** (gets bigger)
- ✅ **Shadow increases** (sticky looks lifted)
- ✅ Sticky **follows your finger smoothly**
- ✅ **No lag** during drag (60fps)
- ✅ On release, sticky **snaps back to normal size**
- ✅ **Light haptic** when you drop
- ✅ Sticky stays in new position

**Test Multiple Drags:**
1. Drag sticky to top-left corner
2. Drag sticky to bottom-right corner
3. Drag sticky to center
4. Drag sticky in a circle pattern

**Expected:**
- ✅ All movements smooth
- ✅ Sticky never goes off-screen (bounded)
- ✅ Position is saved after each drag

**Screenshot:** Mid-drag with sticky scaled up!

---

### **Test 6: Long Press Menu** ✅

**Steps:**
1. **Long press** on any sticky (hold for 1+ seconds)
2. Wait for menu to appear

**Expected Results:**
- ✅ **Bottom sheet menu slides up**
- ✅ Menu title: "Sticky Options"
- ✅ Three menu items visible:
  - ✏️ Edit (gray background)
  - ❤️ React (gray background)
  - 🗑️ Delete (red background)
- ✅ Cancel button at bottom

**Menu Item Testing:**

#### **6a: Edit (Not Yet Implemented)**
- Tap "Edit"
- ✅ Menu closes
- ⏳ Nothing else happens (Phase 3 feature)

#### **6b: React (Not Yet Implemented)**
- Open menu again
- Tap "React"
- ✅ Menu closes
- ⏳ Nothing else happens (Phase 3 feature)

#### **6c: Delete (Working!)**
- Open menu again
- Tap "Delete"
- ✅ **Menu closes**
- ✅ **Sticky disappears from canvas!**
- ✅ **Medium haptic vibration**
- ✅ Smooth fade-out animation (if you look closely)
- ⚠️ List item remains (intentional - separate delete in Phase 3)
- ✅ Stats bar **does not update yet** (will update in Phase 3)

**Test Cancel:**
- Long press another sticky
- Tap "Cancel" button
- ✅ Menu closes
- ✅ Sticky remains

**Screenshot:** Menu opened on a sticky

---

### **Test 7: Divider Interaction** ✅

**Steps:**
1. Find the gray bar with three dots (⋮⋮⋮) between canvas and list
2. **Drag the divider UP** (toward top of screen)
3. **Drag the divider DOWN** (toward bottom of screen)

**Expected Results:**

**Dragging Up:**
- ✅ **Canvas shrinks** (gets shorter)
- ✅ **List expands** (gets taller)
- ✅ **Haptic feedback** while dragging
- ✅ Smooth animation
- ✅ Minimum canvas height: ~200px (can't shrink more)
- ✅ Stickies remain visible in smaller canvas

**Dragging Down:**
- ✅ **Canvas expands** (gets taller)
- ✅ **List shrinks** (gets shorter)
- ✅ Haptic feedback
- ✅ Minimum list height: ~200px (can't shrink more)

**Test Extremes:**
- Try dragging divider to very top
- Try dragging divider to very bottom
- ✅ Stops at limits (doesn't break)

**Preferred View:**
- Adjust to your comfortable ratio (e.g., 50/50)
- ✅ Position stays after you let go

**Screenshot:** Canvas expanded to 70%

---

### **Test 8: List Filtering** ✅

**Steps:**
1. Scroll down to list section
2. Look at category filter chips
3. Default: "All" is selected (purple background)

**Test Each Category:**

#### **8a: Filter by "Decor"**
- Tap "Decor" chip
- ✅ Chip turns purple
- ✅ "All" chip turns gray
- ✅ **List shows only Decor items**
- ✅ Non-Decor items hidden
- ✅ Stickies you created with "Decor" category should match list

#### **8b: Filter by "Food"**
- Tap "Food" chip
- ✅ List updates instantly
- ✅ Shows only Food items
- ✅ Your "Taco bar" and "Birthday cake" items visible

#### **8c: Filter by "Entertainment"**
- Tap "Entertainment" chip
- ✅ Shows Entertainment items
- ✅ "DJ" and "Photo booth" items visible

#### **8d: Back to "All"**
- Tap "All" chip
- ✅ Shows all items again (4 mock + your created items)

**Note:** Canvas stickies **do not filter** - they always show all (intentional for Phase 2)

---

### **Test 9: List Item Actions** ✅

**Test Each Action Button:**

#### **9a: Vote Button**
- Find a list item with "Vote" button
- Note current vote count (e.g., "❤️ 15")
- Tap "Vote" button
- ✅ Vote count **does not increase yet** (will add in Phase 3)
- ⏳ No action yet - placeholder

#### **9b: Convert to Task**
- Find an item with "Convert" button
- Tap "Convert"
- ✅ Button changes to "✓ Task" badge
- ✅ Badge turns green
- ✅ Stats bar updates: "3 tasks" (was 2 tasks)

**Try converting multiple items:**
- Convert 3-4 different items
- ✅ Each shows "Task" badge
- ✅ Stats bar increments each time

---

### **Test 10: Canvas-List Synchronization** ✅

**Test Bidirectional Sync:**

#### **10a: Create Sticky → Appears in List**
1. Create a new sticky: "Test sync"
2. Choose Blue color, Venue category
3. Tap "Create Sticky Note"

**Expected:**
- ✅ Blue sticky appears on canvas
- ✅ **New list item appears at TOP of list**
- ✅ List item shows: "Test sync"
- ✅ List item has Venue category badge (blue)
- ✅ List item shows "You • Just now"
- ✅ Both views are linked

#### **10b: Delete Sticky → List Item Remains**
1. Long press the "Test sync" sticky
2. Tap "Delete"
3. Check list section

**Expected:**
- ✅ Sticky disappears from canvas
- ⚠️ List item **stays in list** (intentional - Phase 2 behavior)
- 📝 Note: Full sync will be in Phase 3

---

### **Test 11: Stats Bar Accuracy** ✅

**Verify Stats:**
1. Count your created stickies on canvas
2. Count list items
3. Count items with "Task" badge
4. Check stats bar

**Expected:**
- ✅ "Ideas" count = Total list items (mock + created)
- ✅ "Tasks" count = Items with green "Task" badge
- ✅ "Votes" count = Sum of all reaction counts

**Example:**
```
If you have:
- 4 mock items + 8 created = 12 ideas
- 2 converted to task = 2 tasks
- Mock items have 65 votes total = 65 votes

Stats bar shows: "💡 12 ideas | ✓ 2 tasks | ❤️ 65 votes"
```

---

### **Test 12: Performance Testing** ✅

**Create 20+ Stickies:**
1. Rapidly create many stickies
2. Use header "+" button repeatedly
3. Fill out form quickly
4. Create 20-30 stickies total

**Expected Performance:**
- ✅ **No lag** creating stickies
- ✅ **No lag** dragging any sticky
- ✅ **Smooth scrolling** in list
- ✅ **60fps animations** (smooth as butter)
- ✅ **No crashes** with many stickies
- ✅ Canvas still responsive
- ✅ Divider drag still smooth

**Stress Test:**
1. Drag divider rapidly up/down 10 times
2. ✅ No lag or jank
3. Long press and drag multiple stickies quickly
4. ✅ Each drag is smooth

---

### **Test 13: Edge Cases** ✅

#### **13a: Empty Note Content**
1. Open modal → "Write Note"
2. **Don't type anything**
3. Try tapping "Create Sticky Note" button
- ✅ Button is **gray and disabled**
- ✅ Cannot create empty sticky

#### **13b: Very Long Text**
1. Open modal → "Write Note"
2. Type a very long text (200+ characters):
   ```
   "This is a very long note to test how the sticky handles overflow text. We need to make sure it displays properly without breaking the layout. The text should truncate or wrap nicely within the sticky bounds. Additional text to make it even longer and test the limits of what can fit..."
   ```
3. Create sticky

**Expected:**
- ✅ Sticky shows text with **6 lines max** (truncated)
- ✅ List item shows full text (or more lines)
- ✅ No layout breaking
- ✅ Ellipsis (...) at end if truncated

#### **13c: Special Characters**
1. Create sticky with: "Party 🎉 @ Venue #1 (2025)"
2. Create sticky with emojis: "🎈🎊🎁🎂"

**Expected:**
- ✅ All characters display correctly
- ✅ Emojis render properly
- ✅ No crashes

#### **13d: Rapid Modal Open/Close**
1. Tap "+" button
2. Immediately tap "X" to close
3. Repeat 5-10 times quickly

**Expected:**
- ✅ No crashes
- ✅ Modal opens/closes smoothly each time
- ✅ No stuck modals

---

### **Test 14: Memory & Persistence** ⚠️

**Note:** Data does NOT persist in Phase 2 (will add in Phase 4)

**Test:**
1. Create 5-10 stickies
2. Navigate back to Collaboration Hub
3. Return to PartyBoard

**Expected:**
- ⚠️ **Stickies are GONE** (not saved yet)
- ✅ Mock list items remain
- ✅ App doesn't crash
- 📝 This is intentional - Supabase integration in Phase 4

---

### **Test 15: Cross-Device (If Available)** ⏸️

**If you have multiple devices:**
1. Open app on Device A
2. Open app on Device B
3. Create sticky on Device A

**Expected (Phase 2):**
- ⏸️ Sticky **does not sync** to Device B
- 📝 Real-time sync in Phase 4

---

## 🐛 Known Issues (Expected in Phase 2)

These are **intentional limitations** for Phase 2:

1. ✅ **No data persistence** - Stickies lost on navigation away
2. ✅ **No Edit function** - Can only delete, not edit
3. ✅ **No React/Vote function** - Placeholder for Phase 3
4. ✅ **Canvas doesn't filter** - Only list filters by category
5. ✅ **No image/link/video stickies** - Only notes implemented
6. ✅ **Delete doesn't remove from list** - Separate deletion for now
7. ✅ **No zoom/pan on canvas** - Phase 3 feature
8. ✅ **Stats bar may be inaccurate after deletes** - Will fix in Phase 3

---

## ✅ Success Criteria

**Phase 2 is successful if:**

- ✅ Modal opens 3 different ways
- ✅ Note creation form works fully
- ✅ 6 color options selectable
- ✅ 6 category options selectable
- ✅ Create button validates input
- ✅ Stickies appear on canvas with random position/rotation
- ✅ Stickies are draggable smoothly
- ✅ Long press menu shows correctly
- ✅ Delete works
- ✅ Canvas-list sync works (creation)
- ✅ Divider is draggable
- ✅ List filtering works
- ✅ Convert to task works
- ✅ Stats bar updates
- ✅ No crashes or freezes
- ✅ Haptic feedback works (iOS)
- ✅ Smooth 60fps performance

---

## 📸 Required Screenshots

Please take screenshots of:

1. ✅ Empty canvas (initial state)
2. ✅ Modal type selection screen
3. ✅ Note creation form filled out
4. ✅ Canvas with 1 sticky
5. ✅ Canvas with 10+ stickies (colorful)
6. ✅ Sticky being dragged (scaled up)
7. ✅ Long press menu open
8. ✅ List filtered by category
9. ✅ Divider dragged to expand canvas
10. ✅ Stats bar showing updated counts

---

## 🚨 Report Issues

**If you encounter any bugs:**

### **Format:**
```markdown
**Bug:** [Description]
**Steps to Reproduce:**
1. Step 1
2. Step 2
**Expected:** [What should happen]
**Actual:** [What actually happened]
**Screenshot:** [Attach if possible]
```

### **Example:**
```markdown
**Bug:** Sticky disappears when dragged to bottom
**Steps to Reproduce:**
1. Create a sticky
2. Drag it to very bottom of canvas
3. Sticky vanishes
**Expected:** Sticky stays visible within canvas bounds
**Actual:** Sticky disappears completely
**Screenshot:** [attach]
```

---

## 🎉 After Testing

**Once testing is complete:**

1. ✅ Mark Test 1-15 as complete
2. 📸 Review your screenshots
3. 🐛 List any bugs found
4. 📝 Note your favorite features
5. 💡 Suggest improvements

**Next Steps:**
- **Option A:** Fix any critical bugs found
- **Option B:** Continue to Phase 3 (image/link stickies)
- **Option C:** Polish Phase 2 further (animations, edge cases)

---

## 🎨 Have Fun Testing!

This is YOUR PartyBoard - get creative with:
- Fun sticky note content
- Color combinations
- Organizing stickies by category
- Drag patterns
- Testing the limits!

**Happy Testing! 🚀**

---

**Phase 2 Testing Guide v1.0**
*Created: October 26, 2025*
*Ready to test the most collaborative planning board ever! 🎨*
