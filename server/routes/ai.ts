// Express route: /api/ai
// AI-powered event detail extraction from conversational text
// Replaces Vercel serverless function api/ai/extract-event-details.ts

import { Router } from 'express';
import type { Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import type { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

interface ExtractedEventData {
  templateId: string;
  eventName?: string;
  description: string;
  eventDate?: string;
  eventTime?: string;
  location?: string;
  expectedGuests?: number;
  budget?: number;
  theme?: string;
  specialRequests?: string;
  formData: Record<string, unknown>;
  confidence: number;
}

const TEMPLATE_KEYWORDS: Record<string, string[]> = {
  birthday: ['birthday', 'turning', 'years old', 'celebration', 'cake'],
  'kids-birthday': [
    'kids birthday',
    'child birthday',
    'children party',
    'turning 5',
    'turning 6',
    'turning 7',
    'turning 8',
    'turning 9',
    'turning 10',
  ],
  wedding: ['wedding', 'marriage', 'bride', 'groom', 'getting married', 'engagement party'],
  conference: [
    'conference',
    'summit',
    'seminar',
    'corporate meeting',
    'business meeting',
    'professional',
  ],
  'product-launch': ['product launch', 'launch event', 'new product', 'debut', 'unveiling'],
  fundraiser: ['fundraiser', 'charity', 'donation', 'benefit', 'auction', 'galas'],
  festival: ['festival', 'concert', 'music', 'outdoor event', 'community festival'],
  travel: ['trip', 'travel', 'vacation', 'getaway', 'group travel', 'retreat'],
  'block-party': ['block party', 'neighborhood', 'street party', 'community gathering'],
  workshop: ['workshop', 'class', 'training', 'course', 'learning', 'seminar', 'educational'],
  hackathon: ['hackathon', 'coding', 'competition', 'tech competition', 'developer'],
};

function detectTemplate(text: string): { templateId: string; confidence: number } {
  const lowerText = text.toLowerCase();
  let bestMatch = { templateId: 'birthday', confidence: 0 };

  for (const [templateId, keywords] of Object.entries(TEMPLATE_KEYWORDS)) {
    let matches = 0;
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        matches++;
      }
    }
    const confidence = matches / keywords.length;
    if (confidence > bestMatch.confidence) {
      bestMatch = { templateId, confidence: Math.min(confidence * 1.5, 1) };
    }
  }

  return bestMatch;
}

function extractNumbers(text: string): { guests?: number; budget?: number } {
  const result: { guests?: number; budget?: number } = {};

  // Extract guest count
  const guestPatterns = [
    /(\d+)\s*(?:people|guests|attendees|friends|family|persons)/i,
    /about\s+(\d+)/i,
    /around\s+(\d+)/i,
    /roughly\s+(\d+)/i,
    /expecting\s+(\d+)/i,
    /for\s+(\d+)\s+people/i,
  ];

  for (const pattern of guestPatterns) {
    const match = text.match(pattern);
    if (match) {
      const num = parseInt(match[1]);
      if (num > 5 && num < 10000) {
        result.guests = num;
        break;
      }
    }
  }

  // Extract budget
  const budgetPatterns = [
    /\$([\d,]+)/,
    /budget\s+(?:of\s+)?\$?([\d,]+)/i,
    /around\s+\$?([\d,]+)/i,
    /about\s+\$?([\d,]+)/i,
    /\$?([\d,]+)\s*(?:budget|dollars)/i,
  ];

  for (const pattern of budgetPatterns) {
    const match = text.match(pattern);
    if (match) {
      const num = parseInt(match[1].replace(',', ''));
      if (num > 50 && num < 1000000) {
        result.budget = num;
        break;
      }
    }
  }

  return result;
}

function extractEventName(text: string, templateId: string): string | undefined {
  const patterns = [
    /planning\s+(?:a|an)\s+(.+?)\s+(?:party|event|celebration|gathering|for)/i,
    /(.+?)\s+(?:party|event|celebration|gathering)/i,
    /for\s+(.+?)(?:'s|'s\s+(?:birthday|party|event))/i,
    /organizing\s+(?:a|an)\s+(.+?)(?:\s+for|\s+at|\s+on|\.|$)/i,
    /hosting\s+(?:a|an)\s+(.+?)(?:\s+for|\s+at|\s+on|\.|$)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let name = match[1].trim();
      // Clean up the name
      name = name.replace(/^(a|an|the)\s+/i, '');
      if (name.length > 3 && name.length < 100) {
        return name.charAt(0).toUpperCase() + name.slice(1);
      }
    }
  }

  // Generate from template and description
  if (templateId === 'birthday') return 'Birthday Celebration';
  if (templateId === 'wedding') return 'Wedding Celebration';
  if (templateId === 'conference') return 'Professional Conference';

  return undefined;
}

