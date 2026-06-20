# PartyHaus Vendor Marketplace
## Complete B2B2C Event Vendor Platform

---

## Overview

The Vendor Marketplace transforms PartyHaus into a **three-sided platform** connecting:
- **Event Hosts** (consumers) - Find and book vendors
- **Vendors** (businesses) - DJs, caterers, photographers, venues, rentals
- **PartyHaus** (platform) - Facilitates discovery, booking, and payment

---

## Database Schema

```sql
-- Vendors table
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  short_description VARCHAR(280),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  website_url VARCHAR(500),
  business_type VARCHAR(50),
  tax_id VARCHAR(50),
  year_established INTEGER,
  team_size INTEGER,
  category VARCHAR(50) NOT NULL,
  subcategories TEXT[],
  specialties TEXT[],
  service_radius_miles INTEGER DEFAULT 50,
  primary_location JSONB,
  service_areas JSONB[],
  availability_calendar JSONB,
  typical_response_hours INTEGER DEFAULT 24,
  logo_url VARCHAR(500),
  banner_image_url VARCHAR(500),
  gallery_urls TEXT[],
  video_urls TEXT[],
  rating DECIMAL(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  completed_bookings INTEGER DEFAULT 0,
  pricing_type VARCHAR(20),
  starting_price DECIMAL(10,2),
  price_range VARCHAR(10),
  packages JSONB[],
  verification_status VARCHAR(20) DEFAULT 'pending',
  verified_at TIMESTAMP,
  background_check_passed BOOLEAN DEFAULT false,
  insurance_verified BOOLEAN DEFAULT false,
  stripe_connect_account_id VARCHAR(255),
  payout_schedule VARCHAR(20) DEFAULT 'weekly',
  status VARCHAR(20) DEFAULT 'active',
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  owner_user_id UUID REFERENCES auth.users(id),
  search_vector tsvector
);

-- Vendor Reviews
CREATE TABLE vendor_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  reviewer_user_id UUID REFERENCES auth.users(id),
  event_id UUID REFERENCES events(id),
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
  punctuality_rating INTEGER CHECK (punctuality_rating BETWEEN 1 AND 5),
  value_rating INTEGER CHECK (value_rating BETWEEN 1 AND 5),
  quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
  title VARCHAR(255),
  content TEXT,
  pros TEXT[],
  cons TEXT[],
  photo_urls TEXT[],
  verified_booking BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'published',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Bookings / Inquiries
CREATE TABLE vendor_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  host_user_id UUID REFERENCES auth.users(id),
  event_id UUID REFERENCES events(id),
  booking_type VARCHAR(20),
  requested_services JSONB[],
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  guest_count INTEGER,
  venue_address TEXT,
  special_requests TEXT,
  quoted_price DECIMAL(10,2),
  final_price DECIMAL(10,2),
  deposit_amount DECIMAL(10,2),
  deposit_paid BOOLEAN DEFAULT false,
  deposit_paid_at TIMESTAMP,
  partyhaus_fee DECIMAL(10,2),
  vendor_payout DECIMAL(10,2),
  stripe_payment_intent_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'inquiry',
  cancelled_at TIMESTAMP,
  cancelled_by UUID REFERENCES auth.users(id),
  cancellation_reason TEXT,
  refund_amount DECIMAL(10,2),
  inquiry_sent_at TIMESTAMP DEFAULT NOW(),
  vendor_responded_at TIMESTAMP,
  quote_sent_at TIMESTAMP,
  host_accepted_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages between host and vendor
CREATE TABLE vendor_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES vendor_bookings(id) ON DELETE CASCADE,
  sender_user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  attachments JSONB[],
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Vendor Availability Calendar
CREATE TABLE vendor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_available BOOLEAN DEFAULT true,
  unavailable_reason VARCHAR(50),
  blocked_by_booking_id UUID REFERENCES vendor_bookings(id),
  available_slots JSONB[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(vendor_id, date)
);

-- Vendor Categories
CREATE TABLE vendor_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  parent_category_id UUID REFERENCES vendor_categories(id),
  sort_order INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  requires_insurance BOOLEAN DEFAULT false,
  requires_license BOOLEAN DEFAULT false,
  typical_lead_time_days INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Default categories
INSERT INTO vendor_categories (slug, name, description, icon) VALUES
('catering', 'Catering', 'Food and beverage services', 'utensils'),
('dj', 'DJ & Music', 'Music, MC, and sound services', 'music'),
('photography', 'Photography', 'Event photography and videography', 'camera'),
('videography', 'Videography', 'Video recording and livestreaming', 'video'),
('venue', 'Venues', 'Event spaces and locations', 'map-pin'),
('rentals', 'Rentals', 'Equipment and furniture rentals', 'package'),
('decor', 'Decor & Design', 'Floral, decor, and event design', 'flower-2'),
('entertainment', 'Entertainment', 'Performers, games, and activities', 'sparkles'),
('transportation', 'Transportation', 'Limousines, party buses, shuttles', 'car'),
('bartending', 'Bartending', 'Mobile bar and bartending services', 'wine'),
('bakery', 'Bakery & Desserts', 'Cakes, desserts, and sweet treats', 'cake'),
('security', 'Security', 'Event security and crowd management', 'shield'),
('cleanup', 'Cleanup Services', 'Post-event cleaning services', 'trash-2');

-- Indexes
CREATE INDEX idx_vendors_category ON vendors(category);
CREATE INDEX idx_vendors_rating ON vendors(rating DESC);
CREATE INDEX idx_vendors_featured ON vendors(featured) WHERE featured = true;
CREATE INDEX idx_vendors_search ON vendors USING GIN(search_vector);
CREATE INDEX idx_bookings_vendor ON vendor_bookings(vendor_id);
CREATE INDEX idx_bookings_host ON vendor_bookings(host_user_id);
CREATE INDEX idx_bookings_status ON vendor_bookings(status);
CREATE INDEX idx_reviews_vendor ON vendor_reviews(vendor_id);
```

