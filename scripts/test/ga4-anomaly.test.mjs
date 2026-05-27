import { describe, it, expect } from 'vitest';
import { detectTrafficAnomaly } from '../ga4-anomaly.mjs';

describe('detectTrafficAnomaly', () => {
  it('flags > 25% drop in sessions', () => {
    expect(detectTrafficAnomaly(100, 70, 0.25)).toBe(true);
  });

  it('flags > 25% spike (could indicate spam or great PR)', () => {
    expect(detectTrafficAnomaly(100, 150, 0.25)).toBe(true);
  });

  it('does not flag within ±25%', () => {
    expect(detectTrafficAnomaly(100, 80, 0.25)).toBe(false);
    expect(detectTrafficAnomaly(100, 120, 0.25)).toBe(false);
  });

  it('returns false when baseline is 0 (no signal yet)', () => {
    expect(detectTrafficAnomaly(0, 10, 0.25)).toBe(false);
  });

  it('handles exact threshold boundaries', () => {
    expect(detectTrafficAnomaly(100, 75, 0.25)).toBe(false); // exactly 25% drop = not over
    expect(detectTrafficAnomaly(100, 74, 0.25)).toBe(true); // 26% drop
  });
});
