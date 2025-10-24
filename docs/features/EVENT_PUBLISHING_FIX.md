# Event Publishing Fix & Draft Storage Implementation

## Date: October 23, 2025

## Issues Identified & Fixed

### 1. JSON Parse Error when Publishing Events ✅

**Root Cause:**
The mobile app was sending `location_name` as a string field in the event data, but the API endpoint (`/api/events.ts`) expected `location` to be an object with nested properties:
```typescript
location: {
  name: string;
  address: string;
  coordinates?: { lat: number; lng: number };
}
```

**Solution Implemented:**
Updated `apps/mobile/app/events/create/review.tsx` to properly format the location data:

```typescript
// Before (causing JSON parse error)
const eventData = {
  location_name: location,  // ❌ Wrong format
  ...
};

// After (fixed)
const eventData: any = {
  ...
};

if (location && location.trim()) {
  eventData.location = {
    name: location,
    address: location,
  };
}
```

### 2. Draft Events Storage System ✅

**Implementation:**
Created a complete draft events management system using AsyncStorage for offline storage.

**New Files Created:**

1. **`apps/mobile/app/events/drafts.tsx`** (340 lines)
   - Full drafts management screen
   - List all saved drafts with icons, dates, stats
   - Continue editing drafts
   - Delete drafts with confirmation
   - Empty state with "Create Event" CTA
   - Pull-to-refresh functionality

**Modified Files:**

1. **`apps/mobile/app/events/create/review.tsx`**
   - Added `handleSaveDraft()` function using AsyncStorage
   - Saves all event data including template settings, guests, timeline
   - Auto-deletes draft when event is successfully published
   - Tracks draft metadata (ID, saved timestamp)

2. **`apps/mobile/components/screens/DashboardScreen.tsx`**
   - Added "Drafts" button in header next to "Sign Out"
   - Links to new `/events/drafts` screen

## Draft Storage Data Structure

```typescript
interface DraftEvent {
  id: string;                    // Unique draft ID (timestamp)
  templateType: string;          // Template type (birthday, wedding, etc.)
  title: string;                 // Event title
  description: string;           // Event description
  startDate: string;             // ISO date string
  endDate: string;               // ISO date string
  location: string;              // Location name
  templateSettings: any;         // Template-specific JSONB data
  guests?: string;               // JSON stringified guests array
  timeline?: string;             // JSON stringified timeline blocks
  guestCount: string;            // Guest count for display
  timelineCount: string;         // Timeline block count for display
  savedAt: string;               // ISO timestamp of when draft was saved
}
```

## Testing Checklist

### Event Publishing Test
- [ ] Create new event with all required fields
- [ ] Add location data
- [ ] Add template-specific details (wedding, conference, product launch)
- [ ] Add guests
- [ ] Add timeline blocks
- [ ] Click "Publish Event"
- [ ] Verify event is created successfully (no JSON parse error)
- [ ] Verify event appears in dashboard
- [ ] Verify location is properly saved in database

### Draft Storage Test
- [ ] Fill out event creation form
- [ ] Click "Save as Draft" button
- [ ] Verify success message
- [ ] Navigate to Dashboard → Drafts button
- [ ] Verify draft appears in list
- [ ] Verify draft shows correct icon for template type
- [ ] Verify draft shows date, location, guest count, timeline count
- [ ] Click "Continue" on draft
- [ ] Verify all data is restored (title, description, dates, location, template settings, guests, timeline)
- [ ] Publish the draft
- [ ] Verify draft is automatically deleted from drafts list

### Draft Deletion Test
- [ ] Create and save multiple drafts
- [ ] Go to Drafts screen
- [ ] Click delete icon on a draft
- [ ] Verify confirmation alert appears
- [ ] Confirm deletion
- [ ] Verify draft is removed from list
- [ ] Verify draft is removed from AsyncStorage

### Draft Restoration Test
- [ ] Save a draft with complex template data (e.g., wedding form with all sections filled)
- [ ] Close app completely
- [ ] Reopen app
- [ ] Go to Drafts screen
- [ ] Verify draft is still there
- [ ] Continue editing draft
- [ ] Verify all form data is correctly restored

## API Compatibility

The fix ensures the mobile app now sends event data in the exact format expected by the API:

```typescript
// POST /api/events
{
  template_type: string;        // Required
  title: string;                // Required
  description?: string;
  start_date: string;           // Required (ISO date)
  end_date: string;             // Required (ISO date)
  timezone?: string;            // Defaults to 'UTC'
  location?: {                  // Optional object (not string!)
    name: string;
    address: string;
    coordinates?: { lat, lng };
  };
  privacy?: string;             // Defaults to 'private'
  settings?: any;               // Template-specific JSONB data
  status?: string;              // 'draft' or 'published'
}
```

## Performance Considerations

- **AsyncStorage Limits:** Each draft is stored as part of a JSON array. Typical draft size: ~5-10KB depending on template complexity
- **Storage Quota:** AsyncStorage on iOS/Android typically supports 6MB+, sufficient for ~100-200 drafts
- **Read/Write Performance:** AsyncStorage operations are async and non-blocking
- **Data Persistence:** Drafts persist across app restarts and device reboots

## Security Notes

- Drafts are stored locally on device only (not synced to server)
- No sensitive authentication tokens stored in drafts
- Draft data is plain JSON in AsyncStorage (not encrypted)
- Drafts are user-specific to the device (not shared across devices)

## Future Enhancements

1. **Cloud Sync:** Sync drafts to Supabase for cross-device access
2. **Auto-save:** Implement auto-save every 30 seconds while editing
3. **Draft Expiry:** Auto-delete drafts older than 30 days
4. **Draft Search:** Add search/filter functionality for drafts
5. **Offline Publish:** Queue events for publishing when internet connection is restored
6. **Draft Templates:** Allow creating template-based drafts without specific event details

## Files Changed Summary

### Modified (3 files)
- `apps/mobile/app/events/create/review.tsx` - Fixed location format, added draft save/delete
- `apps/mobile/components/screens/DashboardScreen.tsx` - Added drafts button
- `apps/mobile/app/events/create/basics.tsx` - (already correct location handling)

### Created (1 file)
- `apps/mobile/app/events/drafts.tsx` - New drafts management screen

## Deployment Notes

**Required Package:**
- `@react-native-async-storage/async-storage` - Already in dependencies

**No Database Changes Required:**
- Draft storage is client-side only using AsyncStorage
- No new Supabase tables needed
- No API endpoint changes required

**Backward Compatible:**
- Fix doesn't break existing event creation flow
- Drafts are optional feature (app works without using drafts)
- Old saved drafts (if any) won't cause errors

## Testing Instructions

### Quick Test Script

1. **Start Expo Server:**
   ```powershell
   cd apps/mobile
   npx expo start --tunnel
   ```

2. **Test Event Publishing:**
   - Open app in Expo Go
   - Tap "Create Event"
   - Select template (e.g., Wedding)
   - Fill out all forms
   - Review & Publish
   - Verify no JSON errors
   - Check event appears in dashboard

3. **Test Draft Storage:**
   - Create new event (any template)
   - Fill basic details
   - Tap "Save as Draft"
   - Go to Dashboard → Drafts
   - Tap "Continue" on draft
   - Verify data restored
   - Publish event
   - Verify draft auto-deleted

## Status: ✅ COMPLETE

Both the JSON parse error and draft storage implementation are complete and ready for testing.
