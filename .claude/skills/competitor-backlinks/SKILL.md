---
name: competitor-backlinks
description: Monthly cron — reverse-engineers the backlink graphs of the site's top-5 ranking competitors to surface high-probability link-acquisition targets. Pulls each competitor's top referring domains via SEMrush (or Ahrefs/Moz fallback), filters to domains NOT yet linking to the site, prioritizes domains linking to multiple competitors (= proven willingness to link to this vertical), scores by DA + topical relevance + outreach probability, and queues opportunities for user review in `_inbox/`. Use when the user types `/competitor-backlinks` or when the monthly cron fires.
---

# `/competitor-backlinks` — Competitor backlink reverse-engineering

The most reliable cold-outreach signal in SEO: a domain that links to 2+ of your competitors has demonstrably decided that linking to this vertical is editorially acceptable. They've already made the hard decision; the question becomes "do you have a better/different angle for the same topic" rather than "would you ever consider linking to a vendor like us."

This skill identifies those high-probability domains and queues them for outreach.

## Inputs

Required (asked at start if not given):
- **Site** — must match a folder under `sites/[name]/`.

Optional (per-run overrides):
- **Keyword tool** — default SEMrush; Ahrefs / Moz supported via plugin.
- **`--min-da=N`** — minimum DA of referring domain (default 35; below 35 = low-leverage links).
- **`--min-competitor-overlap=N`** — minimum number of competitors the domain links to (default 2; setting to 3 surfaces only the highest-probability targets).
- **`--max-opportunities=N`** — cap per run (default 30).
- **`--competitor=domain.com`** — restrict to one competitor's backlink graph.

## Workflow

### Step 0 — Cron-mode detection (if invoked with `--cron`)

Cron mode is the DEFAULT for this skill. Monthly cadence per `SEO_GUIDE.md` Section 8.2. Standard contract per `.claude/skills/blog/SKILL.md` Step 0. Idempotency key: `(site, year-month)`.

### Step 1 — Read context (Rule 1)

Load in order:
1. `CLAUDE.md`
2. `sites/{site}/site-info.md` — especially "Competitors" block + the site's own domain (for self-exclusion)
3. `sites/{site}/backlinks.md` — for outreach history + banned domains
4. `sites/{site}/used-keywords.md`
5. Site sitemap — for inventory of pageable assets the cron can nominate as link targets
6. `sites/{site}/notes.md`

### Step 2 — Identify top-5 competitors

Same logic as `/broken-backlinks` Step 2. If `< 5` competitors documented → escalate or ask.

### Step 3 — Pull referring-domains report per competitor

For each competitor, query the configured tool's referring-domains endpoint:

**SEMrush:**
- Endpoint: `backlinks_refdomains`
- Filter: `da_min={--min-da}`, `link_type=dofollow`, `first_seen ≥ 365 days ago` (excludes one-shot mentions)
- Limit: top 200 referring domains per competitor (capture the long-tail without exploding the dataset)

Cache results to `sites/{site}/_research/competitor-backlinks-{competitor}-{year-month}.json` for traceability + diff comparison next month.

### Step 4 — Build the cross-domain frequency map

For each unique referring domain across all 5 competitor reports:
1. Count how many of the 5 competitors that domain links to (1–5).
2. Pull a representative referring URL from one of the linking competitors (for outreach context).
3. Note the link type from each competitor (editorial / resource page / directory / listicle / press release).
4. Pull the source domain's DA + monthly organic traffic (from the same tool).

