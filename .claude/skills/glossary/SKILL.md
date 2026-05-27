---
name: glossary
description: Generate a glossary entry (single term) or glossary index (terms list) for a chosen managed site. Captures definition-stage search behavior ("what is [term]", "[term] meaning", "[term] definition") AND functions as an internal-link hub that distributes authority to commercial pages. Pulls definitions from site-specific authoritative sources, satisfies Tier 1 on-page SEO, validates DefinedTerm + DefinedTermSet schema, and ships per the site's publishing method. Use when the user types `/glossary` (one entry) or `/glossary --index` (full index) or asks for glossary content.
---

# `/glossary` — Glossary entry / index generator

Glossaries do double duty: they capture definition-stage informational traffic AND function as the highest-density internal-linking hub on a site. A well-built glossary entry links to 5–10 commercial pages from a single page — distributing link equity downstream without any user-visible link spam. This skill builds both the individual entries and the index.

## Inputs

Required (asked at start if not given):
- **Site** — must match a folder under `sites/[name]/`.
- **Mode** — `entry` (single glossary term) | `index` (the full glossary index page).
- **Term** (if mode=`entry`) — the specific term being defined.

Optional (per-run overrides):
- **Authoritative source** — for terms that need definition citations, specify the source (default: skill picks from established industry sources via SERP analysis).
- **Linked pages** — if the term should link to specific internal pages, supply slugs; otherwise the skill picks based on topical relevance.

## Workflow

This skill follows `/blog`'s workflow (Steps 0–11) with the page-type-specific differences listed below. Read `.claude/skills/blog/SKILL.md` end-to-end before running.

### What's unique to `/glossary`

**Step 2 — Keyword selection:**
- Mode=`entry`: primary keyword forms — `what is [term]`, `[term] definition`, `[term] meaning`, `[term] explained`. Pick from `keywords.csv` rows with intent=`definition` or `glossary`. Volume is typically lower per term, but the cumulative compound (50+ entries × low-volume) drives 6-figure annual traffic for niche-authoritative glossaries.
- Mode=`index`: primary keyword is `[topic] glossary` or `[topic] terms` — single keyword for the whole index.

**Step 3 — Cluster (glossary-entry-specific):**
- Cluster terms are: synonyms (`[term] vs synonym`), related terms (`[term] vs adjacent-term`), and the broader category. Usually 3–5 cluster terms for a glossary entry — fewer than blog because the definition itself is the primary intent.

**Step 4 — SERP analysis (glossary-specific):**
- Top 3 glossary entries for this term — extract: word count (usually shorter than blogs, 300–800 words is typical), presence of "Related terms" section, presence of definition citations, presence of in-context examples.
- Wikipedia / academic sources often rank — those are difficult to outrank for general terms but easier for industry-specific terms.

**Step 6 — Wireframe (glossary-entry-specific):**
- **Hero:** "[Term]" as H1. No prefix, no marketing tagline — just the term.
- **Quick definition** (the first sentence after H1): "[Term] is [definition]." Direct. Self-contained (passes AI-search self-contained-facts test). One sentence, max 30 words. This is the snippet Google + LLMs cite.
- **Extended definition** (200–400 words): the longer explanation. Where the term came from, how it's used in this industry, what it's NOT (common misconceptions).
- **Example section** (80–200 words): one concrete in-context example. Stories.md material works well here if relevant.
- **Related terms section** (required, hub function): 5–10 internally-linked terms — to other glossary entries AND to commercial pages where the term appears. Format: bulleted list, each item is "[Linked term]" + 8–15 word descriptor.
- **"In context" links** (required): 3–5 anchor-text-rich links to commercial / service / blog pages on the site that USE this term. This is where the link-equity distribution happens.
- **FAQ:** 3–5 Qs — "Is [term] the same as [synonym]?", "When did [term] originate?", common misconceptions.
- NO conversion CTA — glossary entries are pure informational, conversion happens via the "in context" links.

**Step 6b — Wireframe (glossary-index-specific):**
- **Hero:** "[Topic] glossary" (H1). Subhead: 1–2 sentences explaining the glossary's scope and how it's maintained.
- **A–Z filter / search** (frontend component, called out in wireframe).
- **Term list:** every entry with `[Term]` as a heading link to `/glossary/{term-slug}`, followed by the quick-definition sentence. Grouped alphabetically or by category — site-info determines.
- **Most-viewed terms** section (5–10 entries, optional — populated from analytics).
- **Schema:** single `DefinedTermSet` containing all entries.

**Step 7 — Schema (glossary-entry-specific):**
- `DefinedTerm` with `name`, `description` (the quick definition), `inDefinedTermSet` (URL of the index)
- `Article` (the entry itself)
- `BreadcrumbList`
- `FAQPage` if FAQ section present
- For multilingual sites, every entry has its own `DefinedTerm` per language, all part of the same `DefinedTermSet` (with `inLanguage` per entry).

**Step 7b — Schema (glossary-index-specific):**
- `DefinedTermSet` with `hasDefinedTerm: [ DefinedTerm × N ]` — each pointing to a `DefinedTerm` by URL.
- `CollectionPage` for the index itself.
- `BreadcrumbList`.

**Step 8 — Voice (glossary-specific extras):**
- Definitions MUST be self-contained — each entry stands alone without requiring the reader to know the broader context. Critical for AI-search citation.
- Tone is encyclopedic, not promotional. The skill refuses if the draft slips into marketing voice.
- Every definition that cites authority needs the citation (date accessed + URL or DOI for academic sources).
- No opinions in glossary entries — opinions go on blog posts, glossary is definitional.
- AI-search rules: self-contained-facts rule applies aggressively. Q+A density via the FAQ; citation-friendly chunking via 1-sentence quick-definition + 3-sentence-max paragraphs in extended definition.

## Refusal conditions

This skill refuses to ship if:
- Mode=`entry` and the term is undefined in any authoritative source (skill refuses to invent definitions).
- Term-slug collision with an existing glossary entry (suggest /refresh instead).
- Mode=`index` and fewer than 10 glossary entries exist (an index with <10 entries is thin content; build entries first).

## Output

- Mode=`entry`: standard `_drafts/glossary/{term-slug}/` layout (path-based to support the glossary directory pattern).
- Mode=`index`: `_drafts/glossary/index/` containing the index page draft + auto-generated `DefinedTermSet` JSON-LD.

Length target: 300–800 words per entry; 600–1,200 words for the index.

## Routine versioning + idempotency contract

Same as `/blog`. Idempotency key for entries: `(site, term-slug, language)`. Index regeneration is idempotent per-day (re-running on the same day skips; running on a different day rebuilds with any new entries discovered).
