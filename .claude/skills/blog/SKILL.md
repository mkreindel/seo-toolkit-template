---
name: blog
description: Generate a long-form, SEO-optimized, voice-matched blog post for a chosen managed site. Picks an unused informational keyword, runs SERP analysis on the top 3 results, fetches images per the site's configured source, applies the resolved voice (root + per-site override), satisfies Tier 1 on-page SEO, validates schema, and ships in the format the site's publishing method requires (repo-commit / cms-paste / lovable-prompt / headless-api). Use when the user types `/blog` or asks for a new blog post.
---

# `/blog` — Blog post generator

Creates a production-ready blog post end-to-end for any site managed in `sites/`.

## Inputs

Required (asked at start if not given):
- **Site** — must match a folder under `sites/[name]/`. The skill reads its `site-info.md`.

Optional (per-run overrides):
- **Primary keyword** — if not given, picks the highest-priority unused keyword from `keywords.csv`.
- **Image source** — overrides the site's default. Options: Pexels, Unsplash, site-library, AI-generated, client-supplied, none.
- **Keyword tool** — overrides the site's default for any keyword research the skill performs.
- **Length target** — bypasses the SERP-median-derived target (rare; only when the user has a specific reason).

## Workflow

### Step 0 — Cron-mode detection (if invoked with `--cron`)

If the invocation contains `--cron`, this skill runs in cron mode (no user available). Required behavior:

1. **Idempotency check:** see this skill's "Routine versioning + idempotency contract" section. If today's output already exists, exit cleanly with `exit: "idempotent-skip"`. Write one line to the audit log via `scripts/lib/audit-log.mjs` `appendRun({ exit: "idempotent-skip", ... })`.

2. **Escalation contract:** any decision that would normally prompt the user (missing required file, voice anti-AI failure, schema validation failure, keyword cannibalization, etc.) MUST be escalated by writing an item to `sites/{site}/_inbox/` via `scripts/lib/cron-mode.mjs` `writeInboxItem(...)`. After writing, exit cleanly with `exit: "escalated"`. Do NOT use `AskUserQuestion` in cron mode.

3. **Defaults:** when a choice would normally be asked, default to `site-info.md` / `goals.md` values. If both are silent on the required choice, escalate per (2).

4. **Audit log:** ALWAYS write one line to the audit log on exit — success (`shipped`), escalation (`escalated`), idempotent skip (`idempotent-skip`), or failure (`failed`).

5. **Backoff:** at the start of every cron-mode run, call `checkBackoff({ routine })` from `scripts/lib/audit-log.mjs`. If true, the routine has hit the 3-strike threshold — write `_inbox/routine-disabled-{name}.md`, run `scripts/sync-schedules.mjs --pause-routine={name}`, and exit.

### Step 1 — Read context (Rule 1)

Load in order:
1. `CLAUDE.md` (toolkit root)
2. `SEO_GUIDE.md`
3. `on-page-seo.md`
4. `sites/[site]/site-info.md`
5. Resolved `references/` — root files, then per-site overrides if present
6. `sites/[site]/keywords.csv` and `sites/[site]/used-keywords.md`
7. `sites/[site]/notes.md`

If any required file is missing, ask the user before proceeding.

### Step 2 — Pick the keyword

- If user supplied a primary keyword → use it.
- Otherwise: read `keywords.csv`, exclude any keyword listed in `used-keywords.md`, sort by opportunity score (high volume × low difficulty × intent match), pick top.
- **Seasonality check (soft) — `SEO_GUIDE.md` Section 2.5.** If the picked keyword has `peak_months` and/or `seasonality` populated:
  - If today is in `peak_months` OR `seasonality = stable` → proceed.
  - If `seasonality = seasonal` or `holiday-spike` AND today is NOT in `peak_months` → flag and ask:
    > "This keyword peaks in [months]. Today is [month]. Options: (a) proceed — early publish gives Google time to crawl + rank before peak; (b) pick a year-round keyword from `keywords.csv`; (c) defer to ~3 months before peak. Which?"
  - If `seasonality = declining` → flag and ask before continuing.
  - Never refuse on seasonality alone — option (a) is always available.
