import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { appendRun, recordSuccess, recordFailure, checkBackoff } from '../lib/audit-log.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

let tmpDir;
let logPath;
let failuresPath;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'audit-log-test-'));
  logPath = path.join(tmpDir, 'runs.jsonl');
  failuresPath = path.join(tmpDir, 'failures.json');
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('appendRun', () => {
  it('writes a single JSON line per call', async () => {
    await appendRun({
      logPath,
      routine: 'test-routine',
      routineVersion: '1.0',
      site: 'site-a',
      durationSec: 10,
      exit: 'shipped',
      filesTouched: ['sites/site-a/_drafts/x/'],
      escalations: [],
    });

    const content = await fs.readFile(logPath, 'utf8');
    const lines = content.trim().split('\n');
    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(lines[0]);
    expect(parsed.routine).toBe('test-routine');
    expect(parsed.routine_version).toBe('1.0');
    expect(parsed.exit).toBe('shipped');
    expect(parsed.ts).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(parsed.files_touched).toEqual(['sites/site-a/_drafts/x/']);
  });

  it('appends, not overwrites, on subsequent calls', async () => {
    await appendRun({ logPath, routine: 'a', routineVersion: '1.0', exit: 'shipped' });
    await appendRun({ logPath, routine: 'b', routineVersion: '1.0', exit: 'shipped' });
    await appendRun({ logPath, routine: 'c', routineVersion: '1.0', exit: 'failed' });
    const lines = (await fs.readFile(logPath, 'utf8')).trim().split('\n');
    expect(lines).toHaveLength(3);
  });

  it('creates the log directory if it does not exist', async () => {
    const deepPath = path.join(tmpDir, 'deep', 'nested', 'runs.jsonl');
    await appendRun({ logPath: deepPath, routine: 'x', routineVersion: '1.0', exit: 'shipped' });
    const exists = await fs
      .stat(deepPath)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);
  });

  it('writes valid JSON per line (each line is independently parseable)', async () => {
    await appendRun({ logPath, routine: 'a', routineVersion: '1.0', exit: 'shipped' });
    await appendRun({
      logPath,
      routine: 'b',
      routineVersion: '1.0',
      exit: 'escalated',
      escalations: ['keyword cannibalization', 'voice fail'],
    });
    const content = await fs.readFile(logPath, 'utf8');
    for (const line of content.trim().split('\n')) {
      expect(() => JSON.parse(line)).not.toThrow();
    }
  });
});

describe('recordSuccess + recordFailure + checkBackoff', () => {
  it('recordSuccess resets consecutive_failures to 0', async () => {
    await fs.writeFile(
      failuresPath,
      JSON.stringify({ r: { consecutive_failures: 2, last_success: null } }),
    );
    await recordSuccess({ failuresPath, routine: 'r' });
    const state = JSON.parse(await fs.readFile(failuresPath, 'utf8'));
    expect(state.r.consecutive_failures).toBe(0);
    expect(state.r.last_success).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('recordFailure increments consecutive_failures', async () => {
    await fs.writeFile(failuresPath, JSON.stringify({}));
    await recordFailure({ failuresPath, routine: 'r' });
    await recordFailure({ failuresPath, routine: 'r' });
    await recordFailure({ failuresPath, routine: 'r' });
    const state = JSON.parse(await fs.readFile(failuresPath, 'utf8'));
    expect(state.r.consecutive_failures).toBe(3);
  });

  it('recordFailure preserves last_success on failure', async () => {
    const lastSuccess = '2026-05-15T12:00:00.000Z';
    await fs.writeFile(
      failuresPath,
      JSON.stringify({ r: { consecutive_failures: 0, last_success: lastSuccess } }),
    );
    await recordFailure({ failuresPath, routine: 'r' });
    const state = JSON.parse(await fs.readFile(failuresPath, 'utf8'));
    expect(state.r.last_success).toBe(lastSuccess);
    expect(state.r.consecutive_failures).toBe(1);
  });

  it('checkBackoff returns true when consecutive_failures >= 3', async () => {
    await fs.writeFile(
      failuresPath,
      JSON.stringify({ r: { consecutive_failures: 3, last_success: null } }),
    );
    expect(await checkBackoff({ failuresPath, routine: 'r' })).toBe(true);
  });

  it('checkBackoff returns false when consecutive_failures < 3', async () => {
    await fs.writeFile(
      failuresPath,
      JSON.stringify({ r: { consecutive_failures: 2, last_success: null } }),
    );
    expect(await checkBackoff({ failuresPath, routine: 'r' })).toBe(false);
  });

  it('checkBackoff returns false for unknown routines', async () => {
    await fs.writeFile(failuresPath, JSON.stringify({}));
    expect(await checkBackoff({ failuresPath, routine: 'unknown' })).toBe(false);
  });

  it('checkBackoff returns false when failures.json does not exist yet', async () => {
    const nonexistentPath = path.join(tmpDir, 'does-not-exist.json');
    expect(await checkBackoff({ failuresPath: nonexistentPath, routine: 'r' })).toBe(false);
  });

  it('recordFailure creates failures.json if it does not exist', async () => {
    const newPath = path.join(tmpDir, 'fresh-failures.json');
    await recordFailure({ failuresPath: newPath, routine: 'r' });
    const state = JSON.parse(await fs.readFile(newPath, 'utf8'));
    expect(state.r.consecutive_failures).toBe(1);
  });
});