---

## Feature Set

### For Event Hosts

#### 1. Vendor Discovery

```typescript
// @/Users/startferanmi/partyhause/Partyhause/src/features/vendors/components/VendorDiscovery.tsx

interface VendorDiscoveryProps {
  eventId?: string;
  category?: string;
  location?: { lat: number; lng: number };
}

export function VendorDiscovery({ eventId, category, location }: VendorDiscoveryProps) {
  // Features:
  // - Browse by category with subcategory filters
  // - Map view showing vendor locations
  // - AI recommendations ("Perfect for your 90s party!")
  // - Filter by price range, availability, rating
  // - Sort by: Recommended, Rating, Price (low-high), Distance
  // - Featured vendors section
  // - Recently viewed
  // - PartyCrew favorites ("Your crew loved DJ Spark last summer")
}
```

#### 2. Vendor Profile Page

```typescript
// @/Users/startferanmi/partyhause/Partyhause/src/features/vendors/components/VendorProfile.tsx

interface VendorProfileSections {
  bannerImage: string;
  logo: string;
  businessName: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  category: string;
  location: string;
  serviceRadius: string;
  startingPrice: number;
  priceRange: string;
  typicalResponseTime: string;
  description: string;
  specialties: string[];
  teamSize: number;
  yearsInBusiness: number;
  photos: string[];
  videos: string[];
  packages: VendorPackage[];
  addOns: AddOn[];
  reviewBreakdown: { 5: number; 4: number; 3: number; 2: number; 1: number };
  recentReviews: Review[];
  availabilityCalendar: CalendarData;
  alternatives: Vendor[];
}
```

#### 3. Booking Flow

```typescript
// @/Users/startferanmi/partyhause/Partyhause/src/features/vendors/components/BookingFlow.tsx

interface BookingFlowSteps {
  selectServices: {
    packages: VendorPackage[];
    addOns: AddOn[];
    customRequests: string;
  };
  selectDateTime: {
    calendar: VendorAvailabilityCalendar;
    preferredDate: Date;
    startTime: string;
    endTime: string;
    flexibleDates: boolean;
  };
  provideDetails: {
    guestCount: number;
    venueAddress: string;
    eventType: string;
    specialRequests: string;
  };
  reviewQuote: {
    serviceSummary: string;
    estimatedPrice: number;
    vendorResponseTime: string;
    messageToVendor: string;
  };
}

// Booking Status Tracking
interface BookingStatusView {
  currentStep: 'inquiry-sent' | 'awaiting-quote' | 'quote-received' | 'accepted' | 'deposit-paid' | 'confirmed' | 'completed';
  timeline: { step: string; completed: boolean; timestamp?: string }[];
  nextAction: { label: string; action: () => void };
  vendorResponse: { responded: boolean; message?: string };
  paymentStatus: { depositRequired: boolean; depositPaid: boolean; totalDue: number };
}
```

