import { describe, it, expect } from 'vitest';
import { detectCwvRegression } from '../crux-poll.mjs';

describe('detectCwvRegression', () => {
  const baseline = { lcp: 2200, inp: 150, cls: 0.05 }; // all "Good"

  it('flags LCP crossing 2500ms', () => {
    const current = { lcp: 2600, inp: 150, cls: 0.05 };
    const issues = detectCwvRegression(baseline, current);
    expect(issues).toContainEqual(expect.stringContaining('LCP'));
  });

  it('flags INP crossing 200ms', () => {
    const current = { lcp: 2200, inp: 250, cls: 0.05 };
    const issues = detectCwvRegression(baseline, current);
    expect(issues).toContainEqual(expect.stringContaining('INP'));
  });

  it('flags CLS crossing 0.1', () => {
    const current = { lcp: 2200, inp: 150, cls: 0.15 };
    const issues = detectCwvRegression(baseline, current);
    expect(issues).toContainEqual(expect.stringContaining('CLS'));
  });

  it('returns empty array when all metrics within thresholds', () => {
    const current = { lcp: 2200, inp: 150, cls: 0.05 };
    expect(detectCwvRegression(baseline, current)).toEqual([]);
  });

  it('does not flag when baseline was already over threshold (no new regression)', () => {
    const overBaseline = { lcp: 3000, inp: 250, cls: 0.15 };
    const stillOver = { lcp: 3100, inp: 260, cls: 0.16 };
    // Already over threshold isn't a NEW regression; the routine only flags crossings
    expect(detectCwvRegression(overBaseline, stillOver)).toEqual([]);
  });
});
