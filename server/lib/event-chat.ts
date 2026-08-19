// server/lib/event-chat.ts — multi-turn conversational event planning.
//
// Contract per turn: the client sends the full message history; the server
// returns { reply, extracted, complete, source }:
//   reply     — the assistant's next utterance. Hard rules: answers the
//               user's actual question first, carries no filler, asks at
//               most ONE question, never re-asks for known details.
//   extracted — the structured event state as understood after this turn
//               (same shape as one-shot extraction), so the UI can render
//               live detail chips and prefill forms at any point.
//   complete  — true once the planning-critical core (template, date,
//               guest count) is known.
//   source    — 'llm' (Azure OpenAI / OpenAI) or 'heuristic' fallback.
//
// The LLM path re-reads the WHOLE conversation every turn — semantic state
// lives in the transcript, not in server session state, which keeps the
// endpoint stateless and horizontally scalable. The fallback path runs the
// deterministic extractor over the concatenated user turns and drives the
// same one-question-at-a-time loop, so the feature degrades honestly (it
// says it cannot answer open questions) instead of producing canned filler.

import { z } from 'zod';
import {
  KNOWN_TEMPLATE_IDS,
  callChatCompletions,
  extractHeuristically,
  generateFormData,
  resolveLlmConfig,
  type ExtractedEventData,
} from './event-extraction';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatTurnResult {
  reply: string;
  extracted: ExtractedEventData;
  complete: boolean;
  source: 'llm' | 'heuristic';
}

export const MAX_MESSAGES = 40;
export const MAX_MESSAGE_CHARS = 4000;
const LLM_TIMEOUT_MS = 15000;
const MAX_REPLY_CHARS = 1200;

// ---------------------------------------------------------------------------
// Filler guard — deterministic, applied to EVERY llm reply.
// ---------------------------------------------------------------------------

