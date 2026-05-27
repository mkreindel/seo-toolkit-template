# Project Overview

**This is the SEO toolkit repo.** It is not a website — it is a Claude Code workspace that operates on multiple existing websites the user manages.

The toolkit applies a consistent SEO workflow across every managed site, regardless of platform (WordPress, Lovable, Webflow, Next.js, Shopify, custom, etc.). The websites themselves live in their own repos / hosting — this toolkit never touches their codebases unless explicitly told to push changes.

## What the toolkit does

| Skill | Purpose |
|-------|---------|
| `/blog` | Generate a long-form, SEO-optimized, voice-matched blog post for a chosen site |
| `/service` | Generate a service page (footprint-aware: single-location / multi-location / service-area / national-online) |
| `/refresh` | Upgrade an existing blog post — re-do SERP analysis, refresh stats, fix on-page gaps, update internal links |
| `/audit` | Run a technical SEO audit on a chosen site, log results to its `site-info.md` |
| `/triage` | Score every site in `sites/` by SEO opportunity, recommend top 3 to focus on |
| `/wireframe` | Produce a wireframe doc for a new page before content generation (mandatory pre-content step; invoked by `/blog` and `/service`) |
| `/cluster` | Plan a topic cluster (pillar + N cluster pages + internal-link graph + wireframes in one pass) |
| `/programmatic-batch` | Generate N service pages from a matrix CSV with anti-doorway-page enforcement |
| `/comparison` | Head-to-head "[X] vs [Y]" page generator |
| `/alternative` | "Alternatives to [X]" listicle generator |
| `/case-study` | Real-story client outcome page (pulls from `stories.md`, refuses if no eligible story) |
| `/pricing` | Transparent pricing page (refuses to invent if pricing data missing from `stats.md`) |
| `/integrations` | "[Site] + [Tool]" integration page |
| `/glossary` | Glossary entry or full index with DefinedTermSet schema |
| `/lovable-deploy` | Drive Lovable IDE round-trip via Chrome DevTools MCP |
| `/serp-features` | SERP feature gap analyzer (featured snippet, PAA, image pack, video, knowledge panel, AIO, local pack, sitelinks) |
| `/haro` | Daily journalist-query monitor (source-pluggable) |
| `/broken-backlinks` | Monthly broken-backlink reclamation finder |
| `/competitor-backlinks` | Monthly competitor backlink reverse-engineering |
| `/semrush-baseline` | Quarterly SEMrush snapshot |

## How it's organized

- **Toolkit root** — shared assets used across all sites:
  - `references/` → default voice (universal procedural rules)
  - `on-page-seo.md` → 80+ signal checklist
  - `.claude/skills/` → the 20+ skills above
  - `SEO_GUIDE.md` → the canonical playbook
  - `CLAUDE.md` → this file
- **`sites/[site-name]/`** — per-site folders, one per managed website:
  - `site-info.md` → URL, platform, footprint, NAP, GSC/GA4 setup, voice override flag, etc.
  - `keywords.csv` → informational keywords (for `/blog`)
  - `service-keywords.csv` → commercial keywords (for `/service`)
  - `used-keywords.md` → tracker preventing keyword cannibalization
  - `notes.md` → conversion winners, audit history, anything site-specific
  - `references/` (optional) → per-site voice override
  - `_drafts/[slug]/` → working drafts before publish (gitignored)

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

When writing **any blog post, service page, or customer-facing copy**, the skill resolves voice files in this order (BOTH apply, the per-site file CANNOT relax universal rules):

1. **`references/[file].md`** — universal procedural rules that apply to every site (banned words, anti-AI checks, structural requirements). NO persona content here.
2. **`sites/[site-name]/references/[file].md`** — the actual persona/numbers/stories/opinions for that site. **REQUIRED** for content skills to run.

The per-site file can ADD restrictions (more banned words, stricter humor, etc.) but cannot REMOVE universal rules.

## The five reference files

