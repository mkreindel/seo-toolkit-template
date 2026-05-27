---
name: service
description: Generate a service page (commercial-intent landing page) for a chosen managed site. Footprint-aware (single-location / multi-location / service-area / national-online), enforces anti-doorway-page rules, applies real NAP per Section 4.3 of SEO_GUIDE.md, includes mandatory conversion elements per Section 4.4, validates schema. Use when the user types `/service` or asks for a service page.
---

# `/service` — Service page generator

Creates a production-ready service page for any service-business site managed in `sites/`.

## Refusal up front

If `sites/[site]/site-info.md` → Business → `Service business: false`, the skill refuses to run and points the user to: "Use `/blog` for informational content, or generate a custom landing page outside the toolkit. Service pages are scoped to service businesses only."

## Inputs

Required (asked at start if not given):
- **Site** — must match a folder under `sites/[name]/` and have `service-business: true`.
- **Service** — the service to feature (e.g., "Emergency Plumbing", "Dental Implants", "AI Consulting").
- **Location** (conditional on footprint):
  - `single-location` → not asked; uses the one location in `site-info.md`.
  - `multi-location` → asked; must match a location in `site-info.md`.
  - `service-area` → asked; must be a city the business actually serves (per `site-info.md`).
  - `national-online` → not asked; no city.

Optional (per-run overrides):
- **Primary keyword** — defaults to picked-from-`service-keywords.csv` matching `[service] [city]`.
- **Image source** — overrides default.
- **Conversion template** — overrides default if `notes.md` documents a conversion winner.

## Workflow

### Step 0 — Cron-mode detection (if invoked with `--cron`)

If the invocation contains `--cron`, this skill runs in cron mode (no user available). Required behavior:

1. **Idempotency check:** see this skill's "Routine versioning + idempotency contract" section. If today's output already exists, exit cleanly with `exit: "idempotent-skip"`. Write one line to the audit log via `scripts/lib/audit-log.mjs` `appendRun({ exit: "idempotent-skip", ... })`.

2. **Escalation contract:** any decision that would normally prompt the user (missing required file, voice anti-AI failure, schema validation failure, keyword cannibalization, etc.) MUST be escalated by writing an item to `sites/{site}/_inbox/` via `scripts/lib/cron-mode.mjs` `writeInboxItem(...)`. After writing, exit cleanly with `exit: "escalated"`. Do NOT use `AskUserQuestion` in cron mode.

3. **Defaults:** when a choice would normally be asked, default to `site-info.md` / `goals.md` values. If both are silent on the required choice, escalate per (2).

4. **Audit log:** ALWAYS write one line to the audit log on exit — success (`shipped`), escalation (`escalated`), idempotent skip (`idempotent-skip`), or failure (`failed`).

5. **Backoff:** at the start of every cron-mode run, call `checkBackoff({ routine })` from `scripts/lib/audit-log.mjs`. If true, the routine has hit the 3-strike threshold — write `_inbox/routine-disabled-{name}.md`, run `scripts/sync-schedules.mjs --pause-routine={name}`, and exit.

### Step 1 — Read context (Rule 1)

Same as `/blog` Step 1, plus `sites/[site]/service-keywords.csv` and (if present) `sites/[site]/architecture.md`.

### Step 1.5 — Architecture check (`SEO_GUIDE.md` Section 2.6)

Count rows in `service-keywords.csv`. If **> 3** commercial keywords AND `architecture.md` is missing:

- Refuse to ship a new service page until `architecture.md` exists.
- Output: "This site has [N] commercial keywords but no `architecture.md`. Service pages need a planned hierarchy at this volume to avoid sprawl. Use `templates/architecture.md` as the starting point. Would you like me to draft the architecture from `service-keywords.csv` now? (yes/no/skip-this-once-with-reason)"
- If user picks "skip-this-once-with-reason" → require an explicit reason recorded in `notes.md`, then continue. The next `/service` run on this site re-prompts.

If `architecture.md` exists, the new page must already be planned in it OR the user must add the row to the architecture before generating. Off-architecture pages are how sites accumulate cannibalizing service pages.

