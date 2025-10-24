# Kids Birthday Form - Testing Guide

## Overview
The comprehensive kids birthday form has been implemented with fields covering all 10 common kids birthday party scenarios.

## Implementation Date
October 22, 2025

## What's New

### 10 Scenarios Covered
1. **Backyard Superhero Party** (Age 5-7)
2. **Indoor Play Center Party** (Age 3-5)
3. **Princess Tea Party** (Age 4-6)
4. **Science Lab Party** (Age 8-10)
5. **Pool Party** (Age 6-12)
6. **Gaming/Esports Party** (Age 10-13)
7. **Petting Zoo/Farm Party** (Age 2-6)
8. **Sports Party** (Age 7-11)
9. **Art Studio Party** (Age 5-9)
10. **Movie Theater Party** (Age 8-12)

### Comprehensive Form Fields

#### 1. Birthday Child Info
- **Birthday Child's Name** * (Required)
- **Age Turning** (e.g., 7)
- **Expected Guest Count** (e.g., 15 kids)
- **Guest Age Range** (e.g., 5-8 years old)
- **Special Milestone** (Optional - e.g., 1st Birthday, Sweet 16)

#### 2. Venue Type (Chip Selection)
- Home (Indoor)
- Home (Backyard)
- Home (Pool)
- Indoor Play Center
- Sports Complex
- Art Studio
- Gaming Lounge
- Movie Theater
- Farm/Petting Zoo
- Community Pool
- Other

**Conditional Fields:**
- **Venue Package/Tier** (shown for Indoor Play Center, Sports Complex, Art Studio)
- **Venue Rules/Requirements** (shown for non-home venues)
- **Weather Backup Plan** (shown for outdoor/pool venues)

#### 3. Party Theme (Chip Selection)
- Superhero
- Princess Tea Party
- Science Lab
- Sports
- Art Studio
- Gaming/Esports
- Movie Theater
- Petting Zoo/Farm
- Pool Party
- Custom (shows text input for custom theme)

**Additional:**
- **Dress Code/Costume Requirements** (e.g., "Come as your favorite superhero")

#### 4. Activities & Entertainment
**Multi-Select Activities:**
- Bounce House
- Face Painting
- Balloon Animals
- Magic Show
- Character Performer
- Craft Station
- Science Experiments
- Sports Games
- Video Game Tournament
- Movie Screening
- Pool Games
- Scavenger Hunt
- Obstacle Course
- Petting Zoo
- Pony Rides

**Additional Fields:**
- **Additional Custom Activities** (text area)
- **Entertainment Details** (character performer names, magician contact, DJ info)

#### 5. Food & Cake
- **Food Menu** (text area - pizza, juice boxes, fruit platter, etc.)
- **Cake Details** (flavor, design, dietary options)
- **Allergy & Dietary Notes** (nut-free facility, common allergies to avoid)

#### 6. Gift Preferences (Chip Selection)
- Gift Registry (shows registry link inputs)
- No Gifts Please
- Donate to Charity (shows charity info input)
- Gift Wish List (shows wish list text area)

**Conditional Fields:**
- **Registry Links** (multiple URL inputs with add/remove)
- **Gift Ideas/Wishes** (text area for wish list)
- **Charity/Donation Information** (text area for donation details)

#### 7. Parent Logistics
- **Parents Must Stay** (toggle switch)
- **Supervision Ratio** (e.g., "1 adult per 5 kids")
- **Pickup Time** (e.g., "4:00 PM sharp")

#### 8. Safety & Requirements
- **Safety Requirements** (e.g., "Lifeguard on duty, safety goggles provided")
- **Equipment Provided** (e.g., "Sports equipment, craft supplies")
- **What Guests Should Bring** (e.g., "Swimsuit & towel, socks, old clothes for art")

#### 9. Photography (Chip Selection)
- Professional Photographer (shows photographer details input)
- Parent Volunteers
- No Photos

**Conditional Field:**
- **Photographer Details** (name, contact, package details)

## How to Test in Expo Go

### Prerequisites
- Expo Go app installed on your mobile device
- Expo development server running on port 8081 (already running)

### Test Steps

1. **Open Expo Go** on your mobile device

2. **Scan QR Code** from the terminal (or enter the tunnel URL if using `--tunnel`)

3. **Navigate to Event Creation**:
   - Tap the **purple "+" FAB** button on the dashboard
   - Or tap **"Create Event"** button

