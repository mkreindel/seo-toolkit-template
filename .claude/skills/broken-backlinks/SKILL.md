---
name: broken-backlinks
description: Monthly cron — finds pages on the open web that link to defunct competitor URLs where the site has a live replacement page, queues outreach to pitch the site's URL as the broken-link replacement. Pulls broken-backlink data from SEMrush (or Ahrefs/Moz as fallback) for each top-5 competitor, cross-references with the site's published content, surfaces high-probability "replacement-ready" opportunities. Highest-conversion outreach type — link reclamation pitches convert ~10× higher than cold-pitches because the publisher already has a broken link to fix. Use when the user types `/broken-backlinks` or when the monthly cron fires.
---

# `/broken-backlinks` — Broken-backlink replacement opportunity finder

Captures the highest-conversion backlink-acquisition opportunity on the web: publishers with a known-broken outbound link who need a replacement. Conversion rates on broken-link outreach run 8–15% (vs. 0.5–2% for cold-pitch outreach) because you're solving the publisher's problem, not asking for a favor.

This skill does NOT auto-send outreach. It queues opportunities for user review + approval. Pitches are drafted by `/outreach` (see `templates/outreach/` once built).

## Inputs

Required (asked at start if not given):
- **Site** — must match a folder under `sites/[name]/`.

