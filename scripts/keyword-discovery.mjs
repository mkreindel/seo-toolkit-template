#!/usr/bin/env node
/**
 * scripts/keyword-discovery.mjs
 *
 * portfolio-monthly-keyword-discovery cron.
 * Monthly on the 1st at 09:13 CDT — for each site with a GSC property, pulls top queries
 * from the last 28 days where the site is ranking position > 10 with impressions ≥ 100.
 * These are "queries you're almost ranking for" — pre-validated demand the site can capture
 * by improving existing content or shipping targeted new content.
 *
 * Dedups against current sites/{site}/keywords.csv + used-keywords.md to surface only NEW
 * opportunities. Ranks by an opportunity score: impressions × (1 / position) — high impressions
 * + close to top 10 = highest upside.
 *
 * Output: sites/{site}/_inbox/keyword-candidates-{YYYY-MM-DD}.md with top 10 per site.
 * User approves by appending to keywords.csv; next drafter firing picks them up.
 *
 * P1.1 of cruise-control v2 (see docs/specs/2026-05-17-cruise-control-v2-design.md).
 * routine_version: 1.0. MVP scope: GSC source only. SEMrush competitor + magic sources
 * are v1.1 (additive without changing output shape).
 *
 * Usage:
 *   node scripts/keyword-discovery.mjs                       # all sites with GSC properties
 *   node scripts/keyword-discovery.mjs --site=site-a       # one site only
 *   node scripts/keyword-discovery.mjs --dry-run             # print to stdout instead of writing inbox file
 */
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { google } from 'googleapis';
import { appendRun, recordSuccess, recordFailure, checkBackoff } from './lib/audit-log.mjs';

const ROUTINE_VERSION = '1.0';
const ROUTINE_ID = 'portfolio-monthly-keyword-discovery';
const SITES_DIR = path.resolve('sites');

// Defaults — overridable via CLI args --min-impressions=N --min-position=N
// min-impressions=3 filters single-impression flukes while keeping early-stage sites
// (like site-a at AS 0) productive. Established sites can crank to 50+ via the flag.
const DEFAULT_MIN_IMPRESSIONS = 3;
const DEFAULT_MIN_POSITION_EXCLUSIVE = 10; // we want position > 10 (NOT already in top 10)
const TOP_N = 10;
const FULL_LIST_N = 30; // include top 30 in the inbox file for transparency

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .map((a) => a.replace(/^--/, '').split('='))
    .map(([k, v]) => [k, v ?? true])
);

// --------------- pure functions (testable) ---------------

/**
 * Opportunity score balances demand (impressions) with attainability (closeness to top 10).
 * Higher score = bigger opportunity.
 *
 * Position 11 with 1000 impressions: 1000 / 11 = 90.9
 * Position 50 with 1000 impressions: 1000 / 50 = 20
 * Position 11 with 100 impressions:  100 / 11 = 9.1
 *
 * Same demand, closer to top 10 ranks higher.
 * Same position, higher demand ranks higher.
 */
export function opportunityScore(impressions, position) {
  if (!Number.isFinite(impressions) || !Number.isFinite(position) || position <= 0) return 0;
  return impressions / position;
}

/**
 * Parse `keywords.csv` and return an array of normalized keyword strings (column 1).
 * Handles quoted fields and trims whitespace.
 */
export function parseKeywordsCsv(csv) {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Extract first column — handle optional surrounding quotes
    const match = line.match(/^("([^"]*)"|([^,]*))/);
    const value = match ? (match[2] !== undefined ? match[2] : match[3]) : '';
    const normalized = value.trim().toLowerCase();
    if (normalized) out.push(normalized);
  }
  return out;
}

/**
 * Parse `used-keywords.md` and return an array of normalized keyword strings.
 * The format is markdown table rows; column 1 is "Keyword" by convention.
 */