Filter the resulting list:
- **Drop:** domains the site already has a backlink from (cross-reference against site's own SEMrush referring-domains list).
- **Drop:** domains with `competitor_overlap < --min-competitor-overlap`.
- **Drop:** domains in `backlinks.md` → "Banned outreach targets".
- **Drop:** domains with `Last outcome: declined` AND `Next eligible date > today` in `backlinks.md` → "Outreach response tracking".

### Step 5 — Topical-relevance check

For each surviving domain, fetch the domain's top 3 organic-traffic pages (via SEMrush "Top pages" endpoint or homepage scrape via Chrome MCP for low-traffic sites). Match against the site's content via:
- **Topic overlap** — semantic embedding match (≥ 0.70 cosine) between source's top-pages topics and the site's site-info → "Authority" block topics.
- **Audience overlap** — does the source's audience descriptor (industry, role, company-size) match the site's target customer per site-info?

Domains scoring below 0.50 average on these two signals → drop. (A finance-news domain that links to AI competitors is interesting; an unrelated lifestyle blog that links to the same competitors is noise.)

### Step 6 — Score each opportunity

For each surviving domain, score 0–100:

| Signal | Weight |
|--------|--------|
| Competitor overlap count (2 = 20, 3 = 30, 4 = 35, 5 = 40) | 40 |
| Source DA (DA 80+ = 25, DA 50–79 = 18, DA 35–49 = 10) | 25 |
| Source page topical relevance (cosine match per Step 5) | 15 |
| Source organic traffic (> 5000/mo = 10, 1000–4999 = 6, < 1000 = 2) | 10 |
| Link type (editorial = 10, resource-page = 8, listicle = 7, directory = 4, press = 2) | 10 |

### Step 7 — Identify the best outreach hook per opportunity

For each top-30 opportunity, identify which OUTREACH TYPE has highest probability of conversion:
- **Editorial-mention pitch** — if the source's representative URL is a regularly-updated post / explainer where new examples could be added
- **Resource-page inclusion** — if the source's representative URL is a "best [tools/resources/X] for [Y]" listicle
- **Broken-link replacement** — if the source page contains broken outbound links (rare overlap with `/broken-backlinks` skill; flag for hand-off)
- **Expert-quote ask** — if the source publishes "experts say" / "according to" formats
- **Guest-post pitch** — if the source accepts guest contributions (look for "/write-for-us" or "/contribute" URLs in their sitemap)

This determination informs which outreach template `/outreach` will use.

### Step 8 — Output

Write to `sites/{site}/_inbox/competitor-backlinks-opportunities-{year-month}.md`:

```markdown
# Competitor backlink opportunities — {site} — {year-month}

Pulled referring domains from {N} competitors ({total_unique_domains} unique). Filtered to {filtered_count} candidates ({passed_relevance} passed topical-relevance). Top {min(max-opportunities, scored_count)} listed below.

## Top opportunities (review + approve)

### 1. example.com — DA 84 — Score 88 — Editorial-mention hook

- **Source domain:** example.com
- **DA:** 84
- **Organic traffic:** ~12K/mo
- **Competitor overlap:** 4 of 5 (links to {comp_1}, {comp_2}, {comp_3}, {comp_5})
- **Representative source URL (linking to comp_1):** https://example.com/best-ai-tools-2026
- **Link type seen:** editorial (in-body mention)
- **Topical relevance:** 0.84 cosine (strong)
- **Outreach hook:** the source's listicle is updated quarterly per their archive; pitch your {/your-page} as a complementary mention in their next update
- **Suggested target page:** https://{site}/services/ai-consulting

**Suggested next step:** `/outreach --type=editorial-mention --opportunity-id=CB-2026-05-001`

---

### 2. ...

## Newly emerged domains (first appeared in any competitor's referring set this month)

Worth special attention — these are the most actionable opportunities because the publishing decision is fresh.

| Domain | DA | Linking to | First seen | Score |
|--------|-----|-----------|------------|-------|
| ... |

## Lost overlaps (referring domains lost by competitors this month)

A domain that stopped linking to a competitor may also be reconsidering the topic. Marginal value — log for trend tracking.

| Domain | Was linking to | Last seen | Likely reason |
|--------|---------------|-----------|---------------|
| ... |

## Opportunities below score floor (logged for transparency)

(no draft generated; surface in case you want to override)

- example2.com — DA 41 — competitor_overlap 2 — score 52
- ...
```

### Step 9 — Update `backlinks.md`

Append every opportunity above the score floor to `backlinks.md` → "Competitor backlink intel" with `Outreach status: not-pitched`.

### Step 10 — Audit log

`appendRun({ exit, metadata: { competitors_queried: 5, unique_domains_seen: TotalUnique, passed_relevance: PassedRelevance, opportunities_surfaced: TopK, newly_emerged: NewlyEmerged } })`.

## Refusal conditions

This skill refuses to run if:
- Fewer than 3 competitors documented in `site-info.md`.
- The configured tool's referring-domains endpoint is unauthenticated.
- Site's own referring-domains list cannot be fetched (needed for "already linking from" exclusion).
- No `backlinks.md` exists (initialize from `templates/backlinks.md` first).

## Routine versioning + idempotency contract

Idempotency key: `(site, year-month)`. Routine version: `1.0.0` (2026-05-17).

## Related skills

- `/broken-backlinks` — orthogonal monthly skill. Both feed `/outreach`. Run on different weeks of the month to avoid spiking SEMrush API quota.
- `/outreach` — draft + send the pitches surfaced here (separate skill, separate workflow).
- `/haro` — daily complement; this is monthly. Together they're the proactive (monthly) + reactive (daily) acquisition channels.
