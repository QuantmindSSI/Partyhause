# Invitation Template System - User Workflow Guide

## Overview
The invitation system in PartyHause allows event creators to design beautiful, customized invitations using pre-made templates, then send them to guests via email or SMS.

---

## 🎨 Complete User Workflow

### Step 1: Access Invitations from Event Details
**Location:** `apps/mobile/app/events/[id]/index.tsx` (Line 654)

**User Action:**
1. Navigate to an event's detail page
2. Scroll to "Manage Event" section
3. Tap the **"Create Invitations"** action card

**What Happens:**
```tsx
<TouchableOpacity
  style={styles.actionCard}
  onPress={() => router.push(`/events/${id}/invites/templates`)}
>
  <Ionicons name="mail" size={24} color="#9333ea" />
  <Text>Create Invitations</Text>
  <Text>Design and send custom invites to guests</Text>
</TouchableOpacity>
```

**Navigation:** → `/events/[id]/invites/templates`

---

### Step 2: Browse & Select Template
**Screen:** `apps/mobile/app/events/[id]/invites/templates.tsx`

**User Experience:**
1. **View Template Gallery** - Grid layout with 2 columns
2. **See Template Previews** - Visual preview with gradient colors
3. **Check Template Details**:
   - Template name (e.g., "Elegant Evening", "Festive Fun")
   - Description
   - Style tag (ELEGANT, MODERN, FUN, MINIMAL, FESTIVE, FORMAL)
   - Premium badge (if applicable)

**Available Templates:** (From `@/types/invites.ts`)
```typescript
const INVITE_TEMPLATES = [
  {
    id: 'elegant-evening',
    name: 'Elegant Evening',
    style: 'elegant',
    colors: {
      primary: '#1F2937',
      secondary: '#6366F1',
      accent: '#F3F4F6'
    },
    is_premium: false
  },
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    style: 'minimal',
    colors: { ... },
    is_premium: false
  },
  // ... 10+ templates total
]
```

**User Action:**
- Tap any template card to select it

**What Happens:**
```tsx
const handleSelectTemplate = (template: InviteTemplate) => {
  setSelectedTemplate(template.id);
  router.push(`/events/${id}/invites/create?templateId=${template.id}`);
};
```

**Navigation:** → `/events/[id]/invites/create?templateId=elegant-evening`

---

### Step 3: Customize Invitation
**Screen:** `apps/mobile/app/events/[id]/invites/create.tsx`

**User Experience:**

#### A. Live Preview
- **Interactive preview** of the invitation at 80% scale
- Shows actual event data (title, date, location, host)
- Updates in real-time as user customizes

#### B. Customization Options

**1. Invitation Message** (Character limit: 200)
```
Input: "You're invited to my Summer BBQ Party!"
Field: TextInput (multiline)
Purpose: Personal greeting from host
```

**2. Display Options** (Toggle switches)
- ✅ **Show Event Details** - Date, time, location info
- ✅ **Show Location Map** - Embedded map preview
- ✅ **Show RSVP Button** - Call-to-action button

**3. Footer Text** (Character limit: 150)
```
Input: "Dress code: Casual. Please bring a dish to share!"
Field: TextInput (multiline)
Purpose: Additional instructions/notes
```

#### C. Customization Data Structure
```typescript
interface InviteCustomization {
  template_id: string;
  custom_message?: string;
  custom_footer?: string;
  show_event_details: boolean;
  show_location_map: boolean;
  show_rsvp_button: boolean;
}
```

**User Actions:**
1. Type custom message
2. Toggle display options on/off
3. Add footer text
4. Preview changes in real-time
5. Tap **"Continue to Send"** button

**What Happens:**
```tsx
const handleSaveAndContinue = () => {
  const finalCustomization = {
    template_id: template.id,
    custom_message: customMessage || undefined,
    custom_footer: customFooter || undefined,
    show_event_details: true,
    show_location_map: false,
    show_rsvp_button: true,
  };

  router.push({
    pathname: `/events/[id]/invites/send`,
    params: {
      id,
      templateId: template.id,
      customization: JSON.stringify(finalCustomization)
    }
  });
};
```

**Navigation:** → `/events/[id]/invites/send` (with customization data)

---

### Step 4: Select Recipients & Send
**Screen:** `apps/mobile/app/events/[id]/invites/send.tsx`

**User Experience:**

#### A. Recipient Selection
1. **View Guest List** - All guests added to the event
2. **Filter Options:**
   - All Guests
   - Not Yet Invited
   - Declined (re-invite)
3. **Select Recipients:**
   - "Select All" button
   - Individual checkboxes per guest
   - Show guest name, email, current RSVP status

#### B. Delivery Method
**Options:**
- 📧 **Email** (Primary method)
- 📱 **SMS** (If phone numbers available)
- 🔗 **Copy Link** (Share manually)

#### C. Sending Options
```typescript
interface SendOptions {
  send_immediately: boolean;
  scheduled_time?: Date;
  include_calendar_attachment: boolean;
  request_rsvp: boolean;
  rsvp_deadline?: Date;
}
```

