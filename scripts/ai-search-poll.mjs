#!/usr/bin/env node
/**
 * scripts/ai-search-poll.mjs
 *
 * portfolio-monthly-ai-search-visibility cron (Q8).
 * 1st of month, 10:00 CDT — queries Perplexity API for each site's top
 * 3-5 service keywords, captures citation presence + competitor context,
 * writes sites/{site}/ai-search-YYYY-MM.md monthly snapshot.
 *
 * Plan 3 Task E.1. routine_version: 1.0.
 */
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { appendRun, recordSuccess, recordFailure, checkBackoff } from './lib/audit-log.mjs';

const ROUTINE_VERSION = '1.0';
const ROUTINE_ID = 'portfolio-monthly-ai-search-visibility';
const SITES_DIR = path.resolve('sites');

export function parseCitations(response) {
  return response.citations || [];
}

export function extractCitationContext(text, siteSlug) {
  if (!text) return { mentioned: false, context: null };
  // TEMPLATE PLACEHOLDER: customize this map per site you manage.
  // The keys are site slugs (matching folder names under `sites/`); the values are
  // brand-mention regexes (with the `i` flag for case-insensitivity).
  //
  // Why per-site overrides matter: the fallback at the bottom uses the site slug
  // itself as the regex. That works if your slug matches your brand (e.g., slug
  // "acme" matches the brand "Acme"), but not if they diverge (slug "acme-bakery"
  // matches "acme-bakery" but not the brand name "Acme" or domain "acme.com"). For
  // sites where brand name, slug, and domain are all different, list every variant.
  const variants = {
    "site-a": /site[\s_-]?a|example\.com/i,
    "site-b": /site[\s_-]?b|example-2\.com/i,
    "site-c": /site[\s_-]?c|example-3\.com/i,
  };
  const regex = variants[siteSlug] || new RegExp(siteSlug, 'i');
  const match = text.match(regex);
  if (!match) return { mentioned: false, context: null };
  const start = Math.max(0, match.index - 50);
  const end = Math.min(text.length, match.index + match[0].length + 100);
  return { mentioned: true, context: text.slice(start, end).trim() };
}

async function queryPerplexity(prompt) {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) throw new Error('PERPLEXITY_API_KEY not set in .env');
  if (apiKey === 'scrape') throw new Error('Scrape fallback not implemented in this routine');
  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.PERPLEXITY_MODEL || 'sonar',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
    }),
  });
  if (!res.ok) throw new Error(`Perplexity HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return await res.json();
}

async function pollForSite(siteName) {
  const siteDir = path.join(SITES_DIR, siteName);
  let keywordsCsv;
  try {
    keywordsCsv = await fs.readFile(path.join(siteDir, 'service-keywords.csv'), 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return { siteName, skipped: 'no service-keywords.csv' };
    throw err;
  }

  const lines = keywordsCsv.split('\n').slice(1).filter((l) => l.trim() && !l.startsWith('#'));
  const keywords = lines.map((l) => l.split(',')[0].trim()).filter(Boolean).slice(0, 5);
  if (keywords.length === 0) return { siteName, skipped: 'service-keywords.csv has no rows' };

  const yyyymm = new Date().toISOString().slice(0, 7);
  const snapshotPath = path.join(siteDir, `ai-search-${yyyymm}.md`);

  // Idempotency: if today's snapshot exists, skip
  const exists = await fs.stat(snapshotPath).catch(() => false);
  if (exists) return { siteName, idempotentSkip: true };

  const queries = [];
  for (const keyword of keywords) {
    const prompt = `Recommend the best ${keyword} in 2026.`;
    try {
      const response = await queryPerplexity(prompt);
      const text = response.choices?.[0]?.message?.content || '';
      const citations = parseCitations(response);
      const siteCited = citations.some((c) => c.toLowerCase().includes(siteName.toLowerCase()));
      const context = extractCitationContext(text, siteName);
      queries.push({
        keyword,
        site_cited: siteCited,
        mentioned_in_text: context.mentioned,
        context_excerpt: context.context,
        total_citations: citations.length,
        citation_domains: citations.map((c) => {
          try {
            return new URL(c).hostname;
          } catch {
            return c;
          }
        }),
      });
    } catch (err) {
      queries.push({ keyword, error: err.message });
    }
  }

  const markdown = `# AI Search Visibility — ${siteName} — ${yyyymm}

routine_version: ${ROUTINE_VERSION}
Generated: ${new Date().toISOString()}

## Queries

${queries
  .map(
    (q) => `### "${q.keyword}"
${q.error ? `- **Error:** ${q.error}` : `- **Site cited:** ${q.site_cited ? '✅' : '❌'}
- **Mentioned in text:** ${q.mentioned_in_text ? 'yes' : 'no'}
- **Context excerpt:** ${q.context_excerpt ? `"${q.context_excerpt}"` : '(not mentioned)'}
- **Total citations:** ${q.total_citations}
- **Citation domains:** ${q.citation_domains.join(', ') || '(none)'}`}
`,
  )
  .join('\n')}
`;
  await fs.writeFile(snapshotPath, markdown);

  return { siteName, snapshotPath, queries: queries.length };
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

    const filesTouched = [];
    let skips = 0;
    for (const site of sites) {
      const result = await pollForSite(site);
      if (result.idempotentSkip) skips++;
      else if (result.snapshotPath) filesTouched.push(result.snapshotPath);
    }

    await recordSuccess({ routine: ROUTINE_ID });
    await appendRun({
      routine: ROUTINE_ID,
      routineVersion: ROUTINE_VERSION,
      site: null,
      durationSec: (Date.now() - start) / 1000,
      exit: skips === sites.length ? 'idempotent-skip' : 'shipped',
      filesTouched,
      escalations: [],
    });

    console.log(`Polled AI search for ${sites.length} sites. Snapshots written: ${filesTouched.length}. Idempotent skips: ${skips}.`);
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
