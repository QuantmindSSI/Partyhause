# PartyHause Web PWA Upgrade Plan

## 🎯 Objective
Bring the web application up to parity with the mobile app and convert it into a fully installable Progressive Web App (PWA).

---

## 📊 Feature Parity Analysis

### ✅ What Web Currently Has
- Landing page with creative design
- Authentication (login/signup)
- Basic dashboard
- Event creation (basic)
- Event management
- QR scanner
- Guest view
- Games page
- Template manager

### ❌ What Web is Missing (Available in Mobile)
1. **Enhanced Dashboard with Event Cards**
   - Beautiful card-based event list
   - Event statistics per card
   - Quick actions on cards

2. **Multi-Step Event Creation Wizard**
   - Template selection screen
   - Event basics (title, date, location)
   - Guest import (contacts, manual, CSV)
   - Template-specific details forms
   - Timeline/schedule builder
   - Review & publish screen

3. **Guest Management Features**
   - Full guest list view with filters
   - RSVP tracking dashboard
   - Check-in functionality
   - Guest details (plus-ones, dietary, notes)
   - Search and filter guests

4. **Event Details Screen**
   - Comprehensive event overview
   - Statistics dashboard
   - Template-specific details display
   - Management actions

5. **Timeline Management**
   - Add/edit timeline blocks
   - Different block types (activity, meal, speech, etc.)
   - Duration and time management

6. **Email Invitations**
   - Send invitations to guests
   - Email toggle when adding guests
   - Integration with MailerSend API

7. **Template Forms**
   - Birthday form (adult & kids)
   - Wedding form
   - Product launch form
   - And more...

---

## 🚀 Implementation Plan

### Phase 1: PWA Configuration (30 minutes)
- [x] Create PWA manifest
- [x] Add service worker for offline support
- [x] Configure install prompts
- [x] Add app icons in various sizes
- [x] Update Vite config for PWA

### Phase 2: Core UI Updates (2-3 hours)
- [ ] Update Dashboard with card-based event list
- [ ] Add event statistics to cards
- [ ] Implement quick actions on event cards
- [ ] Add responsive mobile-first design

### Phase 3: Event Creation Wizard (3-4 hours)
- [ ] Create multi-step wizard component
- [ ] Template selection screen
- [ ] Event basics form
- [ ] Guest import functionality
- [ ] Timeline builder
- [ ] Review and publish screen

### Phase 4: Guest Management (2-3 hours)
- [ ] Guest list component with search/filter
- [ ] RSVP tracking UI
- [ ] Check-in functionality
- [ ] Guest details modal
- [ ] Email invitation UI

### Phase 5: Event Details (2 hours)
- [ ] Event overview component
- [ ] Statistics dashboard
- [ ] Template details rendering
- [ ] Management action cards

### Phase 6: Template Forms (2-3 hours)
- [ ] Birthday form (reuse mobile logic)
- [ ] Wedding form
- [ ] Product launch form
- [ ] Generic template form system

### Phase 7: Polish & Testing (2 hours)
- [ ] Mobile responsiveness testing
- [ ] PWA install testing (iOS/Android/Desktop)
- [ ] Offline functionality testing
- [ ] Performance optimization

---

## 📱 PWA Requirements Checklist

### Manifest
- [x] App name and short name
- [x] Icons (192x192, 512x512)
- [x] Theme color
- [x] Background color
- [x] Display mode (standalone)
- [x] Start URL
- [x] Scope

### Service Worker
- [x] Cache static assets
- [x] Cache API responses
- [x] Offline fallback
- [x] Update strategy

### Features
- [x] Installable on home screen
- [x] Works offline (basic)
- [x] Fast loading
- [x] Responsive design
- [ ] Push notifications (future)

---

## 🎨 Design System Alignment

### Mobile Components → Web Components
- EventCard (mobile) → EventCard (web)
- GuestListItem (mobile) → GuestRow (web)
- TimelineBlock (mobile) → TimelineItem (web)
- TemplateForm (mobile) → TemplateForm (web)

### Shared Styles
- Color palette: Match mobile (#6366F1 primary)
- Typography: System fonts
- Spacing: 4px grid system
- Border radius: 8px, 12px, 16px
- Shadows: Subtle elevation

---

## 🔧 Technical Implementation

### New Files to Create
```
src/
├── components/
│   ├── pwa/
│   │   ├── InstallPrompt.tsx
│   │   └── UpdatePrompt.tsx
│   ├── wizard/
│   │   ├── EventWizard.tsx
│   │   ├── TemplateSelection.tsx
│   │   ├── EventBasics.tsx
│   │   ├── GuestImport.tsx
│   │   ├── TimelineBuilder.tsx
│   │   └── ReviewPublish.tsx
│   ├── events/
│   │   ├── EventCard.tsx
│   │   ├── EventDetails.tsx
│   │   └── EventStats.tsx
│   ├── guests/
│   │   ├── GuestList.tsx
│   │   ├── GuestRow.tsx
│   │   ├── GuestDetails.tsx
│   │   └── RSVPTracker.tsx
│   └── forms/
│       ├── BirthdayForm.tsx
│       ├── WeddingForm.tsx
│       └── ProductLaunchForm.tsx
├── hooks/
│   └── use-pwa.ts
└── lib/
    └── pwa-utils.ts

public/
├── manifest.json
├── sw.js
└── icons/
    ├── icon-192.png
    ├── icon-512.png
    └── apple-touch-icon.png
```

---

## 📦 Dependencies Needed

Already have most dependencies. May need:
- `workbox-precaching` (for service worker)
- `vite-plugin-pwa` (for build process)

---

## 🎯 Success Criteria

### MVP (Minimum Viable PWA)
1. ✅ Installable on mobile devices
2. ✅ Works offline (basic functionality)
3. ✅ Dashboard shows event list
4. ✅ Can create basic event
5. ✅ Can view event details
6. ✅ Responsive on all screen sizes

### Full Feature Parity
1. Complete event creation wizard
2. Guest management with RSVP
3. Timeline builder
4. Template-specific forms
5. Email invitations
6. Check-in functionality
7. All mobile features available on web

---

## 📅 Timeline

- **Phase 1 (PWA)**: 30 minutes ✅
- **Phase 2 (UI)**: 3 hours
- **Phase 3 (Wizard)**: 4 hours
- **Phase 4 (Guests)**: 3 hours
- **Phase 5 (Details)**: 2 hours
- **Phase 6 (Forms)**: 3 hours
- **Phase 7 (Polish)**: 2 hours

**Total**: ~17 hours of focused work

---

## 🚀 Let's Start!

Beginning with Phase 1: PWA Configuration
