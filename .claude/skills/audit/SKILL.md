---
name: audit
description: Run a technical SEO audit on a chosen managed site — verifies all 8 non-negotiables, runs Lighthouse mobile, checks Core Web Vitals from GSC field data, validates schema on representative pages, audits foundational infrastructure (GSC, GBP, GA4, GTM, BWT). Logs results to `sites/[name]/site-info.md` under "Technical SEO baseline." Use when the user types `/audit` or after any major site change.
---

# `/audit` — Technical SEO auditor

Walks a single site against the toolkit's technical SEO standards and writes the result.

## Inputs

Required:
- **Site** — must match a folder under `sites/[name]/`.

Optional:
- **Audit depth** — `quick` (8 non-negotiables only), `full` (default — non-negotiables + Lighthouse + schema + infrastructure + AI search visibility), `deep` (full + competitor comparison + backlink baseline + on-page audit of top 5 pages).

## Workflow

### Step 0 — Cron-mode detection (if invoked with `--cron`)

If the invocation contains `--cron`, this skill runs in cron mode (no user available). Required behavior:

1. **Idempotency check:** see this skill's "Routine versioning + idempotency contract" section. If today's output already exists, exit cleanly with `exit: "idempotent-skip"`. Write one line to the audit log via `scripts/lib/audit-log.mjs` `appendRun({ exit: "idempotent-skip", ... })`.

2. **Escalation contract:** any decision that would normally prompt the user (missing required file, voice anti-AI failure, schema validation failure, keyword cannibalization, etc.) MUST be escalated by writing an item to `sites/{site}/_inbox/` via `scripts/lib/cron-mode.mjs` `writeInboxItem(...)`. After writing, exit cleanly with `exit: "escalated"`. Do NOT use `AskUserQuestion` in cron mode.

3. **Defaults:** when a choice would normally be asked, default to `site-info.md` / `goals.md` values. If both are silent on the required choice, escalate per (2).

4. **Audit log:** ALWAYS write one line to the audit log on exit — success (`shipped`), escalation (`escalated`), idempotent skip (`idempotent-skip`), or failure (`failed`).

5. **Backoff:** at the start of every cron-mode run, call `checkBackoff({ routine })` from `scripts/lib/audit-log.mjs`. If true, the routine has hit the 3-strike threshold — write `_inbox/routine-disabled-{name}.md`, run `scripts/sync-schedules.mjs --pause-routine={name}`, and exit.

### Step 1 — Read context (Rule 1)

Same as `/blog` Step 1, but also fetches the site's homepage HTML and at least one inner page (top blog post + top service page if available).

### Step 2 — Audit the 8 non-negotiables (Section 4 of `CLAUDE.md`)

For each:

| # | Element | How |
|---|---------|-----|
| 1 | Sitemap | HTTP GET `[site]/sitemap.xml`; parse XML; count URLs |
| 2 | robots.txt | HTTP GET `[site]/robots.txt`; verify allows crawlers + references sitemap |
| 3 | Canonical | View source on homepage + 1 inner page; verify `<link rel="canonical">` present |
| 4 | OG images | View source; verify `og:image` exists + URL resolves; check 1200×630 dimensions |
| 5 | Image dimensions | View source on a sample page; verify `<img>` has width/height |
| 6 | Semantic HTML5 | View source on homepage + 1 inner; verify `<header>`, `<nav>`, `<main>`, `<footer>` present |
| 7 | Mobile viewport | View source; verify `<meta name="viewport"...>` present |
| 8 | HTTPS | Verify URL scheme + check for mixed content via Lighthouse |

Pass / Fail / Warning per item.

### Step 3 — Lighthouse audit (mobile)

If `quick` scope: skip.
If `full` or `deep`: run via `node scripts/lighthouse.mjs --url=[homepage]` and `--url=[inner page]`. Capture: Performance, SEO, Accessibility, Best Practices + Core Web Vitals (LCP, INP, CLS).

Compare against:
- Floor (per Section 6.2 of `SEO_GUIDE.md`)
- Stretch goal (100 across all)

Flag any score below floor.

### Step 4 — GSC field data (Core Web Vitals)

If GSC API access is configured: pull last 28 days of Core Web Vitals field data → status (Good / Needs improvement / Poor) for mobile + desktop.

If not configured: prompt user to manually copy the GSC Core Web Vitals dashboard summary.

### Step 5 — Schema validation

Run `node scripts/validate-schema.mjs --url=[page]` on representative pages (homepage + 1 blog + 1 service if applicable):
- Schema.org Validator
- Print Rich Results Test deep-link for manual verification

Capture: which schemas are detected, validation status (pass / errors), missing recommended schemas (e.g., LocalBusiness on a local site without it).

### Step 6 — Foundational infrastructure (Section 9 of `SEO_GUIDE.md`)

