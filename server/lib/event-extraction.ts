// server/lib/event-extraction.ts — semantic event-detail extraction.
//
// Replaces the previous keyword/substring matcher in routes/ai.ts, which had
// no semantic capability at all: it defaulted to "birthday" on zero signal,
// never populated eventDate/eventTime, and extracted times-of-day as
// locations ("at 3pm" -> location "3pm").
//
// Pipeline (first success wins):
//   1. LLM extraction — used only when configured via environment:
//        Azure OpenAI: AZURE_OPENAI_ENDPOINT + AZURE_OPENAI_API_KEY +
//                      AZURE_OPENAI_DEPLOYMENT (+ AZURE_OPENAI_API_VERSION)
//        OpenAI:       OPENAI_API_KEY (+ OPENAI_MODEL, default gpt-4o-mini)
//      Strict JSON contract, zod-validated, bounded 8s timeout. Any failure
//      (network, timeout, malformed output) falls through to layer 2 — the
//      endpoint never depends on LLM availability.
//   2. Deterministic semantic extraction — always available, no keys:
//        - chrono-node natural-language date/time parsing ("next Saturday
//          at 7pm"), which also yields the matched text spans so date/time
//          words are EXCLUDED from location extraction.
//        - Weighted word-boundary lexicon scoring for template detection
//          (multi-word phrases outweigh single words; no default-template
//          bias — confidence 0 means "we do not know").
//
// The result carries `source: 'llm' | 'heuristic'` so clients and logs can
// distinguish which layer answered.

import * as chrono from 'chrono-node';
import { z } from 'zod';

export interface ExtractedEventData {
  templateId: string;
  eventName?: string;
  description: string;
  eventDate?: string; // YYYY-MM-DD
  eventTime?: string; // HH:MM (24h)
  location?: string;
  expectedGuests?: number;
  budget?: number;
  theme?: string;
  specialRequests?: string;
  formData: Record<string, unknown>;
  confidence: number; // 0..1
  source: 'llm' | 'heuristic';
}

export const KNOWN_TEMPLATE_IDS = [
  'birthday',
  'kids-birthday',
  'wedding',
  'conference',
  'product-launch',
  'fundraiser',
  'festival',
  'travel',
  'block-party',
  'workshop',
  'hackathon',
] as const;

// ---------------------------------------------------------------------------
// Layer 2 — deterministic semantic extraction
// ---------------------------------------------------------------------------

interface WeightedKeyword {
  phrase: string;
  weight: number;
}