Optional (per-run overrides):
- **Keyword tool** — overrides the site's default. Source for broken-backlink reports. SEMrush is the default (preferred for sites with active SEMrush subscriptions); Ahrefs and Moz are supported via API plug-ins.
- **`--min-da=N`** — minimum DA of source page to include (default 30; below 30 = low-leverage links).
- **`--max-opportunities=N`** — cap opportunities per run (default 25; below cap, may surface < 25 if competitors haven't lost many links this month).
- **`--competitor=domain.com`** — restrict to one competitor's backlink graph this run.

## Workflow

### Step 0 — Cron-mode detection (if invoked with `--cron`)

Cron mode is the DEFAULT for this skill — monthly cadence is the right frequency (broken-backlink opportunities don't materialize overnight). Required behavior per the standard contract (see `.claude/skills/blog/SKILL.md` Step 0). Idempotency key: `(site, year-month)`.

### Step 1 — Read context (Rule 1)

Load in order:
1. `CLAUDE.md`
2. `sites/{site}/site-info.md` — especially "Competitors" block (the top 5 ranking competitors)
3. `sites/{site}/backlinks.md` — for "Banned outreach targets" + outreach history
4. `sites/{site}/used-keywords.md` — for the published content inventory (to identify replacement candidates)
5. Site's sitemap (live URL) — fallback content inventory if `used-keywords.md` is incomplete
6. `sites/{site}/notes.md`

### Step 2 — Identify top-5 competitors

Read `site-info.md` → "Competitors" block. If fewer than 5 listed, escalate (cron-mode) or ask user (interactive): "Site has only N documented competitors — `/broken-backlinks` is most effective with ≥ 5. Continue with N, or pause until more competitors are documented?"

### Step 3 — Pull broken-backlinks report per competitor

For each competitor, query the configured keyword tool's broken-backlinks endpoint:

**SEMrush (default):**
- Endpoint: `backlinks_broken` (Backlink Analytics → Indexed pages → Broken backlinks filter)
- Filter: `da_min={--min-da}`, `link_type=dofollow`, `last_seen ≥ 90 days ago`
- Output: list of `(source_url, source_domain, da, broken_target, anchor_text, first_seen, last_seen)` rows

**Ahrefs / Moz (fallbacks):**
- Same logical query against each tool's broken-backlinks API.

Cache results to `sites/{site}/_research/broken-backlinks-{competitor}-{year-month}.json` for traceability + idempotency.

### Step 4 — Cross-reference broken targets against site content

For each broken-target URL pulled in Step 3:
1. Extract the broken page's URL path + last-known title (from SEMrush snippet or web.archive.org fallback).
2. Match against site's published content via:
   - **Slug similarity** — Levenshtein distance < 0.3 to any URL in site's sitemap
   - **Topic similarity** — semantic embedding match (≥ 0.75 cosine) of broken-page title against site page titles
   - **Keyword overlap** — broken page's last-known target keyword in `used-keywords.md` for the site
3. Top match per broken-target = the proposed replacement URL.

If no match scores above the threshold → drop the opportunity (you can't replace a link you don't have content for). Flag as "content gap" in the summary; the user can decide to write a replacement page (which would then unlock the opportunity in a future run).

### Step 5 — Score each opportunity

For each surviving (broken-target → replacement) pair, score 0–100:

| Signal | Weight |
|--------|--------|
| Source DA (DA 80+ = 30, DA 50–79 = 20, DA 30–49 = 10) | 30 |
| Match strength of replacement (cosine ≥ 0.9 = 20, 0.8–0.89 = 15, 0.75–0.79 = 10) | 20 |
| Source page topical relevance (does the source's topic actually fit the replacement?) | 15 |
| Source page traffic estimate (SEMrush organic traffic; > 1000/mo = 15, 100–999 = 10, < 100 = 5) | 15 |
| Number of competitors using the same source domain as a link source (cross-domain authority signal) | 10 |
| Outreach history check (source domain in `backlinks.md` "Outreach response tracking" with non-failed status) | 10 |

### Step 6 — Apply banned + previously-failed filters

Remove opportunities where:
- Source domain in `backlinks.md` → "Banned outreach targets"
- Source domain has `Last outcome: declined` in `backlinks.md` "Outreach response tracking" AND `Next eligible date` is in the future
- Source domain has open outreach in the pipeline (`status: sent / replied / scheduled`)

### Step 7 — Output

Write to `sites/{site}/_inbox/broken-backlinks-opportunities-{year-month}.md`:

```markdown
# Broken-backlink opportunities — {site} — {year-month}

Pulled broken-backlinks from {N} competitors. Found {M} matched opportunities ({K} above the {threshold} score floor). Top {min(max-opportunities, K)} listed below.

## Top opportunities (review + approve)

### 1. example.com/best-ai-tools — DA 87 — Score 92

- **Source URL:** https://example.com/best-ai-tools-for-smbs
- **Source DA:** 87
- **Source organic traffic:** ~3,400/mo (SEMrush)
- **Broken target:** https://defunct-competitor.com/ai-tools (last seen 2026-02-14)
- **Broken anchor text:** "comprehensive AI tools guide"
- **Proposed replacement (your URL):** https://{site}/services/ai-consulting
- **Match strength:** 0.91 cosine (strong topical + keyword overlap)
- **Why it's strong:** source has 3.4K monthly organic traffic, the broken link is in a numbered listicle (publishers typically maintain those), and 3 of your top-5 competitors also link from this domain (proven willingness)

**Suggested next step:** `/outreach --type=broken-link --opportunity-id=BB-2026-05-001`

---

### 2. ...

## Opportunities below score floor (logged for transparency)

(no draft generated; surface in case you want to override)

- example2.com/... — score 68 — replacement match is weak (cosine 0.76)
- ...

## Content gaps (broken-targets you have no replacement for)

These are broken links where you'd need to write a new page first. Each is a potential `/blog` or `/service` target if the topic + volume justifies it.

| Broken topic | Source DA | Source traffic | Suggested skill |
|--------------|-----------|----------------|-----------------|
| "best CRM integrations for SaaS" | 78 | 2,100/mo | `/integrations` (if you build it) |
| ... |
```

### Step 8 — Update `backlinks.md`

Append every surfaced opportunity (above + below score floor) to `backlinks.md` → "Broken-link reclamation queue" with `status: not-pitched`. The user's approval flips it to `pitched` (via `/outreach` skill).

### Step 9 — Audit log

`appendRun({ exit: 'shipped', metadata: { competitors_queried: N, broken_links_found: TotalRaw, opportunities_surfaced: M, content_gaps_flagged: ContentGaps } })`.

## Refusal conditions

This skill refuses to run if:
- Site has fewer than 3 documented competitors.
- The configured keyword tool's broken-backlinks endpoint is unauthenticated.
- Site has no `backlinks.md` (initialize via `cp templates/backlinks.md sites/{site}/backlinks.md` first).

## Routine versioning + idempotency contract

Idempotency key: `(site, year-month)`. Runs once per month per site. Re-runs in the same month skip with `idempotent-skip`.

Routine version: `1.0.0` (2026-05-17).
