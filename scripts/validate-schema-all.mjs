#!/usr/bin/env node
/**
 * scripts/validate-schema-all.mjs
 *
 * portfolio-weekly-schema-validation cron (Q6).
 * Sun 22:00 CDT — for each site, fetch every URL in the sitemap, extract
 * JSON-LD, validate via Schema.org Validator API, escalate on failures.
 *
 * Plan 2 Task D.4. routine_version: 1.0.
 *
 * Wraps the existing scripts/validate-schema.mjs logic, applying it to
 * every sitemap URL per site rather than a single URL at a time.
 */
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { appendRun, recordSuccess, recordFailure, checkBackoff } from './lib/audit-log.mjs';
import { writeInboxItem } from './lib/cron-mode.mjs';
import { parseSitemap } from './lib/sitemap.mjs';

const ROUTINE_VERSION = '1.0';
const ROUTINE_ID = 'portfolio-weekly-schema-validation';
const SITES_DIR = path.resolve('sites');

async function extractJsonLdFromUrl(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEO-Toolkit-Validator/1.0)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const matches = [
    ...html.matchAll(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ];
  const blocks = [];
  for (const m of matches) {
    try {
      blocks.push(JSON.parse(m[1].trim()));
    } catch (err) {
      blocks.push({ __parse_error: err.message, raw: m[1].slice(0, 200) });
    }
  }
  return blocks;
}

async function validateJsonLdBlocks(blocks) {
  // Returns array of {ok, errors} per block.
  // Schema.org Validator API: POST to https://validator.schema.org/validate
  // (the validator's public API)
  const results = [];
  for (const block of blocks) {
    if (block.__parse_error) {
      results.push({ ok: false, errors: [`JSON parse error: ${block.__parse_error}`] });
      continue;
    }
    try {
      const res = await fetch('https://validator.schema.org/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonLd: JSON.stringify(block) }),
      });
      if (!res.ok) {
        results.push({ ok: false, errors: [`Validator HTTP ${res.status}`] });
        continue;
      }
      const data = await res.json();
      const errors = data.errors || data.tripleErrors || [];
      results.push({ ok: errors.length === 0, errors });
    } catch (err) {
      results.push({ ok: false, errors: [`Validator request: ${err.message}`] });
    }
  }
  return results;
}

async function validateSite(siteName) {
  const siteDir = path.join(SITES_DIR, siteName);
  const baselineSitemapPath = path.join(siteDir, '_baselines', 'sitemap.xml');

  let xml;
  try {
    xml = await fs.readFile(baselineSitemapPath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return { siteName, skipped: 'no sitemap baseline yet' };
    throw err;
  }
  const urls = await parseSitemap(xml);
  if (urls.length === 0) return { siteName, skipped: 'sitemap has no URLs' };

  const failures = [];
  for (const url of urls) {
    try {
      const blocks = await extractJsonLdFromUrl(url);
      if (blocks.length === 0) {
        failures.push({ url, reason: 'no JSON-LD blocks' });
        continue;
      }
      const results = await validateJsonLdBlocks(blocks);
      const failed = results.filter((r) => !r.ok);
      if (failed.length) {
        failures.push({
          url,
          reason: `${failed.length}/${results.length} blocks failed`,
          errors: failed.flatMap((r) => r.errors).slice(0, 3),
        });
      }
    } catch (err) {
      failures.push({ url, reason: `fetch/extract: ${err.message}` });
    }
  }

  if (failures.length) {
    await writeInboxItem({
      siteDir,
      routine: ROUTINE_ID,
      routineVersion: ROUTINE_VERSION,
      topic: 'schema-validation-failure',
      site: siteName,
      trigger: `${failures.length} URLs failed schema validation`,
      whatITried: `Walked ${urls.length} URLs in sitemap.xml. Extracted JSON-LD per URL. Validated via Schema.org Validator API.\n\nFailing URLs:\n${failures
        .slice(0, 10)
        .map((f) => `  - ${f.url}: ${f.reason}${f.errors ? '\n      ' + f.errors.join('\n      ') : ''}`)
        .join('\n')}${failures.length > 10 ? `\n  ... and ${failures.length - 10} more` : ''}`,
      whatINeed: `Investigate which schema entries regressed. Common causes: middleware autoedit broke an inLanguage / Organization @id reference; Lovable rebuild flipped a property; a new page was shipped with malformed schema. Once fixed, re-run cron to clear.`,
      contextLinks: [
        `https://search.google.com/test/rich-results`,
        `https://validator.schema.org/`,
        `sites/${siteName}/_baselines/sitemap.xml`,
      ],
    });
    return { siteName, escalated: true, failureCount: failures.length };
  }

  return { siteName, escalated: false, urlsChecked: urls.length };
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
      const result = await validateSite(site);
      if (result.escalated) {
        escalations.push(`${site}: ${result.failureCount} failures`);
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

    console.log(`Validated schema for ${sites.length} sites. Escalations: ${escalations.length}.`);
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