### Step 2 — Confirm footprint + scope

- Read `site-info.md` → Geographic footprint.
- Confirm service + location combination is valid:
  - `single-location` → service from `site-info.md` services list.
  - `multi-location` → service available at that location.
  - `service-area` → the city is in the service area list AND the service is offered.
  - `national-online` → service from `site-info.md` services list, no city.
- If invalid, ask user before proceeding.

### Step 3 — Pick the keyword

- If user supplied → use it.
- Otherwise: pick the highest-CPC commercial keyword from `service-keywords.csv` matching the service + location, excluding any in `used-keywords.md`.
- **Seasonality check (soft) — `SEO_GUIDE.md` Section 2.5.** If the picked keyword has `peak_months` and/or `seasonality` populated and today is out of the peak window for a `seasonal` / `holiday-spike` term, OR `seasonality = declining`, flag and ask before proceeding (same prompt format as `/blog` Step 2). Service pages in particular benefit from being live ~3 months before peak demand to give Google time to index and rank. Soft only — never refuse on seasonality alone.
- **Architecture-fit check.** If `architecture.md` exists, confirm this keyword has a planned row in it. If not, ask the user to add it to the architecture before generating (a one-line append, then continue).

### Step 4 — Determine URL pattern (Section 4.1 of SEO_GUIDE.md)

| Footprint | URL pattern |
|-----------|-------------|
| `single-location` | `/services/[service-slug]` |
| `multi-location` | `/locations/[city-slug]/[service-slug]` (or `/services/[service-slug]/[city-slug]`) |
| `service-area` | `/services/[service-slug]-[city-slug]` |
| `national-online` | `/services/[service-slug]` |
| `catalog` | Hierarchical per architecture: `/[category]/[subcategory]/[product-or-page]/` (Section 4.1.1). Path matches the architecture row's location in the tree. |

For `catalog` footprint sites, the URL is determined by where the keyword sits in `architecture.md` — Level 1 → `/[category]/`, Level 2 → `/[category]/[subcategory]/`, Level 3 → `/[category]/[subcategory]/[leaf]/`. If `architecture.md` shows the row uses a distribution page (Section 2.6.4), insert the axis marker: `/[category]/[axis]/[value]/`.

### Step 5 — SERP analysis

Same workflow as `/blog` Step 4, but on the commercial keyword. Extract: word count (typically 1500+ for primary service pages, 800+ for city variants), H2/H3 outline, conversion elements (CTAs, trust signals, pricing, testimonials), schema patterns.

### Step 5.5 — Wireframe (mandatory, per `CLAUDE.md` "Wireframe before content" rule)

Before generating prose, produce a wireframe doc at `sites/[site]/_drafts/[slug]/wireframe.md`. Mandatory contents:

- **Layout zones**: hero (H1 + value prop), trust signals strip, problem/pain section, solution sections (one per H2), social proof, FAQ, CTA + form, NAP block (per footprint).
- **Heading map** (H1 / H2 / H3) — H1 = primary commercial keyword; H2s = sub-aspects (what's included, who it's for, pricing, FAQ); H3s = items inside each H2.
- **Internal linking pattern slots** — for a service / leaf page, patterns 1 (header dropdown via template), 3 (footer via template), 4 (breadcrumb), 6 (related-services). Plus optional pattern 7 inbound from blog posts.
- **Conversion element placement** — above-fold CTA, sticky mobile CTA, click-to-call phone, trust signals position, multiple CTA placements.
- **Image plan** — hero + NAP + work photos (real client work for E-E-A-T) + city-specific hero for `service-area` zipper pages.
- **NAP block placement** — header / footer / contact section per `SEO_GUIDE.md` Section 4.3 (Local NAP rules by footprint).
- **Catalog-footprint addition:** if the site is `catalog`, also map the page's parent + sibling links per the architecture row (so internal-linking patterns 5 and 6 land cleanly).

Optional (if user opts in): hand-sketch / draw.io → AI design mockup for client presentation.

Show the wireframe to the user. Wait for explicit approval. Approved wireframes get archived in `_drafts/[slug]/`; rejected ones get revised and re-shown.