// Multi-word phrases are strong evidence (weight 3); distinctive single
// words medium (2); generic single words weak (1). Scoring sums matched
// weights — it does NOT divide by list length, so adding keywords never
// penalizes a template (the old matcher's core defect).
const TEMPLATE_LEXICON: Record<string, WeightedKeyword[]> = {
  birthday: [
    { phrase: 'birthday', weight: 3 },
    { phrase: 'turning', weight: 2 },
    { phrase: 'years old', weight: 2 },
    { phrase: 'cake', weight: 1 },
    { phrase: 'bday', weight: 3 },
  ],
  'kids-birthday': [
    { phrase: 'kids birthday', weight: 4 },
    { phrase: "child's birthday", weight: 4 },
    { phrase: 'children party', weight: 3 },
    { phrase: 'bounce house', weight: 3 },
    { phrase: 'kid', weight: 1 },
    { phrase: 'toddler', weight: 2 },
    { phrase: 'son', weight: 1 },
    { phrase: 'daughter', weight: 1 },
  ],
  wedding: [
    { phrase: 'wedding', weight: 3 },
    { phrase: 'getting married', weight: 4 },
    { phrase: 'bride', weight: 2 },
    { phrase: 'groom', weight: 2 },
    { phrase: 'engagement party', weight: 4 },
    { phrase: 'reception', weight: 2 },
    { phrase: 'ceremony', weight: 1 },
  ],
  conference: [
    { phrase: 'conference', weight: 3 },
    { phrase: 'summit', weight: 3 },
    { phrase: 'corporate meeting', weight: 4 },
    { phrase: 'business meeting', weight: 4 },
    { phrase: 'keynote', weight: 2 },
    { phrase: 'speakers', weight: 1 },
    { phrase: 'attendees', weight: 1 },
  ],
  'product-launch': [
    { phrase: 'product launch', weight: 4 },
    { phrase: 'launch event', weight: 4 },
    { phrase: 'new product', weight: 3 },
    { phrase: 'unveiling', weight: 2 },
    { phrase: 'debut', weight: 2 },
    { phrase: 'press', weight: 1 },
  ],
  fundraiser: [
    { phrase: 'fundraiser', weight: 3 },
    { phrase: 'charity', weight: 3 },
    { phrase: 'silent auction', weight: 4 },
    { phrase: 'donation', weight: 2 },
    { phrase: 'benefit', weight: 1 },
    { phrase: 'gala', weight: 2 },
    { phrase: 'nonprofit', weight: 2 },
  ],
  festival: [
    { phrase: 'festival', weight: 3 },
    { phrase: 'concert', weight: 3 },
    { phrase: 'live music', weight: 3 },
    { phrase: 'stages', weight: 2 },
    { phrase: 'lineup', weight: 2 },
    { phrase: 'headliner', weight: 3 },
  ],
  travel: [
    { phrase: 'group travel', weight: 4 },
    { phrase: 'trip', weight: 2 },
    { phrase: 'vacation', weight: 3 },
    { phrase: 'getaway', weight: 3 },
    { phrase: 'retreat', weight: 2 },
    { phrase: 'itinerary', weight: 3 },
    { phrase: 'flights', weight: 2 },
  ],
  'block-party': [
    { phrase: 'block party', weight: 4 },
    { phrase: 'street party', weight: 4 },
    { phrase: 'neighborhood', weight: 2 },
    { phrase: 'neighbors', weight: 2 },
    { phrase: 'potluck', weight: 2 },
    { phrase: 'community gathering', weight: 3 },
  ],
  workshop: [
    { phrase: 'workshop', weight: 3 },
    { phrase: 'training', weight: 2 },
    { phrase: 'masterclass', weight: 3 },
    { phrase: 'course', weight: 2 },
    { phrase: 'hands-on', weight: 2 },
    { phrase: 'students', weight: 1 },
    { phrase: 'lesson', weight: 2 },
  ],
  hackathon: [
    { phrase: 'hackathon', weight: 4 },
    { phrase: 'coding competition', weight: 4 },
    { phrase: 'developers', weight: 2 },
    { phrase: 'teams competing', weight: 2 },
    { phrase: 'demo day', weight: 2 },
    { phrase: 'judges', weight: 1 },
  ],
};

/** Escape a phrase for use inside a RegExp. */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Weighted word-boundary template detection.
 * Returns confidence 0 with templateId 'birthday' ONLY as a labeled guess —
 * callers must treat confidence < 0.34 as "ask the user".
 */
export function detectTemplate(text: string): { templateId: string; confidence: number } {
  const scores = new Map<string, number>();

  for (const [templateId, keywords] of Object.entries(TEMPLATE_LEXICON)) {
    let score = 0;
    for (const { phrase, weight } of keywords) {
      const re = new RegExp(`\\b${escapeRegExp(phrase)}\\b`, 'i');
      if (re.test(text)) score += weight;
    }
    scores.set(templateId, score);
  }

  let best: { templateId: string; score: number } = { templateId: 'birthday', score: 0 };
  let runnerUp = 0;
  for (const [templateId, score] of scores) {
    if (score > best.score) {
      runnerUp = best.score;
      best = { templateId, score };
    } else if (score > runnerUp) {
      runnerUp = score;
    }
  }

  if (best.score === 0) {
    return { templateId: 'birthday', confidence: 0 };
  }

  // Confidence blends absolute evidence (capped at weight 6) with the margin
  // over the runner-up, so "wedding vs engagement-party ambiguity" scores
  // lower than an unambiguous match of equal strength.
  const evidence = Math.min(best.score / 6, 1);
  const margin = best.score === 0 ? 0 : (best.score - runnerUp) / best.score;
  const confidence = Math.round((0.6 * evidence + 0.4 * margin) * 100) / 100;
  return { templateId: best.templateId, confidence };
}