export function parseUsedKeywordsMd(md) {
  const out = [];
  for (const line of md.split('\n')) {
    // Match table rows that start with `|` and have at least one column
    const m = line.match(/^\|\s*([^|]+?)\s*\|/);
    if (!m) continue;
    const kw = m[1].trim().toLowerCase();
    // Skip table header rows ("keyword", "---", etc.)
    if (kw === 'keyword' || /^-+$/.test(kw) || kw.includes('---')) continue;
    if (kw) out.push(kw);
  }
  return out;
}

/**
 * Given raw GSC rows + the existing-keyword sets, dedupe + rank.
 * Returns { topN, fullList, rawCount, filteredCount, dedupCount }
 */
export function buildCandidates(rows, existingCsv, existingUsed, opts = {}) {
  const minImpressions = opts.minImpressions ?? DEFAULT_MIN_IMPRESSIONS;
  const minPositionExclusive = opts.minPositionExclusive ?? DEFAULT_MIN_POSITION_EXCLUSIVE;
  const exclude = new Set([...existingCsv, ...existingUsed]);
  const rawCount = rows.length;

  // Filter: position > minPositionExclusive, impressions >= minImpressions
  const filtered = rows.filter(
    (r) => Number(r.position) > minPositionExclusive && Number(r.impressions) >= minImpressions
  );
  const filteredCount = filtered.length;

  // Dedupe: exclude any keyword already in keywords.csv or used-keywords.md
  // GSC's "keys" is an array; first element is the query string
  const deduped = filtered.filter((r) => {
    const kw = (r.keys?.[0] || '').trim().toLowerCase();
    if (!kw) return false;
    return !exclude.has(kw);
  });

  // Rank by opportunity score
  const ranked = deduped
    .map((r) => ({
      keyword: r.keys[0],
      position: Number(r.position),
      impressions: Number(r.impressions),
      clicks: Number(r.clicks),
      ctr: Number(r.ctr),
      score: opportunityScore(Number(r.impressions), Number(r.position)),
    }))
    .sort((a, b) => b.score - a.score);

  return {
    topN: ranked.slice(0, TOP_N),
    fullList: ranked.slice(0, FULL_LIST_N),
    rawCount,
    filteredCount,
    dedupCount: ranked.length,
  };
}

/**
 * Build the inbox-file markdown content.
 */
export function buildInboxMarkdown({
  site,
  today,
  property,
  minImpressions,
  minPositionExclusive,
  existingCsvCount,
  existingUsedCount,
  rawCount,
  filteredCount,
  dedupCount,
  topN,
  fullList,
}) {
  const rowToLine = (r, i) => {
    const ctrPct = (r.ctr * 100).toFixed(2);
    const positionRounded = r.position.toFixed(1);
    const scoreRounded = r.score.toFixed(1);
    return `| ${i + 1} | \`${r.keyword}\` | ${positionRounded} | ${r.impressions.toLocaleString()} | ${r.clicks.toLocaleString()} | ${ctrPct}% | ${scoreRounded} |`;
  };

  const topTable = topN.length
    ? [
        '| # | Keyword | Avg position | Impressions (28d) | Clicks (28d) | CTR | Opportunity score |',
        '|---|---------|--------------|-------------------|--------------|-----|-------------------|',
        ...topN.map(rowToLine),
      ].join('\n')
    : '_(no candidates passed the filters — site may have <100 impressions per query, or all top queries are already in keywords.csv)_';

  const fullTable = fullList.length > TOP_N
    ? [
        '',
        '<details>',
        `<summary>Full top ${fullList.length} (click to expand)</summary>`,
        '',
        '| # | Keyword | Avg position | Impressions (28d) | Clicks (28d) | CTR | Opportunity score |',
        '|---|---------|--------------|-------------------|--------------|-----|-------------------|',
        ...fullList.map(rowToLine),
        '',
        '</details>',
      ].join('\n')
    : '';

  return `# Keyword candidates — ${site} — ${today}

**Generated:** ${today} by ${ROUTINE_ID} (v${ROUTINE_VERSION})
**Source:** GSC top-queries (last 28 days, impressions ≥ ${minImpressions}, position > ${minPositionExclusive})
**GSC property:** \`${property}\`
**Existing keywords.csv count:** ${existingCsvCount}
**Used keywords (already-published):** ${existingUsedCount}
**Raw GSC rows returned:** ${rawCount}
**After impressions + position filters:** ${filteredCount}
**After dedup against existing:** ${dedupCount}

## Top ${topN.length} opportunities

${topTable}
${fullTable}

## How to read this

- **Position 11-20** = ranking on page 2. Pushing to page 1 typically unlocks a 5-10x click multiplier. These are the highest-leverage opportunities.
- **Position 21-50** = ranking on page 3-5. Impressions confirm demand; content quality improvement could move significantly. Worth investigating.
- **Position 51-100** = barely ranking; the site is appearing for the query but probably for a tangential reason. Assess fit before adopting.

The **opportunity score** is \`impressions / position\` — a simple heuristic that balances demand (impressions) with attainability (closeness to top 10). Higher = bigger opportunity.

## To approve

For each candidate you want to target, append a row to \`sites/${site}/keywords.csv\`. The CSV columns are: \`keyword,volume,kd,cpc,intent,serp_features,notes\`. For volume/kd/cpc, you can:

- Use SEMrush manually to look up the metrics
- Run \`node scripts/semrush.mjs --keyword="..."\` for individual lookups (if available)
- Leave them as \`tbd\` for now — the drafter will still use them based on the keyword text alone

After you've added the keywords, delete this inbox file (or change the Status line below from OPEN to RESOLVED).

**Status:** OPEN
`;
}

