# JSON Parse Error Debug Guide

## Issue: "Unexpected character: T"

This error typically occurs when trying to parse a non-JSON string with `JSON.parse()`.

## Fixes Applied

### 1. Enhanced Template Settings Parsing

**Location:** `apps/mobile/app/events/create/review.tsx`

**Changes:**
- Added comprehensive type checking before parsing
- Check if value is already an object (no parsing needed)
- Validate JSON string format before attempting parse
- Handle edge cases: `undefined`, `null`, empty strings
- Graceful fallback to empty object on any error
- Extensive debug logging to trace the issue

### 2. Safe Guests Array Parsing

**Changes:**
- Check if already an array (no parsing needed)
- Validate array format before parsing
- Only process if guests exist
- Graceful error handling

### 3. Safe Timeline Array Parsing

**Changes:**
- Same pattern as guests parsing
- Type checking before JSON.parse()
- Fallback to empty array

### 4. Enhanced Error Logging

**Added extensive logging:**
```javascript
console.log('[Review] All params:', Object.keys(params));
console.log('[Review] templateSettings type:', typeof params.templateSettings);
console.log('[Review] templateSettings first 100 chars:', ...);
```

**Step-by-step publish logging:**
- Step 1: Getting auth session
- Step 2: Preparing event data
- Step 3: Event data prepared (with details)
- Step 4: Sending create event request
- Step 5: Event API response status
- Step 6: Event created with ID

## How to Debug

### 1. Check Expo Go Logs

When you publish an event, look for these log messages in the Expo Go terminal:

```
[Review] ========== PUBLISH STARTED ==========
[Review] All params: [...]
[Review] templateSettings type: string/object
[Review] Template settings first 100 chars: ...
[Review] Step 1: Getting auth session
[Review] Step 2: Preparing event data
...
```

### 2. Identify the Source

The error "Unexpected character: T" suggests one of these scenarios:

**Scenario A: Boolean as String**
```javascript
// Incorrect
"true" -> JSON.parse("true") // Error if not quoted properly
```

**Scenario B: Template Literal**
```javascript
// Incorrect
`Template ${value}` -> JSON.parse(...) // "T" from "Template"
```

**Scenario C: Serialization Issue**
```javascript
// React Navigation might serialize objects differently
router.push({ params: { data: someObject } })
// Later: JSON.parse(params.data) might fail
```

### 3. Test Pattern

1. **Create Event with Minimal Data:**
   - No template settings
   - No guests
   - No timeline
   - Just title, date, location

2. **Add Template Settings:**
   - Fill one field in template form
   - Check logs for how it's being passed

3. **Add Guests:**
   - Add 1 guest
   - Check logs

4. **Add Timeline:**
   - Add 1 block
   - Check logs

## Expected Log Output (Success)

```
[Review] ========== PUBLISH STARTED ==========
[Review] All params: ['template', 'title', 'description', 'startDate', 'endDate', 'location', 'templateSettings']
[Review] templateSettings type: string
[Review] Template settings first 100 chars: {"product_name":"My Product","product_category":"Tech"...}
[Review] Using object directly OR Successfully parsed JSON
[Review] Final templateSettings: { product_name: 'My Product', ... }
[Review] Step 1: Getting auth session
[Review] Step 2: Preparing event data
[Review] Step 3: Event data prepared: { template_type: 'product-launch', title: 'My Launch', has_location: true, has_settings: true, settings_keys: ['product_name', ...] }
[Review] Step 4: Sending create event request
[Review] Step 5: Event API response status: 201
[Review] Step 6: Event created with ID: abc-123-def
```

## Expected Log Output (Error - Before Fix)

```
[Review] ========== PUBLISH STARTED ==========
[Review] All params: [...]
[Review] templateSettings type: string
[Review] Template settings first 100 chars: True // <- Problem!
[Review] Not valid JSON format, first char: T
[Review] String preview: True
[Review] Final templateSettings: {}
... continues normally with empty settings ...
```

## Testing Checklist

### Test 1: Empty Template Settings
- [ ] Create event
- [ ] Skip template details form
- [ ] Publish
- [ ] Should succeed with empty settings

### Test 2: Product Launch with All Fields
- [ ] Create Product Launch event
- [ ] Fill ALL template fields
- [ ] Add media contacts
- [ ] Publish
- [ ] Check logs for settings structure

### Test 3: Wedding with Complex Data
- [ ] Create Wedding event
- [ ] Fill all 12 sections
- [ ] Add registry links
- [ ] Select multiple meal options
- [ ] Publish
- [ ] Verify all settings saved

### Test 4: With Guests
- [ ] Create any event
- [ ] Add 3 guests
- [ ] Publish
- [ ] Verify guests imported

### Test 5: With Timeline
- [ ] Create any event
- [ ] Add 5 timeline blocks
- [ ] Publish
- [ ] Verify timeline created

## Common Causes & Solutions

### Cause 1: Router Serialization
**Problem:** Expo Router may serialize objects as strings differently than expected

**Solution:** 
- Check actual type with `typeof`
- Parse only if it's a string
- Accept objects directly

### Cause 2: Double Stringification
**Problem:** `JSON.stringify(JSON.stringify(data))`

**Solution:**
- Only stringify once when passing
- Check if already a string

### Cause 3: Invalid JSON Characters
**Problem:** Unescaped quotes, newlines, etc.

**Solution:**
- Use try-catch around JSON.parse
- Log the actual string being parsed
- Fallback to empty object

## Rollback Plan

If the issue persists, you can temporarily disable template settings:

```typescript
// In review.tsx
const templateSettings = {}; // Always use empty object
```

This allows event creation to work while we debug the settings parsing.

## Next Steps

1. **Run the app** in Expo Go
2. **Create a test event** (Product Launch recommended)
3. **Watch the logs** in the terminal
4. **Copy the log output** showing the error
5. **Share the logs** to identify exact parsing location

The enhanced logging will show exactly:
- What type the data is
- What the first 100 characters are
- At which step it fails
- The exact error message

This will help pinpoint if it's:
- Template settings parsing
- Guests parsing  
- Timeline parsing
- API response parsing
