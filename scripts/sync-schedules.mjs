#!/usr/bin/env node
/**
 * scripts/sync-schedules.mjs
 *
 * Reads .claude/schedules.yml (declarative cron config) and applies
 * create / update / delete actions to bring the actual /schedule state
 * in sync.
 *
 * Usage:
 *   node scripts/sync-schedules.mjs              # apply changes (Plan 2 Phase C)
 *   node scripts/sync-schedules.mjs --dry-run    # preview only
 *   node scripts/sync-schedules.mjs --pause-routine=<id>   # mark entry paused: true
 *
 * Exit codes:
 *   0  success (sync complete or dry-run preview shown)
 *   1  invalid YAML or schedule definition
 *   2  partial failure during sync (some operations did not apply)
 *
 * Plan 1 ships parser + diff + pause + dry-run. Plan 2 Phase C step 15
 * wires this to the actual /schedule CLI.
 */
import yaml from 'js-yaml';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCHEDULES_PATH = path.resolve('.claude/schedules.yml');

export function parseSchedules(yamlText) {
  const parsed = yaml.load(yamlText);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('YAML root must be an object');
  }
  if (!Array.isArray(parsed.schedules)) {
    throw new Error('YAML must contain a top-level "schedules" array');
  }
  for (const s of parsed.schedules) {
    if (!s.id) throw new Error(`Schedule entry missing required field "id"`);
    if (!s.cron) throw new Error(`Schedule "${s.id}" missing required field "cron"`);
    if (!s.prompt) throw new Error(`Schedule "${s.id}" missing required field "prompt"`);
    if (!s.tz) s.tz = 'America/Chicago';
  }
  return { version: parsed.version || 1, schedules: parsed.schedules };
}

export function diffSchedules(desired, current) {
  const desiredById = new Map(desired.map((s) => [s.id, s]));
  const currentById = new Map(current.map((s) => [s.id, s]));

  const create = [];
  const update = [];
  const del = [];

  for (const [id, d] of desiredById) {
    const c = currentById.get(id);
    if (!c) create.push(d);
    else if (c.cron !== d.cron || c.prompt !== d.prompt || c.tz !== d.tz) update.push(d);
  }
  for (const [id, c] of currentById) {
    if (!desiredById.has(id)) del.push(c);
  }

  return { create, update, delete: del };
}

export function pauseSchedule(schedules, routineId) {
  const idx = schedules.findIndex((s) => s.id === routineId);
  if (idx === -1) throw new Error(`Schedule with id "${routineId}" not found`);
  return schedules.map((s, i) => (i === idx ? { ...s, paused: true } : s));
}

/**
 * Convert a 5-field cron expression from a named timezone to UTC.
 * Currently supports America/Chicago (CDT = UTC-5 / CST = UTC-6).
 * For Plan 2: assume CDT (DST active May 16); refine for DST transitions if needed.
 */
export function cronToUtc(cronExpr, tz) {
  if (tz !== 'America/Chicago') {
    throw new Error(`Unsupported tz: ${tz} (only America/Chicago is mapped for Plan 2)`);
  }
  const offsetHours = 5; // CDT is UTC-5 (May–November). CST would be 6.
  const parts = cronExpr.split(/\s+/);
  if (parts.length !== 5) throw new Error(`Expected 5-field cron, got "${cronExpr}"`);
  const [minute, hour, dom, month, dow] = parts;
  const hourNum = parseInt(hour, 10);
  if (Number.isNaN(hourNum)) {
    // e.g., "*" or a range — pass through unchanged; user must use simple hours for Plan 2
    return cronExpr;
  }
  const utcHour = (hourNum + offsetHours) % 24;
  return `${minute} ${utcHour} ${dom} ${month} ${dow}`;
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const pauseArg = process.argv.find((a) => a.startsWith('--pause-routine='))?.split('=')[1];
  const commitSnapshot = process.argv.includes('--commit-snapshot');
  const yamlText = await fs.readFile(SCHEDULES_PATH, 'utf8');
  const data = parseSchedules(yamlText);

  if (pauseArg) {
    const updated = pauseSchedule(data.schedules, pauseArg);
    const newYaml = yaml.dump({ version: data.version, schedules: updated }, { lineWidth: 200 });
    await fs.writeFile(SCHEDULES_PATH, newYaml, 'utf8');
    console.log(`Paused routine "${pauseArg}" in ${SCHEDULES_PATH}.`);
    return;
  }

  // Compare against snapshot
  const SNAPSHOT_PATH = path.resolve('.claude/schedules-current.json');
  let current = [];
  try {
    current = JSON.parse(await fs.readFile(SNAPSHOT_PATH, 'utf8'));
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }

  const diff = diffSchedules(data.schedules, current);
  console.log(`Parsed ${data.schedules.length} schedule entries from ${SCHEDULES_PATH}.`);
  console.log(`Snapshot has ${current.length} entries.`);
  console.log(
    `\nDiff: ${diff.create.length} create | ${diff.update.length} update | ${diff.delete.length} delete`,
  );

  if (diff.create.length) {
    console.log('\n--- CREATE these via RemoteTrigger.create (or /schedule skill): ---');
    for (const s of diff.create) {
      const utcCron = cronToUtc(s.cron, s.tz || 'America/Chicago');
      console.log(`  + ${s.id}`);
      console.log(`    cron (${s.tz}): ${s.cron}  →  UTC: ${utcCron}`);
      console.log(`    prompt: ${s.prompt}`);
    }
  }
  if (diff.update.length) {
    console.log('\n--- UPDATE these: ---');
    for (const s of diff.update) {
      console.log(`  ~ ${s.id} → cron=${s.cron} prompt=${s.prompt}`);
    }
  }
  if (diff.delete.length) {
    console.log('\n--- DELETE these: ---');
    for (const s of diff.delete) console.log(`  - ${s.id}`);
  }

  if (commitSnapshot) {
    await fs.writeFile(SNAPSHOT_PATH, JSON.stringify(data.schedules, null, 2));
    console.log(`\n✅ Snapshot committed to ${SNAPSHOT_PATH}`);
  } else if (!isDryRun && diff.create.length + diff.update.length + diff.delete.length > 0) {
    console.log(
      '\nApply via RemoteTrigger.create (Claude session) or /schedule skill (interactive).',
    );
    console.log('After applying, re-run with --commit-snapshot to update local state.');
  }
}

// Run main() if this file is invoked directly (handles paths with spaces by normalizing both URLs)
if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || '')) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
