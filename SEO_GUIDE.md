# SEO Implementation Guide — Existing Sites Edition

A step-by-step guide to running consistent, high-quality SEO across multiple existing websites you manage. Covers keyword research, content creation, on-page SEO, technical SEO, off-page SEO, foundational tracking, and a portfolio-prioritization workflow.

> **Customized for:** Your Name / SiteA — managing 20+ existing websites across multiple platforms (Lovable, WordPress, Webflow, Next.js, Shopify, etc.). Toolkit-based approach: one shared SEO toolkit repo applied to many sites.

---

## Overview

Two core tactics:
1. **Blog posts at scale** — to build topical authority and domain trust.
2. **Service pages** — to capture money keywords and convert traffic into customers.

Four pillars:
- Finding winning keywords
- On-page SEO
- Technical SEO
- Off-page SEO

> **Note on AI SEO:** Ranking well in traditional SEO generally translates to ranking well in AI-driven search. Focus on SEO fundamentals.

---

## 1. Setup

### 1.2 Set up your SEO toolkit repo

A standalone, private GitHub repo that holds your shared SEO assets and a per-site folder for every website you manage. The toolkit operates **on** existing sites — it doesn't replace them.

**Recommended location:** `~/seo-toolkit/`

**Repo name:** `seo-toolkit` (private, on `your-github-handle` GitHub).

**Structure (hybrid: shared toolkit + per-site folders):**

```
seo-toolkit/
├── CLAUDE.md                         ← toolkit system rules (Appendix B)
├── SEO_GUIDE.md                      ← this file
├── on-page-seo.md                    ← 80+ signal checklist (Appendix A)
├── README.md
├── package.json                      ← only if scripts/ has deps
├── .env                              ← API keys (gitignored)
├── .gitignore
│
├── references/                       ← default voice (Your Name / SiteA)
│   ├── voice.md
│   ├── humour.md
│   ├── stats.md
│   ├── stories.md
│   └── opinions.md
│
├── .claude/
│   └── skills/
│       ├── blog/SKILL.md
│       ├── service/SKILL.md
│       ├── refresh/SKILL.md
│       ├── audit/SKILL.md
│       └── triage/SKILL.md
│
├── scripts/
│   ├── fetch-images.mjs
│   ├── validate-schema.mjs
│   └── lighthouse.mjs
│
└── sites/                            ← one folder per managed site
    ├── site-a/
    │   ├── site-info.md
    │   ├── keywords.csv
    │   ├── service-keywords.csv
    │   ├── used-keywords.md
    │   ├── notes.md
    │   ├── references/               ← optional per-site override
    │   └── _drafts/                  ← gitignored
    └── ... (one folder per site)
```

**Resolution rule:** the `/blog` and `/service` skills load reference files in this order, with later overriding earlier:
1. `seo-toolkit/references/[file].md` (default)
2. `seo-toolkit/sites/[site-name]/references/[file].md` (override, if it exists)

A site can override just `voice.md` and inherit the rest.

**`site-info.md` template** (per managed site):

```markdown
# Site Info — [Site Name]

## Basics
- **Site name:**
- **URL:** https://example.com
- **Platform:** WordPress / Shopify / Webflow / Lovable / Next.js / Squarespace / Wix / Custom / Other
- **Rendering:** SSG / SSR / CSR / Hybrid (matters for SEO — flag if CSR)
- **CMS / dashboard URL:**
- **Credentials location:** [e.g., 1Password vault name]
- **Hosting:** [Vercel / Netlify / SiteGround / Cloudflare / etc.]
- **Repo (if any):** [GitHub URL or "no repo"]
- **Languages:** [en / es / multilingual + hreflang setup notes]
- **Publishing method:**
  - `repo-commit` (Claude commits markdown/MDX to GitHub, deploys via Vercel/Netlify)
  - `cms-paste` (Claude generates clipboard-ready output; you paste into WordPress/Webflow/Shopify/etc.)
  - `lovable-prompt` (Claude generates a Lovable-ready prompt + content; you paste into Lovable)
  - `headless-api` (Claude pushes to a headless CMS via API — Sanity, Contentful, Strapi)
- **Publishing target details:** [repo URL + path / CMS dashboard URL / Lovable project URL / API endpoint]
- **Last updated:** YYYY-MM-DD

## Business
- **What they do:** one-sentence elevator pitch
- **Target audience:** who buys, decision-maker profile
- **Service business:** true / false
  - `true` → Section 4 (Service Pages) applies.
  - `false` → Skip Section 4. Money keywords flow through other page types.
- **Geographic footprint:** single-location / multi-location / service-area / national-online
- **Locations / service areas:** [list — addresses if multi-location, cities/regions if service-area]
- **Service areas / cities:** [drives local SEO + zipper strategy]
- **Primary services / products:** [bulleted list]
- **NAP:** Name / Address / Phone (per location if multiple)
- **Hours of operation:**

## SEO baseline
- **Google Search Console:** verified ✅/❌ — [property URL]
- **GSC property type:** Domain / URL prefix
- **Google Analytics 4:** [property ID + measurement ID]
- **Linked to GSC:** ✅/❌
- **GTM container ID (GTM-XXXXX):**
- **Google Business Profile:** [link, claimed ✅/❌]
- **GBP setting:** Storefront / Service-area / Hybrid
- **Bing Webmaster Tools:** [link or N/A]
- **IndexNow enabled:** ✅/❌
- **Sitemap URL:** /sitemap.xml — auto / manual / missing
- **robots.txt:** /robots.txt — present ✅/❌
- **Schema markup in place:** [Organization / LocalBusiness / Article / FAQ / Product / etc.]
- **Canonical strategy:** [self-referencing / cross-domain / issues]
- **Indexed pages (latest GSC count):**
- **Average position (last 28 days):**
- **Top 5 organic landing pages:**
- **Last technical SEO audit:** YYYY-MM-DD
- **Keyword tool (default):** SEMrush / Ahrefs / Google Keyword Planner / GSC only / Ubersuggest / Surfer / Other / None yet
- **Keyword tool override:** can be passed per-run via `/blog --tool=ahrefs` or `/service --tool=gsc`

## Keywords & competitors
- **Primary money keywords:**
- **Top 3–5 competitors (organic):**
- **Known keyword gaps:**

## Backlinks (snapshot)
- **Domain Authority / DR:**
- **Referring domains:**
- **Notable backlinks:**
- **Toxic / disavowed links:**

## Conversion
- **What counts as a conversion:** [form fill / call / purchase / booking]
- **Conversion tracking setup:** [GA4 events / Tag Manager / pixel]
- **Current conversion rate:**
- **Primary CTAs on the site:**

## Content
- **Publishing cadence:** [e.g., 2 posts/week, ramping]
- **Stage:** new / growing / established / mature
- **Blog cadence:** [posts/week]
- **Service-page cadence:** [pages/week — see Section 4.2 caps]
- **Last 30-day publish count:** [auto-tracked]
- **Hard pause:** [date if temporarily halted]
- **Voice override:** root `references/` ✅ / own `sites/[name]/references/` ❌
- **Default image source:** Pexels / Unsplash / Site library / AI-generated / Client-supplied / None
- **Image source notes:** [API keys, library path, AI tool of choice, brand restrictions]
- **Brand assets location:** [logo, colors, image library — link]
- **Content owner / approver:**

## Stakeholders
- **Client / owner contact:**
- **Decision-maker:**
- **Technical contact (developer):**

## Known issues & technical debt
- [Recent migrations, penalties, redirect chains, manual actions, Core Web Vitals problems, slow pages, etc.]

## Notes
- [Anything else site-specific]
```

### 1.3 Rendering — Audit Existing Sites & Standard for New Builds

**For every existing site you manage:** identify the rendering type and log it in `sites/[site-name]/site-info.md`.

| Rendering | SEO Impact | Action |
|-----------|-----------|--------|
| **SSG** (Static Site Generation) | ✅ Best — HTML pre-rendered at build, fast, fully crawlable | Keep |
| **SSR** (Server-Side Rendering) | ✅ Acceptable — HTML rendered per request, fully crawlable but slower TTFB | Monitor performance |
| **CSR** (Client-Side Rendering) | ⚠️ Structural disadvantage — content invisible to first-pass crawlers and most AI search crawlers | Fix or prerender |
| **Hybrid** | ✅/⚠️ — depends on which routes are static vs client-rendered | Audit route by route |

#### Platform defaults — quick cheat sheet

| Platform | Default Rendering | SEO Status |
|----------|------------------|-----------|
| WordPress | SSR (PHP) | ✅ Fine out of the box |
| Shopify | SSR | ✅ Fine out of the box |
| Webflow | SSR | ✅ Fine out of the box |
| Squarespace / Wix | SSR | ✅ Fine out of the box |
| Framer | SSR | ✅ Fine out of the box |
| **Lovable / Bolt / v0** (AI builders) | CSR (React) | ⚠️ Flag every time |
| Next.js / Astro / Nuxt / SvelteKit | Configurable | Audit per route |

#### How to check rendering on an existing site

**Method 1 — View source (quick check)**
1. Right-click the page → **View Page Source**.
2. Search the source for a unique sentence from the visible page.
3. **Found** → SSG or SSR ✅ &nbsp; **Not found** (only `<div id="root">` and JS bundles) → CSR ⚠️

**Method 2 — Disable JavaScript (browser test)**
1. Chrome DevTools → ⋮ menu → More tools → Settings → **Disable JavaScript**.
2. Reload the page. If content disappears → CSR.

**Method 3 — Google Search Console URL Inspection (gold standard)**
1. GSC → URL Inspection → enter the page URL.
2. Click **View Crawled Page** → **Rendered HTML** tab.
3. This is exactly what Googlebot sees. If the rendered HTML is empty or missing your content → CSR rendering problem.
4. Use this as the authoritative answer; view-source can lie if the framework hydrates aggressively.

#### What "structural SEO disadvantage" means for CSR sites

Not a Google penalty — a structural handicap. Specifically:
- **Empty first-pass HTML** — Googlebot's first crawl sees `<div id="root">` and JS files, no content.
- **Delayed indexing** — Google's second-pass renderer runs JS, but on a delay (days to weeks). Large sites burn crawl budget faster.
- **AI search blindness** — ChatGPT, Perplexity, Claude, and Google AI Overviews crawlers often don't execute JS. If your content isn't in the initial HTML, **AI search may never see it**. Increasingly important.
- **Core Web Vitals hit** — content paints later, hurts LCP, hurts ranking.

#### Escape hatch for CSR sites you can't rebuild

If migrating isn't an option (e.g., a Lovable site already in production with traffic):

| Tool | Approach | Notes |
|------|----------|-------|
| **Prerender.io** | Serves pre-rendered HTML to bots only | Most common, easy setup |
| **Cloudflare Workers / Snippets** | DIY prerendering at the edge | More control, more setup |
| **Rendertron** | Open-source, self-hosted | Free but operational overhead |

Stopgap, not ideal long-term. Plan migration when revenue justifies it.

#### For any new site (rare, but if it happens)

**Lovable trade-off — be explicit:**
- ✅ Lovable = fast to build, beautiful UI, low effort.
- ⚠️ Lovable = CSR by default = structural SEO disadvantage out of the gate.
- **Decision rule:** if SEO matters for the new site, use Next.js SSG (or Astro). If SEO doesn't matter (internal tool, demo, app behind login), Lovable is fine.

**SEO-first new build standard:**
- **Required:** Static Site Generation (SSG).
- **Stack:** Next.js with `output: 'export'`, pre-renders every route to HTML at build time.
- **SSG constraints — do NOT break:**
  - No `cookies()`, `headers()`, or `searchParams` in server components.
  - No `fetch(..., { cache: 'no-store' })` or `export const dynamic = 'force-dynamic'`.
  - No runtime API routes.
  - Dynamic routes (`[slug]`) must implement `generateStaticParams`.
  - All data fetched at **build time**, not request time.

---

## 2. Keyword Research

### 2.0 Methodology — Customer Journey + Seed Ideas + One-Page-One-Intent

Before opening any tool, three foundations must be in place. Skipping them produces keyword lists that look comprehensive but ship pages that fight each other for the same SERP.

#### Customer Journey SEO (the framing)

Traditional marketing splits the buyer journey into **awareness → consideration → purchase**. SEO maps cleanly to two stops:

| Journey stage | Search type | Page type | Toolkit skill |
|---------------|-------------|-----------|---------------|
| Awareness + Consideration | **Informational** ("what is X", "how to Y", "why does Z") | Blog post | `/blog` |
| Purchase | **Transactional / Commercial** ("buy X", "X agency", "X near me", "best X for Y", "X cost") | Service page | `/service` |

The same user shows up twice — first asking a question, later asking for a vendor. Every site needs **both** stops, and they must be cross-linked: informational posts internally link to the relevant service page, service pages link back to supporting informational posts. A site that only has blog posts attracts traffic but doesn't convert. A site that only has service pages converts the few who already know they want it but never builds top-of-funnel demand.

In 2026 the journey is also **multi-platform** at the informational stage: a meaningful share of awareness/consideration queries happens in LLMs (ChatGPT, Gemini, Perplexity, Google AI Overviews), but the transactional stage still terminates in Google. AI search is complementary, not substitutive — and that's why the toolkit's `/blog` flow includes an AI-search-citations check (Section 3.5) while `/service` does not.

#### Seed-idea generation (BEFORE any keyword tool)

Tools surface variations of seeds you give them. If the seeds are wrong, the rest of the research is wrong. Pull seeds from four sources before opening Keyword Planner / SEMrush / Ahrefs:

1. **Brainstorm how customers actually name what you sell.** They rarely use your internal label. ("Fruit distributor" vs. "fruit wholesaler" vs. "fruit supplier" all map to the same business but have different volumes and SERPs.)
2. **Client / business-owner interview.** One question: *"If you could be #1 on Google for one search tomorrow, what would it be?"* That single answer is usually the most commercially valuable keyword on the site.
3. **Competitor scan.** Pull the top 3–5 competitors' homepages + service pages. Note the H1, the URL slugs, and the words they use to label categories. These are the seeds the market has already validated.
4. **Competitor blog mining via `inurl:blog`** — type `inurl:blog [your topic]` into Google. Returns competitor blog posts on that topic across the web. Read 5–10 to find angles your seed list missed and to harvest specific terminology customers use in informational content. Verify any new candidates in Keyword Planner before adding to the list.
5. **AI brainstorm.** Ask ChatGPT/Gemini/Claude to generate 30–50 ways a customer might search for the product/service. Treat output as a draft seed list, not finished research.

The combined seed list (typically 15–40 terms) is what gets fed into the keyword tool in Sections 2.1 and 2.2.

#### Hard rule: one page = one search intent

Every page on the site targets exactly one search intent. Two keywords go on the same page **only if** their SERPs overlap (verified per Section 2.4). Two keywords with similar wording but different SERPs go on different pages. This is the rule that prevents cannibalization at the planning stage — long before `used-keywords.md` has to catch it.

This rule sits underneath every cluster in Section 3.3 and every architecture entry in Section 2.6.

### 2.1 Find Blog Post Keywords (Informational Intent)

Use whichever keyword tool is set in `sites/[site-name]/site-info.md` (or the override). The workflow is the same regardless of tool.

**Filters to apply:**
- **Keyword Difficulty (KD):** ≤ 30 (low competition, achievable for most sites)
- **Search Volume:** ≥ 100 monthly searches (enough demand to bother)
- **Intent:** Informational (how-to, what-is, why-does, guide, tips)
- **Language / Region:** match the site's target market (set in `site-info.md`)

