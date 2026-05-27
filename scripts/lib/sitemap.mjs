/**
 * scripts/lib/sitemap.mjs
 *
 * Pure-function helpers for parsing + diffing sitemap.xml files.
 * Used by scripts/sitemap-diff.mjs (Q3 cron routine).
 */
import xml2js from 'xml2js';

/**
 * Parse a sitemap.xml string into an array of `<loc>` URLs.
 * Handles xml2js's array-vs-single-object quirk for single-URL sitemaps.
 */
export async function parseSitemap(xmlString) {
  const parsed = await xml2js.parseStringPromise(xmlString, { explicitArray: false });
  const urlset = parsed.urlset?.url;
  if (!urlset) return [];
  const urls = Array.isArray(urlset) ? urlset : [urlset];
  return urls.map((u) => u.loc).filter(Boolean);
}

/**
 * Diff two URL arrays. Returns {added, removed} sets relative to baseline.
 */
export function diffSitemaps(baselineUrls, currentUrls) {
  const baseline = new Set(baselineUrls);
  const current = new Set(currentUrls);
  return {
    added: [...current].filter((u) => !baseline.has(u)),
    removed: [...baseline].filter((u) => !current.has(u)),
  };
}
