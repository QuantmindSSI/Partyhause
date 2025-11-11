# 🎨 Invitation Template System - Visual Walkthrough

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         EVENT DETAILS PAGE                              │
│                  apps/mobile/app/events/[id]/index.tsx                 │
│                                                                          │
│  📊 Event Statistics                                                    │
│  ├─ 50 Total Guests    ├─ 30 Accepted    ├─ 15 Pending                │
│                                                                          │
│  🎯 Manage Event                                                        │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │  📧 Create Invitations                                    │          │
│  │  Design and send custom invites to guests                 │  ◄─ TAP │
│  └──────────────────────────────────────────────────────────┘          │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │  👥 Guest List                                            │          │
│  │  Manage guests, RSVPs, and check-ins                     │          │
│  └──────────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ router.push('/events/123/invites/templates')
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      TEMPLATE GALLERY                                   │
│              apps/mobile/app/events/[id]/invites/templates.tsx          │
│                                                                          │
│  Choose Invite Template                                                 │
│  Select a design to customize                                           │
│                                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │ 🌟 Elegant │  │ 💎 Modern  │  │ 🎉 Festive │  │ 🎨 Minimal │       │
│  │  Evening   │  │  Minimal   │  │    Fun     │  │   Clean    │       │
│  │            │  │            │  │            │  │            │       │
│  │ [Gradient] │  │ [Gradient] │  │ [Gradient] │  │ [Gradient] │       │
│  │  Preview   │  │  Preview   │  │  Preview   │  │  Preview   │       │
│  │            │  │            │  │    ⭐PRO   │  │            │       │
│  │  ELEGANT   │  │  MINIMAL   │  │  FESTIVE   │  │  MINIMAL   │  ◄─ TAP
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘       │
│                                                                          │
│  [10+ templates in 2-column grid]                                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ router.push('/events/123/invites/create?templateId=elegant-evening')
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      CUSTOMIZE INVITE                                   │
│              apps/mobile/app/events/[id]/invites/create.tsx             │
│                                                                          │
│  Customize Invite - Elegant Evening                      [Next →]      │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────┐       │
│  │                    LIVE PREVIEW                             │       │
│  │  ┌─────────────────────────────────────────────────┐        │       │
│  │  │         🌟 Summer BBQ Party 🌟                  │        │       │
│  │  │                                                  │        │       │
│  │  │  Join us for a celebration!                     │ ◄────  │ Updates
│  │  │                                                  │        │   in
│  │  │  📅 July 15, 2025 at 4:00 PM                   │        │ real-time
│  │  │  📍 123 Main Street, Backyard                   │        │       │
│  │  │                                                  │        │       │
│  │  │         [ 🎯 RSVP Now ]                         │        │       │
│  │  │                                                  │        │       │
│  │  │  Dress code: Casual                             │ ◄────  │       │
│  │  │  Please bring a dish!                           │        │       │
│  │  │                                                  │        │       │
│  │  │  Hosted by John Doe                             │        │       │
│  │  └─────────────────────────────────────────────────┘        │       │
│  └─────────────────────────────────────────────────────────────┘       │
│                                                                          │
│  ✏️ Customization Options:                                              │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ 💬 Invitation Message                                     │          │
│  │ ┌────────────────────────────────────────────────────┐   │          │
│  │ │ Join us for a celebration!                         │   │ ◄─ TYPE │
│  │ │                                                     │   │          │
│  │ └────────────────────────────────────────────────────┘   │          │
│  │ 45/200 characters                                         │          │
│  └──────────────────────────────────────────────────────────┘          │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ ⚙️ Display Options                                        │          │
│  │  ℹ️  Show Event Details              [●────]  ON         │ ◄─ TOGGLE
│  │  🗺️  Show Location Map               [────○]  OFF        │          │
│  │  ✅  Show RSVP Button                 [●────]  ON         │          │
│  └──────────────────────────────────────────────────────────┘          │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ 📝 Footer Text                                            │          │
│  │ ┌────────────────────────────────────────────────────┐   │          │
│  │ │ Dress code: Casual. Please bring a dish!           │   │ ◄─ TYPE │
│  │ └────────────────────────────────────────────────────┘   │          │
│  │ 48/150 characters                                         │          │
│  └──────────────────────────────────────────────────────────┘          │
│                                                                          │
│  [Back to Templates]  [Continue to Send →]  ◄─────────────── TAP      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ router.push('/events/123/invites/send?templateId=...&customization=...')
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      SEND INVITATIONS                                   │
│              apps/mobile/app/events/[id]/invites/send.tsx               │
│                                                                          │
│  Send Invitations                                                       │
│  Select recipients and delivery options                                 │
│                                                                          │
│  👥 Select Recipients                                                   │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │  [✓] Select All (50 guests)          Filter: [All ▼]    │          │
│  │  ─────────────────────────────────────────────────────── │          │
│  │  [✓] John Smith                                          │          │
│  │      john@example.com           Status: Not Invited      │ ◄─ SELECT│
│  │  ─────────────────────────────────────────────────────── │          │
│  │  [✓] Jane Doe                                            │          │
│  │      jane@example.com           Status: Not Invited      │          │
│  │  ─────────────────────────────────────────────────────── │          │
│  │  [ ] Bob Johnson                                         │          │
│  │      bob@example.com            Status: ✅ Accepted       │          │
│  │  ─────────────────────────────────────────────────────── │          │
│  │  [50 more guests...]                                     │          │
│  └──────────────────────────────────────────────────────────┘          │
│                                                                          │
│  📨 Delivery Method                                                     │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │  (●) Email    ( ) SMS    ( ) Copy Link                   │ ◄─ SELECT│
│  └──────────────────────────────────────────────────────────┘          │
│                                                                          │
│  ⚙️ Sending Options                                                     │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │  (●) Send Now    ( ) Schedule for Later                  │          │
│  │  [✓] Include calendar attachment (.ics file)             │          │
│  │  [✓] Request RSVP by: [Aug 1, 2025 ▼]                   │          │
│  │  [✓] Track opens and clicks                              │          │
│  └──────────────────────────────────────────────────────────┘          │
│                                                                          │
│  📊 Summary                                                             │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │  Recipients: 48 guests                                    │          │
│  │  Method: Email                                            │          │
│  │  Estimated delivery: 2-5 minutes                          │          │
│  │  Cost: FREE (email)                                       │          │
│  └──────────────────────────────────────────────────────────┘          │
│                                                                          │
│  [Cancel]  [📧 Send Invitations]  ◄──────────────────────── TAP       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ POST /api/invitations/send
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        BACKEND PROCESSING                               │
│                   netlify/functions/send-email.ts                       │
│                                                                          │
│  1. Generate HTML from template + customization                        │
│  2. Create calendar attachment (.ics)                                  │
│  3. Generate unique RSVP links for each guest                          │
│  4. Send via MailerSend API                                            │
│  5. Log in database (invitation_recipients table)                      │
│  6. Return success confirmation                                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      SUCCESS CONFIRMATION                               │
│                                                                          │
│              ✅ Invitations Sent Successfully!                          │
│                                                                          │
│              48 invitations have been sent to your guests               │
│              Track responses on the Guest List page                     │
│                                                                          │
│              [View Guest List]  [Back to Event]                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ router.back() → returns to event details
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      BACK TO EVENT DETAILS                              │
│                  apps/mobile/app/events/[id]/index.tsx                 │
│                                                                          │
│  📊 Event Statistics (UPDATED)                                          │
│  ├─ 50 Total Guests    ├─ 2 Invited    ├─ 48 Pending                  │
│                                                                          │
│  Recent Activity:                                                       │
│  📧 48 invitations sent - 2 minutes ago                                │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📱 Guest Receiving Experience

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         GUEST'S INBOX                                   │
│                                                                          │
│  From: PartyHause <noreply@partyhause.com>                             │
│  Subject: You're invited to Summer BBQ Party! 🎉                       │
│                                                                          │
│  [Email Preview]                                                        │
│  ┌───────────────────────────────────────────────────────┐             │
│  │          🌟 Summer BBQ Party 🌟                       │             │
│  │                                                        │             │
│  │  Hi John,                                              │             │
│  │                                                        │             │
│  │  Join us for a celebration!                           │             │
│  │                                                        │             │
│  │  📅 July 15, 2025 at 4:00 PM                         │             │
│  │  📍 123 Main Street, Backyard                         │             │
│  │                                                        │             │
│  │         [ 🎯 RSVP Now ]  ◄────────────────── CLICK   │             │
│  │                                                        │             │
│  │  Dress code: Casual. Please bring a dish!            │             │
│  │                                                        │             │
│  │  Hosted by Jane Doe                                   │             │
│  └───────────────────────────────────────────────────────┘             │
│                                                                          │
│  📎 Attachment: Summer_BBQ_Party.ics (calendar file)                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Click "RSVP Now" button
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         GUEST RSVP PAGE                                 │
│        apps/mobile/app/guest/invite/[inviteId].tsx                     │
│        (From GUEST_INTERFACE_PLAN.md)                                  │
│                                                                          │
│  🎉 You're Invited!                                                     │
│                                                                          │
│  ┌───────────────────────────────────────────────────────┐             │
│  │          🌟 Summer BBQ Party 🌟                       │             │
│  │                                                        │             │
│  │  Join us for a celebration!                           │             │
│  │                                                        │             │
│  │  📅 July 15, 2025 at 4:00 PM                         │             │
│  │  📍 123 Main Street, Backyard                         │             │
│  │                                                        │             │
│  │  Hosted by Jane Doe                                   │             │
│  └───────────────────────────────────────────────────────┘             │
│                                                                          │
│  Will you attend?                                                       │
│  ┌───────────────────────────────────────────────────────┐             │
│  │  [✅ I'm Coming!]       [❓ Maybe]       [❌ Can't Make It]         │
│  └───────────────────────────────────────────────────────┘             │
│                                                                          │
│  Additional Details:                                                    │
│  ┌───────────────────────────────────────────────────────┐             │
│  │  Bringing guests:  [0 ▼]                              │             │
│  │  Dietary restrictions: ___________________________     │             │
│  │  Message to host: _________________________________     │             │
│  └───────────────────────────────────────────────────────┘             │
│                                                                          │
│  [Submit RSVP]                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ POST /api/invitations/respond
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     HOST'S EVENT PAGE UPDATES                           │
│                                                                          │
│  📊 Event Statistics (REAL-TIME UPDATE)                                 │
│  ├─ 50 Total Guests    ├─ 3 Accepted ↑   ├─ 47 Pending ↓              │
│                                                                          │
│  Recent Activity:                                                       │
│  ✅ John Smith accepted invitation - Just now                           │
│  📧 48 invitations sent - 5 minutes ago                                │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Technical Architecture

