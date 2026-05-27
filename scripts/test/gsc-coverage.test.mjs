import { describe, it, expect } from 'vitest';
import { detectCoverageDrop } from '../gsc-coverage.mjs';

describe('detectCoverageDrop', () => {
  it('flags > 5% drop as escalation', () => {
    const baseline = { indexed: 100, submitted: 100 };
    const current = { indexed: 90, submitted: 100 }; // 100% → 90% = 10% drop
    expect(detectCoverageDrop(baseline, current, 0.05)).toBe(true);
  });

  it('does not flag <= 5% drop', () => {
    const baseline = { indexed: 100, submitted: 100 };
    const current = { indexed: 97, submitted: 100 }; // 3% drop
    expect(detectCoverageDrop(baseline, current, 0.05)).toBe(false);
  });

  it('does not flag improvements', () => {
    const baseline = { indexed: 80, submitted: 100 };
    const current = { indexed: 95, submitted: 100 };
    expect(detectCoverageDrop(baseline, current, 0.05)).toBe(false);
  });

  it('handles zero baseline', () => {
    const baseline = { indexed: 0, submitted: 100 };
    const current = { indexed: 0, submitted: 100 };
    expect(detectCoverageDrop(baseline, current, 0.05)).toBe(false);
  });

  it('does not flag when zero submitted (avoids divide-by-zero edge)', () => {
    const baseline = { indexed: 0, submitted: 0 };
    const current = { indexed: 0, submitted: 0 };
    expect(detectCoverageDrop(baseline, current, 0.05)).toBe(false);
  });
});
