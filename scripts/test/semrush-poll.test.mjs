import { describe, it, expect } from 'vitest';
import { detectRankingChanges } from '../semrush-poll.mjs';

describe('detectRankingChanges', () => {
  const previousWeek = {
    'ai automation consultant': 45,
    'ai consultant for small business': 67,
    'ai consulting houston': 12,
  };
  const currentWeek = {
    'ai automation consultant': 38, // -7 (moved UP 7 positions)
    'ai consultant for small business': 67, // unchanged
    'ai consulting houston': 22, // +10 (moved DOWN 10 positions)
  };

  it('detects rank improvements >= 5 positions', () => {
    const changes = detectRankingChanges(previousWeek, currentWeek, { threshold: 5 });
    const improved = changes.filter((c) => c.delta < 0);
    expect(improved).toHaveLength(1);
    expect(improved[0].keyword).toBe('ai automation consultant');
    expect(improved[0].delta).toBe(-7);
  });

  it('detects rank regressions >= 5 positions', () => {
    const changes = detectRankingChanges(previousWeek, currentWeek, { threshold: 5 });
    const regressed = changes.filter((c) => c.delta > 0);
    expect(regressed).toHaveLength(1);
    expect(regressed[0].keyword).toBe('ai consulting houston');
    expect(regressed[0].delta).toBe(10);
  });

  it('detects new top-10 entries', () => {
    const newEntries = {
      'new-keyword': 5, // entered top 10
    };
    const changes = detectRankingChanges({}, newEntries, { threshold: 5 });
    expect(changes).toHaveLength(1);
    expect(changes[0].keyword).toBe('new-keyword');
    expect(changes[0].new_entry).toBe(true);
  });

  it('ignores changes below threshold', () => {
    const small = { keyword: 50 };
    const smaller = { keyword: 53 };
    const changes = detectRankingChanges(small, smaller, { threshold: 5 });
    expect(changes).toHaveLength(0);
  });
});