function extractLocation(text: string): string | undefined {
  const patterns = [
    /at\s+(.+?)(?:\s+on|\s+from|\.|$)/i,
    /in\s+(.+?)(?:\s+on|\s+from|\.|$)/i,
    /venue\s+(?:is\s+)?(?:at\s+)?(.+?)(?:\.|$)/i,
    /location\s+(?:is\s+)?(?:at\s+)?(.+?)(?:\.|$)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const location = match[1].trim();
      if (location.length > 3 && location.length < 100) {
        // Filter out common non-location words
        if (!/^(the|a|an|my|our|this|that)\s+/i.test(location)) {
          return location;
        }
      }
    }
  }

  return undefined;
}

function extractTheme(text: string): string | undefined {
  const patterns = [
    /theme\s+(?:is\s+)?(.+?)(?:\.|,|$)/i,
    /themed\s+(?:as\s+)?(.+?)(?:\.|,|$)/i,
    /(.+?)\s+theme/i,
    /(?:like|wants?)\s+(.+?)(?:\s+theme)?/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const theme = match[1].trim().toLowerCase();
      // Common themes
      const commonThemes = [
        'superhero',
        'princess',
        'pirate',
        'unicorn',
        'dinosaur',
        'space',
        'under the sea',
        'jungle',
        'retro',
        'vintage',
        'modern',
        'elegant',
        'casual',
        'formal',
      ];
      if (commonThemes.some((t) => theme.includes(t)) || theme.length < 30) {
        return theme.charAt(0).toUpperCase() + theme.slice(1);
      }
    }
  }

  return undefined;
}

