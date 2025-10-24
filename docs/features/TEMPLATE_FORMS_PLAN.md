# Scenario-Based Template Forms - Implementation Plan

## Overview
Each event template requires unique forms and features tailored to its specific use case. Generic timeline blocks don't work for all events - festivals need schedule uploads, birthdays need gift registries, conferences need session builders, etc.

## Template-Specific Requirements

### 1. 🎂 Birthday Party
**Unique Fields**:
- Birthday person name
- Age / milestone (1st birthday, 21st, 50th, etc.)
- Theme selection (with presets + custom)
- Gift registry integration
  - Link to Amazon/Target registry
  - Or manual gift wish list
- Dress code (casual, costume party, formal)
- Kids activities (if children invited)
- Cake details (flavor, dietary restrictions)

**Timeline Approach**: Standard timeline blocks work well
- Arrival & mingling
- Games/activities
- Cake cutting
- Gift opening

**Special Features**:
- RSVP with kids count
- Gift tracking (who brought what)
- Photo booth moments

---

### 2. 💍 Wedding
**Unique Fields**:
- Couple names (Partner 1 & Partner 2)
- Ceremony details:
  - Ceremony location (if different from reception)
  - Ceremony time
  - Religious/cultural traditions
- Reception details:
  - Cocktail hour (yes/no)
  - Seated dinner vs buffet
  - Bar type (open, cash, limited)
- Wedding party:
  - Bridesmaids/groomsmen count
  - Flower girl/ring bearer
- Dress code (black tie, cocktail, beach formal)
- Registry links (multiple)
- Accommodation recommendations
  - Hotel blocks
  - Nearby lodging
- RSVP deadline
- Meal choices (chicken, fish, vegetarian)

**Timeline Approach**: Custom wedding timeline
- Pre-ceremony (getting ready)
- Ceremony
- Cocktail hour
- Reception entrance
- First dance
- Parent dances
- Toasts
- Dinner service
- Cake cutting
- Bouquet toss
- Last dance

**Special Features**:
- Seating chart builder
- Meal selection tracking
- Plus-one management
- Gift tracker

---

### 3. 🚀 Product Launch
**Unique Fields**:
- Product name & description
- Target audience (press, influencers, customers, investors)
- Demo schedule:
  - Upload schedule file
  - Or build demo slots
- Press kit:
  - Press release upload
  - High-res images
  - Product specs
- Media requirements:
  - Photography (yes/no)
  - Videography (yes/no)
  - Live streaming (platform, URL)
- Swag/giveaways:
  - What's being given
  - Quantity
- Presentation slots:
  - Keynote speaker
  - Product demo
  - Q&A session

**Timeline Approach**: Presentation-focused timeline
- Registration/check-in
- Keynote presentation
- Product demo
- Hands-on demo stations
- Media interviews
- Networking

**Special Features**:
- Media credential verification
- Demo station booking
- Lead capture form
- Social media wall

---

### 4. 💰 Fundraiser
**Unique Fields**:
- Cause/charity name
- Fundraising goal ($$$)
- Donation methods:
  - Online link
  - Cash/check at event
  - Auction items
- Auction structure:
  - Silent auction (yes/no)
  - Live auction (yes/no)
  - Upload auction item list
- Tax information:
  - Tax ID
  - Tax deductibility %
  - Receipt generation
- Sponsorship tiers:
  - Gold/Silver/Bronze
  - Benefits per tier
- Program/speakers:
  - Opening remarks
  - Guest speaker
  - Beneficiary story
  - Appeal/ask

**Timeline Approach**: Program-based timeline
- Registration & silent auction browsing
- Program begins (seated)
- Appetizers/dinner
- Speaker presentations
- Appeal/donation ask
- Live auction
- Closing remarks

**Special Features**:
- Donation tracking
- Auction bid tracking
- Sponsor recognition
- Tax receipt generation

---

### 5. 🎵 Music Festival
**Unique Fields**:
- Festival duration (1-7 days)
- Lineup/artist roster:
  - **Upload schedule file** (CSV, PDF, Excel)
  - Or build in-app
- Stage configuration:
  - Multiple stages (Main, Side, Acoustic, etc.)
  - Stage locations on map
- Ticket tiers:
  - GA, VIP, Platinum
  - Pricing per tier
  - What's included
- Camping:
  - Camping available (yes/no)
  - RV spots
  - Tent camping
  - Glamping options
- Food vendors:
  - Upload vendor list
  - Food type categories
- Amenities:
  - Water stations
  - First aid
  - ATMs
  - Lockers
- Transportation:
  - Parking info
  - Shuttle service
  - Rideshare drop-off

**Timeline Approach**: ❌ NO traditional timeline
**Instead**: Schedule upload + multi-stage view
- Upload festival schedule (acts, times, stages)
- Visual schedule grid
- Filter by stage, day, genre

**Special Features**:
- Interactive festival map
- Artist notifications
- Schedule conflicts (same-time acts)
- Personalized schedule builder

---

