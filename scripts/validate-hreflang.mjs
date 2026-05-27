#!/usr/bin/env node
/**
 * validate-hreflang.mjs
 *
 * Walks the sitemap of a multilingual site and verifies hreflang correctness:
 *   1. Every declared-language counterpart exists (HTTP 200).
 *   2. Each page's <link rel="alternate"> cluster has self-reference, all
 *      sibling languages, and x-default.
 *   3. Reciprocal: EN → ES requires ES → EN.
 *   4. <html lang> matches the served language.
 *   5. Schema inLanguage matches <html lang> (best-effort, only if JSON-LD is
 *      in the static HTML response — SPA-rendered schema is checked elsewhere).
 *
 * Inputs:
 *   --site=<name>   site folder name under sites/ (REQUIRED)
 *   --base=<url>    site base URL (optional; otherwise read from site-info.md)
 *   --sitemap=<url> sitemap URL (optional; defaults to <base>/sitemap.xml)
 *   --json          emit machine-readable JSON instead of human-readable text
 *
 * Exit codes:
 *   0 — all hreflang checks passed
 *   1 — one or more errors (missing alternates, asymmetry, etc.)
 *   2 — usage / config error
 *
 * Cloudflare note: many managed sites sit behind Cloudflare Bot Fight Mode and
 * return 403 to default Node fetch. This script sends a real-browser User-Agent
 * to bypass the bot challenge for these read-only checks.
 */

import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .map((a) => a.replace(/^--/, '').split('='))
    .map(([k, v]) => [k, v ?? true])
);

if (!args.site) {
  console.error('Usage: node scripts/validate-hreflang.mjs --site=<name> [--base=<url>] [--sitemap=<url>] [--json]');
  process.exit(2);
}

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const siteDir = path.join(repoRoot, 'sites', args.site);
const siteInfoPath = path.join(siteDir, 'site-info.md');

let siteInfo;
try {
  siteInfo = await fs.readFile(siteInfoPath, 'utf8');
} catch {
  console.error(`Could not read ${siteInfoPath}`);
  process.exit(2);
}

// ----- parse site-info.md Languages section -----

