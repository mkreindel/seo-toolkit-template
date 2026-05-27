---
name: serp-features
description: Detect SERP features (featured snippet, PAA, image pack, video, knowledge panel, AIO, local pack, sitelinks) that competitors capture for the site's tracked keywords but the site doesn't, and generate per-gap content-restructuring recommendations. Runs as a monthly cron (10th of month) via `scripts/serp-feature-tracker.mjs`, or interactively via `/serp-features {site}`. Output: `_inbox/serp-feature-gaps-{site}-{date}.md` with gaps grouped by recommended action (most map to `/refresh` with feature-specific flags). Use when the user types `/serp-features` or when the monthly cron fires.
---

# `/serp-features` — SERP feature targeting analyzer

Most ranking value sits in the SERP features above the organic results — featured snippets, People Also Ask, image packs, AI Overviews. A page that ranks #4 organically but captures the featured snippet outperforms a #1 ranking that doesn't. This skill identifies which features the site is leaving on the table.

## Inputs

Required:
- **Site** — must match a folder under `sites/[name]/`. The site must have a SEMrush Position Tracking campaign configured in `site-info.md` AND at least one week of rankings history (from the Q2 cron).

Optional:
- **`--keyword=X`** — restrict to one keyword.
- **`--feature=X`** — restrict to one SERP feature type.
- **`--min-competitor-count=N`** — only flag gaps where ≥ N competitors capture the feature (default 2; setting to 3 surfaces only the highest-priority gaps).

## What gets detected

Per the recommendations table built into `scripts/serp-feature-tracker.mjs`:

| Feature | What captures it | Recommended action |
|---------|-------------------|---------------------|
| **Featured snippet** | A 40–50 word direct answer in the FIRST H2 or H3. List or table format works. | `/refresh` with snippet-restructure flag |
| **People Also Ask (PAA)** | The PAA questions added to in-body FAQ section + FAQPage schema. | `/refresh` to add PAA Q+A |
| **Image pack** | 2–3 images with hyphenated filenames containing primary keyword, descriptive alt text, width/height attrs, WebP < 200KB. | `/refresh` to add image content + alt optimization |
| **Video** | Embedded YouTube video answering the query. | NEW video production (not a refresh) |
| **Knowledge panel** | Entity-level signals: verified GBP, Wikipedia entry, consistent Organization schema, earned third-party brand citations. | OFF-PAGE (entity strengthening) |
| **AI Overview (AIO)** | Q+A density (5+ in-body Q→A), citation-friendly chunking, self-contained facts, verifiable claims (these are P1.5 rules). | `/refresh` with AI-search optimization flag |
| **Local pack** | Verified GBP + LocalBusiness schema + NAP consistency across page/GBP/directories. | GBP + LocalBusiness schema audit (off-page) |
| **Sitelinks** | Strong topical authority signals — internal link counts, brand search volume. | Internal link equity work (P2.3) |

## Workflow

### Step 0 — Cron-mode detection (if invoked with `--cron`)

Standard cron contract per `scripts/lib/audit-log.mjs`. Idempotency key: `(site, year-month)`.

### Step 1 — Read context

Load:
1. `sites/{site}/site-info.md` (SEMrush campaign ID + auto-refresh flag)
2. `sites/{site}/_baselines/rankings-history.json` (tracked keywords + URL mappings)
3. `sites/{site}/used-keywords.md` (to cross-reference gap keywords with volume)
4. `sites/{site}/notes.md` (for known-deferred feature decisions, e.g., "no video budget")

### Step 2 — Fetch SERP features per keyword

For each keyword in the rankings history, query SEMrush's SERP-features endpoint (`url_organic` + `phrase_serp` for the keyword's market). Live API integration is pending (same gate as `semrush-poll.mjs`) — the script ships with the skeleton and the detection logic, ready to activate when SEMrush API access is wired.

### Step 3 — Compare site vs. competitors

For each (keyword, feature) cell:
- Does the site's tracked URL capture the feature? (T/F)
- How many of the top-5 competitor URLs capture the feature? (count)

The gap exists when: site doesn't capture + ≥ N competitors do.

### Step 4 — Generate per-gap recommendations

Each gap → a recommendation + an action. Most actions map to `/refresh` with a feature-specific flag (snippet-restructure, FAQ-expansion, image-optimization, AI-search-optimization). Some map to off-page work (GBP, LocalBusiness schema, Organization entity, video production).

### Step 5 — Output

Write `_inbox/serp-feature-gaps-{site}-{date}.md` with gaps grouped by recommended action so the user can batch-execute:

```markdown
# SERP feature gaps — {site} — {date}

{N} keyword(s) with capturable SERP-feature gaps.

## Action: /refresh with snippet-restructure flag

- **houston ai consulting** (/services/ai-consulting)
  Feature: featured_snippet
  Competitors capturing: accenture.com, deloitte.com
  Recommendation: Restructure to include a 40-50 word direct answer in the first H2...

- **ai consulting roi** (/blog/ai-roi)
  Feature: featured_snippet
  Competitors capturing: accenture.com, mckinsey.com
  Recommendation: ...

---

## Action: /refresh with AI-search optimization flag (P1.5 rules)

- ...

---

## Action: OFF-PAGE (Organization entity strengthening)

- ...
```

### Step 6 — Update trackers

- Audit log per standard contract.
- Do NOT auto-update `used-keywords.md` — gaps don't change keyword status until acted on.
- Skipped sites (no SEMrush campaign, no rankings history yet) are logged with reason.

## Refusal conditions

This skill refuses to run if:
- No SEMrush Position Tracking campaign configured for the site.
- No `rankings-history.json` exists yet (Q2 cron must populate it first).
- All keywords are pending API integration (returns "skipped" rather than a misleading no-gaps result).

## Routine versioning + idempotency contract

Idempotency key: `(site, year-month)`. Routine version: `1.0`.

## Related

- **Q2 (semrush-poll.mjs)** — populates `rankings-history.json` (prerequisite for this skill).
- **P2.2** — sustained-decline detection runs in the same Q2 cron; complementary signal (decline ≠ feature gap).
- **P1.5** — AI-search content rules; the `aio` gap action references these directly.
- **P2.3** — internal link equity; the `sitelinks` gap action references this.
- **/refresh** — the most-targeted action for snippet, PAA, image-pack, and AIO gaps.

## Why this matters

Featured snippet + AIO together account for ~40–60% of clicks on informational queries in 2026 — and they're awarded based on content STRUCTURE more than content QUALITY. A site already ranking in top 10 organically is often one targeted refresh away from capturing the snippet. This skill identifies exactly which pages are sitting on that opportunity.