const FILLER_OPENINGS =
  /^(?:great(?:\s+question)?|awesome|amazing|perfect|sure(?:\s+thing)?|absolutely|of course|no problem|got it|certainly|happy to help|i'd be happy to(?:\s+help(?:\s+with that)?)?|thanks(?:\s+for\s+\w+)*|thank you(?:\s+for\s+\w+)*)[,!.\s]+/i;

/**
 * Strip stock filler openings ("Great question! ", "Sure thing, ") until the
 * reply starts with substance. Bounded: at most 5 passes.
 */
export function stripFiller(reply: string): string {
  let cleaned = reply.trim();
  for (let i = 0; i < 10; i++) {
    const next = cleaned.replace(FILLER_OPENINGS, '');
    if (next === cleaned) break;
    cleaned = next.trim();
  }
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return cleaned;
}

// ---------------------------------------------------------------------------
// Completion criteria + next-question priority (shared by both paths)
// ---------------------------------------------------------------------------

export function isCoreComplete(extracted: ExtractedEventData): boolean {
  return Boolean(
    extracted.templateId && extracted.confidence > 0 && extracted.eventDate && extracted.expectedGuests,
  );
}

interface MissingField {
  key: 'eventDate' | 'expectedGuests' | 'location' | 'budget';
  question: string;
}

const FIELD_PRIORITY: MissingField[] = [
  { key: 'eventDate', question: 'When should the event happen? A rough date works.' },
  { key: 'expectedGuests', question: 'About how many guests are you expecting?' },
  { key: 'location', question: 'Do you have a venue or location in mind?' },
  { key: 'budget', question: 'Is there a budget I should plan around?' },
];

function nextMissingField(extracted: ExtractedEventData): MissingField | null {
  for (const field of FIELD_PRIORITY) {
    if (!extracted[field.key]) return field;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Deterministic fallback conversation (no LLM configured)
// ---------------------------------------------------------------------------

const TEMPLATE_LABELS: Record<string, string> = {
  birthday: 'birthday party',
  'kids-birthday': 'kids birthday party',
  wedding: 'wedding',
  conference: 'conference',
  'product-launch': 'product launch',
  fundraiser: 'fundraiser',
  festival: 'festival',
  travel: 'group trip',
  'block-party': 'block party',
  workshop: 'workshop',
  hackathon: 'hackathon',
};

function describeKnown(extracted: ExtractedEventData): string {
  const parts: string[] = [];
  if (extracted.confidence > 0) parts.push(`a ${TEMPLATE_LABELS[extracted.templateId] ?? extracted.templateId}`);
  if (extracted.eventDate) parts.push(`on ${extracted.eventDate}${extracted.eventTime ? ` at ${extracted.eventTime}` : ''}`);
  if (extracted.location) parts.push(`at ${extracted.location}`);
  if (extracted.expectedGuests) parts.push(`for ~${extracted.expectedGuests} guests`);
  if (extracted.budget) parts.push(`with a $${extracted.budget.toLocaleString('en-US')} budget`);
  return parts.join(', ');
}

export function runFallbackTurn(messages: ChatMessage[], referenceDate = new Date()): ChatTurnResult {
  const userText = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content)
    .join('\n');

  const extracted = extractHeuristically(userText, referenceDate);
  const complete = isCoreComplete(extracted);
  const missing = nextMissingField(extracted);
  const known = describeKnown(extracted);

  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const askedOpenQuestion = lastUser ? /\?\s*$/.test(lastUser.content.trim()) : false;

  const sentences: string[] = [];
  if (askedOpenQuestion) {
    // Honesty over improvisation: the deterministic planner cannot answer
    // free-form questions and must say so rather than emit boilerplate.
    sentences.push(
      'The AI answer engine is not configured on this server, so I can only track event details, not answer open questions.',
    );
  }
  if (known) {
    sentences.push(`So far I have: ${known}.`);
  } else if (!askedOpenQuestion) {
    sentences.push('Tell me about the event you are planning — type, date, guests, venue, budget.');
  }
  if (complete) {
    sentences.push('That covers the essentials — use "Apply details" to prefill your event, or keep refining.');
  } else if (missing && known) {
    sentences.push(missing.question);
  }

  return {
    reply: sentences.join(' '),
    extracted,
    complete,
    source: 'heuristic',
  };
}

// ---------------------------------------------------------------------------
// LLM conversation
// ---------------------------------------------------------------------------

const chatExtractionSchema = z.object({
  templateId: z.enum(KNOWN_TEMPLATE_IDS).optional().nullable(),
  eventName: z.string().max(120).optional().nullable(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  eventTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  expectedGuests: z.number().int().min(1).max(100000).optional().nullable(),
  budget: z.number().min(0).max(10000000).optional().nullable(),
  theme: z.string().max(60).optional().nullable(),
  specialRequests: z.string().max(1000).optional().nullable(),
  confidence: z.number().min(0).max(1).optional().nullable(),
});

const chatResponseSchema = z.object({
  reply: z.string().min(1).max(MAX_REPLY_CHARS * 2),
  extracted: chatExtractionSchema,
  complete: z.boolean(),
});

function buildSystemPrompt(referenceDate: Date): string {
  return `You are the PartyHause event-planning assistant. You help users plan events through conversation.

TODAY'S DATE: ${referenceDate.toISOString().slice(0, 10)}

ABSOLUTE RULES — every reply:
1. If the user asked a question, your FIRST sentence answers that exact question, specifically and truthfully. Never deflect a question you can answer.
2. Zero filler. Never open with "Great question", "Sure", "Absolutely", "I'd be happy to", or any pleasantry. Every sentence must carry information the user did not already have.
3. If the user's message is unrelated to event planning, answer it truthfully in one or two sentences if you can, then connect back to the event in one sentence. Do not pretend it was about the event.
4. Track every detail stated across the WHOLE conversation. Never re-ask for something already provided. When the user corrects a detail ("actually make it 40 guests"), the newest statement wins.
5. Ask at most ONE question per reply — for the most planning-critical missing detail, in this order: event type, date, guest count, location, budget. If nothing critical is missing, do not ask anything; suggest one concrete next step instead.
6. Be concrete and brief: 1-4 sentences. Give real recommendations with reasoning when asked (e.g. actual catering quantities, realistic budget splits), not generic advice.

TEMPLATE IDS (pick the closest for extracted.templateId): ${KNOWN_TEMPLATE_IDS.join(', ')}

OUTPUT — respond with ONLY this JSON object, no markdown fences:
{"reply": "<your reply following the rules>", "extracted": {"templateId": <id or null>, "eventName": <string or null>, "eventDate": <"YYYY-MM-DD" or null>, "eventTime": <"HH:MM" 24h or null>, "location": <string or null>, "expectedGuests": <int or null>, "budget": <number USD or null>, "theme": <string or null>, "specialRequests": <string or null>, "confidence": <0..1 certainty in templateId or null>}, "complete": <true when templateId+eventDate+expectedGuests are all known>}
extracted must reflect EVERYTHING known after this turn (latest corrections win). Never invent details the user did not state.`;
}

export async function runLlmTurn(
  messages: ChatMessage[],
  referenceDate: Date,
): Promise<ChatTurnResult | null> {
  const config = resolveLlmConfig();
  if (!config) return null;

  try {
    const body: Record<string, unknown> = {
      messages: [
        { role: 'system', content: buildSystemPrompt(referenceDate) },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      response_format: { type: 'json_object' },
      max_completion_tokens: 1500,
    };

    const content = await callChatCompletions(config, body, LLM_TIMEOUT_MS);
    if (!content) return null;

    const parsed = chatResponseSchema.safeParse(JSON.parse(content));
    if (!parsed.success) {
      console.warn('[AI chat] LLM output failed validation; falling back:', parsed.error.issues[0]?.message);
      return null;
    }

    const d = parsed.data;
    const reply = stripFiller(d.reply).slice(0, MAX_REPLY_CHARS);
    if (!reply) return null;

    const userText = messages
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .join('\n');

    const templateId = d.extracted.templateId ?? 'birthday';
    const confidence = d.extracted.confidence ?? (d.extracted.templateId ? 0.5 : 0);
    // formData hints stay deterministic and consistent with one-shot extraction.
    const formData = generateFormData(templateId, userText, {
      guests: d.extracted.expectedGuests ?? undefined,
      budget: d.extracted.budget ?? undefined,
      theme: d.extracted.theme ?? undefined,
    });

    const extracted: ExtractedEventData = {
      templateId,
      eventName: d.extracted.eventName ?? undefined,
      description: userText.slice(0, 500),
      eventDate: d.extracted.eventDate ?? undefined,
      eventTime: d.extracted.eventTime ?? undefined,
      location: d.extracted.location ?? undefined,
      expectedGuests: d.extracted.expectedGuests ?? undefined,
      budget: d.extracted.budget ?? undefined,
      theme: d.extracted.theme ?? undefined,
      specialRequests: d.extracted.specialRequests ?? undefined,
      formData,
      confidence,
      source: 'llm',
    };

    return {
      reply,
      extracted,
      // Derived, not model-asserted: the model's `complete` flag proved
      // inconsistent across turns (false after off-topic questions even
      // with full state). Core-field presence is the single source of truth.
      complete: isCoreComplete(extracted),
      source: 'llm',
    };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.warn(`[AI chat] LLM turn failed (${reason}); falling back`);
    return null;
  }
}

/** Public entry: LLM when configured, deterministic fallback otherwise. */
export async function runChatTurn(
  messages: ChatMessage[],
  referenceDate = new Date(),
): Promise<ChatTurnResult> {
  const llmResult = await runLlmTurn(messages, referenceDate);
  if (llmResult) return llmResult;
  return runFallbackTurn(messages, referenceDate);
}

/** Validate and normalize the inbound message array. Returns null when invalid. */
export function sanitizeMessages(raw: unknown): ChatMessage[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_MESSAGES) return null;
  const messages: ChatMessage[] = [];
  for (const item of raw) {
    const role = (item as { role?: unknown })?.role;
    const content = (item as { content?: unknown })?.content;
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') return null;
    const trimmed = content.trim();
    if (!trimmed) return null;
    messages.push({ role, content: trimmed.slice(0, MAX_MESSAGE_CHARS) });
  }
  if (messages[messages.length - 1].role !== 'user') return null;
  return messages;
}