// --------------- side-effectful: pulls + writes ---------------

async function getGscAuth() {
  const oauth2 = new google.auth.OAuth2(
    process.env.GSC_OAUTH_CLIENT_ID,
    process.env.GSC_OAUTH_CLIENT_SECRET,
  );
  oauth2.setCredentials({ refresh_token: process.env.GSC_OAUTH_REFRESH_TOKEN });
  return oauth2;
}

async function getGscPropertyForSite(siteName) {
  const siteInfo = await fs.readFile(path.join(SITES_DIR, siteName, 'site-info.md'), 'utf8');
  const match = siteInfo.match(/sc-domain:([\w.-]+)/);
  if (!match) return null;
  return `sc-domain:${match[1]}`;
}

async function pullTopQueries(property, auth) {
  const webmasters = google.webmasters({ version: 'v3', auth });
  const today = new Date();
  const endDate = today.toISOString().slice(0, 10);
  const start = new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000);
  const startDate = start.toISOString().slice(0, 10);

  const res = await webmasters.searchanalytics.query({
    siteUrl: property,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['query'],
      rowLimit: 1000,
      searchType: 'web',
      aggregationType: 'auto',
    },
  });

  return res.data.rows || [];
}

async function readExistingKeywords(siteDir) {
  let csv = '';
  let used = '';
  try {
    csv = await fs.readFile(path.join(siteDir, 'keywords.csv'), 'utf8');
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  try {
    used = await fs.readFile(path.join(siteDir, 'used-keywords.md'), 'utf8');
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  return { csv: parseKeywordsCsv(csv), used: parseUsedKeywordsMd(used) };
}

async function processSite(siteName, auth, opts) {
  const { dryRun, minImpressions, minPositionExclusive } = opts;
  const siteDir = path.join(SITES_DIR, siteName);
  const property = await getGscPropertyForSite(siteName);
  if (!property) {
    return { siteName, skipped: 'no GSC sc-domain property in site-info.md' };
  }

  let rows;
  try {
    rows = await pullTopQueries(property, auth);
  } catch (err) {
    return { siteName, error: `GSC query failed: ${err.message}` };
  }

  const { csv: existingCsv, used: existingUsed } = await readExistingKeywords(siteDir);
  const candidates = buildCandidates(rows, existingCsv, existingUsed, {
    minImpressions,
    minPositionExclusive,
  });

  const today = new Date().toISOString().slice(0, 10);
  const markdown = buildInboxMarkdown({
    site: siteName,
    today,
    property,
    minImpressions,
    minPositionExclusive,
    existingCsvCount: existingCsv.length,
    existingUsedCount: existingUsed.length,
    rawCount: candidates.rawCount,
    filteredCount: candidates.filteredCount,
    dedupCount: candidates.dedupCount,
    topN: candidates.topN,
    fullList: candidates.fullList,
  });

  const inboxPath = path.join(siteDir, '_inbox', `keyword-candidates-${today}.md`);

  if (dryRun) {
    return {
      siteName,
      property,
      candidates: candidates.topN,
      counts: {
        raw: candidates.rawCount,
        filtered: candidates.filteredCount,
        dedup: candidates.dedupCount,
        topN: candidates.topN.length,
      },
      inboxPath,
      dryRun: true,
      markdown,
    };
  }

  await fs.mkdir(path.dirname(inboxPath), { recursive: true });
  await fs.writeFile(inboxPath, markdown);
  return {
    siteName,
    property,
    counts: {
      raw: candidates.rawCount,
      filtered: candidates.filteredCount,
      dedup: candidates.dedupCount,
      topN: candidates.topN.length,
    },
    inboxPath,
  };
}

async function main() {
  if (await checkBackoff({ routine: ROUTINE_ID })) {
    console.error(`Routine ${ROUTINE_ID} at backoff threshold. Exiting.`);
    process.exit(0);
  }

  const start = Date.now();
  const dryRun = !!args['dry-run'];
  const siteFilter = args.site;
  const minImpressions = args['min-impressions']
    ? Number(args['min-impressions'])
    : DEFAULT_MIN_IMPRESSIONS;
  const minPositionExclusive = args['min-position']
    ? Number(args['min-position'])
    : DEFAULT_MIN_POSITION_EXCLUSIVE;

  try {
    if (!process.env.GSC_OAUTH_REFRESH_TOKEN) {
      throw new Error('GSC_OAUTH_REFRESH_TOKEN missing from .env');
    }

    const auth = await getGscAuth();
    const allSites = (await fs.readdir(SITES_DIR, { withFileTypes: true }))
      .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
      .map((d) => d.name);
    const sites = siteFilter ? allSites.filter((s) => s === siteFilter) : allSites;

    if (!sites.length) {
      throw new Error(siteFilter ? `Site ${siteFilter} not found` : 'No sites found');
    }

    const escalations = [];
    const filesTouched = [];
    let totalCandidates = 0;

    for (const site of sites) {
      const result = await processSite(site, auth, { dryRun, minImpressions, minPositionExclusive });
      if (result.skipped) {
        console.log(`⏭️  ${site}: ${result.skipped}`);
        continue;
      }
      if (result.error) {
        console.error(`❌ ${site}: ${result.error}`);
        escalations.push(`${site}: ${result.error}`);
        continue;
      }
      if (dryRun) {
        console.log(`\n=== ${site} dry-run (${result.property}) ===`);
        console.log(`Top ${result.counts.topN} of ${result.counts.dedup} candidates (from ${result.counts.raw} raw → ${result.counts.filtered} filtered):\n`);
        console.log(result.markdown);
      } else {
        const action = `Wrote ${result.inboxPath} (${result.counts.topN} of ${result.counts.dedup} candidates after dedup, ${result.counts.filtered}/${result.counts.raw} passed filters)`;
        console.log(`✅ ${site}: ${action}`);
        filesTouched.push(result.inboxPath);
        totalCandidates += result.counts.topN;
      }
    }

    if (escalations.length === 0) await recordSuccess({ routine: ROUTINE_ID });
    await appendRun({
      routine: ROUTINE_ID,
      routineVersion: ROUTINE_VERSION,
      site: null,
      durationSec: (Date.now() - start) / 1000,
      exit: escalations.length ? 'escalated' : (dryRun ? 'idempotent-skip' : 'shipped'),
      filesTouched,
      escalations,
    });
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
    console.error(`❌ ${err.message}`);
    process.exit(1);
  }
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || '')) {
  main();
}
