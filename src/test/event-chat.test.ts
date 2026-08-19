// Unit tests for the conversational event planner (server/lib/event-chat.ts).

import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  stripFiller,
  sanitizeMessages,
  runFallbackTurn,
  runLlmTurn,
  isCoreComplete,
  MAX_MESSAGES,
  type ChatMessage,
} from '../../server/lib/event-chat';

const REF = new Date('2026-08-19T12:00:00');

describe('stripFiller', () => {
  it('removes stacked filler openings', () => {
    expect(stripFiller('Great question! Sure thing, the venue fits 80 people.')).toBe(
      'The venue fits 80 people.',
    );
  });

  it('leaves substantive replies untouched', () => {
    expect(stripFiller('June 5th works — book the hall by Friday.')).toBe(
      'June 5th works — book the hall by Friday.',
    );
  });

  it('is bounded and never loops forever', () => {
    expect(stripFiller('Sure! Sure! Sure! Sure! Sure! Sure! Sure!')).not.toContain('Sure! Sure!');
  });
});

describe('sanitizeMessages', () => {
  it('accepts a valid history ending with a user turn', () => {
    const msgs = sanitizeMessages([
      { role: 'user', content: 'planning a wedding' },
      { role: 'assistant', content: 'When is it?' },
      { role: 'user', content: 'next June' },
    ]);
    expect(msgs).toHaveLength(3);
  });

  it.each([
    ['empty array', []],
    ['ends with assistant', [{ role: 'user', content: 'hi' }, { role: 'assistant', content: 'yes?' }]],
    ['bad role', [{ role: 'system', content: 'x' }]],
    ['non-string content', [{ role: 'user', content: 5 }]],
    ['blank content', [{ role: 'user', content: '   ' }]],
  ])('rejects %s', (_label, input) => {
    expect(sanitizeMessages(input)).toBeNull();
  });

  it('rejects oversized histories', () => {
    const many = Array.from({ length: MAX_MESSAGES + 1 }, () => ({ role: 'user' as const, content: 'x' }));
    expect(sanitizeMessages(many)).toBeNull();
  });
});

describe('runFallbackTurn (no LLM configured)', () => {
  it('summarizes known details and asks exactly one question', () => {
    const result = runFallbackTurn(
      [{ role: 'user', content: 'kids birthday party on June 5th 2027 at Sunshine Hall' }],
      REF,
    );
    expect(result.source).toBe('heuristic');
    expect(result.reply).toContain('kids birthday party');
    expect(result.reply).toContain('2027-06-05');
    // date + location known -> next missing critical field is guest count
    expect(result.reply).toContain('how many guests');
    expect((result.reply.match(/\?/g) ?? []).length).toBe(1);
    expect(result.complete).toBe(false);
  });

  it('completes once type+date+guests are known', () => {
    const result = runFallbackTurn(
      [{ role: 'user', content: 'wedding on June 5th 2027 for 90 guests at Lakeside Gardens' }],
      REF,
    );
    expect(result.complete).toBe(true);
    expect(result.reply).toContain('Apply details');
  });

  it('is honest about not answering open questions instead of emitting filler', () => {
    const result = runFallbackTurn(
      [{ role: 'user', content: 'wedding for 90 guests. What food should I serve?' }],
      REF,
    );
    expect(result.reply).toContain('not configured');
    expect(result.reply).not.toMatch(/^(great|sure|absolutely)/i);
  });
});

describe('runLlmTurn', () => {
  afterEach(() => vi.unstubAllGlobals());

  const history: ChatMessage[] = [{ role: 'user', content: 'wedding June 5 2027, 90 guests' }];

  function stubLlm(content: unknown) {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: JSON.stringify(content) } }] }),
      }),
    );
    // Make resolveLlmConfig see a configured provider.
    vi.stubEnv?.('OPENAI_API_KEY', 'test-key');
    process.env.OPENAI_API_KEY = 'test-key';
  }

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  it('returns a validated, filler-stripped turn', async () => {
    stubLlm({
      reply: 'Great question! June 5th 2027 is a Saturday, ideal for a wedding. Do you have a venue?',
      extracted: {
        templateId: 'wedding',
        eventDate: '2027-06-05',
        expectedGuests: 90,
        confidence: 0.95,
      },
      complete: true,
    });

    const result = await runLlmTurn(history, REF);
    expect(result?.source).toBe('llm');
    expect(result?.reply.startsWith('June 5th 2027 is a Saturday')).toBe(true);
    expect(result?.extracted.expectedGuests).toBe(90);
    expect(result?.complete).toBe(true);
  });

  it('rejects malformed output so the caller falls back', async () => {
    stubLlm({ reply: '', extracted: {}, complete: 'yes' });
    expect(await runLlmTurn(history, REF)).toBeNull();
  });

  it('complete=true from the model is overridden when core fields are missing', async () => {
    stubLlm({
      reply: 'Noted.',
      extracted: { templateId: 'wedding', confidence: 0.9 }, // no date, no guests
      complete: true,
    });
    const result = await runLlmTurn(history, REF);
    expect(result?.complete).toBe(false);
  });
});

describe('isCoreComplete', () => {
  it('requires template signal, date and guests', () => {
    const base = {
      templateId: 'wedding',
      description: '',
      formData: {},
      confidence: 0.9,
      source: 'llm' as const,
    };
    expect(isCoreComplete({ ...base, eventDate: '2027-06-05', expectedGuests: 90 })).toBe(true);
    expect(isCoreComplete({ ...base, eventDate: '2027-06-05' })).toBe(false);
    expect(isCoreComplete({ ...base, expectedGuests: 90 })).toBe(false);
    expect(isCoreComplete({ ...base, eventDate: '2027-06-05', expectedGuests: 90, confidence: 0 })).toBe(false);
  });
});