### 6. 🎤 Conference
**Unique Fields**:
- Conference theme
- Track system:
  - Multiple tracks (Tech, Business, Design)
  - Sessions per track
- Session builder:
  - Session title
  - Speaker(s)
  - Room
  - Time slot
  - Capacity
- Speaker management:
  - Speaker bios
  - Headshots
  - Social media
- Registration types:
  - Full conference
  - Single day
  - Workshop only
- CEU/Credits:
  - Credits offered
  - Tracking attendance
- Networking events:
  - Happy hours
  - Lunches
  - Speed networking

**Timeline Approach**: ❌ NO simple timeline
**Instead**: Multi-track session builder
- Upload session schedule
- Or build session by session
- Room assignments
- Speaker assignments

**Special Features**:
- Session check-in (QR codes)
- CEU credit tracking
- Personal agenda builder
- Session feedback forms
- Speaker Q&A portal

---

### 7. ✈️ Travel/Trip
**Unique Fields**:
- Destination
- Trip type (vacation, destination wedding, bachelor party)
- Group size (small group, large group)
- Itinerary builder:
  - Day-by-day activities
  - Free time blocks
  - Optional activities
- Accommodations:
  - Hotel/Airbnb details
  - Room assignments
  - Check-in/check-out
- Transportation:
  - Flight details
  - Ground transportation
  - Rental cars
- Cost breakdown:
  - Total trip cost
  - Per-person cost
  - What's included/excluded
  - Payment schedule
- Packing list:
  - Suggested items
  - Weather expectations
- Travel documents:
  - Passport requirements
  - Visa requirements
  - Travel insurance

**Timeline Approach**: Day-by-day itinerary
- Not hour-by-hour timeline
- Daily activity schedule
- Flexible time blocks

**Special Features**:
- Shared packing list
- Expense splitting
- Flight tracking
- Group chat/coordination

---

### 8. 🏡 Block Party
**Unique Fields**:
- Street/neighborhood area
- Permit status:
  - Required (yes/no)
  - Permit number
  - City approval
- Street closure:
  - Time closed
  - Barricade locations
- Potluck coordination:
  - Sign-up sheet (who brings what)
  - Dietary restrictions
  - Serving equipment needed
- Activities/games:
  - Kids games (bounce house, face painting)
  - Adult games (cornhole, volleyball)
  - Live music/DJ
- Setup/cleanup:
  - Tables/chairs needed
  - Canopy/tents
  - Cleanup crew signup
- Safety:
  - First aid kit location
  - Emergency contacts
  - Neighborhood watch

**Timeline Approach**: Simple event flow
- Setup time
- Party start
- Meal time
- Activities period
- Cleanup

**Special Features**:
- Potluck signup board
- Setup/cleanup volunteer signup
- Neighbor contact list

---

### 9. 🎓 Class Reunion
**Unique Fields**:
- School name
- Graduation year
- Reunion milestone (10yr, 25yr, 50yr)
- Classmate finder:
  - Upload class roster
  - Mark as "found" / "not found"
  - Last known contact info
- Memory sharing:
  - Upload old photos
  - Share stories
  - Where are they now?
- Venue details:
  - Casual vs formal
  - Dress code
- Memorabilia:
  - Yearbook scanning
  - Time capsule
- Alumni donations:
  - School foundation
  - Scholarship fund

**Timeline Approach**: Standard timeline works
- Reception/check-in
- Mingling & memory lane
- Dinner
- Program (speeches, awards)
- Dancing/socializing

**Special Features**:
- Classmate directory
- Memory wall (photos, stories)
- "Most likely to..." voting
- Reunion photo booth

---

### 10. 💻 Hackathon
**Unique Fields**:
- Challenge theme
- Duration (24hr, 48hr, weekend)
- Team structure:
  - Team size (2-5 people)
  - Team formation (pre-formed vs mix)
  - Solo participation allowed
- Judging criteria:
  - Innovation
  - Technical complexity
  - Design
  - Presentation
- Prizes:
  - 1st/2nd/3rd place
  - Category awards
  - Sponsor prizes
- Resources provided:
  - APIs available
  - Datasets
  - Cloud credits
  - Hardware
- Mentors:
  - Mentor list
  - Expertise areas
  - Office hours
- Food schedule:
  - Meals provided
  - Snacks/drinks
  - Dietary restrictions
- Technical requirements:
  - WiFi details
  - Power outlets
  - Monitors available

**Timeline Approach**: Milestone-based timeline
- Opening ceremony
- Hacking begins
- Meal breaks
- Check-in milestones
- Feature freeze
- Demos/presentations
- Judging
- Awards ceremony

**Special Features**:
- Team formation tool
- Mentor booking
- Project submission portal
- Real-time leaderboard (optional)
- Hardware checkout system

---

### 11. 🏢 Corporate Event
**Unique Fields**:
- Event purpose (all-hands, retreat, training, celebration)
- Audience (all staff, leadership, specific dept)
- Agenda builder:
  - Session-by-session
  - Breakout rooms
  - Workshop tracks