### Step 6 — Plan + approval (Rule 2)

Present:
- Footprint + URL pattern + slug
- Primary keyword + cluster
- Required NAP for this page (per footprint, from `site-info.md`)
- H1, H2 outline, FAQ
- Conversion elements list
- Image source for this run
- **Language fan-out** *(multilingual sites only)* — list of languages this service page will be produced in (default: all declared in `site-info.md`).

Wait for approval.

### Step 6.5 — Resolve language fan-out (multilingual sites only)

Read `site-info.md` Languages section.

- **`Multilingual: false`** → skip; continue to Step 7 as a single-language run.
- **`Multilingual: true`**:
  1. Default coverage = every language declared in the Languages table. Service pages almost always cover all languages — opt-out is rare and requires explicit confirmation.
  2. For each declared language:
     - Resolve voice files: root `references/voice.md` + per-site `references/voice.[lang].md` (REQUIRED). Service pages bias toward conversion-driven copy, lighter on stories — but still resolve all files.
     - Format URL using the language's URL pattern from the Languages table (substitute `[slug]`).
     - Reserve a draft folder: `sites/[site]/_drafts/[slug]/[lang]/`.
  3. Generate the hreflang link cluster from the resolved language set (self-reference + all siblings + `x-default`).
  4. Schema `inLanguage` is set per-language draft. `Service` schema gets `inLanguage` matching `<html lang>`. `Service.availableLanguage` may list ALL languages the actual service is delivered in (a separate field — language of the page vs. languages the service is offered in).
  5. **Per-language nav coordination.** The Lovable / CMS prompt for each language must include the new service page in that language's header dropdown / footer / sitemap. The English nav lists English service pages; the Spanish nav lists Spanish service pages.

The skill produces N drafts (one per language), each in its own `_drafts/[slug]/[lang]/` subfolder. Each passes its own Tier 1 + conversion + voice anti-AI checks using its language's voice files.

### Step 7 — Generate the page

Apply in order:
1. **Voice** — resolved `references/`, but biased toward conversion-driven copy (less story, more credibility).
2. **Tier 1 on-page** — all 16 items.
3. **Anti-doorway-page rules (Section 4.1 of SEO_GUIDE.md)** — for `service-area` only:
   - Unique 200+ word opening specific to that city
   - Local landmarks/neighborhoods mentioned
   - 1–2 city-specific FAQs
   - Real local NAP (city-specific area code if possible)
   - Real testimonials from customers in that city
   - Different hero image (not the same stock photo across cities)

   **If the page can't pass all 6, refuse to publish.**

4. **NAP per footprint (Section 4.3 of SEO_GUIDE.md)** — render correctly:
   - `single-location` → site's one NAP, header + footer + contact section.
   - `multi-location` → that branch's NAP, with embedded map of that branch.
   - `service-area` → HQ address may be hidden; show service-area map; phone is local.
   - `national-online` → no `LocalBusiness`; only `Organization` contactPoint.

5. **Conversion elements (Section 4.4 of SEO_GUIDE.md + `on-page-seo.md` Category 14)** — every item:
   - Above-fold CTA
   - Sticky mobile CTA
   - Phone with `tel:` link
   - Trust signals above fold (rating, license, years)
   - Multiple CTA placements
   - Specific testimonials (names, photos, neighborhoods if `service-area`)
   - Pricing transparency
   - Service area / hours
   - 4–8 FAQ
   - Embedded map (per footprint)

6. **Schema (JSON-LD)** — `Service` schema (with all required properties from `on-page-seo.md` 9.3) + `LocalBusiness` (per footprint, from 9.2) + `BreadcrumbList` + `FAQPage` + `Organization` site-wide. Plus, IFF the site's `site-info.md` byline policy enables person-author mode AND the page's `author:` frontmatter is set to a real-person slug (per `/blog` skill Step 6 item 9 routing logic), include `Person` schema in the `@graph` and inject the bio block from `sites/{site}/author-{slug}.md` in the service page's author footer. Service pages traditionally don't carry author bylines, but with the partial-EEAT-byline policies (e.g., a site that adopted partial-EEAT-byline), service pages MAY carry a named author IF the service category is in the site's `coi-categories.md` → `personal_eligible` list. Refer to `/blog` skill for the full author-routing logic — it's shared between the two skills.

