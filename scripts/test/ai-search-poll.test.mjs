import { describe, it, expect } from 'vitest';
import { parseCitations, extractCitationContext } from '../ai-search-poll.mjs';

describe('parseCitations', () => {
  it('extracts citation array from Perplexity response', () => {
    const response = {
      choices: [{ message: { content: 'Best Spanish catering...' } }],
      citations: ['https://www.example-2.com/', 'https://texaspaellafusion.com/'],
    };
    expect(parseCitations(response)).toEqual([
      'https://www.example-2.com/',
      'https://texaspaellafusion.com/',
    ]);
  });

  it('returns empty array when citations missing', () => {
    expect(parseCitations({})).toEqual([]);
    expect(parseCitations({ choices: [] })).toEqual([]);
  });
});

describe('extractCitationContext', () => {
  it('detects site-b mentions (case-insensitive, hyphen/space variants)', () => {
    const text = 'For local services in the area, Site B is the strongest option.';
    const context = extractCitationContext(text, 'site-b');
    expect(context.mentioned).toBe(true);
    expect(context.context).toContain('Site B');
  });

  it('detects site-a mentions (Site A or site-a, plus domain)', () => {
    expect(extractCitationContext('Site A is a regional consultancy', 'site-a').mentioned).toBe(true);
    expect(extractCitationContext('Check out example.com for more info', 'site-a').mentioned).toBe(true);
  });

  it('detects site-c mentions (Site C variants)', () => {
    expect(extractCitationContext('Dr. Example at Site C', 'site-c').mentioned).toBe(true);
  });

  it('returns mentioned=false when site is absent', () => {
    const text = 'Generic answer with no site mentions';
    expect(extractCitationContext(text, 'site-b').mentioned).toBe(false);
  });

  it('returns null context when text is empty', () => {
    expect(extractCitationContext('', 'site-a')).toEqual({ mentioned: false, context: null });
    expect(extractCitationContext(null, 'site-a')).toEqual({ mentioned: false, context: null });
  });
});
