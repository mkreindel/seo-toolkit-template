/**
 * scripts/lib/semrush-api.mjs
 *
 * Shared SEMrush API helpers for cron-mode scripts (P2.2 ranking decline,
 * P2.4 SERP feature tracking). Adapter pattern around the v3 + Analytics
 * endpoints already wired in scripts/semrush.mjs.
 *
 * Why this lives separately from semrush.mjs: that script is a CLI wrapper
 * that prints JSON to stdout. This module is the programmatic interface
 * used by cron scripts (semrush-poll.mjs, serp-feature-tracker.mjs).
 *
 * API unit cost reference (verify on first run; SEMrush sometimes changes):
 *   phrase_organic       — 10 units per call
 *   phrase_kdi           — 50 units per call (includes KD + some SERP features)
 *   phrase_these         — 50 units per call (full SERP features)
 *
 * Budget planning: ~30 tracked keywords × 4 sites × 4 weeks = 480 calls/mo.
 * Even at the most expensive endpoint (50 units), that's 24K units/mo.
 */
import 'dotenv/config';

const V3_BASE = 'https://api.semrush.com/';
const ANALYTICS_BASE = 'https://api.semrush.com/analytics/v1/';

function parseCsv(text) {
  const lines = text.replace(/\r/g, '').trim().split('\n').filter(Boolean);
  if (!lines.length) return [];
  const header = lines[0].split(';');
  return lines.slice(1).map((row) => {
    const cells = row.split(';');
    return Object.fromEntries(header.map((h, i) => [h, cells[i]]));
  });
}

async function call(base, params) {
  const key = process.env.SEMRUSH_API_KEY;
  if (!key) throw new Error('SEMRUSH_API_KEY missing from env');
  const url = new URL(base);
  for (const [k, v] of Object.entries({ key, ...params })) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url);
  const text = await res.text();
  if (text.includes('NOTHING FOUND')) return '';
  if (!res.ok || text.startsWith('ERROR')) {
    throw new Error(`SEMrush ${res.status}: ${text.slice(0, 300)}`);
  }
  return text;
}

/**
 * Fetch top organic SERP results for a keyword.
 * Returns array of { Dn (domain), Ur (url), Po (position) } objects.
 *
 * Uses `phrase_organic` endpoint. **Cost: 10 API units PER ROW returned**
 * (not per call). Limit defaults to 30 because:
 *   - Anything below #30 doesn't influence refresh-trigger logic (a page
 *     ranking #80 vs #95 is "deep" either way; we mark as null).
 *   - 30 rows × 10 units = 300 units/call. For 22 keywords across 3 sites
 *     that's ~6,600 units per cron firing (well under typical 100k/mo plan
 *     allotments).
 *   - Higher limits 10× the cost (limit=100 = 1000 units/call).
 *
 * Callers needing deeper SERP can override via opts.limit but should
 * pre-flight check the quota via fetchApiUnitsRemaining().
 */
export async function fetchPhraseSerp(phrase, opts = {}) {
  const { database = 'us', limit = 30 } = opts;
  const text = await call(V3_BASE, {
    type: 'phrase_organic',
    phrase,
    database,
    display_limit: String(limit),
    export_columns: 'Dn,Ur,Po',
  });
  // SEMrush returns CSV with FULL field names in the header
  // (Domain;Url;Position), not the codes used in export_columns. Map by name.
  return parseCsv(text).map((r) => ({
    domain: r.Domain,
    url: r.Url,
    position: parseInt(r.Position, 10),
  }));
}

/**
 * Fetch keyword difficulty + extended phrase metadata (50 units/call).
 * Returns { kd, volume, cpc, competition, results, trend } if available.
 *
 * NOT used for SERP features directly — phrase_kdi doesn't always include
 * the feature flags. For real SERP features, use fetchPhraseSerpFeatures.
 */
export async function fetchPhraseKdi(phrase, opts = {}) {
  const { database = 'us' } = opts;
  const text = await call(V3_BASE, {
    type: 'phrase_kdi',
    phrase,
    database,
    export_columns: 'Ph,Kd',
  });
  const rows = parseCsv(text);
  if (!rows[0]) return null;
  // Phrase = Keyword, Kd = "Keyword Difficulty Index" (header names per SEMrush docs)
  return {
    phrase: rows[0].Keyword || rows[0].Ph,
    kd: parseFloat(rows[0]['Keyword Difficulty Index'] || rows[0].Kd) || null,
  };
}

/**
 * Find the site's best-ranking URL + position for a keyword in the SERP.
 *
 * "Best" = lowest position number (closest to #1). If the same domain has
 * multiple ranking URLs, returns the highest-ranking one. Returns null if
 * the domain is not in the SERP results.
 */
export function extractPositionForDomain(serpResults, siteDomain) {
  const normalized = (d) => (d || '').toLowerCase().replace(/^www\./, '');
  const target = normalized(siteDomain);
  const matches = serpResults.filter((r) => normalized(r.domain) === target);
  if (matches.length === 0) return null;
  return matches.reduce((best, cur) => (cur.position < best.position ? cur : best));
}

