#!/usr/bin/env node
/**
 * scripts/lighthouse-poll.mjs
 *
 * P3.1-P3.5 — portfolio-weekly-lighthouse-lab cron (Q5b).
 * Tue 08:00 CDT — for every site, walks the sitemap and runs PageSpeed
 * Insights API per URL (mobile strategy default). One API call per URL
 * produces five derived audits:
 *
 *   P3.1 — Lighthouse category scores (Performance, Accessibility, BP, SEO)
 *   P3.2 — Image violations (size > 100KB, non-WebP/AVIF, missing width/height)
 *   P3.3 — JS bundle violations (transferred JS > 100KB per route)
 *   P3.4 — Third-party script audit (cumulative TBT cost)
 *   P3.5 — A11y violations (Lighthouse runs axe-core subset)
 *
 * Each URL's full PSI response is persisted to:
 *   sites/{site}/_baselines/lighthouse/{strategy}/{url-slug}-{date}.json
 * (kept for 8 weeks; older snapshots pruned on each run.)
 *
 * Aggregated findings per site → one _inbox/ item, grouped by P3.x section.
 *
 * routine_version: 1.0.
 */
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { appendRun, recordSuccess, recordFailure, checkBackoff } from './lib/audit-log.mjs';
import { writeInboxItem } from './lib/cron-mode.mjs';
import { parseSitemap } from './lib/sitemap.mjs';

const ROUTINE_VERSION = '1.0';
const ROUTINE_ID = 'portfolio-weekly-lighthouse-lab';
const SITES_DIR = path.resolve('sites');

// Thresholds (SEO_GUIDE.md Section 6.2 + P3 spec)
const SCORE_FLOORS = { performance: 90, accessibility: 95, 'best-practices': 95, seo: 95 };
const STRETCH_SCORE = 100;
const REGRESSION_DELTA = 5; // Drop ≥5 points week-over-week → escalate

// P3.2 — image thresholds
const IMAGE_MAX_BYTES = 100 * 1024; // 100KB per image
const IMAGE_PREFERRED_FORMATS = ['webp', 'avif'];

// P3.3 — JS bundle thresholds
const JS_BUNDLE_MAX_BYTES = 100 * 1024; // 100KB transferred JS per route

// P3.4 — third-party TBT budget
const THIRD_PARTY_TBT_BUDGET_MS = 100; // 100ms cumulative third-party blocking

const HISTORY_RETENTION_WEEKS = 8;

/**
 * Pure-function: extract the 5 P3.x derived audits from a PSI response.
 */
