# PartyHaus Social Media Integration
## Share, Discover, and Promote Events Across Platforms

---

## Overview

Social media integration transforms PartyHaus events from private gatherings into **shareable moments** while driving organic growth. Every touchpoint—invitations, event creation, photo sharing, post-event highlights—becomes an opportunity for social amplification.

---

## Core Social Features

### 1. Event Sharing & Discovery

```typescript
// @/Users/startferanmi/partyhause/Partyhause/src/features/social/types.ts

export interface SocialEventShare {
  eventId: string;
  shareType: 'public' | 'crew-only' | 'invite-only';
  
  // Rich preview data
  title: string;
  description: string;
  imageUrl: string; // Auto-generated event poster
  date: string;
  location: string;
  hostName: string;
  attendeeCount: number;
  
  // Platform-specific data
  openGraph: {
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
    ogUrl: string;
    ogType: 'event';
    eventStartTime: string;
    eventEndTime: string;
    eventLocation: string;
  };
  
  twitterCard: {
    card: 'summary_large_image';
    title: string;
    description: string;
    image: string;
    site: '@partyhaus';
  };
}

export interface SocialPlatformConfig {
  platform: 'twitter' | 'facebook' | 'instagram' | 'tiktok' | 'whatsapp' | 'telegram' | 'linkedin' | 'email' | 'sms';
  shareUrl: string;
  deepLinkUrl?: string;
  nativeShareData?: NativeShareData;
}
```

### 2. Auto-Generated Event Posters

```typescript
// @/Users/startferanmi/partyhause/Partyhause/src/features/social/components/EventPosterGenerator.tsx

interface EventPosterConfig {
  eventName: string;
  date: string;
  time: string;
  location: string;
  hostName: string;
  theme: string;
  image?: string; // User-uploaded or AI-generated
  
  // Style options
  style: {
    template: 'modern' | 'retro' | 'elegant' | 'playful' | 'minimal' | 'bold';
    colorScheme: string[]; // Auto-derived from theme
    fontPair: { heading: string; body: string };
    layout: 'portrait' | 'landscape' | 'square';
  };
  
  // Output
  formats: {
    instagramStory: { width: 1080; height: 1920 };
    instagramPost: { width: 1080; height: 1080 };
    facebookEvent: { width: 1200; height: 630 };
    twitterCard: { width: 1200; height: 675 };
    tiktok: { width: 1080; height: 1920 };
    wallpaper: { width: 1080; height: 1920 };
  };
}

// Features:
// - Auto-generate from event data
// - AI image generation (DALL-E/Stable Diffusion) for unique visuals
// - Customizable templates
// - QR code embedded for easy RSVP
// - Animated versions for Stories/Reels
```

### 3. Share Modal Component

```typescript
// @/Users/startferanmi/partyhause/Partyhause/src/features/social/components/ShareEventModal.tsx

import { Share2, Instagram, Facebook, Twitter, MessageCircle, Link2, Download } from 'lucide-react';

interface ShareEventModalProps {
  eventId: string;
  eventData: Event;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareEventModal({ eventId, eventData, isOpen, onClose }: ShareEventModalProps) {
  // Share options:
  
  // 1. DIRECT INVITE (existing)
  // - Send via email (already implemented)
  // - Send via SMS
  // - Send via WhatsApp
  // - Send via Telegram
  
  // 2. SOCIAL POST
  // - Share to Instagram Story (with sticker)
  // - Share to Instagram Feed
  // - Share to Facebook Event
  // - Share to Twitter/X
  // - Share to TikTok (event teaser)
  // - Share to LinkedIn (professional events)
  
  // 3. COPY & PASTE
  // - Copy event link
  // - Copy invitation text
  // - Copy QR code image
  
  // 4. EMBED
  // - Embed on website (iframe)
  // - Add to calendar (ICS)
  
  // 5. PARTYHAUS INTERNAL
  // - Share to PartyBoard
  // - Share to PartyCrew feed
  // - Share to specific crew
}
```

---

## Platform Integrations

### Instagram

```typescript
// @/Users/startferanmi/partyhause/Partyhause/src/features/social/integrations/Instagram.tsx

interface InstagramIntegration {
  // Stories
  shareToStory: (eventData: Event) => Promise<void>;
  // Uses Instagram Share Extension API
  // Or falls back to: download image → user posts manually
  
  // Feed Post
  shareToFeed: (eventData: Event, caption: string) => Promise<void>;
  // Pre-composed caption with hashtags
  
  // Countdown Stickers
  createCountdown: (eventData: Event) => Promise<void>;
  // Instagram Stories countdown sticker
  
  // Link in Bio
  linkInBio: string; // partyhause.com/e/[eventId]
  
  // Hashtag Strategy
  suggestedHashtags: (eventType: string, theme: string) => string[];
  // #PartyHaus #90sParty #BirthdayBash #EventLife
  
  // Reels
  generateEventReel: (eventId: string) => Promise<string>;
  // Auto-generate highlight reel from photos
}

// Instagram Story Template
interface StoryTemplate {
  background: string; // Color or image
  eventName: string;
  dateDisplay: string;
  timeDisplay: string;
  qrCode: string; // Embedded for quick RSVP
  swipeUpUrl: string;
  stickers: { type: 'countdown' | 'location' | 'poll' | 'question'; config: any }[];
}
```