Verify each (where verifiable from outside):
- GSC verified (per `site-info.md` flag)
- Sitemap submitted to GSC (per flag + sitemap URL responding)
- GBP claimed (manual check on Google Maps if local)
- GA4 installed (view-source for `gtag.js` or GTM container)
- GTM installed (view-source)
- BWT verified (per `site-info.md` flag)

### Step 6.5 — Hreflang audit (multilingual sites only)

Read `site-info.md` Languages section.

- **`Multilingual: false`** → skip; not applicable.
- **`Multilingual: true`**:
  1. Run `node scripts/validate-hreflang.mjs --site=[name]`. The script walks every URL in the sitemap and checks:
     - Each declared-language counterpart exists (HTTP 200 at the per-language URL pattern from `site-info.md`).
     - Each page's `<link rel="alternate">` cluster: self-reference present, all sibling languages present, `x-default` present.
     - Reciprocal: every alternate link is mirrored on the target page (EN → ES requires ES → EN).
     - `<html lang>` matches the served language (the language code in the URL pattern).
     - Schema `inLanguage` matches `<html lang>`.
  2. Optional: verify sitemap declares `xhtml:link` alternates per Google's spec.
  3. Output structured report: total URLs visited, errors (with URL + missing piece), warnings, reciprocal-check pass/fail counts.
  4. **Failures are blockers, not opportunities.** A multilingual site with broken hreflang is treated as worse-than-monolingual by Google. Block the audit's "passing baseline" status until reciprocal hreflang holds across the site.

Failures recorded under `Technical SEO baseline → Hreflang state` in `site-info.md`. Coverage gaps (a page exists in EN but not ES) recorded as Phase-2 backfill items.

### Step 6.6 — Bot-readability check (rendering audit)

For sites with `rendering: csr` or `rendering: hybrid` in `site-info.md`, OR any site we haven't verified before, run the bot-UA curl test on the homepage + 1 inner page:

```bash
curl -s -A "Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)" \
  https://[domain]/[path] | grep -oE "<h[1-3][ >][^<]+</h[1-3]>" | wc -l
```

Expected: ≥ 5 H1–H3 elements on a content page; ≥ 1 H1 on every page that should rank.

Repeat for representative bots:
- `PerplexityBot` (AI search)
- `GPTBot` (OpenAI)
- `ClaudeBot` (Anthropic)
- `Googlebot` (sanity check; should always pass since Googlebot executes JS)

Compare to the page's view in browser. If the browser shows H1 + content but curl shows 0, the page is invisible to AI search bots — flag as **Critical** in the priority fix list. Reference: `SEO_GUIDE.md` Section 1.3 (rendering modes) + Section 3.6 (Google vs LLMs).

### Step 6.7 — Manual audit fundamentals (cross-check)

Run the manual checks from `on-page-seo.md` Section 17 on representative pages:

1. **`site:` operator on Google** — `site:[domain]` shows indexed pages. Compare count vs sitemap; spot accidentally-indexed staging URLs, parameter URLs, soft-404s.
2. **View source / Ctrl+U** on homepage + 1 inner — verify `<title>`, canonical, OG, hreflang, JSON-LD all present in raw HTML.
3. **Chrome extension SEO META in 1 CLICK** (manual; recommend to user) — quick H1/H2/meta sanity check on representative pages.

Discrepancies between automated checks (Steps 2–5) and manual checks (this step) get flagged for human review.

### Step 6.8 — Internal linking pattern audit

Verify the 7 internal-linking patterns from `SEO_GUIDE.md` Section 5.1 on the right page types. Sample 5 routes spanning home + category + subcategory + leaf + blog:

| Page type | Patterns expected |
|---|---|
| Home | 1 (header dropdown), 2 (featured), 3 (footer) |
| Category landing | 1, 3, 4 (breadcrumb), 5 (category→sub) |
| Subcategory | 1, 3, 4, 5, 6 (related-products) |
| Product / service leaf | 1, 3, 4, 6 |
| Blog post | 1, 3, 4, 7 (blog→transactional bridge) |

For each sampled page, report which expected patterns are present and which are missing. Patterns are mostly template-level, so a single missing pattern usually indicates a site-wide template fix.

### Step 7 — AI search visibility (Section 9.7)

If `full` or `deep`: search the site's top 3 keywords (from `site-info.md` "Primary money keywords" + `keywords.csv` top 3) on:
- Perplexity (via web)
- Google AI Overviews (via google.com search)
- Note ChatGPT and Claude as manual-check items

Note whether the site is cited.

### Step 8 — On-page audit of top 5 pages (deep scope only)

If `deep`: run `on-page-seo.md` checklist against top 5 pages (highest GSC clicks).

Score each page on Tier 1 (16 items) + extended checklist applicable items.

### Step 9 — Backlink baseline (deep scope only)

