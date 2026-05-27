#!/usr/bin/env node
/**
 * scripts/daily-digest.mjs
 *
 * portfolio-daily-digest-email cron.
 * Daily 07:47 CDT — reads _audit-log/runs.jsonl entries from the last 24 hours,
 * builds a summary, POSTs to Make.com webhook (which relays to Gmail).
 *
 * Plan 3 follow-up: email visibility into cruise-control operations.
 * routine_version: 1.0.
 */
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { appendRun, recordSuccess, recordFailure, checkBackoff } from './lib/audit-log.mjs';

const ROUTINE_VERSION = '1.0';
const ROUTINE_ID = 'portfolio-daily-digest-email';
const SITES_DIR = path.resolve('sites');
const AUDIT_LOG = path.resolve('_audit-log/runs.jsonl');

/**
 * Read the past 24 hours of runs from the audit log.
 */
async function readRecentRuns() {
  let content;
  try {
    content = await fs.readFile(AUDIT_LOG, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return content
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter((entry) => entry && new Date(entry.ts).getTime() >= cutoff);
}

/**
 * Count open _inbox items across all sites.
 */
async function countOpenInboxItems() {
  const sites = (await fs.readdir(SITES_DIR, { withFileTypes: true }))
    .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
    .map((d) => d.name);

  const open = [];
  for (const site of sites) {
    const inboxDir = path.join(SITES_DIR, site, '_inbox');
    let entries;
    try {
      entries = await fs.readdir(inboxDir);
    } catch (err) {
      if (err.code === 'ENOENT') continue;
      throw err;
    }
    for (const filename of entries) {
      if (filename === 'README.md' || !filename.endsWith('.md')) continue;
      const filepath = path.join(inboxDir, filename);
      const content = await fs.readFile(filepath, 'utf8');
      if (/\*\*Status:\*\*\s*OPEN/.test(content)) {
        open.push({ site, filename, filepath });
      }
    }
  }
  return open;
}

/**
 * Find pending Lovable deploys across all sites.
 * These are queued by cron-fired drafters (or any process) that wrote a Lovable-ready
 * prompt to _drafts/ but cannot drive the user's local Chrome to publish it.
 * Format: sites/{site}/_inbox/lovable-deploy-pending-{slug}-{YYYY-MM-DD}.md
 */
async function countPendingLovableDeploys() {
  const sites = (await fs.readdir(SITES_DIR, { withFileTypes: true }))
    .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
    .map((d) => d.name);

  const pending = [];
  for (const site of sites) {
    const inboxDir = path.join(SITES_DIR, site, '_inbox');
    let entries;
    try {
      entries = await fs.readdir(inboxDir);
    } catch (err) {
      if (err.code === 'ENOENT') continue;
      throw err;
    }
    for (const filename of entries) {
      if (!filename.startsWith('lovable-deploy-pending-') || !filename.endsWith('.md')) continue;
      const fullPath = path.join(inboxDir, filename);
      const stat = await fs.stat(fullPath);
      const ageDays = Math.floor((Date.now() - stat.mtime.getTime()) / (24 * 60 * 60 * 1000));
      // Extract slug from filename: lovable-deploy-pending-{slug}-{YYYY-MM-DD}.md
      const match = filename.match(/^lovable-deploy-pending-(.+)-\d{4}-\d{2}-\d{2}\.md$/);
      const slug = match ? match[1] : filename.replace(/^lovable-deploy-pending-/, '').replace(/\.md$/, '');
      pending.push({ site, slug, filename, ageDays });
    }
  }
  return pending;
}

/**
 * Count drafts pending review across all sites.
 */
async function countDraftsPending() {
  const sites = (await fs.readdir(SITES_DIR, { withFileTypes: true }))
    .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
    .map((d) => d.name);

  const drafts = [];
  for (const site of sites) {
    const draftsDir = path.join(SITES_DIR, site, '_drafts');
    let entries;
    try {
      entries = await fs.readdir(draftsDir, { withFileTypes: true });
    } catch (err) {
      if (err.code === 'ENOENT') continue;
      throw err;
    }
    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('_') && entry.name !== '.gitkeep') {
        const fullPath = path.join(draftsDir, entry.name);
        const stat = await fs.stat(fullPath);
        drafts.push({
          site,
          name: entry.name,
          ageDays: Math.floor((Date.now() - stat.mtime.getTime()) / (24 * 60 * 60 * 1000)),
        });
      }
    }
  }
  return drafts;
}

