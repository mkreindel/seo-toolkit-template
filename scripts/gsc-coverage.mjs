#!/usr/bin/env node
/**
 * scripts/gsc-coverage.mjs
 *
 * portfolio-weekly-gsc-coverage cron (Q4).
 * Mon 08:30 CDT — pulls indexation status per site from GSC API,
 * escalates on > 5% coverage drop vs baseline.
 *
 * Plan 2 Task D.2. routine_version: 1.0.
 */
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { google } from 'googleapis';
import { appendRun, recordSuccess, recordFailure, checkBackoff } from './lib/audit-log.mjs';
import { writeInboxItem } from './lib/cron-mode.mjs';

const ROUTINE_VERSION = '1.0';
const ROUTINE_ID = 'portfolio-weekly-gsc-coverage';
const SITES_DIR = path.resolve('sites');

/**
 * Pure-function: returns true if the indexation rate dropped by more than `threshold` (as fraction).
 */
export function detectCoverageDrop(baseline, current, threshold = 0.05) {
  if (!baseline.indexed || baseline.indexed === 0) return false;
  if (!baseline.submitted || !current.submitted) return false;
  const baselineRate = baseline.indexed / baseline.submitted;
  const currentRate = current.indexed / current.submitted;
  return baselineRate - currentRate > threshold;
}

async function getGscAuth() {
  const oauth2 = new google.auth.OAuth2(
    process.env.GSC_OAUTH_CLIENT_ID,
    process.env.GSC_OAUTH_CLIENT_SECRET,
  );
  oauth2.setCredentials({ refresh_token: process.env.GSC_OAUTH_REFRESH_TOKEN });
  return oauth2;
}

async function pullCoverageForSite(siteName, auth) {
  const siteInfo = await fs.readFile(path.join(SITES_DIR, siteName, 'site-info.md'), 'utf8');
  // Look for sc-domain:* or a URL-prefix property reference
  const domainMatch = siteInfo.match(/sc-domain:(\S+)/);
  const property = domainMatch ? `sc-domain:${domainMatch[1].replace(/[)`]/g, '')}` : null;
  if (!property) return { siteName, skipped: 'no GSC sc-domain property found in site-info.md' };

  const webmasters = google.webmasters({ version: 'v3', auth });
  try {
    const sitemaps = await webmasters.sitemaps.list({ siteUrl: property });
    const sitemap = sitemaps.data.sitemap?.[0];
    if (!sitemap) return { siteName, skipped: 'no sitemap submitted to GSC' };

    const submitted = parseInt(sitemap.contents?.[0]?.submitted || '0', 10);
    const indexed = parseInt(sitemap.contents?.[0]?.indexed || '0', 10);

    return {
      siteName,
      property,
      submitted,
      indexed,
      lastDownloaded: sitemap.lastDownloaded,
    };
  } catch (err) {
    return { siteName, error: err.message };
  }
}

async function main() {
  if (await checkBackoff({ routine: ROUTINE_ID })) {
    console.error(`Routine ${ROUTINE_ID} at backoff threshold. Exiting.`);
    process.exit(0);
  }

  const start = Date.now();
  try {
    const auth = await getGscAuth();
    const sites = (await fs.readdir(SITES_DIR, { withFileTypes: true }))
      .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
      .map((d) => d.name);

    const escalations = [];
    const filesTouched = [];
    for (const site of sites) {
      const current = await pullCoverageForSite(site, auth);
      if (current.skipped) continue;
      if (current.error) {
        escalations.push(`${site}: ${current.error}`);
        continue;
      }

      const baselinePath = path.join(SITES_DIR, site, '_baselines', 'gsc-coverage.json');
      let baseline = null;
      try {
        baseline = JSON.parse(await fs.readFile(baselinePath, 'utf8'));
      } catch (err) {
        if (err.code === 'ENOENT') {
          // First run — establish baseline
          await fs.writeFile(baselinePath, JSON.stringify(current, null, 2));
          filesTouched.push(baselinePath);
          continue;
        }
        throw err;
      }

      if (detectCoverageDrop(baseline, current, 0.05)) {
        const baselineRate = ((baseline.indexed / baseline.submitted) * 100).toFixed(1);
        const currentRate = ((current.indexed / current.submitted) * 100).toFixed(1);
        await writeInboxItem({
          siteDir: path.join(SITES_DIR, site),
          routine: ROUTINE_ID,
          routineVersion: ROUTINE_VERSION,
          topic: 'gsc-coverage-drop',
          site,
          trigger: `Indexation rate dropped from ${baselineRate}% to ${currentRate}%`,
          whatITried: `Pulled GSC sitemap status for ${current.property}; compared submitted (${baseline.submitted}→${current.submitted}) and indexed (${baseline.indexed}→${current.indexed}) against baseline.`,
          whatINeed: `Investigate which URLs got de-indexed and why. Common causes: noindex header added by mistake, canonicalization regression, 404s on previously-good URLs.`,
          contextLinks: [
            `https://search.google.com/search-console?resource_id=${encodeURIComponent(current.property)}`,
            `sites/${site}/_baselines/gsc-coverage.json`,
          ],
        });
        escalations.push(`${site}: ${baselineRate}% → ${currentRate}%`);
      }
    }

    if (escalations.length === 0) await recordSuccess({ routine: ROUTINE_ID });
    else await recordFailure({ routine: ROUTINE_ID });

    await appendRun({
      routine: ROUTINE_ID,
      routineVersion: ROUTINE_VERSION,
      site: null,
      durationSec: (Date.now() - start) / 1000,
      exit: escalations.length === 0 ? 'shipped' : 'escalated',
      filesTouched,
      escalations,
    });

    console.log(`Pulled coverage for ${sites.length} sites. Escalations: ${escalations.length}. Baselines created: ${filesTouched.length}.`);
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