interface DateTimeExtraction {
  eventDate?: string;
  eventTime?: string;
  /** Character spans of the matched date/time text, for exclusion elsewhere. */
  spans: Array<{ start: number; end: number }>;
}

/** chrono-node natural-language date/time parsing, forward-dated. */
export function extractDateTime(text: string, referenceDate = new Date()): DateTimeExtraction {
  const results = chrono.parse(text, referenceDate, { forwardDate: true });
  if (results.length === 0) return { spans: [] };

  const first = results[0];
  const date = first.start.date();
  const spans = results.map((r) => ({ start: r.index, end: r.index + r.text.length }));

  const pad = (n: number) => String(n).padStart(2, '0');
  const eventDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

  // Only report a time when the text actually specified one.
  const eventTime = first.start.isCertain('hour')
    ? `${pad(date.getHours())}:${pad(date.getMinutes())}`
    : undefined;

  return { eventDate, eventTime, spans };
}

export function extractNumbers(text: string): { guests?: number; budget?: number } {
  const result: { guests?: number; budget?: number } = {};

  const guestPatterns = [
    /(\d+)\s*(?:people|guests|attendees|friends|folks|persons|invitees|kids|children|adults|players|developers|students)/i,
    /expecting\s+(?:about\s+|around\s+|roughly\s+)?(\d+)/i,
    /for\s+(\d+)\s+(?:people|guests)/i,
    /invite\s+(?:about\s+|around\s+)?(\d+)/i,
    /(?:about|around|roughly)\s+(\d+)\s+(?:people|guests|kids|children|attendees)/i,
  ];
  for (const pattern of guestPatterns) {
    const match = text.match(pattern);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= 2 && num < 100000) {
        result.guests = num;
        break;
      }
    }
  }

  const budgetPatterns = [
    /budget\s+(?:of\s+|is\s+|around\s+|about\s+)?\$?([\d,]+)(?:k\b)?/i,
    /\$([\d,]+)\s*k\b/i,
    /\$([\d,]+)/,
    /([\d,]+)\s*(?:dollar|usd)/i,
  ];
  for (const pattern of budgetPatterns) {
    const match = text.match(pattern);
    if (match) {
      let num = parseInt(match[1].replace(/,/g, ''), 10);
      // "$5k" / "budget of 5k"
      if (/k\b/i.test(match[0]) && num < 1000) num *= 1000;
      if (num >= 50 && num < 10000000) {
        result.budget = num;
        break;
      }
    }
  }

  return result;
}

/** Blank out the given character spans so downstream regexes cannot match them. */
function maskSpans(text: string, spans: Array<{ start: number; end: number }>): string {
  let masked = text;
  for (const { start, end } of spans) {
    masked = masked.slice(0, start) + ' '.repeat(end - start) + masked.slice(end);
  }
  return masked;
}

// NOTE: deliberately does NOT include "the" — real venues are commonly
// article-prefixed ("The Grand Ballroom").
const LOCATION_STOPWORDS = /^(?:a|an|my|our|this|that|it|home|noon|midnight|least|most|first|best)\b/i;

/** Remove prepositions left dangling after date/time spans were masked out. */
function stripDanglingWords(location: string): string {
  // Cut trailing subordinate clauses first: "Innovation Hub for 120
  // developers" -> "Innovation Hub".
  let cleaned = location.split(/\s+(?:for|with)\s+\d/i)[0];
  let previous = '';
  while (previous !== cleaned) {
    previous = cleaned;
    cleaned = cleaned.replace(/\s+(?:on|at|in|from|by|for|this|next|and|,)$/i, '').trim();
  }
  return cleaned;
}

/**
 * Location extraction over date/time-masked text: "at Riverside Park on
 * next Saturday at 7pm" yields "Riverside Park", never "7pm".
 */