4. **Select Birthday Template**:
   - On the template selection screen, tap **"Birthday"**
   - Tap **"Next"**

5. **Fill Basic Details**:
   - Enter event title (e.g., "Emma's 7th Birthday")
   - Enter description
   - Set date and location
   - Tap **"Next"**

6. **Test the Comprehensive Birthday Form** (Step 2 of 5 - 40% progress):
   
   **Test Scenario 1: Pool Party**
   - Birthday Child's Name: "Emma"
   - Age Turning: "7"
   - Expected Guest Count: "15"
   - Guest Age Range: "6-8 years old"
   - Venue Type: Select **"Home (Pool)"**
   - Weather Backup Plan: "Move to indoor playroom"
   - Party Theme: Select **"Pool Party"**
   - Dress Code: "Swimsuit required"
   - Activities: Select **"Pool Games"**, **"Face Painting"**
   - Custom Activities: "Water balloon toss, diving competitions"
   - Food Menu: "Pizza, watermelon, popsicles, juice boxes"
   - Cake Details: "Vanilla cake with mermaid design"
   - Allergy Notes: "One guest has peanut allergy"
   - Gift Preference: Select **"Gift Registry"**
   - Add Registry URL: "https://www.amazon.com/baby-reg/emma-pool-party"
   - Parent Logistics: Toggle **"Parents Must Stay"** ON
   - Supervision Ratio: "1 adult per 3 kids in pool"
   - Pickup Time: "3:00 PM sharp"
   - Safety Requirements: "Lifeguard on duty, floaties allowed, pool depth markers"
   - What to Bring: "Swimsuit, towel, sunscreen, change of clothes"
   - Photography: Select **"Parent Volunteers"**

   **Test Scenario 2: Indoor Play Center**
   - Birthday Child: "Lucas"
   - Age: "5"
   - Guest Count: "12"
   - Venue Type: Select **"Indoor Play Center"**
   - Venue Package: "Premium 2-hour package with arcade credits"
   - Venue Rules: "Socks required, waiver forms needed for all kids"
   - Theme: Select **"Custom"** → Enter "Dinosaur Adventure"
   - Activities: Select **"Bounce House"**, **"Games"**
   - Food Menu: "Pizza provided by venue, dinosaur cake"
   - Gift Preference: Select **"Donate to Charity"**
   - Charity Info: "WWF - Wildlife conservation, donate.worldwildlife.org"
   - Parent Stay: Toggle OFF
   - Pickup Time: "2:00 PM at party room"
   - Photography: Select **"Professional Photographer"**
   - Photographer Details: "Sarah's Events Photography, 555-1234, action shots package"

   **Test Scenario 3: Science Lab Party**
   - Birthday Child: "Olivia"
   - Age: "9"
   - Guest Count: "10"
   - Age Range: "8-10 years old"
   - Venue: Select **"Home (Indoor)"**
   - Theme: Select **"Science Lab"**
   - Dress Code: "Wear old clothes"
   - Activities: Select **"Science Experiments"**, **"Craft Station"**
   - Custom Activities: "Slime making, volcano eruptions, dry ice fog"
   - Entertainment: "Mad Scientist Mike from Science Fun Co., 555-9876"
   - Food: "Lab-themed snacks, 'potion' drinks, beaker cake"
   - Allergy Notes: "Gluten-free cake option for 2 guests"
   - Gift Preference: Select **"Gift Wish List"**
   - Gift Wishes: "Science kits\nRobotics toys\nNational Geographic subscription\nTelescope"
   - Safety Requirements: "Safety goggles provided, adult supervision for experiments"
   - What to Bring: "Lab coat (optional), curiosity!"
   - Photography: Select **"Parent Volunteers"**