| File | Root has | Per-site has |
|------|---------|-------------|
| `voice.md` | Universal banned words, anti-AI checklist, structural rules | The persona, sentence rhythm, sample writing, brand-specific bans |
| `humour.md` | Universal hard bans (puns, sarcasm at reader, etc.), zero-humor contexts | The site's actual humor style or "none" |
| `stats.md` | Procedural rules (never round, never invent), required structure | Real numbers — pricing, response times, customer counts |
| `stories.md` | Procedural rules (one per post max, anonymize unless consented) | 5–10 real anecdotes from this business |
| `opinions.md` | Procedural rules (one per post max, must be backed by stat) | The site's actual hot takes |

## Universal voice rules (always apply, regardless of site)

- **Banned words/phrases:** "unlock", "leverage", "seamless", "world-class", "cutting-edge", "revolutionary", "in today's fast-paced world", "delve", "navigate the complexities of", exclamation marks, emojis. Per-site can ADD bans, never remove.
- **Open with the answer.** Add context after, not before.
- **Real numbers only** — pulled from the site's `stats.md`. Never round. If a needed stat isn't there, ask before fabricating.
- **One story per post max** — pulled from the site's `stories.md`. Never invent.
- **One strong opinion per post max** — pulled from the site's `opinions.md`. Must be backed by a number from `stats.md`.
- **Tell readers when NOT to hire / use the product.** Biggest single tell that this isn't AI slop.
- **Banned generic phrases** for endings: "In conclusion", "At the end of the day", "Hope this helps."

## Pre-ship anti-AI check

Before any draft ships, run the universal anti-AI checklist from `references/voice.md` → "Universal anti-AI checklist." Delete anything that matches. The `/blog` and `/service` skills run this check automatically and refuse to ship a draft that fails.

## When reference files are missing

- **Root `references/` (universal rules):** required — every file must exist. Without these, the skill has no anti-AI checklist to enforce.
- **Per-site `references/voice.md` and `stats.md`:** **required** for any site that runs `/blog`, `/service`, or `/refresh`. Skills refuse to run on a site missing these.
- **Per-site `references/stories.md`, `opinions.md`, `humour.md`:** optional. If missing, the skill ships content without stories/opinions/humor (more generic, but functional).

---

# Multilingual sites — fan-out everything when more than one language is declared

Some sites serve content in multiple languages. When a site is multilingual, **every page-generating skill produces a draft per language** and **every audit verifies hreflang reciprocity across them**. A "page" on a multilingual site is the *set* of language versions, not any single URL.

## How a site declares multilingual status

The site's `site-info.md` Languages section is the source of truth. Required fields when `Multilingual: true`:

```markdown
## Languages

- **Multilingual:** true
- **Primary language:** en
- **Declared languages:**
  | Code | Primary | URL pattern             | Hreflang code | Voice file              |
  |------|---------|-------------------------|---------------|-------------------------|
  | en   | yes     | `/[slug]`               | en            | `references/voice.en.md`|
  | es   | no      | `/es/[slug]`            | es            | `references/voice.es.md`|
- **x-default language:** en
- **Hreflang strategy:** path-prefix | subdomain | country-tld
- **Translation philosophy:** native rewrite | machine translation
```

A monolingual site uses `Multilingual: false` and the rest of the rules in this section don't apply.

## Universal multilingual rules

- **Native rewrite per language, not translation.** Each language's draft is written using that language's voice file (`voice.[lang].md`).
- **All canonical pages mirror across all languages by default.** Opt-out is per-page via explicit `languages: [en]` frontmatter, and the skill must confirm the opt-out before generating only one version.
- **URL pattern is read from `site-info.md`, not assumed.** Path-prefix (`/es/...`), subdomain (`es.example.com`), and country TLD (`example.es`) are all supported.
- **Hreflang link cluster on every page** — self-referencing, all sibling languages, x-default, reciprocal across all pages.
- **Schema `inLanguage`** matches `<html lang>` and the served language.
- **Visible navigation per language.** Headers/footers/dropdowns in each language must list every page that exists in that language.

## Per-language voice file resolution

1. Root `references/voice.md` — universal procedural rules. Language-agnostic.
2. Per-site `references/voice.[lang].md` — the persona / sample paragraphs / banned words for that site **in that language**. **REQUIRED** for every declared language.
3. Same pattern for `humour.[lang].md`, `stories.[lang].md`, `opinions.[lang].md`.
4. `stats.md` is shared across languages — numbers are universal.

