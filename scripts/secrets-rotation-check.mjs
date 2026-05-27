#!/usr/bin/env node
/**
 * scripts/secrets-rotation-check.mjs
 *
 * P4.2 — portfolio-monthly-secrets-rotation cron.
 * 15th of month, 09:00 CDT — parses sites/_portfolio/secrets-rotation.md
 * "Active secrets" table. For each row where Next rotation is ≤ 7 days away
 * (or in the past), writes one _inbox/ item with the rotation procedure for
 * that secret type.
 *
 * routine_version: 1.0.
 *
 * The cron NEVER auto-rotates — it only surfaces upcoming/overdue rotations.
 * Manual rotation is required because most providers need interactive auth.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { appendRun, recordSuccess, recordFailure, checkBackoff } from './lib/audit-log.mjs';
import { writeInboxItem } from './lib/cron-mode.mjs';

const ROUTINE_VERSION = '1.0';
const ROUTINE_ID = 'portfolio-monthly-secrets-rotation';
const PORTFOLIO_DIR = path.resolve('sites/_portfolio');
const ROTATION_FILE = path.join(PORTFOLIO_DIR, 'secrets-rotation.md');
const WARNING_DAYS_AHEAD = 7;

/**
 * Pure-function: parse the markdown rotation table into rows.
 * Skips rows where last_rotated or next_rotation is a {TO FILL} placeholder.
 */
export function parseRotationTable(markdown) {
  const lines = markdown.split('\n');
  const rows = [];
  let inTable = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('|---') || trimmed.startsWith('| ---')) {
      inTable = true;
      continue;
    }
    if (!inTable) continue;
    if (!trimmed.startsWith('|') || trimmed.startsWith('| ID ')) continue;

    const cells = trimmed.split('|').slice(1, -1).map((c) => c.trim());
    if (cells.length < 7) continue;

    const [id, service, location, type, lastRotated, nextRotation, notes] = cells;
    if (!id || id.startsWith('{') || id === '---') continue;

    rows.push({
      id,
      service,
      location,
      type,
      last_rotated: lastRotated,
      next_rotation: nextRotation,
      notes,
      filled: !lastRotated.includes('{TO FILL}') && !nextRotation.includes('{TO FILL}'),
    });
  }

  return rows;
}

/**
 * Pure-function: filter rows to those due for rotation within `daysAhead`
 * (default 7) or already overdue.
 */
export function findDueRotations(rows, opts = {}) {
  const { daysAhead = WARNING_DAYS_AHEAD, today = new Date() } = opts;
  const todayMs = today.getTime();
  const horizonMs = todayMs + daysAhead * 24 * 60 * 60 * 1000;

  return rows
    .filter((r) => r.filled)
    .map((r) => {
      const next = new Date(r.next_rotation);
      if (isNaN(next.getTime())) return null;
      const daysUntil = Math.floor((next.getTime() - todayMs) / (24 * 60 * 60 * 1000));
      const overdue = next.getTime() < todayMs;
      const dueSoon = next.getTime() <= horizonMs;
      if (!overdue && !dueSoon) return null;
      return { ...r, days_until: daysUntil, overdue, next_date: next.toISOString().slice(0, 10) };
    })
    .filter(Boolean);
}

const PROCEDURES = {
  'OAuth refresh token': `1. Visit the authorization URL printed by node scripts/test-api-auth.mjs --service={service}.
2. Authorize as the account owner.
3. Copy the redirect code.
4. Run node scripts/test-api-auth.mjs --{service}-code=<paste-code>.
5. Update .env with the new refresh token.
6. Update sites/_portfolio/secrets-rotation.md "Last rotated" column to today.
7. Re-test via node scripts/test-api-auth.mjs --service={service}.`,
  'API key': `1. Visit the provider dashboard.
2. Generate a new key with the same scope/permissions.
3. Update .env with the new key.
4. Revoke the old key.
5. Update sites/_portfolio/secrets-rotation.md.
6. Re-test via node scripts/test-api-auth.mjs --service={service}.
7. If the key is embedded in a Claude cron trigger prompt (see sites/_portfolio/trigger-stored-secrets.md), update the trigger via Anthropic dashboard.`,
  'Service account JSON': `1. Google Cloud Console → IAM → Service Accounts → {account} → Keys.
2. "Add Key" → JSON.
3. Download to .secrets/{file}.json (overwrite).
4. Delete the old key from the Keys tab.
5. Update sites/_portfolio/secrets-rotation.md.
6. Re-test via node scripts/test-api-auth.mjs --service={service}.`,
  'Webhook URL': `1. In Make.com (or other provider), open the scenario containing the webhook trigger.
2. Click the webhook module → "Add" → generate new URL.
3. Update the webhook URL everywhere it's referenced.
4. Disable the old webhook module.
5. Update sites/_portfolio/secrets-rotation.md.`,
  PAT: `1. GitHub → Settings → Developer settings → Personal access tokens.
2. Generate new token with same scope.
3. Update .env GITHUB_TOKEN.
4. Update any external service using the PAT (Anthropic cron triggers etc.).
5. Revoke the old PAT.
6. Update sites/_portfolio/secrets-rotation.md.`,
};

