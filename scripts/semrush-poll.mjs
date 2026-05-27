#!/usr/bin/env node
/**
 * scripts/semrush-poll.mjs
 *
 * portfolio-weekly-rankings cron (Q2).
 * Mon 08:00 CDT — pulls SEMrush Position Tracking for every site with a
 * campaign, detects rank movements >= 5 positions and new top-10 entries,
 * writes "Rankings — week of YYYY-MM-DD" entry to each site's notes.md.
 *
 * Plan 2 Task C.7. routine_version: 1.0.
 */
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { appendRun, recordSuccess, recordFailure, checkBackoff } from './lib/audit-log.mjs';
import { writeInboxItem } from './lib/cron-mode.mjs';
import { fetchRankingsForKeywords } from './lib/semrush-api.mjs';

const ROUTINE_VERSION = '1.1';
const ROUTINE_ID = 'portfolio-weekly-rankings';
const SITES_DIR = path.resolve('sites');

/**
 * Pure-function: compare previous vs. current week's rank-by-keyword maps and
 * return the changes that exceed the threshold OR are new top-10 entries.
 */
export function detectRankingChanges(previousWeek, currentWeek, opts = {}) {
  const { threshold = 5 } = opts;
  const changes = [];

  for (const [keyword, pos] of Object.entries(currentWeek)) {
    const prev = previousWeek[keyword];
    if (prev === undefined && pos <= 10) {
      changes.push({ keyword, position: pos, delta: null, new_entry: true });
    } else if (prev !== undefined) {
      const delta = pos - prev;
      if (Math.abs(delta) >= threshold) {
        changes.push({ keyword, position: pos, delta, new_entry: false });
      }
    }
  }
  return changes;
}

/**
 * P2.2 — Sustained-decline detector (rank-decline → auto-refresh trigger).
 *
 * Walks the last 3 weeks of ranking history per keyword. Flags keywords that
 * have DROPPED 5+ positions across 2 consecutive weeks (W-1 to W-2, then W-2
 * to W-3 — both negative deltas, cumulative ≥ 5). Sustained declines reflect
 * algorithmic ranking decay (stale content, lost link equity, competitor
 * content velocity), not single-week SERP volatility — which is exactly
 * what /refresh is designed to address.
 *
 * Input: rankings — Array of {week: 'YYYY-MM-DD', positions: { keyword: pos }}.
 * MUST be sorted newest-first (rankings[0] is the most recent week). Needs at
 * least 3 entries to detect a sustained decline; fewer = empty result.
 *
 * Returns: Array of {keyword, week_minus_2, week_minus_1, current, total_delta,
 * url} sorted by total_delta descending (worst declines first).
 */
export function detectSustainedDecline(rankings, opts = {}) {
  const { threshold = 5, urls = {} } = opts;
  if (rankings.length < 3) return [];

  const [current, prev, prevPrev] = rankings;
  const declines = [];

  for (const [keyword, pos] of Object.entries(current.positions)) {
    const prevPos = prev.positions[keyword];
    const prevPrevPos = prevPrev.positions[keyword];

    if (prevPos === undefined || prevPrevPos === undefined) continue;

    const deltaW1toCurrent = pos - prevPos;       // positive = dropped
    const deltaW2toW1 = prevPos - prevPrevPos;     // positive = dropped

    // Both intervals must be drops, cumulative drop ≥ threshold
    if (deltaW1toCurrent > 0 && deltaW2toW1 > 0) {
      const totalDelta = pos - prevPrevPos;
      if (totalDelta >= threshold) {
        declines.push({
          keyword,
          week_minus_2: prevPrevPos,
          week_minus_1: prevPos,
          current: pos,
          total_delta: totalDelta,
          url: urls[keyword] || null,
        });
      }
    }
  }
  return declines.sort((a, b) => b.total_delta - a.total_delta);
}

/**
 * Per-site rankings history: read/write the rolling 4-week buffer.
 * Lives at sites/{site}/_baselines/rankings-history.json.
 *
 * Structure: { keyword_urls: { keyword: url }, weeks: [{week, positions}] }
 * weeks is sorted newest-first, capped at 4 entries.
 */
export async function loadRankingsHistory(siteDir) {
  const file = path.join(siteDir, '_baselines', 'rankings-history.json');
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return { keyword_urls: {}, weeks: [] };
    throw err;
  }
}

export async function saveRankingsHistory(siteDir, history) {
  const file = path.join(siteDir, '_baselines', 'rankings-history.json');
  await fs.mkdir(path.dirname(file), { recursive: true });
  // Cap to 4 weeks
  const trimmed = { ...history, weeks: history.weeks.slice(0, 4) };
  await fs.writeFile(file, JSON.stringify(trimmed, null, 2));
}

