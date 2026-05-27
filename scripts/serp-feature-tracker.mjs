#!/usr/bin/env node
/**
 * scripts/serp-feature-tracker.mjs
 *
 * P2.4 — portfolio-monthly-serp-features cron.
 * 10th of month, 09:00 CDT — per site: for each keyword on the SEMrush
 * Position Tracking campaign, fetch which SERP features the SERP shows.
 * Compare against competitors. For features competitors capture but the site
 * doesn't, write content-restructuring recommendations to _inbox/.
 *
 * SERP features tracked:
 *   - featured_snippet (40-50 word answer box)
 *   - paa (People Also Ask)
 *   - image_pack
 *   - video (YouTube carousel)
 *   - knowledge_panel
 *   - aio (AI Overview / Google SGE)
 *   - local_pack
 *   - sitelinks
 *
 * routine_version: 1.0.
 */
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { appendRun, recordSuccess, recordFailure, checkBackoff } from './lib/audit-log.mjs';
import { writeInboxItem } from './lib/cron-mode.mjs';
import { fetchPhraseSerpFeatures } from './lib/semrush-api.mjs';

const ROUTINE_VERSION = '1.0';
const ROUTINE_ID = 'portfolio-monthly-serp-features';
const SITES_DIR = path.resolve('sites');

/**
 * Pure-function: given the SERP-feature presence for the site's URLs vs.
 * competitors' URLs for a given keyword, return the gaps — features
 * competitors capture but the site doesn't, with a recommendation per gap.
 *
 * Input:
 *   keyword: 'houston ai consulting'
 *   siteResults: { url, position, features: {featured_snippet: false, paa: true, ...} }
 *   competitorResults: [{ domain, url, position, features: {...} }, ...]
 *
 * Returns: { keyword, gaps: [{feature, captured_by, recommendation, action}] }
 */
export function detectFeatureGaps(keyword, siteResults, competitorResults) {
  const gaps = [];
  const siteFeatures = siteResults?.features || {};

  const recommendations = {
    featured_snippet: {
      recommendation:
        'Restructure the page to include a clear 40–50 word direct answer to the query in the FIRST H2 or H3 section. Use list or table format when appropriate. Featured snippets reward concise self-contained answers.',
      action: '/refresh with snippet-restructure flag',
    },
    paa: {
      recommendation:
        'Add the PAA questions Google is showing to your FAQPage schema, with concise (50–100 word) answers. The FAQ section should appear in-body, not just in JSON-LD — duplicate content in both places.',
      action: '/refresh to add PAA Q+A to FAQ section + FAQPage schema',
    },
    image_pack: {
      recommendation:
        'Add 2–3 optimized images to the page with descriptive hyphenated filenames containing the primary keyword, real alt text (8–15 words, keyword-natural), and explicit width/height attributes. Compress to WebP, < 200KB each.',
      action: '/refresh to add image content + alt + filename optimization',
    },
    video: {
      recommendation:
        'Embed a YouTube video that answers the query directly. If no video exists, this gap requires NEW production — flag for content roadmap, not a refresh. Sites without video resources can skip this feature.',
      action: 'NEW video production (not a refresh)',
    },
    knowledge_panel: {
      recommendation:
        'Knowledge panels are entity-driven, not page-driven — they reflect Google\'s structured understanding of the brand. Improvement requires: (a) verified Google Business Profile, (b) Wikipedia entry where applicable, (c) consistent Organization schema across all pages, (d) earned third-party citations of the brand entity. Page-level refresh is NOT the lever.',
      action: 'OFF-PAGE work (Organization entity strengthening)',
    },
    aio: {
      recommendation:
        'AI Overview (Google SGE) selects pages that pass: (a) Q+A density (5+ in-body Q→A pairs), (b) citation-friendly chunking (paragraphs ≤ 3 sentences), (c) self-contained facts (no "as mentioned above"), (d) verifiable claims (every statistic linked). These are the P1.5 rules — apply them.',
      action: '/refresh with AI-search optimization flag (P1.5 rules)',
    },
    local_pack: {
      recommendation:
        'Local pack requires a verified Google Business Profile + LocalBusiness schema on the target page. If site is service-area or multi-location, ensure NAP is consistent across page + GBP + directories.',
      action: 'GBP + LocalBusiness schema audit (off-page)',
    },
    sitelinks: {
      recommendation:
        'Sitelinks are awarded to pages with strong topical authority signals — multiple high-quality internal links, clear semantic site structure, and significant brand search volume. Improvement comes from P2.3 (internal link equity) + organic brand-mention growth.',
      action: 'Internal link equity improvements (P2.3 work)',
    },
  };

  for (const [feature, info] of Object.entries(recommendations)) {
    const siteCaptures = siteFeatures[feature] === true;
    if (siteCaptures) continue;

    const competitorsCapturing = competitorResults.filter(
      (c) => c.features?.[feature] === true,
    );
    if (competitorsCapturing.length === 0) continue;

    gaps.push({
      feature,
      captured_by: competitorsCapturing.map((c) => c.domain),
      competitor_count: competitorsCapturing.length,
      recommendation: info.recommendation,
      action: info.action,
    });
  }

  return { keyword, gaps };
}