function procedureFor(type) {
  for (const [key, proc] of Object.entries(PROCEDURES)) {
    if (type.toLowerCase().includes(key.toLowerCase())) return proc;
  }
  return '(No standard procedure documented for this type. Manual lookup required.)';
}

async function main() {
  if (await checkBackoff({ routine: ROUTINE_ID })) {
    console.error(`Routine ${ROUTINE_ID} at backoff threshold. Exiting.`);
    process.exit(0);
  }

  const start = Date.now();
  try {
    let markdown;
    try {
      markdown = await fs.readFile(ROTATION_FILE, 'utf8');
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.error(`Missing ${ROTATION_FILE}. Create from spec P4.2 first.`);
        await appendRun({
          routine: ROUTINE_ID,
          routineVersion: ROUTINE_VERSION,
          site: null,
          durationSec: (Date.now() - start) / 1000,
          exit: 'failed',
          filesTouched: [],
          escalations: [`missing ${ROTATION_FILE}`],
        });
        process.exit(0);
      }
      throw err;
    }

    const rows = parseRotationTable(markdown);
    const due = findDueRotations(rows);
    const unfilled = rows.filter((r) => !r.filled);

    for (const row of due) {
      const status = row.overdue ? 'OVERDUE' : `due in ${row.days_until} day(s)`;
      await writeInboxItem({
        siteDir: PORTFOLIO_DIR,
        routine: ROUTINE_ID,
        routineVersion: ROUTINE_VERSION,
        topic: `rotation-${row.id}`,
        site: null,
        trigger: `Secret ${row.id} (${row.type}) rotation ${status}. Next rotation date: ${row.next_date}`,
        whatITried: `Parsed sites/_portfolio/secrets-rotation.md "Active secrets" table.\n\nSecret in question:\n  ID: ${row.id}\n  Service: ${row.service}\n  Location: ${row.location}\n  Type: ${row.type}\n  Last rotated: ${row.last_rotated}\n  Next rotation: ${row.next_rotation} (${status})\n  Notes: ${row.notes}`,
        whatINeed: `Manual rotation per type "${row.type}":\n\n${procedureFor(row.type)}\n\nAfter rotation:\n  - Update sites/_portfolio/secrets-rotation.md "Last rotated" + "Next rotation" columns.\n  - Resolve this _inbox item (move to _archive/ or delete).\n  - Verify via node scripts/test-api-auth.mjs.`,
        contextLinks: ['sites/_portfolio/secrets-rotation.md', 'scripts/test-api-auth.mjs'],
      });
    }

    if (unfilled.length > 0) {
      await writeInboxItem({
        siteDir: PORTFOLIO_DIR,
        routine: ROUTINE_ID,
        routineVersion: ROUTINE_VERSION,
        topic: 'rotation-stubs-unfilled',
        site: null,
        trigger: `${unfilled.length} secret(s) in rotation table have {TO FILL} placeholders`,
        whatITried: `Parsed sites/_portfolio/secrets-rotation.md "Active secrets" table.\n\nSecrets with {TO FILL} dates:\n${unfilled.map((u) => `  - ${u.id} (${u.type})`).join('\n')}`,
        whatINeed: `Fill the "Last rotated" + "Next rotation" columns for the above secrets. Best estimates are fine — the goal is establishing the rotation cadence, not perfect accuracy on date of first install. Use today's date for unknowns and set Next rotation per cadence (OAuth/SA-JSON quarterly, API keys annual, PATs 90d).`,
        contextLinks: ['sites/_portfolio/secrets-rotation.md'],
      });
    }

    await recordSuccess({ routine: ROUTINE_ID });
    await appendRun({
      routine: ROUTINE_ID,
      routineVersion: ROUTINE_VERSION,
      site: null,
      durationSec: (Date.now() - start) / 1000,
      exit: due.length > 0 || unfilled.length > 0 ? 'escalated' : 'shipped',
      filesTouched: [],
      escalations: [
        ...due.map((d) => `${d.id} ${d.overdue ? 'OVERDUE' : `due ${d.days_until}d`}`),
        ...(unfilled.length > 0 ? [`${unfilled.length} stubs unfilled`] : []),
      ],
    });

    console.log(
      `Checked ${rows.length} secrets. Due in ≤${WARNING_DAYS_AHEAD}d: ${due.length}. Unfilled stubs: ${unfilled.length}.`,
    );
  } catch (err) {
    await recordFailure({ routine: ROUTINE_ID });
    await appendRun({
      routine: ROUTINE_ID,
      routineVersion: ROUTINE_VERSION,
      site: null,
      durationSec: (Date.now() - start) / 1000,
      exit: 'failed',
      filesTouched: [],
      escalations: [err.message],
    });
    throw err;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
