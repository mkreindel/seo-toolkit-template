#!/usr/bin/env node
/**
 * scripts/crux-poll.mjs
 *
 * portfolio-weekly-crux-cwv cron (Q5).
 * Mon 08:45 CDT — polls PageSpeed Insights API for CrUX field data per site;
 * escalates when LCP > 2500ms, INP > 200ms, or CLS > 0.1 (Google's "Good" thresholds).
 *
 * Plan 2 Task D.3. routine_version: 1.0.
 */
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { appendRun, recordSuccess, recordFailure, checkBackoff } from './lib/audit-log.mjs';
import { writeInboxItem } from './lib/cron-mode.mjs';

const ROUTINE_VERSION = '1.0';
const ROUTINE_ID = 'portfolio-weekly-crux-cwv';
const SITES_DIR = path.resolve('sites');

const THRESHOLDS = { lcp: 2500, inp: 200, cls: 0.1 };

/**
 * Pure-function: returns array of issue descriptions for metrics that crossed
 * the "Good" threshold (baseline was within, current is over).
 */
export function detectCwvRegression(baseline, current) {
  const issues = [];
  if (current.lcp > THRESHOLDS.lcp && baseline.lcp <= THRESHOLDS.lcp) {
    issues.push(`LCP crossed 2.5s threshold (${baseline.lcp}ms → ${current.lcp}ms)`);
  }
  if (current.inp > THRESHOLDS.inp && baseline.inp <= THRESHOLDS.inp) {
    issues.push(`INP crossed 200ms threshold (${baseline.inp}ms → ${current.inp}ms)`);
  }
  if (current.cls > THRESHOLDS.cls && baseline.cls <= THRESHOLDS.cls) {
    issues.push(`CLS crossed 0.1 threshold (${baseline.cls} → ${current.cls})`);
  }
  return issues;
}

async function pullCruxForSite(siteName) {
  const siteInfo = await fs.readFile(path.join(SITES_DIR, siteName, 'site-info.md'), 'utf8');
  const urlMatch = siteInfo.match(/^- \*\*URL:\*\*\s*(https:\/\/[^\s✅]+)/m);
  if (!urlMatch) return { siteName, skipped: 'no URL in site-info.md' };
  const url = urlMatch[1].replace(/\/$/, '');

  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
  if (!apiKey) return { siteName, error: 'GOOGLE_PAGESPEED_API_KEY not set' };

  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&strategy=mobile`;
  const res = await fetch(apiUrl);
  if (!res.ok) {
    return { siteName, error: `PageSpeed HTTP ${res.status}` };
  }
  const data = await res.json();

  // Prefer field data (CrUX); fall back to lab if site has no real-user data yet
  const field = data.loadingExperience?.metrics;
  const lab = data.lighthouseResult?.audits;

  const lcpField = field?.LARGEST_CONTENTFUL_PAINT_MS?.percentile;
  const inpField = field?.INTERACTION_TO_NEXT_PAINT?.percentile;
  const clsField = field?.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile;

  const useField = lcpField !== undefined;
  return {
    siteName,
    source: useField ? 'field' : 'lab',
    lcp: useField ? lcpField : Math.round(lab?.['largest-contentful-paint']?.numericValue || 0),
    inp: useField ? inpField : Math.round(lab?.['interactive']?.numericValue || 0),
    cls: useField ? clsField / 100 : lab?.['cumulative-layout-shift']?.numericValue || 0,
  };
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

    const escalations = [];
    const filesTouched = [];
    for (const site of sites) {
      const current = await pullCruxForSite(site);
      if (current.skipped) continue;
      if (current.error) {
        escalations.push(`${site}: ${current.error}`);
        continue;
      }

      const baselinePath = path.join(SITES_DIR, site, '_baselines', 'crux.json');
      let baseline = null;
      try {
        baseline = JSON.parse(await fs.readFile(baselinePath, 'utf8'));
      } catch (err) {
        if (err.code === 'ENOENT') {
          await fs.writeFile(baselinePath, JSON.stringify(current, null, 2));
          filesTouched.push(baselinePath);
          continue;
        }
        throw err;
      }

      const issues = detectCwvRegression(baseline, current);
      if (issues.length) {
        await writeInboxItem({
          siteDir: path.join(SITES_DIR, site),
          routine: ROUTINE_ID,
          routineVersion: ROUTINE_VERSION,
          topic: 'cwv-regression',
          site,
          trigger: issues.join('; '),
          whatITried: `Pulled PageSpeed Insights API (${current.source} data) for ${site}. Compared LCP/INP/CLS against sites/${site}/_baselines/crux.json.\nBaseline: LCP=${baseline.lcp}ms INP=${baseline.inp}ms CLS=${baseline.cls}\nCurrent:  LCP=${current.lcp}ms INP=${current.inp}ms CLS=${current.cls}`,
          whatINeed: `Investigate which page(s) regressed. Common causes: hero image regression, JS bundle bloat, third-party script added, font swap, layout shifts from new content. Once fixed, refresh baseline.`,
          contextLinks: [
            `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(site)}`,
            `sites/${site}/_baselines/crux.json`,
            `sites/${site}/tech-debt.md`,
          ],
        });
        escalations.push(`${site}: ${issues.join(', ')}`);
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

    console.log(`Polled CrUX for ${sites.length} sites. Escalations: ${escalations.length}. Baselines created: ${filesTouched.length}.`);
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