- Confirm choice with the user before proceeding.

### Step 3 — Build the cluster (`SEO_GUIDE.md` Section 3.3 + Section 2.4)

- 1 primary keyword + 4–8 supporting (2–3 secondary, 3–5 tertiary).
- Pull supporting keywords from the keyword tool (per `site-info.md` default or per-run override).
- **Validate every cluster term against the primary using the SERP-comparison test (`SEO_GUIDE.md` Section 2.4):**
  - Search both keywords incognito (target region per `site-info.md`).
  - Count shared URLs in the top 10.
  - **≥ 4 shared** → cluster term belongs on this page. Keep.
  - **2–3 shared** → borderline. Keep only if the cluster term has < 100/mo volume (tertiary).
  - **≤ 1 shared** → drop. The term belongs on a different page; flag for the user as a candidate future post.
- Final cluster: only terms that pass the SERP-comparison test. Reject candidates that look semantically similar but fail the test — the rule is one-page-one-intent (`CLAUDE.md`).

### Step 4 — SERP analysis (`SEO_GUIDE.md` Section 3.5)

1. Search Google (incognito, target region per `site-info.md`) for the primary keyword.
2. Identify top 3 organic results, skipping: Reddit, Quora, forums, YouTube, Wikipedia, paywalled, brand homepages, the site itself.
3. Extract from each: word count, H2/H3 outline, image count, FAQ questions, internal/external link patterns.
4. Calculate median word count + image count → target ±20%.
5. Identify 1–2 novel sections the top 3 missed.
6. Check Perplexity + Google AI Overviews citations for the keyword — note formats (lists, tables, direct answers) AI rewards.

### Step 4.5 — Wireframe (mandatory, per `CLAUDE.md` "Wireframe before content" rule)

Before generating prose, produce a wireframe doc at `sites/[site]/_drafts/[slug]/wireframe.md`. Mandatory contents:

- **Layout zones** (top-to-bottom): hero (H1 + intro), TOC if applicable, content sections (one per H2), FAQ, related-posts/services, author bio.
- **Heading map** (H1 / H2 / H3 with placeholder text matching the cluster from Step 3).
- **Internal linking pattern slots** — which of the 7 patterns from `SEO_GUIDE.md` Section 5.1 the page carries. For a blog post: patterns 1 (header dropdown via template), 3 (footer via template), 4 (breadcrumb), and **7 (blog → transactional bridge — explicitly call out which service/product page the post links to)**.
- **Image plan** — hero image + N inline images, per `/blog` Step 7 image source.
- **External link plan** — 2–3 authoritative sources by topic (.gov, .edu, major industry).
- **CTA placement** — typical for blog: 1 mid-post CTA + 1 end-post CTA, both pointing to the linked transactional page.

Optional (if user opts in): use draw.io or hand-sketch → photo, then have AI produce a first visual mockup to share with the client. Toolkit doesn't generate the visual mockup — the wireframe doc is enough for skill purposes; visuals are a presentation-time enhancement.

Show the wireframe to the user. Wait for explicit approval before generating prose. Approved wireframes get archived in `_drafts/[slug]/`; rejected ones get revised and re-shown.

### Step 5 — Plan + approval (Rule 2)

Present to user:
- Primary keyword + cluster
- Target word count + image count
- Proposed H1, H2 outline, FAQ questions
- Novel sections to add
- Image source for this run
- **Language fan-out** *(multilingual sites only)* — list of languages this draft will be produced in (default: all declared in `site-info.md`).

Wait for approval before generating.

### Step 5.5 — Resolve language fan-out (multilingual sites only)

Read `site-info.md` Languages section.

- **`Multilingual: false`** → skip this step; continue to Step 6 as a single-language run.
- **`Multilingual: true`**:
  1. Default coverage = every language declared in the Languages table.
  2. If user supplied `languages: [...]` opt-out (a subset) → confirm explicitly before honoring. Default refuses to ship a unilingual draft on a multilingual site.
  3. For each declared language:
     - Resolve voice files: root `references/voice.md` + per-site `references/voice.[lang].md` (REQUIRED — refuse if missing) + per-site `references/humour.[lang].md` / `stories.[lang].md` / `opinions.[lang].md` (optional). `stats.md` is shared.
     - Format URL using the language's URL pattern from the Languages table (substitute `[slug]`).
     - Reserve a draft folder: `sites/[site]/_drafts/[slug]/[lang]/`.
  4. Generate the hreflang link cluster from the resolved language set (self-reference + all siblings + `x-default`).
  5. Schema `inLanguage` is set per-language draft.

