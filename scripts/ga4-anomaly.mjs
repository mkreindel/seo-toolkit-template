#!/usr/bin/env node
/**
 * scripts/ga4-anomaly.mjs
 *
 * portfolio-weekly-ga4-anomaly cron (Q11).
 * Mon 09:00 CDT — pulls 7-day session totals from GA4 Data API per site,
 * compares to prior 7 days, escalates on > 25% deviation either direction.
 *
 * SKIP-MODE: if GA4 service account hasn't been granted property access
 * (Phase 0 Task 0.5 deferred per inbox), exits cleanly with idempotent-skip.
 *
 * Plan 3 Task E.4. routine_version: 1.0.
 */
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { appendRun, recordSuccess, recordFailure, checkBackoff } from './lib/audit-log.mjs';
import { writeInboxItem } from './lib/cron-mode.mjs';

const ROUTINE_VERSION = '1.0';
const ROUTINE_ID = 'portfolio-weekly-ga4-anomaly';
const SITES_DIR = path.resolve('sites');

/**
 * Pure-function: returns true when current 7-day sessions deviate from
 * baseline 7-day sessions by more than threshold (fraction).
 */
export function detectTrafficAnomaly(baseline, current, threshold = 0.25) {
  if (!baseline || baseline === 0) return false;
  const deviation = Math.abs(current - baseline) / baseline;
  return deviation > threshold;
}

async function pullGa4ForSite(siteName, client) {
  const siteInfo = await fs.readFile(path.join(SITES_DIR, siteName, 'site-info.md'), 'utf8');
  // Match GA4 property ID — typically a 9-digit number
  const propertyMatch = siteInfo.match(/property ID:?\s*`?(\d{6,11})`?/i);
  if (!propertyMatch) return { siteName, skipped: 'no GA4 property ID in site-info.md' };
  const propertyId = propertyMatch[1];

  try {
    const [resp] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        { startDate: '14daysAgo', endDate: '8daysAgo' }, // baseline week
        { startDate: '7daysAgo', endDate: 'today' }, // current week
      ],
      metrics: [{ name: 'sessions' }],
    });
    const baseline = parseInt(resp.rows?.[0]?.metricValues?.[0]?.value || '0', 10);
    const current = parseInt(resp.rows?.[1]?.metricValues?.[0]?.value || '0', 10);
    return { siteName, propertyId, baseline, current };
  } catch (err) {
    if (err.code === 7 || err.message?.includes('PERMISSION_DENIED')) {
      return { siteName, skipped: 'GA4 PERMISSION_DENIED (service account not yet granted)' };
    }
    return { siteName, error: err.message };
  }
}

async function main() {
  if (await checkBackoff({ routine: ROUTINE_ID })) {
    console.error(`Routine ${ROUTINE_ID} at backoff threshold. Exiting.`);
    process.exit(0);
  }

  const start = Date.now();

  // Skip-mode: GA4 service account JSON path missing
  if (!process.env.GA4_SERVICE_ACCOUNT_JSON_PATH) {
    await appendRun({
      routine: ROUTINE_ID,
      routineVersion: ROUTINE_VERSION,
      site: null,
      durationSec: (Date.now() - start) / 1000,
      exit: 'idempotent-skip',
      filesTouched: [],
      escalations: ['GA4_SERVICE_ACCOUNT_JSON_PATH not set'],
    });
    console.log('GA4 service account not configured — skipping cleanly.');
    return;
  }

  try {
    const keyPath = process.env.GA4_SERVICE_ACCOUNT_JSON_PATH;
    const exists = await fs.stat(keyPath).catch(() => false);
    if (!exists) {
      await appendRun({
        routine: ROUTINE_ID,
        routineVersion: ROUTINE_VERSION,
        site: null,
        durationSec: (Date.now() - start) / 1000,
        exit: 'idempotent-skip',
        filesTouched: [],
        escalations: [`Service account JSON not found at ${keyPath}`],
      });
      console.log(`Service account JSON not found at ${keyPath} — skipping cleanly.`);
      return;
    }

    const client = new BetaAnalyticsDataClient({ keyFilename: keyPath });

    const sites = (await fs.readdir(SITES_DIR, { withFileTypes: true }))
      .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
      .map((d) => d.name);

    const escalations = [];
    let skipCount = 0;
    for (const site of sites) {
      const result = await pullGa4ForSite(site, client);
      if (result.skipped) {
        skipCount++;
        continue;
      }
      if (result.error) {
        escalations.push(`${site}: ${result.error}`);
        continue;
      }

      if (detectTrafficAnomaly(result.baseline, result.current, 0.25)) {
        const direction = result.current > result.baseline ? 'spike' : 'drop';
        const pct = (((result.current - result.baseline) / result.baseline) * 100).toFixed(1);
        await writeInboxItem({
          siteDir: path.join(SITES_DIR, site),
          routine: ROUTINE_ID,
          routineVersion: ROUTINE_VERSION,
          topic: `traffic-${direction}`,
          site,
          trigger: `Sessions ${direction}: ${result.baseline} → ${result.current} (${pct}%)`,
          whatITried: `Pulled GA4 Data API for property ${result.propertyId}. Compared sessions in last 7 days (${result.current}) vs prior 7 days (${result.baseline}). Deviation exceeds 25% threshold.`,
          whatINeed: `Investigate cause. Drops: indexation issue, manual penalty, server outage, seasonal shift. Spikes: PR mention, social viral, spam bot traffic. Cross-reference with GSC + GA4 acquisition + landing-page reports.`,
          contextLinks: [`https://analytics.google.com/ (property ${result.propertyId})`],
        });
        escalations.push(`${site}: ${direction} (${pct}%)`);
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
      filesTouched: [],
      escalations,
    });

    console.log(`Polled GA4 for ${sites.length} sites. Skipped: ${skipCount}. Escalations: ${escalations.length}.`);
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
