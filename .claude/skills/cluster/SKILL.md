---
name: cluster
description: Plan a topic cluster around a seed keyword for a chosen managed site. Pulls 5-15 SERP-clustered related keywords (per SEO_GUIDE Section 2.4 overlap test), designs a pillar page (broad target) + N cluster pages (narrow targets), specifies the internal-linking graph (pillar ↔ clusters + lateral cluster ↔ cluster), and generates wireframes for every page in one pass. Output lands in `_drafts/cluster-{seed-slug}/` ready for `/blog` or `/service` to fill in content. Use when the user types `/cluster {seed-keyword} {site}` or asks for a topic-cluster plan.
---

# `/cluster` — Topic cluster planner

Plans a complete topic cluster around a seed keyword: pillar page + N cluster pages + the internal-linking graph + wireframes for every page. Topical authority is built at cluster granularity, not single-post granularity — and this skill is what makes that engineering possible inside the toolkit.

## Inputs

Required (asked at start if not given):
- **Seed keyword** — the broad topical anchor. Examples: "ai consultant" (site-a), "spanish catering houston" (site-b), "endocrinologist houston" (site-c).
- **Site** — must match a folder under `sites/[name]/`. The skill reads its `site-info.md`.

Optional (per-run overrides):
- **`--max-clusters=N`** — caps the cluster count (default 8; valid range 3–15). Lower → faster ship; higher → fuller topical authority but more downstream content to write.
- **`--include-bottom-funnel`** — when set, includes commercial-intent clusters (pricing, vs-competitor, alternative) alongside informational ones. Default: informational-only.
- **Keyword tool** — overrides the site's default (SEMrush, GSC, Ahrefs, manual SERP analysis). Defaults to `site-info.md` → `Keyword tool`.

## Workflow

### Step 0 — Cron-mode detection (if invoked with `--cron`)

If the invocation contains `--cron`, this skill runs in cron mode (no user available). Required behavior:

1. **Idempotency check:** see this skill's "Routine versioning + idempotency contract" section. If today's output already exists at `_drafts/cluster-{seed-slug}/`, exit cleanly with `exit: "idempotent-skip"`. Write one line to the audit log via `scripts/lib/audit-log.mjs` `appendRun({ exit: "idempotent-skip", ... })`.

2. **Escalation contract:** any decision that would normally prompt the user (missing required file, voice anti-AI failure, ambiguous SERP cluster, keyword cannibalization) MUST be escalated by writing an item to `sites/{site}/_inbox/` via `scripts/lib/cron-mode.mjs` `writeInboxItem(...)`. After writing, exit cleanly with `exit: "escalated"`. Do NOT use `AskUserQuestion` in cron mode.

3. **Defaults:** when a choice would normally be asked, default to `site-info.md` / `goals.md` values. If both are silent on the required choice, escalate per (2).

4. **Audit log:** ALWAYS write one line to the audit log on exit — success (`shipped`), escalation (`escalated`), idempotent skip (`idempotent-skip`), or failure (`failed`).

5. **Backoff:** at the start of every cron-mode run, call `checkBackoff({ routine })` from `scripts/lib/audit-log.mjs`. If true, the routine has hit the 3-strike threshold — write `_inbox/routine-disabled-{name}.md`, run `scripts/sync-schedules.mjs --pause-routine={name}`, and exit.

### Step 1 — Read context (Rule 1)

Load in order:
1. `CLAUDE.md` (toolkit root) — especially `# Multilingual sites` and `# Keyword research` sections
2. `SEO_GUIDE.md` — Section 2.4 (SERP comparison test), Section 3.3 (cluster design), Section 5.1 (internal-linking patterns), Section 2.6 (architecture)
3. `on-page-seo.md` — Tier 1 reference (each cluster page eventually satisfies all 16)
4. `sites/[site]/site-info.md` — Languages block + footprint + Service business + Architecture pointer
5. `sites/[site]/architecture.md` if present (required for service-business sites with >3 commercial keywords)
6. Resolved `references/` — root files + per-site overrides
7. `sites/[site]/keywords.csv` and `sites/[site]/service-keywords.csv`
8. `sites/[site]/used-keywords.md`
9. `sites/[site]/notes.md`

If any required file is missing, ask the user before proceeding.

### Step 2 — Validate seed + intent

The seed keyword anchors the entire cluster. Validate:

