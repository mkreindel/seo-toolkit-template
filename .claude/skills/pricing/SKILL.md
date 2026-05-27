---
name: pricing
description: Generate a transparent pricing page for a chosen managed site. Captures the highest-intent search behavior — searchers typing "[brand] pricing", "[service] cost", "how much does [service] cost". Pulls real pricing from the site's `stats.md` (refuses if pricing data missing — never invents). Builds a tier-by-tier breakdown OR a custom-quote framing depending on the site's pricing model (read from `site-info.md`). Satisfies Tier 1 on-page SEO, validates Offer schema, and ships per the site's publishing method. Use when the user types `/pricing` or asks for a pricing page.
---

# `/pricing` — Pricing page generator

Pricing pages are the single highest-converting page type on the web for service businesses — and the single most-mishandled. The skill enforces transparency (real numbers from `stats.md`, no "request a quote" hide-the-ball patterns unless that's genuinely the model) and refuses to invent any number.

## Inputs

Required (asked at start if not given):
- **Site** — must match a folder under `sites/[name]/`.

Optional (per-run overrides):
- **Pricing model** — `tiered` (Starter / Pro / Enterprise rows) | `custom-quote` (anchors + ranges, "contact for exact") | `per-engagement` (typical engagement sizes with example outcomes) | `package` (named packages with fixed scope + price). Default: read from `site-info.md` → "Pricing model". Skill refuses if neither input nor site-info specifies.
- **Currency** — defaults to site's primary currency from `site-info.md`. Override per region if the site serves multiple markets at different price points.

## Workflow

This skill follows `/service`'s workflow (Steps 0–11) with the page-type-specific differences listed below. Read `.claude/skills/service/SKILL.md` end-to-end before running.

### What's unique to `/pricing`

**Step 1 — Read context (additions):**
- `sites/[site]/references/stats.md` is the pricing source-of-truth. Required fields per pricing tier or engagement type: `tier_name`, `price` (number, never rounded), `currency`, `unit` (one-time / monthly / annual / per-project), `includes` (array of deliverables), `excludes` (array).
- If any required field is missing → refuse.

**Step 2 — Keyword selection:**
- Pick from `service-keywords.csv` rows with intent=`pricing` or `cost`. Common forms: `[service] pricing`, `[service] cost`, `how much does [service] cost`, `[brand] pricing`.

**Step 4 — SERP analysis (pricing-specific):**
- Top 3 pricing pages — extract: do they show numbers above the fold? Do they require a form? Do they show comparison table or per-tier cards? What's the median word count (typically lower than blogs — pricing pages are scannable, 500–1500 words is normal)?
- If the top 3 all hide prices behind forms, that's an opportunity — transparent pricing pages outrank hidden-price ones for the search intent "[X] pricing".

**Step 6 — Wireframe (pricing-specific):**

Wireframe shape depends on pricing model:

**Tiered model:**
- Hero: "Transparent [service] pricing — pick what fits"
- Quick answer: 1-sentence range — "Starts at $X. Most clients pay $Y–$Z."
- Tier cards (3–4): name, price, "best for", 4–6 bullet inclusions, CTA
- Comparison table: every feature × every tier (✓/✗ or numeric)
- "What's NOT included" (required, in every tier section)
- FAQ: 6–10 Qs — pricing-specific (annual discount? cancel anytime? what's included? when is custom right?)

**Custom-quote model:**
- Hero: "[service] pricing — typical engagement sizes"
- Quick answer: "Typical engagements run $X–$Y. Here's how to know which range fits."
- Anchors section: 3–5 example engagements with descriptor + price range + scope summary
- "How we price" section (required for trust): explain the inputs that drive cost (hours / scope / team size / region). No black box.
- FAQ: when to expect the lower end, when higher, what's NOT in scope, how long quote takes.

**Per-engagement model:**
- Hero: "[service] pricing — by engagement size"
- 3–5 named example engagements: descriptor, typical price, deliverables, timeline
- "When custom pricing applies" section
- FAQ

**Package model:**
- Hero: "[service] packages"
- Package cards (3–6): name, price, fixed scope (deliverables), timeline, CTA
- "Mix-and-match" section if applicable
- FAQ

**Step 7 — Schema (pricing-specific):**
- `Service` (or `Product` if applicable) with `offers: [ Offer (per tier) ]`
- Each `Offer`: `price` (the number from stats.md), `priceCurrency`, `priceValidUntil` (180 days out from publish date), `availability: "InStock"` (or `LimitedAvailability` for capped offerings)
- `FAQPage`
- `BreadcrumbList`
- For custom-quote / per-engagement: use `AggregateOffer` with `lowPrice` + `highPrice` from the anchor range.

**Step 8 — Voice (pricing-specific extras):**
- NEVER hide a number that's in `stats.md`. Pricing pages that show ranges instead of exact-from-X numbers underperform.
- One opinion max — usually "[Tier X] is what we'd pick for [profile]" backed by the conversion data in `stats.md` if available.
- "When NOT to choose [this tier]" — required for every tier. Single biggest trust signal.
- No "Contact us for pricing" as the headline. If that's genuinely the model, the entire page is structured as "custom-quote" with anchor ranges shown.
- AI-search rules: Q+A density (5+ in-body Q→A) — pricing pages are heavily LLM-cited.

## Refusal conditions

This skill refuses to ship if:
- `stats.md` is missing required pricing fields.
- Pricing model is undeclared (neither input nor `site-info.md`).
- A pricing page already exists in `used-keywords.md` (refresh instead via `/refresh`).
- The site's `voice.md` forbids public pricing (some businesses cannot publish prices for regulatory reasons — flag).

## Output

Standard `_drafts/[slug]/` layout. Slug defaults to `pricing` for single-page, `pricing-{service}` if multiple services have separate pages.

Length target: 600–1,500 words. Pricing pages convert better short than long — every word that isn't pricing or trust-signal is friction.

## Routine versioning + idempotency contract

Same as `/service`. Idempotency key: `(site, slug, language)`. Pricing pages are refreshed quarterly when stats.md updates — `/refresh pricing` is the right command for ongoing maintenance.