/**
 * P2.2 — Fetch positions for a list of keywords. The shape matches what
 * scripts/semrush-poll.mjs `fetchCampaignRankings()` is documented to return.
 *
 * @param {string} siteDomain — bare domain (e.g., "example.com")
 * @param {string[]} keywords — list of keywords to look up
 * @param {object} opts — { database = 'us' }
 * @returns {Promise<{ keyword_urls: {[kw]: url|null}, positions: {[kw]: position|null} }>}
 *
 * Keywords not found in top 100 get position=null (so the rolling history
 * stays consistent — null means "ranked beyond 100, or not at all").
 *
 * Implementation note: parallelism is intentional but capped (default 5) to
 * respect SEMrush rate limits. Each call is independent (no dependency
 * between keywords).
 */
export async function fetchRankingsForKeywords(siteDomain, keywords, opts = {}) {
  const { database = 'us', concurrency = 5, minUnitsRequired = 1000 } = opts;
  const keyword_urls = {};
  const positions = {};

  // Pre-flight quota check — bail early if quota too low to complete the
  // batch. Estimate: ~300 units per keyword (30-row top-N at 10 units/row),
  // plus a 1000-unit safety floor so we don't exhaust the account.
  const estimatedCost = keywords.length * 300;
  const units = await fetchApiUnitsRemaining();
  if (units < estimatedCost + minUnitsRequired) {
    throw new Error(
      `SEMrush API quota too low: ${units} units remaining, need ~${estimatedCost + minUnitsRequired} to safely process ${keywords.length} keywords (300/kw + ${minUnitsRequired} floor). Skipping this run.`,
    );
  }

  // Simple concurrency throttle
  const queue = [...keywords];
  const workers = new Array(Math.min(concurrency, queue.length)).fill(null).map(async () => {
    while (queue.length > 0) {
      const kw = queue.shift();
      if (!kw) break;
      try {
        // limit=30 — top-30 is the meaningful range; deeper ranking is recorded
        // as null (consistent with "not in top X" semantics downstream).
        const serp = await fetchPhraseSerp(kw, { database, limit: 30 });
        const match = extractPositionForDomain(serp, siteDomain);
        positions[kw] = match ? match.position : null;
        keyword_urls[kw] = match ? match.url : null;
      } catch (err) {
        // Individual keyword failure shouldn't kill the batch — log + skip
        console.error(`SEMrush phrase_organic failed for "${kw}": ${err.message}`);
        positions[kw] = null;
        keyword_urls[kw] = null;
      }
    }
  });
  await Promise.all(workers);

  return { keyword_urls, positions };
}

/**
 * P2.4 — Best-effort SERP feature detection for a keyword.
 *
 * SEMrush's public v3 API does NOT expose per-feature presence flags
 * directly (those require the SERP Features API which is Business+ tier).
 * This function uses available signals as a proxy:
 *
 *   - featured_snippet: heuristic — if a single URL ranks #1 with much
 *     higher Po-gap than typical, treat as snippet-captured. Not reliable.
 *   - paa: not detectable from phrase_organic. Returns null.
 *   - image_pack, video, knowledge_panel, aio, local_pack, sitelinks:
 *     not detectable from phrase_organic. Return null.
 *
 * For now this returns an "incomplete" result and the cron logs it. The
 * cron's deriveAudits() handles null/missing features gracefully (treats
 * them as "feature unknown" rather than "feature absent").
 *
 * When SEMrush SERP Features API access becomes available, replace this
 * function with a call to phrase_serp_features (no other code changes
 * needed — the return shape stays the same).
 *
 * @param {string} keyword
 * @param {object} opts — { database = 'us' }
 * @returns {Promise<{ site: object, competitors: array }>}
 */
export async function fetchPhraseSerpFeatures(keyword, opts = {}) {
  const { database = 'us', siteDomain, topCompetitorCount = 5 } = opts;
  const serp = await fetchPhraseSerp(keyword, { database, limit: 10 });

  const normalized = (d) => (d || '').toLowerCase().replace(/^www\./, '');
  const target = normalized(siteDomain);

  // For now: features stays null (unknown) because the v3 API doesn't expose
  // them. Logging the SERP composition lets the cron escalate "feature
  // detection unavailable — Business+ tier required" rather than misleading
  // no-gap results.
  const site = serp.find((r) => normalized(r.domain) === target) || null;
  const competitors = serp
    .filter((r) => normalized(r.domain) !== target)
    .slice(0, topCompetitorCount)
    .map((r) => ({
      domain: r.domain,
      url: r.url,
      position: r.position,
      features: {},
    }));

  return {
    site: site ? { url: site.url, position: site.position, features: {} } : null,
    competitors,
    _api_limitation: 'phrase-feature flags require SEMrush SERP Features API (Business+ tier)',
  };
}

/**
 * Cheap API-units check — returns remaining units. Use as a pre-flight
 * before large batches.
 */
export async function fetchApiUnitsRemaining() {
  const key = process.env.SEMRUSH_API_KEY;
  if (!key) throw new Error('SEMRUSH_API_KEY missing from env');
  const url = new URL('https://www.semrush.com/users/countapiunits.html');
  url.searchParams.set('key', key);
  const res = await fetch(url);
  const text = (await res.text()).trim();
  if (!res.ok) throw new Error(`units check HTTP ${res.status}: ${text}`);
  return Number(text);
}