1. **Intent classification.** Run a quick SERP look at the seed:
   - If top 10 is dominated by informational content (definitional posts, how-to guides, "what is X" pages) → informational cluster. Cluster pages mostly become blog posts.
   - If top 10 is dominated by commercial pages (service offerings, product pages, comparison/pricing) → commercial cluster. Cluster pages become service pages.
   - If mixed → flag and ask user which intent dominates this site's positioning before proceeding.

2. **Cannibalization check.** If the seed (or close variants) already appears in `used-keywords.md` or `keywords.csv` as the primary keyword of an existing/planned page, abort and report. Topic clusters cannot be built around a seed that's already been "spent" on a single page — the existing page must be retargeted as the pillar, OR a different seed picked.

3. **Architecture-fit check (commercial seeds only).** If site is service-business with architecture.md, the seed must already appear in architecture as a pillar candidate, OR the user adds it to architecture before generating. Off-architecture clusters create cannibalization at scale.

### Step 3 — SERP-cluster expansion

Goal: surface 5-15 keywords that share enough SERP overlap with the seed to belong on the same cluster.

1. **Pull related keywords** from the site's chosen keyword tool:
   - SEMrush: `scripts/semrush.mjs --keyword="{seed}" --type=related` (or `phrase_related` endpoint). Returns 50-200 related terms with volume + KD.
   - GSC fallback: if SEMrush unavailable, pull GSC top-queries where the site already shows up for variants of the seed (`scripts/keyword-discovery.mjs --site={site} --grep="{seed-stem}"`).
   - Manual fallback: pull PAA (People Also Ask) from Google + autocomplete suggestions.

2. **SERP-overlap test** (per `SEO_GUIDE.md` Section 2.4) on each candidate vs the seed:
   - Fetch top 10 for both incognito (target region per `site-info.md`).
   - Count shared URLs.
   - **≥ 4 shared → cluster member (high confidence)**
   - **2–3 shared → borderline (keep only if KD is attainable and volume ≥ 100)**
   - **≤ 1 shared → exclude (belongs on a different page, suggest as future seed)**

3. **Attainability filter.** Each candidate must satisfy `KD ≤ site_AS + 15` (the realism filter from v2 spec Hard Truth 2). Where:
   - `site_AS` = latest SEMrush Authority Score from `sites/{site}/_baselines/semrush-*.json`
   - Candidates above the threshold are flagged as "stretch" — included only if user explicitly opts in.

4. **Volume cap.** Cluster members should each have volume ≥ 50/mo (lower than the 100 floor for individual blog posts because clusters create compounding value through linking — even small-volume terms contribute to topical authority).

5. **Cap the final list at `--max-clusters` (default 8).** Rank by `volume × (1 / KD_distance)` and take the top N.

### Step 4 — Design the cluster shape

For each member of the cluster:

1. **Assign role.** One of:
   - **Pillar (broadest seed)** — the topical hub. Single page. Title matches the seed. Designed to rank for the broad term + serve as the entry point.
   - **Cluster page (specific aspect)** — N pages. Each covers one narrower angle (definition, how-to, vs-comparison, pricing, use-case, etc.).
   - **Optional spoke (very narrow long-tail)** — only if --max-clusters allows.

2. **Assign intent type.** Per page:
   - `info` — informational, becomes a blog post (handled by `/blog` later)
   - `comm` — commercial, becomes a service page (handled by `/service` later)
   - `mixed` — hybrid, becomes a blog post that bridges into commercial pages

3. **Title / H1 / slug.** Per page:
   - Title: 50-60 chars, primary keyword near start
   - H1: sentence case, contains the primary keyword
   - Slug: short, lowercase, hyphenated, contains primary keyword stem

4. **Per-language fan-out** (multilingual sites): each cluster page gets its EN + ES (or other declared language) variant. Slug is shared; titles/H1s are native rewrites per `voice.[lang].md`.

### Step 5 — Internal-linking graph design

The link graph is the load-bearing structure that converts N independent pages into a topical cluster.

1. **Pillar links to ALL clusters.** Every cluster page is linked from the pillar via inline anchor text (3-5 internal links per pillar section, each pointing to a relevant cluster).

2. **Every cluster links back to pillar.** Each cluster page has at minimum 1 "see the pillar" link in body copy, usually in the introduction or a "for the full overview, see [pillar]" callout.

3. **Lateral cluster links** based on SERP overlap:
   - For each pair of cluster pages, if they share ≥ 4 SERP URLs with each other → bidirectional internal link.
   - If they share 2-3 → unidirectional from the higher-volume one to the lower-volume one (lower one borrows authority).
   - If they share ≤ 1 → no lateral link.