- Presentation needs:
  - AV requirements
  - Screen sharing
  - Microphones
  - Recording (yes/no)
- Dress code
- Remote attendance:
  - Hybrid event (yes/no)
  - Zoom link
  - Recording available
- Catering:
  - Breakfast/lunch/dinner
  - Dietary restrictions
  - Alcohol (yes/no)
- Team building:
  - Activities planned
  - Icebreakers
  - Team challenges

**Timeline Approach**: Agenda-based timeline
- Registration/coffee
- Welcome & opening remarks
- Keynote/main presentation
- Break
- Breakout sessions
- Lunch
- Afternoon sessions
- Closing remarks
- Reception (optional)

**Special Features**:
- Meeting room assignments
- Attendance tracking
- Presentation uploads
- Feedback surveys
- Action items tracking

---

## Implementation Strategy

### Phase 1: Core Infrastructure
1. **Create base template form system**
   - Template detection
   - Conditional field rendering
   - Form state management

2. **Create reusable field components**
   - Text input with validation
   - Date/time pickers
   - File upload (images, PDFs, CSVs)
   - Multi-select dropdowns
   - Registry link inputs
   - Rich text editor (for descriptions)

### Phase 2: Template-Specific Forms
Build forms in priority order:

**High Priority** (Most common):
1. Birthday - Standard but with gift registry
2. Wedding - Complex but highly structured
3. Corporate - Professional events

**Medium Priority**:
4. Festival - Schedule upload critical
5. Conference - Session builder
6. Fundraiser - Donation tracking
7. Block Party - Community coordination

**Lower Priority** (Specialized):
8. Product Launch - Demo scheduling
9. Travel - Itinerary builder
10. Hackathon - Team formation
11. Class Reunion - Classmate finder

### Phase 3: Special Features Per Template
- File upload for schedules (Festival, Conference)
- Gift registry integration (Birthday, Wedding)
- Donation processing (Fundraiser)
- Session builder (Conference)
- Potluck coordinator (Block Party)
- Team formation (Hackathon)

---

## Technical Approach

### 1. Form Component Structure
```
apps/mobile/components/forms/
  ├── TemplateForm.tsx              # Main form router
  ├── templates/
  │   ├── BirthdayForm.tsx
  │   ├── WeddingForm.tsx
  │   ├── FestivalForm.tsx
  │   ├── ConferenceForm.tsx
  │   ├── ProductLaunchForm.tsx
  │   ├── FundraiserForm.tsx
  │   ├── TravelForm.tsx
  │   ├── BlockPartyForm.tsx
  │   ├── ClassReunionForm.tsx
  │   ├── HackathonForm.tsx
  │   └── CorporateForm.tsx
  └── fields/
      ├── TextField.tsx
      ├── DateTimePicker.tsx
      ├── FileUpload.tsx
      ├── RegistryLinks.tsx
      ├── ScheduleUpload.tsx
      ├── DonationGoal.tsx
      ├── SessionBuilder.tsx
      └── ... (more specialized fields)
```

### 2. Database Schema Updates
Add `template_settings` JSONB field to events table to store template-specific data:

```sql
-- Birthday
{
  "birthday_person": "John Doe",
  "age": 30,
  "theme": "80s Retro",
  "gift_registry": {
    "links": ["https://amazon.com/registry/123"],
    "wishes": ["Board games", "Wine"]
  },
  "dress_code": "Casual - wear your best 80s outfit!"
}

-- Festival
{
  "schedule_file": "https://cdn.../festival-schedule.pdf",
  "stages": [
    {"name": "Main Stage", "location": "North Field"},
    {"name": "Acoustic Stage", "location": "Forest Grove"}
  ],
  "camping": true,
  "camping_options": ["Tent", "RV", "Glamping"]
}

-- Conference
{
  "tracks": ["Technology", "Business", "Design"],
  "sessions": [
    {
      "title": "Future of AI",
      "speaker": "Jane Smith",
      "track": "Technology",
      "room": "Hall A",
      "time": "10:00 AM"
    }
  ],
  "ceu_credits": 12
}
```

### 3. Timeline vs Schedule
- **Use Timeline**: Birthday, Wedding, Fundraiser, Block Party, Class Reunion, Corporate, Hackathon
- **Use Schedule Upload**: Festival (multiple stages, dozens of acts)
- **Use Session Builder**: Conference (sessions across tracks/rooms)
- **Use Itinerary**: Travel (day-by-day, not minute-by-minute)
- **Use Demo Slots**: Product Launch (timed presentations)

---

## Next Steps

1. Update `basics.tsx` to route to template-specific forms
2. Create template form components (start with Birthday, Wedding, Festival)
3. Add file upload capability for schedules
4. Build session/schedule builders for Conference and Festival
5. Update API to handle `template_settings` JSONB field
6. Test each template form thoroughly

This approach ensures each event type gets exactly what it needs without cluttering forms with irrelevant fields.
