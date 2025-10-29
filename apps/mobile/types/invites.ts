/**
 * Invite Template Types
 * Defines structures for creating, customizing, and sending event invitations
 */

export type InviteTemplateStyle = 
  | 'elegant'
  | 'modern'
  | 'fun'
  | 'minimal'
  | 'festive'
  | 'formal';

export type InviteLayout = 
  | 'classic'
  | 'card'
  | 'photo-background'
  | 'split'
  | 'polaroid';

export interface InviteTemplate {
  id: string;
  name: string;
  style: InviteTemplateStyle;
  layout: InviteLayout;
  description: string;
  preview_image?: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  is_premium?: boolean;
}

export interface InviteCustomization {
  template_id: string;
  custom_message?: string;
  custom_colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    text?: string;
    background?: string;
  };
  custom_fonts?: {
    heading?: string;
    body?: string;
  };
  cover_image?: string;
  show_event_details: boolean;
  show_location_map: boolean;
  show_rsvp_button: boolean;
  custom_footer?: string;
}

export interface EventInvite {
  id: string;
  event_id: string;
  template: InviteTemplate;
  customization: InviteCustomization;
  created_at: string;
  updated_at: string;
  sent_count: number;
  opened_count: number;
  rsvp_count: number;
}

export interface InviteRecipient {
  id: string;
  invite_id: string;
  guest_id?: string;
  email: string;
  name: string;
  sent_at?: string;
  opened_at?: string;
  rsvp_status?: 'attending' | 'not_attending' | 'maybe';
  rsvp_at?: string;
}

export interface InviteSendRequest {
  invite_id: string;
  recipients: {
    email: string;
    name: string;
    guest_id?: string;
  }[];
  send_immediately: boolean;
  scheduled_send_time?: string;
}

// Preset template configurations
export const INVITE_TEMPLATES: InviteTemplate[] = [
  {
    id: 'elegant-gold',
    name: 'Elegant Gold',
    style: 'elegant',
    layout: 'classic',
    description: 'Sophisticated design with gold accents',
    colors: {
      primary: '#D4AF37',
      secondary: '#1A1A1A',
      accent: '#FFFFFF',
      text: '#2C2C2C',
      background: '#FAFAFA',
    },
    fonts: {
      heading: 'Playfair Display',
      body: 'Lato',
    },
  },
  {
    id: 'modern-gradient',
    name: 'Modern Gradient',
    style: 'modern',
    layout: 'card',
    description: 'Vibrant gradient with modern typography',
    colors: {
      primary: '#6366F1',
      secondary: '#EC4899',
      accent: '#F59E0B',
      text: '#111827',
      background: '#FFFFFF',
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
    },
  },
  {
    id: 'fun-confetti',
    name: 'Fun Confetti',
    style: 'fun',
    layout: 'polaroid',
    description: 'Playful design with colorful elements',
    colors: {
      primary: '#FF6B9D',
      secondary: '#FEC84B',
      accent: '#8B5CF6',
      text: '#1F2937',
      background: '#FFF8F3',
    },
    fonts: {
      heading: 'Nunito',
      body: 'Open Sans',
    },
  },
  {
    id: 'minimal-clean',
    name: 'Minimal Clean',
    style: 'minimal',
    layout: 'split',
    description: 'Clean and simple black & white design',
    colors: {
      primary: '#000000',
      secondary: '#4B5563',
      accent: '#9CA3AF',
      text: '#1F2937',
      background: '#FFFFFF',
    },
    fonts: {
      heading: 'Helvetica',
      body: 'Helvetica',
    },
  },
  {
    id: 'festive-celebration',
    name: 'Festive Celebration',
    style: 'festive',
    layout: 'photo-background',
    description: 'Bright and festive with party elements',
    colors: {
      primary: '#EF4444',
      secondary: '#F59E0B',
      accent: '#10B981',
      text: '#FFFFFF',
      background: '#1F2937',
    },
    fonts: {
      heading: 'Pacifico',
      body: 'Roboto',
    },
  },
  {
    id: 'formal-classic',
    name: 'Formal Classic',
    style: 'formal',
    layout: 'classic',
    description: 'Traditional formal invitation style',
    colors: {
      primary: '#1E3A8A',
      secondary: '#1F2937',
      accent: '#D1D5DB',
      text: '#111827',
      background: '#F9FAFB',
    },
    fonts: {
      heading: 'Georgia',
      body: 'Times New Roman',
    },
  },
];