export function extractLocation(
  text: string,
  dateSpans: Array<{ start: number; end: number }>,
): string | undefined {
  const masked = maskSpans(text, dateSpans);

  const patterns = [
    /\bvenue\s+(?:is\s+)?(?:at\s+)?([^,.!?\n]+)/i,
    /\blocation\s+(?:is\s+)?(?:at\s+)?([^,.!?\n]+)/i,
    /\b(?:held|hosted|happening)\s+at\s+([^,.!?\n]+)/i,
    /\bat\s+(?:the\s+)?([A-Z][^,.!?\n]*)/, // capitalized place after "at"
    /\bin\s+([A-Z][^,.!?\n]*)/, // capitalized place after "in"
  ];

  for (const pattern of patterns) {
    const match = masked.match(pattern);
    if (match) {
      const location = stripDanglingWords(match[1].trim().replace(/\s{2,}/g, ' '));
      if (
        location.length >= 3 &&
        location.length <= 100 &&
        !LOCATION_STOPWORDS.test(location) &&
        !/^\d+$/.test(location)
      ) {
        return location;
      }
    }
  }
  return undefined;
}

export function extractEventName(text: string, templateId: string): string | undefined {
  const patterns = [
    /(?:planning|organizing|hosting|throwing)\s+(?:a|an|the)?\s*([^,.!?\n]{4,60}?)\s+(?:party|event|celebration|gathering)\b/i,
    /\bfor\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)'s\s+(?:birthday|party|wedding|shower)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let name = match[1].trim().replace(/^(?:a|an|the)\s+/i, '');
      if (name.length >= 3 && name.length <= 80) {
        name = name.charAt(0).toUpperCase() + name.slice(1);
        return name;
      }
    }
  }

  const defaults: Record<string, string> = {
    birthday: 'Birthday Celebration',
    'kids-birthday': 'Kids Birthday Party',
    wedding: 'Wedding Celebration',
    conference: 'Professional Conference',
    'product-launch': 'Product Launch',
    fundraiser: 'Fundraiser Gala',
    festival: 'Festival',
    travel: 'Group Trip',
    'block-party': 'Block Party',
    workshop: 'Workshop',
    hackathon: 'Hackathon',
  };
  return defaults[templateId];
}

export function extractTheme(text: string): string | undefined {
  const patterns = [
    /\btheme\s+(?:is\s+|of\s+)([^,.!?\n]{3,30})/i,
    /\b([\w\s-]{3,30}?)[-\s]themed\b/i,
    // Value-before-keyword: "superhero theme", "under the sea theme".
    /\b((?:[\w-]+\s+){0,3}[\w-]+)\s+theme\b/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const theme = match[1].trim().replace(/^(?:a|an|the|with|has|have)\s+/i, '');
      if (theme.length >= 3 && theme.length <= 30 && !/^\d+$/.test(theme)) {
        return theme.charAt(0).toUpperCase() + theme.slice(1);
      }
    }
  }
  return undefined;
}

