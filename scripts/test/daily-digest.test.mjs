import { describe, it, expect } from 'vitest';
import { buildDigest } from '../daily-digest.mjs';

describe('buildDigest', () => {
  it('builds a subject + body from runs + inbox + drafts', () => {
    const runs = [
      {
        ts: '2026-05-22T12:02:00Z',
        routine: 'portfolio-daily-sitemap-regression',
        site: null,
        duration_sec: 0.7,
        exit: 'shipped',
        escalations: [],
      },
      {
        ts: '2026-05-22T13:31:00Z',
        routine: 'portfolio-weekly-gsc-coverage',
        site: null,
        duration_sec: 4.5,
        exit: 'escalated',
        escalations: ['site-a: 95% → 87%'],
      },
    ];
    const openInbox = [
      { site: 'site-a', filename: 'x.md', filepath: 'sites/site-a/_inbox/x.md' },
    ];
    const drafts = [{ site: 'site-a', name: '2026-05-15-keyword-y', ageDays: 7 }];

    const { subject, body, summary } = buildDigest(runs, openInbox, drafts);
    expect(subject).toContain('1 shipped');
    expect(subject).toContain('1 escalated');
    expect(body).toContain('portfolio-daily-sitemap-regression');
    expect(body).toContain('portfolio-weekly-gsc-coverage');
    expect(body).toContain('site-a: 95% → 87%');
    expect(body).toContain('Open _inbox items');
    expect(body).toContain('Drafts pending review (1)');
    expect(summary.shipped).toBe(1);
    expect(summary.escalated).toBe(1);
  });

  it('handles zero runs cleanly', () => {
    const { subject, body } = buildDigest([], [], []);
    expect(subject).toContain('0 shipped');
    expect(body).toContain('(no runs yet — first cron firings imminent)');
  });

  it('flags aging drafts (>7 days old)', () => {
    const drafts = [
      { site: 'site-a', name: 'fresh', ageDays: 2 },
      { site: 'site-a', name: 'stale', ageDays: 14 },
    ];
    const { body } = buildDigest([], [], drafts);
    expect(body).toContain('fresh');
    expect(body).toContain('stale');
    expect(body).toContain('aging');
  });
});
