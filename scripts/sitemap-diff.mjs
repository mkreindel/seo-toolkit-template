#!/usr/bin/env node
/**
 * scripts/sitemap-diff.mjs
 *
 * portfolio-daily-sitemap-regression cron (Q3).
 * Daily 07:00 CDT — fetches each site's live sitemap.xml + robots.txt,
 * diffs against sites/{site}/_baselines/, escalates to _inbox/ on any diff.
 *
 * Plan 2 Task D.1. routine_version: 1.0.
 */
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { appendRun, recordSuccess, recordFailure, checkBackoff } from './lib/audit-log.mjs';
import { writeInboxItem } from './lib/cron-mode.mjs';
import { parseSitemap, diffSitemaps } from './lib/sitemap.mjs';

const ROUTINE_VERSION = '1.0';
const ROUTINE_ID = 'portfolio-daily-sitemap-regression';
const SITES_DIR = path.resolve('sites');

async function checkSite(siteName) {
  const siteDir = path.join(SITES_DIR, siteName);
  const baselineSitemapPath = path.join(siteDir, '_baselines', 'sitemap.xml');
  const baselineRobotsPath = path.join(siteDir, '_baselines', 'robots.txt');

  // Read site URL from site-info.md
  const siteInfo = await fs.readFile(path.join(siteDir, 'site-info.md'), 'utf8');
  const urlMatch = siteInfo.match(/^- \*\*URL:\*\*\s*(https:\/\/[^\s✅]+)/m);
  if (!urlMatch) throw new Error(`No URL found in ${siteName}/site-info.md`);
  const siteUrl = urlMatch[1].replace(/\/$/, '');

  // Fetch live
  const [sitemapRes, robotsRes] = await Promise.all([
    fetch(`${siteUrl}/sitemap.xml`),
    fetch(`${siteUrl}/robots.txt`),
  ]);
  if (!sitemapRes.ok) return { site: siteName, error: `sitemap fetch ${sitemapRes.status}` };
  if (!robotsRes.ok) return { site: siteName, error: `robots fetch ${robotsRes.status}` };
  const currentSitemapXml = await sitemapRes.text();
  const currentRobotsText = await robotsRes.text();

  // Diff sitemap
  const baselineSitemapXml = await fs.readFile(baselineSitemapPath, 'utf8');
  const [baselineUrls, currentUrls] = await Promise.all([
    parseSitemap(baselineSitemapXml),
    parseSitemap(currentSitemapXml),
  ]);
  const sitemapDiff = diffSitemaps(baselineUrls, currentUrls);

  // Diff robots.txt
  const baselineRobots = await fs.readFile(baselineRobotsPath, 'utf8');
  const robotsChanged = baselineRobots.trim() !== currentRobotsText.trim();

  const issues = [];
  if (sitemapDiff.added.length || sitemapDiff.removed.length) {
    issues.push(`sitemap: +${sitemapDiff.added.length} -${sitemapDiff.removed.length}`);
  }
  if (robotsChanged) issues.push('robots.txt changed');

  if (issues.length) {
    await writeInboxItem({
      siteDir,
      routine: ROUTINE_ID,
      routineVersion: ROUTINE_VERSION,
      topic: 'sitemap-regression',
      site: siteName,
      trigger: issues.join('; '),
      whatITried: `Fetched live ${siteUrl}/sitemap.xml + /robots.txt. Compared against sites/${siteName}/_baselines/.\nAdded URLs: ${sitemapDiff.added.join(', ') || '(none)'}\nRemoved URLs: ${sitemapDiff.removed.join(', ') || '(none)'}\nrobots.txt changed: ${robotsChanged}`,
      whatINeed: `Decide: (a) accept the change as intentional (new page shipped via /blog or /service) — refresh the baseline by overwriting sites/${siteName}/_baselines/ with the current files; (b) investigate whether the change is unexpected (Lovable autoedit, manual edit, regression) before deciding.`,
      suggestedAction:
        sitemapDiff.removed.length > 0
          ? 'URLs removed unexpectedly — investigate BEFORE accepting baseline.'
          : 'URLs added — likely a new page shipped; verify and refresh baseline.',
      contextLinks: [
        `sites/${siteName}/_baselines/sitemap.xml`,
        `sites/${siteName}/_baselines/robots.txt`,
        `${siteUrl}/sitemap.xml`,
      ],
    });
    return { site: siteName, escalated: true, issues };
  }

  return { site: siteName, escalated: false };
}

async function main() {
  if (await checkBackoff({ routine: ROUTINE_ID })) {
    console.error(`Routine ${ROUTINE_ID} at backoff threshold. Exiting.`);
    process.exit(0);
  }

  const start = Date.now();
  try {
    const sites = (await fs.readdir(SITES_DIR, { withFileTypes: true }))
      .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
      .map((d) => d.name);

    const results = [];
    for (const site of sites) {
      results.push(await checkSite(site));
    }
    const escalations = results
      .filter((r) => r.escalated)
      .map((r) => `${r.site}: ${r.issues.join('; ')}`);
    const errors = results.filter((r) => r.error).map((r) => `${r.site}: ${r.error}`);

    if (escalations.length === 0 && errors.length === 0) {
      await recordSuccess({ routine: ROUTINE_ID });
    } else {
      await recordFailure({ routine: ROUTINE_ID });
    }

    await appendRun({
      routine: ROUTINE_ID,
      routineVersion: ROUTINE_VERSION,
      site: null,
      durationSec: (Date.now() - start) / 1000,
      exit: escalations.length === 0 && errors.length === 0 ? 'shipped' : 'escalated',
      filesTouched: [],
      escalations: [...escalations, ...errors],
    });

    console.log(`Checked ${sites.length} sites. Escalations: ${escalations.length}. Errors: ${errors.length}.`);
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