/**
 * Live SEMrush integration (P2.4 wiring, 2026-05-17).
 *
 * Fetches the SERP composition for a keyword: top URLs + their domains +
 * positions. Per-feature presence flags (featured_snippet=T/F, paa=T/F,
 * etc.) are NOT available on the SEMrush Guru tier — that requires the
 * SERP Features API on Business+ tier.
 *
 * What this returns today: site + competitors with `features: {}` (empty).
 * deriveAudits() handles empty features by NOT escalating (the absence of
 * a feature claim is treated as "unknown", not "captured by competitor").
 * This means P2.4 is wired but produces no actionable gaps until SEMrush
 * tier upgrade OR an alternative feature-detection source.
 *
 * Logging is deliberate: the cron writes an audit-log entry noting the
 * limitation so the user knows P2.4 ran but couldn't detect gaps. When
 * the SERP Features API becomes accessible, swap the helper's
 * fetchPhraseSerpFeatures internals — no other changes needed here.
 */
async function fetchSerpFeatures({ campaign, keyword, siteDomain }) {
  void campaign;
  if (!siteDomain) return null;
  try {
    const data = await fetchPhraseSerpFeatures(keyword, { siteDomain });
    return data;
  } catch (err) {
    console.error(`SEMrush phrase_organic failed for "${keyword}": ${err.message}`);
    return null;
  }
}

