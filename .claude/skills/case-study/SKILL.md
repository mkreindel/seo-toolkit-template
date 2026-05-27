---
name: case-study
description: Generate a case study page that documents a specific client outcome — problem, intervention, measurable result, and the testable claim. Captures decision-stage searchers looking for proof of capability ("[industry] [outcome] case study", "[service] results"). Pulls the real story from the site's per-site `stories.md` (refuses if no eligible story exists — never invents). Satisfies Tier 1 on-page SEO, validates schema, and ships per the site's publishing method. Use when the user types `/case-study` or asks for a case study / customer story page.
---

# `/case-study` — Client outcome case study page

Documents one real client outcome end-to-end. Case studies sit at the decision stage — readers are evaluating whether the site can produce the result they need. Every claim must be verifiable; every number must be sourced from `stats.md`; every quote must be from a real, consented testimonial. No invention — refusal is the correct response when there's no eligible story.

## Inputs

Required (asked at start if not given):
- **Site** — must match a folder under `sites/[name]/`.
- **Story ID** — references the entry in `sites/[site]/references/stories.md` (or `stories.{lang}.md` for multilingual). Format: `story-{slug}` matching the heading anchor in stories.md.

Optional (per-run overrides):
- **Industry / vertical** — used as the H1's qualifying detail and the schema `industry` field. Defaults to the story's industry.
- **Anonymize** — `true` (default) | `false` (only if the story file marks the client as having given explicit consent for name use). If consent flag is missing, anonymize is forced true.

## Workflow

This skill follows `/blog`'s workflow (Steps 0–11) with the page-type-specific differences listed below. Read `.claude/skills/blog/SKILL.md` end-to-end before running.

### What's unique to `/case-study`

**Step 2 — Story selection (not keyword selection):**
- Read `references/stories.md` (per-site, per-language).
- The user supplies the story ID, or the skill picks the highest-impact unused story (one with the largest measurable outcome).
- Required fields in the story entry: `client_descriptor`, `problem`, `intervention`, `outcome_metric` (must be a number from `stats.md`), `consent` (`anonymized` or `named-with-consent`).
- If any required field is missing → refuse, escalate or ask.

**Step 3 — Keyword cluster (case-study-specific):**
- The primary keyword is the outcome-search query, not the story: `[industry] [outcome] case study`, `[service] results [region]`, `how [client-type] achieved [outcome]`.
- Pick from `keywords.csv` rows with intent=`case-study` or `proof`. If none exist, the skill suggests one based on the story's industry + outcome and asks the user to add it to keywords.csv before proceeding.

**Step 4 — SERP analysis (case-study-specific):**
- Top 3 case study pages in this niche — extract: average word count, image count, presence/absence of dollar figures, presence/absence of named clients, format (long-form vs. multi-section vs. PDF-download-gated).
- Most ranking case studies are NOT gated. The default is unaffected by gating decisions made elsewhere.

**Step 6 — Wireframe (case-study-specific):**
- **Hero:** the outcome stated upfront as a number. "[Client descriptor] achieved [outcome number] in [timeframe]" — no marketing fluff before the number.
- **Quick fact strip** (above fold): 3–4 data points — `Client: [descriptor]`, `Industry: [vertical]`, `Timeframe: [duration]`, `Outcome: [metric]`. Skimmable.
- **Problem section** (300–500 words): what the client was experiencing. Specific. With dates if possible. Avoid generic "they wanted to grow."
- **Intervention section** (400–700 words): what we did, in chronological order. Specific tools, frameworks, hours invested if known. This is where AI-search-citation density matters most — readers + LLMs both pull from this section.
- **Result section** (300–500 words): the outcome metric, the time it took, what changed for the client beyond the headline number.
- **Quote** (required if `named-with-consent`, optional if anonymized): one verbatim sentence from the client. Cited.
- **"What we'd do differently"** section (required, 100–200 words): one thing about the engagement that didn't work or that we'd change. Single biggest trust-building section in the format.
- **FAQ:** 4–6 Qs — "Was this typical?", "How transferable is this?", "Pricing on engagements like this?"
- **CTA:** softer — "See if your situation maps to this one" rather than "Book a call."

**Step 7 — Schema (case-study-specific):**
- `Article` with `about: { @type: "CreativeWork", name: "[Engagement name]" }` and `mentions` for the industry.
- `BreadcrumbList`
- `FAQPage`
- If the client is named with consent: `Review` with `itemReviewed` = our service, `reviewBody` = the quote, `author` = the client.
- Do NOT use `Review` schema for anonymized cases — schema requires identifiable author.

**Step 8 — Voice (case-study-specific extras):**
- Every number on the page MUST be in `stats.md`. The skill refuses to fabricate or round.
- No "incredible results" or "transformative outcome" — banned per universal voice rules. Use the number.
- The "what we'd do differently" section is non-skippable. If the story file doesn't have material for this, refuse and ask the user to add the introspection.
- One opinion max, backed by the outcome metric.

## Refusal conditions

This skill refuses to ship if:
- No matching story exists in `stories.md` for the given ID.
- The story is missing `outcome_metric` (must be a number, must be in `stats.md`).
- The story is missing `consent` field.
- The "what we'd do differently" content is unwritable from the story file (no introspection available).
- A case study for this story already exists in `used-keywords.md`.

## Output

Standard `_drafts/[slug]/` layout, with these additions:
- `story-source.md` — the source story entry from stories.md, copied for traceability.
- `numbers-citation.md` — every number on the page mapped to its `stats.md` line.

Length target: 1,500–2,500 words.

## Routine versioning + idempotency contract

Same as `/blog`. Idempotency key: `(site, story-id, language)`. Skip re-run if `_drafts/case-study-{slug}/` exists with today's date.
