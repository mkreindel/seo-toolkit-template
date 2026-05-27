#!/usr/bin/env node
/**
 * scripts/validate-hreflang-all.mjs
 *
 * portfolio-weekly-hreflang-reciprocity cron (Q7).
 * Sun 22:30 CDT — for every multilingual site, run hreflang reciprocity
 * verification. Escalates on asymmetric clusters.
 *
 * Generalizes the existing scripts/validate-hreflang.mjs (originally
 * single-site site-a-only) to walk all multilingual sites.
 *
 * Plan 2 Task D.5. routine_version: 1.0.
 */
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { appendRun, recordSuccess, recordFailure, checkBackoff } from './lib/audit-log.mjs';
import { writeInboxItem } from './lib/cron-mode.mjs';

const execFileAsync = promisify(execFile);

const ROUTINE_VERSION = '1.0';
const ROUTINE_ID = 'portfolio-weekly-hreflang-reciprocity';
const SITES_DIR = path.resolve('sites');

async function isMultilingualSite(siteName) {
  const siteInfo = await fs.readFile(path.join(SITES_DIR, siteName, 'site-info.md'), 'utf8');
  return /^- \*\*Multilingual:\*\*\s*\*?\*?true/m.test(siteInfo);
}

async function validateHreflangForSite(siteName) {
  const siteDir = path.join(SITES_DIR, siteName);
  const isMulti = await isMultilingualSite(siteName);
  if (!isMulti) return { siteName, skipped: 'not multilingual' };

  // Delegate to existing validate-hreflang.mjs with --json + --site=siteName.
  // The existing script reads site-info.md to learn URL patterns.
  try {
    const { stdout, stderr } = await execFileAsync(
      'node',
      ['scripts/validate-hreflang.mjs', `--site=${siteName}`, '--json'],
      { cwd: path.resolve('.') },
    );
    let report;
    try {
      report = JSON.parse(stdout);
    } catch {
      return {
        siteName,
        error: `validate-hreflang.mjs does not support --json yet; stderr: ${stderr.slice(0, 200)}`,
      };
    }

    const errors = report.errors || report.issues || [];
    if (errors.length === 0) return { siteName, escalated: false, urlsChecked: report.totalUrls || 0 };

    await writeInboxItem({
      siteDir,
      routine: ROUTINE_ID,
      routineVersion: ROUTINE_VERSION,
      topic: 'hreflang-asymmetry',
      site: siteName,
      trigger: `${errors.length} hreflang issues detected`,
      whatITried: `Ran scripts/validate-hreflang.mjs --site=${siteName} --json. The script walks the sitemap, fetches every URL + its alternates, verifies cluster reciprocity (self-ref + siblings + x-default), and checks <html lang> matches served language.\n\nFirst 10 issues:\n${errors
        .slice(0, 10)
        .map((e) => `  - ${typeof e === 'string' ? e : JSON.stringify(e).slice(0, 200)}`)
        .join('\n')}${errors.length > 10 ? `\n  ... and ${errors.length - 10} more` : ''}`,
      whatINeed: `Investigate which routes have broken alternates. Common causes: middleware autoedit broke a route-meta.ts hreflang entry; a new page shipped without its sibling-language counterpart; a route-meta entry's URL is stale.`,
      contextLinks: [
        `https://search.google.com/search-console (International Targeting report)`,
        `Lovable project for the site`,
      ],
    });
    return { siteName, escalated: true, errorCount: errors.length };
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
    const sites = (await fs.readdir(SITES_DIR, { withFileTypes: true }))
      .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
      .map((d) => d.name);

    const escalations = [];
    for (const site of sites) {
      const result = await validateHreflangForSite(site);
      if (result.escalated) {
        escalations.push(`${site}: ${result.errorCount} hreflang issues`);
      } else if (result.error) {
        escalations.push(`${site}: ${result.error}`);
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

    console.log(`Validated hreflang for ${sites.length} sites. Escalations: ${escalations.length}.`);
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
