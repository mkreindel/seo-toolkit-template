#!/usr/bin/env node
/**
 * scripts/archive-shipped-drafts.mjs
 *
 * P5.1 — local-only draft archival helper.
 *
 * sites/{site}/_drafts/ is gitignored; this script doesn't touch git, just
 * the local filesystem. It walks every draft folder per site, judges
 * "shipped" vs. "in progress" via heuristics, and either reports (default)
 * or moves shipped drafts to sites/{site}/_drafts/_archive/.
 *
 * Heuristics for "shipped":
 *   1. Folder name contains a date (YYYY-MM-DD) older than today's date
 *   2. Folder's contents match a slug in used-keywords.md
 *   3. Folder hasn't been modified in 14+ days
 *
 * Heuristics for "in progress" (keep):
 *   - Folder modified in last 7 days AND doesn't match a date pattern
 *   - Folder contains a meta.json with status != "published"
 *   - Folder is `homepage` (special — always in-progress)
 *
 * Modes:
 *   (default)   report only; no files moved
 *   --apply     move shipped drafts to _archive/
 *   --site=X    restrict to one site
 *   --dry-run   equivalent to default (alias for clarity)
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITES_DIR = path.resolve('sites');
const ARCHIVE_AGE_DAYS = 14;
const KEEP_AGE_DAYS = 7;
const SPECIAL_KEEP = ['homepage', '_archive'];

function parseArgs(argv) {
  const args = argv.slice(2);
  const apply = args.includes('--apply');
  const siteArg = args.find((a) => a.startsWith('--site='));
  const site = siteArg ? siteArg.split('=')[1] : null;
  return { apply, site };
}

async function fileAge(filePath) {
  const stat = await fs.stat(filePath);
  return (Date.now() - stat.mtimeMs) / (24 * 60 * 60 * 1000);
}

function looksDatedInName(name) {
  return /\d{4}-\d{2}-\d{2}/.test(name);
}

async function isInUsedKeywords(siteName, draftSlug) {
  try {
    const content = await fs.readFile(path.join(SITES_DIR, siteName, 'used-keywords.md'), 'utf8');
    return content.includes(draftSlug);
  } catch {
    return false;
  }
}

async function readMetaStatus(draftPath) {
  try {
    const meta = JSON.parse(await fs.readFile(path.join(draftPath, 'meta.json'), 'utf8'));
    return meta.status || null;
  } catch {
    return null;
  }
}

async function judgeDraft(siteName, draftPath, draftName) {
  if (SPECIAL_KEEP.includes(draftName)) {
    return { judgment: 'keep', reason: 'special-keep (homepage / _archive)' };
  }

  const ageDays = await fileAge(draftPath);
  const metaStatus = await readMetaStatus(draftPath);
  const inUsedKw = await isInUsedKeywords(siteName, draftName);
  const dated = looksDatedInName(draftName);

  if (metaStatus === 'published') {
    return { judgment: 'archive', reason: `meta.status=published`, ageDays };
  }
  if (metaStatus === 'staged' || metaStatus === 'draft') {
    return { judgment: 'keep', reason: `meta.status=${metaStatus}`, ageDays };
  }

  // Presence in used-keywords.md IS the "shipped" signal. The KEEP_AGE_DAYS
  // floor (7d) protects against in-progress refreshes that happen to match a
  // shipped slug — anything older than that AND in the tracker = safe to
  // archive.
  if (inUsedKw && ageDays >= KEEP_AGE_DAYS) {
    return { judgment: 'archive', reason: `found in used-keywords.md AND aged ${ageDays.toFixed(1)}d (≥${KEEP_AGE_DAYS}d)`, ageDays };
  }

  if (dated && ageDays >= ARCHIVE_AGE_DAYS) {
    return { judgment: 'archive', reason: `dated name AND aged ${ageDays.toFixed(1)}d`, ageDays };
  }

  if (ageDays < KEEP_AGE_DAYS) {
    return { judgment: 'keep', reason: `recently modified (${ageDays.toFixed(1)}d ago)`, ageDays };
  }

  // Stale + unclear — surface the specific signals so users know what's
  // missing rather than the previous misleading "not in used-keywords.md".
  const missingSignals = [];
  if (!metaStatus) missingSignals.push('no meta.json');
  if (!inUsedKw) missingSignals.push('not in used-keywords.md');
  if (!dated) missingSignals.push('no date in folder name');
  return {
    judgment: 'review',
    reason: `aged ${ageDays.toFixed(1)}d, no shipped signal (${missingSignals.join(', ')})`,
    ageDays,
  };
}

async function listSites() {
  return (await fs.readdir(SITES_DIR, { withFileTypes: true }))
    .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
    .map((d) => d.name);
}

async function listDrafts(siteName) {
  const draftsDir = path.join(SITES_DIR, siteName, '_drafts');
  try {
    const entries = await fs.readdir(draftsDir, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function archiveDraft(siteName, draftName) {
  const draftsDir = path.join(SITES_DIR, siteName, '_drafts');
  const src = path.join(draftsDir, draftName);
  const archiveDir = path.join(draftsDir, '_archive');
  await fs.mkdir(archiveDir, { recursive: true });
  const dest = path.join(archiveDir, draftName);
  await fs.rename(src, dest);
  return dest;
}

async function main() {
  const { apply, site: targetSite } = parseArgs(process.argv);
  const sites = targetSite ? [targetSite] : await listSites();

  const report = { archive: [], keep: [], review: [] };

  for (const site of sites) {
    const drafts = await listDrafts(site);
    for (const draft of drafts) {
      const draftPath = path.join(SITES_DIR, site, '_drafts', draft);
      const judgment = await judgeDraft(site, draftPath, draft);
      report[judgment.judgment].push({ site, draft, ...judgment });
    }
  }

  console.log(`\nDraft audit — ${apply ? 'APPLYING' : 'REPORT-ONLY (use --apply to move)'}\n`);
  console.log(`Found ${report.archive.length + report.keep.length + report.review.length} drafts across ${sites.length} site(s).\n`);

  if (report.archive.length) {
    console.log(`ARCHIVE (${report.archive.length}):`);
    for (const r of report.archive) {
      console.log(`  ${r.site}/${r.draft}  —  ${r.reason}`);
    }
  }
  if (report.review.length) {
    console.log(`\nREVIEW (${report.review.length}) — manually inspect; not auto-archived:`);
    for (const r of report.review) {
      console.log(`  ${r.site}/${r.draft}  —  ${r.reason}`);
    }
  }
  if (report.keep.length) {
    console.log(`\nKEEP (${report.keep.length}):`);
    for (const r of report.keep) {
      console.log(`  ${r.site}/${r.draft}  —  ${r.reason}`);
    }
  }

  if (apply) {
    console.log(`\nApplying archival of ${report.archive.length} drafts...`);
    for (const r of report.archive) {
      const dest = await archiveDraft(r.site, r.draft);
      console.log(`  moved: ${r.site}/${r.draft} -> ${path.relative(process.cwd(), dest)}`);
    }
    console.log(`\nDone. Re-run without --apply to see current state.`);
  } else {
    console.log(`\nRun with --apply to move ${report.archive.length} draft(s) to sites/{site}/_drafts/_archive/.`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