/** Per-template boolean/enum hints from explicit phrases (word-bounded). */
export function generateFormData(
  templateId: string,
  text: string,
  extracted: { guests?: number; budget?: number; theme?: string },
): Record<string, unknown> {
  const formData: Record<string, unknown> = {};
  const has = (phrase: string) => new RegExp(`\\b${escapeRegExp(phrase)}\\b`, 'i').test(text);

  if (extracted.guests) formData.expected_guest_count = extracted.guests;
  if (extracted.budget) formData.budget_estimate = extracted.budget;
  if (extracted.theme) formData.theme = extracted.theme;

  switch (templateId) {
    case 'birthday':
    case 'kids-birthday':
      if (/\b(?:milestone|30th|40th|50th|60th)\b/i.test(text)) formData.is_milestone = true;
      if (has('surprise')) formData.is_surprise = true;
      if (has('open bar') || has('cocktails')) formData.bar_service = 'Open Bar';
      if (has('dinner')) formData.meal_service = 'Dinner';
      if (has('bounce house')) formData.activities = ['Bounce House'];
      break;
    case 'wedding':
      if (has('outdoor') || has('garden')) formData.venue_type = 'Outdoor';
      if (has('church') || has('religious')) formData.ceremony_type = 'Religious';
      if (has('reception')) formData.has_reception = true;
      if (has('intimate') || has('small')) formData.wedding_size = 'Intimate';
      else if (has('grand') || has('large')) formData.wedding_size = 'Grand';
      break;
    case 'conference': {
      const days = text.match(/\b(\d+)[-\s]day\b/i);
      if (days) formData.number_of_days = parseInt(days[1], 10);
      if (has('keynote')) formData.has_keynote = true;
      if (has('networking')) formData.networking_events = true;
      break;
    }
    case 'product-launch':
      if (has('press') || has('media')) formData.press_media_invited = true;
      if (has('vip') || has('exclusive')) formData.vip_guests = true;
      if (has('live stream') || has('livestream')) formData.live_streaming = true;
      break;
    case 'fundraiser':
      if (has('auction')) formData.has_silent_auction = true;
      if (has('donation') || has('donations')) formData.donations_accepted = true;
      if (extracted.budget) formData.fundraising_goal = extracted.budget;
      break;
    case 'festival':
      if (has('camping')) formData.has_camping = true;
      if (has('food')) formData.food_vendors = true;
      if (has('weekend') || /\b(\d+)[-\s]day\b/i.test(text)) formData.duration_days = 2;
      break;
    case 'travel':
      if (has('flight') || has('flights') || has('flying')) formData.has_flights = true;
      if (has('hotel')) formData.accommodation_type = 'Hotel';
      if (has('adventure') || has('hiking')) formData.trip_type = 'Adventure';
      break;
    case 'block-party':
      if (has('permit')) formData.permit_obtained = true;
      if (has('bounce house')) formData.activities = ['Bounce House'];
      if (has('potluck')) formData.food_style = 'Potluck';
      break;
    case 'workshop':
      if (has('beginner') || has('intro')) formData.skill_level = 'Beginner';
      if (has('certificate') || has('certification')) formData.certificate_offered = true;
      if (has('hands-on') || has('practical')) formData.hands_on_practice = true;
      break;
    case 'hackathon':
      if (has('prize') || has('prizes') || has('cash')) formData.prizes_awards = 'Cash Prizes';
      if (has('team') || has('teams')) formData.team_size = '3-5 People';
      if (/\b24[-\s]hour\b/i.test(text)) formData.duration_hours = 24;
      else if (/\b48[-\s]hour\b/i.test(text)) formData.duration_hours = 48;
      break;
  }

  return formData;
}

/** The always-available deterministic pipeline. */
export function extractHeuristically(userText: string, referenceDate = new Date()): ExtractedEventData {
  const { templateId, confidence } = detectTemplate(userText);
  const { eventDate, eventTime, spans } = extractDateTime(userText, referenceDate);
  const { guests, budget } = extractNumbers(userText);
  const location = extractLocation(userText, spans);
  const theme = extractTheme(userText);
  const eventName = extractEventName(userText, templateId);
  const formData = generateFormData(templateId, userText, { guests, budget, theme });

  return {
    templateId,
    eventName,
    description: userText.slice(0, 500),
    eventDate,
    eventTime,
    location,
    expectedGuests: guests,
    budget,
    theme,
    specialRequests: undefined,
    formData,
    confidence,
    source: 'heuristic',
  };
}

// ---------------------------------------------------------------------------
// Layer 1 — LLM extraction (env-gated)
// ---------------------------------------------------------------------------

const llmResponseSchema = z.object({
  templateId: z.enum(KNOWN_TEMPLATE_IDS),
  eventName: z.string().min(1).max(120).optional().nullable(),
  eventDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  eventTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional()
    .nullable(),
  location: z.string().min(1).max(200).optional().nullable(),
  expectedGuests: z.number().int().min(1).max(100000).optional().nullable(),
  budget: z.number().min(0).max(10000000).optional().nullable(),
  theme: z.string().min(1).max(60).optional().nullable(),
  specialRequests: z.string().max(1000).optional().nullable(),
  confidence: z.number().min(0).max(1),
});

interface LlmConfig {
  url: string;
  headers: Record<string, string>;
  model?: string;
}