If `deep` + Ahrefs/SEMrush API configured: pull
- Total referring domains
- DR / DA
- Top 10 anchor texts
- New / lost links last 28 days
- Toxic-link flags

### Step 10 — Write results to `site-info.md`

Update `sites/[site]/site-info.md` under "Technical SEO baseline":

```markdown
## Technical SEO baseline (audit date: YYYY-MM-DD, depth: [quick/full/deep])

### 8 non-negotiables
- [✅/❌] Sitemap exists at /sitemap.xml — [URL count: N]
- [✅/❌] robots.txt exists, allows crawlers, references sitemap
- [✅/❌] Canonical URLs present on homepage + inner page
- [✅/❌] OG images present and resolve (1200×630)
- [✅/❌] Image dimensions specified
- [✅/❌] Semantic HTML5 used
- [✅/❌] Mobile viewport meta present
- [✅/❌] HTTPS everywhere

### Lighthouse mobile (homepage)
- Performance: [N] (floor: 70, stretch: 100)
- SEO: [N] (floor: 95, stretch: 100)
- Accessibility: [N] (floor: 90, stretch: 100)
- Best Practices: [N] (floor: 95, stretch: 100)
- LCP: [Xs] | INP: [Xms] | CLS: [X]

### Schema (representative pages)
- Detected: [list]
- Validates: [list with errors flagged]
- Missing recommended: [list]

### Foundational infrastructure
- [✅/❌] GSC verified
- [✅/❌] Sitemap submitted
- [✅/❌ or N/A] GBP claimed
- [✅/❌] GA4 installed
- [✅/❌] GTM installed
- [✅/❌] BWT verified

### Hreflang state (multilingual sites only)
- Site is multilingual: ✅/❌ (per `site-info.md` Languages → Multilingual)
- Declared languages: [en, es, ...]
- Total URLs in sitemap: [N]
- Per-language counterpart coverage: [N/N]
- Self-reference present on every page: ✅/❌
- All sibling languages linked on every page: ✅/❌
- `x-default` present on every page: ✅/❌
- Reciprocal hreflang (EN→ES requires ES→EN): [pass/fail count]
- `<html lang>` matches served language: ✅/❌
- Schema `inLanguage` matches `<html lang>`: ✅/❌
- Coverage gaps (pages missing in 1+ languages): [list with URLs + missing language codes]

### AI search visibility (this audit)
- Perplexity: cited ✅/❌ for [keyword]
- Google AI Overviews: ✅/❌ for [keyword]
- ChatGPT: [manual check needed]
- Claude: [manual check needed]

### Bot-readability (rendering audit, if CSR/hybrid)
- PerplexityBot H1 count on homepage: [N]
- PerplexityBot H1–H3 count on inner page: [N]
- GPTBot / ClaudeBot match: ✅/❌
- Browser view matches bot view: ✅/❌
- Verdict: ✅ pass / ❌ invisible to AI search → critical fix

### Internal linking pattern coverage
- Home: patterns 1, 2, 3 → [✅/❌] each
- Category landings: patterns 1, 3, 4, 5 → [✅/❌] each
- Subcategory landings: patterns 1, 3, 4, 5, 6 → [✅/❌] each
- Leaf pages: patterns 1, 3, 4, 6 → [✅/❌] each
- Blog posts: patterns 1, 3, 4, 7 → [✅/❌] each
- Missing patterns (likely template-level fix): [list]
```

### Step 11 — Generate priority fix list

Sort all failures by leverage:
- **Critical** — anything blocking indexation (no sitemap, blocked by robots, no canonicals).
- **High** — Tier 1 misses, schema errors, Performance < floor, GSC not verified.
- **Medium** — non-Tier-1 on-page misses, missing recommended schema, GBP not claimed (if local).
- **Low** — opportunities (Lighthouse below 100 but above floor, AI search not citing yet).

Print prioritized fix list to user. Recommend `/refresh` for Tier 1 fixes on top pages.

## Routine versioning + idempotency contract

This skill participates in cruise-control via `--cron` mode. When invoked by cron:

1. **Stamp `routine_version`** in every output (the `notes.md` audit entry header, the `tech-debt.md` items it creates, the audit log line via `scripts/lib/audit-log.mjs`). Current `routine_version`: **1.0**.

2. **Idempotency:** this skill MUST be safe to run twice on the same day on the same site without producing duplicate work. Implementation: check whether `notes.md` already has today's audit entry for this site; if so, exit cleanly with `exit: "idempotent-skip"`. Do NOT append a second audit entry on the same day.

Reference: `docs/specs/2026-05-16-agents-cruise-control-design.md` § Operational hardening O3.

## Refusal conditions

- Site folder doesn't exist or `site-info.md` missing.
- Live site URL doesn't resolve (homepage 4xx/5xx).
