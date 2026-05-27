---
name: comparison
description: Generate a head-to-head comparison page ("[Site] vs [Competitor]" or "[Product A] vs [Product B]") for a chosen managed site. Captures decision-stage searchers comparing the site against a named alternative. Picks the comparison from `service-keywords.csv` (rows with intent=`comparison`) or user input, runs SERP analysis on top 3 comparison pages, builds a feature-by-feature comparison table, balances honesty (real limitations) with conversion (clear differentiators), satisfies Tier 1 on-page SEO, and ships per the site's publishing method. Use when the user types `/comparison` or asks for a "vs" page.
---

# `/comparison` — Head-to-head comparison page generator

Creates a decision-stage comparison page. Comparison search intent is the highest-conversion intent on the web — searchers are pre-qualified, already evaluating named options, and ready to choose. This skill captures that traffic without sounding like a hatchet job (one-sided comparisons rank poorly and convert worse).

## Inputs

Required (asked at start if not given):
- **Site** — must match a folder under `sites/[name]/`.
- **Comparison target** — either a primary keyword (`site-a vs accenture ai consulting`) or `{competitor}` slug. The skill picks from `service-keywords.csv` rows with intent=`comparison` if not supplied.

Optional (per-run overrides):
- **Competitor data source** — defaults to web research; override to a supplied dossier file in `_research/competitors/{slug}.md`.
- **Stance** — `balanced` (default — honest pros/cons both sides) | `differentiator-led` (lead with our edge, still honest about limitations). Never `hatchet` — refused.

## Workflow

This skill follows `/service`'s workflow (Steps 0–11) with the page-type-specific differences listed below. Read `.claude/skills/service/SKILL.md` end-to-end before running.

### What's unique to `/comparison`

**Step 2 — Keyword selection:** pick from `service-keywords.csv` rows where `intent=comparison`, or accept user-supplied keyword. Validate via SERP comparison test (`SEO_GUIDE.md` Section 2.4) — comparison pages must compare exactly the two named entities, not a broader category.

**Step 4 — SERP analysis (comparison-specific):**
- Top 3 comparison pages — extract the comparison axes (price, feature set, support, integrations, learning curve, etc.). The shared axes across all 3 define the table this page MUST cover.
- Identify which axes the top 3 OMIT — those are differentiation opportunities for this page.
- Note tone: is the top result a balanced third-party review (Capterra, G2, TechRadar) or a competitor-owned page? Third-party-dominated SERP = trust signal is hard; pace conversion CTAs accordingly.

**Step 5 — Competitor research:** for the competitor side of the comparison, gather (in this order):
1. Their own public pricing page + features page (URL + date accessed)
2. G2 / Capterra / TrustRadius reviews (last 90 days) — pull 3 verbatim pain points
3. Their public case studies — what they explicitly target (industry, company size)
4. Independent third-party reviews — confirm or refute their own claims

Every claim about the competitor in the final page MUST cite one of the four sources above. No paraphrased hearsay. No "competitors often struggle with X" without a citation.

**Step 6 — Wireframe (comparison-specific):**
- **Hero zone:** "[Our offer] vs [Competitor]: which fits [decision criterion]?" — frames the page as decision support, not a sales pitch.
- **Quick answer (above the fold):** 2-sentence verdict — "If you need X, pick us. If you need Y, pick them." Honest. Pre-qualifies the reader.
- **Comparison table (the spine):** 6–12 rows of feature-by-feature comparison. Each cell: factual (✓/✗ or short fact). No marketing copy in cells.
- **Section per major axis:** 200–400 words each. Explain the trade-off, name the use case for each side. End with "When [our offer] wins" and "When [competitor] wins" subheadings.
- **"When NOT to choose us"** section (required, not optional). 2–3 specific scenarios. This is the trust-building section that makes the rest of the page believable.
- **FAQ:** 5–8 Qs covering: "Is this comparison biased?", "Can I switch later?", "What about [third option]?", pricing-specific Qs.
- **Final CTA:** softer than service pages — "See if [our offer] fits your team" rather than "Get a demo today." Comparison-stage readers reject hard sells.

**Step 7 — Schema (comparison-specific):**
- `Article` with `about: [ {@type: Product, name: "Our Product"}, {@type: Product, name: "Competitor"} ]`
- `FAQPage`
- `BreadcrumbList`
- Optionally: `Review` or `ItemList` referencing both entities (used only if the comparison spans multiple options, not 1v1).
- Do NOT use `Product` schema for the competitor's product — only `mentions` / `about`. Schema-asserting facts about another company's product is risky.

**Step 8 — Voice + AI-search (comparison-specific extras):**
- Every claim about the competitor MUST be sourced (linked, even if `nofollow noopener`).
- Every claim about our offer MUST be backed by `stats.md` or a story from `stories.md`.
- One opinion max — usually "[Differentiator] is what we'd pick on for [use case]" backed by a stat.
- AI-search rules: Q+A density (5+ in-body Q→A — comparison content is high-LLM-citation material).

## Refusal conditions

This skill refuses to ship if:
- The comparison would require fabricating facts about the competitor (no public source available).
- The site's `voice.md` doesn't permit a comparison page (some brands forbid named competitor mentions).
- A `/comparison` page for the same competitor already exists in `used-keywords.md` (refresh instead via `/refresh`).
- Stance is `hatchet` — comparison must be balanced or differentiator-led, never one-sided.

## Output

Standard `_drafts/[slug]/` layout (or `/[lang]/` subfolders for multilingual sites), with these comparison-specific additions:
- `comparison-table.md` — the raw table as a separate file (some publishing flows need it as a structured asset)
- `competitor-sources.md` — every citation used, with URL + date accessed (the receipts file)

Length target: 1,800–3,000 words (SERP-driven; comparison pages skew longer than blog posts because the table + per-axis breakdowns are mandatory).

## Routine versioning + idempotency contract

Same as `/blog` (see `.claude/skills/blog/SKILL.md`). Output path is `_drafts/{slug}/` per language. Idempotency key: `(site, slug, language)`. Skip re-run if `_drafts/{slug}/` exists with a `meta.json` containing today's date.