### Component Hierarchy
```
EventDetailsScreen (index.tsx)
  │
  ├─ ActionCard: "Create Invitations" [ENTRY POINT]
  │   │
  │   └─ OnPress: Navigate to TemplateGallery
  │
  └─ Navigation Flow:
      │
      ├─ TemplateGalleryScreen (templates.tsx)
      │   ├─ TemplateCard (x10+ templates)
      │   │   ├─ Template Preview (gradient + icon)
      │   │   ├─ Template Info (name, description, style)
      │   │   └─ OnPress: Navigate to CustomizeScreen
      │   │
      │   └─ Navigation: router.push with templateId
      │
      ├─ CustomizeInviteScreen (create.tsx)
      │   ├─ InvitePreview Component (live preview)
      │   ├─ CustomizationOptions
      │   │   ├─ TextInput: Custom Message
      │   │   ├─ ToggleSwitches: Display Options
      │   │   └─ TextInput: Footer Text
      │   │
      │   └─ Navigation: router.push with customization data
      │
      └─ SendInvitationsScreen (send.tsx)
          ├─ RecipientSelector (guest list with checkboxes)
          ├─ DeliveryMethodPicker (Email/SMS/Link)
          ├─ SendingOptions (Schedule, Calendar, RSVP deadline)
          ├─ SummaryCard (review before sending)
          │
          └─ OnSend: API call → Success → Navigate back
```