4. **Anchor text variation.** Use varied anchor text across all links — never link the same target with the same anchor 3+ times across the cluster. Mix exact-match (the primary keyword), partial-match (variant), and natural-language (descriptive phrase).

5. **External links** (cluster-wide consistency): each page has 2-3 external links to authoritative sources. Across the cluster, those sources should overlap by 30-60% (signals topical consistency to Google).

### Step 6 — Wireframe generation

For the pillar AND each cluster page, generate a wireframe at the path defined in Step 9. Each wireframe follows the standard shape from `.claude/skills/wireframe/SKILL.md` and `CLAUDE.md` "Wireframe before content" rule, with cluster-aware additions:

Required wireframe sections (per page):
1. **Layout zones** (top-to-bottom): hero, TOC if 1500+ words, content sections (H2 per section), FAQ, related-cluster (the lateral links), author bio (blog) or NAP (service).
2. **Heading map** (H1 / H2 / H3) — H1 = primary keyword for this page; H2s ordered by what the SERP top 3 use as their structure (overlap > divergence).
3. **Internal linking pattern slots** (per `SEO_GUIDE.md` Section 5.1):
   - For pillar: patterns 1 (header dropdown), 2 (TOC), 3 (footer), 4 (breadcrumb), 7 (blog→service bridges to relevant cluster pages)
   - For cluster: patterns 1, 3, 4, 6 (related-cluster sidebar/end-section), 7 (back to pillar)
4. **Image plan** — hero image + N inline images.
5. **External link plan** — 2-3 authoritative sources by topic.
6. **CTA placement** — where the conversion ask sits.
7. **Cluster-specific section** — explicit list of which other cluster pages this page should link to (the lateral graph from Step 5).

### Step 7 — Plan + approval (Rule 2)

Present to user before writing any files:

- Seed + intent classification + dominant SERP shape
- Pillar page proposal: title + slug + intent
- Cluster page list: N rows of (keyword + title + slug + intent + role)
- Internal-link graph: ASCII or matrix view (pillar ↔ each cluster + lateral pairs)
- Language fan-out (multilingual): list of languages × pages = total file count
- Estimated downstream effort: N pages × ~1-2h per page (via `/blog` or `/service`) = total ramp-up time
- Architecture impact (commercial clusters): if pillar/clusters need to be added to `architecture.md`, list them

Wait for explicit approval. If user wants to reduce N → re-run Step 3-5 with smaller `--max-clusters`.

### Step 8 — Resolve language fan-out (multilingual sites only)

Read `site-info.md` Languages section.

- **`Multilingual: false`** → skip; continue to Step 9 as a single-language cluster.
- **`Multilingual: true`**:
  1. Default coverage = every language declared.
  2. For each declared language:
     - Resolve voice files: root `references/voice.md` + per-site `references/voice.[lang].md` (REQUIRED).
     - Cluster slug shared across languages.
     - Hreflang cluster generated for every page (en + es + x-default).
     - URLs formatted per language URL pattern from site-info.md.
  3. Schema `inLanguage` per language draft.

The skill produces 1 cluster × N languages = N×(pillar + clusters) wireframe files total. Each in its own `_drafts/cluster-{seed-slug}/{lang}/` subfolder.

### Step 9 — Write output

Create the directory tree:

```
sites/{site}/_drafts/cluster-{seed-slug}/
├── cluster-plan.md                         # overview + keyword assignments + link graph
├── {lang}/                                  # per-language (only if multilingual)
│   ├── pillar/
│   │   └── wireframe.md
│   └── clusters/
│       ├── {cluster-1-slug}/
│       │   └── wireframe.md
│       ├── {cluster-2-slug}/
│       │   └── wireframe.md
│       └── ... (N total)
```

Monolingual sites skip the `{lang}/` directory layer:

```
sites/{site}/_drafts/cluster-{seed-slug}/
├── cluster-plan.md
├── pillar/wireframe.md
└── clusters/{slug}/wireframe.md            # N of these
```

**`cluster-plan.md` contents:**

