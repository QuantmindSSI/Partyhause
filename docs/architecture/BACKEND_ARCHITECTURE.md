# PartyHause Backend Architecture

## Overview
PartyHause uses a **serverless architecture** with Vercel Functions (Edge/Serverless) and Supabase PostgreSQL database. The backend is split into two parts:

1. **API Functions** (`/api/*.ts`) - Serverless functions deployed on Vercel
2. **Email Server** (`/server/index.js`) - Optional Express server for local email testing (not deployed)

---

## Architecture Components

### 1. **API Layer (Vercel Serverless Functions)**

Location: `/api/*.ts`

All API endpoints are TypeScript serverless functions that run on Vercel's edge network.

#### Core API Endpoints:

**Event Management:**
- `api/events.ts` - CRUD operations for events
  - `GET /api/events` - List user's events
  - `GET /api/events?id=xxx` - Get single event with stats
  - `POST /api/events` - Create new event
  - `PATCH /api/events?id=xxx` - Update event
  - `DELETE /api/events?id=xxx` - Delete event (soft delete)

**Guest Management:**
- `api/guests.ts` - Guest CRUD and RSVP operations
  - `GET /api/events/:id/guests` - List event guests
  - `POST /api/events/:id/guests` - Add single guest
  - `POST /api/events/:id/guests/bulk` - Bulk import guests
  - `PATCH /api/guests/:id` - Update guest (RSVP, dietary, plus-ones)
  - `POST /api/guests/:id/checkin` - Check-in guest (QR code scan)
  - `DELETE /api/guests/:id` - Remove guest

**Timeline & Schedule:**
- `api/timeline.ts` - Event timeline and schedule blocks
  - `GET /api/events/:id/timeline` - Get timeline
  - `POST /api/events/:id/timeline` - Add block
  - `PATCH /api/timeline/:id` - Update block
  - `DELETE /api/timeline/:id` - Remove block

**Email Services:**
- `api/email.ts` - Send invitation/notification emails via MailerSend
- `api/email-webhook.ts` - Handle MailerSend webhooks (delivery, bounces)
- `api/send-email.ts` - Alternative email endpoint

**Templates:**
- `api/event-templates.ts` - Pre-built event templates
- `api/create-event-from-template.ts` - Create event from template
- `api/templates.ts` - Template management

**Health & Monitoring:**
- `api/health.ts` - Health check endpoint

---

### 2. **Database Layer (Supabase PostgreSQL)**

Database Provider: **Supabase** (Hosted PostgreSQL with Row Level Security)

#### Database Schema:

**Core Tables:**

1. **`events`** - Main events table
   - `id` (uuid, primary key)
   - `host_id` (uuid, references auth.users)
   - `title`, `description`, `location`
   - `start_date`, `end_date`
   - `template_type` (birthday, wedding, conference, etc.)
   - `settings` (JSONB - template-specific data)
   - `privacy` (public, private, unlisted)
   - `status` (draft, published, cancelled, completed)
   - `created_at`, `updated_at`

2. **`guests`** - Event attendees
   - `id` (uuid, primary key)
   - `event_id` (uuid, references events)
   - `name`, `email`, `phone`
   - `rsvp_status` (pending, accepted, declined)
   - `dietary_restrictions`, `plus_ones_allowed`, `plus_ones_count`
   - `checked_in` (boolean)
   - `qr_code` (text - for check-in)
   - `invite_sent_at`, `rsvp_at`

3. **`timeline_blocks`** - Event schedule
   - `id` (uuid, primary key)
   - `event_id` (uuid, references events)
   - `title`, `description`
   - `start_time`, `end_time`
   - `location`, `category`
   - `display_order` (integer)
   - `notify_guests` (boolean)

4. **`tickets`** - Ticketing system
   - `id` (uuid, primary key)
   - `event_id` (uuid, references events)
   - `guest_id` (uuid, references guests)
   - `ticket_type`, `price`
   - `status` (valid, used, cancelled)
   - `qr_code`, `issued_at`