7. **Length** — primary service pages 1500+ words; city variants 800+ words minimum.

8. **AI-search-friendly: Q+A density.** Beyond the dedicated FAQ section (conversion element item 9), structure 3+ in-body sections as explicit question→answer pairs (the H2 or H3 IS a question; the paragraph below IS the answer in the first sentence). LLMs preferentially cite passages that stand alone as direct answers. Examples for service pages: `## How much does AI consulting cost for a 20-person team?` (not `## Pricing`); `### Do you work with companies outside Houston?` (not `### Geographic coverage`).

9. **AI-search-friendly: citation-friendly chunking.** Paragraphs max 3 sentences. Lead each paragraph with the topic sentence — the main claim or value prop. Front-load named entities (the service name, location, key benefit) in the first sentence rather than burying them in subordinate clauses. Service pages have higher commercial intent and benefit even more from LLM-citable chunks.

10. **AI-search-friendly: self-contained facts.** Every paragraph must stand on its own. NO "as mentioned above," "as discussed earlier," "see the section above," "we'll explain below." LLMs lose context between paragraphs — pretend each paragraph is the only one cited.

11. **AI-search-friendly: verifiable claims.** Every statistic, customer count, response-time claim, or numeric assertion either (a) cites a source link, OR (b) is internally verifiable ("23 clients served in 2024" — provable via Stripe/GBP review counts/internal records, not McKinsey-style). Bare unsourced numbers read as fabricated. If you can't source or self-verify, drop the number.

### Step 8 — Fetch images

Same as `/blog` Step 7, but with stricter rules:
- Hero image must be unique per city for `service-area` zipper pages (can't reuse stock photo across all 50 city pages).
- Prefer real work photos over stock when source is `client-supplied` or `site-library`.

### Step 9 — Validate (Rule 4)

Same as `/blog` Step 8, plus:
- ✅ Anti-doorway-page rules (all 6, for `service-area` pages)
- ✅ NAP consistency check (page NAP matches `site-info.md` exactly)
- ✅ All required `Service` schema properties present
- ✅ Conversion elements all present (every checkbox in `on-page-seo.md` Category 14 applicable)

### Step 10 — Ship per publishing method

Same as `/blog` Step 9.

### Step 11 — Update tracker

Append to `used-keywords.md` with `Service` page type.

### Step 12 — Volume check (Section 4.2 of SEO_GUIDE.md)

After shipping, check site's total service-page count vs. cap per footprint. Flag if approaching the cap; recommend consolidation if multiple thin pages exist.

## Routine versioning + idempotency contract

This skill participates in cruise-control via `--cron` mode. When invoked by cron:

1. **Stamp `routine_version`** in every output produced (the `notes.md` audit entry header, `_inbox/` item frontmatter, draft folder metadata, audit log line written via `scripts/lib/audit-log.mjs`). Current `routine_version`: **1.0**. Bump when the skill's behavior meaningfully changes.

2. **Idempotency:** this skill MUST be safe to run twice in a row on the same day without producing duplicate work. Implementation: check `_drafts/{YYYY-MM-DD}-*` at the start of every cron-mode run; if today's slug already exists, exit cleanly with `exit: "idempotent-skip"`.

Reference: `docs/specs/2026-05-16-agents-cruise-control-design.md` § Operational hardening O3.

## Refusal conditions

In addition to base refusals (missing files, etc.):
- `service-business: false` in `site-info.md`.
- Service or location not in `site-info.md`.
- Anti-doorway-page rules can't be satisfied (for `service-area`).
- Volume cap (Section 4.2) would be exceeded.
- **`service-keywords.csv` has > 3 rows AND `architecture.md` is missing** (`SEO_GUIDE.md` Section 2.6) — refuse until the architecture exists, OR user records an explicit one-time skip reason in `notes.md`.
