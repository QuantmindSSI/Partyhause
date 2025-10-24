/**
 * Template Background Utilities
 * 
 * Provides template-specific background images and color themes for event cards.
 * Each template type gets a unique visual identity.
 */

export interface TemplateColors {
  primary: string;
  accent: string;
  background: string;
  text: string;
}

/**
 * Get background image URI for template type
 * For now using placeholder images from Unsplash
 * TODO: Replace with custom background images in assets/backgrounds/
 */
export const getTemplateBackground = (templateType: string): string => {
  const backgrounds: Record<string, string> = {
    // Birthday & Celebrations
    'birthday': 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80', // Balloons
    'kids-birthday': 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=800&q=80', // Colorful party
    
    // Wedding & Romance
    'wedding': 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80', // Elegant wedding
    
    // Business & Professional
    'product-launch': 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&q=80', // Modern tech
    'conference': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80', // Conference hall
    'corporate': 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80', // Office event
    'hackathon': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80', // Coding workspace
    
    // Entertainment & Music
    'festival': 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80', // Music festival
    
    // Community & Social
    'fundraiser': 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&q=80', // Community gathering
    'block-party': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80', // Outdoor BBQ
    
    // Education & Learning
    'class': 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80', // Classroom/books
    
    // Travel & Adventure
    'travel': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80', // Scenic destination
    
    // Default fallback
    'default': 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80', // Generic celebration
  };
  
  return backgrounds[templateType] || backgrounds['default'];
};

/**
 * Get color theme for template type
 */
export const getTemplateColors = (templateType: string): TemplateColors => {
  const colors: Record<string, TemplateColors> = {
    // Birthday & Celebrations
    'birthday': {
      primary: '#f59e0b', // Amber
      accent: '#fbbf24',
      background: '#fef3c7',
      text: '#78350f',
    },
    'kids-birthday': {
      primary: '#ec4899', // Pink
      accent: '#f472b6',
      background: '#fce7f3',
      text: '#831843',
    },
    
    // Wedding & Romance
    'wedding': {
      primary: '#f43f5e', // Rose
      accent: '#fb7185',
      background: '#ffe4e6',
      text: '#881337',
    },
    
    // Business & Professional
    'product-launch': {
      primary: '#8b5cf6', // Purple
      accent: '#a78bfa',
      background: '#f3e8ff',
      text: '#581c87',
    },
    'conference': {
      primary: '#0ea5e9', // Sky blue
      accent: '#38bdf8',
      background: '#dbeafe',
      text: '#075985',
    },
    'corporate': {
      primary: '#64748b', // Slate
      accent: '#94a3b8',
      background: '#f1f5f9',
      text: '#1e293b',
    },
    'hackathon': {
      primary: '#06b6d4', // Cyan
      accent: '#22d3ee',
      background: '#cffafe',
      text: '#164e63',
    },
    
    // Entertainment & Music
    'festival': {
      primary: '#f97316', // Orange
      accent: '#fb923c',
      background: '#fed7aa',
      text: '#7c2d12',
    },
    
    // Community & Social
    'fundraiser': {
      primary: '#10b981', // Green
      accent: '#34d399',
      background: '#d1fae5',
      text: '#065f46',
    },
    'block-party': {
      primary: '#ef4444', // Red
      accent: '#f87171',
      background: '#fee2e2',
      text: '#7f1d1d',
    },
    
    // Education & Learning
    'class': {
      primary: '#6366f1', // Indigo
      accent: '#818cf8',
      background: '#e0e7ff',
      text: '#3730a3',
    },
    
    // Travel & Adventure
    'travel': {
      primary: '#14b8a6', // Teal
      accent: '#2dd4bf',
      background: '#ccfbf1',
      text: '#115e59',
    },
  };
  
  return colors[templateType] || {
    primary: '#9333ea', // Default purple
    accent: '#a855f7',
    background: '#f3e8ff',
    text: '#581c87',
  };
};

/**
 * Get formatted template name for display
 */
export const getTemplateDisplayName = (templateType: string): string => {
  const names: Record<string, string> = {
    'birthday': 'Birthday Party',
    'kids-birthday': 'Kids Birthday',
    'wedding': 'Wedding',
    'product-launch': 'Product Launch',
    'conference': 'Conference',
    'corporate': 'Corporate Event',
    'hackathon': 'Hackathon',
    'festival': 'Festival',
    'fundraiser': 'Fundraiser',
    'block-party': 'Block Party',
    'class': 'Class/Workshop',
    'travel': 'Travel',
  };
  
  return names[templateType] || templateType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Get icon name for template type (compatible with Ionicons)
 */
export const getTemplateIcon = (templateType: string): string => {
  const icons: Record<string, string> = {
    'birthday': 'gift',
    'kids-birthday': 'balloon',
    'wedding': 'heart',
    'product-launch': 'rocket',
    'conference': 'business',
    'corporate': 'briefcase',
    'hackathon': 'code-slash',
    'festival': 'musical-notes',
    'fundraiser': 'cash',
    'block-party': 'home',
    'class': 'school',
    'travel': 'airplane',
  };
  
  return icons[templateType] || 'calendar';
};
