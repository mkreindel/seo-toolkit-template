---
name: alternative
description: Generate an "alternatives to [Competitor]" page that captures searchers actively shopping away from a named competitor. Listicle-style — ranks the site alongside 4–7 other named alternatives, with the site positioned as best-fit for a specific use case (not always #1). Picks the keyword from `service-keywords.csv` (rows with intent=`alternative`) or user input, runs SERP analysis, satisfies Tier 1 on-page SEO, validates schema, and ships per the site's publishing method. Use when the user types `/alternative` or asks for an "alternatives to" page.
---

# `/alternative` — "Alternatives to X" listicle page

Captures the highest-intent prospecting traffic on the web: people who have already decided their current option doesn't fit and are looking for replacements. The page lists 4–7 alternatives (including the site itself), ranks them per use case, and positions the site honestly — not always #1.

## Inputs

Required (asked at start if not given):
- **Site** — must match a folder under `sites/[name]/`.
- **Competitor being replaced** — the named entity in the search query (`alternatives to [HubSpot]`, `[Mailchimp] alternatives`).

Optional (per-run overrides):
- **Alternative count** — defaults to 5; valid range 4–7. Below 4 looks thin; above 7 dilutes per-alternative depth.
- **Position** — the site's slot in the list. Default: `honest` (skill picks slot based on real fit). Override: `top` (only if the site is genuinely the best fit for the broadest reader segment — refusal-checked).

## Workflow

This skill follows `/blog`'s workflow (Steps 0–11) with the page-type-specific differences listed below. Read `.claude/skills/blog/SKILL.md` end-to-end before running.

### What's unique to `/alternative`

**Step 2 — Keyword selection:** pick from `service-keywords.csv` rows where `intent=alternative`, or accept user-supplied keyword. The keyword form is always `alternatives to [X]` or `[X] alternatives`.

**Step 4 — SERP analysis (alternative-specific):**
- Top 3 alternative pages — extract the LIST: which alternatives do they name? The intersection of all 3 = the "table stakes" alternatives that must appear on this page.
- Count: most ranking alternative pages list 5–10 options. Pick the median.
- Identify SERP-listed alternatives that are obviously weak (defunct products, niche-only tools) — those can be replaced with stronger but rarer picks.

**Step 5 — Alternative selection (the editorial decision):**
- Required alternatives: every option that appears in ≥ 2 of the top 3 SERP pages.
- Optional alternatives: pick 1–2 underrepresented but genuinely strong options to add (this is the page's differentiation move).
- The site itself: include as one of the N. Position determined honestly per fit.
- For each alternative, pull (web research):
  1. Their pricing (URL + date)
  2. Their primary positioning ("X is the [category] for [audience]")
  3. One real strength (cited)
  4. One real weakness (cited from G2/Capterra/Reddit)

**Step 6 — Wireframe (alternative-specific):**
- **Hero:** "The [N] best alternatives to [Competitor] in [year]" — year-anchored, ranking-implying.
- **Quick answer (above fold):** "If you're switching from [Competitor], the alternative you pick depends on [decision criterion]. Here's how the [N] options compare."
- **TL;DR table** (required): N rows × columns [Name, Best for, Starting price, Free tier]. Above the long-form sections.
- **Per-alternative section** (200–350 words each):
  - H2: "[N]. [Alternative name]"
  - "Best for:" one-sentence positioning
  - 2-paragraph evaluation: real strength + real weakness (both cited)
  - "Pricing:" current public price + date accessed
  - "Switch from [Competitor]:" sentence on migration difficulty
- **Decision framework** (required, after the list): 3–5 if-then statements. "If you need [X], pick [A]. If you need [Y], pick [B]." Site is named honestly in the if-then it actually wins.
- **FAQ:** 4–6 Qs — "Why isn't [option Z] on this list?", migration FAQs, pricing FAQs.

**Step 7 — Schema (alternative-specific):**
- `Article` (the listicle itself)
- `ItemList` with `itemListElement` = N entries, each pointing to a `Product` or `Service` (use `mentions` for competitors, full `Product` only for our own).
- `FAQPage`
- `BreadcrumbList`

**Step 8 — Voice (alternative-specific extras):**
- The site MUST NOT be #1 by default — that's the most-spammed pattern in this format and Google deprioritizes it. The site's slot is determined by genuine fit for the broadest reader segment.
- Every weakness claim about a named competitor MUST be cited (G2 review URL + date, Capterra URL + date, or their own changelog).
- "When NOT to switch" section — if the reader's use case isn't a fit for ANY of the N alternatives, tell them to stay. Bigger trust signal than any feature comparison.

## Refusal conditions

This skill refuses to ship if:
- The competitor in the title is not a real, currently-active product/service.
- Position=`top` is requested but the site is not genuinely the broadest-fit option (per fit analysis).
- The site's `voice.md` forbids alternative-positioning pages (some brands don't position against competitors at all).
- A `/alternative` page for the same competitor already exists in `used-keywords.md` (refresh instead).

## Output

Standard `_drafts/[slug]/` layout, with these additions:
- `alternative-list.md` — the structured list as a standalone file (JSON-LD ItemList source-of-truth)
- `sources.md` — every citation used (URL + date)

Length target: 2,000–3,500 words. Listicles in this format need depth per item or they read as content marketing fluff.

## Routine versioning + idempotency contract

Same as `/blog`. Idempotency key: `(site, competitor-slug, language)`. Skip re-run if `_drafts/alternatives-to-{competitor}/` exists with today's date.