### TikTok

```typescript
// @/Users/startferanmi/partyhause/Partyhause/src/features/social/integrations/TikTok.tsx

interface TikTokIntegration {
  // Event Teaser Generator
  generateTeaser: (eventData: Event) => {
    videoConcept: string;
    suggestedAudio: string; // Trending audio suggestion
    captions: string[];
    effects: string[];
    duration: number;
  };
  
  // Post-Event Highlights
  generateHighlightReel: (eventId: string, photos: Photo[]) => {
    videoUrl: string;
    suggestedCaptions: string[];
    trendingHashtags: string[];
  };
  
  // Deep Link
  shareUrl: string; // partyhaus.com/e/[eventId]?source=tiktok
}
```

### WhatsApp

```typescript
// @/Users/startferanmi/partyhause/Partyhause/src/features/social/integrations/WhatsApp.tsx

interface WhatsAppIntegration {
  // Direct Message Invite
  sendDirectInvite: (phoneNumber: string, eventData: Event) => Promise<void>;
  
  // Group Invite
  sendGroupInvite: (groupId: string, eventData: Event) => Promise<void>;
  
  // Status Update
  shareToStatus: (eventData: Event) => Promise<void>;
  
  // Rich Message Format
  messageTemplate: (eventData: Event) => string;
  // 🎉 You're invited to [Event Name]!
  // 📅 [Date] at [Time]
  // 📍 [Location]
  // Tap to RSVP: [Link]
  
  // WhatsApp Business API (for bulk)
  bulkSend: (phoneNumbers: string[], eventData: Event) => Promise<void>;
}
```

### Twitter/X

```typescript
// @/Users/startferanmi/partyhause/Partyhause/src/features/social/integrations/Twitter.tsx

interface TwitterIntegration {
  // Tweet Event
  shareEvent: (eventData: Event) => {
    text: string; // Under 280 chars with link
    media: string[]; // Event poster images
    poll?: { question: string; options: string[] };
  };
  
  // Event Thread
  createEventThread: (eventData: Event) => {
    tweets: string[]; // Multi-tweet thread with details
  };
  
  // Countdown Tweets (automated)
  scheduleCountdownTweets: (eventId: string) => {
    '7days': string;
    '3days': string;
    '1day': string;
    '1hour': string;
  };
  
  // Live Tweet During Event
  liveTweet: (eventId: string, photos: Photo[]) => Promise<void>;
}
```

---

## Social Discovery Features

### 1. Public Event Discovery

```typescript
// @/Users/startferanmi/partyhause/Partyhause/src/features/social/components/PublicEventDiscovery.tsx

interface PublicEventFeed {
  // Events hosts choose to make public
  publicEvents: PublicEvent[];
  
  // Discovery filters
  filters: {
    location: { lat: number; lng: number; radius: number };
    dateRange: { start: string; end: string };
    eventType: string[];
    price: 'free' | 'paid' | 'any';
    capacity: 'intimate' | 'medium' | 'large';
  };
  
  // Social proof
  showAttendees: boolean; // "234 people going"
  showFriends: boolean; // "12 friends attending"
  showCrew: boolean; // "5 crew members going"
  
  // Discovery features
  trendingEvents: Event[];
  nearYou: Event[];
  friendsAttending: Event[];
  recommendedByAI: Event[];
  popularThisWeek: Event[];
}
```

### 2. PartyBoard (Existing Social Feed Enhancement)

```typescript
// Enhance existing PartyBoard with social sharing

interface PartyBoardSocialFeatures {
  // Cross-post to PartyBoard
  autoPostToPartyBoard: {
    eventCreated: boolean; // "Sarah is throwing a 90s party!"
    rsvpReceived: boolean; // "John is going to Sarah's party!"
    photoUploaded: boolean; // "Photos from last night's party!"
    milestoneReached: boolean; // "50 people confirmed!"
  };
  
  // Reactions & Engagement
  reactions: ('like' | 'love' | 'fire' | 'laugh' | 'wow')[];
  comments: boolean;
  shares: boolean;
  
  // Algorithm
  feedAlgorithm: 'chronological' | 'trending' | 'friends-first' | 'crews-first';
}
```

---

## Post-Event Social Features

### 1. Event Recap Generator

```typescript
// @/Users/startferanmi/partyhause/Partyhause/src/features/social/components/EventRecapGenerator.tsx

interface EventRecap {
  // Auto-generated from event data
  title: string; // "Sarah's 30th Birthday - The Highlights"
  
  // Stats
  stats: {
    totalGuests: number;
    checkInRate: number;
    photosShared: number;
    mostActiveHour: string;
    topPoll: string;
    winningGame: string;
  };
  
  // Photo montage
  photoGrid: Photo[];
  featuredMoments: { photo: Photo; caption: string }[];
  
  // Guest quotes
  bestComments: string[];
  
  // Music recap
  playlistRecap: {
    topSongs: { title: string; artist: string; plays: number }[];
    totalSongsPlayed: number;
  };
  
  // Shareable formats
  formats: {
    instagramCarousel: string[]; // 10-card carousel
    tiktokVideo: string; // Auto-generated
    twitterThread: string[];
    facebookAlbum: string;
    emailDigest: string;
  };
}
```

