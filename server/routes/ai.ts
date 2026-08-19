// Express route: /api/ai
// Semantic event-detail extraction. The extraction engine lives in
// server/lib/event-extraction.ts: an env-gated LLM layer (Azure OpenAI or
// OpenAI) with a deterministic chrono-node + weighted-lexicon fallback that
// requires no external services. See that module for the full contract.

import { Router } from 'express';
import type { Response } from 'express';
import { requireAuth } from '../middleware/auth';
import type { AuthenticatedRequest } from '../middleware/auth';
import { extractEventDetails } from '../lib/event-extraction';
import { runChatTurn, sanitizeMessages, MAX_MESSAGES } from '../lib/event-chat';

const router = Router();

const MAX_INPUT_CHARS = 8000;

// ---------------------------------------------------------------------------
// POST /api/ai/chat — multi-turn conversational event planner.
// Body: { messages: Array<{ role: 'user' | 'assistant'; content: string }> }
// (full history, last message from the user). Stateless per request.
// Returns { reply, extracted, complete, source }.
// ---------------------------------------------------------------------------
router.post('/chat', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
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
