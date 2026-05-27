import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isCronMode, writeInboxItem, formatInboxFilename } from '../lib/cron-mode.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

describe('isCronMode', () => {
  it('returns true when --cron is in argv', () => {
    expect(isCronMode(['/path/to/script', '--cron'])).toBe(true);
    expect(isCronMode(['node', 'script.mjs', '--cron', '--site=site-a'])).toBe(true);
  });

  it('returns false when --cron is absent', () => {
    expect(isCronMode(['/path/to/script'])).toBe(false);
    expect(isCronMode(['node', 'script.mjs', '--site=site-a'])).toBe(false);
  });
});

describe('formatInboxFilename', () => {
  it('produces YYYY-MM-DD-{routine}-{topic}.md', () => {
    const date = new Date('2026-05-17T10:00:00Z');
    expect(formatInboxFilename({ date, routine: 'site-a-drafter', topic: 'voice-fail' })).toBe(
      '2026-05-17-site-a-drafter-voice-fail.md',
    );
  });

  it('slugifies topic with spaces and special chars', () => {
    const date = new Date('2026-05-17T10:00:00Z');
    expect(
      formatInboxFilename({ date, routine: 'r', topic: 'Keyword cannibalization conflict!' }),
    ).toBe('2026-05-17-r-keyword-cannibalization-conflict.md');
  });
});

describe('writeInboxItem', () => {
  let tmpDir;
  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cron-mode-test-'));
  });
  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('writes a properly-formatted inbox item file', async () => {
    const filepath = await writeInboxItem({
      siteDir: tmpDir,
      routine: 'r',
      topic: 'test',
      routineVersion: '1.0',
      site: 'testsite',
      trigger: 'something happened',
      whatITried: 'tried something',
      whatINeed: 'a decision',
      suggestedAction: 'do X',
      contextLinks: ['file1.md', 'file2.md'],
    });

    const content = await fs.readFile(filepath, 'utf8');
    expect(content).toContain('**Status:** OPEN');
    expect(content).toContain('**Routine:** r');
    expect(content).toContain('**Site:** testsite');
    expect(content).toContain('something happened');
    expect(content).toContain('tried something');
    expect(content).toContain('a decision');
    expect(content).toContain('routine_version:** 1.0');
  });

  it('places the file in {siteDir}/_inbox/', async () => {
    const filepath = await writeInboxItem({
      siteDir: tmpDir,
      routine: 'r',
      topic: 't',
      routineVersion: '1.0',
      trigger: 't',
      whatITried: 't',
      whatINeed: 't',
    });
    expect(filepath).toContain('/_inbox/');
    expect(path.basename(filepath)).toMatch(/^\d{4}-\d{2}-\d{2}-r-t\.md$/);
  });
});
