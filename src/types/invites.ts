export interface InviteTemplate {
  id: string;
  name: string;
  description: string;
  style: 'elegant' | 'modern' | 'fun' | 'minimal' | 'festive' | 'formal';
  category: 'birthday' | 'wedding' | 'corporate' | 'casual' | 'formal' | 'universal';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
  };
  is_premium: boolean;
  preview_image?: string;
}

export const INVITE_TEMPLATES: InviteTemplate[] = [
  // Birthday Templates
  {
    id: 'birthday-festive',
    name: 'Birthday Celebration',
    description: 'Colorful and festive birthday invitation',
    style: 'festive',
    category: 'birthday',
    colors: {
      primary: '#FF6B9D',
      secondary: '#FFB74D',
      accent: '#FFFFFF',
      text: '#2D3748',
    },
    is_premium: false,
  },
  {
    id: 'birthday-elegant',
    name: 'Elegant Birthday',
    description: 'Sophisticated birthday party invitation',
    style: 'elegant',
    category: 'birthday',
    colors: {
      primary: '#6366F1',
      secondary: '#A855F7',
      accent: '#F8FAFC',
      text: '#1E293B',
    },
    is_premium: true,
  },
  
  // Wedding Templates
  {
    id: 'wedding-classic',
    name: 'Classic Wedding',
    description: 'Timeless and romantic wedding invitation',
    style: 'elegant',
    category: 'wedding',
    colors: {
      primary: '#EC407A',
      secondary: '#F8BBD9',
      accent: '#FFFFFF',
      text: '#4A5568',
    },
    is_premium: false,
  },
  {
    id: 'wedding-modern',
    name: 'Modern Romance',
    description: 'Contemporary wedding invitation design',
    style: 'modern',
    category: 'wedding',
    colors: {
      primary: '#E91E63',
      secondary: '#F06292',
      accent: '#FFF3E0',
      text: '#2D3748',
    },
    is_premium: true,
  },
  
  // Corporate Templates
  {
    id: 'corporate-professional',
    name: 'Professional Event',
    description: 'Clean and professional business invitation',
    style: 'formal',
    category: 'corporate',
    colors: {
      primary: '#2563EB',
      secondary: '#1E40AF',
      accent: '#F8FAFC',
      text: '#1E293B',
    },
    is_premium: false,
  },
  {
    id: 'corporate-modern',
    name: 'Modern Corporate',
    description: 'Contemporary business event invitation',
    style: 'modern',
    category: 'corporate',
    colors: {
      primary: '#059669',
      secondary: '#10B981',
      accent: '#F0FDF4',
      text: '#064E3B',
    },
    is_premium: true,
  },
  
  // Universal/Casual Templates
  {
    id: 'party-fun',
    name: 'Fun Party',
    description: 'Playful and energetic party invitation',
    style: 'fun',
    category: 'casual',
    colors: {
      primary: '#F59E0B',
      secondary: '#FCD34D',
      accent: '#FFFBEB',
      text: '#92400E',
    },
    is_premium: false,
  },
  {
    id: 'minimal-clean',
    name: 'Minimal Clean',
    description: 'Simple and sophisticated design',
    style: 'minimal',
    category: 'universal',
    colors: {
      primary: '#6B7280',
      secondary: '#9CA3AF',
      accent: '#F9FAFB',
      text: '#374151',
    },
    is_premium: false,
  },
  {
    id: 'garden-party',
    name: 'Garden Party',
    description: 'Nature-inspired outdoor event invitation',
    style: 'elegant',
    category: 'casual',
    colors: {
      primary: '#059669',
      secondary: '#34D399',
      accent: '#ECFDF5',
      text: '#065F46',
    },
    is_premium: true,
  },
  {
    id: 'holiday-festive',
    name: 'Holiday Celebration',
    description: 'Festive holiday party invitation',
    style: 'festive',
    category: 'casual',
    colors: {
      primary: '#DC2626',
      secondary: '#F87171',
      accent: '#FEF2F2',
      text: '#7F1D1D',
    },
    is_premium: false,
  },
  {
    id: 'black-tie',
    name: 'Black Tie Event',
    description: 'Luxurious formal event invitation',
    style: 'formal',
    category: 'formal',
    colors: {
      primary: '#1F2937',
      secondary: '#374151',
      accent: '#F3F4F6',
      text: '#111827',
    },
    is_premium: true,
  },
  {
    id: 'summer-vibes',
    name: 'Summer Vibes',
    description: 'Bright and cheerful summer party invitation',
    style: 'fun',
    category: 'casual',
    colors: {
      primary: '#06B6D4',
      secondary: '#67E8F9',
      accent: '#F0F9FF',
      text: '#0E7490',
    },
    is_premium: false,
  },
];

export interface CustomInviteData {
  event_name: string;
  host_name: string;
  date: string;
  time: string;
  location: string;
  dress_code?: string;
  rsvp_info?: string;
  additional_notes?: string;
  template_id: string;
}

export interface InviteCustomization {
  template_id: string;
  custom_text: string;
  custom_colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    text?: string;
  };
  font_family?: 'serif' | 'sans-serif' | 'script' | 'modern';
  font_size?: 'small' | 'medium' | 'large';
  background_image?: string;
}