7. **Skip or Continue**:
   - Tap **"Skip"** to move forward without template details (form data won't be saved)
   - OR tap **"Next"** to save all template-specific data

8. **Continue Through Wizard**:
   - **Step 3: Guests** - Import or skip
   - **Step 4: Timeline** - Add blocks or skip
   - **Step 5: Review** - Review all details including template settings

9. **Publish Event**:
   - Tap **"Publish Event"** button
   - Check that event is created with template settings

### Verification Points

✅ **Form Rendering**:
- All sections render correctly
- Chips are selectable/deselectable
- Conditional fields show/hide based on selections
- Text inputs accept input properly
- Multi-line text areas expand properly

✅ **Conditional Logic**:
- Venue-specific fields show only for relevant venue types
- Theme custom input shows only when "Custom" is selected
- Gift preference conditional fields show based on selection
- Photography details show only for professional photographer

✅ **Activity Multi-Select**:
- Can select multiple activities
- Can deselect activities
- Purple highlighting shows selected activities

✅ **Registry Links**:
- Can add multiple registry links
- Can remove links (when more than one)
- Remove button shows red close icon

✅ **Validation**:
- Form validates that birthday child name is required
- "Next" button should be enabled when name is filled
- Skip button always available

✅ **Data Persistence**:
- All form data passes to review screen
- Template settings included in event creation API call
- Guest invitations include event details with template settings

### Testing Edge Cases

1. **Empty Form**: Try tapping "Next" without filling any fields → Should show validation error
2. **Long Text**: Enter very long text in text areas → Should scroll properly
3. **Many Activities**: Select all 15 activities → Should display all chips properly
4. **Multiple Registries**: Add 5+ registry links → Should allow adding/removing properly
5. **Theme Switching**: Select different themes rapidly → Should update selection correctly
6. **Back Navigation**: Tap back from guests screen → Should preserve filled form data

### Expected API Payload

When event is published, the `template_settings` field should contain all birthday-specific data:

```json
{
  "template_type": "birthday",
  "title": "Emma's 7th Birthday",
  "template_settings": {
    "birthday_person": "Emma",
    "age": 7,
    "expected_guest_count": 15,
    "age_range": "6-8 years old",
    "venue_type": "Home (Pool)",
    "theme": "Pool Party",
    "dress_code": "Swimsuit required",
    "selected_activities": ["Pool Games", "Face Painting"],
    "custom_activities": "Water balloon toss, diving competitions",
    "food_menu": "Pizza, watermelon, popsicles, juice boxes",
    "cake_details": "Vanilla cake with mermaid design",
    "allergy_notes": "One guest has peanut allergy",
    "gift_preference": "registry",
    "registry_links": ["https://www.amazon.com/baby-reg/emma-pool-party"],
    "parent_stay_required": true,
    "supervision_ratio": "1 adult per 3 kids in pool",
    "pickup_time": "3:00 PM sharp",
    "safety_requirements": "Lifeguard on duty, floaties allowed, pool depth markers",
    "what_to_bring": "Swimsuit, towel, sunscreen, change of clothes",
    "photography_arrangement": "parent-volunteers",
    "backup_plan": "Move to indoor playroom"
  }
}
```

## Common Issues & Troubleshooting

### Issue: Form fields not showing
**Solution**: Restart Expo dev server with `npx expo start --clear` to clear cache

### Issue: Validation not working
**Solution**: Check that birthday child name is filled (it's the only required field)

### Issue: Theme custom input not showing
**Solution**: Make sure "Custom" chip is selected (highlighted in purple)

### Issue: Can't remove registry link
**Solution**: Remove button only shows when there's more than one link

### Issue: TypeScript errors in IDE
**Solution**: Run `npm install` in `apps/mobile` directory to update type definitions

## File Locations

- **Birthday Form**: `apps/mobile/components/forms/templates/BirthdayForm.tsx`
- **Template Router**: `apps/mobile/components/forms/TemplateForm.tsx`
- **Wizard Step**: `apps/mobile/app/events/create/template-details.tsx`
- **Review Screen**: `apps/mobile/app/events/create/review.tsx` (with template settings integration)

## Next Steps

After testing the birthday form:

1. **Implement Wedding Form** with similar comprehensive fields:
   - Ceremony/reception details
   - Seating chart
   - Meal choices
   - Dress code (formal, black-tie, etc.)

2. **Implement Conference Form**:
   - Multi-track session builder
   - Speaker management
   - CEU tracking
   - Networking features

3. **Test Guest Invitation Emails** with template-specific context:
   - Birthday invites should mention theme, activities, what to bring
   - Festival invites should include schedule download link
   - Conference invites should highlight relevant tracks

## Success Criteria

✅ All 9 form sections render correctly
✅ Conditional fields show/hide based on selections
✅ Form validates required fields
✅ Data persists through wizard steps
✅ Template settings included in event creation
✅ Guest invitations receive event context with template settings
✅ Form works on iOS and Android via Expo Go

---

**Status**: ✅ **Ready for Testing**

**Implementation Complete**: October 22, 2025
**Available in**: Expo Go (mobile/app/events/create/template-details.tsx)
