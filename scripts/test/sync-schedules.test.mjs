import { describe, it, expect } from 'vitest';
import { parseSchedules, diffSchedules, pauseSchedule, cronToUtc } from '../sync-schedules.mjs';

describe('parseSchedules', () => {
  it('parses a minimal YAML with one schedule', () => {
    const yamlText = `
version: 1
schedules:
  - id: test-routine
    cron: "0 9 * * 5"
    tz: America/Chicago
    prompt: "/blog test --cron"
`;
    const result = parseSchedules(yamlText);
    expect(result.version).toBe(1);
    expect(result.schedules).toHaveLength(1);
    expect(result.schedules[0].id).toBe('test-routine');
    expect(result.schedules[0].cron).toBe('0 9 * * 5');
  });

  it('throws on missing required field "id"', () => {
    const yamlText = `
version: 1
schedules:
  - cron: "0 9 * * 5"
    prompt: "/blog --cron"
`;
    expect(() => parseSchedules(yamlText)).toThrow(/id/);
  });

  it('throws on missing required field "cron"', () => {
    const yamlText = `
version: 1
schedules:
  - id: x
    prompt: "/blog --cron"
`;
    expect(() => parseSchedules(yamlText)).toThrow(/cron/);
  });

  it('throws on missing required field "prompt"', () => {
    const yamlText = `
version: 1
schedules:
  - id: x
    cron: "0 9 * * 5"
`;
    expect(() => parseSchedules(yamlText)).toThrow(/prompt/);
  });

  it('defaults tz to America/Chicago when omitted', () => {
    const yamlText = `
version: 1
schedules:
  - id: x
    cron: "0 9 * * 5"
    prompt: "/blog --cron"
`;
    const result = parseSchedules(yamlText);
    expect(result.schedules[0].tz).toBe('America/Chicago');
  });

  it('throws on empty YAML', () => {
    expect(() => parseSchedules('')).toThrow();
  });

  it('throws when schedules is missing', () => {
    expect(() => parseSchedules('version: 1')).toThrow(/schedules/);
  });
});

describe('diffSchedules', () => {
  const desired = [
    { id: 'a', cron: '0 9 * * 5', tz: 'America/Chicago', prompt: '/blog a --cron' },
    { id: 'b', cron: '0 8 1 * *', tz: 'America/Chicago', prompt: '/triage --cron' },
  ];
  const current = [
    { id: 'a', cron: '0 9 * * 5', tz: 'America/Chicago', prompt: '/blog a --cron' },  // unchanged
    { id: 'c', cron: '0 7 * * *', tz: 'America/Chicago', prompt: '/old --cron' },     // to delete
  ];

  it('detects creates, updates, and deletes', () => {
    const diff = diffSchedules(desired, current);
    expect(diff.create.map((s) => s.id)).toEqual(['b']);
    expect(diff.delete.map((s) => s.id)).toEqual(['c']);
    expect(diff.update).toEqual([]);
  });

  it('detects update when cron changes', () => {
    const desiredChanged = [{ ...desired[0], cron: '0 10 * * 5' }];
    const diff = diffSchedules(desiredChanged, [desired[0]]);
    expect(diff.update.map((s) => s.id)).toEqual(['a']);
  });

  it('detects update when prompt changes', () => {
    const desiredChanged = [{ ...desired[0], prompt: '/blog a --cron --different' }];
    const diff = diffSchedules(desiredChanged, [desired[0]]);
    expect(diff.update.map((s) => s.id)).toEqual(['a']);
  });

  it('returns empty diff when desired and current match exactly', () => {
    const diff = diffSchedules(desired, desired);
    expect(diff.create).toEqual([]);
    expect(diff.update).toEqual([]);
    expect(diff.delete).toEqual([]);
  });
});

describe('pauseSchedule', () => {
  it('adds a "paused: true" field to the schedule entry', () => {
    const schedules = [
      { id: 'a', cron: '0 9 * * 5', tz: 'America/Chicago', prompt: '/blog a --cron' },
      { id: 'b', cron: '0 8 1 * *', tz: 'America/Chicago', prompt: '/triage --cron' },
    ];
    const result = pauseSchedule(schedules, 'a');
    expect(result[0].paused).toBe(true);
    expect(result[1].paused).toBeUndefined();
  });

  it('is idempotent (pausing an already-paused entry is a no-op)', () => {
    const schedules = [{ id: 'a', cron: '0 9 * * 5', paused: true }];
    const result = pauseSchedule(schedules, 'a');
    expect(result[0].paused).toBe(true);
  });

  it('throws if routine id not found', () => {
    const schedules = [{ id: 'a', cron: '0 9 * * 5' }];
    expect(() => pauseSchedule(schedules, 'nonexistent')).toThrow(/not found/);
  });

  it('does not mutate the input array', () => {
    const schedules = [{ id: 'a', cron: '0 9 * * 5' }];
    pauseSchedule(schedules, 'a');
    expect(schedules[0].paused).toBeUndefined();
  });
});

describe('cronToUtc', () => {
  it('converts Fri 09:00 CDT to UTC (14:00)', () => {
    expect(cronToUtc('0 9 * * 5', 'America/Chicago')).toBe('0 14 * * 5');
  });

  it('converts Q-start 08:00 CDT to UTC (13:00)', () => {
    expect(cronToUtc('0 8 1 1,4,7,10 *', 'America/Chicago')).toBe('0 13 1 1,4,7,10 *');
  });

  it('handles Mon 08:30 CDT correctly (minutes preserved)', () => {
    expect(cronToUtc('30 8 * * 1', 'America/Chicago')).toBe('30 13 * * 1');
  });

  it('handles late-evening rollover (Sun 22:30 CDT → Mon 03:30 UTC)', () => {
    // 22 + 5 = 27 % 24 = 3
    expect(cronToUtc('30 22 * * 0', 'America/Chicago')).toBe('30 3 * * 0');
  });

  it('throws on unsupported tz', () => {
    expect(() => cronToUtc('0 9 * * 5', 'Europe/Madrid')).toThrow(/Unsupported tz/);
  });

  it('passes through wildcard hour without conversion', () => {
    expect(cronToUtc('30 * * * *', 'America/Chicago')).toBe('30 * * * *');
  });
});
