// Unit tests for the semantic event-extraction engine
// (server/lib/event-extraction.ts). Pure functions — no network, no DB.

import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  detectTemplate,
  extractDateTime,
  extractNumbers,
  extractLocation,
  extractHeuristically,
  extractWithLlm,
  resolveLlmConfig,
} from '../../server/lib/event-extraction';

// Fixed reference date so relative-date assertions are deterministic.
// 2026-08-19 is a Wednesday.
const REF = new Date('2026-08-19T12:00:00');

describe('detectTemplate', () => {
  it('detects a wedding from unambiguous language', () => {
    const r = detectTemplate("We're getting married in June and want an intimate reception");
    expect(r.templateId).toBe('wedding');
    expect(r.confidence).toBeGreaterThan(0.5);
  });

  it('detects a hackathon', () => {
    const r = detectTemplate('48-hour hackathon for 120 developers with cash prizes and judges');
    expect(r.templateId).toBe('hackathon');
    expect(r.confidence).toBeGreaterThan(0.5);
  });

  it('reports zero confidence on zero signal instead of pretending', () => {
    const r = detectTemplate('hello there, nothing to see');
    expect(r.confidence).toBe(0);
  });

  it('does not let generic words hijack the template (old matcher defect)', () => {
    // "seminar" used to sit in BOTH the conference and workshop keyword
    // lists; "attendees" alone must not out-vote an explicit "workshop".
    const r = detectTemplate('a hands-on workshop with 20 students and a certificate');
    expect(r.templateId).toBe('workshop');
  });
});

describe('extractDateTime (chrono-node)', () => {
  it('parses explicit dates with times', () => {
    const r = extractDateTime('the party is on June 5th 2027 at 7pm', REF);
    expect(r.eventDate).toBe('2027-06-05');
    expect(r.eventTime).toBe('19:00');
  });

  it('parses relative dates forward from the reference', () => {
    const r = extractDateTime('planning dinner next Saturday', REF);
    expect(r.eventDate).toBe('2026-08-29');
    expect(r.eventTime).toBeUndefined(); // no time stated -> none invented
  });

  it('returns no fields when there is no date', () => {
    const r = extractDateTime('a party at Riverside Park', REF);
    expect(r.eventDate).toBeUndefined();
    expect(r.spans).toHaveLength(0);
  });
});

describe('extractLocation', () => {
  it('extracts the venue and never the time-of-day (old matcher extracted "3pm")', () => {
    const text = 'birthday party at Riverside Park on Saturday at 3pm';
    const { spans } = extractDateTime(text, REF);
    expect(extractLocation(text, spans)).toBe('Riverside Park');
  });

  it('extracts venue phrasing', () => {
    const text = 'the venue is The Grand Ballroom, doors at 6';
    const { spans } = extractDateTime(text, REF);
    expect(extractLocation(text, spans)).toBe('The Grand Ballroom');
  });

  it('returns undefined instead of garbage', () => {
    const text = 'we want it to be at least fun';
    const { spans } = extractDateTime(text, REF);
    expect(extractLocation(text, spans)).toBeUndefined();
  });
});

describe('extractNumbers', () => {
  it('extracts guest count and comma budgets', () => {
    const r = extractNumbers('expecting 150 guests with a budget of $12,500');
    expect(r.guests).toBe(150);
    expect(r.budget).toBe(12500);
  });

  it('understands $5k shorthand', () => {
    expect(extractNumbers('around $5k budget').budget).toBe(5000);
  });

  it('extracts small gatherings the old floor rejected', () => {
    expect(extractNumbers('dinner for 4 people').guests).toBe(4);
  });
});

describe('extractHeuristically (end to end)', () => {
  it('produces a complete result for a rich description', () => {
    const r = extractHeuristically(
      "Planning my daughter's kids birthday party at Sunshine Hall on June 5th 2027 at 2pm, about 25 kids, superhero theme, budget of $800, bounce house please",
      REF,
    );
    expect(r.templateId).toBe('kids-birthday');
    expect(r.eventDate).toBe('2027-06-05');
    expect(r.eventTime).toBe('14:00');
    expect(r.location).toBe('Sunshine Hall');
    expect(r.expectedGuests).toBe(25);
    expect(r.budget).toBe(800);
    expect(r.theme?.toLowerCase()).toContain('superhero');
    expect(r.formData.activities).toEqual(['Bounce House']);
    expect(r.source).toBe('heuristic');
  });
});

describe('LLM layer', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('resolveLlmConfig returns null when nothing is configured', () => {
    expect(resolveLlmConfig({} as NodeJS.ProcessEnv)).toBeNull();
  });

  it('resolveLlmConfig builds the Azure OpenAI URL', () => {
    const config = resolveLlmConfig({
      AZURE_OPENAI_ENDPOINT: 'https://example.openai.azure.com/',
      AZURE_OPENAI_API_KEY: 'test-key',
      AZURE_OPENAI_DEPLOYMENT: 'gpt-4o-mini',
    } as NodeJS.ProcessEnv);
    expect(config?.url).toBe(
      'https://example.openai.azure.com/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-06-01',
    );
  });

  it('accepts a valid LLM response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  templateId: 'wedding',
                  eventName: 'Ava & Sam',
                  eventDate: '2027-06-05',
                  eventTime: '16:00',
                  location: 'Lakeside Gardens',
                  expectedGuests: 90,
                  budget: 20000,
                  theme: null,
                  specialRequests: null,
                  confidence: 0.92,
                }),
              },
            },
          ],
        }),
      }),
    );

    const result = await extractWithLlm('our wedding...', REF, {
      url: 'https://example.test/llm',
      headers: {},
    });
    expect(result?.source).toBe('llm');
    expect(result?.templateId).toBe('wedding');
    expect(result?.expectedGuests).toBe(90);
  });

  it('returns null (fallback) on malformed LLM output', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"templateId":"pool-party","confidence":2}' } }],
        }),
      }),
    );
    const result = await extractWithLlm('text', REF, { url: 'https://example.test/llm', headers: {} });
    expect(result).toBeNull();
  });

  it('returns null (fallback) on HTTP error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429 }));
    const result = await extractWithLlm('text', REF, { url: 'https://example.test/llm', headers: {} });
    expect(result).toBeNull();
  });
});