### Data Flow
```
Event Details
  ↓ [Template ID]
Template Selection
  ↓ [Template Object]
Customization
  ↓ [Customization Object + Template]
Recipient Selection
  ↓ [Full Invitation Data]
API Send
  ↓ [Email Generation + Delivery]
Guest Inbox
  ↓ [RSVP Link]
Guest RSVP Page
  ↓ [Response Data]
Host Event Updates
```

---

## 🎨 Template Examples

### 1. Elegant Evening
```
Colors: Black (#1F2937) → Indigo (#6366F1) gradient
Style: Elegant
Layout: Classic centered
Icon: ✨ Sparkles
Perfect for: Formal dinners, galas, upscale parties
```

### 2. Festive Fun
```
Colors: Orange (#F97316) → Pink (#EC4899) gradient
Style: Fun
Layout: Modern card
Icon: 🎉 Party popper
Perfect for: Birthday parties, celebrations, casual events
```

### 3. Modern Minimal
```
Colors: Gray (#6B7280) → White (#F9FAFB) gradient
Style: Minimal
Layout: Clean modern
Icon: 💎 Diamond
Perfect for: Corporate events, professional gatherings
```

---

## 📊 Database Tracking

### What Gets Stored
```sql
-- Invitation record
invitation_id: uuid
event_id: uuid
template_id: 'elegant-evening'
customization: {
  custom_message: "Join us!",
  show_event_details: true,
  show_location_map: false,
  show_rsvp_button: true,
  custom_footer: "Dress code: Casual"
}
created_at: timestamp

-- Recipient tracking (per guest)
recipient_id: uuid
invitation_id: uuid
guest_id: uuid
email: 'john@example.com'
delivery_method: 'email'
sent_at: timestamp
opened_at: timestamp (tracked via email pixel)
clicked_at: timestamp (tracked via RSVP link)
rsvp_status: 'accepted' | 'declined' | 'tentative' | 'pending'
rsvp_at: timestamp
```

---

## ✅ Problem Solved: Page Paths

### Before Fix
```
Header showed: "events › [id] › invites › templates"
User saw technical routing paths
Confusing and unprofessional
```

### After Fix (with _layout.tsx files)
```
Header shows: "Invite Templates"
Clean, user-friendly navigation
Professional appearance
```

### How It Works
```tsx
// apps/mobile/app/events/[id]/invites/_layout.tsx
export default function InvitesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="templates" options={{ title: 'Invite Templates' }} />
      <Stack.Screen name="create" options={{ title: 'Customize Invite' }} />
      <Stack.Screen name="send" options={{ title: 'Send Invitations' }} />
    </Stack>
  );
}
```

Each screen manages its own header with custom styling, so users see:
- ✅ "Invite Templates" (not "templates")
- ✅ "Customize Invite" (not "[id]/invites/create")
- ✅ "Send Invitations" (not "send")

---

**Status:** ✅ Complete & Production Ready
**User Experience:** Seamless 3-step invitation creation
**Technical Implementation:** Fully wired and documented