async function pollSemrushForSite(siteName) {
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

  // Live SEMrush integration (P2.2 wiring, 2026-05-17).
  // fetchCampaignRankings reads used-keywords.md, calls phrase_organic per
  // tracked keyword via scripts/lib/semrush-api.mjs, returns:
  //   { keyword_urls: { keyword: url }, positions: { keyword: position } }
  // positions[kw] = null means the site is not in the top 100 for that kw.
  const currentWeek = await fetchCampaignRankings({
    campaign: campaignMatch[1],
    siteDir,
  });
  if (!currentWeek) {
    return {
      siteName,
      campaign: campaignMatch[1],
      skipped: 'live API integration deferred to first fire',
    };
  }

  // Append this week to the rolling history buffer
  const history = await loadRankingsHistory(siteDir);
  const weekIso = new Date().toISOString().slice(0, 10);
  history.weeks = [
    { week: weekIso, positions: currentWeek.positions },
    ...history.weeks.filter((w) => w.week !== weekIso),
  ];
  history.keyword_urls = { ...history.keyword_urls, ...currentWeek.keyword_urls };
  await saveRankingsHistory(siteDir, history);

  // P2.2 — detect sustained declines (5+ position drop over 2 consecutive weeks)
  const sustainedDeclines = detectSustainedDecline(history.weeks, {
    threshold: 5,
    urls: history.keyword_urls,
  });

  // Read auto_refresh flag from site-info.md
  const autoRefresh = /auto_refresh:\s*true/i.test(siteInfo);

  for (const decline of sustainedDeclines) {
    const slug = decline.url ? decline.url.split('/').filter(Boolean).pop() : decline.keyword.replace(/\s+/g, '-');
    await writeInboxItem({
      siteDir,
      routine: ROUTINE_ID,
      routineVersion: ROUTINE_VERSION,
      topic: `auto-refresh-${slug}`,
      site: siteName,
      trigger: `Keyword "${decline.keyword}" dropped ${decline.total_delta} positions over 2 consecutive weeks (${decline.week_minus_2} → ${decline.week_minus_1} → ${decline.current})`,
      whatITried: `Pulled rankings for week ${weekIso} from SEMrush Position Tracking campaign ${campaignMatch[1]}. Compared against previous 2 weeks in sites/${siteName}/_baselines/rankings-history.json.\n\nDecline pattern (W-2 → W-1 → current): ${decline.week_minus_2} → ${decline.week_minus_1} → ${decline.current} (cumulative drop ${decline.total_delta} positions).\n\nTarget URL: ${decline.url || '(URL not mapped — campaign needs keyword→URL mapping)'}.\n\nAuto-refresh flag in site-info.md: ${autoRefresh ? 'true (auto-trigger eligible)' : 'false (recommendation only)'}.`,
      whatINeed: autoRefresh
        ? `Auto-refresh is ENABLED for this site. Recommended action: run \`/refresh ${decline.url || decline.keyword}\` to re-run SERP analysis, refresh stats, fix on-page gaps, update internal links, and refresh dateModified. If the decline is due to known causes (planned content change, deliberate de-emphasis, competitor SERP volatility) — skip the refresh and add notes to sites/${siteName}/notes.md.`
        : `Auto-refresh is DISABLED for this site. Recommended action: run \`/refresh ${decline.url || decline.keyword}\` manually to re-run SERP analysis, refresh stats, and update the page. To enable auto-trigger for future declines, add \`auto_refresh: true\` to site-info.md under the Position Tracking section.`,
      contextLinks: [
        `sites/${siteName}/_baselines/rankings-history.json`,
        `sites/${siteName}/site-info.md`,
        decline.url || null,
      ].filter(Boolean),
    });
  }

  return {
    siteName,
    campaign: campaignMatch[1],
    weeksTracked: history.weeks.length,
    sustainedDeclines: sustainedDeclines.length,
  };
}

/**
 * Pure-function: parse used-keywords.md into rows. Supports two formats:
 *
 *   Format A (pipe-table) — site-a, site-b:
 *     | Date | Primary Keyword | Page Type | URL | Cluster Keywords |
 *     URL cell may have multiple URLs joined by " + " (multilingual).
 *
 *   Format B (bullet-list) — site-c:
 *     - `[date] | keyword | URL | language`
 *     URL may be relative ("/services/diabetes") or absolute.
 *
 * `siteDomain` (optional) is used to normalize relative URLs into absolute.
 *
 * Exported for unit testing.
 */