### 2. Thank You Creator

```typescript
// @/Users/startferanmi/partyhause/Partyhause/src/features/social/components/ThankYouGenerator.tsx

interface ThankYouGenerator {
  // Auto-generated thank you messages
  
  // For each guest (personalized)
  personalizedThanks: (guest: Guest, event: Event) => string;
  // "Hey John! Thanks for coming to my 30th! 
  //  Loved that you won the karaoke contest 🎤"
  
  // For vendors
  vendorThanks: (vendor: Vendor) => string;
  
  // Social thank you post
  socialThanks: (event: Event) => {
    text: string;
    media: Photo[];
    mentions: string[]; // Tag attendees
  };
  
  // Share options
  sendVia: ('email' | 'sms' | 'whatsapp' | 'instagram-dm' | 'partyhaus-message')[];
}
```

---

## Viral Growth Mechanics

### 1. Invite Incentives

```typescript
interface ViralGrowthFeatures {
  // Referral program
  referFriend: {
    hostReward: 'premium_feature_unlock' | 'discount' | 'credits';
    guestReward: 'swag' | 'vip_status' | 'discount';
    tracking: 'referral_code';
  };
  
  // "Bring a Friend" Boost
  bringAFriend: {
    enabled: boolean;
    reward: string;
    maxFriends: number;
  };
  
  // Social Sharing Unlock
  shareUnlock: {
    // Share event → unlock premium template
    // Share photos → unlock filter pack
    // Tag 3 friends → get featured
  };
}
```

### 2. FOMO Triggers

```typescript
interface FOMOFeatures {
  // Scarcity indicators
  limitedSpots: {
    showRemaining: boolean;
    showWaitlist: boolean;
    countdown: boolean;
  };
  
  // Social proof
  socialProof: {
    showAttendeeCount: boolean;
    showFriendAttendees: boolean;
    showCrewAttendees: boolean;
    showRecentRSVPs: boolean; // "Sarah just RSVP'd!"
  };
  
  // Countdown
  countdown: {
    rsvpDeadline: boolean;
    earlyBirdDeadline: boolean;
    eventStart: boolean;
  };
}
```

---

## Email Invitation System (Enhanced)

```typescript
// @/Users/startferanmi/partyhause/Partyhause/src/features/social/email/EmailSystem.tsx

interface EnhancedEmailSystem {
  // Already exists: basic email sending
  // Enhancements:
  
  // 1. Beautiful HTML Templates
  templates: {
    formal: 'elegant-invitation';
    casual: 'fun-invitation';
    minimalist: 'clean-invitation';
    themed: 'theme-matched'; // Matches event theme
  };
  
  // 2. Rich Content
  richContent: {
    heroImage: string; // Event poster
    eventDetails: { date: string; time: string; location: string };
    hostPhoto: string;
    attendeePreview: string[]; // "Sarah, John, and 5 others are going"
    rsvpButton: { text: string; url: string; color: string };
    addToCalendar: { google: string; apple: string; outlook: string };
    socialShare: { facebook: string; twitter: string };
    qrCode: string; // For quick check-in
  };
  
  // 3. Automated Sequences
  sequences: {
    invitation: { send: 'immediately'; template: string };
    reminder1: { send: '7_days_before'; template: string };
    reminder2: { send: '1_day_before'; template: string };
    dayOf: { send: 'morning_of_event'; template: string };
    thankYou: { send: '1_day_after'; template: string };
    followUp: { send: '3_days_after'; template: string };
  };
  
  // 4. Personalization
  personalization: {
    useGuestName: boolean;
    referencePastEvents: boolean;
    mentionCrewConnections: boolean;
    customMessageFromHost: boolean;
  };
  
  // 5. Tracking
  tracking: {
    openTracking: boolean;
    clickTracking: boolean;
    rsvpConversion: boolean;
    aBTesting: boolean; // Test subject lines
  };
}
```

---

## Implementation

### Phase 1: Core Sharing (2 weeks)
- Share modal with all platforms
- Auto-generated event posters
- Deep links for all platforms
- Copy link + QR code

### Phase 2: Platform Integrations (2 weeks)
- Instagram Story templates
- WhatsApp rich messages
- Twitter Cards
- Facebook Open Graph

### Phase 3: Discovery (2 weeks)
- Public event feed
- Trending events
- Friends attending
- Location-based discovery

### Phase 4: Post-Event (2 weeks)
- Recap generator
- Photo montage
- Thank you messages
- Highlight reels

### Phase 5: Growth Mechanics (2 weeks)
- Referral tracking
- FOMO indicators
- Social unlocks
- Viral loops

---

*Document Version: 1.0*
