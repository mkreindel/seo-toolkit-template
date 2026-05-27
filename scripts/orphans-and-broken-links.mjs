#!/usr/bin/env node
/**
 * scripts/orphans-and-broken-links.mjs
 *
 * portfolio-monthly-orphans-and-broken-links cron (Q9).
 * 5th of month, 09:00 CDT — per site: crawl sitemap, extract internal links
 * per URL, build inbound-link map, flag orphans (sitemap URLs with 0 inbound).
 *
 * Plan 3 Task E.2. routine_version: 1.0.
 */
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { appendRun, recordSuccess, recordFailure, checkBackoff } from './lib/audit-log.mjs';
import { writeInboxItem } from './lib/cron-mode.mjs';
import { parseSitemap } from './lib/sitemap.mjs';

const ROUTINE_VERSION = '1.1';
const ROUTINE_ID = 'portfolio-monthly-orphans-and-broken-links';
const SITES_DIR = path.resolve('sites');
const HOMEPAGE_PATTERNS = ['/', '/index.html', '/index.htm'];

// P2.3 — link equity gradient thresholds
const MIN_INBOUND_FOR_RANKING_PAGES = 5;  // Pages targeting ≥ 100 vol kw need 5+ inbound
const MIN_VOLUME_FOR_GRADIENT_CHECK = 100; // Only enforce on pages with real volume

export function extractInternalLinks(html, siteOrigin) {
  const origin = new URL(siteOrigin).origin;
  const matches = html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi);
  const links = new Set();
  for (const m of matches) {
    const href = m[1];
    if (
      href.startsWith('#') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      href.startsWith('javascript:')
    ) {
      continue;
    }
    try {
      const resolved = new URL(href, siteOrigin);
      if (resolved.origin === origin) {
        links.add(resolved.href.split('#')[0]);
      }
    } catch {
      // Skip invalid URLs
    }
  }
  return [...links];
}

export function findOrphans(sitemapUrls, inboundLinksMap) {
  return sitemapUrls.filter((url) => {
    let p;
    try {
      p = new URL(url).pathname;
    } catch {
      p = url;
    }
    if (HOMEPAGE_PATTERNS.includes(p)) return false;
    return (inboundLinksMap.get(url) || []).length === 0;
  });
}

/**
 * P2.3 — Link equity gradient detector.
 *
 * Walks every URL in the sitemap that targets a keyword with volume ≥ N
 * (default 100/mo). Flags URLs with fewer than 5 inbound internal links. Each
 * flagged URL gets ranked donor suggestions: pages that (a) topically overlap
 * with the target, (b) already have outbound capacity (≤ 10 outbound to
 * preserve link equity per outbound), and (c) don't yet link to the target.
 *
 * usedKeywords is the parsed used-keywords.md as { url: { keyword, volume } }.
 * Returns an array of {url, target_keyword, volume, inbound_count, donors}.
 */
export function findUnderlinkedPages(
  sitemapUrls,
  inboundLinksMap,
  outboundLinksMap,
  usedKeywords,
  opts = {},
) {
  const {
    minInbound = MIN_INBOUND_FOR_RANKING_PAGES,
    minVolume = MIN_VOLUME_FOR_GRADIENT_CHECK,
    maxDonorOutbound = 10,
    maxDonorsPerPage = 5,
  } = opts;

  const flagged = [];

  for (const url of sitemapUrls) {
    let pathOnly;
    try {
      pathOnly = new URL(url).pathname;
    } catch {
      pathOnly = url;
    }
    if (HOMEPAGE_PATTERNS.includes(pathOnly)) continue;

    const inboundCount = (inboundLinksMap.get(url) || []).length;
    if (inboundCount === 0) continue; // Orphans already handled by findOrphans
    if (inboundCount >= minInbound) continue;

    const kwEntry = usedKeywords[url];
    if (!kwEntry || (kwEntry.volume || 0) < minVolume) continue;

    // Suggest donor pages: not already linking to target, has outbound capacity,
    // topically related (heuristic: shares ≥ 1 token with target keyword in URL path)
    const targetTokens = new Set(kwEntry.keyword.toLowerCase().split(/\s+/));
    const existingDonors = new Set(inboundLinksMap.get(url) || []);

    const donorCandidates = sitemapUrls
      .filter((candidate) => {
        if (candidate === url) return false;
        if (existingDonors.has(candidate)) return false;
        const outboundCount = (outboundLinksMap.get(candidate) || []).length;
        if (outboundCount > maxDonorOutbound) return false;
        // Topic match: any keyword-token appears in candidate URL path
        let candPath;
        try {
          candPath = new URL(candidate).pathname.toLowerCase();
        } catch {
          candPath = candidate.toLowerCase();
        }
        return Array.from(targetTokens).some((t) => t.length > 2 && candPath.includes(t));
      })
      .slice(0, maxDonorsPerPage);

    flagged.push({
      url,
      target_keyword: kwEntry.keyword,
      volume: kwEntry.volume,
      inbound_count: inboundCount,
      donors: donorCandidates,
    });
  }

  return flagged.sort((a, b) => (b.volume || 0) - (a.volume || 0));
}

/**
 * Parse used-keywords.md into { url: { keyword, volume } } map.
 * The file format is markdown with rows like:
 *   | /blog/foo | foo bar baz | 320 | ... |
 * or YAML-ish key:value pairs. This parser handles the common pipe-table
 * format; sites with custom formats can override via _baselines/used-keywords.json.
 */
