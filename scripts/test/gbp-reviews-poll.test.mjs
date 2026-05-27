import { describe, it, expect } from 'vitest';
import { findNewReviews } from '../gbp-reviews-poll.mjs';

describe('findNewReviews', () => {
  it('finds reviews not in the previous baseline', () => {
    const previous = [
      { reviewId: 'r3', createTime: '2026-05-10T10:00:00Z' },
      { reviewId: 'r2', createTime: '2026-05-08T10:00:00Z' },
      { reviewId: 'r1', createTime: '2026-05-05T10:00:00Z' },
    ];
    const current = [
      { reviewId: 'r5', createTime: '2026-05-16T10:00:00Z' },
      { reviewId: 'r4', createTime: '2026-05-13T10:00:00Z' },
      { reviewId: 'r3', createTime: '2026-05-10T10:00:00Z' },
      { reviewId: 'r2', createTime: '2026-05-08T10:00:00Z' },
      { reviewId: 'r1', createTime: '2026-05-05T10:00:00Z' },
    ];
    const newOnes = findNewReviews(previous, current);
    expect(newOnes.map((r) => r.reviewId)).toEqual(['r5', 'r4']);
  });

  it('returns all reviews on first run (null previous)', () => {
    const current = [{ reviewId: 'r1', createTime: '2026-05-16T10:00:00Z' }];
    expect(findNewReviews(null, current)).toEqual(current);
  });

  it('returns empty when no new reviews', () => {
    const same = [{ reviewId: 'r1', createTime: '2026-05-16T10:00:00Z' }];
    expect(findNewReviews(same, same)).toEqual([]);
  });
});
