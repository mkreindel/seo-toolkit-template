# SEO Toolkit (Template)

A Claude Code workspace for running consistent, high-quality SEO across multiple existing websites — without touching any single site's codebase unless explicitly told to. Methodology + automation kit for an operator who manages a portfolio of sites (their own product, client work, side projects).

> **This is a public template.** All personal/specific data (real site names, owner names, API keys, business secrets, GA4/GBP IDs, phone numbers, etc.) has been stripped. Folder examples use placeholder slugs `site-a`, `site-b`, `site-c`. Replace them with your own once you fork/clone.

---

## What this is

A Claude Code project (a directory of markdown files + skills + scripts) that, when opened in [Claude Code](https://docs.claude.com/en/docs/claude-code/overview), gives you 20+ slash-command skills for SEO work:

| Command | What it does |
|---------|-------------|
| `/blog` | Generate a long-form, SEO-optimized, voice-matched blog post for a chosen site |
| `/service` | Generate a service page (footprint-aware: single-location / multi-location / service-area / national-online) |
| `/refresh` | Upgrade an existing post — re-do SERP analysis, refresh stats, fix on-page gaps |
| `/audit` | Run a technical SEO audit on a chosen site |
| `/triage` | Score every site and recommend top 3 to focus on |
| `/wireframe` | Wireframe doc for a new page before content (mandatory pre-content step) |
| `/cluster` | Plan a topic cluster (pillar + N cluster pages + internal-link graph) |
| `/programmatic-batch` | Generate N service pages from a matrix CSV (services × cities, etc.) |
| `/comparison` | Head-to-head "[X] vs [Y]" comparison page |
| `/alternative` | "Alternatives to [X]" listicle page |
| `/case-study` | Client outcome page anchored on a real story from `stories.md` |
| `/pricing` | Transparent pricing page (refuses to invent if pricing data missing) |
| `/integrations` | "[Site] + [Tool]" integration page (SaaS / API products) |
| `/glossary` | Glossary entry or full glossary index with DefinedTermSet schema |
| `/lovable-deploy` | Drive Lovable IDE round-trip via Chrome DevTools MCP |
| `/serp-features` | Detect SERP-feature gaps (featured snippet, PAA, image pack, video, etc.) |
| `/haro` | Daily journalist-query monitor (Featured.com, Source of Sources, Qwoted, etc.) |
| `/broken-backlinks` | Monthly broken-backlink reclamation finder |
| `/competitor-backlinks` | Monthly competitor backlink reverse-engineering |
| `/semrush-baseline` | Quarterly SEMrush snapshot (DA, traffic, keywords, competitors) |

Each skill enforces the 8 technical SEO non-negotiables (see `SEO_GUIDE.md` § 6), validates schema (Google Rich Results + Schema.org), runs the universal anti-AI voice check, and refuses to ship a draft that fails Tier 1 on-page SEO. Schema validation + voice gating are mandatory pre-ship checks — not optional.

---

## Who it's for

- **SEO consultants and agencies** managing a portfolio of client sites who want consistent process across all of them.
- **Founders running multiple side projects** that all need SEO discipline without each becoming a full-time job.
- **In-house SEOs** at companies with multiple brand properties or sub-brands.

Not for: a single-site setup (overkill); pure technical SEO audits without content generation (the toolkit is content-centric); fully agency-services workflows (it's a builder kit, not a client-deliverable kit).

---

## Quick start

```bash
git clone <this-repo-url> seo-toolkit
cd seo-toolkit
npm install
cp .env.example .env             # then fill in real API keys
```

Open the folder in Claude Code, then invoke any skill via `/skill-name`.

### Adding your first site

```bash
cp -r templates/new-site sites/my-site-slug
```

Then fill in the `{TODO}` markers in `sites/my-site-slug/site-info.md`. Suggested order:

1. **Basics** (URL, platform, footprint, NAP) → live-verify what you can
2. **SEO baseline** (GSC, GA4, GTM, GBP) → screenshot-verify connection states
3. **Keywords/competitors** → seed from SEMrush Position Tracking or GSC top-queries
4. **Voice files** (`sites/my-site-slug/references/voice.md` + companions) → the actual persona

Run `/audit my-site-slug` to record a baseline. See `templates/new-site/README.md` for the full onboarding checklist.

---

## Where to find what

| Path | Purpose |
|---|---|
| **`SEO_GUIDE.md`** | The canonical playbook. Read this first. |
| **`CLAUDE.md`** | System rules every skill follows. |
| **`WORKFLOWS.md`** | Cross-site platform patterns (Lovable, GSC, Vercel, Chrome MCP, API credentials). |
| **`on-page-seo.md`** | 80+ on-page SEO signal checklist. |
| **`references/`** | Universal voice rules (banned words, anti-AI checklist). Per-site overrides go in `sites/{name}/references/`. |
| **`.claude/skills/`** | The 20+ skill definitions. |
| **`scripts/`** | Helper scripts (image fetching, schema validation, Lighthouse, API auth smoke test, SEMrush polling, GSC coverage, etc.). |
| **`templates/new-site/`** | Skeleton for adding new managed sites. |
| **`templates/outreach/`** | Outreach email templates (HARO, broken-link, resource-page, guest-post, expert-quote, contributor-recruitment). |
| **`templates/programmatic/`** | Matrix-driven service page batch template. |
| **`sites/{name}/`** | One folder per managed website (you create these as you go). |

---

## What's NOT in this template

- **No real site data.** All `sites/` are empty. You fill them as you onboard.
- **No API keys or secrets.** `.env.example` has placeholders only.
- **No design docs or implementation plans.** The original toolkit had a multi-month internal architecture roadmap (`docs/specs/` + `docs/plans/`) that's portfolio-specific — those didn't ship in the template. The implementation lives in the skills + scripts.
- **No commit/work history.** This is a fresh starting point, not a fork of a maintained repo.

If you want the implementation reasoning behind why a skill or rule exists, the SKILL.md files and `SEO_GUIDE.md` both reference *why* — not just *what*.

---

## Required APIs (mostly optional but boosting)

The skills work with no API keys at all (Claude Code does the heavy LLM lifting), but several scripts unlock more if configured. See `.env.example` for the full list. Minimum useful set:

| Key | What it unlocks | Free tier? |
|---|---|---|
| `PEXELS_API_KEY` or `UNSPLASH_API_KEY` | Image fetching for `/blog` posts | Yes |
| `GOOGLE_PAGESPEED_API_KEY` | Mobile Lighthouse + Core Web Vitals checks | Yes |
| `GSC_OAUTH_*` (Search Console) | Indexation coverage + top-query polling | Yes |
| `SEMRUSH_API_KEY` | Position tracking + backlink + competitor data | No (paid) |
| `GBP_OAUTH_*` (Google Business Profile) | Reviews polling | Yes |
| `GA4_SERVICE_ACCOUNT_JSON_PATH` | GA4 anomaly detection | Yes |

You can use the toolkit without any of these — most skills work fine without external APIs. They just light up additional cron-fired routines (see the `--cron` flag pattern in `WORKFLOWS.md`).

---

## Philosophy

This toolkit is opinionated. The opinions are:

1. **Voice matters more than volume.** Every page passes a universal anti-AI voice check (`references/voice.md`) — banned words ("unlock", "leverage", "seamless"), structural rules (open with the answer, never exclamation marks), real numbers over rounded estimates. The "Tell readers when NOT to hire/use the product" pattern is the single biggest tell that copy isn't AI slop.
2. **One page = one search intent.** Cannibalization gets caught at the planning stage (cluster validity verified by SERP overlap test), not after publishing. `used-keywords.md` is the safety net.
3. **Schema validation is non-negotiable.** Every shipped page passes Google Rich Results Test + Schema.org Validator. The skill refuses to ship if either fails.
4. **Wireframe before content.** Every new page goes through `/wireframe` first. Writing content first and re-engineering the page around it produces inconsistent internal linking + forgotten conversion elements.
5. **Per-platform implementation, universal methodology.** The skills work whether the site is on WordPress, Lovable, Webflow, Next.js, Shopify, or custom. The `publishing-method` field in `site-info.md` adapts the output format (`repo-commit` / `cms-paste` / `lovable-prompt` / `headless-api`).
6. **Cruise control is a layered cron system, not a single agent.** Daily/weekly/monthly/quarterly routines automate the boring parts (audits, polling, anomaly detection). See `scripts/sync-schedules.mjs` for the cron-config pattern.

If you disagree with any of these, fork it and change them — they're explicit so you know what to change.

---

## License

MIT. See `LICENSE`.

---

## Credits

Built originally as an internal toolkit for a Houston-based AI consulting practice managing a portfolio of bilingual SMB sites. Released as a public template after the methodology stabilized across multiple production deployments. Customize freely.