function generateFormData(
  templateId: string,
  text: string,
  extracted: { guests?: number; budget?: number; theme?: string },
): Record<string, unknown> {
  const formData: Record<string, unknown> = {};
  const lowerText = text.toLowerCase();

  // Common fields
  if (extracted.guests) formData.expected_guest_count = extracted.guests;
  if (extracted.budget) formData.budget_estimate = extracted.budget;
  if (extracted.theme) formData.theme = extracted.theme;

  // Template-specific fields
  switch (templateId) {
    case 'birthday':
    case 'kids-birthday':
      if (
        lowerText.includes('milestone') ||
        lowerText.includes('30th') ||
        lowerText.includes('40th') ||
        lowerText.includes('50th')
      ) {
        formData.is_milestone = true;
      }
      if (lowerText.includes('surprise')) formData.is_surprise = true;
      if (lowerText.includes('cocktail') || lowerText.includes('open bar'))
        formData.bar_service = 'Open Bar';
      if (lowerText.includes('dinner') || lowerText.includes('meal'))
        formData.meal_service = 'Dinner';
      break;

    case 'wedding':
      if (lowerText.includes('outdoor') || lowerText.includes('garden'))
        formData.venue_type = 'Outdoor';
      if (lowerText.includes('church') || lowerText.includes('religious'))
        formData.ceremony_type = 'Religious';
      if (lowerText.includes('reception')) formData.has_reception = true;
      if (lowerText.includes('intimate') || lowerText.includes('small'))
        formData.wedding_size = 'Intimate';
      if (lowerText.includes('grand') || lowerText.includes('large'))
        formData.wedding_size = 'Grand';
      break;

    case 'conference':
      if (
        lowerText.includes('multi-day') ||
        lowerText.includes('2 day') ||
        lowerText.includes('3 day')
      ) {
        formData.number_of_days = parseInt(text.match(/(\d+)\s*day/)?.[1] || '2');
      }
      if (lowerText.includes('keynote')) formData.has_keynote = true;
      if (lowerText.includes('workshop')) formData.session_types = ['Workshop'];
      if (lowerText.includes('networking')) formData.networking_events = true;
      break;

    case 'product-launch':
      if (lowerText.includes('press') || lowerText.includes('media'))
        formData.press_media_invited = true;
      if (lowerText.includes('vip') || lowerText.includes('exclusive')) formData.vip_guests = true;
      if (lowerText.includes('live stream')) formData.live_streaming = true;
      break;

    case 'fundraiser':
      if (lowerText.includes('auction')) formData.has_silent_auction = true;
      if (lowerText.includes('donation')) formData.donations_accepted = true;
      if (extracted.budget) formData.fundraising_goal = extracted.budget;
      break;

    case 'festival':
      if (lowerText.includes('camping')) formData.has_camping = true;
      if (lowerText.includes('food')) formData.food_vendors = true;
      if (lowerText.includes('multi-day') || lowerText.includes('weekend')) formData.duration_days = 2;
      break;

    case 'travel':
      if (lowerText.includes('flight') || lowerText.includes('flying')) formData.has_flights = true;
      if (lowerText.includes('hotel')) formData.accommodation_type = 'Hotel';
      if (lowerText.includes('adventure') || lowerText.includes('outdoor'))
        formData.trip_type = 'Adventure';
      break;

    case 'block-party':
      if (lowerText.includes('permit')) formData.permit_obtained = true;
      if (lowerText.includes('bounce house')) formData.activities = ['Bounce House'];
      if (lowerText.includes('potluck')) formData.food_style = 'Potluck';
      break;

    case 'workshop':
      if (lowerText.includes('beginner') || lowerText.includes('intro'))
        formData.skill_level = 'Beginner';
      if (lowerText.includes('certificate') || lowerText.includes('certification'))
        formData.certificate_offered = true;
      if (lowerText.includes('hands-on') || lowerText.includes('practical'))
        formData.hands_on_practice = true;
      break;

    case 'hackathon':
      if (lowerText.includes('prize') || lowerText.includes('cash'))
        formData.prizes_awards = 'Cash Prizes';
      if (lowerText.includes('team') || lowerText.includes('group'))
        formData.team_size = '3-5 People';
      if (lowerText.includes('24 hour') || lowerText.includes('24-hour')) formData.duration_hours = 24;
      else if (lowerText.includes('48 hour') || lowerText.includes('48-hour'))
        formData.duration_hours = 48;
      break;
  }

  return formData;
}

// ---------------------------------------------------------------------------
// POST /api/ai/extract-event-details - extract event details from text using AI
// ---------------------------------------------------------------------------
router.post(
  '/extract-event-details',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { conversation } = req.body;

      if (!conversation || !Array.isArray(conversation) || conversation.length === 0) {
        return res.status(400).json({ error: 'Conversation array required' });
      }

      // Combine all user messages into one text
      const userText = conversation
        .filter((msg: { role: string; content: string }) => msg.role === 'user')
        .map((msg: { role: string; content: string }) => msg.content)
        .join(' ');

      if (!userText.trim()) {
        return res.status(400).json({ error: 'No user messages found' });
      }

      // Detect template
      const { templateId, confidence } = detectTemplate(userText);

      // Extract numbers
      const { guests, budget } = extractNumbers(userText);

      // Extract other fields
      const eventName = extractEventName(userText, templateId);
      const location = extractLocation(userText);
      const theme = extractTheme(userText);

      // Generate template-specific form data
      const formData = generateFormData(templateId, userText, { guests, budget, theme });

      const result: ExtractedEventData = {
        templateId,
        eventName,
        description: userText.slice(0, 500),
        location,
        expectedGuests: guests,
        budget,
        theme,
        specialRequests: userText.slice(0, 1000),
        formData,
        confidence,
      };

      // Log the extraction for improvement.
      // The ai_extractions table does not exist in the Prisma schema, so we
      // attempt a raw insert and silently ignore any error (same behavior as
      // the original Vercel function which used .catch(() => {})).
      try {
        await prisma.$executeRaw`
          INSERT INTO ai_extractions (user_id, input_text, extracted_data, confidence, created_at)
          VALUES (
            ${userId}::uuid,
            ${userText},
            ${JSON.stringify(result)}::jsonb,
            ${confidence},
            NOW()
          )
        `;
      } catch {
        // Silently fail logging - don't block response
      }

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      console.error('AI extraction error:', error);
      return res.status(500).json({
        error: 'Failed to extract event details',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
);

export default router;