#### 4. Vendor Management in Event Dashboard

```typescript
// @/Users/startferanmi/partyhause/Partyhause/src/features/vendors/components/EventVendorManager.tsx

interface EventVendorManagerProps {
  eventId: string;
}

export function EventVendorManager({ eventId }: EventVendorManagerProps) {
  // Features:
  // - List all booked vendors for this event
  // - Status tracking (inquiry → confirmed)
  // - Payment status per vendor
  // - Vendor message threads
  // - Contract/document storage
  // - Vendor timeline integration
  // - Total vendor spend tracker
}
```

### For Vendors

#### 1. Vendor Registration & Onboarding

```typescript
// @/Users/startferanmi/partyhause/Partyhause/src/features/vendors/portal/Registration.tsx

interface VendorRegistrationFlow {
  // Step 1: Business Info
  businessDetails: {
    businessName: string;
    category: string;
    subcategories: string[];
    description: string;
    yearsInBusiness: number;
    teamSize: number;
  };
  
  // Step 2: Service Area
  serviceArea: {
    primaryLocation: Address;
    serviceRadius: number;
    serviceAreas: string[];
    travelFeePolicy: string;
  };
  
  // Step 3: Services & Pricing
  services: {
    packages: VendorPackage[];
    addOns: AddOn[];
    customQuotes: boolean;
    pricingNotes: string;
  };
  
  // Step 4: Availability
  availability: {
    typicalResponseTime: number;
    bookingLeadTime: number;
    calendarSync: 'google' | 'outlook' | 'manual';
    blackOutDates: Date[];
  };
  
  // Step 5: Media & Portfolio
  media: {
    logo: File;
    bannerImage: File;
    galleryPhotos: File[];
    videos: string[];
  };
  
  // Step 6: Verification
  verification: {
    businessLicense: File;
    insuranceCertificate: File;
    taxId: string;
    bankAccount: BankAccountInfo; // For payouts
  };
}
```

#### 2. Vendor Dashboard

```typescript
// @/Users/startferanmi/partyhause/Partyhause/src/features/vendors/portal/Dashboard.tsx

interface VendorDashboard {
  // Overview Cards
  stats: {
    totalBookings: number;
    pendingInquiries: number;
    upcomingEvents: number;
    totalEarnings: number;
    averageRating: number;
    profileViews: number;
  };
  
  // Booking Management
  bookings: {
    newInquiries: Booking[];
    pendingQuotes: Booking[];
    confirmedUpcoming: Booking[];
    completed: Booking[];
    cancelled: Booking[];
  };
  
  // Calendar
  calendar: {
    availabilityView: 'month' | 'week';
    bookedDates: BookedDate[];
    blockedDates: Date[];
    pendingRequests: Booking[];
  };
  
  // Messages
  messages: {
    unreadCount: number;
    recentConversations: Conversation[];
  };
  
  // Reviews
  reviews: {
    recentReviews: Review[];
    averageRatings: { overall: number; communication: number; punctuality: number; value: number; quality: number };
    reviewDistribution: number[];
  };
  
  // Earnings
  earnings: {
    thisMonth: number;
    lastMonth: number;
    total: number;
    upcomingPayouts: Payout[];
    transactionHistory: Transaction[];
  };
  
  // Settings
  settings: {
    profile: VendorProfile;
    services: ServiceConfig;
    pricing: PricingConfig;
    availability: AvailabilityConfig;
    notifications: NotificationConfig;
  };
}
```

#### 3. Quote Builder