export function deriveAudits(psiResponse) {
  const lhr = psiResponse?.lighthouseResult || {};
  const categories = lhr.categories || {};
  const audits = lhr.audits || {};

  // P3.1 — scores
  const scores = {};
  for (const [key, cat] of Object.entries(categories)) {
    scores[key] = Math.round((cat.score || 0) * 100);
  }

  // P3.2 — image violations
  const imageViolations = [];
  const imgAudit = audits['uses-optimized-images'] || audits['uses-webp-images'] || audits['modern-image-formats'];
  const imgSizeAudit = audits['unsized-images'];
  // PSI returns image findings under multiple audit keys; consolidate
  const imageItems = [
    ...(audits['modern-image-formats']?.details?.items || []),
    ...(audits['uses-optimized-images']?.details?.items || []),
  ];
  for (const item of imageItems) {
    const url = item.url || item.node?.snippet || '(unknown)';
    const bytes = item.totalBytes || item.wastedBytes || 0;
    const format = (item.url || '').split('.').pop()?.toLowerCase();
    const reasons = [];
    if (bytes > IMAGE_MAX_BYTES) reasons.push(`size ${(bytes / 1024).toFixed(0)}KB > ${IMAGE_MAX_BYTES / 1024}KB`);
    if (format && !IMAGE_PREFERRED_FORMATS.includes(format)) {
      reasons.push(`format ${format} (prefer ${IMAGE_PREFERRED_FORMATS.join('/')})`);
    }
    if (reasons.length) imageViolations.push({ url, bytes, format, reasons });
  }
  // Also flag any unsized images (CLS contributor)
  for (const item of audits['unsized-images']?.details?.items || []) {
    imageViolations.push({
      url: item.url || item.node?.snippet || '(unknown)',
      bytes: null,
      format: null,
      reasons: ['missing explicit width/height (CLS risk)'],
    });
  }

  // P3.3 — JS bundle violation
  const resourceSummary = audits['resource-summary']?.details?.items || [];
  const jsRow = resourceSummary.find((r) => r.resourceType === 'script');
  const jsTransferBytes = jsRow?.transferSize || 0;
  const jsBundleViolation = jsTransferBytes > JS_BUNDLE_MAX_BYTES
    ? {
        transferred_kb: Math.round(jsTransferBytes / 1024),
        budget_kb: JS_BUNDLE_MAX_BYTES / 1024,
        request_count: jsRow?.requestCount || 0,
        over_by_kb: Math.round((jsTransferBytes - JS_BUNDLE_MAX_BYTES) / 1024),
      }
    : null;

  // P3.4 — third-party script audit
  const thirdPartyItems = audits['third-party-summary']?.details?.items || [];
  const thirdPartyTotal = thirdPartyItems.reduce(
    (acc, item) => ({
      blocking_ms: acc.blocking_ms + (item.blockingTime || 0),
      transfer_kb: acc.transfer_kb + (item.transferSize || 0) / 1024,
    }),
    { blocking_ms: 0, transfer_kb: 0 },
  );
  const thirdPartyViolation = thirdPartyTotal.blocking_ms > THIRD_PARTY_TBT_BUDGET_MS
    ? {
        total_blocking_ms: Math.round(thirdPartyTotal.blocking_ms),
        budget_ms: THIRD_PARTY_TBT_BUDGET_MS,
        total_transfer_kb: Math.round(thirdPartyTotal.transfer_kb),
        per_entity: thirdPartyItems.map((i) => ({
          entity: i.entity,
          blocking_ms: Math.round(i.blockingTime || 0),
          transfer_kb: Math.round((i.transferSize || 0) / 1024),
        })),
      }
    : null;

  // P3.5 — a11y violations (every failing accessibility audit)
  const a11yViolations = [];
  for (const [key, audit] of Object.entries(audits)) {
    // Accessibility audits have category-membership in accessibility
    const isA11y = (categories.accessibility?.auditRefs || []).some((ref) => ref.id === key);
    if (!isA11y) continue;
    // Failing audits have score < 1 (manual audits have score=null and are skipped)
    if (audit.score !== null && audit.score !== undefined && audit.score < 1) {
      const items = audit.details?.items || [];
      a11yViolations.push({
        id: key,
        title: audit.title,
        description: audit.description,
        impact: audit.impact || 'unknown',
        node_count: items.length,
        sample_nodes: items.slice(0, 3).map((i) => i.node?.snippet || JSON.stringify(i).slice(0, 200)),
      });
    }
  }

  return {
    scores,
    image_violations: imageViolations,
    js_bundle_violation: jsBundleViolation,
    third_party_violation: thirdPartyViolation,
    a11y_violations: a11yViolations,
  };
}

/**
 * Pure-function: compute deltas between current and previous week's scores.
 */
export function detectRegressions(currentScores, previousScores, opts = {}) {
  const { threshold = REGRESSION_DELTA } = opts;
  const regressions = [];
  for (const [category, current] of Object.entries(currentScores)) {
    const prev = previousScores[category];
    if (prev === undefined) continue;
    const delta = current - prev;
    if (delta <= -threshold) {
      regressions.push({ category, previous: prev, current, delta });
    }
  }
  return regressions;
}

async function callPsi(url, strategy, apiKey) {
  const apiUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  apiUrl.searchParams.set('url', url);
  apiUrl.searchParams.set('strategy', strategy);
  apiUrl.searchParams.set('key', apiKey);
  for (const c of ['performance', 'accessibility', 'best-practices', 'seo']) {
    apiUrl.searchParams.append('category', c);
  }
  const res = await fetch(apiUrl);
  if (!res.ok) throw new Error(`PSI API ${res.status} for ${url}: ${await res.text()}`);
  const data = await res.json();
  if (data.error) throw new Error(`PSI error for ${url}: ${data.error.message}`);
  return data;
}

function slugifyUrl(url) {
  return url.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '');
}