5. **`media`** - Event photos/videos
   - `id` (uuid, primary key)
   - `event_id` (uuid, references events)
   - `uploader_id` (uuid, references auth.users)
   - `media_type` (photo, video)
   - `file_url`, `thumbnail_url`
   - `status` (pending, approved, rejected)

6. **`activities`** - Sub-events/activities
   - `id` (uuid, primary key)
   - `event_id` (uuid, references events)
   - `title`, `description`
   - `start_time`, `end_time`
   - `location`, `capacity`, `cost`

7. **`vendors`** - Vendors/suppliers
   - `id` (uuid, primary key)
   - `event_id` (uuid, references events)
   - `vendor_type` (catering, photography, venue, etc.)
   - `name`, `contact_name`, `email`, `phone`
   - `status`, `payment_status`

**Supporting Tables:**
- `event_co_hosts` - Co-host relationships
- `activity_participants` - Activity registrations
- `vendor_tasks` - Vendor task tracking
- `templates` - Pre-built event templates
- `template_usage` - Template analytics
- `email_logs` - Email delivery tracking
- `email_events` - Email webhooks (opens, clicks, bounces)
- `invite_templates` - Custom invitation templates

#### Row Level Security (RLS):

All tables have RLS policies:
- Users can only see their own events (host_id = auth.uid())
- Guests can see events they're invited to
- Public events visible to all authenticated users
- Service role key bypasses RLS (used in API functions)

---

### 3. **Authentication Layer**

Provider: **Supabase Auth**

Features:
- Email/password authentication
- Magic link authentication
- JWT tokens for API authentication
- Session management
- User profiles (via auth.users)

API functions verify user identity via:
```typescript
const authHeader = req.headers.authorization;
const token = authHeader.split(' ')[1];
const { data: { user } } = await supabaseAdmin.auth.getUser(token);
```

---

### 4. **Email Service**

Provider: **MailerSend**

Configuration:
- `MAILERSEND_API_TOKEN` - API key
- `MAILERSEND_FROM_EMAIL` - Verified sender address

Email Types:
- Event invitations
- RSVP confirmations
- Event reminders
- Timeline notifications
- Update notifications

Webhooks:
- Email delivered/bounced/opened/clicked events sent to `/api/email-webhook`

---

### 5. **Environment Configuration**

Required Environment Variables:

**Supabase:**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only)
- `VITE_SUPABASE_URL` - Public Supabase URL (client-side)
- `VITE_SUPABASE_ANON_KEY` - Anonymous key (client-side)

**MailerSend:**
- `MAILERSEND_API_TOKEN` - MailerSend API key
- `MAILERSEND_FROM_EMAIL` - Verified sender email

