// Express route: /api/ai
// Semantic event-detail extraction. The extraction engine lives in
// server/lib/event-extraction.ts: an env-gated LLM layer (Azure OpenAI or
// OpenAI) with a deterministic chrono-node + weighted-lexicon fallback that
// requires no external services. See that module for the full contract.

import { Router } from 'express';
import type { Response } from 'express';
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { requireAuth } from '../middleware/auth';
import type { AuthenticatedRequest } from '../middleware/auth';
import { extractEventDetails } from '../lib/event-extraction';
import { runChatTurn, sanitizeMessages, MAX_MESSAGES } from '../lib/event-chat';

const router = Router();

// Every request here can cost LLM tokens. Auth alone does not bound spend —
// one signed-in user in a loop would. 30 requests / 5 min per user keeps
// interactive planning fluid (~1 turn / 10s) while capping worst-case burn.
// Mounted AFTER requireAuth on each route so req.user is populated; keyed
// by user id, falling back to IP for defense in depth.
const aiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) =>
    // `req.ip` alone is an IPv6 bypass: a caller holding a /64 has 2^64
    // addresses and each one is a fresh bucket, so the limit never binds.
    // `ipKeyGenerator` collapses an IPv6 address to its /64 prefix, which is
    // the unit actually allocated to a subscriber, and passes IPv4 through
    // unchanged.
    //
    // express-rate-limit v8 raises ERR_ERL_KEY_GEN_IPV6 for the naive form,
    // but only when NODE_ENV is not 'production'. The deployed API therefore
    // started cleanly while the bypass was live, and nothing surfaced it until
    // the server was finally run locally.
    (req as AuthenticatedRequest).user?.id ?? ipKeyGenerator(req.ip ?? '') ?? 'unknown',
  message: { error: 'Too many AI requests. Try again in a few minutes.' },
});

const MAX_INPUT_CHARS = 8000;

// ---------------------------------------------------------------------------
// POST /api/ai/chat — multi-turn conversational event planner.
// Body: { messages: Array<{ role: 'user' | 'assistant'; content: string }> }
// (full history, last message from the user). Stateless per request.
// Returns { reply, extracted, complete, source }.
// ---------------------------------------------------------------------------
router.post('/chat', requireAuth, aiLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const messages = sanitizeMessages((req.body as { messages?: unknown })?.messages);
    if (!messages) {
      return res.status(400).json({
        error: `Provide { messages: [{role, content}...] } — 1..${MAX_MESSAGES} entries, last one from the user`,
      });
    }

    const result = await runChatTurn(messages);
    return res.status(200).json({ success: true, data: result });
  } catch (error: unknown) {
    console.error('AI chat error:', error);
    return res.status(500).json({ error: 'Chat turn failed' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/ai/extract-event-details
// Body: { conversation: Array<{ role: string; content: string }> }
//   or  { text: string }
// ---------------------------------------------------------------------------
router.post(
  '/extract-event-details',
  requireAuth,
  aiLimiter,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { conversation, text } = req.body as {
        conversation?: Array<{ role?: unknown; content?: unknown }>;
        text?: unknown;
      };

      let userText = '';
      if (typeof text === 'string') {
        userText = text;
      } else if (Array.isArray(conversation) && conversation.length > 0) {
        userText = conversation
          .filter((msg) => msg?.role === 'user' && typeof msg.content === 'string')
          .map((msg) => msg.content as string)
          .join(' ');
      } else {
        return res.status(400).json({ error: 'Provide { text } or { conversation }' });
      }

      userText = userText.trim();
      if (!userText) {
        return res.status(400).json({ error: 'No user text found' });
      }
      if (userText.length > MAX_INPUT_CHARS) {
        userText = userText.slice(0, MAX_INPUT_CHARS);
      }

      const result = await extractEventDetails(userText);

      return res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      console.error('AI extraction error:', error);
      return res.status(500).json({
        error: 'Failed to extract event details',
      });
    }
  },
);

export default router;
