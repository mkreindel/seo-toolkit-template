/**
 * scripts/lib/audit-log.mjs
 *
 * Helpers for the centralized cron audit log + failure backoff state.
 * Plan 2+3 cron-fired scripts import these to:
 *   - log every run to a JSONL ledger (appendRun)
 *   - track per-routine consecutive failures (recordSuccess, recordFailure)
 *   - check whether a routine should auto-pause (checkBackoff)
 *
 * Files (default paths, overridable via function args):
 *   _audit-log/runs.jsonl      — append-only ledger, one JSON line per run
 *   _audit-log/failures.json   — per-routine consecutive-failure counter
 *
 * Convention for cron scripts (Plan 2+):
 *
 *   import { execFile } from 'node:child_process';
 *   import { promisify } from 'node:util';
 *   import { checkBackoff, recordSuccess, recordFailure, appendRun } from './lib/audit-log.mjs';
 *
 *   const execFileAsync = promisify(execFile);
 *
 *   if (await checkBackoff({ routine: 'site-a-drafter' })) {
 *     await execFileAsync('node', ['scripts/sync-schedules.mjs', '--pause-routine=site-a-drafter']);
 *     // ...write _inbox/routine-disabled-{name}.md
 *     process.exit(0);
 *   }
 *
 *   try {
 *     // ... routine logic ...
 *     await recordSuccess({ routine: 'site-a-drafter' });
 *     await appendRun({ routine: 'site-a-drafter', routineVersion: '1.0', exit: 'shipped', ... });
 *   } catch (err) {
 *     await recordFailure({ routine: 'site-a-drafter' });
 *     await appendRun({ routine: 'site-a-drafter', routineVersion: '1.0', exit: 'failed',
 *                      escalations: [err.message] });
 *   }
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_LOG = path.resolve('_audit-log/runs.jsonl');
const DEFAULT_FAILURES = path.resolve('_audit-log/failures.json');
const BACKOFF_THRESHOLD = 3;

/**
 * Append one JSON line to the audit log.
 * @param {object} opts
 * @param {string} [opts.logPath] — defaults to _audit-log/runs.jsonl
 * @param {string} opts.routine — routine ID (matches the schedules.yml entry)
 * @param {string} opts.routineVersion — semver-ish string; bump on behavior change
 * @param {string|null} [opts.site] — null for portfolio routines
 * @param {number|null} [opts.durationSec]
 * @param {string} opts.exit — one of: shipped, escalated, idempotent-skip, failed
 * @param {string[]} [opts.filesTouched]
 * @param {string[]} [opts.escalations] — summaries of what was escalated, if any
 */
export async function appendRun({
  logPath = DEFAULT_LOG,
  routine,
  routineVersion,
  site = null,
  durationSec = null,
  exit,
  filesTouched = [],
  escalations = [],
}) {
  const entry = {
    ts: new Date().toISOString(),
    routine,
    routine_version: routineVersion,
    site,
    duration_sec: durationSec,
    exit,
    files_touched: filesTouched,
    escalations,
  };
  await fs.mkdir(path.dirname(logPath), { recursive: true });
  await fs.appendFile(logPath, JSON.stringify(entry) + '\n', 'utf8');
}

async function readFailures(failuresPath) {
  try {
    const text = await fs.readFile(failuresPath, 'utf8');
    return JSON.parse(text);
  } catch (err) {
    if (err.code === 'ENOENT') return {};
    throw err;
  }
}

async function writeFailures(failuresPath, state) {
  await fs.mkdir(path.dirname(failuresPath), { recursive: true });
  await fs.writeFile(failuresPath, JSON.stringify(state, null, 2), 'utf8');
}

/**
 * Reset consecutive_failures to 0 and stamp last_success for the given routine.
 */
export async function recordSuccess({ failuresPath = DEFAULT_FAILURES, routine }) {
  const state = await readFailures(failuresPath);
  state[routine] = {
    consecutive_failures: 0,
    last_success: new Date().toISOString(),
  };
  await writeFailures(failuresPath, state);
}

/**
 * Increment consecutive_failures for the given routine. Preserves last_success.
 */
export async function recordFailure({ failuresPath = DEFAULT_FAILURES, routine }) {
  const state = await readFailures(failuresPath);
  const prev = state[routine] || { consecutive_failures: 0, last_success: null };
  state[routine] = {
    consecutive_failures: prev.consecutive_failures + 1,
    last_success: prev.last_success,
  };
  await writeFailures(failuresPath, state);
}

/**
 * Returns true if the routine has reached the 3-strike backoff threshold.
 */
export async function checkBackoff({ failuresPath = DEFAULT_FAILURES, routine }) {
  const state = await readFailures(failuresPath);
  const entry = state[routine];
  if (!entry) return false;
  return entry.consecutive_failures >= BACKOFF_THRESHOLD;
}