**Mobile App:**
- `EXPO_PUBLIC_API_URL` - API base URL (e.g., https://your-app.vercel.app)
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase URL for mobile
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key for mobile

---

## Current Deployment Status

### ✅ What's Working Locally:
1. Vercel dev server running on `localhost:3000`
2. Web frontend (Vite) accessible at `http://localhost:3000`
3. API functions accessible at `http://localhost:3000/api/*`
4. Supabase database (hosted, production-ready)
5. Mobile app (Expo) connecting to local API

### ❌ What's Missing for Production:
1. **Vercel deployment** - API functions not deployed
2. **Environment variables** - Not configured on Vercel
3. **Mobile app API URL** - Hardcoded to localhost
4. **Email server** - Not needed (using serverless MailerSend)

---

## Data Flow Architecture

```
┌─────────────────┐
│   Mobile App    │ (Expo Go on iOS/Android)
│  (React Native) │
└────────┬────────┘
         │ HTTP/REST
         │ Authorization: Bearer <JWT>
         ▼
┌─────────────────────────────────────────────┐
│        Vercel Edge Network                  │
│  ┌─────────────────────────────────────┐   │
│  │   API Functions (Serverless)        │   │
│  │                                     │   │
│  │  • /api/events.ts                  │   │
│  │  • /api/guests.ts                  │   │
│  │  • /api/timeline.ts                │   │
│  │  • /api/email.ts                   │   │
│  └──────────┬──────────────────────────┘   │
└─────────────┼──────────────────────────────┘
              │
              ▼
    ┌─────────────────┐      ┌──────────────┐
    │   Supabase      │      │  MailerSend  │
    │  PostgreSQL     │      │  Email API   │
    │                 │      │              │
    │  • events       │      │  • Send      │
    │  • guests       │      │  • Webhooks  │
    │  • timeline     │      │  • Analytics │
    │  • media        │      └──────────────┘
    │  • RLS policies │
    └─────────────────┘
```

---

## API Request Flow Example

**Creating an Event:**

1. **Mobile App** → User fills out birthday form
2. **Mobile App** → POST request to `/api/events`
   ```json
   {
     "title": "Emma's 7th Birthday",
     "template_type": "kids-birthday",
     "settings": {
       "birthday_person": "Emma",
       "age": 7,
       "theme": "Pool Party",
       "activities": ["Pool Games", "Face Painting"]
     }
   }
   ```
3. **Vercel Function** (`api/events.ts`) → Validates JWT token
4. **Supabase** → Inserts event into `events` table
5. **Response** → Returns event with ID
6. **Mobile App** → Navigates to event details screen

**Inviting Guests:**

1. **Mobile App** → Host adds guest list
2. **Mobile App** → POST to `/api/events/:id/guests/bulk`
3. **Vercel Function** → Creates guest records
4. **MailerSend** → Sends invitation emails
5. **Email Webhook** → Tracks delivery status
6. **Mobile App** → Shows invitation sent confirmation

---

## Performance & Scalability

**Current Architecture Advantages:**
- ✅ **Serverless** - Auto-scales with traffic
- ✅ **Edge deployment** - Low latency globally
- ✅ **Database indexing** - Fast queries on event_id, host_id
- ✅ **RLS** - Security at database level
- ✅ **CDN** - Static assets cached

**Potential Bottlenecks:**
- ⚠️ Large guest lists (500+) - Consider pagination
- ⚠️ Media uploads - Need CDN/storage solution
- ⚠️ Concurrent check-ins - Database locking

**Optimization Strategies:**
- Use Supabase Realtime for live updates
- Implement Redis caching for hot data
- Add background jobs for bulk emails
- Use Vercel Edge Config for feature flags

---

## Monitoring & Observability

**Current Logging:**
- Console logs in API functions
- Supabase dashboard query logs
- MailerSend delivery analytics

**Recommended Tools:**
- Vercel Analytics - Request metrics
- Sentry - Error tracking
- LogTail - Centralized logging
- Supabase Dashboard - Query performance

---

## Security Considerations

**Current Security Measures:**
1. ✅ JWT authentication on all endpoints
2. ✅ Row Level Security (RLS) on database
3. ✅ CORS headers configured
4. ✅ Service role key not exposed to client
5. ✅ Input validation in API functions

**Security Recommendations:**
1. Add rate limiting (Vercel Edge Middleware)
2. Implement request signing for webhooks
3. Add CSRF protection for web app
4. Encrypt sensitive guest data (phone, email)
5. Add audit logging for admin actions
6. Implement IP allowlisting for admin endpoints

---

## Testing Strategy

**Current Tests:**
- `test-api-only.js` - API endpoint tests
- `test-email.js` - Email sending tests
- `test-invitation-flow.js` - End-to-end invitation tests

**Test Coverage Needed:**
- Unit tests for API functions
- Integration tests for database operations
- E2E tests for mobile app flows
- Load testing for concurrent users

---

## Next Steps

See `VERCEL_DEPLOYMENT_PLAN.md` for deployment instructions.