export function parseTrackedKeywords(markdown, opts = {}) {
  const { siteDomain = null } = opts;
  const lines = markdown.split('\n');
  const rows = [];
  let inTable = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Format A — pipe-table parsing
    if (trimmed.startsWith('|---') || trimmed.startsWith('| ---')) {
      inTable = true;
      continue;
    }
    if (inTable && trimmed.startsWith('|') && !trimmed.startsWith('| Date ') && !trimmed.startsWith('|Date')) {
      const cells = trimmed.split('|').slice(1, -1).map((c) => c.trim());
      if (cells.length >= 4) {
        const [, keyword, , urlCell] = cells;
        if (keyword && !keyword.startsWith('{')) {
          // Strip backticks + language annotations like " (EN)", " (ES)", " (lang)"
          // before splitting on " + ". This handles both:
          //   site-a plain: "https://example.com/blog/foo + https://example.com/es/blog/foo"
          //   site-b: "`/services/foo` (EN) + `/es/servicios/foo` (ES)"
          const cleaned = urlCell
            .replace(/`/g, '')
            .replace(/\s*\((?:EN|ES|[a-z]{2})\)/gi, '');
          const urls = cleaned
            .split(/\s*\+\s*/)
            .map((u) => u.trim())
            .filter(Boolean)
            .map((u) => {
              if (/^https?:\/\//.test(u)) return u;
              if (u.startsWith('/') && siteDomain) return `https://${siteDomain}${u}`;
              return null;
            })
            .filter(Boolean);
          if (urls.length > 0) rows.push({ keyword, url: urls[0], urls });
        }
      }
      continue;
    }

    // Format B — bullet-list with backtick-wrapped pipe-delimited content
    const bulletMatch = trimmed.match(/^[-*]\s+`([^`]+)`/);
    if (bulletMatch) {
      const fields = bulletMatch[1].split(/\s*\|\s*/).map((f) => f.trim());
      if (fields.length >= 3) {
        const [, keyword, urlField] = fields;
        if (!keyword || keyword.startsWith('{')) continue;
        let url = urlField;
        if (url.startsWith('/') && siteDomain) {
          url = `https://${siteDomain}${url}`;
        }
        if (!/^https?:\/\//.test(url)) continue;
        rows.push({ keyword, url, urls: [url] });
      }
    }
  }
  return rows;
}

/**
 * Pure-function: extract bare domain (no www, no scheme) from a URL string.
 */
export function bareDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

/**
 * Live SEMrush integration: for each tracked keyword in the site's
 * used-keywords.md, fetch the current SERP position of the site's domain.
 *
 * Returns { keyword_urls, positions } in the shape consumed by
 * pollSemrushForSite() — keyword_urls maps each tracked keyword to its
 * canonical page URL (from used-keywords.md, the URL we PLANNED to rank);
 * positions maps each keyword to the position SEMrush found (or null if
 * the site is not in the top 100).
 */
async function fetchCampaignRankings({ campaign, siteDir }) {
  void campaign; // Position Tracking campaign ID isn't used in this implementation —
                 // we derive tracked keywords from used-keywords.md instead, which
                 // works on Guru tier (Position Tracking API requires Business+).

  const usedKeywordsPath = path.join(siteDir, 'used-keywords.md');
  let markdown;
  try {
    markdown = await fs.readFile(usedKeywordsPath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }

  // Resolve site domain from site-info.md "URL:" field — authoritative.
  // Falls back to deriving from the first tracked URL if site-info doesn't
  // declare it (shouldn't happen for properly-onboarded sites).
  const siteInfoMd = await fs.readFile(path.join(siteDir, 'site-info.md'), 'utf8').catch(() => '');
  const urlMatch = siteInfoMd.match(/^\s*-\s*\*\*URL:\*\*\s*(https?:\/\/[^\s]+)/m);
  let siteDomain = urlMatch ? bareDomain(urlMatch[1]) : null;

  // Parse used-keywords.md with the resolved domain (handles both Format A
  // absolute URLs and Format B relative URLs).
  const tracked = parseTrackedKeywords(markdown, { siteDomain });
  if (tracked.length === 0) return null;

  // If we couldn't get the domain from site-info, derive from a tracked URL
  if (!siteDomain) siteDomain = bareDomain(tracked[0].url);
  if (!siteDomain) return null;

  // Map: keyword -> intended URL (the page we planned to rank for it)
  const keyword_urls = {};
  for (const t of tracked) keyword_urls[t.keyword] = t.url;

  const keywords = tracked.map((t) => t.keyword);

  // Pre-flight quota check is inside fetchRankingsForKeywords; if quota is
  // too low it throws. Catch + return null so the cron logs a clean skip
  // (escalation goes through the normal "no rankings yet" path) rather than
  // a hard failure.
  let result;
  try {
    result = await fetchRankingsForKeywords(siteDomain, keywords);
  } catch (err) {
    if (err.message?.includes('quota too low')) {
      console.error(`semrush-poll skipping ${siteDir}: ${err.message}`);
      return null;
    }
    throw err;
  }

  return { keyword_urls, positions: result.positions };
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

    const results = [];
    for (const site of sites) {
      results.push(await pollSemrushForSite(site));
    }

    await recordSuccess({ routine: ROUTINE_ID });
    await appendRun({
      routine: ROUTINE_ID,
      routineVersion: ROUTINE_VERSION,
      site: null,
      durationSec: (Date.now() - start) / 1000,
      exit: 'shipped',
      filesTouched: [],
      escalations: results.filter((r) => r.skipped).map((r) => `${r.siteName}: ${r.skipped}`),
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
    throw err;
  }
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || '')) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