The skill produces N drafts (one per language), each in its own `_drafts/[slug]/[lang]/` subfolder. Each draft passes its own Tier 1 + voice anti-AI check using its language's voice files.

### Step 6 — Generate the post

Apply, in this order:
1. **Voice** — resolved `references/` files (root + per-site override). Anti-AI rules from `CLAUDE.md`.
2. **Tier 1 on-page** — all 16 items.
3. **Cluster placement** — primary in title/H1/first 100 words/slug; secondary in H2s; tertiary in H3s, FAQ, body.
4. **One story max** (from `stories.md`), **one strong opinion max** (from `opinions.md`, backed by a number from `stats.md`).
5. **At least one "when NOT to use / hire us"** moment.
6. **3–5 internal links** (to other posts/services on this same site, using `used-keywords.md` and the site's known URLs as candidates).
7. **2–3 external links** to authoritative sources.
8. **FAQ section** — 4–8 Q+A pulled from the keyword tool's Questions view + Google's PAA.
9. **Author byline** per the site's `site-info.md` → "Public byline policy" + (if the site has one) `sites/{site}/coi-categories.md`. Per-post `author:` frontmatter is REQUIRED and routed:
    - **`author: your-name-slug`** (or any real-person slug) → load `sites/{site}/author-{slug}.md`, inject the bio block in the page's author footer, inject `Person` schema in `@graph`. Refuse to ship if any `{TO FILL}` placeholder remains in `author-{slug}.md`.
    - **`author: contributor`** → same as above, with the active contributor's slug per site-info.
    - **`author: brand`** → reference the site's `Organization` `@id` as author. NO `Person` schema. Bio footer references the org's About page.
    - For sites where `site-info.md` declares a single byline mode (e.g., site-b: always co-byline; site-c: always real-founder), the per-post `author:` field is auto-set from that policy and the routing above is bypassed.
    - **Auto-determination** (only for sites with `coi-categories.md`): map post's primary keyword → category via `keywords.csv` / `service-keywords.csv`, look up category in `coi-categories.md`. If category appears in `personal_eligible` → `author: your-name-slug`. If category appears in `coi_adjacent` AND a contributor is onboarded → `author: contributor`. If category appears in `coi_adjacent` AND no contributor → `author: brand` (interim default). If category in NEITHER list → escalate to user (refuse to auto-classify).
10. **Schema (JSON-LD)** — `BlogPosting` (or appropriate subtype) + `BreadcrumbList` + `FAQPage`. Plus `Person` IFF `author: your-name-slug | contributor` (a real person), OR Organization-as-author IFF `author: brand`.
11. **Length** within ±20% of SERP median.
12. **TOC + jump links** if word count ≥ 1500 (`on-page-seo.md` Category 15).
13. **AI-search-friendly: Q+A density.** Beyond the dedicated FAQ section (item 8), structure 5+ in-body sections as explicit question→answer pairs (the H2 or H3 IS a question; the paragraph below IS the answer in the first sentence). LLMs preferentially cite passages that stand alone as direct answers. Examples: `## What does an AI consultant actually do?` (not `## The role of AI consultants`); `### Should you hire an AI consultant before reaching $500K revenue?` (not `### Timing considerations`).
14. **AI-search-friendly: citation-friendly chunking.** Paragraphs max 3 sentences. Lead each paragraph with the topic sentence — the main claim or answer. Front-load named entities (brands, places, products, people) in the sentence rather than burying them in subordinate clauses. LLMs preferentially cite paragraphs that read as standalone units.
15. **AI-search-friendly: self-contained facts.** Every paragraph must stand on its own. NO "as mentioned above," "as discussed earlier," "see the previous section," "we'll cover this later." LLMs lose context between paragraphs — write as if each paragraph is the only one cited. Restate key entities and context within the paragraph rather than referencing prior copy.
16. **AI-search-friendly: verifiable claims.** Every statistic, percentage, or numeric claim cites a source via inline link — McKinsey, Zapier State of Business Automation, Google's own data, BLS, public industry reports. Unsourced numbers read as fabricated to both readers and LLM citation engines. If you can't source a number, either drop it or label it as "Site A estimate" (only fine when explicit and rare).

### Step 7 — Fetch images

Per the chosen image source:
- **Pexels / Unsplash** — `node scripts/fetch-images.mjs --source=[name] --query="[primary keyword]" --count=[n] --site=[site] --slug=[slug] --hero`
- **Site library** — present a list from the site's media library; user picks.
- **AI-generated** — pause and ask the user to drop generated images into `_drafts/[slug]/images/`.
- **Client-supplied** — pause and wait for upload to `_drafts/[slug]/images/`.
- **None** — skip.

For all sources: enforce WebP under 200 KB, hyphenated filenames, descriptive alt text, width/height attributes, lazy loading on below-fold, eager + fetchpriority on hero.

### Step 8 — Validate (Rule 4)

Run all validation checks:
- ✅ Tier 1 (16 items) — auto-checked
- ✅ Schema validators — `node scripts/validate-schema.mjs --url=[staged URL]`
- ✅ Voice anti-AI check — re-read resolved `voice.md` "Tells that it's AI-written"; delete matches
- ✅ Cadence — verify publishing this post wouldn't exceed `site-info.md` → Content cadence
- ✅ Cannibalization — primary keyword not in `used-keywords.md`
- ✅ Banned-words scan
- ✅ Lighthouse spot-check on staged URL — `node scripts/lighthouse.mjs --url=[staged URL]`

If any check fails: refuse to ship, report what needs fixing, ask user how to proceed.

### Step 9 — Ship per publishing method

Read `site-info.md` → Publishing method:

- **`repo-commit`** — write markdown/MDX file to the site's repo path, commit images to `public/blog/[slug]/`, open a PR (or commit directly to a branch named `blog/[slug]`). Output: PR URL.
- **`cms-paste`** — write to `sites/[site]/_drafts/[slug]/post.md` + `meta.json` (with title, meta description, OG tags, schema, image filenames). Output: clipboard-ready content + image folder path.
- **`lovable-prompt`** — generate a Lovable-ready prompt embedding the post content and structural instructions. Output: paste-ready prompt.
- **`headless-api`** — push via the configured API (Sanity / Contentful / Strapi). Output: CMS draft URL.

### Step 10 — Update tracker

Append to `sites/[site]/used-keywords.md`:
```markdown
| YYYY-MM-DD | [primary keyword] | Blog | [URL] | [cluster keywords comma-separated] |
```

### Step 11 — Report

Print a summary:
- Post title + URL
- Word count + image count
- Tier 1 status (all 16 ✅)
- Schema validation status
- Lighthouse score (if checked)
- Cluster keywords used
- Next recommended action (e.g., "Submit to GSC for indexing within 7 days")

## Routine versioning + idempotency contract

This skill participates in cruise-control via `--cron` mode. When invoked by cron:

1. **Stamp `routine_version`** in every output produced (the `notes.md` audit entry header, `_inbox/` item frontmatter, draft folder metadata, audit log line written via `scripts/lib/audit-log.mjs`). Current `routine_version`: **1.0**. Bump when the skill's behavior meaningfully changes.

2. **Idempotency:** this skill MUST be safe to run twice in a row on the same day without producing duplicate work. Implementation: check `_drafts/{YYYY-MM-DD}-*` at the start of every cron-mode run; if today's slug already exists, exit cleanly with `exit: "idempotent-skip"`.

Reference: `docs/specs/2026-05-16-agents-cruise-control-design.md` § Operational hardening O3.

## Refusal conditions

The skill refuses to run if:
- Site folder doesn't exist or `site-info.md` missing.
- Resolved `references/` is incomplete (root files missing).
- `keywords.csv` is empty (and user didn't supply a primary keyword).
- Publishing this post would exceed cadence.
- Primary keyword already in `used-keywords.md` for this site.