**If a multilingual site is missing `voice.[lang].md` for any declared language, every page-generating skill refuses to run.**

## Hreflang link cluster

Every page on a multilingual site includes a `<link rel="alternate">` cluster in the head:

```html
<link rel="alternate" hreflang="en"        href="https://example.com/services/x" />
<link rel="alternate" hreflang="es"        href="https://example.com/es/services/x" />
<link rel="alternate" hreflang="x-default" href="https://example.com/services/x" />
```

Required:
- **Self-referencing** — the page links to itself with its own language code.
- **All sibling languages** — every other declared language gets a link.
- **x-default** — points to the primary language version. Always present.
- **Reciprocal** — if EN links to ES, ES must link back to EN. Asymmetric hreflang is invalid.

---

# Keyword research — applies to every keyword, every cluster, every commercial site

The full methodology lives in `SEO_GUIDE.md` Section 2. The three rules every skill enforces:

## Rule: one page = one search intent

Every page on every managed site targets exactly one search intent (informational OR commercial — never both, never two of either). Two keywords sit on the same page only when their SERPs overlap.

## Rule: cluster validity is verified by SERP comparison

Before adding any keyword to a cluster, run the SERP-comparison test (`SEO_GUIDE.md` Section 2.4):

1. Search both keywords incognito in the target region.
2. Count shared URLs in the top 10.
3. **≥ 4 shared** → cluster (same page). **2–3 shared** → borderline. **≤ 1 shared** → split (different pages).

Wording similarity doesn't determine grouping; SERPs do.

## Rule: service-business sites with > 3 commercial keywords require an `architecture.md`

Any site with `service-business: true` AND more than 3 rows in `service-keywords.csv` needs `sites/[name]/architecture.md` (`SEO_GUIDE.md` Section 2.6). Template at `templates/architecture.md`.

## Rule: wireframe before content

Every new page goes through `/wireframe` first. Skills enforce this:
- `/blog` Step 4.5 — generate wireframe, get user approval, then content
- `/service` Step 5.5 — same

The wireframe lives at `sites/[site]/_drafts/[slug]/wireframe.md`.

## Rule: catalog footprint sites use hierarchical URLs

Sites declared with `catalog` footprint follow `/[category]/[subcategory]/[product-or-page]/`. Flat URL patterns (`/services/[name]`) are reserved for non-catalog footprints.

---

# On-page SEO — applies to every page generated by every skill

Read `on-page-seo.md` at the toolkit root. Every item applicable to the page type must be satisfied.

## Tier 1 (non-negotiable on every page)

These 16 items must pass before any draft ships. Skills validate Tier 1 automatically:

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
11. **Schema (JSON-LD)** per page type
12. **FAQ section** with `FAQPage` schema (4–8 Q+A on every blog post + service page)
13. **Author byline + bio** with `Person` schema (blog posts, IFF site policy allows person-author)
14. **Mobile-friendly** — responsive, 16px+ body font, 48×48px touch targets
15. **Loads fast** — Lighthouse mobile ≥ 90 performance, LCP < 2.5s, CLS < 0.1, INP < 200ms
16. **Semantic HTML5**

## Schema validation (mandatory)