export async function loadUsedKeywords(siteDir) {
  const overridePath = path.join(siteDir, '_baselines', 'used-keywords.json');
  try {
    return JSON.parse(await fs.readFile(overridePath, 'utf8'));
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }

  const file = path.join(siteDir, 'used-keywords.md');
  let raw;
  try {
    raw = await fs.readFile(file, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return {};
    throw err;
  }

  const map = {};
  for (const line of raw.split('\n')) {
    // Pipe-table format: | /path | keyword | volume | ...
    const m = line.match(/^\|\s*(\/[^|]+?)\s*\|\s*([^|]+?)\s*\|\s*(\d+)\s*\|/);
    if (m) {
      const [, urlPath, keyword, volume] = m;
      map[urlPath.trim()] = { keyword: keyword.trim(), volume: parseInt(volume, 10) };
    }
  }
  return map;
}

async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEO-Toolkit-Crawler/1.0)' },
    });
    if (!res.ok) return { url, status: res.status, ok: false };
    const html = await res.text();
    return { url, status: 200, ok: true, html };
  } catch (err) {
    return { url, status: 0, ok: false, error: err.message };
  }
}

async function analyzeSite(siteName) {
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

  const siteOrigin = new URL(urls[0]).origin;
  const inboundLinksMap = new Map(urls.map((u) => [u, []]));
  const outboundLinksMap = new Map(urls.map((u) => [u, []]));
  const fetchErrors = [];

  for (const url of urls) {
    const result = await fetchPage(url);
    if (!result.ok) {
      fetchErrors.push({ url, status: result.status, error: result.error });
      continue;
    }
    const internalLinks = extractInternalLinks(result.html, siteOrigin);
    outboundLinksMap.set(url, internalLinks);
    for (const link of internalLinks) {
      if (inboundLinksMap.has(link)) {
        inboundLinksMap.get(link).push(url);
      }
    }
  }

  const orphans = findOrphans(urls, inboundLinksMap);

  // P2.3 — underlinked ranking pages (0 < inbound < 5 on pages with ≥ 100 vol kw)
  const usedKeywords = await loadUsedKeywords(siteDir);
  // Normalize sitemap URLs against used-keywords paths (URL ↔ path)
  const usedKeywordsByUrl = {};
  for (const [pathKey, entry] of Object.entries(usedKeywords)) {
    const fullUrl = new URL(pathKey, siteOrigin).href;
    usedKeywordsByUrl[fullUrl] = entry;
  }
  const underlinked = findUnderlinkedPages(
    urls,
    inboundLinksMap,
    outboundLinksMap,
    usedKeywordsByUrl,
  );

  const issues = [];
  if (orphans.length) issues.push(`${orphans.length} orphan page(s)`);
  if (underlinked.length) issues.push(`${underlinked.length} underlinked ranking page(s)`);
  if (fetchErrors.length) issues.push(`${fetchErrors.length} pages returned non-200`);

  if (issues.length) {
    const underlinkedReport = underlinked.length
      ? `\n\nUnderlinked ranking pages (0 < inbound < ${MIN_INBOUND_FOR_RANKING_PAGES}, targeting kw with ≥ ${MIN_VOLUME_FOR_GRADIENT_CHECK} vol/mo):\n${underlinked
          .map(
            (u) =>
              `  - ${u.url}\n    target: "${u.target_keyword}" (${u.volume}/mo)\n    inbound: ${u.inbound_count} (need ≥ ${MIN_INBOUND_FOR_RANKING_PAGES})\n    suggested donors:\n${u.donors.length ? u.donors.map((d) => `      - ${d}`).join('\n') : '      (none surfaced — manual donor selection required)'}`,
          )
          .join('\n')}`
      : '';

    await writeInboxItem({
      siteDir,
      routine: ROUTINE_ID,
      routineVersion: ROUTINE_VERSION,
      topic: 'orphans-or-broken-links',
      site: siteName,
      trigger: issues.join('; '),
      whatITried: `Crawled ${urls.length} URLs from baseline sitemap. Extracted internal links per page. Built inbound-link map.\n\nOrphan pages (in sitemap but 0 inbound internal links):\n${orphans.map((o) => `  - ${o}`).join('\n') || '  (none)'}${underlinkedReport}\n\nPages that returned non-200:\n${fetchErrors.map((e) => `  - ${e.url} → ${e.status}${e.error ? ` (${e.error})` : ''}`).join('\n') || '  (none)'}`,
      whatINeed: `For each orphan: (a) add an internal link from a relevant page (preferred — improves link equity); or (b) remove the URL from the sitemap if it's intentionally unlisted; or (c) confirm it's a "secret" page that should stay in the sitemap regardless.\n\nFor each underlinked ranking page: add internal links from the suggested donors (or your own selection of topically-related high-authority pages). Each underlinked page targeting a high-volume keyword is leaving rankings on the table — Google uses internal link counts as a topical-authority signal.\n\nFor non-200 pages: investigate the cause (404, 410, redirect chain, transient timeout).`,
      contextLinks: [
        `sites/${siteName}/_baselines/sitemap.xml`,
        `sites/${siteName}/used-keywords.md`,
      ],
    });
    return {
      siteName,
      escalated: true,
      orphans: orphans.length,
      underlinked: underlinked.length,
      fetchErrors: fetchErrors.length,
    };
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
      const result = await analyzeSite(site);
      if (result.escalated) {
        escalations.push(
          `${site}: ${result.orphans} orphans, ${result.underlinked || 0} underlinked, ${result.fetchErrors} non-200`,
        );
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

    console.log(`Analyzed ${sites.length} sites. Escalations: ${escalations.length}.`);
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