**Settings:**
- ⏰ Send Now vs. Schedule Later
- 📅 Include calendar file (.ics attachment)
- ✅ Request RSVP by specific date
- 🔔 Track opens and clicks

#### D. Final Review
- **Preview Recipients** - List of who will receive invite
- **Preview Invitation** - Final look of the invite
- **Cost Estimate** - If using SMS (per message pricing)

**User Action:**
- Tap **"Send Invitations"** button

**What Happens:**
```tsx
const handleSendInvites = async () => {
  // Call API to send invitations
  const response = await fetch(`${API_URL}/api/invitations/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      event_id: id,
      template_id: templateId,
      customization: customization,
      recipients: selectedGuests,
      delivery_method: 'email',
      options: sendOptions
    })
  });

  if (response.ok) {
    Alert.alert('Success', 'Invitations sent!');
    router.back(); // Return to event details
  }
};
```

**API Endpoint:** `POST /api/invitations/send`

**Navigation:** → Returns to `/events/[id]` (Event Details)

---

## 🔧 Technical Implementation

### File Structure
```
apps/mobile/app/events/[id]/
├── _layout.tsx (NEW - Prevents path display)
├── index.tsx (Event details with "Create Invitations" button)
└── invites/
    ├── _layout.tsx (NEW - Manages invite flow navigation)
    ├── templates.tsx (Step 1: Template selection)
    ├── create.tsx (Step 2: Customization)
    └── send.tsx (Step 3: Recipient selection & sending)
```

### Navigation Flow
```
Event Details Page
     ↓ (Tap "Create Invitations")
Template Gallery
     ↓ (Select template)
Customize Invite
     ↓ (Tap "Continue to Send")
Send to Guests
     ↓ (Tap "Send Invitations")
Back to Event Details
```

### Data Flow
```typescript
// Step 1: Template Selection
Template ID → URL params

// Step 2: Customization
{
  templateId: 'elegant-evening',
  customization: {
    custom_message: 'Join us for a celebration!',
    show_event_details: true,
    show_location_map: false,
    show_rsvp_button: true,
    custom_footer: 'Dress code: Cocktail attire'
  }
} → URL params (JSON stringified)