**Workflow:**
1. Enter the site's **root keyword** (e.g., `plumber`, `dental implants`, `AI for sales`).
2. Apply the filters above.
3. **Manually exclude:** competitor brand names, irrelevant matches, branded queries, queries you can't credibly answer.
4. Pull the **Questions** view (every major tool has one — "Questions" in SEMrush, "Matching terms → Questions" in Ahrefs, "People Also Ask" via manual Google).
5. Look for **adjacent topics** higher up the buyer funnel (problems your customer has *before* they know they need your service).
6. Optionally, run a **competitor keyword gap** analysis (which keywords competitors rank for that you don't).

**If using free tools only (GSC + Keyword Planner):**
- GSC's **Performance → Queries** shows what you already rank for and where you're between positions 5–20 (low-hanging fruit to push to page 1).
- Keyword Planner gives volume but no difficulty — estimate difficulty manually by checking SERP authority of top 3 results.
- Use **Google's "People Also Ask"** and **autocomplete** as free question-mining.

### 2.2 Find Service Page Keywords (Money Keywords)

Money keywords have **commercial / transactional intent** — the searcher is ready to buy or hire. They convert at a fraction of informational traffic but at a much higher value.

**Filters to apply:**
- **Cost Per Click (CPC):** sort descending — high CPC = advertisers paying for these clicks = real buying intent.
- **Intent:** Commercial or Transactional ("buy", "hire", "near me", "[service] [city]", "best [service]", "[service] cost", "[service] quote").
- **Keyword Difficulty:** less restrictive than blog posts — money keywords are worth fighting for. Acceptable up to KD ~50 if the CPC justifies it.
- **Volume:** ≥ 50 monthly searches is workable for local commercial terms.

**Patterns to look for:**
- **Service + city** — `plumber Toronto`, `dental implants Vancouver`, `AI consultant Buenos Aires`.
- **Service + qualifier** — `emergency plumber 24/7`, `same-day dental implants`, `affordable AI agency`.
- **"Near me" variants** — Google geo-locates these; if the site has local NAP, it can rank.
- **Comparison / decision-stage** — `[competitor] vs [you]`, `best [service] for [use case]`, `[service] pricing`.
- **Bottom-funnel modifiers** — `quote`, `cost`, `pricing`, `book`, `hire`, `near me`, `today`.

**Workflow:**
1. Enter the site's **root service keyword**.
2. Sort by CPC descending.
3. Skim the top 50–100 results — flag anything with clear buying intent.
4. Build a **service × location matrix** (the zipper strategy — covered in Section 4.1).
5. Manually exclude branded queries you can't compete on.

**If using free tools only:**
- Google Keyword Planner shows CPC ranges — sort by "Top of page bid (high range)".
- GSC Performance shows commercial queries you already rank for — sort by impressions, filter for queries containing buying-intent modifiers.
- Manual SERP check: search a candidate keyword in incognito; if results are mostly ads + service pages (not blog posts), that's commercial intent.

### 2.3 Store Keywords (Per-Site)

Each site's keywords live inside that site's folder in the toolkit, **not** at the root. This keeps sites isolated and prevents cross-contamination.

**Folder location:**
```
seo-toolkit/
  sites/
    [site-name]/
      keywords.csv              ← informational / blog post keywords
      service-keywords.csv      ← commercial / money keywords
      used-keywords.md          ← tracker so primaries aren't reused
```

**Required CSV columns (any tool, normalized to this schema):**

| Column | Description |
|--------|-------------|
| `keyword` | The keyword phrase |
| `volume` | Monthly search volume |
| `kd` | Keyword Difficulty (0–100) |
| `cpc` | Cost per click (USD) |
| `intent` | Informational / Commercial / Transactional / Navigational |
| `serp_features` | Featured snippet, PAA, video, image pack, etc. (optional) |
| `peak_months` | Comma-separated month abbreviations or `year-round`. E.g. `Nov,Dec`, `Q4`, `year-round`. (optional — see Section 2.5) |
| `seasonality` | One of: `stable`, `seasonal`, `holiday-spike`, `declining`. (optional — see Section 2.5) |
| `notes` | Any manual flag — "competitor branded", "high priority", "covered in Q2", etc. |

**`peak_months` and `seasonality` are optional.** Existing CSVs without these columns continue to work. When the columns are present, the `/blog` and `/service` skills consult them and flag (soft) before publishing an out-of-season primary keyword. See Section 2.5.

**Export workflow by tool:**
- **SEMrush:** Keyword Magic Tool → save to list → export CSV → rename columns to match schema if needed.
- **Ahrefs:** Keywords Explorer → matching terms → export → map columns.
- **Google Keyword Planner:** download plan as CSV → manually add `kd` (estimate from SERP) and `intent`.
- **GSC only:** Performance → Queries → export → manually classify intent and estimate KD.

**`used-keywords.md` format:**

```markdown
# Used Keywords — [site-name]

Tracker of primary keywords already published. Prevents accidental cannibalization.

| Date | Primary Keyword | Page Type | URL | Cluster Keywords |
|------|----------------|-----------|-----|------------------|
| 2026-04-29 | emergency plumber Toronto | Service | /services/emergency-plumber-toronto | 24/7 plumber, after hours, weekend plumber |
| 2026-04-30 | how to fix a leaky faucet | Blog | /blog/fix-leaky-faucet | dripping tap, faucet repair, kitchen sink leak |
```

**Why this matters:** Two pages targeting the same primary keyword will cannibalize each other (Google can't decide which to rank → ranks neither well). The tracker prevents it.

### 2.4 Search-Intent Verification — the SERP-comparison test

**The grouping question.** Given two keywords, do they belong on the same page (one URL targeting both) or on separate pages (two URLs)? The answer is in the SERPs, not in the wording.

**The test (run before clustering, before architecture):**

1. Open an **incognito** browser window in the target region (set Google to that country if needed).
2. Search keyword A. Note the **top 10 organic URLs** (skip ads, "People also ask" boxes, video carousels).
3. Repeat for keyword B in a fresh incognito tab.
4. Count how many of the top 10 URLs are **shared** between both SERPs.

**Decision rule:**

| Shared URLs in top 10 | Verdict | Action |
|----------------------|---------|--------|
| **≥ 4** | Same intent | Both keywords go on the **same page** (cluster them) |
| **2–3** | Borderline | Judgment call — prefer separate pages unless the second keyword has < 100/mo volume (then cluster as tertiary) |
| **≤ 1** | Different intent | **Separate pages.** Putting them on one page splits the page's relevance signal and ranks for neither |

**Worked example:** `ai consultant` vs `ai consultant for business`. SERP A is dominated by listicles + agency homepages; SERP B leans toward "how a small business hires a consultant" how-tos. If the top 10 share only 1 URL, these are two pages — even though the wording almost matches. Putting them on one page would force a single H1, single intent, and lose ranking for whichever angle the page didn't pick.

**When to run the test:**
- Building a cluster in `/blog` Step 3 — every cluster term gets the test against the primary.
- Designing the transactional architecture in Section 2.6 — every two adjacent rows get tested before they become two pages or one merged page.
- Refreshing a post in `/refresh` — if a candidate cluster term has been competing in `keywords.csv` since the original draft, re-run the test before adding it (SERPs drift).

**Documentation.** When the test resolves a borderline case, record it inline in `keywords.csv` → `notes` column (e.g., `"SERP-test 2026-05-03: 1/10 shared with 'ai consultant' → separate page"`). Saves re-running the test on every refresh.

### 2.5 Seasonality

**The concept.** Search volume isn't constant. Some keywords spike in Q4 (gifts, "best [thing] 2026" lists), some peak in summer (travel, AC repair), some are tied to specific events ("wedding photographer June"), some are completely flat year-round (most B2B SaaS terms). Ignoring this leads to two failure modes:

1. **Shipping out of phase.** Publishing a December-spike post in March means it sits dead until November — by which point a competitor has shipped fresher content.
2. **Misreading volume.** A keyword that says "12,000/mo average" but is actually `1,000/mo × 11 + 1,000 in November + 11,000 in December` is a Christmas keyword, not a high-volume year-round one.

**How to capture seasonality.** Google Ads Keyword Planner exports the last 12 months of monthly volume per keyword (see Section 2.7 step 6). Sparkline that across 12 columns and the pattern is visible in seconds: stable, single peak, two peaks, declining trend.

**Toolkit fields.** When the seasonality is meaningful, populate the `peak_months` and `seasonality` columns in `keywords.csv` / `service-keywords.csv` (Section 2.3 schema):

| `seasonality` value | Meaning | Typical `peak_months` |
|---------------------|---------|------------------------|
| `stable` | < 30% variance month-to-month — true year-round demand | `year-round` |
| `seasonal` | Clear annual pattern, recurring peak window | e.g. `Jun,Jul,Aug` for summer-tied terms |
| `holiday-spike` | Massive single-event peak that dominates annual volume | `Nov,Dec` (Christmas), `Feb` (Valentine's), etc. |
| `declining` | Year-over-year downward trend regardless of month | (leave `peak_months` empty) |

**How skills consult these fields (soft enforcement).**

When `/blog` or `/service` picks a primary keyword and either column is populated:

- If **today's month is in `peak_months`** OR `seasonality = stable` → proceed normally.
- If **today's month is NOT in `peak_months`** AND `seasonality = seasonal` or `holiday-spike` → flag the user before generating:
  > "This keyword peaks in [Nov, Dec]. Today is [May]. Publishing now means the post sits low-traffic for ~6 months before its peak window. Options: (a) proceed anyway — early publish gives Google time to crawl + rank before the peak; (b) pick a different keyword from `keywords.csv` with year-round demand; (c) defer this post to [3 months before peak]. Which?"
- If `seasonality = declining` → flag:
  > "This keyword's volume is trending down YoY. Confirm before generating, or pick a fresher angle."

The skill never refuses on seasonality alone — option (a) is always available. Soft flags only.

**Refresh implications.** When `/refresh` runs, it should check `peak_months` against the current date — refreshing a December-peak post in October is good timing; refreshing it in February is wasted effort.

### 2.6 Transactional SEO Architecture

**What it is.** A planning deliverable that maps the **commercial side** of a site as a hierarchy: which page targets which intent, with monthly volumes, before any `/service` runs. It's the difference between "ship service pages until we run out of keywords" and "the site has a coherent commercial structure that Google can index as a topic graph."

**When required.** Any **service-business site** (`service-business: true` in `site-info.md`) with **more than 3 entries in `service-keywords.csv`** must have an `architecture.md` before further `/service` runs. Three or fewer commercial keywords don't need a hierarchy — the pages are flat. More than three, and the structure stops being self-evident.

**Where it lives.** `sites/[site-name]/architecture.md`. Template at toolkit root: `templates/architecture.md`.

**Structure.** Three levels, each row carrying its monthly volume:

```
Level 0: Homepage (broadest commercial intent)
  ├── Level 1: Category — one search intent each
  │     ├── Level 2: Subcategory — more specific terms within that category
```

**Rules:**

- **Each row targets exactly one search intent** (per Section 2.0 hard rule). If two rows have overlapping SERPs, merge them (Section 2.4 test).
- **Volumes come from the `volume` column in `service-keywords.csv`**. Sum at the end of each level — visualizes where the demand actually is.
- **Architecture freezes the URL pattern**. Once a row is in the architecture, its URL is committed (renaming requires redirects).
- **The hierarchy isn't necessarily the nav structure** — Google uses the URL hierarchy + internal linking to infer the topic graph. The visible nav can be flatter for UX reasons.

**Worked example (a fictional fruit-distribution site):**

```markdown
## Transactional architecture — fresh-fruit-co.example

### Level 0 — Homepage
| Keyword | Monthly volume |
|---------|----------------|
| fruit distributor | 2,400 |
| fresh fruit supplier | 1,300 |
| **Total Level 0** | **3,700** |

### Level 1 — Categories (1 page each)
| URL | Primary keyword | Monthly volume |
|-----|-----------------|----------------|
| /services/wholesale-citrus | citrus wholesaler | 880 |
| /services/wholesale-berries | berry wholesaler | 590 |
| /services/wholesale-tropical | tropical fruit wholesaler | 320 |
| **Total Level 1** | | **1,790** |

### Level 2 — Subcategories (1 page each, where SERP-test passes Section 2.4)
| URL | Primary keyword | Monthly volume | Parent |
|-----|-----------------|----------------|--------|
| /services/wholesale-citrus/oranges | orange wholesaler | 210 | citrus |
| /services/wholesale-citrus/lemons | lemon wholesaler | 110 | citrus |
| /services/wholesale-berries/strawberries | strawberry wholesaler | 240 | berries |
| **Total Level 2** | | **560** | |
```

**How the toolkit uses this:**
- `/service` reads `architecture.md` before generating. The new page must already be planned in the architecture (or the user must add it explicitly first). Prevents off-architecture sprawl.
- `/triage` flags sites that hit the > 3 commercial-keywords threshold without an `architecture.md` and recommends creating one.
- `/audit` doesn't consume `architecture.md` directly, but does sanity-check that every URL in the sitemap appears in either the architecture (commercial pages) or `used-keywords.md` (informational pages). Orphaned URLs surface there.

**When to update.** Adding a new commercial keyword to `service-keywords.csv` is a trigger to revisit the architecture. Run the SERP-comparison test (Section 2.4) against the closest existing row — does the new keyword fold into an existing page (cluster), become a sibling (new Level-1 or Level-2 row), or split an existing row in two (parent + children)?

#### 2.6.1 Pseudo-transactional gate (admission test)

Before a keyword enters the architecture as a row, verify it's actually transactional. Some keywords look transactional (commercial wording, decent volume) but their SERPs return informational content — listicles, definitions, blog posts. Those keywords belong in `keywords.csv` (blog) not `service-keywords.csv` (architecture).

**The test:**
1. Search the candidate keyword incognito in the target region.
2. Look at the top 10 organic results. Are they:
   - **Service / product / agency pages** → keyword is transactional. Admit to architecture.
   - **Listicles, blog posts, "what is X" guides** → keyword is informational despite the wording. Move to `keywords.csv`. Don't admit.
   - **Mixed** (4–6 transactional / 4–6 informational) → borderline. Either pick the dominant intent or split into two queries.

This is the same Section 2.4 SERP-comparison test, applied at architecture-admission time.

**Concrete examples of pseudo-transactional traps:**
- `"best [service] for [niche]"` — often returns listicles, not service pages.
- `"how much does [service] cost"` — often returns calculator articles, not pricing pages.
- `"[service] reviews"` — often returns review aggregators, not the service itself.

If the SERP is informational, write a blog post about the topic with strong internal links to your transactional page. Don't try to rank a service page on an informational query.

#### 2.6.2 Business-opportunity keywords (parallel category branches)

Some keywords don't fit the main category tree but represent real demand. Common patterns:

- `[product] cheap` / `[service] affordable` — price-sensitive variants
- `[product] offers` / `[service] deals`
- `[product] used` / `[product] second-hand`
- `[service] near me` / `[service] in [city]`
- `[product] for [audience]` (e.g., `dog houses for big dogs`)

These often add **thousands of monthly searches** that the main category tree misses. Treat them as **parallel branches** in the architecture: a separate Level-1 or Level-2 row that shares ancestry with the main tree but lives at its own URL.

Example:
- Main tree: `/dog-houses/large/` (size-based)
- Business-opportunity branch: `/dog-houses/cheap/` (price-based)

Both are Level-1. Both target distinct intents. Both verify SERP-distinctness via Section 2.4. Both belong in the architecture file.

#### 2.6.3 Deriving the navigation menu from the architecture

The visible nav menu is derived from Level-1 rows. Two rules:

1. **One menu item per Level-1 category** that has > 100/mo combined volume in its subtree.
2. **Overflow handling.** If Level-1 has more than ~7 categories, surface only the top-N by volume in the visible menu, with a "See all" link to a distribution page that lists the rest. Crowded menus hurt UX and dilute click signal.

Visible nav can be flatter than the architecture — that's fine. Google uses URL hierarchy + internal linking to infer the topic graph regardless of menu depth. The menu is a UX surface, not a ranking signal.

Footer links can carry overflow categories that didn't make the primary menu. Footer also handles low-volume but legally-required links (privacy, terms, accessibility).

#### 2.6.4 Distribution pages (página distribuidora) — when to use one

A **distribution page** is a category-marker URL that has no unique content of its own — it just routes users to subcategories. Two architecture options:

| Pattern | URL example | When to use |
|---|---|---|
| **Without distribution page** | `/dog-houses/large/` (size is the slug, no marker layer) | Most catalogs. Simpler, fewer URLs, less crawl budget. |
| **With distribution page** | `/dog-houses/size/large/` (size/ is a marker) | When you have multiple orthogonal axes (size + material + breed) and want each axis explorable on its own page. |

**Trade-offs.** Distribution pages add a navigable hub for an axis (good UX for filtering, good for ranking the axis term `dog house sizes`) but require their own thin content (or rich enough content to rank). If the distribution page is empty filler, skip it — Google will treat it as a soft 404 risk.

**Default recommendation:** without distribution page (flatter URLs) unless the axis itself has its own search demand. Verify with `[axis term]` SERP — if it returns category-distributor content, build the distribution page.

#### 2.6.5 Architecture filters out keywords without traffic

Even after the SERP-test admits a keyword, apply the volume floor:
- **≥ 50/mo** for service-area or local commercial keywords.
- **≥ 100/mo** for non-local commercial keywords.

Architecture rows below the floor are usually noise — admit them only if they're a high-CPC bottom-funnel niche where 20/mo at $50 CPC pays for the page.

### 2.7 Free Research Recipe — Google Ads Keyword Planner

The toolkit is tool-agnostic. SEMrush, Ahrefs, Mangools, KWFinder all work. But every site needs a free fallback, and **Google Ads Keyword Planner** is the canonical one — Google's own data, free, requires no paid SEO tool. It's also the only tool that gives **12 months of historical monthly volume per keyword**, which is what powers Section 2.5 seasonality.

**One-time setup (free; never required to spend on ads):**

1. Go to `https://business.google.com/google-ads/`. If you have no prior campaign, click **"Get started" / "Empezar"**.
2. Choose **"Create a new Google Ads account"** → **"Create your first campaign"**.
3. Fill the company fields with placeholder info if you don't intend to run ads — these are not used for keyword research.
4. On every subsequent setup screen, click **"Skip"** wherever possible. On the final screen, when prompted, click **"Exit campaign creation"**.
5. Confirm timezone, country, and currency.
6. Google Ads will ask for a payment method. **Provide it.** Google Ads only verifies the card exists; it does not charge unless you activate a campaign.
7. **CRITICAL: do not activate any campaign.** Keyword research is free; activating a campaign starts billing.

Once the account exists, Keyword Planner is reusable indefinitely.

**Running the research:**

1. **Tools → Keyword Planner.**
2. Choose the entry point:
   - **"Discover new keywords" → start from a keyword** when seeding from the brainstorm list (Section 2.0).
   - **"Discover new keywords" → start from a website** for competitor-gap research — paste a competitor's URL.
3. **Set the country / countries** to match the site's target market (`site-info.md` → Geography). Multi-country sites need one research pass per country.
4. **Type the seed keyword(s)** (e.g., `fruit wholesaler`). Planner returns the average monthly searches plus a long suggestion list.
5. **Apply filter "Exclude keywords already in plan"** so terms you've already added stop reappearing.
6. **Add relevant terms to the plan** — left checkbox → **"Add keyword to create plan"**. Add aggressively here; pruning happens later.
7. **Apply filter "Keyword"** to exclude branded competitor terms or irrelevant matches. Comma-separated list of stop-words.
8. **Download the plan.** Click **Download → CSV** (or **Google Sheets**) **under "Plan historical metrics"** (NOT "Plan forecasts" — that's a different table). The historical-metrics export gives the **last 12 months** per keyword, which is what enables Section 2.5 seasonality analysis.

**Normalizing the export to the toolkit schema (Section 2.3):**

The Keyword Planner CSV has more columns than the toolkit needs. Map / drop:

| Keyword Planner column | Toolkit column | Action |
|------------------------|----------------|--------|
| Keyword | `keyword` | Keep |
| Avg. monthly searches | `volume` | Keep, rename |
| Competition | `kd` (estimate) | Keep — Planner uses Low / Medium / High; treat as KD ≤ 30 / 30–60 / > 60 |
| Top of page bid (low / high range) | `cpc` | Keep as range, e.g. `$2.32-7.94` |
| Jan 2025 – Dec 2025 (12 monthly columns) | (used to derive `peak_months` + `seasonality`) | Don't include in CSV; instead inspect, then summarize |
| Search intent (if Planner provides it) | `intent` | Keep, normalize to `info` / `comm` / `trans` / `nav` |
| In-account fields (Impression Share, Organic Impressions, Organic Avg Position, Account Status, Suggested) | (drop) | Not relevant to research |

**Deriving `peak_months` + `seasonality` from the 12 monthly columns:**

For each row, look at the 12 monthly volume cells:

- Variance < 30% across months → `seasonality: stable`, `peak_months: year-round`.
- Clear repeating peak (e.g., one or two months ≥ 2× the median) → `seasonality: seasonal`, `peak_months: <comma-separated peak months>`.
- One month massively dominates annual volume (≥ 50% of total) → `seasonality: holiday-spike`, `peak_months: <that month>`.
- Volumes trending downward across the 12 months (latest 3 months ≤ 70% of earliest 3) → `seasonality: declining`.

This step is manual today (eyeballing the sparkline). A future toolkit script could automate it from the raw Planner export.

**Why not include the 12 monthly columns in `keywords.csv`?** Two reasons. (1) Most sites don't refresh keyword research every month, so monthly volumes go stale fast. (2) The summarized `peak_months` / `seasonality` is the actionable signal — the raw columns are just the source data. Keep them in the original Planner export file, archived in `sites/[site-name]/_research/` (gitignored).

---

## 3. Creating Blog Posts

### 3.1 Image Sourcing

Image source is set **per-site** (default) and **per-run** (override). The `/blog` and `/service` skills read the default from `site-info.md`, but ask at the start of each run if you want to use a different source this time.

**Available sources:**

| Source | When to use |
|--------|-------------|
| **Pexels** | Default for most posts — free, large library, commercial-use-friendly |
| **Unsplash** | When Pexels lacks the right shot |
| **Site's own image library** | Brand-critical posts, existing product/team/location photos |
| **AI-generated** (Midjourney, DALL·E, Nano Banana, Sora, etc.) | Highly specific concepts not on stock sites |
| **Client-supplied** | Real photos of work, team, locations — highest E-E-A-T value |
| **None / placeholder** | Drafting only; images added later |

**Per-run override:** at the start of every `/blog` or `/service` invocation, the skill asks:
> *"Image source for this post — use the default ([X] from site-info.md) or override?"*

If client-supplied or AI-generated is chosen, the skill pauses to wait for the images and resumes once they're dropped into `sites/[site-name]/_drafts/[slug]/images/`.

**Setup (once, only if using Pexels or Unsplash):**
1. Create a free account on the chosen platform → request an API key.
2. In your toolkit root, add to `.env`:
   ```
   PEXELS_API_KEY=your_key_here
   UNSPLASH_API_KEY=your_key_here
   ```
3. The toolkit's `scripts/fetch-images.mjs` handles both sources, routes by source flag, and downloads to `sites/[site-name]/_drafts/[slug]/images/`.

**Image requirements (every source):**
- **Format:** WebP, compressed under 200 KB.
- **Filename:** descriptive, hyphenated: `emergency-plumber-toronto-burst-pipe.webp`.
- **HTML:** width/height attributes specified (prevents CLS).
- **Alt text:** describes image + keyword where natural.
- **Hero image:** 1200×630 for OG/Twitter card.

### 3.3 Use Keyword Clusters

Every blog post targets **one primary keyword** + a cluster of **4–8 supporting keywords** semantically related to it. One post, multiple ranking opportunities.

**Why clusters matter:**
- Google's algorithm understands topics, not just keywords. A post that covers a topic comprehensively ranks for hundreds of related variations.
- A single post optimized for one keyword leaves traffic on the table.
- Clusters also prevent **keyword cannibalization**.

**Cluster structure:**

| Tier | Count | Role | Example (primary: "emergency plumber Toronto") |
|------|-------|------|-----------------------------------------------|
| **Primary** | 1 | The H1, title tag, first 100 words, URL slug | emergency plumber Toronto |
| **Secondary** | 2–3 | H2 headings, repeated naturally in body | 24/7 plumber Toronto, after-hours plumber |
| **Tertiary** | 3–5 | H3 headings, FAQ questions, body copy | weekend plumber Toronto, plumber near me Toronto, same-day plumbing repair |

**How to build a cluster (any keyword tool):**
1. Start with the primary keyword (from `keywords.csv`).
2. Pull all variants/synonyms the tool surfaces (matching terms, related, questions).
3. Filter to terms with overlapping search intent (don't mix informational and commercial).
4. Pick 4–8 that read naturally together in one article.
5. Verify in Google: search the primary keyword and check if the top 3 results also rank for your candidate cluster terms — if yes, the cluster is valid.

**Record the cluster in `used-keywords.md` when the post ships** so future posts don't accidentally compete for the same terms.

### 3.4 Inject Personality (Avoid AI Slop)

The single biggest difference between content that ranks and content that gets ignored is **voice**. Google's algorithm rewards content that humans actually read and link to. AI slop reads as AI slop. Real personality is the moat.

**Every site has its own voice. Reference files live in two places — both required:**

```
seo-toolkit/
  references/                       ← UNIVERSAL procedural rules (no persona)
    voice.md                        ← banned words, anti-AI checklist, structural rules
    humour.md                       ← universal humor hard bans, zero-humor contexts
    stats.md                        ← never-round / never-invent rules + required structure
    stories.md                      ← one-per-post rule, anonymization defaults
    opinions.md                     ← must-back-with-stat rule, frequency caps
  sites/
    [site-name]/
      references/                   ← REQUIRED per-site persona (the actual content)
        voice.md                    ← the actual persona, sentence rhythm, sample writing
        humour.md                   ← (optional) the actual humor style or "none"
        stats.md                    ← (required) real numbers from this business
        stories.md                  ← (optional) 5–10 real anecdotes
        opinions.md                 ← (optional) hot takes backed by stats
```

**Resolution rule:** the `/blog` and `/service` skills load BOTH files. The per-site file can ADD restrictions but cannot RELAX universal rules.
1. `seo-toolkit/references/[file].md` — universal rules always apply.
2. `seo-toolkit/sites/[site-name]/references/[file].md` — site persona/numbers/stories/opinions.

**Required vs. optional per-site:**
- **`voice.md` and `stats.md` are REQUIRED.** Skills refuse to run on a site missing these.
- **`stories.md`, `opinions.md`, `humour.md` are optional** but recommended. Without them, content goes more generic (no anecdotes, no hot takes, no humor).

**The five reference files:**

| File | Root has | Per-site has |
|------|---------|-------------|
| `voice.md` | Universal banned words, anti-AI checklist, structural rules | The persona, sentence rhythm, sample writing, brand-specific bans |
| `humour.md` | Universal hard bans (puns, sarcasm at reader, etc.), zero-humor contexts | The site's actual humor style or "none" |
| `stats.md` | Procedural rules (never round, never invent), required structure | Real numbers — pricing, response times, customer counts |
| `stories.md` | Procedural rules (one per post max, anonymize unless consented) | 5–10 real anecdotes from this business |
| `opinions.md` | Procedural rules (one per post max, must be backed by stat) | The site's actual hot takes |

**Per-post rules baked into the skills:**
- **One story per post max** — pulled from the site's `stories.md`, not invented.
- **One strong opinion per post max** — pulled from the site's `opinions.md`, backed by a stat.
- **Real numbers only** — from the site's `stats.md`, never rounded ("23 minutes" not "around 20 minutes").
- **Tell people when NOT to hire / use the product** — biggest single voice tell that you're not AI.
- **Anti-pattern checklist** — before shipping, the skill re-reads root `voice.md` → "Universal anti-AI checklist" and deletes anything matching.

**Universal banned words/phrases** (root `voice.md`, every site, no override possible):
"unlock", "leverage", "seamless", "world-class", "cutting-edge", "revolutionary", "in today's fast-paced world", "delve", "navigate the complexities of", exclamation marks, emojis. Per-site can ADD bans, never remove.

### 3.5 Steal the Winning Format from Top-Ranking Pages

Google has already told you what wins for any keyword — it's whatever's ranking. Don't reinvent. Match the format, then beat it on quality.

**Workflow (the skill runs this automatically):**

1. **Search Google** for the primary keyword (incognito, target region).
2. **Identify top 3 organic results** to analyze. **Skip:**
   - Reddit, Quora, forums, YouTube
   - Wikipedia (rarely beatable)
   - Paywalled sites
   - Brand homepages (e.g., the official Salesforce site for "what is CRM")
   - Your own site (no point copying yourself)
   - If the top 3 are all skipped, go down to ranks 4–8 until you have 3 valid analogs.
3. **Extract from each:**
   - Word count
   - H2/H3 heading structure (the exact outline)
   - Image count and types (screenshots, photos, diagrams, illustrations)
   - Topics covered (one-line summary per H2)
   - FAQ questions (if present)
   - Internal/external link patterns
4. **Calculate the median** for word count and image count. **Match within ±20%.**
5. **Identify the novel angle** — 1–2 sections the top 3 missed but the searcher would value. This is what beats them.
6. **Check AI search citations** — search the same keyword on Perplexity (or check Google's AI Overview if it appears). Note which sites get cited and what content patterns they use (lists, tables, direct answers, citations). AI search rewards specific structures — match them when relevant.

**Why this works:**
- Google ranks high-quality content because they want users to return — that's how they sell more ads.
- The top 3 already proved what Google considers "high quality" for that keyword.
- Matching format ensures you meet the bar; the novel section pushes you past them.

### 3.6 Google vs LLMs — what overlaps, what doesn't

Most of the SEO work that ranks a page on Google ALSO surfaces it in AI search engines (ChatGPT with browsing, Perplexity, Claude with web search, Google AI Overview). The same craft applied to two channels.

**Empirical anchor:** the correlation between a page being in Google's TOP 10 organic results and being cited in AI search engines is **above 75%** for non-niche queries. Practical implication: **rank top 10 on Google → expect to also surface in AI search.** Conversely, fixing a structural Google SEO problem usually fixes the AI search problem at the same time.

**Factor-by-factor matrix:**

| SEO factor | Helps Google | Helps LLMs |
|---|:---:|:---:|
| Title tag | ✅ | ✅ |
| Meta description | ✅ | ✅ (some LLMs use it as snippet) |
| URL slug | ✅ | ✅ |
| H1 / H2 / H3 hierarchy | ✅ | ✅ |
| Body copy quality (real expertise, not slop) | ✅ | ✅ |
| Internal linking | ✅ | ✅ (helps LLM understand topic graph) |
| External authority links | ✅ | ✅ |
| Blog (informational content depth) | ✅ | ✅ (most-cited surface in AI search) |
| Comparison tables in content | ✅ | ✅✅ (LLMs extract tables disproportionately) |
| FAQ sections | ✅ | ✅✅ (LLMs cite Q+A pairs directly) |
| **Schema (JSON-LD)** | ✅ | ❌ Most LLM crawlers don't extract it |
| **Page experience (Core Web Vitals, intrusive interstitials)** | ✅ | ❌ Not visible signal |
| **Rendering (CSR vs SSG/SSR)** | ✅ Googlebot executes JS, but with delay | ❌❌ AI search bots don't execute JS — CSR pages are invisible |

**Process difference:**
- **Google** finds the page → renders → indexes → ranks against query → returns blue link.
- **LLMs** combine content from many crawled sources → rank by relevance + authority (using Google's ranking as a strong RAG signal) → synthesize an answer with citations.

**Practical takeaway:** if a site is invisible to AI search but ranks fine in Google, the binding constraint is usually one of the three rows marked ❌ above. Most often: **rendering** — the bot fetched the page but couldn't read the body because the React tree never hydrated. Fix is server-side rendering, prerendering, or HTML body injection per Section 1.3.

The toolkit's `/blog`, `/service`, and `/audit` skills all assume both channels matter. None of them treat Google and AI search as separate problems.

---

## 4. Creating Service Pages

> **Conditional section.** Only applies to sites flagged in `site-info.md` as `service-business: true`. SaaS / content / ecomm sites skip this section.

### 4.1 Service Page Strategy by Footprint

The page-generation strategy depends on the site's `geographic footprint` (set in `site-info.md`).

#### Single-location (one office, one service area)
- **One page per service.** No city variants, no zipper.
- Page format: `/services/[service]` — e.g., `/services/emergency-plumber`.
- The page mentions the city/region naturally in body copy, schema, and NAP — but the URL doesn't need a city.
- **Why:** the business only ranks for local results in its actual area; multiple city pages would be doorway pages.

#### Multi-location (multiple physical branches)
- **One page per service × per location**, where each location is a real branch with its own NAP.
- Page format: `/locations/[city]/[service]` or `/services/[service]/[city]`.
- Each page links to the location's main page (with embedded map, hours, team, branch-specific photos).
- **Why:** Google rewards pages with verifiable local presence. Real NAP + branch-specific content = legitimate local pages.

#### Service-area (mobile, no fixed office, serves multiple cities)
- **The zipper strategy applies**, but with strict anti-doorway-page rules.
- Page format: `/services/[service]-[city]` — e.g., `/services/emergency-plumber-toronto`.
- **Combination matrix:** services × cities the business actually serves.

#### National-online (no geo targeting)
- **One page per service**, no city variants.
- Page format: `/services/[service]` or `/[service]`.
- Pages target the service nationally; city signals (NAP, schema) are absent or generalized.

#### Catalog (e-commerce, multi-axis product/service catalog)
- **Hierarchical URLs** mirroring the architecture from Section 2.6.
- Page format: `/[category]/[subcategory]/[product-or-page]/`.
- Examples: `/dog-houses/`, `/dog-houses/large/`, `/dog-houses/large/insulated/`, `/dog-houses/cheap/` (business-opportunity branch from Section 2.6.2).
- **Use a distribution page when an axis has its own search demand** (Section 2.6.4). Otherwise, keep URLs flat per axis.
- **One page per leaf intent.** A leaf is a row in the architecture's deepest level that has a unique SERP per Section 2.4.

#### Choosing the right footprint for a managed site

Set in `site-info.md` → Geography section. Pick the single footprint that best describes the business — don't mix footprints for one site:

| Site type | Footprint |
|---|---|
| One physical office serving one city | `single-location` |
| Multiple branches, each with its own NAP | `multi-location` |
| Mobile / on-site team serving many cities, no fixed office | `service-area` |
| Service offered nationally with no geo signals | `national-online` |
| Product or service catalog with categories/subcategories (e-commerce, marketplace, large directory) | `catalog` |

A site can be both `national-online` AND `catalog` (e.g., a national e-commerce store) — declare both in `site-info.md`. Skills resolve the URL pattern based on the more specific one (`catalog` overrides `national-online` for URL structure).

### 4.1.1 Hierarchical URL strategy for catalog sites

Catalog sites need URLs that reflect the architecture's hierarchy. This is a strong navigation + ranking signal — Google uses URL structure to understand topic relationships.

**The pattern:**

```
/                                       — home (broadest commercial intent)
/[category]/                            — Level 1 category
/[category]/[subcategory]/              — Level 2 (no distribution page)
/[category]/[axis]/[value]/             — Level 2 (with distribution page on the axis)
/[category]/[subcategory]/[product]/    — Level 3 leaf (product or specific service)
```

**Slug rules at every level:**
- Lowercase, hyphenated, no underscores, no query strings
- Plural for category nouns when natural (`/dog-houses/` not `/dog-house/`); follow the dominant SERP convention
- Slug should contain the primary keyword for that node
- Trailing slash convention is consistent across the site (either all routes have it, or none do — don't mix)

**Worked example (the fruit-distribution site from Section 2.6):**

```
/                                                       (homepage)
/wholesale-citrus/                                      (Level 1)
/wholesale-citrus/oranges/                              (Level 2)
/wholesale-citrus/lemons/                               (Level 2)
/wholesale-berries/                                     (Level 1)
/wholesale-berries/strawberries/                        (Level 2)
/wholesale-tropical/                                    (Level 1)
/by-region/                                             (Level 1, business-opportunity branch)
/by-region/southwest/                                   (Level 2)
```

**Maintenance.** Renaming a slug requires a 301 redirect from the old URL. Architecture is meant to freeze URLs — only rename when the slug is genuinely wrong (typo, mistranslation), not for cosmetic reasons.

### Anti-doorway-page rules (mandatory for service-area zipper)

Google penalizes "doorway pages" — near-duplicate pages varying only by city name. To avoid this on every service-area page:

1. **Unique opening (200+ words)** specific to that city — case study, neighborhood references, real customer quote, local stat.
2. **Local landmarks/neighborhoods** mentioned naturally — gives the page genuine local relevance.
3. **City-specific FAQs** — at least 1–2 questions that only make sense for that city.
4. **Real local NAP** — phone number with the city's area code if possible, real service address.
5. **Real testimonials from customers in that city** — names + neighborhoods if possible.
6. **Different hero image** — not the same stock photo across all 50 city pages.

If a city page can't pass all six rules, **don't publish it**. A weak page hurts the strong ones.

### 4.2 Volume Caution & Publishing Cadence

Service pages are higher-risk than blog posts. A flood of thin city pages is the #1 way to trigger a manual action or algorithmic suppression.

**Hard rules:**

| Footprint | Max total service pages | Pacing |
|-----------|-------------------------|--------|
| Single-location | 5–15 (one per service) | All at once is fine — they're distinct services |
| Multi-location | services × locations, capped at ~50 | Roll out 2–5 per week |
| Service-area | services × cities, capped at ~30 initially | 1–2 per week, max 5/week |
| National-online | 5–15 (one per service) | All at once is fine |

**Soft rules:**
- **Never publish a city page you can't fill with the six anti-doorway requirements** from 4.1. Skip the city.
- **Don't 10× your service-page count overnight.** Ramp gradually.
- **Audit at 90 days.** Pull GSC data. Pages with zero impressions after 90 days are either thin, mistargeted, or de-indexed. Improve them or remove them.
- **Consolidate when in doubt.** Two mediocre city pages = one strong page.

**Quality bar (every page, every time):**
- Passes all six anti-doorway rules from 4.1.
- 800+ words minimum (city pages); 1500+ for primary service pages.
- Real conversion elements (CTA, phone, form, trust signals).
- Indexed in GSC within 14 days of publish.
- Earns at least 1 impression in GSC within 30 days.

### 4.3 Local NAP — Rules by Footprint

**NAP = Name, Address, Phone.** Critical for local rankings.

**Universal rules (every footprint):**
- **Consistency is non-negotiable.** The exact NAP on the site must match Google Business Profile, Apple Maps, Bing Places, and major directories (Yelp, BBB, industry-specific). Even formatting differences ("Suite 200" vs "Ste. 200") can hurt.
- **Use real schema.** `LocalBusiness` JSON-LD on every relevant page.
- **Click-to-call** on phone numbers (`tel:` links).
- **Embedded map** of the actual address (Google Maps iframe).

**By footprint:**

| Footprint | NAP rule |
|-----------|----------|
| **Single-location** | One real NAP. Use it on every page. Schema: `LocalBusiness` with one `address`. |
| **Multi-location** | One real NAP **per branch**. Each location's service pages use that branch's NAP. Schema: `LocalBusiness` per location, plus `Organization` site-wide. Don't share HQ NAP across branch pages. |
| **Service-area** (mobile, no public storefront) | One real `address` (can be home/HQ even if not customer-facing) + `areaServed` schema listing every city. Use Google Business Profile's **service-area business** setting. **Don't fake addresses per city** — Google detects this and penalizes. |
| **National-online** | NAP may be minimal — `Organization` schema only, with `contactPoint`. No `LocalBusiness` schema. |

**Service-area honesty rule:** Don't put fake addresses per city to "look local." Google's spam team specifically targets fake addresses. Use `areaServed` schema honestly.

### 4.4 Conversion Optimization

A service page that ranks but doesn't convert is wasted traffic.

**Realistic conversion benchmarks by business type:**

| Business type | What counts as a conversion | Realistic CR |
|---------------|----------------------------|--------------|
| Emergency local service (plumber, locksmith, towing) | Phone call | 10–25% |
| Booked service (dentist, salon, lawyer) | Contact form / booking | 3–8% |
| B2B SaaS / agency | Demo request / contact | 1–4% |
| E-commerce | Purchase | 1–3% |
| Lead-gen / quote business | Quote request | 2–6% |
| National online services | Sign-up / trial | 1–5% |

**Conversion elements every service page must include:**

| Element | Purpose | Notes |
|---------|---------|-------|
| **Above-fold CTA** | First impression action | Phone for emergency services, form for considered purchases |
| **Sticky mobile CTA** | Always-visible call/text/quote button | Most local searches happen on mobile |
| **Phone with `tel:` link** | One-tap calling | The single highest-converting element for service businesses |
| **Trust signals (above the fold)** | Reduce hesitation | Star rating, review count, license #, years in business |
| **Specific testimonials** | Social proof | Names, photos, neighborhoods (for service-area), specific outcomes |
| **Pricing transparency** | Reduce drop-off | "Starting at $X" or "Free quote in under 24h" |
| **Service area or hours** | Qualify the visitor | Don't waste their time if you can't serve them |
| **FAQ section** | Pre-empt objections | 4–8 questions targeting actual hesitation points |
| **Multiple CTA placements** | Capture intent at any scroll depth | Above fold, after benefits, after trust signals, in FAQ, footer |

**A/B testing approach (without expensive tools):**

| Site type | Recommended approach |
|-----------|----------------------|
| Repo-controlled (Next.js, Astro, etc.) | A/B via Vercel/Netlify split testing or feature flags |
| WordPress | Plugins: Nelio A/B Testing, Thrive Optimize. ~$15–50/mo |
| Lovable / Webflow / Shopify | Third-party tools: VWO, Optimizely, Convert. $50–200/mo |
| Low-traffic sites (<500/mo conversions) | **Don't A/B test.** Use Microsoft Clarity (free heatmaps) + best practices instead |

**What to test (priority order):**
1. Hero CTA copy (`Get a Free Quote` vs `Call Now (24/7)` vs `Book in 60 Seconds`)
2. Hero image (stock photo vs real team photo vs results photo)
3. Pricing visibility (hidden vs "starting at" vs full pricing)
4. Form length (3 fields vs 5 fields vs single-step vs multi-step)
5. Phone vs form as primary CTA

**Output of CRO work:** when a winner emerges, codify it as the service-page template for that site. Document in `sites/[site-name]/notes.md`:

```markdown
## Conversion winners (last updated: YYYY-MM-DD)
- Hero CTA: "Call Now (24/7)" beat "Get a Free Quote" by 34% (n=2,400)
- Hero image: real team photo beat stock by 18% (n=1,800)
- Form: 3-field beat 5-field by 22% (n=900)
```

---

### 4.5 Multilingual Sites — hreflang strategy and per-language production

**Conditional section.** Only applies to sites flagged in `site-info.md` as `Multilingual: true`. Monolingual sites skip this section.

The full multilingual rules are in `CLAUDE.md` → "Multilingual sites." This section covers the strategy choices and per-platform implementation that the skills enforce.

#### Hreflang strategy by URL convention

A multilingual site picks ONE strategy and uses it consistently. The strategy is recorded in `site-info.md`.

| Strategy | URL example | Pros | Cons |
|----------|------------|------|------|
| **Path prefix** (`/es/...`) | `site-a.ai/es/services/ai-automation-agency` | Simplest to deploy. Single domain, single hosting, single SSL cert. Edge middleware can route per-prefix. | Shares domain authority across languages (good in practice). Slightly less obvious to non-technical users. |
| **Subdomain** (`es.example.com/...`) | `es.site-a.ai/services/ai-automation-agency` | Visually clear separation. Lets you use a different stack per language if needed. | Each subdomain accrues authority separately. Extra DNS / hosting / cert config. More likely to rot when one team owns one language. |
| **Country TLD** (`example.es/...`) | `site-a.es/services/ai-automation-agency` | Strong local-market signal in Google. Maximum brand presence per country. | Most expensive (one domain per locale). Authority fully separate. Usually overkill unless geo-targeting specific countries. |

**Default for SMBs:** path prefix. It's the lowest-risk and the highest-leverage. Only choose subdomain or country TLD if there's a specific geo-targeting reason.

#### Per-language URL pattern (recorded in `site-info.md`)

The site declares each language's URL pattern. The skills format URLs by substituting `[slug]`:

```markdown
| Code | URL pattern    | Sample resolved URL                          |
|------|---------------|----------------------------------------------|
| en   | `/[slug]`     | site-a.ai/services/ai-automation-agency    |
| es   | `/es/[slug]`  | site-a.ai/es/services/ai-automation-agency |
```

For service pages, blog posts, and refreshed pages, the skill uses the same `[slug]` across all languages. URL slugs do not get translated — the slug stays in the primary language. This is a deliberate choice: it makes hreflang reciprocity trivial to verify, and it keeps the URL map consistent across the team.

(If a user wants per-language slugs, they override per-page in the `_drafts/[slug]/[lang]/` frontmatter. Default is shared slug.)

#### Reciprocal hreflang — the 80% failure mode

The single most common multilingual SEO bug: an EN page links to its ES counterpart, but the ES counterpart doesn't link back. Google ignores asymmetric hreflang entirely — both pages must reference each other.

The toolkit enforces this in two places:
- **At generation time:** every draft includes the full hreflang cluster pointing to all sibling languages + x-default + self-reference.
- **At audit time:** `scripts/validate-hreflang.mjs` walks the sitemap and verifies reciprocity. Asymmetric links are a blocker.

#### Per-platform implementation (where the hreflang tags actually live)

| Platform | Where to put hreflang |
|----------|----------------------|
| Lovable + Vercel Edge Middleware | Inject in `middleware.ts` per-route, alongside title/canonical/OG. The hreflang cluster is part of `lib/route-meta.ts` for each route. |
| Next.js (App Router) | `metadata.alternates.languages` in the route's `metadata` export. |
| WordPress | Polylang or WPML plugin handles hreflang automatically once the language pair is set up. Verify output. |
| Webflow | Manual `<link>` injection in the page's custom code. Order matters across locale variants. |
| Shopify | Use `shopify_translation` Liquid + the Markets feature. Verify hreflang renders in source. |
| Static sites (Astro, Hugo, etc.) | Build-time generation of the cluster from a translations YAML/JSON. |

#### Sitemap with hreflang alternates (recommended)

Per Google's spec, sitemaps should declare alternates explicitly:

```xml
<url>
  <loc>https://site-a.ai/services/ai-automation-agency</loc>
  <xhtml:link rel="alternate" hreflang="en" href="https://site-a.ai/services/ai-automation-agency"/>
  <xhtml:link rel="alternate" hreflang="es" href="https://site-a.ai/es/services/ai-automation-agency"/>
  <xhtml:link rel="alternate" hreflang="x-default" href="https://site-a.ai/services/ai-automation-agency"/>
</url>
```

Optional but valuable. The `<link>` tags in `<head>` are the primary signal; sitemap alternates are a secondary reinforcement that helps with discovery.

#### Voice / cultural localization

The skills produce native rewrites per language, not translations. Each language has its own `voice.[lang].md` with:
- Sample paragraphs in that language.
- Banned words specific to that language (e.g., "no anglicismos" rules in Spanish).
- Sentence rhythm appropriate to the language.

A Spanish-language post is not "translated English" — it's written in Spanish with the same brand persona but the voice file's Spanish-specific rules.

#### When NOT to add a language

Adding a language to a managed site is a real commitment:
- Every existing page needs a counterpart (or the site has gaps).
- Every new page must be produced in the new language too.
- Translation drift is real if one language gets refreshed and the other doesn't.

Don't declare multilingual support unless the site genuinely will publish content in every declared language going forward. A half-supported language is worse than a single-language site with an "we'll be in Spanish soon" note.

---

## 5. On-Page SEO

The full 80+ signal checklist lives in **Appendix A** (`on-page-seo.md` in your toolkit root). Every page-generation skill (`/blog`, `/service`, `/refresh`) reads it before generating any page.

This section pulls out the **Tier 1 essentials** — the items that, if missing, single-handedly tank a page's ranking ability.

### Tier 1 — Must-have on every page

| # | Item | Rule |
|---|------|------|
| 1 | **Title tag** | 50–60 chars, primary keyword near the start, unique per page |
| 2 | **Meta description** | 150–160 chars, primary keyword + benefit + soft CTA |
| 3 | **One H1** | Exactly one per page, contains primary keyword |
| 4 | **Primary keyword in first 100 words** | Above the fold, reads naturally |
| 5 | **URL slug** | Short, lowercase, hyphenated, contains primary keyword |
| 6 | **Canonical URL** | Self-referencing canonical on every page |
| 7 | **Open Graph + Twitter Card** | `og:title`, `og:description`, `og:image` (1200×630), `twitter:card="summary_large_image"` |
| 8 | **Image alt text + filenames** | Descriptive alt text on every image; filenames hyphenated and keyword-aware |
| 9 | **3–5 internal links** | Descriptive anchor text, contextually placed |
| 10 | **2–3 external links** | To authoritative sources (.gov, .edu, major industry); `rel="noopener"` on new-tab links |
| 11 | **Schema (JSON-LD)** | Per page type: `Article`/`BlogPosting`, `Service` + `LocalBusiness`, `FAQPage`, `BreadcrumbList`, `Organization`, `Person` |
| 12 | **FAQ section** | 4–8 questions on every blog post + service page, with `FAQPage` schema |
| 13 | **Author byline + bio** (blog posts) | Real name, credentials, link to author page, `Person` schema |
| 14 | **Mobile-friendly** | Responsive layout, 16px+ body font, 48×48px touch targets, no horizontal scroll |
| 15 | **Loads fast** | Lighthouse mobile score ≥ 90, LCP < 2.5s, CLS < 0.1, INP < 200ms |
| 16 | **Semantic HTML5** | `<header>`, `<nav>`, `<main>`, `<article>`, `<footer>` |

### Tier 1 enforcement workflow

Before any page goes live:

1. **Skill self-check** — `/blog` and `/service` validate Tier 1 before output. The skill refuses to ship a draft missing any of the 16.
2. **Lighthouse spot-check** — open the staged URL in Chrome DevTools → Lighthouse → mobile → Analyze. Performance ≥ 90, SEO ≥ 95, Accessibility ≥ 90, Best Practices ≥ 95.
3. **Rich Results Test** — paste the URL into [search.google.com/test/rich-results](https://search.google.com/test/rich-results). All schema must validate without errors.
4. **GSC URL Inspection** — within 7 days of publish, run URL Inspection to confirm Google can crawl + render the page. Submit for indexing.

### Beyond Tier 1: Appendix A

Tier 1 is the floor. Appendix A's full checklist (15 categories, 80+ items) is the ceiling. The skills satisfy as much of Appendix A as the page type warrants — but Tier 1 is non-negotiable.

### 5.1 Internal linking — the seven patterns

Internal links carry authority across the site, build the topic graph Google uses to understand context, and let bots crawl the architecture from any landing page. Tier 1 #9 ("3–5 internal links") is the floor. The seven patterns below are the catalog — each managed site should hit most of them, and `/audit` checks for them.

| # | Pattern | Where it lives | Anchor strategy | Why |
|---|---|---|---|---|
| 1 | **Header dropdown / category menu** | Visible nav on every page | Category names from the architecture's Level 1 | Architecture exposed to bots from every entry point |
| 2 | **"Featured" / "Destacados" section** on home | Above-fold or mid-page on `/` | Editorial — pick the highest-priority categories or hot products | Gives the home a strong outbound signal to commercial pages |
| 3 | **Footer link block** | Footer on every page | Mix of overflow categories + low-volume but legally required links | Carries link equity to deep pages bots might miss; satisfies legal reqs |
| 4 | **Breadcrumbs** | Top of every non-home page | Hierarchical (Home > Category > Subcategory > Page) | Reinforces URL hierarchy + improves UX. Also `BreadcrumbList` schema |
| 5 | **Category → subcategory / product links** | Inside category pages, in body | Subcategory or product names | Lets bots crawl down the tree from the category landing |
| 6 | **Related-products / related-services links** | Bottom of product/service pages | Sibling product names | Distributes authority across the leaf level + UX |
| 7 | **Blog → transactional bridge** | Within blog post body, contextually placed | Service or product names that solve the post's stated problem | Routes informational-intent traffic toward conversion pages — the customer journey link |

**Universal rules across all 7 patterns:**

- **Descriptive anchors only.** "Click here" / "read more" / "learn more" carry no topic signal. Use the destination page's primary keyword (or a natural variant) as the anchor.
- **No link-stuffing.** Two natural links beat ten forced ones. Only link when the link genuinely helps the reader.
- **Don't link the same anchor to two different URLs** in the same site — confuses Google about which page the anchor points to.
- **Internal links are nofollow-FREE.** Reserve `rel="nofollow"` for genuinely external untrusted links. Internal links should always pass equity.
- **Audit competitor patterns** as part of the architecture phase. Note which patterns competitors use heavily — those are the ones the SERP rewards in your niche.

**`/audit` substep:** for any managed site, sample 5 routes across the architecture and verify each carries the patterns relevant to its page type:

| Page type | Patterns expected |
|---|---|
| Home | 1, 2, 3 |
| Category landing | 1, 3, 4, 5 |
| Subcategory | 1, 3, 4, 5, 6 |
| Product / service leaf | 1, 3, 4, 6 |
| Blog post | 1, 3, 4, 7 |

If a pattern is missing where expected, flag in the audit. Most patterns are template-level (header / footer / breadcrumb) so a single fix propagates site-wide.

---

## 6. Technical SEO

### 6.1 Required Technical SEO Elements (Every Site, Every Platform)

These eight elements must exist on every site you manage. The **what** is universal; the **how** depends on the platform.

#### The eight non-negotiables

| # | Element | What it does | How to verify |
|---|---------|-------------|---------------|
| 1 | **Sitemap** at `/sitemap.xml` | Tells search engines every URL on the site | Visit `https://[site]/sitemap.xml` |
| 2 | **robots.txt** at `/robots.txt` | Allows crawlers, points to sitemap | Visit `https://[site]/robots.txt` |
| 3 | **Canonical URL** on every page | Prevents duplicate-content penalties | View source → `<link rel="canonical">` |
| 4 | **Open Graph images** (1200×630) | Drives social-share CTR | View source → `<meta property="og:image">` |
| 5 | **Image width/height attributes** | Prevents CLS | View source — every `<img>` has `width` + `height` |
| 6 | **Semantic HTML5** | `<header>`, `<nav>`, `<main>`, `<article>`, `<footer>` | View source |
| 7 | **Mobile viewport meta** | Required for mobile-first indexing | View source → `<meta name="viewport">` |
| 8 | **HTTPS everywhere** | Mandatory ranking signal | Browser address bar shows lock icon |

#### Implementation cheat sheet by platform

| Platform | Sitemap | robots.txt | Canonicals | Other notes |
|----------|---------|-----------|-----------|-------------|
| **Next.js** (App Router) | `app/sitemap.ts` (auto) | `app/robots.ts` | `metadata.alternates.canonical` per page | Use `output: 'export'` for SSG; OG images in `app/[route]/opengraph-image.tsx` |
| **WordPress** | Yoast / RankMath / All in One SEO plugins | Same plugins manage robots.txt | Plugins auto-set self-referencing canonicals | Plugins also handle OG/Twitter meta and schema |
| **Webflow** | Auto (Project Settings → SEO → Sitemap) | Project Settings → SEO → robots.txt | Page Settings → SEO → Canonical Tag | OG images: Page Settings → Open Graph |
| **Shopify** | Auto at `/sitemap.xml` | `/robots.txt` editable via theme code | Auto self-referencing on most pages | Liquid templates handle OG/Twitter meta |
| **Squarespace / Wix** | Auto-generated | Limited control | Auto-set | OG meta: per-page SEO panel |
| **Framer** | Auto-generated | Project settings | Auto self-referencing | Per-page SEO panel |
| **Lovable** ⚠️ | Manual — add via prompt: "add a static `sitemap.xml` to public/" | Manual — add `public/robots.txt` | Manual — add canonical link tags via prompt | OG images: manual upload to public/, reference in head meta |
| **Astro / Nuxt / SvelteKit** | Built-in plugins (`@astrojs/sitemap`, etc.) | Manual or plugin-based | Per-page frontmatter / config | Framework-native SSG defaults are SEO-friendly |

#### Per-site audit (record in `site-info.md`)

For every site you manage, run this audit once and record the results:

```markdown
## Technical SEO baseline (audit date: YYYY-MM-DD)
- [ ] Sitemap exists at /sitemap.xml — submitted to GSC
- [ ] robots.txt exists, allows crawlers, references sitemap
- [ ] Canonical URLs present on all key pages
- [ ] OG images present and resolve (1200×630, < 1MB)
- [ ] Image dimensions specified
- [ ] Semantic HTML5 used
- [ ] Mobile viewport meta present
- [ ] HTTPS everywhere, no mixed content warnings
```

If any item fails, fix it before any keyword/content work — content effort leaks rankings on a broken technical foundation.

### 6.2 Performance & Lighthouse (Mobile-First)

Google ranks based on **mobile** Core Web Vitals, not desktop. Every Lighthouse audit must be run in **mobile** mode.

#### Realistic score targets

| Score | Floor (must-hit) | Stretch (aim for) | Notes |
|-------|------------------|-------------------|-------|
| **Performance** | 70 | 90+ | 100 is rarely realistic on platforms with third-party scripts |
| **Accessibility** | 90 | 100 | Achievable on every platform |
| **Best Practices** | 95 | 100 | Achievable on every platform |
| **SEO** | 95 | 100 | Achievable on every platform; closest to non-negotiable |

If any score falls below the floor, fix it before content work.

#### Core Web Vitals targets (the actual ranking signals)

| Metric | Good | Needs improvement | Poor |
|--------|------|-------------------|------|
| **LCP** (Largest Contentful Paint) | < 2.5s | 2.5–4s | > 4s |
| **INP** (Interaction to Next Paint) | < 200ms | 200–500ms | > 500ms |
| **CLS** (Cumulative Layout Shift) | < 0.1 | 0.1–0.25 | > 0.25 |

Lighthouse Performance score is a proxy — but Google ranks based on **field data** (real users via Chrome User Experience Report). Check field data in:
- **GSC → Core Web Vitals report**
- **PageSpeed Insights** → "Discover what your real users are experiencing"
- **CrUX Dashboard** (data.google.com/looker)

If lab Lighthouse is green but field CrUX is red, the field data wins. Optimize for real users, not the test.

#### Audit workflow

1. **Pick a representative page** — homepage + one service page + one blog post per site.
2. **Run Lighthouse in mobile mode:**
   - Chrome DevTools → Lighthouse → Device: **Mobile** → all four categories → Analyze.
   - Or [pagespeed.web.dev](https://pagespeed.web.dev) → enter URL → mobile tab.
3. **Expand all failing items** — note specific recommendations.
4. **Cross-check field data** in GSC Core Web Vitals report (28-day rolling).
5. **Triage fixes by platform:**

| Platform | Fix workflow |
|----------|-------------|
| **Next.js / Astro / repo-controlled** | Paste Lighthouse report into Claude Code with prompt: *"Optimize for Core Web Vitals (LCP < 2.5s, INP < 200ms, CLS < 0.1). Verify changes don't break the SSG build."* Claude edits the codebase. |
| **WordPress** | WP Rocket / Perfmatters (caching), ShortPixel / Smush (image compression), Asset CleanUp (script removal) |
| **Webflow** | Project Settings → SEO + Performance, optimize image variants, defer third-party scripts via custom code embed |
| **Shopify** | Theme code edits (defer scripts, lazy-load images), remove unused apps, modern image formats via theme settings |
| **Lovable** ⚠️ | Lovable prompts: *"reduce JS bundle size by code-splitting routes," "lazy-load all below-fold images with width/height attributes," "remove unused dependencies."* Some optimizations require migration. |
| **Squarespace / Wix** | Limited control. Image sizes, font choices, removing unused features |

#### Re-audit cadence

- **After every major change** to a site (theme update, new plugin, layout overhaul).
- **Quarterly** on every site, even with no changes.
- **Always after a ranking drop** — Core Web Vitals regression is a common silent cause.

---

## 7. Reusable Claude Code Skills

The toolkit ships **five pre-built skills**:

| Skill | Purpose |
|-------|---------|
| `/blog` | Generate a new long-form, SEO-optimized, voice-matched blog post for a chosen site |
| `/service` | Generate a service page (footprint-aware) for a chosen site |
| `/refresh` | Upgrade an existing blog post — re-do SERP analysis, refresh stats, fix on-page gaps, update internal links |
| `/audit` | Run a technical SEO audit on a chosen site, log results to its `site-info.md` |
| `/triage` | Score all sites in `sites/` by SEO opportunity and recommend the top 3 to focus on |

After setting up the toolkit and refreshing your Claude session, type any of these to invoke. Full SKILL.md specs are in **Appendix C**.

### 7.1 Publishing Cadence

Cadence is recorded **per-site** in `site-info.md` (under "Content"), and the `/blog` and `/service` skills check it before publishing — refusing to ship if you'd exceed the rate.

#### Why cadence matters

Google detects URL inventory spikes. Going from 5 posts to 50 in a week looks like spam regardless of content quality. Sites have been algorithmically suppressed for sudden content floods even with high-quality content.

#### Default cadence by site age & authority

| Site stage | Blog posts/week | Notes |
|-----------|----------------|-------|
| **New site** (< 6 months, < 100 indexed pages) | 1 → 2 → 3 ramp over 4 weeks | Day 1: 1 · Day 7: 1 · Day 14: 2 · Day 21: 3 · Day 28+: 4 |
| **Growing site** (6–18 months, 100–500 pages) | 2–3/week | Steady cadence; spikes flagged |
| **Established site** (18+ months, 500+ pages, > 1k organic visits/mo) | 3–5/week | Site has earned crawl budget |
| **Mature/authority site** (50k+ visits/mo) | 5–10/week | Constrained by editorial quality, not Google |

Service-page cadence is separate — covered in **Section 4.2**.

#### Mixed publishing across the portfolio

When managing 20 sites, the cadence rule is **per-site, not aggregate**. You can publish across multiple sites in parallel — Google evaluates each site's URL inventory independently. So 5 sites × 2 posts/week = 10 posts/week is fine; 1 site × 10 posts/week is suspect.

---

## 8. Off-Page SEO

Off-page SEO = signals from outside your site that Google uses to evaluate trust and authority. Backlinks are the dominant signal, but the landscape has shifted: **AI search citations** are now a parallel signal worth tracking.

> **Reality check:** Off-page SEO is lower-leverage than on-page + content for most small-to-mid sites. Spend 80% of your time on content quality and 20% on link-building until your site has 50+ pages of strong content.

> **Warning — non-negotiable:** Avoid cheap backlink services, **PBNs (Private Blog Networks)**, link farms, and "guaranteed DA50+ links for $50" services. Google's spam algorithm catches these and the penalties can permanently damage a site. Earned > paid > automated. Always.

### 8.1 Methods that work in 2025+

#### 8.1.1 Broken backlink swapping (link reclamation)
1. Pull a competitor's backlinks via Ahrefs / SEMrush / Moz.
2. Filter for **broken outbound links** (Ahrefs: "Broken backlinks" report).
3. Identify ones where you have an equivalent or better page.
4. Email site owner: *"Hi [name], I noticed a broken link on [page] pointing to [dead URL]. I have a related resource at [your URL] that might work as a replacement."*
5. **Conversion:** ~5–15% reply rate; ~2–5% link rate.

#### 8.1.2 Guest posting
1. Search: `[your niche] "write for us"` · `[your niche] "guest post guidelines"` · `[your niche] "contributor"`.
2. Filter sites by **real authority**: DR ≥ 30, real organic traffic, real human readership.
3. Pitch 3–5 specific topic angles tailored to their audience.
4. **Avoid:** any site that takes payment for guest posts (Google penalty pattern).
5. **Conversion:** ~10–25% pitch acceptance on real publications.

#### 8.1.3 Journalist-query platforms (the post-HARO landscape)

HARO shut down in 2024. **Connectively** (HARO's successor) is also being phased out. Current alternatives:

| Platform | Best for | Cost |
|----------|----------|------|
| **Qwoted** | B2B / SaaS / tech experts | Free + paid tiers |
| **Featured.com** | Quick expert quotes, broad topics | Free + paid |
| **Help a B2B Writer** | B2B-specific queries | Free |
| **SourceBottle** | Lifestyle, wellness, consumer | Free + paid |
| **Terkel** | Roundup posts, expert quotes | Free + paid |
| **#journorequest on X / Twitter** | Real-time, named journalists | Free |
| **#prrequest, #journorequest on LinkedIn / Bluesky** | Growing post-Twitter alternatives | Free |
| **Direct journalist outreach** | High-DA placements | Free, slow |

**Workflow:** check 2–3 platforms daily, respond within 1 hour, provide tight quotable answers (2–3 sentences, no fluff), include a credential line.

#### 8.1.4 Digital PR (data-driven content)

The highest-leverage modern method. Publish content other people *cite*:
- **Original research / surveys** — survey 100+ people in your niche, publish findings.
- **Public datasets** — analyze public data, present as charts.
- **Industry reports** — annual benchmarks, salary surveys, pricing studies.
- **Free tools** — calculators, generators, checklists.
- **Data-rich blog posts** — even a single first-or-best statistic earns citations.

**Promotion:** pitch the data to journalists via the platforms above. One viral data piece can earn 50+ backlinks.

#### 8.1.5 Unlinked brand mentions

- Set up a **Google Alert** for your brand name + variations.
- Use **Ahrefs Content Explorer** or **BrandMentions** to find every mention on the web.
- For mentions that don't link, email politely: *"Thanks for mentioning us in [article]. Would you mind adding a link to [URL]?"*
- **Conversion:** ~30–50% — easiest links to earn.

#### 8.1.6 Podcast guesting

Niche podcasts in your industry will have you on as a guest. They almost always include a link in show notes. Bonus: builds personal brand / E-E-A-T signals.

**Find podcasts:** Listen Notes, PodMatch, MatchMaker.fm, Apple Podcasts in your niche.

#### 8.1.7 Resource page link building

1. Search: `[your niche] "resources" inurl:resources` · `[your niche] "useful links"`.
2. Find resource pages that link to content like yours.
3. Pitch your page as an addition.
4. **Conversion:** ~10–20% on well-targeted pitches.

#### 8.1.8 Partner / supplier / vendor links

Most businesses have natural link partners they've never asked:
- Suppliers / vendors you buy from
- Software/tools you use (case studies, "customers" sections)
- Industry associations you belong to
- Local chambers of commerce, BBB, industry-specific directories
- Charities / sponsorships / community work

Free, easy, and Google trusts them.

#### 8.1.9 Paid quality backlinks (only if you must)

- Reputable publications with real audiences offering sponsored placements.
- Disclosed as sponsored (using `rel="sponsored"`).
- **Never** link farms, PBNs, or sites whose only inventory is sponsored posts.
- Typical cost on real publications: $500–$5,000 per placement. If it's $50, it's spam.

### 8.2 Backlink tracking & monitoring

Track backlinks per site in `site-info.md` under "Backlinks":

| Tool | What it shows | Cost |
|------|--------------|------|
| **GSC → Links report** | Backlinks Google has discovered (subset of total) | Free |
| **Ahrefs** | Most comprehensive backlink index | $99+/mo |
| **SEMrush Backlink Analytics** | Similar coverage to Ahrefs | $130+/mo |
| **Moz Link Explorer** | Backlinks + Domain Authority | $99+/mo |

**Cadence:**
- **Weekly:** check GSC for new links / lost links.
- **Monthly:** full Ahrefs/SEMrush audit — referring domains trend, top anchor texts, toxic-link flags.
- **Quarterly:** competitor backlink gap analysis.

### 8.3 Toxic links & the disavow file

**Toxic = spammy, irrelevant, or paid links from low-quality domains.** Google generally ignores them, but in extreme cases (manual action, severe spam patterns), you may need to disavow.

**Symptoms:**
- Sudden ranking drop without an algorithm update.
- Manual action notice in GSC.
- Hundreds of new backlinks from unrelated foreign-language domains.
- Anchor text dominated by exact-match commercial keywords.

**Workflow:**
1. Run an Ahrefs/SEMrush toxic-links report.
2. Manually verify (don't trust the tool blindly).
3. Try outreach first — ask the site to remove the link.
4. **Last resort:** submit a disavow file via [Google's Disavow Tool](https://search.google.com/search-console/disavow).

### 8.4 AI search citations (the new off-page signal)

In 2025+, being cited by AI engines (ChatGPT, Perplexity, Claude, Google AI Overviews) is a parallel authority signal — sometimes called **GEO (Generative Engine Optimization)** or **LLMO**.

**How to earn AI citations:**
- **Direct, quotable answers** — AI engines pull literal sentences.
- **Structured data** — FAQ, HowTo, Article schema gives unambiguous content.
- **Original data + statistics** — AI engines cite specific numbers more than generic prose.
- **Comprehensive coverage** — AI engines synthesize from sources covering a topic completely.
- **Strong E-E-A-T signals** — author bios, credentials referenced explicitly.

**How to track:**
- Manually search your brand + key topics in **ChatGPT, Perplexity, Claude, Google AI Overviews** monthly.
- **Profound, AthenaHQ, Otterly.ai, Goodie AI, BrandRank.AI** — emerging tools, $100–$500/mo.

Record AI citation tracking in `site-info.md`:

```markdown
## AI search citations (last checked: YYYY-MM-DD)
- **ChatGPT:** cited ✅/❌ for [keywords]
- **Perplexity:** cited ✅/❌ for [keywords]
- **Google AI Overviews:** appears ✅/❌ for [keywords]
- **Claude:** cited ✅/❌ for [keywords]
```

### 8.5 Off-page priority order (for your portfolio)

Given limited time across 20 sites, attack off-page in this order:

1. **Set up tracking** — GSC links report on every site.
2. **Claim free directory wins** — chambers, BBB, industry directories, supplier "customer" lists.
3. **Unlinked brand mention recovery** — Google Alerts + monthly sweep.
4. **Resource page outreach** — modest volume, predictable yield.
5. **Digital PR (one piece per priority site per quarter)** — highest-leverage activity.
6. **Guest posting** — only on sites with real authority.
7. **Paid placements** — only when revenue justifies $500+ per link.

**Skip entirely:** PBNs, link farms, "DA50+ for $50" services, comment spam, forum link drops, automated link tools.

---

## 9. Foundational SEO Infrastructure

Every site you manage needs the same baseline tracking and verification setup. Without these, you're flying blind. Set up once per site, record access details in `site-info.md`, then never touch unless something breaks.

### 9.1 Google Search Console (GSC) — non-negotiable

The single most important SEO tool. Free. Required.

**What it gives you:**
- Every keyword the site ranks for (impressions, clicks, position).
- Every backlink Google has discovered.
- Crawl errors, indexing problems, manual actions.
- Core Web Vitals field data (real users).
- Sitemap submission + status.
- URL Inspection.

**Setup (any platform):**
1. Visit [search.google.com/search-console](https://search.google.com/search-console).
2. Add property — **prefer "Domain" property** over "URL prefix" if you can.
3. **Verification methods:**

| Platform | Recommended verification |
|----------|--------------------------|
| Any (preferred) | **Domain property via DNS TXT record** at the registrar |
| Next.js / repo-controlled | HTML tag in `app/layout.tsx` `<head>`, redeploy |
| WordPress | Yoast / RankMath plugin → connects via Google account |
| Webflow | Project Settings → Integrations → Google Search Console |
| Shopify | Online Store → Preferences → Google Search Console |
| Squarespace / Wix | Built-in SEO panel → paste verification code |
| Lovable | Lovable prompt: *"add this Google Search Console verification meta tag to the head: [tag]"* |

4. **Submit `sitemap.xml`** under Sitemaps.
5. **Request indexing** for any page that isn't getting picked up. Limit ~10/day per property.
6. **Email alerts** on for indexing issues, manual actions, security issues.

### 9.2 Google Business Profile (GBP) — only if local

Free listing in Google Maps + the local pack. Drives more traffic than most websites for local service businesses.

**Skip if:** national-online site / no physical or service-area presence.

**Setup:**
1. Visit [google.com/business](https://google.com/business) → Create or claim listing.
2. Verify via postcard, phone, email, or video.
3. **Complete the profile fully:**
   - Real NAP (must match site exactly)
   - Business category (most specific available)
   - Hours (including holiday hours)
   - Service area cities (if service-area)
   - Photos (interior, exterior, team, work — 10+ minimum)
   - Services list
4. **Set up Google Posts** — weekly updates appear in your Maps listing.
5. **Encourage reviews** — top local ranking signal. Aim for 5+ to start, 50+ within 12 months.

### 9.3 Google Analytics 4 (GA4)

Free. Required for measuring whether SEO work is driving traffic and conversions.

**Setup (any platform):**
1. Visit [analytics.google.com](https://analytics.google.com) → Create property → set up GA4.
2. Get the **Measurement ID** (starts with `G-`).
3. **Install via Google Tag Manager (recommended)** — see 9.4.
4. **Or install directly** by platform.

5. **Configure key events (conversions):**
   - Form submissions
   - Phone clicks (`tel:` link clicks)
   - Email clicks (`mailto:` link clicks)
   - Outbound link clicks (if relevant)
   - Scroll depth 90% (engagement)
   - Purchase / sign-up (if e-commerce / SaaS)
6. **Link GA4 to GSC** — Admin → Property → Search Console links → Link.

### 9.4 Google Tag Manager (GTM) — recommended

Lets you manage GA4, conversion tracking, and any third-party tags **without touching code** after one initial install.

**Setup:**
1. Visit [tagmanager.google.com](https://tagmanager.google.com) → Create container.
2. Install the GTM snippet on the site (one-time).
3. Configure GA4 + conversions inside GTM, not in code.
4. **Why this matters:** when you need to add a new tag (Facebook pixel, LinkedIn Insight) on any of your 20 sites, you do it inside GTM in 30 seconds.

### 9.5 Bing Webmaster Tools (BWT)

Free. **Important and overlooked.** Bing powers ChatGPT search, DuckDuckGo, and Yahoo.

**Setup:**
1. Visit [bing.com/webmasters](https://bing.com/webmasters).
2. **Easy mode:** Import directly from GSC (one click).
3. Verify, submit sitemap.
4. Check IndexNow integration (instant indexing).

### 9.6 Schema validation tools

Whenever you add or change schema markup, validate it. Two tools, both free:

- **Google Rich Results Test** — [search.google.com/test/rich-results](https://search.google.com/test/rich-results)
- **Schema.org Validator** — [validator.schema.org](https://validator.schema.org)

After every page generation, the `/blog` and `/service` skills automatically run both validators on the staged URL and refuse to ship if there are errors.

### 9.7 AI search visibility (the new layer)

**Manual monthly check (per priority site):**
1. Search 3–5 of the site's primary keywords in:
   - **ChatGPT** (with web browsing on)
   - **Perplexity**
   - **Claude** (with web search on)
   - **Google AI Overviews** (just search the keyword in Google)
2. Note: does the AI cite your site? What content does it reference?
3. Record findings in `site-info.md`.

**Automated tools (paid, optional):** Profound · AthenaHQ · Otterly.ai · Goodie AI · BrandRank.AI — $100–$500/mo per brand.

### 9.8 Per-site infrastructure inventory

Maintain in each site's `site-info.md`:

```markdown
## SEO infrastructure status (last audited: YYYY-MM-DD)
- [ ] GSC verified (Domain property preferred)
- [ ] Sitemap submitted to GSC
- [ ] GBP claimed (if local) or N/A (if national-online)
- [ ] GA4 installed + key events configured
- [ ] GA4 ↔ GSC linked
- [ ] GTM installed (recommended)
- [ ] BWT verified
- [ ] IndexNow enabled (BWT)
- [ ] Schema validates without errors
- [ ] AI search visibility checked (monthly cadence)
- [ ] Email alerts on (GSC + BWT)
```

Run the `/audit` skill periodically — it walks this checklist for any site and flags gaps.

---

## 10. SEO as a Service — engagement model, KPIs, pricing

> **Conditional section.** Applies when the toolkit is being used to deliver SEO work to a paying client (consulting engagement, agency work, or freelance) — not when running SEO on a site you own.

This section is the business layer. The toolkit's other sections cover *what to do*; this section covers *how to scope it, price it, and deliver it as a sellable engagement.*

### 10.1 The two-phase engagement model

Most credible SEO consulting engagements break into two phases. They have different deliverables, different time horizons, and different pricing structures.

#### Phase 1 — Discovery + strategy (one-time, ~1 month)

**What gets delivered:**
- Sector + business discovery interview (per `site-info.md` template, Section 1.2)
- Transactional keyword research (Section 2.2) → `service-keywords.csv`
- Informational keyword research (Section 2.1) → `keywords.csv`
- Transactional architecture (Section 2.6) → `architecture.md`
- Technical SEO audit (Section 6 + `/audit` skill)
- KPI baseline + targets (`templates/kpis.md`) — see 10.3
- 30/60/90-day strategy and implementation roadmap

**Time:** ~1 month from kickoff to strategy presentation.

**Pricing structure:** single payment. Higher per-hour than recurring because the strategic responsibility is concentrated here.

**Pricing tiers (€, EU market reference; USD scales similarly):**

| Profile | Phase 1 fee |
|---|---|
| Freelance / small project | €600 – €1,500 |
| Agency or senior consultant | €1,000 – €3,000 |
| Large multinational / enterprise | up to €10,000 |

The fee scales with: catalog size (more keywords + more architecture rows = more work), number of countries / markets (each adds an architecture + hreflang + market-specific competitor research), and risk responsibility (a strategy error on a high-revenue site costs more than on a low-traffic one — bake the responsibility into the price).

#### Phase 2 — Implementation + monitoring (recurring monthly)

**What gets delivered each month:**
- Implementation of the Phase 1 roadmap items scheduled for that month
- Content production at the cadence agreed in Phase 1 (e.g., 4 blog posts/month, 1 service page/month)
- Technical fixes from `/audit` punchlist
- Monthly progress report: GSC clicks/impressions/positions, indexed pages, AI search citation status (where measurable), backlinks gained, Lighthouse trend
- One review call to align on next month's priorities

**Pricing:** monthly retainer.

**Sizing rule of thumb:** Phase 2 monthly fee is roughly **50–75% of the Phase 1 fee**. So a €2,000 Phase 1 typically pairs with €1,000 – €1,500 / month Phase 2. Adjust by:
- Catalog size (more pages to monitor = higher fee)
- Markets covered (each market = its own monthly slice)
- Content cadence agreed (4 posts/mo vs 12 posts/mo materially changes the fee)
- Implementation complexity (custom dev work vs CMS-paste increases scope)

#### Pricing rationale (for client conversations)

> "The strategy phase is one-time and weighted because it's where the irreversible decisions get made — architecture, primary keywords, technical baseline. A mistake in Phase 1 costs more to undo than to prevent. The monthly phase is execution against a plan you've already approved. The recurring fee covers content, monitoring, technical fixes, and reporting against the KPIs we agreed on. The price reflects the responsibility — running SEO on a site doing 100 visits/day and one doing 1M visits/day is the same craft, but very different stakes."

### 10.2 KPI definition (Phase 1 deliverable)

Every engagement starts with a written KPI sheet. The toolkit provides a template at `templates/kpis.md` (one per managed site) — fill it during Phase 1, archive it at engagement close, compare against actuals quarterly.

Required fields:

| Field | Example |
|---|---|
| **Engagement start date** | 2026-05-15 |
| **Baseline organic clicks** (last 90 days, GSC) | 312 / 90 days |
| **Baseline impressions** | 8,400 / 90 days |
| **Baseline indexed pages** | 22 |
| **Baseline non-branded query share** | 18% of impressions |
| **Baseline conversion rate from organic** | not tracked / 0.4% / etc. |
| **Baseline DR (Ahrefs Webmaster Tools, free)** | 12 |
| **Baseline AI search citations** (per the 45-cell matrix in `ai-search-baseline-YYYY-MM-DD.md`) | 0 / 45 |
| **Target at 90 days** | clicks +50%, impressions +100%, 1+ AI citation |
| **Target at 180 days** | clicks +100%, 5+ AI citations, DR ≥ 18 |
| **Target at 365 days** | clicks +200%, top-3 ranking on 3 commercial keywords |
| **Conversion goal** (specific to the business) | 8 inbound consults / month from organic |
| **Out-of-scope** | paid ads, social, email — not part of this engagement |

KPIs are conservative-realistic, not aspirational. Set targets the engagement can plausibly hit; over-promise = lost client at month 3.

### 10.3 Engagement proposal structure

Use `templates/engagement-proposal.md` to draft proposals. Standard sections:

1. **Executive summary** — 3 sentences. What the engagement delivers, in plain language.
2. **Discovery summary** — what you learned from the kickoff call. Demonstrates listening.
3. **Phase 1 scope + deliverables + timeline** (referencing 10.1)
4. **Phase 2 scope + monthly cadence** (referencing 10.1)
5. **KPIs + measurement cadence** (referencing 10.2 + the `kpis.md` template)
6. **Pricing** — Phase 1 fee, Phase 2 monthly, payment terms, what's NOT included
7. **What success looks like at 90 / 180 / 365 days**
8. **Out-of-scope work** — explicit list of what won't get done (paid ads, social, etc.) so scope creep is documented up front
9. **Sign-off block**

### 10.4 Profile + salary context (career / hiring reference)

Useful when scoping who needs to be on the team for an engagement, or for hiring decisions.

| Profile | Years | Salary band (EU €) | Toolkit role |
|---|---|---|---|
| SEO Junior | < 1 | 19,000 – 21,000 | Implements technical fixes, runs `/audit` |
| SEO Specialist | 2 | 24,000 – 28,000 | Owns content production, writes briefs |
| SEO Senior | 3+ | 30,000 – 35,000 | Designs strategy, runs `/triage`, leads engagements |
| SEO Manager | 5+ | 40,000+ | Manages team + multiple engagements |
| Head of SEO | 7+ | 60,000+ | Owns the function |

USD bands typically run 1.2 – 1.4× these for US market.

**Work environment trade-offs (for self-positioning):**
- **Agency** — faster learning across many sectors, lower base salary, exposure to many tools/sites
- **In-house** — higher base salary (no agency margin), depth in one domain, slower exposure breadth
- **Freelance** — no salary cap, no base, full responsibility for client acquisition + delivery + admin

### 10.5 What this section does NOT do

- It doesn't replace your contract / SOW. The proposal template is a starting point; legal language is your lawyer's job.
- It doesn't recommend pricing for a specific engagement — pricing depends on local market, your reputation, and the client's risk profile. The bands are reference points, not quotes.
- It doesn't cover sales (lead generation, discovery call structure, close conversations). That's a separate playbook.

---

## Quick Reference: The Full Workflow (Existing Sites Edition)

### One-time setup (toolkit-level)
1. **Build the SEO toolkit repo** (Section 1.2) — standalone `seo-toolkit/` repo with shared `references/`, `on-page-seo.md`, `.claude/skills/`, and per-site `sites/[name]/` folders.
2. **Populate root `references/`** with your default voice (`voice.md`, `humour.md`, `stats.md`, `stories.md`, `opinions.md`).
3. **Configure keyword tool defaults** + image source defaults (Sections 2.1, 3.1).

### Per-site onboarding (run once per site)
4. **Create `sites/[site-name]/site-info.md`** — fill in basics, SEO baseline, keywords, conversion goals, footprint, voice override, publishing method, brand assets.
5. **Run `/audit`** on the site → records technical SEO baseline, flags gaps.
6. **Set up foundational infrastructure** (Section 9) — GSC, GBP if local, GA4, GTM, BWT, schema validators.
7. **Fix critical technical gaps** before content work — content is wasted on a broken foundation.

### Per-site SEO loop (recurring)
8. **Pick the highest-leverage site** with `/triage`.
9. **Keyword research** (Section 2) → tool-agnostic, populate `keywords.csv` + `service-keywords.csv`.
10. **Generate content:**
    - `/blog` for informational keywords
    - `/service` for commercial keywords (footprint-aware)
    - `/refresh` for upgrading existing posts
11. **Publish** at the site's recorded cadence (Section 7.1) — the skill refuses spikes.
12. **Off-page work** (Section 8) → free wins → digital PR + journalist platforms.

### Measurement & iteration
13. **Weekly per priority site:** GSC clicks/impressions + top movers + new backlinks.
14. **Monthly per priority site:** ranking deltas + content shipped + AI search visibility check.
15. **Quarterly per priority site:** re-run `/audit`, full backlink audit, competitor gap analysis, conversion review.
16. **Quarterly portfolio-wide:** re-run `/triage`.

### Hard rules across the workflow
- **Tier 1 on-page (Section 5)** is non-negotiable on every page.
- **Anti-doorway-page rules (Section 4.1)** apply to every service-area city page — no exceptions.
- **Cadence (Section 7.1 + 4.2)** is enforced by the skills.
- **Voice (Section 3.4)** is enforced by the skills.
- **Never** PBNs, link farms, or paid links from non-reputable sources (Section 8).

### What's *not* in this guide (intentionally)
- New-website-from-scratch deployment (covered briefly in Section 1.3).
- General Next.js / WordPress / Lovable development.
- Paid search (SEM).
- Social media SEO.

---

# Appendix A — On-Page SEO Checklist (`on-page-seo.md`)

**15 categories · 80+ items · the complete on-page SEO spec for blog posts and service pages.**

> Save as `on-page-seo.md` in your toolkit root. Every page-generation skill reads it before generating any page.

## 1. Head & Metadata — What Google Indexes First
- [ ] **Title tag** — 50–60 chars, primary keyword near the start.
- [ ] **Meta description** — 150–160 chars, keyword + benefit + soft CTA.
- [ ] **Canonical URL** set to prevent duplicates.
- [ ] **Open Graph** — `og:title`, `og:description`, `og:image` (1200×630), `og:url`, `og:type`.
- [ ] **Twitter Card** — `summary_large_image`, title, description, image.
- [ ] **Language** attribute on `<html>` (e.g. `lang="en"`).
- [ ] **Viewport meta** tag for responsive rendering.
- [ ] **Favicon** + `apple-touch-icon`.
- [ ] **Charset meta** — `<meta charset="utf-8">`.

## 2. URL Structure — Clean, Readable, Keyword-Forward
- [ ] **Short slug** — under 60 chars.
- [ ] **Primary keyword** in the slug.
- [ ] **Hyphens** only — never underscores.
- [ ] **Lowercase** only.
- [ ] **No stop words** ("the", "a", "of") unless necessary.
- [ ] **Logical hierarchy** — `/services/[slug]`, `/blog/[slug]`.

## 3. Headings — Structure for Skimmers & Bots
- [ ] **Exactly one H1** per page, contains primary keyword.
- [ ] **Logical H2 → H3** hierarchy — never skip levels.
- [ ] **H2s** use supporting keywords + questions from the cluster.
- [ ] **No keyword stuffing** — write naturally.

## 4. Copy & Body — Answer the Query, Fast
- [ ] **Primary keyword** in the first 100 words.
- [ ] **Direct answer** to the query in the first paragraph.
- [ ] **Length** matches SERP average (within 20% of top-3).
- [ ] **Short paragraphs** (1–4 sentences).
- [ ] **Readability** — 8th–10th grade level.
- [ ] **Active voice** preferred.
- [ ] **Bold key phrases** — sparingly.
- [ ] **Bullets & numbered lists** where appropriate.

## 5. FAQ Section — Every Blog Post
- [ ] **4–8 questions** from SEMRush Questions tab + "People Also Ask".
- [ ] **Direct answers** — 2–4 sentences each.
- [ ] **FAQ schema** (JSON-LD) applied.

## 6. Images — Every Image Is a Ranking Signal
- [ ] **Alt text** describes image + keyword where natural.
- [ ] **Filenames** — descriptive, hyphens, e.g. `emergency-plumber-toronto.webp`.
- [ ] **WebP**, compressed under 200 KB.
- [ ] **Width/height** attributes specified — prevents CLS.
- [ ] **Lazy loading** (`loading="lazy"`) for below-fold images.
- [ ] **Responsive srcset** where needed.
- [ ] **Featured/hero image** for social sharing.

## 7. Internal Links — Pass Authority Across the Site
- [ ] **3–5 internal links** per post.
- [ ] Link to **related blog posts** & **relevant service pages**.
- [ ] **Descriptive anchor text** — never "click here" or "read more".
- [ ] **Contextually placed** in body copy.
- [ ] **Breadcrumbs** on every page.

## 8. External Links — Cite Authority, Don't Hoard It
- [ ] **2–3 external links** to authoritative sources (.gov, .edu, major industry).
- [ ] **Relevant** to the topic.
- [ ] Open in **new tab** with `rel="noopener"`.
- [ ] **Link relationship attributes** — apply per current Google guidance:
  - `rel="sponsored"` for paid / affiliate / sponsored links.
  - `rel="ugc"` for user-generated content (comments, forum posts, guest contributions).
  - `rel="nofollow"` for general untrusted links or when none of the above apply.
  - Multiple values allowed (e.g., `rel="sponsored noopener"`).
  - For reference: `nofollow` alone still works as a catch-all, but Google now treats `sponsored` and `ugc` as more useful semantic hints.

## 9. Schema Markup — JSON-LD in `<head>`
- [ ] **Article schema** on blog posts — use the most specific subtype:
  - `BlogPosting` for typical blog content (default for `/blog/*` posts).
  - `NewsArticle` for time-sensitive news / press releases.
  - `TechArticle` for in-depth technical content.
  - `Article` (generic) only as a fallback when none of the above fit.
  - Required properties: `headline`, `author` (with nested `Person` schema), `datePublished`, `dateModified`, `image`, `publisher` (with nested `Organization` schema).
- [ ] **LocalBusiness schema** — use the most specific subtype available on schema.org:
  - Examples: `Plumber`, `Dentist`, `Restaurant`, `Attorney`, `AutoRepair`, `HairSalon`, `Electrician`, `MedicalBusiness`, `ProfessionalService`.
  - **Required properties:**
    - `name` (legal or DBA — match site + GBP exactly)
    - `address` (full `PostalAddress` with `streetAddress`, `addressLocality`, `addressRegion`, `postalCode`, `addressCountry`)
    - `telephone` (E.164 format: `+1-416-555-1234`)
    - `url` (canonical homepage)
    - `image` (logo or storefront photo, 1200×630 or square)
    - `priceRange` (`$`, `$$`, `$$$`, `$$$$`)
    - `openingHoursSpecification` (per day)
    - `geo` (`GeoCoordinates` with `latitude`/`longitude`)
  - **Footprint-specific:**
    - `multi-location` → one `LocalBusiness` schema per branch page; `Organization` schema site-wide.
    - `service-area` (mobile) → add `areaServed` + `serviceArea`; omit physical storefront photo.
    - `single-location` → one schema, used site-wide.
    - `national-online` → do NOT use `LocalBusiness`; use `Organization` instead.
  - **Optional but valuable:** `aggregateRating`, `review` array, `sameAs`, `paymentAccepted`, `currenciesAccepted`.
- [ ] **Service schema** on every service page:
  - **Required properties:**
    - `name` (the service)
    - `serviceType` (category)
    - `provider` (nested `LocalBusiness` or `Organization`)
    - `description`
    - `url`
  - **Footprint-aware properties:**
    - `areaServed` (array of `City` / `AdministrativeArea` / `GeoCircle`) — required for service-area + multi-location.
    - `serviceArea` (alternative property; same intent).
  - **Conversion-supporting properties:**
    - `offers` (nested `Offer` with `price` or `priceSpecification`).
    - `availableChannel` (`ServiceChannel` with `servicePhone`).
    - `hoursAvailable` (if hours differ from main business hours).
  - **Optional:** `aggregateRating`, `category`, `termsOfService`.
- [ ] **FAQPage schema** wherever an FAQ section exists on the visible page:
  - Use schema type `FAQPage` (not `QAPage`).
  - Each item is a `Question` with a nested `Answer`.
  - **Critical: Q+A text in the schema must match the visible page content exactly.** Google penalizes mismatches.
  - **Eligibility note:** FAQ rich results are now restricted to authoritative government and health sites for most queries — most commercial sites won't get the rich result anymore. Still ship the schema; AI search engines parse it.
  - **Don't use FAQPage schema for:** user-generated Q+A (use `QAPage`), marketing copy disguised as FAQs, single-question pages.
- [ ] **BreadcrumbList schema** on every page:
  - Schema type: `BreadcrumbList` with an array of `ListItem` entries.
  - Each `ListItem` has `position` (1-indexed), `name`, and `item` (the URL).
  - **Critical: schema breadcrumbs must match the visible breadcrumbs exactly.**
  - **Common patterns:**
    - Blog post: Home → Blog → [Category] → [Post]
    - Service page: Home → Services → [Service]
    - Service+city page: Home → Services → [Service] → [City]
    - Location page: Home → Locations → [City]
- [ ] **Organization schema** site-wide:
  - Schema type: `Organization` (or more specific subtype).
  - **Required:** `name`, `url`, `logo`, `sameAs` (LinkedIn, X, Facebook, Instagram, YouTube, Crunchbase, Wikipedia, Wikidata), `contactPoint` (with `telephone`, `contactType`, `availableLanguage`).
  - **Recommended:** `description`, `foundingDate`, `address`, `email`, `numberOfEmployees`.
  - **Footprint note:** for `single-location` and `multi-location` sites, `LocalBusiness` (per location) and `Organization` (site-wide) coexist.
  - **Knowledge Panel impact:** strong `Organization` schema with `sameAs` feeds Google's Knowledge Panel.
- [ ] **Author/Person** schema for bylines.

## 10. E-E-A-T Signals — Experience · Expertise · Authority · Trust
- [ ] **Author byline** with name on every blog post.
- [ ] **Author bio** with credentials (years, qualifications).
- [ ] Link to **author's dedicated page**.
- [ ] **Published date** displayed.
- [ ] **"Last updated" date** when refreshed.
- [ ] **Real stories, numbers, opinions** from the business voice file.
- [ ] **Cite authoritative sources.**
- [ ] **About page** with full company credentials.
- [ ] **Contact page** — real address, phone, hours.

## 11. Accessibility — A11y Signals = SEO Signals
- [ ] **Semantic HTML5** — `<header>`, `<nav>`, `<main>`, `<article>`, `<footer>`.
- [ ] **ARIA labels** on interactive elements where needed.
- [ ] **Color contrast** meets WCAG 2.1 AA minimums:
  - **Body text (under 18px or under 14px bold):** 4.5:1 contrast against background.
  - **Large text (18px+ regular, or 14px+ bold):** 3:1 contrast against background.
  - **UI components and graphical objects** (form borders, icons, focus rings): 3:1 against adjacent colors.
  - **Aim for AAA (7:1 body, 4.5:1 large)** on accessibility-focused sites (legal, healthcare, government, education).
  - **Verify with:** Chrome DevTools → Lighthouse → Accessibility, or WebAIM Contrast Checker, or browser extension like axe DevTools.
  - **Common fail points:** light gray secondary text, brand colors on white backgrounds, placeholder text, disabled-state buttons, image-overlay text.
- [ ] **Focus indicators** visible on interactive elements.
- [ ] **Alt text** on all images (empty `alt=""` for decorative).
- [ ] **Descriptive link text**.
- [ ] **Skip-to-content** link for keyboard users.

## 12. Mobile & Responsive — Mobile-First Indexing
- [ ] **Responsive layout** — fluid across viewports (mobile, tablet, desktop). Most modern platforms (WordPress themes, Webflow, Lovable, Tailwind, Shopify themes) handle this by default; verify by resizing the browser window from 320px → 1920px.
- [ ] **Touch targets** minimum 48×48 px.
- [ ] **Body font** minimum 16 px.
- [ ] **No horizontal scroll** at any viewport.
- [ ] **No intrusive interstitials on mobile** (Google's penalty applies specifically to mobile):
  - **Penalized patterns:** popups covering main content on load, standalone interstitials the user must dismiss, above-the-fold layouts that look like a standalone interstitial, forced email/sign-up gates, forced "open in app" prompts.
  - **Allowed patterns:** legal interstitials (cookie consent, age verification — must be dismissable), login dialogs on legitimately gated content, banners using reasonable screen space and easily dismissed, exit-intent and scroll-triggered popups.
  - **Why it matters:** intrusive interstitials are a direct ranking penalty (algorithmic), not just a UX best practice.

## 13. Social Preview — Shareable Card
- [ ] **OG image** optimized — 1200×630, under 1 MB.
- [ ] **Twitter Card image** — 1200×600.
- [ ] **Compelling `og:description`** — different from meta if valuable.

## 14. Conversion Elements *(Service Pages Only)* — Capture the Lead
- [ ] **Primary CTA** above the fold.
- [ ] **Phone number** with click-to-call (`tel:`).
- [ ] **Multiple CTA placements** throughout the page.
- [ ] **Trust signals** — reviews, ratings, licenses, years.
- [ ] **Testimonials** with names (photos where possible).
- [ ] **Service-area coverage** listed.
- [ ] **Business hours** displayed.
- [ ] **Physical address & map** — applied per geographic footprint:
  - **Single-location** → real physical address + embedded Google Maps iframe. Required.
  - **Multi-location** → each branch's service page shows that branch's address + embedded map.
  - **Service-area** (mobile, no public storefront) → omit physical address from public-facing pages; show service-area map (highlighted region or list of cities served). HQ address can appear in `LocalBusiness` schema even if not displayed publicly.
  - **National-online** → omit map entirely. Show "Serving [country/region] online."
  - **Verification:** address shown must match `LocalBusiness` schema, NAP in footer, and Google Business Profile exactly.

## 15. Long-Form Content *(1500+ Word Posts)*
- [ ] **Table of contents** with anchor links at the top.
- [ ] **Jump links** for each H2.
- [ ] **Back-to-top** button.

**Total: 80+ items across 15 categories.**

> Point Claude Code at `on-page-seo.md`, then run `/blog` or `/service` — the skill satisfies every applicable item automatically.

---

# Appendix B — Toolkit `CLAUDE.md` (System Rules)

```markdown
# Project Overview

**This is the SEO toolkit repo (`seo-toolkit`).** It is not a website — it is a Claude Code workspace that operates on multiple existing websites the user manages.

The toolkit applies a consistent SEO workflow across every managed site, regardless of platform (WordPress, Lovable, Webflow, Next.js, Shopify, custom, etc.). The websites themselves live in their own repos / hosting — this toolkit never touches their codebases unless explicitly told to push changes.

## What the toolkit does

| Skill | Purpose |
|-------|---------|
| `/blog` | Generate a long-form, SEO-optimized, voice-matched blog post for a chosen site |
| `/service` | Generate a service page (footprint-aware: single-location / multi-location / service-area / national-online) |
| `/refresh` | Upgrade an existing blog post — re-do SERP analysis, refresh stats, fix on-page gaps, update internal links |
| `/audit` | Run a technical SEO audit on a chosen site, log results to its `site-info.md` |
| `/triage` | Score every site in `sites/` by SEO opportunity, recommend top 3 to focus on |

## How it's organized

- **Toolkit root** — shared assets used across all sites:
  - `references/` → default voice (Your Name / SiteA)
  - `on-page-seo.md` → 80+ signal checklist (Appendix A of `SEO_GUIDE.md`)
  - `.claude/skills/` → the five skills above
  - `SEO_GUIDE.md` → the canonical playbook
  - `CLAUDE.md` → this file
- **`sites/[site-name]/`** — per-site folders, one per managed website:
  - `site-info.md` → URL, platform, footprint, NAP, GSC/GA4 setup, voice override flag, etc.
  - `keywords.csv` → informational keywords (for `/blog`)
  - `service-keywords.csv` → commercial keywords (for `/service`)
  - `used-keywords.md` → tracker preventing keyword cannibalization
  - `notes.md` → conversion winners, audit history, anything site-specific
  - `references/` (optional) → per-site voice override
  - `_drafts/[slug]/` → working drafts before publish

## How publishing works

The toolkit does not deploy websites. For each site, `site-info.md` records the publishing method:
- `repo-commit` → Claude commits markdown to the site's GitHub repo, deploys via Vercel/Netlify.
- `cms-paste` → Claude generates clipboard-ready output; user pastes into WordPress/Webflow/Shopify.
- `lovable-prompt` → Claude generates a Lovable-ready prompt + content; user pastes into Lovable.
- `headless-api` → Claude pushes via configured API (Sanity, Contentful, Strapi).

## What this `CLAUDE.md` controls

This file sets the rules every skill follows: voice handling, on-page SEO, technical SEO, content cadence, testing, scope. The skills themselves (`SKILL.md` files in `.claude/skills/`) reference these rules rather than restating them.

---

# Voice — read before writing any content

When writing **any blog post, service page, or customer-facing copy**, the skill resolves voice files in this order (later overrides earlier):

1. `seo-toolkit/references/[file].md` — default voice (Your Name / SiteA)
2. `seo-toolkit/sites/[site-name]/references/[file].md` — per-site override (when present)

A site can override any subset of files (e.g., only `voice.md`) and inherit the rest from the toolkit defaults.

## The five reference files

| File | What it captures |
|------|-----------------|
| `voice.md` | Writing style — sentence rhythm, vocabulary, formatting rules, words to avoid, "tells that it's AI-written" checklist |
| `humour.md` | Comedic approach for this voice — dry / deadpan / self-deprecating / serious / none |
| `stats.md` | Canonical real numbers for the business — pricing, response times, jobs completed, customers served, ratings, dates. Never invent or round. |
| `stories.md` | 5–10 recurring anecdotes the writer can pull from. One per post max. Never invent new ones. |
| `opinions.md` | Hot takes on the industry — strong views backed by numbers from `stats.md`. One per post max. |

## Universal voice rules (apply unless overridden per-site)

- **Banned words/phrases:** "unlock", "leverage", "seamless", "world-class", "cutting-edge", "revolutionary", "in today's fast-paced world", "delve", "navigate the complexities of", exclamation marks, emojis. Per-site `voice.md` may add or remove from this list.
- **Open with the answer.** Add context after, not before.
- **Real numbers only** — pulled from the resolved `stats.md`. Never round. If a needed stat isn't in `stats.md`, ask before fabricating.
- **One story per post max** — pulled from the resolved `stories.md`. Never invent new ones.
- **One strong opinion per post max** — pulled from the resolved `opinions.md`. Must be backed by a number from `stats.md`.
- **Tell readers when NOT to hire / use the product.** Biggest single tell that this isn't AI slop.
- **Banned generic phrases** for endings: "In conclusion", "At the end of the day", "Hope this helps."

## Pre-ship anti-AI check

Before any draft ships, re-read the resolved `voice.md` → "Tells that it's AI-written" section and delete anything that matches. The `/blog` and `/service` skills run this check automatically and refuse to ship a draft that fails.

## When voice files are missing

- Root `references/` is **required** — the toolkit cannot generate content without a default voice. The skills refuse to run if missing.
- Per-site `references/` is **optional** — sites without an override use the root defaults.
- If a site needs a voice that conflicts with Your Name / SiteA's default, create the per-site override before running any content skill.

---

# On-page SEO — applies to every page generated by every skill

When generating or editing **any page** (blog post, service page, refreshed post), read `on-page-seo.md` at the toolkit root. Every item applicable to the page type must be satisfied.

## Tier 1 (non-negotiable on every page)

These 16 items must pass before any draft ships. The skills validate Tier 1 automatically and refuse to ship a draft that fails any:

1. **Title tag** — 50–60 chars, primary keyword near the start, unique per page
2. **Meta description** — 150–160 chars, primary keyword + benefit + soft CTA
3. **One H1** containing the primary keyword
4. **Primary keyword in first 100 words**, reads naturally
5. **URL slug** — short, lowercase, hyphenated, contains primary keyword
6. **Canonical URL** — self-referencing
7. **Open Graph + Twitter Card** meta
8. **Image alt text + descriptive hyphenated filenames**
9. **3–5 internal links** with descriptive anchor text
10. **2–3 external links** to authoritative sources, `rel="noopener"`
11. **Schema (JSON-LD)** per page type — `Article`/`BlogPosting`, `Service` + `LocalBusiness`, `FAQPage`, `BreadcrumbList`, `Organization`, `Person`
12. **FAQ section** with `FAQPage` schema (4–8 Q+A on every blog post + service page)
13. **Author byline + bio** with `Person` schema (blog posts)
14. **Mobile-friendly** — responsive, 16px+ body font, 48×48px touch targets, no horizontal scroll
15. **Loads fast** — Lighthouse mobile ≥ 90 performance, LCP < 2.5s, CLS < 0.1, INP < 200ms
16. **Semantic HTML5** — `<header>`, `<nav>`, `<main>`, `<article>`, `<footer>`

## Beyond Tier 1

The full 80+ item checklist lives in `on-page-seo.md` (Appendix A of `SEO_GUIDE.md`). The skills satisfy as much of `on-page-seo.md` as the page type warrants.

## Schema validation (mandatory)

Before any page ships, the skill runs both validators on the staged URL or rendered HTML:
- **Google Rich Results Test** ([search.google.com/test/rich-results](https://search.google.com/test/rich-results))
- **Schema.org Validator** ([validator.schema.org](https://validator.schema.org))

Schema content (FAQ Q+A, breadcrumb labels, etc.) must match the visible page exactly.

## Skill-specific extras

- `/blog` → adds Tier 1 + table of contents (for 1500+ word posts) + jump links + back-to-top
- `/service` → adds Tier 1 + footprint-aware NAP + conversion elements + service schema with `areaServed`
- `/refresh` → preserves the original URL/canonical, updates `dateModified`, refreshes stats, fixes any Tier 1 gaps from the original post

---

# Technical SEO — applies to every site

The toolkit enforces 8 technical SEO non-negotiables on every managed site. The **what** is universal; the **how** depends on the platform (full implementation cheat sheet in `SEO_GUIDE.md` Section 6.1).

## The 8 non-negotiables (every site)

1. **Sitemap** at `/sitemap.xml` — submitted to GSC
2. **`robots.txt`** at `/robots.txt` — allows crawlers, references the sitemap
3. **Canonical URL** on every page — self-referencing
4. **Open Graph images** (1200×630) — present and resolve
5. **Image width/height attributes** specified — prevents CLS
6. **Semantic HTML5**
7. **Mobile viewport meta**
8. **HTTPS everywhere** — no mixed content warnings

## Performance targets (Core Web Vitals — mobile-first)

Google ranks based on **mobile** Core Web Vitals from real-user data, not lab scores.

**Core Web Vitals (hard targets — these are real ranking signals from field data):**

| Metric | Target |
|--------|--------|
| LCP (Largest Contentful Paint) | < 2.5s |
| INP (Interaction to Next Paint) | < 200ms |
| CLS (Cumulative Layout Shift) | < 0.1 |

**Lighthouse mobile (lab tests):**
- **Stretch goal: 100 across all four** — Performance, SEO, Accessibility, Best Practices.
- **Realistic floors (do not ship below):** see `SEO_GUIDE.md` Section 6.2.
- The `/audit` skill flags any score below the Section 6.2 floor as a blocker; scores between the floor and 100 are flagged as opportunities, not blockers.

## Per-platform implementation

See `SEO_GUIDE.md` Section 6.1 for the cheat sheet.

## Enforcement via `/audit`

The `/audit` skill walks all 8 non-negotiables + Core Web Vitals on a chosen site and writes the result into `sites/[site-name]/site-info.md`. Run quarterly per priority site, and after any major site change.

## What this `CLAUDE.md` does NOT do

This file does not edit website codebases. The toolkit is a workspace that generates content + audit reports. Implementing technical SEO fixes happens in each site's own repo (for `repo-commit` sites) or in each site's CMS (for everything else).

---

# Design — for content the toolkit generates

The toolkit itself has no UI. But the content it generates renders on each site, and the visual presentation matters for both SEO (Core Web Vitals, mobile UX) and brand consistency.

## Universal rules (apply to every site unless overridden per-site)

- **No emoji icons** in body copy, headings, CTAs, or UI elements. Emoji are an AI-content tell. Use real icon sets (Lucide, Heroicons, Phosphor) or no icons at all.
- **No generic gradients** (purple-to-pink, blue-to-cyan). If gradients are used, they must come from the site's documented brand palette.
- **No inline styles** in generated HTML. Use the site's existing class system.
- **No decorative `<div>` soup** — see Tier 1 #16 (semantic HTML5).
- **Subtle animations only** — fade-ins, gentle reveals. Meets `prefers-reduced-motion` accessibility expectations.
- **Proper spacing & visual hierarchy** — generous whitespace, clear H1 → H2 → H3 size differential, body copy never wider than ~75 characters per line on desktop.
- **Mobile-first sizing** — body 16px+, touch targets 48×48px+.

## Per-site brand override

Each site has its own brand. Record visual rules in `sites/[site-name]/site-info.md` under "Content → Brand assets location":
- **Accent color** (single primary brand color, hex)
- **Typography** (heading font + body font, with fallbacks)
- **Logo location** (URL or path)
- **Image style** (photographic / illustrated / hand-drawn / mixed)
- **Brand palette** (full color set if relevant)
- **Existing component library** (Tailwind config, design system docs, Figma file, brand guideline PDF)

When generating content for a site, the skill loads these brand assets and applies them. If a brand asset is missing or undocumented, the skill asks before assuming.

## Toolkit defaults (when site brand isn't documented)

- **Accent color:** site's existing primary brand color or a neutral indigo as fallback.
- **Typography:** the site's existing font stack — never inject new fonts without asking.
- **Premium / clean / readable** is the default aesthetic.

---

# Development Rules

## Rule 1: Always read first

Before any action, read in this order:

1. **`CLAUDE.md`** (this file)
2. **`SEO_GUIDE.md`**
3. **`on-page-seo.md`**
4. **`sites/[site-name]/site-info.md`**
5. **Resolved `references/`** — root files + per-site overrides if present
6. **`sites/[site-name]/keywords.csv`** + **`used-keywords.md`** — when the action involves keyword work
7. **`sites/[site-name]/notes.md`**

If any required file is missing, the skill asks the user before proceeding — never fabricates content from assumed defaults.

## Rule 2: Define before you build

For any non-trivial action:
1. Write the plan to a temporary draft (or state inline if short).
2. Show the plan to the user.
3. Wait for approval before generating final output.

For trivial actions, skip the approval step but still state what's about to happen.

## Rule 3: Look before you create

Before creating any new file or content:
1. Check if it already exists (search `_drafts/`, the live site URL, GSC, `used-keywords.md`).
2. If it exists, edit / refresh it. Don't duplicate.
3. If it doesn't exist, create it — but only after Rule 1 + Rule 2.

For keyword work: never publish a primary keyword that appears in `used-keywords.md` for that site.

## Rule 4: Validate before you ship

Before any draft is marked complete:
- ✅ **Tier 1 on-page check** — all 16 items pass.
- ✅ **Schema validation** — both Google Rich Results Test and Schema.org Validator pass.
- ✅ **Voice anti-AI check** — re-read resolved `voice.md` → "Tells that it's AI-written" and delete matches.
- ✅ **Cadence check** — verify the publish wouldn't exceed `site-info.md` → Content cadence.
- ✅ **Cannibalization check** — primary keyword not already in `used-keywords.md`.
- ✅ **Lighthouse spot-check** — for `repo-commit` sites, run mobile Lighthouse on the staged URL.

If any check fails, the skill **refuses to ship** and reports what needs fixing.

## Core Rule: Do exactly what is asked

Nothing more, nothing less. If anything is unclear, ask before starting.
- Don't optimize a section that wasn't requested.
- Don't change formatting/structure unless specified.
- Don't add features, sections, or files beyond the request.
- Don't refactor existing site code unless explicitly asked.

## Testing the toolkit itself

The toolkit has no build step. Testing means:
- **Skill smoke test** — run a skill on a known-good site after any skill edit.
- **Reference file test** — after editing `references/`, regenerate one short piece of content and check voice consistency.
- **Per-site test** — after creating a new `sites/[name]/` folder, run `/audit` to verify all required files exist.

Never claim a skill or rule change is "done" without running at least one smoke test on a real site.

---

# Tech Stack

## Toolkit itself

The toolkit is a Claude Code workspace, not an application.

| Layer | What it uses |
|-------|-------------|
| **Format** | Markdown for guides, references, site-info, notes; CSV for keyword lists; YAML/Markdown frontmatter inside `SKILL.md` files |
| **Scripts** | TypeScript (`.mjs` or `.ts`) in `scripts/`. Run via `node` or `tsx`. |
| **APIs (optional)** | Pexels, Unsplash, Google PageSpeed Insights, Google Search Console (via OAuth), schema validators. Keys in `.env`, never committed. |
| **Dependencies** | Minimal — only what scripts need. Track in `package.json` if any. |
| **Runtime** | Local Mac (Claude Code via Anti-Gravity or terminal). |
| **Version control** | Private or public GitHub repo. Optional cloud-storage sync as backup. |

## Per-site stacks

Each managed site runs on its own platform. The toolkit adapts based on `sites/[site-name]/site-info.md`:
- **Platform** (Lovable / WordPress / Webflow / Next.js / Shopify / Squarespace / Wix / Framer / custom)
- **Rendering** (SSG / SSR / CSR / Hybrid)
- **Hosting** (Vercel / Netlify / SiteGround / Cloudflare / platform-native)
- **Repo** (GitHub URL or "no repo")
- **Publishing method** (`repo-commit` / `cms-paste` / `lovable-prompt` / `headless-api`)

## New-site standard (rare, but if it happens)

If a new website is built (not just managed):
- **Language:** TypeScript
- **Framework:** Next.js 15+ (App Router)
- **Rendering:** SSG via `output: 'export'`
- **Styling:** Tailwind CSS
- **Hosting:** Vercel (preferred) or Netlify
- **Content source:** flat TypeScript or Markdown files

**SSG constraints — do NOT break:**
- No `cookies()`, `headers()`, or `searchParams` in server components
- No `fetch(..., { cache: 'no-store' })` or `export const dynamic = 'force-dynamic'`
- No runtime API routes
- Dynamic routes (`[slug]`) must implement `generateStaticParams`
- All data fetched at build time

If a new site is built with **Lovable**, that's an explicit trade-off (CSR by default = structural SEO disadvantage).

---

# Using the Toolkit

The toolkit runs entirely inside Claude Code. There is no dev server, no build step, no deploy.

## First-time setup

1. **Open the toolkit** locally:
   ```
   cd ~/seo-toolkit
   ```
2. **Install script dependencies** (one-time, only if `package.json` exists):
   ```
   npm install
   ```
3. **Configure `.env`** at toolkit root:
   ```
   PEXELS_API_KEY=...
   UNSPLASH_API_KEY=...
   GOOGLE_PAGESPEED_API_KEY=...
   ```
4. **Open in Claude Code** (Anti-Gravity, terminal, or VS Code with Claude Code extension).

## Daily workflow

| Command | What it does |
|---------|-------------|
| `/blog` | Generate a new blog post for a chosen site |
| `/service` | Generate a service page (footprint-aware) |
| `/refresh` | Upgrade an existing blog post |
| `/audit` | Run a technical SEO audit |
| `/triage` | Score every site, recommend top 3 |

Each skill asks for any inputs not already in `site-info.md`.

## Adding a new managed site

1. Create the folder: `sites/[site-name]/`
2. Create `site-info.md` from the template — fill in basics, footprint, NAP, GSC/GA4 setup, voice override, publishing method, brand assets.
3. Add empty `keywords.csv`, `service-keywords.csv`, `used-keywords.md`, `notes.md`.
4. Run `/audit` on the site → records technical SEO baseline.
5. (Optional) Create `sites/[site-name]/references/` for voice override.
6. Verify foundational infrastructure (Section 9).

## Updating the toolkit itself

When you change `references/`, `on-page-seo.md`, `SEO_GUIDE.md`, `CLAUDE.md`, or any `SKILL.md`:
1. Edit the file.
2. Commit to the toolkit's GitHub repo.
3. Run a smoke test on a known-good site.
4. Don't claim "done" without the smoke test.

## Troubleshooting

- **Skill can't find a site** → check `sites/[site-name]/site-info.md` exists and the slug matches.
- **Skill refuses to ship** → it printed why. Fix and re-run.
- **Image fetch fails** → check `.env` for the API key.
- **Schema validation fails** → paste the error into the skill; it will fix and re-validate.

---

# File Structure

```
seo-toolkit/                          ← standalone private GitHub repo
│
├── CLAUDE.md                         ← this file
├── SEO_GUIDE.md                      ← canonical playbook
├── on-page-seo.md                    ← 80+ signal checklist
├── README.md
├── package.json                      ← only if scripts/ has deps
├── .env                              ← gitignored
├── .gitignore
│
├── references/                       ← default voice — fallback for all sites
│   ├── voice.md
│   ├── humour.md
│   ├── stats.md
│   ├── stories.md
│   └── opinions.md
│
├── .claude/
│   └── skills/
│       ├── blog/SKILL.md
│       ├── service/SKILL.md
│       ├── refresh/SKILL.md
│       ├── audit/SKILL.md
│       └── triage/SKILL.md
│
├── scripts/
│   ├── fetch-images.mjs
│   ├── validate-schema.mjs
│   └── lighthouse.mjs
│
└── sites/
    ├── site-a/
    │   ├── site-info.md
    │   ├── keywords.csv
    │   ├── service-keywords.csv
    │   ├── used-keywords.md
    │   ├── notes.md
    │   ├── references/               ← optional override
    │   └── _drafts/                  ← gitignored
    └── ... (one folder per site)
```

## Organization rules

1. **One file per concern.**
2. **No new top-level folders without asking.**
3. **Shared assets at toolkit root; per-site overrides under `sites/[name]/`.**
4. **`_drafts/` is gitignored.**
5. **`.env` is never committed.**
6. **Site folder slugs match GitHub repo slugs** when 1:1 mapping exists.

---

# Testing

Rule 4 covers ship validation for individual content drafts. This section covers everything else.

## Per-skill smoke tests

After any edit to a skill's `SKILL.md`:

| Skill | Smoke test |
|-------|-----------|
| `/blog` | Generate one short post (~800 words) on a non-priority site |
| `/service` | Generate one service page on a service-business site |
| `/refresh` | Refresh a known-stale post |
| `/audit` | Run on a site with a known issue |
| `/triage` | Run across all sites |

If any smoke test fails, the change is not "done."

## Per-site setup verification

After creating a new `sites/[name]/`:
- ✅ `site-info.md` exists and parses
- ✅ `keywords.csv` and `service-keywords.csv` exist
- ✅ `used-keywords.md` exists
- ✅ `notes.md` exists
- ✅ `/audit` runs end-to-end without errors
- ✅ Foundational infrastructure verified

## Cross-site sanity (run quarterly)

- ✅ All sites parse — `/triage` runs end-to-end.
- ✅ No primary keyword cannibalization across competing sites.
- ✅ All sites have `LocalBusiness` / `Organization` schema validating.
- ✅ All sites with GSC connected show < 5% URL coverage errors.

## Reference file changes

After editing `references/`:
- ✅ Regenerate one short piece of content on the affected scope.
- ✅ Compare against a recent prior output.
- ✅ If a per-site override is added, verify the resolution rule applies correctly.

## What "done" means

Never claim a change is done if:
- A smoke test failed.
- Schema validators report errors.
- The voice reads as AI on the regenerated sample.
- A required file is missing or malformed.
- A site flagged by `/triage` as priority hasn't been re-audited after a major change.

---

# Scope

Only build what's requested. If anything is unclear, ask before starting.

## Toolkit-specific scope boundaries

1. **Editing external site code.** The toolkit reads `site-info.md` and generates content. It does not modify the site's own repo, theme, plugins, CMS, or hosting unless explicitly told to push changes.

2. **Generating content for sites without `site-info.md`.** The skills refuse to run on a site folder missing `site-info.md`.

3. **Adding new managed sites.** The user explicitly creates new `sites/[name]/` folders. The toolkit doesn't auto-onboard.

4. **Modifying live infrastructure** (GSC properties, GA4, GBP, DNS, hosting). The toolkit guides the user; the user executes.

5. **Bulk operations across all sites without approval.** Running `/blog` 20 times across 20 sites in one session requires explicit approval.

6. **Spending money.** The toolkit doesn't sign up for paid tools. The user evaluates and pays separately.

7. **Refactoring the toolkit itself without explicit request.** Do exactly what's asked.

## When in doubt

Ask. The toolkit is opinionated about *how* SEO work happens, not about *what* gets done. The user always picks the priorities.
```

---

# Appendix C — Pre-Built Claude Code Skills

## C.1 `/blog` Skill (`.claude/skills/blog/SKILL.md`)

```markdown
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
- **Image source** — overrides the site's default.
- **Keyword tool** — overrides the site's default for any keyword research.
- **Length target** — bypasses the SERP-median-derived target.

## Workflow

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
- Otherwise: read `keywords.csv`, exclude any keyword in `used-keywords.md`, sort by opportunity score, pick top.
- Confirm choice with the user.

### Step 3 — Build the cluster

- 1 primary keyword + 4–8 supporting (2–3 secondary, 3–5 tertiary).
- Pull supporting keywords from the keyword tool (per `site-info.md` default or per-run override).
- Validate cluster: top 3 SERP results for primary should also rank for ≥ 60% of cluster terms.

### Step 4 — SERP analysis

1. Search Google (incognito, target region) for the primary keyword.
2. Identify top 3 organic results, skipping: Reddit, Quora, forums, YouTube, Wikipedia, paywalled, brand homepages, the site itself.
3. Extract: word count, H2/H3 outline, image count, FAQ questions, link patterns.
4. Calculate median word count + image count → target ±20%.
5. Identify 1–2 novel sections.
6. Check Perplexity + Google AI Overviews citations.

### Step 5 — Plan + approval

Present:
- Primary keyword + cluster
- Target word count + image count
- Proposed H1, H2 outline, FAQ questions
- Novel sections
- Image source for this run

Wait for approval.

### Step 6 — Generate the post

Apply in order:
1. **Voice** — resolved `references/`, anti-AI rules.
2. **Tier 1 on-page** — all 16 items.
3. **Cluster placement** — primary in title/H1/first 100 words/slug; secondary in H2s; tertiary in H3s, FAQ, body.
4. **One story max**, **one strong opinion max**.
5. **At least one "when NOT to use / hire us"** moment.
6. **3–5 internal links**.
7. **2–3 external links** to authoritative sources.
8. **FAQ section** — 4–8 Q+A.
9. **Author byline** with `Person` schema.
10. **Schema (JSON-LD)** — `BlogPosting` + `BreadcrumbList` + `FAQPage` + `Person`.
11. **Length** within ±20% of SERP median.
12. **TOC + jump links** if word count ≥ 1500.

### Step 7 — Fetch images

Per the chosen image source. Enforce WebP under 200 KB, hyphenated filenames, descriptive alt text, width/height, lazy loading on below-fold, eager + fetchpriority on hero.

### Step 8 — Validate (Rule 4)

- ✅ Tier 1 (16 items)
- ✅ Schema validators
- ✅ Voice anti-AI check
- ✅ Cadence
- ✅ Cannibalization
- ✅ Banned-words scan
- ✅ Lighthouse spot-check

If any check fails: refuse to ship, report what needs fixing.

### Step 9 — Ship per publishing method

Read `site-info.md` → Publishing method:
- **`repo-commit`** — write markdown/MDX, commit images, open PR. Output: PR URL.
- **`cms-paste`** — write to `_drafts/[slug]/post.md` + `meta.json`. Output: clipboard-ready content + image folder.
- **`lovable-prompt`** — generate Lovable-ready prompt. Output: paste-ready prompt.
- **`headless-api`** — push via API. Output: CMS draft URL.

### Step 10 — Update tracker

Append to `used-keywords.md`:
```markdown
| YYYY-MM-DD | [primary keyword] | Blog | [URL] | [cluster] |
```

### Step 11 — Report

Print summary: title, URL, word count, Tier 1 status, schema status, Lighthouse score, cluster, next action.

## Refusal conditions

- Site folder doesn't exist or `site-info.md` missing.
- Resolved `references/` is incomplete.
- `keywords.csv` is empty (and user didn't supply a keyword).
- Publishing this post would exceed cadence.
- Primary keyword already in `used-keywords.md`.
```

## C.2 `/service` Skill (`.claude/skills/service/SKILL.md`)

```markdown
---
name: service
description: Generate a service page (commercial-intent landing page) for a chosen managed site. Footprint-aware (single-location / multi-location / service-area / national-online), enforces anti-doorway-page rules, applies real NAP, includes mandatory conversion elements, validates schema. Use when the user types `/service` or asks for a service page.
---

# `/service` — Service page generator

Creates a production-ready service page for any service-business site managed in `sites/`.

## Refusal up front

If `sites/[site]/site-info.md` → `service-business: false`, the skill refuses to run.

## Inputs

Required:
- **Site** — must have `service-business: true`.
- **Service** — the service to feature.
- **Location** (conditional on footprint):
  - `single-location` → not asked.
  - `multi-location` → asked; must match a location in `site-info.md`.
  - `service-area` → asked; must be a city the business serves.
  - `national-online` → not asked.

Optional:
- **Primary keyword** — defaults from `service-keywords.csv`.
- **Image source** — overrides default.
- **Conversion template** — overrides default if `notes.md` documents a winner.

## Workflow

### Step 1 — Read context (Rule 1)
Same as `/blog` Step 1, plus `service-keywords.csv`.

### Step 2 — Confirm footprint + scope
- Read `site-info.md` → Geographic footprint.
- Confirm service + location combination is valid.

### Step 3 — Pick the keyword
- If user supplied → use it.
- Otherwise: highest-CPC commercial keyword from `service-keywords.csv` matching service + location, excluding `used-keywords.md`.

### Step 4 — Determine URL pattern

| Footprint | URL pattern |
|-----------|-------------|
| `single-location` | `/services/[service-slug]` |
| `multi-location` | `/locations/[city-slug]/[service-slug]` |
| `service-area` | `/services/[service-slug]-[city-slug]` |
| `national-online` | `/services/[service-slug]` |

### Step 5 — SERP analysis
Same as `/blog` Step 4. Service pages typically 1500+ words primary, 800+ city variants.

### Step 6 — Plan + approval
Present footprint + URL + slug + keyword + cluster + NAP + outline + FAQ + conversion elements + image source. Wait for approval.

### Step 7 — Generate the page

Apply in order:
1. **Voice** — biased toward conversion-driven copy.
2. **Tier 1 on-page** — all 16 items.
3. **Anti-doorway-page rules** (for `service-area`):
   - Unique 200+ word opening
   - Local landmarks/neighborhoods
   - 1–2 city-specific FAQs
   - Real local NAP (city-specific area code)
   - Real testimonials from that city
   - Different hero image
   - **If page can't pass all 6, refuse to publish.**
4. **NAP per footprint** (Section 4.3).
5. **Conversion elements** — every item from `on-page-seo.md` Category 14.
6. **Schema** — `Service` + `LocalBusiness` (per footprint) + `BreadcrumbList` + `FAQPage` + `Organization`.
7. **Length** — primary 1500+, city variants 800+.

### Step 8 — Fetch images
Hero must be unique per city for `service-area` zipper pages.

### Step 9 — Validate (Rule 4)
Same as `/blog` Step 8, plus:
- ✅ Anti-doorway-page rules
- ✅ NAP consistency
- ✅ All required `Service` schema properties
- ✅ Conversion elements all present

### Step 10 — Ship per publishing method
Same as `/blog` Step 9.

### Step 11 — Update tracker
Append to `used-keywords.md` with `Service` page type.

### Step 12 — Volume check
Check site's total service-page count vs. cap per footprint (Section 4.2).

## Refusal conditions

- `service-business: false`.
- Service or location not in `site-info.md`.
- Anti-doorway-page rules can't be satisfied.
- Volume cap would be exceeded.
```

## C.3 `/refresh` Skill (`.claude/skills/refresh/SKILL.md`)

```markdown
---
name: refresh
description: Upgrade an existing blog post — re-run SERP analysis against the current top 3, refresh stats from `stats.md`, fix any Tier 1 on-page SEO gaps, update internal links to recent content, refresh the `dateModified`. Preserves the original URL and primary keyword (no cannibalization). Use when the user types `/refresh` or asks to update an existing post.
---

# `/refresh` — Existing-post refresher

## Inputs

Required:
- **Site**.
- **Post URL** — the live URL to refresh.

Optional:
- **Refresh scope** — `light` / `medium` (default) / `heavy`.
- **Image source** — if scope includes image upgrades.

## Workflow

### Step 1 — Read context (Rule 1)
Same as `/blog` Step 1.

### Step 2 — Fetch the existing post
- For `repo-commit` sites: read source from the site's repo.
- For other methods: scrape the live URL.

Identify: current primary keyword, cluster, word count, image count, links, schema, dates.

### Step 3 — Run audit on the post

Score: Tier 1 status, schema status, voice status, stats freshness, internal/external links validity, length vs. current SERP top-3 median.

### Step 4 — Plan refresh + approval

- `light` → stats + internal links + `dateModified` only.
- `medium` → light + Tier 1 fixes + image upgrades.
- `heavy` → medium + section rewrites + new SERP analysis.

### Step 5 — Apply refresh

**Critical preservation rules:**
- ✅ Same URL slug — never change.
- ✅ Same canonical — preserved.
- ✅ Same primary keyword — never swap.
- ✅ `datePublished` unchanged; `dateModified` set to today.
- ✅ Author byline preserved unless explicitly asked to change.

### Step 6 — Validate (Rule 4)

Same as `/blog` Step 8, plus:
- ✅ No URL change
- ✅ No primary keyword swap

### Step 7 — Ship per publishing method
As an UPDATE to existing content.

### Step 8 — Update tracker
Find existing row in `used-keywords.md`; append "Last refreshed: YYYY-MM-DD". Don't add duplicate row.

### Step 9 — Report

What changed (light / medium / heavy), specific Tier 1 fixes, new internal links, stats refreshed (old → new), Lighthouse delta, reminder to request indexing in GSC.

## Refusal conditions

- Post URL doesn't resolve.
- Refresh would change the primary keyword.
- Refresh would change the URL slug.
```

## C.4 `/audit` Skill (`.claude/skills/audit/SKILL.md`)

```markdown
---
name: audit
description: Run a technical SEO audit on a chosen managed site — verifies all 8 non-negotiables, runs Lighthouse mobile, checks Core Web Vitals from GSC field data, validates schema, audits foundational infrastructure (GSC, GBP, GA4, GTM, BWT). Logs results to `sites/[name]/site-info.md`. Use when the user types `/audit` or after any major site change.
---

# `/audit` — Technical SEO auditor

## Inputs

Required:
- **Site**.

Optional:
- **Audit depth** — `quick` / `full` (default) / `deep`.

## Workflow

### Step 1 — Read context (Rule 1)
Plus fetch homepage HTML + 1 inner page.

### Step 2 — Audit the 8 non-negotiables

For each: Pass / Fail / Warning.

| # | Element | How |
|---|---------|-----|
| 1 | Sitemap | HTTP GET `/sitemap.xml`; parse XML |
| 2 | robots.txt | HTTP GET `/robots.txt` |
| 3 | Canonical | View source on homepage + 1 inner |
| 4 | OG images | Verify `og:image` exists + resolves + 1200×630 |
| 5 | Image dimensions | Verify `<img>` has width/height |
| 6 | Semantic HTML5 | Verify `<header>`, `<nav>`, `<main>`, `<footer>` |
| 7 | Mobile viewport | Verify `<meta name="viewport">` |
| 8 | HTTPS | Check scheme + mixed content |

### Step 3 — Lighthouse audit (mobile)
If `quick`: skip. Otherwise run on homepage + 1 representative inner page.

### Step 4 — GSC field data (Core Web Vitals)
Pull last 28 days; status per metric.

### Step 5 — Schema validation
Run on homepage + 1 blog + 1 service page.

### Step 6 — Foundational infrastructure
Verify GSC, GBP, GA4, GTM, BWT (where verifiable).

### Step 7 — AI search visibility
Top 3 keywords on Perplexity + Google AI Overviews.

### Step 8 — On-page audit of top 5 pages (deep scope only)

### Step 9 — Backlink baseline (deep scope only)

### Step 10 — Write results to `site-info.md`

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
- Performance: [N] | SEO: [N] | Accessibility: [N] | Best Practices: [N]
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

### AI search visibility (this audit)
- Perplexity: cited ✅/❌ for [keyword]
- Google AI Overviews: ✅/❌ for [keyword]
- ChatGPT: [manual check needed]
- Claude: [manual check needed]
```

### Step 11 — Generate priority fix list

- **Critical** — blocking indexation
- **High** — Tier 1 misses, schema errors, Performance < floor, GSC not verified
- **Medium** — non-Tier-1 misses, missing recommended schema, GBP not claimed
- **Low** — opportunities (Lighthouse below 100 but above floor)

## Refusal conditions

- Site folder or `site-info.md` missing.
- Live URL doesn't resolve.
```

## C.5 `/triage` Skill (`.claude/skills/triage/SKILL.md`)

```markdown
---
name: triage
description: Score every site in `sites/` by SEO opportunity and recommend the top 3 to focus investment on. Considers revenue potential, current authority, technical health, content gap, and conversion potential. Outputs a ranked list with rationale. Use when the user types `/triage` or asks "which sites should I focus on."
---

# `/triage` — Portfolio prioritization

## Inputs

Optional:
- **Time horizon** — `quarter` (default) / `month` / `year`.
- **Capacity** — number of sites the user can focus on (default: 3).
- **Filter** — limit to sites matching a tag in `notes.md`.

## Workflow

### Step 1 — Read context (Rule 1)
Load every `sites/[name]/site-info.md` and `notes.md`.

### Step 2 — Score each site on five dimensions

#### Dimension 1: Revenue potential (weight: 30%)
- 10 = real revenue source, money-keyword rankings would meaningfully grow income
- 7 = active business
- 4 = side project, lifestyle
- 1 = vanity site, internal tool

#### Dimension 2: Current authority (weight: 20%)
- 10 = > 10K monthly organic visits, DR > 40, indexed > 500 pages
- 7 = 1K–10K visits, DR 20–40, indexed 100–500
- 4 = 100–1K visits, DR < 20, indexed 20–100
- 1 = new site

#### Dimension 3: Technical health (weight: 15%)
- 10 = all 8 non-negotiables pass, Lighthouse mobile ≥ 90, no Tier 1 gaps
- 7 = minor fixes needed
- 4 = significant gaps (CSR Lovable site without prerender, missing schema)
- 1 = fundamentally broken

**Score 1 here → site jumps to "fix first" list regardless of other dimensions.**

#### Dimension 4: Content gap / opportunity (weight: 20%)
- 10 = strong keyword research done, clear content path
- 7 = some opportunity
- 4 = saturated niche
- 1 = no opportunity

#### Dimension 5: Conversion potential (weight: 15%)
- 10 = clear conversion path + tracking working
- 7 = partial setup
- 4 = weak CTAs, no tracking
- 1 = no conversion infrastructure

### Step 3 — Compute weighted score

`Total = (Revenue × 0.30) + (Authority × 0.20) + (Technical × 0.15) + (ContentGap × 0.20) + (Conversion × 0.15)`

### Step 4 — Apply filters and special rules

- **Critical technical issue (Dimension 3 = 1):** site jumps to top of "fix first" list.
- **Hard pause flag:** site removed from ranking.
- **Filter argument:** restrict to matching tag.

### Step 5 — Generate ranked list + rationale

```markdown
# Portfolio triage — [date]

**Capacity:** [N] sites | **Horizon:** [quarter/month/year]

## Fix-first (technical issues blocking content investment)

| Site | Score | Critical issue |
|------|-------|---------------|
| [name] | 1.0 (Dim 3) | [e.g., CSR Lovable site, no sitemap] |

## Top [N] for SEO investment this [horizon]

### 1. [site-name] — total score: [X.X]
- **Revenue potential:** [score]/10 — [rationale]
- **Authority:** [score]/10 — [details]
- **Technical:** [score]/10 — [audit summary]
- **Content gap:** [score]/10 — [keyword summary]
- **Conversion:** [score]/10 — [infrastructure status]
- **Recommended next 3 actions:** [bulleted, specific]

### 2. ... ### 3. ...

## Park (don't invest this [horizon])
[remaining sites with one-sentence reason]

## Suggested cadence across the top 3
- **Site 1:** [N posts/week + service pages + off-page actions]
- **Site 2:** [allocation]
- **Site 3:** [allocation]
```

### Step 6 — Save results
Write to `triage-[YYYY-MM-DD].md` at toolkit root. Don't overwrite previous triages.

### Step 7 — Quarterly re-run reminder
If most recent triage was > 90 days ago, flag this.

## Refusal conditions

- `sites/` folder is empty.
- All sites have `hard pause` flag.
```

---

**End of `SEO_GUIDE.md` — Existing Sites Edition**

> This guide is the canonical SEO playbook for the `seo-toolkit` repo. Every skill in `.claude/skills/` reads this document and the toolkit's `CLAUDE.md` before any action. Update both files together when the workflow changes.