async function analyzeSite(siteName) {
  const siteDir = path.join(SITES_DIR, siteName);
  const siteInfoPath = path.join(siteDir, 'site-info.md');

  let siteInfo;
  try {
    siteInfo = await fs.readFile(siteInfoPath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return { siteName, skipped: 'no site-info.md' };
    throw err;
  }
  const campaignMatch = siteInfo.match(/Position Tracking campaign[^\n]*?(\d{4,}_\d+)/);
  if (!campaignMatch) return { siteName, skipped: 'no SEMrush Position Tracking campaign id' };

  // Read tracked keywords from rankings history (populated by Q2 cron)
  const historyPath = path.join(siteDir, '_baselines', 'rankings-history.json');
  let history;
  try {
    history = JSON.parse(await fs.readFile(historyPath, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') {
      return { siteName, skipped: 'no rankings history yet (Q2 cron must run first)' };
    }
    throw err;
  }

  const trackedKeywords = Object.keys(history.weeks?.[0]?.positions || {});
  if (trackedKeywords.length === 0) return { siteName, skipped: 'no tracked keywords in history' };

  // Derive site's bare domain from one of the keyword_urls
  const someUrl = Object.values(history.keyword_urls || {}).find((u) => u && /^https?:\/\//.test(u));
  if (!someUrl) return { siteName, skipped: 'no canonical URL mapped for tracked keywords' };
  let siteDomain;
  try {
    siteDomain = new URL(someUrl).hostname.replace(/^www\./, '');
  } catch {
    return { siteName, skipped: 'invalid canonical URL in rankings-history.json' };
  }

  const allGaps = [];
  for (const keyword of trackedKeywords) {
    const data = await fetchSerpFeatures({ campaign: campaignMatch[1], keyword, siteDomain });
    if (!data) continue;
    const { gaps } = detectFeatureGaps(keyword, data.site, data.competitors);
    if (gaps.length) allGaps.push({ keyword, url: history.keyword_urls[keyword], gaps });
  }

  if (allGaps.length === 0) {
    return { siteName, escalated: false, keywordsChecked: trackedKeywords.length, gaps: 0 };
  }

  // Group gaps by recommended action so the user can batch-act
  const actionBuckets = {};
  for (const entry of allGaps) {
    for (const gap of entry.gaps) {
      actionBuckets[gap.action] = actionBuckets[gap.action] || [];
      actionBuckets[gap.action].push({
        keyword: entry.keyword,
        url: entry.url,
        feature: gap.feature,
        captured_by: gap.captured_by,
        recommendation: gap.recommendation,
      });
    }
  }

  const report = Object.entries(actionBuckets)
    .map(([action, items]) => {
      return `## Action: ${action}\n\n${items
        .map(
          (i) =>
            `- **${i.keyword}** (${i.url || 'no URL mapped'})\n  Feature: ${i.feature}\n  Competitors capturing: ${i.captured_by.join(', ')}\n  Recommendation: ${i.recommendation}`,
        )
        .join('\n\n')}`;
    })
    .join('\n\n---\n\n');

  await writeInboxItem({
    siteDir,
    routine: ROUTINE_ID,
    routineVersion: ROUTINE_VERSION,
    topic: 'serp-feature-gaps',
    site: siteName,
    trigger: `${allGaps.length} keyword(s) with capturable SERP-feature gaps`,
    whatITried: `Walked ${trackedKeywords.length} keywords from SEMrush Position Tracking campaign ${campaignMatch[1]}. For each keyword, fetched the SERP-feature presence per the top organic results. Identified features competitors capture but the site does not.\n\nGap report grouped by recommended action:\n\n${report}`,
    whatINeed: `Run the action listed for each keyword. Most actions map to existing skills (/refresh with feature-specific flag). Off-page actions (GBP, Organization entity) are not skill-driven — they require manual work tracked in notes.md.\n\nPriority: address the action bucket containing the highest-volume keywords first (cross-reference with used-keywords.md). Featured-snippet + AIO gaps usually have the highest immediate-impact-to-effort ratio.`,
    contextLinks: [
      `sites/${siteName}/_baselines/rankings-history.json`,
      `sites/${siteName}/used-keywords.md`,
    ],
  });

  return {
    siteName,
    escalated: true,
    keywordsChecked: trackedKeywords.length,
    gaps: allGaps.length,
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
    const skipped = [];
    for (const site of sites) {
      const result = await analyzeSite(site);
      if (result.escalated) {
        escalations.push(`${site}: ${result.gaps} gap-keywords across ${result.keywordsChecked} tracked`);
      } else if (result.skipped) {
        skipped.push(`${site}: ${result.skipped}`);
      }
    }

    if (escalations.length === 0) await recordSuccess({ routine: ROUTINE_ID });

    await appendRun({
      routine: ROUTINE_ID,
      routineVersion: ROUTINE_VERSION,
      site: null,
      durationSec: (Date.now() - start) / 1000,
      exit: escalations.length === 0 ? 'shipped' : 'escalated',
      filesTouched: [],
      escalations: [...escalations, ...skipped],
    });

    console.log(`Analyzed ${sites.length} sites. Escalations: ${escalations.length}. Skipped: ${skipped.length}.`);
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