```markdown
# Cluster plan — {site} — {seed}

**Created:** {YYYY-MM-DD}
**Seed keyword:** {seed}
**Intent classification:** {info | comm | mixed}
**Site AS at plan time:** {N}
**Attainability ceiling (KD ≤ site_AS + 15):** {N+15}
**Languages:** {en, es, ...}

## Pillar page

- **URL:** {site-origin}/{lang-prefix}/{path}/{slug}
- **Primary keyword:** {pillar-keyword}
- **Title:** {pillar-title}
- **H1:** {pillar-h1}
- **Intent:** {info|comm|mixed}
- **Volume:** {volume}/mo
- **KD:** {kd}
- **Wireframe:** ./pillar/wireframe.md (or ./{lang}/pillar/wireframe.md)

## Cluster pages

| # | Keyword | URL | Title | Intent | Vol | KD | Wireframe |
|---|---------|-----|-------|--------|-----|-----|-----------|
| 1 | {kw} | ... | ... | info | ... | ... | ./clusters/{slug}/wireframe.md |
| 2 | ... | ... | ... | ... | ... | ... | ... |
... (N rows)

## Internal-link graph

### Pillar → Clusters (always, 1:N)
- pillar → cluster-1 (anchor: "{anchor-text-1}")
- pillar → cluster-2 (anchor: "{anchor-text-2}")
- ... (N edges)

### Cluster → Pillar (always, N:1)
- cluster-1 → pillar (anchor: "for the full overview…")
- cluster-2 → pillar (anchor: "see the parent guide…")
- ... (N edges)

### Lateral cluster ↔ cluster (per SERP overlap test)
- cluster-1 ↔ cluster-2 (bidirectional; shared SERP URLs: 5)
- cluster-2 → cluster-4 (unidirectional, lower-volume target; shared: 3)
- ... (M edges)

## Next-step build sequence

To ship the cluster, run these commands in order (suggested cadence: 1 per week to let Google crawl/index between):

1. `/blog {site} {pillar-keyword}` ← pillar first; clusters need it as the link target
2. `/blog {site} {cluster-1-keyword}` (or `/service` if intent=comm)
3. `/blog {site} {cluster-2-keyword}` (or `/service`)
... (N more)

Each `/blog` or `/service` run reads `_drafts/cluster-{seed-slug}/clusters/{slug}/wireframe.md` (or the pillar one) for its planning artifact, then generates content following the wireframe + the AI-search optimization rules (P1.5).

## Status

OPEN — awaiting user approval to start the N+1 content runs.
```

**`wireframe.md` contents (per page):** standard wireframe per `.claude/skills/wireframe/SKILL.md`, with the cluster-specific link slots populated from Step 5's graph.

### Step 10 — Update tracker

For each page in the cluster (pillar + N clusters), append a row to `sites/{site}/used-keywords.md` with status "planned via /cluster — wireframe shipped, content pending."

This prevents future `/blog` runs from accidentally picking the cluster's keywords as standalone targets. When the content actually ships via `/blog` or `/service`, those skills will update the row's status to "shipped."

### Step 11 — Report

Print:
- Pillar URL + cluster URLs (N total)
- Cluster plan file path: `sites/{site}/_drafts/cluster-{seed-slug}/cluster-plan.md`
- Total wireframes generated: N+1 (or (N+1) × num_languages for multilingual)
- Link graph summary: N pillar-to-cluster + N cluster-to-pillar + M lateral edges
- Suggested next-step command: `/blog {site} {pillar-keyword}` (start with pillar)
- Estimated full cluster shipping timeline: N+1 weeks at 1 post/week cadence

## Routine versioning + idempotency contract

This skill participates in cruise-control via `--cron` mode. When invoked by cron:

1. **Stamp `routine_version`** in every output produced (cluster-plan.md frontmatter, each wireframe's metadata, audit log line via `scripts/lib/audit-log.mjs`). Current `routine_version`: **1.0**.

2. **Idempotency key:** the cluster slug + seed keyword. If `sites/{site}/_drafts/cluster-{seed-slug}/cluster-plan.md` exists from a prior run with matching seed, exit with `idempotent-skip`. Do not regenerate (user may have already started content runs against the existing wireframes).

3. **3-strike contract** (per `scripts/lib/audit-log.mjs`): three consecutive `failed` runs for this skill on a given site → pause automatic invocation, write `_inbox/routine-disabled-cluster.md`.

## Refusal conditions

Refuse and report clearly if:
- Seed keyword already in `used-keywords.md` as a primary target of an existing page (cannibalization risk — must retarget existing page or pick different seed)
- Site is service-business with >3 commercial keywords AND `architecture.md` is missing (per `SEO_GUIDE.md` Section 2.6)
- Site has no `keywords.csv` or it's empty (cluster expansion needs candidate pool)
- Multilingual site with missing `references/voice.[lang].md` for any declared language
- `--max-clusters` outside valid range (3-15)
- SERP-cluster expansion returns 0 candidates that pass the overlap + attainability filters (in this case, the seed is structurally not a cluster — it's a single-page target; recommend `/blog` or `/service` directly)