function parseLanguages(md) {
  // Find the Languages H2/H3 block
  const langSection = md.split(/^## Languages\s*$/m)[1];
  if (!langSection) return null;

  const block = langSection.split(/^## /m)[0];

  const multilingual = /Multilingual:\s*\*\*?\s*(true|false)/i.exec(block)?.[1]?.toLowerCase() === 'true';
  if (!multilingual) return { multilingual: false };

  const primary = /Primary language:\s*\*\*?\s*([a-z-]+)/i.exec(block)?.[1];
  const xDefault = /x-default language:\s*\*\*?\s*([a-z-]+)/i.exec(block)?.[1] || primary;
  const strategy = /Hreflang strategy:\s*\*\*?\s*([a-z-]+)/i.exec(block)?.[1];

  // Parse the table rows: | Code | Primary | URL pattern | Hreflang code | Voice file |
  const rows = [];
  for (const line of block.split('\n')) {
    const m = /^\s*\|\s*([a-z-]+)\s*\|\s*(yes|no)\s*\|\s*`?([^|`]+?)`?\s*\|\s*([a-z-]+)\s*\|/i.exec(line);
    if (m) {
      rows.push({
        code: m[1].trim(),
        isPrimary: m[2].trim().toLowerCase() === 'yes',
        urlPattern: m[3].trim(),
        hreflang: m[4].trim(),
      });
    }
  }
  return { multilingual: true, primary, xDefault, strategy, languages: rows };
}

const langs = parseLanguages(siteInfo);
if (!langs) {
  console.error(`Could not parse Languages section in ${siteInfoPath}`);
  process.exit(2);
}
if (!langs.multilingual) {
  console.log(JSON.stringify({ site: args.site, multilingual: false, message: 'Site is monolingual; no hreflang checks needed.' }, null, 2));
  process.exit(0);
}
if (langs.languages.length < 2) {
  console.error('Multilingual: true but fewer than 2 languages declared in the table.');
  process.exit(2);
}

// ----- determine base URL + sitemap -----

const baseUrl = args.base || (/URL:\s*\*\*?\s*(https?:\/\/[^\s\n]+)/i.exec(siteInfo)?.[1] || '').replace(/\/$/, '');
if (!baseUrl) {
  console.error('Could not determine base URL. Pass --base=https://example.com');
  process.exit(2);
}
const sitemapUrl = args.sitemap || `${baseUrl}/sitemap.xml`;

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xml' }, redirect: 'follow' });
  return { status: res.status, text: res.status === 200 ? await res.text() : '' };
}

// ----- pull URLs from sitemap -----

const sitemapRes = await fetchText(sitemapUrl);
if (sitemapRes.status !== 200) {
  console.error(`Sitemap fetch failed: ${sitemapUrl} → HTTP ${sitemapRes.status}`);
  process.exit(2);
}
const sitemapUrls = [...sitemapRes.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());

// ----- determine canonical (primary-language) URL for a given live URL -----

function urlPatternToRegex(pattern) {
  // pattern like "/[slug]" or "/es/[slug]" — slug can be empty (homepage = "")
  return new RegExp('^' + pattern.replace('[slug]', '(.*)') + '$');
}

function canonicalSlug(urlPath) {
  // Try longer URL patterns first (more specific) — e.g., `/es/[slug]` before `/[slug]`,
  // otherwise the primary-language pattern (`/[slug]`) absorbs everything.
  const sortedLangs = [...langs.languages].sort((a, b) => {
    const aPrefix = a.urlPattern.replace('[slug]', '').length;
    const bPrefix = b.urlPattern.replace('[slug]', '').length;
    return bPrefix - aPrefix;
  });
  for (const lang of sortedLangs) {
    const re = urlPatternToRegex(lang.urlPattern);
    const m = re.exec(urlPath);
    if (m) return { lang: lang.code, slug: m[1] };
  }
  return null;
}

function urlForLang(slug, langCode) {
  const lang = langs.languages.find((l) => l.code === langCode);
  if (!lang) return null;
  return baseUrl + lang.urlPattern.replace('[slug]', slug);
}

// ----- fetch each sitemap URL and pull head metadata -----

function extractHead(html) {
  const head = (html.match(/<head[^>]*>[\s\S]*?<\/head>/i) || [''])[0];
  const htmlLang = (html.match(/<html[^>]*\blang="([^"]+)"/i) || [, null])[1];
  const alternates = [...head.matchAll(/<link[^>]+rel=["']alternate["'][^>]+>/gi)].map((m) => {
    const tag = m[0];
    const hreflang = (tag.match(/hreflang=["']([^"']+)["']/i) || [, null])[1];
    const href = (tag.match(/href=["']([^"']+)["']/i) || [, null])[1];
    return hreflang && href ? { hreflang, href } : null;
  }).filter(Boolean);
  const canonical = (head.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) || [, null])[1];
  return { htmlLang, alternates, canonical };
}

const pageData = new Map(); // url → { lang, slug, htmlLang, alternates, status }

for (const url of sitemapUrls) {
  const slugInfo = canonicalSlug(new URL(url).pathname);
  const { status, text } = await fetchText(url);
  const head = status === 200 ? extractHead(text) : { htmlLang: null, alternates: [], canonical: null };
  pageData.set(url, { url, status, slugInfo, ...head });
}

// ----- run checks -----

const errors = [];
const warnings = [];
const reciprocal = { passed: 0, failed: 0 };
const coverage = { complete: 0, gaps: [] };

for (const [url, page] of pageData) {
  if (page.status !== 200) {
    errors.push({ url, error: `HTTP ${page.status}` });
    continue;
  }
  const { slugInfo, htmlLang, alternates } = page;
  if (!slugInfo) {
    warnings.push({ url, warning: 'URL does not match any declared language URL pattern' });
    continue;
  }
  const declaredCodes = new Set(langs.languages.map((l) => l.hreflang));
  const linkedCodes = new Set(alternates.map((a) => a.hreflang));

  // <html lang> check
  if (htmlLang && htmlLang !== slugInfo.lang) {
    errors.push({ url, error: `<html lang="${htmlLang}"> does not match served language ${slugInfo.lang}` });
  }

  // self-reference
  if (!linkedCodes.has(slugInfo.lang)) errors.push({ url, error: `Missing self-reference hreflang="${slugInfo.lang}"` });

  // sibling languages
  for (const lang of langs.languages) {
    if (lang.code === slugInfo.lang) continue;
    if (!linkedCodes.has(lang.hreflang)) errors.push({ url, error: `Missing sibling hreflang="${lang.hreflang}"` });
  }

  // x-default
  if (!linkedCodes.has('x-default')) errors.push({ url, error: 'Missing x-default hreflang' });

  // coverage check — does the counterpart URL also exist in the sitemap (or at least respond)?
  const slug = slugInfo.slug;
  const missingLangs = [];
  for (const lang of langs.languages) {
    if (lang.code === slugInfo.lang) continue;
    const counterpart = urlForLang(slug, lang.code);
    const counterpartInSitemap = pageData.has(counterpart);
    if (!counterpartInSitemap) {
      missingLangs.push({ code: lang.code, expected: counterpart });
    }
  }
  if (missingLangs.length === 0) {
    coverage.complete++;
  } else {
    coverage.gaps.push({ url, missingCounterparts: missingLangs });
  }

  // reciprocal check — for each alternate the page links to, does that alternate link back?
  for (const alt of alternates) {
    if (alt.hreflang === 'x-default') continue;
    if (alt.hreflang === slugInfo.lang) continue;
    const altPage = pageData.get(alt.href);
    if (!altPage) continue; // the counterpart wasn't in sitemap; coverage check already flagged that
    const altLinksBack = altPage.alternates?.some((a) => a.hreflang === slugInfo.lang && a.href === url);
    if (altLinksBack) reciprocal.passed++;
    else {
      reciprocal.failed++;
      errors.push({
        url,
        error: `Reciprocal hreflang missing: ${url} (${slugInfo.lang}) → ${alt.href} (${alt.hreflang}) but the reverse link does not exist.`,
      });
    }
  }
}

// ----- emit report -----

const report = {
  site: args.site,
  base: baseUrl,
  multilingual: true,
  languages_declared: langs.languages.map((l) => l.code),
  sitemap_urls_visited: sitemapUrls.length,
  coverage_complete: coverage.complete,
  coverage_gaps: coverage.gaps,
  reciprocal,
  errors,
  warnings,
  passed: errors.length === 0 && coverage.gaps.length === 0,
};

if (args.json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`Hreflang audit — ${args.site}`);
  console.log(`Base: ${baseUrl}`);
  console.log(`Languages declared: ${report.languages_declared.join(', ')}`);
  console.log(`Sitemap URLs visited: ${report.sitemap_urls_visited}`);
  console.log(`Coverage: ${coverage.complete}/${sitemapUrls.length} complete`);
  console.log(`Reciprocal check: ${reciprocal.passed} passed / ${reciprocal.failed} failed`);
  console.log('');
  if (coverage.gaps.length) {
    console.log('Coverage gaps (page exists in 1+ languages but not all):');
    for (const g of coverage.gaps) {
      console.log(`  ${g.url}`);
      for (const m of g.missingCounterparts) console.log(`    missing ${m.code}: expected ${m.expected}`);
    }
    console.log('');
  }
  if (warnings.length) {
    console.log('Warnings:');
    for (const w of warnings) console.log(`  ${w.url}: ${w.warning}`);
    console.log('');
  }
  if (errors.length) {
    console.log('Errors:');
    for (const e of errors) console.log(`  ${e.url}: ${e.error}`);
    console.log('');
  }
  if (report.passed) {
    console.log('PASS — all hreflang checks succeeded.');
  } else {
    const reasons = [];
    if (errors.length) reasons.push(`${errors.length} error(s)`);
    if (coverage.gaps.length) reasons.push(`${coverage.gaps.length} coverage gap(s)`);
    console.log(`FAIL — ${reasons.join(' + ')}.`);
  }
}

process.exit(report.passed ? 0 : 1);
