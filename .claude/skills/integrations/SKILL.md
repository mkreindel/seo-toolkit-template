---
name: integrations
description: Generate an integration page documenting how the site's product/service connects to a named third-party tool ("[Site] + [Tool]" or "[Site] [Tool] integration"). Captures decision-stage searchers verifying compatibility before purchase ("does [site] work with [tool]?"). Pulls real integration details from `site-info.md` or supplied integration dossier — refuses to invent integration capabilities. Satisfies Tier 1 on-page SEO, validates schema, and ships per the site's publishing method. Use when the user types `/integrations` or asks for an integration page.
---

# `/integrations` — Third-party integration page generator

Integration pages capture a narrow but high-converting search behavior: prospects who already want the site's product but need to verify it plays nicely with their existing stack. These pages also stack topical authority — a SaaS with 50 integration pages outranks one with 0 even if the underlying product is identical.

This skill is most useful for SaaS, API products, and developer tools. Service businesses (consulting, catering, medical) rarely need integration pages — the skill flags this at start.

## Inputs

Required (asked at start if not given):
- **Site** — must match a folder under `sites/[name]/`. Must have `product_type=saas` or `product_type=api` in `site-info.md`.
- **Integration target** — the named tool (Salesforce, HubSpot, Zapier, Slack, Notion, etc.).

Optional (per-run overrides):
- **Integration type** — `native` (built-in feature) | `via-zapier` (no-code middleware) | `via-api` (custom API connection) | `via-webhook` (event-driven). Defaults to reading from site's integrations registry in `site-info.md`.
- **Verified by** — `engineering` (defaults — implies actual integration code exists) | `roadmap` (planned but not shipped — flagged on page). Skill refuses if undeclared.

## Workflow

This skill follows `/service`'s workflow (Steps 0–11) with the page-type-specific differences listed below. Read `.claude/skills/service/SKILL.md` end-to-end before running.

### What's unique to `/integrations`

**Step 0 — Product-type guard:** if `site-info.md` does not declare `product_type=saas` or `product_type=api`, the skill warns and asks for confirmation. Service-business sites rarely benefit from integration pages.

**Step 2 — Keyword selection:**
- Common forms: `[Site] [Tool] integration`, `[Site] + [Tool]`, `does [Site] work with [Tool]?`, `connect [Site] to [Tool]`.
- Pick from `service-keywords.csv` rows with intent=`integration`. If none exist, add one before proceeding.

**Step 4 — SERP analysis (integration-specific):**
- Top 3 results — these are often the target tool's own integration directory (Zapier's Salesforce page, HubSpot's marketplace). Hard to beat for the exact query. Aim to rank for the long-tail variant ("does [Site] sync [field] to [Tool]?") rather than the head term.
- Extract: do the top results show real screenshots? Real config steps? Real field-mapping tables? Most do — match or exceed.

**Step 5 — Integration data gathering:**
- Required from engineering (or `site-info.md` integrations registry):
  1. What data flows (fields, frequency, direction — one-way vs two-way sync)
  2. Configuration steps (numbered, from zero to working)
  3. Authentication method (OAuth, API key, webhook URL)
  4. Known limitations (rate limits, unsupported fields, edge cases)
  5. Pricing implications (does this integration cost extra? require a higher plan?)

If ANY of the 5 is missing from documented sources, refuse — integration pages that fudge details rank temporarily but get rebuked in reviews and damage trust.

**Step 6 — Wireframe (integration-specific):**
- **Hero:** "Connect [Site] to [Tool] in [time-estimate] minutes" or "[Site] + [Tool]: the [primary-use-case] integration"
- **Quick answer (above fold):** 2-sentence summary — "What syncs: [primary-fields]. How: [native | Zapier | API]. Time to set up: [minutes]."
- **Use cases section** (3–5 named scenarios): each 80–150 words. "If you're a [role] in [team-type], here's what this unlocks for [workflow]."
- **Data flow diagram or table** (required): which fields move in which direction, at what frequency, under what trigger. Visual or table — pick based on complexity.
- **Configuration steps** (numbered, screenshots): the actual zero-to-working setup. This is the section that wins the SERP — most integration pages skip the real steps.
- **Limitations section** (required, not optional): rate limits, unsupported fields, gotchas. Trust signal.
- **Pricing note** (if applicable): "This integration is included in [plan]" or "Requires [plan] starting at $X."
- **FAQ:** 5–8 Qs — "Is this real-time or batch?", "Does it support [edge-case-field]?", "Can I customize the mapping?", "What if my [Tool] account uses [variant]?"
- **CTA:** "Start a free trial" (for SaaS) or "Try the integration" (API products).

**Step 7 — Schema (integration-specific):**
- `Service` with `serviceType: "Software integration"` and `provider: [our org]`
- `mentions` for the integrated tool's organization (e.g., `{@type: SoftwareApplication, name: "Salesforce"}`)
- `HowTo` schema for the configuration steps (each step as a `HowToStep`)
- `FAQPage`
- `BreadcrumbList`

**Step 8 — Voice (integration-specific extras):**
- Every claim about the integration's capabilities MUST be in `site-info.md` integrations registry or in supplied dossier. No "we plan to" implied as "we have."
- If integration is `verified-by=roadmap`, the page MUST show a banner: "This integration is on our roadmap. Estimated availability: [date]." Page can still exist for SEO capture, but the banner is non-removable.
- One opinion max — usually "[Use case] is where this integration matters most" backed by usage data from stats.md.
- AI-search rules: Q+A density critical — integration questions are heavily LLM-cited ("does Acme work with Salesforce?" is a common LLM-mediated query).

## Refusal conditions

This skill refuses to ship if:
- Site is not `product_type=saas` or `product_type=api`.
- Any of the 5 required integration data points is undocumented.
- Integration is `verified-by=roadmap` but the date estimate is missing.
- An integration page for this tool already exists in `used-keywords.md` (refresh via `/refresh`).

## Output

Standard `_drafts/[slug]/` layout. Slug pattern: `integrations/{tool-slug}` (path-based to support the multi-page integration directory pattern).

Length target: 800–1,800 words. Integration pages skew shorter than blog posts — readers want config and limitations, not narrative.

## Routine versioning + idempotency contract

Same as `/service`. Idempotency key: `(site, tool-slug, language)`. Integration pages auto-decay — refresh quarterly when the integration registry version-bumps.
