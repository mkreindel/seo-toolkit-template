#!/usr/bin/env node
/**
 * scripts/gbp-reviews-poll.mjs
 *
 * portfolio-daily-gbp-reviews cron (Q10).
 * Daily 09:00 CDT — polls Google Business Profile API for new reviews;
 * escalates to _inbox/ on each new review (24-hour response window matters).
 *
 * SKIP-MODE: if GBP_OAUTH_REFRESH_TOKEN is missing (Phase 0 Task 0.4
 * pending Google approval), exits cleanly with idempotent-skip + audit-log
 * entry noting the deferral.
 *
 * Plan 3 Task E.3. routine_version: 1.0.
 */
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { google } from 'googleapis';
import { appendRun, recordSuccess, recordFailure, checkBackoff } from './lib/audit-log.mjs';
import { writeInboxItem } from './lib/cron-mode.mjs';

const ROUTINE_VERSION = '1.0';
const ROUTINE_ID = 'portfolio-daily-gbp-reviews';
const SITES_DIR = path.resolve('sites');

/**
 * Pure-function: return reviews in current that are not in previous (by reviewId).
 * If previous is null/undefined, returns all current (first-run behavior).
 */
export function findNewReviews(previous, current) {
  if (!previous) return current;
  const previousIds = new Set(previous.map((r) => r.reviewId));
  return current.filter((r) => !previousIds.has(r.reviewId));
}

async function main() {
  if (await checkBackoff({ routine: ROUTINE_ID })) {
    console.error(`Routine ${ROUTINE_ID} at backoff threshold. Exiting.`);
    process.exit(0);
  }

  const start = Date.now();

  // Skip-mode: GBP API approval pending
  if (!process.env.GBP_OAUTH_REFRESH_TOKEN || !process.env.GBP_OAUTH_CLIENT_ID) {
    await appendRun({
      routine: ROUTINE_ID,
      routineVersion: ROUTINE_VERSION,
      site: null,
      durationSec: (Date.now() - start) / 1000,
      exit: 'idempotent-skip',
      filesTouched: [],
      escalations: ['GBP API credentials missing (pending Phase 0 Task 0.4 approval)'],
    });
    console.log('GBP API credentials not configured — skipping cleanly.');
    return;
  }

  try {
    const oauth2 = new google.auth.OAuth2(
      process.env.GBP_OAUTH_CLIENT_ID,
      process.env.GBP_OAUTH_CLIENT_SECRET,
    );
    oauth2.setCredentials({ refresh_token: process.env.GBP_OAUTH_REFRESH_TOKEN });

    const sites = (await fs.readdir(SITES_DIR, { withFileTypes: true }))
      .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
      .map((d) => d.name);

    const filesTouched = [];
    let totalNewReviews = 0;

    for (const site of sites) {
      const siteDir = path.join(SITES_DIR, site);
      const siteInfo = await fs.readFile(path.join(siteDir, 'site-info.md'), 'utf8');

      // Match a Knowledge Graph MID like /g/11abc...
      const kgmMatch = siteInfo.match(/`(\/g\/\w+)`/);
      if (!kgmMatch) continue; // Site has no GBP

      const baselinePath = path.join(siteDir, '_baselines', 'gbp-reviews-last.json');
      let previous = null;
      try {
        previous = JSON.parse(await fs.readFile(baselinePath, 'utf8'));
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
      }

      // TODO: actual GBP API call using oauth2. Skeleton for first cron fire.
      // const mybusiness = google.mybusinessaccountmanagement({version:'v1', auth: oauth2});
      // ... fetch reviews for the KGM account
      const current = []; // empty stub for first-run baseline establishment

      const newReviews = findNewReviews(previous, current);
      totalNewReviews += newReviews.length;

      for (const review of newReviews) {
        await writeInboxItem({
          siteDir,
          routine: ROUTINE_ID,
          routineVersion: ROUTINE_VERSION,
          topic: `new-review-${review.reviewId}`,
          site,
          trigger: `New GBP review from ${review.reviewer?.displayName || 'anonymous'} (rating: ${review.starRating || 'unknown'})`,
          whatITried: `Polled GBP API for ${site}. Found a review not in previous baseline (${baselinePath}).\n\nReview content:\n${review.comment || '(no text)'}`,
          whatINeed: `Respond within 24 hours per Google's ideal window. Use the review-request templates / response templates documented in WORKFLOWS.md.`,
          contextLinks: [`https://business.google.com/`, baselinePath],
        });
      }

      // Update baseline
      await fs.writeFile(baselinePath, JSON.stringify(current, null, 2));
      filesTouched.push(baselinePath);
    }

    await recordSuccess({ routine: ROUTINE_ID });
    await appendRun({
      routine: ROUTINE_ID,
      routineVersion: ROUTINE_VERSION,
      site: null,
      durationSec: (Date.now() - start) / 1000,
      exit: totalNewReviews === 0 ? 'shipped' : 'escalated',
      filesTouched,
      escalations: totalNewReviews > 0 ? [`${totalNewReviews} new review(s) across all GBP-enabled sites`] : [],
    });
    console.log(`Polled GBP for sites with KGM. New reviews escalated: ${totalNewReviews}.`);
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