export function buildDigest(runs, openInbox, draftsPending, pendingLovableDeploys = []) {
  const ts = new Date().toISOString();
  const today = ts.slice(0, 10);

  const shipped = runs.filter((r) => r.exit === 'shipped').length;
  const escalated = runs.filter((r) => r.exit === 'escalated').length;
  const idempotentSkip = runs.filter((r) => r.exit === 'idempotent-skip').length;
  const failed = runs.filter((r) => r.exit === 'failed').length;

  const byRoutine = runs
    .sort((a, b) => a.ts.localeCompare(b.ts))
    .map((r) => {
      const time = new Date(r.ts).toISOString().slice(11, 19);
      const site = r.site ? ` [${r.site}]` : '';
      const dur = r.duration_sec != null ? ` ${r.duration_sec.toFixed(1)}s` : '';
      const escMarker =
        r.escalations && r.escalations.length ? ` — ${r.escalations.length} escalation(s)` : '';
      return `  • ${time} UTC  ${r.routine}${site} → ${r.exit}${dur}${escMarker}`;
    })
    .join('\n');

  const escalationDetails = runs
    .filter((r) => r.escalations && r.escalations.length)
    .map((r) => {
      return `  ${r.routine}:\n${r.escalations.map((e) => `    - ${e}`).join('\n')}`;
    })
    .join('\n');

  const inboxSummary = openInbox.length
    ? openInbox.map((i) => `  - ${i.filepath.replace(process.cwd() + '/', '')}`).join('\n')
    : '  (none)';

  const draftsSummary = draftsPending.length
    ? draftsPending
        .sort((a, b) => b.ageDays - a.ageDays)
        .map((d) => {
          const flag = d.ageDays > 7 ? ' ⚠️ aging' : '';
          return `  - sites/${d.site}/_drafts/${d.name}/ (${d.ageDays}d old)${flag}`;
        })
        .join('\n')
    : '  (none)';

  const lovablePendingSummary = pendingLovableDeploys.length
    ? pendingLovableDeploys
        .sort((a, b) => b.ageDays - a.ageDays)
        .map((p) => {
          const flag = p.ageDays > 3 ? ' ⚠️ aging' : '';
          return `  - /lovable-deploy ${p.site} ${p.slug}  (${p.ageDays}d old${flag})`;
        })
        .join('\n')
    : '  (none)';

  const subject = `[cruise-control] ${today} — ${shipped} shipped, ${escalated} escalated, ${failed} failed${pendingLovableDeploys.length ? `, ${pendingLovableDeploys.length} Lovable deploy(s) pending` : ''}`;

  const body = `SEO toolkit cruise-control daily digest — ${today}

Past 24 hours: ${runs.length} cron firings
  ✅ ${shipped} shipped
  ⚠️ ${escalated} escalated to _inbox/
  ⏭️ ${idempotentSkip} idempotent-skip (no work to do)
  ❌ ${failed} failed

By routine (chronological):
${byRoutine || '  (no runs yet — first cron firings imminent)'}

${escalationDetails ? `Escalation details:\n${escalationDetails}\n\n` : ''}Open _inbox items across all sites (${openInbox.length}):
${inboxSummary}

Pending Lovable deploys (${pendingLovableDeploys.length}) — run from local Claude session to ship:
${lovablePendingSummary}

Drafts pending review (${draftsPending.length}):
${draftsSummary}

— end of digest, generated ${ts}
`;

  return { subject, body, summary: { shipped, escalated, idempotentSkip, failed, total: runs.length } };
}

async function main() {
  if (await checkBackoff({ routine: ROUTINE_ID })) {
    console.error(`Routine ${ROUTINE_ID} at backoff threshold. Exiting.`);
    process.exit(0);
  }

  const start = Date.now();

  const webhookUrl = process.env.CRUISE_CONTROL_WEBHOOK_URL;
  if (!webhookUrl) {
    await appendRun({
      routine: ROUTINE_ID,
      routineVersion: ROUTINE_VERSION,
      site: null,
      durationSec: (Date.now() - start) / 1000,
      exit: 'idempotent-skip',
      filesTouched: [],
      escalations: ['CRUISE_CONTROL_WEBHOOK_URL not set in .env (digest dry-run only)'],
    });
    // Still print the digest to stdout so dry-runs are useful
    const runs = await readRecentRuns();
    const openInbox = await countOpenInboxItems();
    const draftsPending = await countDraftsPending();
    const pendingLovableDeploys = await countPendingLovableDeploys();
    const { subject, body } = buildDigest(runs, openInbox, draftsPending, pendingLovableDeploys);
    console.log(`DRY RUN (no webhook configured) — would send email:\n\nSubject: ${subject}\n\n${body}`);
    return;
  }

  try {
    const [runs, openInbox, draftsPending, pendingLovableDeploys] = await Promise.all([
      readRecentRuns(),
      countOpenInboxItems(),
      countDraftsPending(),
      countPendingLovableDeploys(),
    ]);

    const { subject, body, summary } = buildDigest(runs, openInbox, draftsPending, pendingLovableDeploys);

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, body, summary }),
    });

    if (!res.ok) {
      throw new Error(`Webhook HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }

    await recordSuccess({ routine: ROUTINE_ID });
    await appendRun({
      routine: ROUTINE_ID,
      routineVersion: ROUTINE_VERSION,
      site: null,
      durationSec: (Date.now() - start) / 1000,
      exit: 'shipped',
      filesTouched: [],
      escalations: [],
    });

    console.log(`Digest sent (${runs.length} runs, ${openInbox.length} open inbox, ${draftsPending.length} drafts).`);
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

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || '')) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