// Step 3: Sending
{
  event_id: 'abc-123',
  template_id: 'elegant-evening',
  customization: { ... },
  recipients: [
    { id: '1', email: 'john@example.com', name: 'John' },
    { id: '2', email: 'jane@example.com', name: 'Jane' }
  ],
  delivery_method: 'email',
  options: {
    send_immediately: true,
    include_calendar_attachment: true,
    request_rsvp: true,
    rsvp_deadline: '2025-08-01'
  }
} → API POST /api/invitations/send
```

---

## 📧 Email Template Generation

### How Templates Work

1. **Template Definition** (`@/types/invites.ts`)
```typescript
interface InviteTemplate {
  id: string;
  name: string;
  description: string;
  style: 'elegant' | 'modern' | 'fun' | 'minimal' | 'festive' | 'formal';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  layout: 'classic' | 'modern' | 'card';
  is_premium: boolean;
}
```

2. **HTML Generation** (Backend)
```typescript
// netlify/functions/generate-invite.ts
export async function generateInviteHTML(
  template: InviteTemplate,
  customization: InviteCustomization,
  eventData: Event
): Promise<string> {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { 
            background: ${template.colors.primary}; 
            color: ${template.colors.accent};
            font-family: 'Helvetica', sans-serif;
          }
          .header { 
            background: linear-gradient(135deg, 
              ${template.colors.primary}, 
              ${template.colors.secondary}
            );
            padding: 40px;
            text-align: center;
          }
          .content { padding: 30px; }
          .footer { 
            background: ${template.colors.accent}; 
            padding: 20px; 
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${eventData.title}</h1>
        </div>
        <div class="content">
          ${customization.custom_message || ''}
          
          ${customization.show_event_details ? `
            <p><strong>When:</strong> ${eventData.date} at ${eventData.time}</p>
            <p><strong>Where:</strong> ${eventData.location}</p>
          ` : ''}
          
          ${customization.show_rsvp_button ? `
            <a href="${rsvpLink}" style="
              background: ${template.colors.secondary};
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 8px;
              display: inline-block;
              margin: 20px 0;
            ">RSVP Now</a>
          ` : ''}
        </div>
        <div class="footer">
          ${customization.custom_footer || ''}
          <p>Hosted by ${eventData.host_name}</p>
        </div>
      </body>
    </html>
  `;
}
```

3. **Email Sending** (MailerSend API)
```typescript
// netlify/functions/send-email.ts
const emailData = {
  from: { email: 'noreply@partyhause.com', name: 'PartyHause' },
  to: recipients.map(r => ({ email: r.email, name: r.name })),
  subject: `You're invited to ${event.title}!`,
  html: generatedHTML,
  attachments: includeCalendar ? [calendarFile] : []
};

await mailersend.send(emailData);
```

---

## 🎨 Template Preview Component

**Location:** `apps/mobile/components/invites/InvitePreview.tsx`

```tsx
interface InvitePreviewProps {
  template: InviteTemplate;
  customization: Partial<InviteCustomization>;
  eventData: {
    title: string;
    date: string;
    time: string;
    location: string;
    host_name: string;
  };
  scale?: number;
}

export function InvitePreview({ 
  template, 
  customization, 
  eventData,
  scale = 1 
}: InvitePreviewProps) {
  return (
    <View style={[styles.container, { transform: [{ scale }] }]}>
      <LinearGradient
        colors={[template.colors.primary, template.colors.secondary]}
        style={styles.header}
      >
        <Text style={styles.title}>{eventData.title}</Text>
      </LinearGradient>
      
      <View style={styles.content}>
        {customization.custom_message && (
          <Text style={styles.message}>{customization.custom_message}</Text>
        )}
        
        {customization.show_event_details && (
          <View style={styles.details}>
            <Text>📅 {eventData.date} at {eventData.time}</Text>
            <Text>📍 {eventData.location}</Text>
          </View>
        )}
        
        {customization.show_rsvp_button && (
          <TouchableOpacity style={styles.rsvpButton}>
            <Text style={styles.rsvpText}>RSVP Now</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {customization.custom_footer && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>{customization.custom_footer}</Text>
        </View>
      )}
    </View>
  );
}
```

---

## 📊 Database Schema

### Invitations Table
```sql
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  customization JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Invitation Recipients Table
```sql
CREATE TABLE invitation_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invitation_id UUID REFERENCES invitations(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id),
  email TEXT NOT NULL,
  phone TEXT,
  delivery_method TEXT CHECK (delivery_method IN ('email', 'sms')),
  sent_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  rsvp_status TEXT CHECK (rsvp_status IN ('pending', 'accepted', 'declined', 'tentative')),
  rsvp_at TIMESTAMP
);
```

---

## 🔍 Guest Receiving Invitation

### Guest Experience
1. **Receive Email** - Professional branded email from PartyHause
2. **View Invitation** - Beautiful template with event details
3. **Click RSVP Button** - Opens mobile app or web page
4. **RSVP Page** - Guest can accept, decline, or mark as maybe
5. **Add to Calendar** - Option to download .ics file
6. **Share Event** - Forward to friends (if permitted)

### RSVP Link Structure
```
https://partyhause.netlify.app/guest/invite/{inviteId}
  ?guest={guestId}
  &token={uniqueToken}
```

**Guest Landing Page:** `apps/mobile/app/guest/invite/[inviteId].tsx` (From GUEST_INTERFACE_PLAN.md)

---

## ✅ Fixed Issues

### 1. Page Path Display
**Problem:** Page paths like `[id]/invites/templates` showing in headers

**Solution:** Created `_layout.tsx` files to manage navigation:
- `apps/mobile/app/events/[id]/_layout.tsx` - Handles event screens
- `apps/mobile/app/events/[id]/invites/_layout.tsx` - Handles invite flow

**Result:** Users see clean headers like "Event Details", "Invite Templates", "Customize Invite"

### 2. Template Navigation
**Problem:** Invite templates not wired to event details

**Solution:** Added "Create Invitations" action card in `events/[id]/index.tsx` (Line 654)

**Result:** Clear entry point from event management

---

## 🎯 User Journey Summary

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  1. Host creates event                                       │
│  2. Host adds guests to guest list                           │
│  3. Host taps "Create Invitations" on event details page     │
│     ↓                                                         │
│  4. Host browses template gallery                            │
│  5. Host selects a template (e.g., "Elegant Evening")        │
│     ↓                                                         │
│  6. Host customizes invitation:                              │
│     - Adds personal message                                  │
│     - Toggles display options                                │
│     - Adds footer notes                                      │
│     - Sees live preview                                      │
│     ↓                                                         │
│  7. Host selects recipients from guest list                  │
│  8. Host chooses delivery method (Email/SMS)                 │
│  9. Host configures sending options                          │
│  10. Host taps "Send Invitations"                            │
│      ↓                                                        │
│  11. Invitations sent via email/SMS                          │
│  12. Guests receive beautiful invitations                    │
│  13. Guests click RSVP button                                │
│  14. Guests land on RSVP page                                │
│  15. Guests accept/decline/maybe                             │
│  16. Host sees updated RSVP status                           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🚀 Next Steps for Enhancement

1. **Template Builder** - Allow hosts to create custom templates
2. **A/B Testing** - Test different invitation designs
3. **Analytics Dashboard** - Track open rates, click rates, RSVP rates
4. **Reminder System** - Auto-send reminders to non-responders
5. **Multi-Language** - Support invitations in different languages
6. **Video Invitations** - Record video messages
7. **Animation Templates** - Animated invitation previews

---

**Status:** ✅ Fully Implemented & Documented
**Files Modified:** 2 new `_layout.tsx` files created
**User Impact:** Clean navigation, professional invitation flow