/** Resolve LLM configuration from the environment; null when unconfigured. */
export function resolveLlmConfig(env: NodeJS.ProcessEnv = process.env): LlmConfig | null {
  const azureEndpoint = env.AZURE_OPENAI_ENDPOINT;
  const azureKey = env.AZURE_OPENAI_API_KEY;
  const azureDeployment = env.AZURE_OPENAI_DEPLOYMENT;
  if (azureEndpoint && azureKey && azureDeployment) {
    const apiVersion = env.AZURE_OPENAI_API_VERSION || '2024-06-01';
    const base = azureEndpoint.replace(/\/+$/, '');
    return {
      url: `${base}/openai/deployments/${azureDeployment}/chat/completions?api-version=${apiVersion}`,
      headers: { 'api-key': azureKey, 'Content-Type': 'application/json' },
    };
  }

  const openaiKey = env.OPENAI_API_KEY;
  if (openaiKey) {
    return {
      url: 'https://api.openai.com/v1/chat/completions',
      headers: { Authorization: `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      model: env.OPENAI_MODEL || 'gpt-4o-mini',
    };
  }

  return null;
}

const LLM_TIMEOUT_MS = 8000;

const SYSTEM_PROMPT = `You extract structured event-planning details from a user's free-text description.
Respond with ONLY a JSON object (no markdown fences) with these keys:
templateId (one of: ${KNOWN_TEMPLATE_IDS.join(', ')}),
eventName (string or null), eventDate (YYYY-MM-DD or null, resolve relative dates from the reference date),
eventTime (HH:MM 24h or null), location (string or null), expectedGuests (integer or null),
budget (number, USD, or null), theme (string or null), specialRequests (string or null),
confidence (0..1, your certainty in templateId).
Never invent details that are not stated or clearly implied.`;

/**
 * LLM extraction. Returns null on ANY failure so the caller can fall back.
 * Bounded by an 8s abort; response strictly validated before use.
 */
export async function extractWithLlm(
  userText: string,
  referenceDate: Date,
  config: LlmConfig,
): Promise<ExtractedEventData | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);
  try {
    // No temperature parameter: reasoning-class models (gpt-5 family)
    // reject any value other than their default and would turn every call
    // into a silent heuristic fallback. Output determinism is enforced by
    // the JSON contract + zod validation instead.
    const body: Record<string, unknown> = {
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Reference date: ${referenceDate.toISOString().slice(0, 10)}\n\nEvent description:\n${userText.slice(0, 4000)}`,
        },
      ],
      response_format: { type: 'json_object' },
    };
    if (config.model) body.model = config.model;

    const response = await fetch(config.url, {
      method: 'POST',
      headers: config.headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn(`[AI] LLM extraction HTTP ${response.status}; falling back to heuristics`);
      return null;
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = llmResponseSchema.safeParse(JSON.parse(content));
    if (!parsed.success) {
      console.warn('[AI] LLM output failed validation; falling back:', parsed.error.issues[0]?.message);
      return null;
    }

    const d = parsed.data;
    // formData hints stay deterministic — they encode our form fields, not
    // world knowledge, and must be consistent across llm/heuristic sources.
    const formData = generateFormData(d.templateId, userText, {
      guests: d.expectedGuests ?? undefined,
      budget: d.budget ?? undefined,
      theme: d.theme ?? undefined,
    });

    return {
      templateId: d.templateId,
      eventName: d.eventName ?? undefined,
      description: userText.slice(0, 500),
      eventDate: d.eventDate ?? undefined,
      eventTime: d.eventTime ?? undefined,
      location: d.location ?? undefined,
      expectedGuests: d.expectedGuests ?? undefined,
      budget: d.budget ?? undefined,
      theme: d.theme ?? undefined,
      specialRequests: d.specialRequests ?? undefined,
      formData,
      confidence: d.confidence,
      source: 'llm',
    };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.warn(`[AI] LLM extraction failed (${reason}); falling back to heuristics`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Public entry point: LLM when configured, deterministic otherwise. */
export async function extractEventDetails(
  userText: string,
  referenceDate = new Date(),
): Promise<ExtractedEventData> {
  const config = resolveLlmConfig();
  if (config) {
    const llmResult = await extractWithLlm(userText, referenceDate, config);
    if (llmResult) return llmResult;
  }
  return extractHeuristically(userText, referenceDate);
}