async function pruneOldSnapshots(historyDir, weeksToKeep) {
  try {
    const files = await fs.readdir(historyDir);
    const cutoff = Date.now() - weeksToKeep * 7 * 24 * 60 * 60 * 1000;
    for (const f of files) {
      const fp = path.join(historyDir, f);
      const stat = await fs.stat(fp).catch(() => null);
      if (stat && stat.mtimeMs < cutoff) await fs.unlink(fp);
    }
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}

async function loadPreviousScores(historyDir, urlSlug) {
  try {
    const files = (await fs.readdir(historyDir))
      .filter((f) => f.startsWith(urlSlug + '-') && f.endsWith('.json'))
      .sort()
      .reverse();
    if (files.length < 2) return null; // need at least 2 (current + previous)
    const prev = JSON.parse(await fs.readFile(path.join(historyDir, files[1]), 'utf8'));
    return deriveAudits(prev).scores;
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

async function analyzeSite(siteName, strategy = 'mobile') {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
  if (!apiKey) return { siteName, skipped: 'GOOGLE_PAGESPEED_API_KEY missing in env' };

  const siteDir = path.join(SITES_DIR, siteName);
  const sitemapPath = path.join(siteDir, '_baselines', 'sitemap.xml');

  let xml;
  try {
    xml = await fs.readFile(sitemapPath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return { siteName, skipped: 'no sitemap baseline yet' };
    throw err;
  }
  const urls = await parseSitemap(xml);
  if (urls.length === 0) return { siteName, skipped: 'sitemap has no URLs' };

  const historyDir = path.join(siteDir, '_baselines', 'lighthouse', strategy);
  await fs.mkdir(historyDir, { recursive: true });

  const perUrlFindings = [];
  const dateIso = new Date().toISOString().split('T')[0];

  // Cap URLs per run to respect PSI quotas (25K/day free tier ÷ ~10 sites ÷ 4 weekly = ~62 URLs/site/week safe)
  const urlsToTest = urls.slice(0, 30);

  for (const url of urlsToTest) {
    let psi;
    try {
      psi = await callPsi(url, strategy, apiKey);
    } catch (err) {
      perUrlFindings.push({ url, error: err.message });
      continue;
    }
    const urlSlug = slugifyUrl(url);
    const snapshotPath = path.join(historyDir, `${urlSlug}-${dateIso}.json`);
    await fs.writeFile(snapshotPath, JSON.stringify(psi));

    const audits = deriveAudits(psi);
    const previousScores = await loadPreviousScores(historyDir, urlSlug);
    const regressions = previousScores ? detectRegressions(audits.scores, previousScores) : [];

    const belowFloor = Object.entries(audits.scores).filter(
      ([cat, sc]) => SCORE_FLOORS[cat] !== undefined && sc < SCORE_FLOORS[cat],
    );
    const belowStretch = Object.entries(audits.scores).filter(([_cat, sc]) => sc < STRETCH_SCORE);

    perUrlFindings.push({
      url,
      audits,
      regressions,
      belowFloor,
      belowStretch,
    });
  }

  await pruneOldSnapshots(historyDir, HISTORY_RETENTION_WEEKS);

  // Aggregate findings across all URLs into a single inbox item
  const p31Findings = perUrlFindings.filter((f) => f.belowFloor?.length || f.regressions?.length);
  const p32Findings = perUrlFindings.filter((f) => f.audits?.image_violations?.length);
  const p33Findings = perUrlFindings.filter((f) => f.audits?.js_bundle_violation);
  const p34Findings = perUrlFindings.filter((f) => f.audits?.third_party_violation);
  const p35Findings = perUrlFindings.filter((f) => f.audits?.a11y_violations?.length);

  const hasAny =
    p31Findings.length || p32Findings.length || p33Findings.length || p34Findings.length || p35Findings.length;

  if (!hasAny) {
    return { siteName, escalated: false, urlsTested: urlsToTest.length };
  }

  const report = `
## P3.1 — Lighthouse scores (${p31Findings.length} URL(s) below floor or regressed)

${
  p31Findings
    .map(
      (f) =>
        `- **${f.url}**\n  Scores: ${Object.entries(f.audits.scores)
          .map(([c, s]) => `${c}=${s}`)
          .join(', ')}\n  ${
          f.belowFloor.length
            ? `Below floor: ${f.belowFloor.map(([c, s]) => `${c}=${s} (floor ${SCORE_FLOORS[c]})`).join(', ')}`
            : ''
        }${
          f.regressions.length
            ? `\n  Regressions: ${f.regressions
                .map((r) => `${r.category} ${r.previous} → ${r.current} (Δ${r.delta})`)
                .join(', ')}`
            : ''
        }`,
    )
    .join('\n') || '  (no findings)'
}

## P3.2 — Image violations (${p32Findings.length} URL(s) with image issues)

${
  p32Findings
    .map(
      (f) =>
        `- **${f.url}**\n${f.audits.image_violations
          .slice(0, 5)
          .map((v) => `  - ${v.url}: ${v.reasons.join('; ')}`)
          .join('\n')}${f.audits.image_violations.length > 5 ? `\n  ...and ${f.audits.image_violations.length - 5} more` : ''}`,
    )
    .join('\n') || '  (no findings)'
}

## P3.3 — JS bundle budget exceeded (${p33Findings.length} URL(s) over 100KB JS)

${
  p33Findings
    .map(
      (f) =>
        `- **${f.url}**: ${f.audits.js_bundle_violation.transferred_kb}KB transferred (budget ${f.audits.js_bundle_violation.budget_kb}KB, over by ${f.audits.js_bundle_violation.over_by_kb}KB, ${f.audits.js_bundle_violation.request_count} requests)`,
    )
    .join('\n') || '  (no findings)'
}

## P3.4 — Third-party script TBT budget exceeded (${p34Findings.length} URL(s) over ${THIRD_PARTY_TBT_BUDGET_MS}ms)

${
  p34Findings
    .map(
      (f) =>
        `- **${f.url}**: ${f.audits.third_party_violation.total_blocking_ms}ms total blocking (budget ${f.audits.third_party_violation.budget_ms}ms)\n${f.audits.third_party_violation.per_entity
          .slice(0, 5)
          .map((e) => `  - ${e.entity}: ${e.blocking_ms}ms / ${e.transfer_kb}KB`)
          .join('\n')}`,
    )
    .join('\n') || '  (no findings)'
}

## P3.5 — A11y violations (${p35Findings.length} URL(s) with a11y issues)

${
  p35Findings
    .map(
      (f) =>
        `- **${f.url}**\n${f.audits.a11y_violations
          .slice(0, 5)
          .map(
            (v) =>
              `  - [${v.impact}] ${v.id}: ${v.title} (${v.node_count} node${v.node_count !== 1 ? 's' : ''})`,
          )
          .join('\n')}${f.audits.a11y_violations.length > 5 ? `\n  ...and ${f.audits.a11y_violations.length - 5} more` : ''}`,
    )
    .join('\n') || '  (no findings)'
}
`.trim();

  await writeInboxItem({
    siteDir,
    routine: ROUTINE_ID,
    routineVersion: ROUTINE_VERSION,
    topic: 'lighthouse-lab-findings',
    site: siteName,
    trigger: `${p31Findings.length} score / ${p32Findings.length} image / ${p33Findings.length} JS-bundle / ${p34Findings.length} 3rd-party / ${p35Findings.length} a11y URL(s) with findings`,
    whatITried: `Ran PageSpeed Insights (${strategy}) against ${urlsToTest.length} URLs from sites/${siteName}/_baselines/sitemap.xml. Each URL's full PSI response persisted to sites/${siteName}/_baselines/lighthouse/${strategy}/{url-slug}-${dateIso}.json (8-week retention; older snapshots pruned).\n\nDerived findings:\n\n${report}`,
    whatINeed: `Per-section action:\n\n- **P3.1 score gaps:** for any "below floor" finding, identify the top opportunities (PSI report's "Opportunities" section) and apply via /refresh or per-site code changes. Regressions get higher priority than steady-state gaps — something changed in the last week.\n\n- **P3.2 image violations:** compress to WebP/AVIF (target < 100KB), add explicit width/height attributes (eliminates CLS), ensure srcset for above-the-fold images.\n\n- **P3.3 JS bundle:** investigate which routes exceed 100KB transferred JS. Use the Lovable build output (sites with Vite) or the framework's bundle analyzer to identify the heavy chunks. Consider route-level code splitting or lazy-loading of below-the-fold components.\n\n- **P3.4 third-party scripts:** identify which entities (GTM, GA4, GBP widget, etc.) are blocking. Move analytics to Partytown / Web Worker if not already, or defer non-critical scripts to onLoad.\n\n- **P3.5 a11y violations:** address every Lighthouse-flagged a11y rule. High-impact rules (color-contrast, button-name, image-alt, link-name) are blockers for Lighthouse 100. Per spec, Lighthouse uses axe-core under the hood — these findings are equivalent to running axe-core directly.`,
    contextLinks: [
      `sites/${siteName}/_baselines/lighthouse/${strategy}/`,
      `sites/${siteName}/_baselines/sitemap.xml`,
    ],
  });

  return {
    siteName,
    escalated: true,
    urlsTested: urlsToTest.length,
    findings: {
      p31: p31Findings.length,
      p32: p32Findings.length,
      p33: p33Findings.length,
      p34: p34Findings.length,
      p35: p35Findings.length,
    },
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
        escalations.push(
          `${site}: ${result.findings.p31}/${result.findings.p32}/${result.findings.p33}/${result.findings.p34}/${result.findings.p35} URLs with P3.1/3.2/3.3/3.4/3.5 findings`,
        );
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