```typescript
// @/Users/startferanmi/partyhause/Partyhause/src/features/vendors/portal/QuoteBuilder.tsx

interface QuoteBuilder {
  // Load inquiry details
  inquiry: Booking;
  
  // Build quote
  selectedServices: {
    packages: { package: VendorPackage; quantity: number }[];
    addOns: { addOn: AddOn; quantity: number }[];
    customLineItems: { description: string; amount: number }[];
  };
  
  // Pricing
  pricing: {
    subtotal: number;
    discount: { type: 'percentage' | 'fixed'; amount: number; reason: string };
    tax: number;
    travelFee: number;
    total: number;
    depositRequired: { percentage: number; amount: number };
    balanceDue: number;
  };
  
  // Terms
  terms: {
    cancellationPolicy: string;
    paymentTerms: string;
    setupRequirements: string;
    arrivalTime: string;
    specialNotes: string;
  };
  
  // Send
  preview: QuotePreview;
  sendQuote: () => Promise<void>;
}
```

---

## Integration Points

### With AI Planner

```typescript
// AI suggests vendors based on event concept

interface AIVendorSuggestion {
  vendor: Vendor;
  reason: string; // "Perfect match for your 90s arcade theme - they have vintage machines"
  relevanceScore: number;
  estimatedCost: number;
  recommendedPackage: VendorPackage;
  suggestedAddOns: AddOn[];
}

// When AI generates a timeline block with vendor:
{
  component: 'timeline-block',
  props: {
    label: "Retro Gaming Tournament",
    suggestedVendors: [
      { name: "RetroArcade Rentals", category: "Entertainment", relevanceScore: 95 }
    ],
    onConfirm: () => createVendorInquiry(vendorId, eventId)
  }
}
```

### With Event Timeline

```typescript
// Vendors appear on timeline with status
interface TimelineVendorBlock {
  blockId: string;
  vendorName: string;
  vendorId: string;
  service: string;
  status: 'inquiry' | 'confirmed' | 'completed';
  arrivalTime: string;
  contactPhone: string;
  confirmationCode: string;
}

// Click vendor block → opens vendor details or message thread
```

### With PartyCrew

```typescript
// Crew members can recommend vendors
interface CrewVendorRecommendation {
  vendorId: string;
  recommendedBy: CrewMember[];
  context: string; // "Sarah used them for her wedding - amazing!"
  crewRating: number; // Average rating from crew members
}

// Vendors show "X crew members recommend this"
```

---

## Revenue Model

### Commission Structure

```typescript
interface VendorCommissionModel {
  // Standard commission
  platformFee: {
    percentage: 10; // 10% of booking value
    minimum: 25; // $25 minimum fee
    maximum: 500; // $500 maximum fee
  };
  
  // Subscription tiers for vendors
  vendorTiers: {
    free: {
      commission: 15; // Higher commission
      features: ['profile', 'basic-bookings'];
      maxBookings: 5; // per month
    };
    pro: {
      price: 49; // $49/month
      commission: 10; // Lower commission
      features: ['featured-listing', 'analytics', 'calendar-sync', 'unlimited-bookings'];
    };
    business: {
      price: 149; // $149/month
      commission: 7; // Lowest commission
      features: ['priority-placement', 'team-accounts', 'api-access', 'white-label'];
    };
  };
  
  // Additional revenue streams
  additionalRevenue: {
    featuredListingFee: 20; // per week
    promotedSearchFee: 50; // per week
    instantBookingFee: 5; // per instant booking
    paymentProcessingFee: 2.9; // + $0.30
  };
}
```

---

## Implementation Phases

### Phase 1: Basic Discovery (2 weeks)
- Vendor database schema
- Browse and search
- Basic profiles
- Inquiry form (no booking flow yet)

### Phase 2: Booking Flow (2 weeks)
- Quote request → Quote → Acceptance
- Host-vendor messaging
- Booking status tracking
- Calendar integration

### Phase 3: Vendor Portal (3 weeks)
- Vendor registration
- Dashboard
- Quote builder
- Availability management

### Phase 4: Payments (2 weeks)
- Stripe Connect integration
- Deposit handling
- Payouts to vendors
- Refund processing

### Phase 5: Advanced Features (2 weeks)
- Reviews system
- AI integration
- PartyCrew recommendations
- Vendor analytics

---

*Document Version: 1.0*