Before any page ships, the skill runs both validators:
- **Google Rich Results Test** ([search.google.com/test/rich-results](https://search.google.com/test/rich-results))
- **Schema.org Validator** ([validator.schema.org](https://validator.schema.org))

Schema content (FAQ Q+A, breadcrumb labels) must match the visible page exactly.

---

# Technical SEO — applies to every site

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

**Core Web Vitals (hard targets — real ranking signals from field data):**

| Metric | Target |
|--------|--------|
| LCP (Largest Contentful Paint) | < 2.5s |
| INP (Interaction to Next Paint) | < 200ms |
| CLS (Cumulative Layout Shift) | < 0.1 |

**Lighthouse mobile (lab tests):**
- **Stretch goal: 100 across all four** — Performance, SEO, Accessibility, Best Practices.
- **Realistic floors:** see `SEO_GUIDE.md` Section 6.2.

---

# Design — for content the toolkit generates

The toolkit itself has no UI. But the content it generates renders on each site.

## Universal rules

- **No emoji icons** in body copy, headings, CTAs, or UI elements. Emoji are an AI-content tell. Use real icon sets (Lucide, Heroicons, Phosphor) or no icons at all.
- **No generic gradients** (purple-to-pink, blue-to-cyan). If gradients are used, they must come from the site's documented brand palette.
- **No inline styles** in generated HTML.
- **Subtle animations only** — fade-ins, gentle reveals. Meets `prefers-reduced-motion`.
- **Mobile-first sizing** — body 16px+, touch targets 48×48px+.
- **Dark-mode contrast non-negotiable** — every interactive element passes WCAG AA contrast (4.5:1) in BOTH light and dark mode.

## Per-site brand override

Each site has its own brand. Record visual rules in `sites/[site-name]/site-info.md` under "Brand assets location":
- **Accent color** (single primary brand color, hex)
- **Typography** (heading font + body font)
- **Logo location** (URL or path)
- **Image style** (photographic / illustrated / hand-drawn / mixed)
- **Existing component library**

---

# Development Rules

## Rule 1: Always read first

Before any action, read in this order:

1. **`CLAUDE.md`** (this file)
2. **`SEO_GUIDE.md`**
3. **`on-page-seo.md`**
4. **`sites/[site-name]/site-info.md`**
5. **Resolved `references/`** — root files + per-site overrides if present
6. **`sites/[site-name]/keywords.csv`** + **`service-keywords.csv`** + **`used-keywords.md`**
7. **`sites/[site-name]/architecture.md`** — when generating commercial pages on a service-business site
8. **`sites/[site-name]/notes.md`**

## Rule 2: Define before you build

For any non-trivial action:
1. Write the plan to a temporary draft (or state inline if short).
2. Show the plan to the user.
3. Wait for approval before generating final output.

## Rule 3: Look before you create

Before creating any new file or content:
1. Check if it already exists (search `_drafts/`, the live site URL, GSC, `used-keywords.md`).
2. If it exists, edit / refresh it. Don't duplicate.
3. If it doesn't exist, create it.

## Rule 4: Validate before you ship

Before any draft is marked complete:
- ✅ **Tier 1 on-page check** — all 16 items pass.
- ✅ **Schema validation** — both Google Rich Results Test and Schema.org Validator pass.
- ✅ **Voice anti-AI check** — re-read resolved `voice.md` and delete matches.
- ✅ **Cadence check** — verify the publish wouldn't exceed `site-info.md` → Content cadence.
- ✅ **Cannibalization check** — primary keyword not already in `used-keywords.md`.
- ✅ **Lighthouse spot-check** — for `repo-commit` sites, run mobile Lighthouse on the staged URL.

If any check fails, the skill **refuses to ship** and reports what needs fixing.

## Core Rule: Do exactly what is asked

Nothing more, nothing less. If anything is unclear, ask before starting.

---

# Tech Stack

## Toolkit itself

| Layer | What it uses |
|-------|-------------|
| **Format** | Markdown for guides, references, site-info, notes; CSV for keyword lists; YAML/Markdown frontmatter inside `SKILL.md` files |
| **Scripts** | TypeScript (`.mjs`) in `scripts/`. Run via `node` or `tsx`. |
| **APIs (optional)** | Pexels, Unsplash, PageSpeed Insights, GSC OAuth, SEMrush, GBP, GA4. Keys in `.env`. |
| **Runtime** | Local Mac/Linux/Windows (Claude Code). |
| **Version control** | Private or public GitHub repo. |

## Per-site stacks

Each managed site runs on its own platform. The toolkit adapts based on `sites/[site-name]/site-info.md`:
- **Platform** (Lovable / WordPress / Webflow / Next.js / Shopify / Squarespace / Wix / Framer / custom)
- **Rendering** (SSG / SSR / CSR / Hybrid)
- **Hosting** (Vercel / Netlify / SiteGround / Cloudflare / platform-native)
- **Repo** (GitHub URL or "no repo")
- **Publishing method** (`repo-commit` / `cms-paste` / `lovable-prompt` / `headless-api`)

---

# Using the Toolkit

The toolkit runs entirely inside Claude Code. There is no dev server, no build step, no deploy.

## First-time setup

1. Clone or download the toolkit.
2. Install script dependencies (one-time):
   ```bash
   npm install
   ```
3. Configure `.env` at toolkit root from `.env.example`. Fill in API keys for the integrations you want.
4. Open in Claude Code.

## Daily workflow

Invoke any of the 20+ skills via `/skill-name`. Each skill asks for any inputs not already in `site-info.md`.

## Adding a new managed site

```bash
cp -r templates/new-site sites/[site-name]
```

Then fill in the `{TODO}` markers in each file, especially `site-info.md`. Run `/audit` on the site to record its baseline. See `templates/new-site/README.md` for the full checklist.

## Updating the toolkit itself

When you change `references/`, `on-page-seo.md`, `SEO_GUIDE.md`, `CLAUDE.md`, or any `SKILL.md`:
1. Edit the file.
2. Run a smoke test on a known-good site (regenerate one short piece of content).
3. Don't claim "done" without the smoke test.

---

# File Structure

```
seo-toolkit/                          ← top of the workspace
│
├── CLAUDE.md                         ← this file
├── SEO_GUIDE.md                      ← canonical playbook
├── WORKFLOWS.md                      ← cross-site platform patterns
├── on-page-seo.md                    ← 80+ signal checklist
├── README.md
├── package.json
├── .env                              ← gitignored
├── .gitignore
│
├── references/                       ← default voice — universal rules
│   ├── voice.md
│   ├── humour.md
│   ├── stats.md
│   ├── stories.md
│   └── opinions.md
│
├── .claude/
│   └── skills/                       ← 20+ skill definitions
│
├── scripts/                          ← helper scripts + cron-fired routines
│
├── templates/
│   ├── new-site/                     ← skeleton for adding new sites
│   ├── architecture.md               ← transactional SEO architecture template
│   ├── outreach/                     ← outreach email templates
│   └── programmatic/                 ← matrix-driven batch template
│
└── sites/
    └── [site-name]/                  ← one folder per managed site (you create these)
        ├── site-info.md
        ├── keywords.csv
        ├── service-keywords.csv
        ├── used-keywords.md
        ├── notes.md
        ├── references/               ← per-site voice override (optional)
        └── _drafts/                  ← gitignored
```

## Organization rules

1. **One file per concern.**
2. **No new top-level folders without asking.**
3. **Shared assets at toolkit root; per-site overrides under `sites/[name]/`.**
4. **`_drafts/` is gitignored.**
5. **`.env` is never committed.**

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

## Per-site setup verification

After creating a new `sites/[name]/`:
- ✅ `site-info.md` exists and parses
- ✅ `keywords.csv` and `service-keywords.csv` exist
- ✅ `used-keywords.md` exists
- ✅ `notes.md` exists
- ✅ `/audit` runs end-to-end without errors

## What "done" means

Never claim a change is done if:
- A smoke test failed.
- Schema validators report errors.
- The voice reads as AI on the regenerated sample.
- A required file is missing or malformed.

---

# Scope

Only build what's requested. If anything is unclear, ask before starting.

## Toolkit-specific scope boundaries

1. **Editing external site code.** The toolkit reads `site-info.md` and generates content. It does not modify the site's own repo, theme, plugins, CMS, or hosting unless explicitly told to push changes.
2. **Generating content for sites without `site-info.md`.** The skills refuse to run on a site folder missing `site-info.md`.
3. **Modifying live infrastructure** (GSC properties, GA4, GBP, DNS, hosting). The toolkit guides the user; the user executes.
4. **Bulk operations across all sites without approval.** Running `/blog` 20 times across 20 sites in one session requires explicit approval.
5. **Spending money.** The toolkit doesn't sign up for paid tools. The user evaluates and pays separately.
6. **Refactoring the toolkit itself without explicit request.** Do exactly what's asked.

## When in doubt

Ask. The toolkit is opinionated about *how* SEO work happens, not about *what* gets done. The user always picks the priorities.
