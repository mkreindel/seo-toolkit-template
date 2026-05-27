---
name: wireframe
description: Produce a wireframe doc for a new page (blog post, service page, or catalog leaf) BEFORE content generation. Mandatory step per `CLAUDE.md` — `/blog` and `/service` invoke this in their flow. Output is a markdown wireframe in `_drafts/[slug]/wireframe.md` covering layout zones, heading hierarchy, internal-linking pattern slots, conversion elements (service pages), and image plan. Optionally produces a draw.io / AI-generated visual mockup for client presentation. Use when the user types `/wireframe` directly, or when a page-generating skill calls it.
---

# `/wireframe` — Page wireframe generator (mandatory pre-content step)

Per `CLAUDE.md` "Wireframe before content" rule, every new page goes through this skill before content is written. Wireframe-first means structure is decided once; content fills the structure; `/audit` has predictable patterns to verify.

## Inputs

Required:
- **Site** — must match `sites/[name]/`.
- **Slug** — the page's URL slug (or full hierarchical path for catalog footprint).
- **Page type** — one of: `home`, `category`, `subcategory`, `product` / `service-leaf`, `blog-post`, `blog-index`, `about`, `contact`.
- **Primary keyword** — the keyword the page targets.

Optional:
- **Cluster** — secondary + tertiary keywords (passed in by `/blog` Step 3 or `/service` Step 3 if invoked from those flows).
- **Mockup mode** — `none` (default, doc only), `drawio` (output a draw.io importable XML stub), `ai-mockup` (pause for user to drop a hand-sketch + AI-generated mockup into `_drafts/[slug]/`).

## Workflow

### Step 0 — Cron-mode detection (inherited from caller)

This skill is not directly cron-scheduled; it's invoked by `/blog` or `/service` in their respective workflows. When the caller is in `--cron` mode, this skill MUST also operate in cron mode:

1. **Idempotency check:** if `_drafts/{slug}/wireframe.md` already exists, do not overwrite — return the existing wireframe to the caller and let the caller decide whether to proceed with content generation.
2. **Escalation contract:** if the wireframe cannot be produced (e.g., missing site-info.md fields, unable to map page type to layout), escalate to `sites/{site}/_inbox/` via `scripts/lib/cron-mode.mjs` `writeInboxItem(...)` and exit with `exit: "escalated"`.
3. **Audit log:** write one line to the audit log on every exit.

### Step 1 — Read context (Rule 1)

Load:
1. `CLAUDE.md`
2. `SEO_GUIDE.md` Section 5.1 (internal linking pattern catalog)
3. `on-page-seo.md` Section 3.1 (heading hierarchy by page type)
4. `sites/[site]/site-info.md` (footprint, brand, conversion elements per Section 4.4)
5. `sites/[site]/architecture.md` if catalog footprint (the wireframe must reflect the architecture's parent + sibling links)
6. `sites/[site]/references/voice.[lang].md` for voice tone reference (placeholder copy on the wireframe should hint at voice)

### Step 2 — Resolve patterns + zones for this page type

Map the page type to:

**Required zones (top-to-bottom):**

| Page type | Zones |
|---|---|
| `home` | Hero (H1 + value prop) → trust strip → 3 commercial pillars (each H2) → social proof → featured categories (pattern 2) → blog teaser → footer |
| `category` (catalog) | Breadcrumb → H1 + intro → filter / sub-axes (if distribution page) → product grid (each card = H3) → category-level FAQ → related categories (pattern 6) → footer |
| `subcategory` (catalog) | Breadcrumb → H1 + intro → product grid → FAQ → siblings link block (pattern 6) → footer |
| `product` / `service-leaf` | Breadcrumb → H1 → hero with product image + price + CTA → spec/feature table → trust signals → FAQ → related products (pattern 6) → footer |
| `service-page` | Breadcrumb → H1 + value prop → trust signals → problem/pain → solution sections (each H2) → social proof → FAQ → CTA + form → NAP per footprint → footer |
| `blog-post` | Breadcrumb → H1 → intro (the answer) → TOC if 1500+ words → body sections (H2) with H3 subsections → FAQ → author bio → blog → transactional bridge (pattern 7) → related posts → footer |
| `blog-index` | Header → H1 + intro → category filters if any → post grid → footer |

**Required internal-linking patterns** per page type (Section 5.1 of `SEO_GUIDE.md`):

| Page type | Patterns expected |
|---|---|
| Home | 1 (header dropdown), 2 (featured), 3 (footer) |
| Category landing | 1, 3, 4 (breadcrumb), 5 (category → sub) |
| Subcategory | 1, 3, 4, 5, 6 (related-products) |
| Product / service leaf | 1, 3, 4, 6 |
| Blog post | 1, 3, 4, 7 (blog → transactional bridge) |

The wireframe makes each pattern slot **explicit** — calls out which other URL the link points to and the anchor text.

### Step 3 — Draft the wireframe doc

Write `sites/[site]/_drafts/[slug]/wireframe.md` with this structure:

```markdown
# Wireframe — [page title]

**URL:** [full path including hierarchy if catalog]
**Page type:** [type]
**Primary keyword:** [keyword]
**Cluster:** [secondary, tertiary]
**Footprint:** [from site-info.md]
**Languages:** [if multilingual]

## Heading map
- H1: [exact H1 text using primary keyword]
- H2: [section name using secondary keyword]
  - H3: [subsection or item]
  - H3: ...
- H2: [next section using secondary keyword]
  - H3: ...
- H2: Frequently asked questions
  - H3: [FAQ Q1]
  - H3: [FAQ Q2]
  - ...

## Layout zones (top to bottom)
1. [Zone name] — [purpose; key elements]
2. ...

## Internal linking slots
| Pattern | Anchor text | Destination URL |
|---|---|---|
| 1 (header dropdown) | (template-level — categories from architecture) | (multiple) |
| 3 (footer) | (template-level) | (multiple) |
| 4 (breadcrumb) | Home > [category] > [this page] | (hierarchical) |
| [page-type specific] | ... | ... |

## External link plan (2–3 authoritative)
- [topic] → [authoritative source URL]
- ...

## Image plan
- Hero: [description, source: pexels/unsplash/site-library/client/AI]
- Inline N: [description]
- ...

## Conversion elements (service pages only — per `on-page-seo.md` Category 14)
- [ ] Above-fold CTA: [text] → [destination]
- [ ] Sticky mobile CTA
- [ ] Click-to-call phone in header
- [ ] Trust signals strip above fold
- [ ] Multiple CTA placements: [list locations]
- [ ] Specific testimonials placement
- [ ] Pricing transparency: [where]
- [ ] Embedded map (per footprint)

## NAP block (service pages only — per Section 4.3)
[NAP rules per the site's footprint]

## Catalog parent + siblings (catalog footprint only)
- Parent: [URL]
- Siblings (related products / services): [list]
- Children (if this is a category): [list]

## Mockup
[ ] Optional. If user opted in, link to draw.io export OR AI-generated PNG.
```

### Step 4 — Show wireframe to user for approval

Print the wireframe doc to the user. Wait for explicit approval ("approved", "yes", "ship it") before returning control. If the user wants edits, revise and re-show.

If `/wireframe` was invoked from `/blog` or `/service`, return control to that skill once approval lands. The calling skill resumes at its next step.

If `/wireframe` was invoked directly, the user may then invoke `/blog` or `/service` separately — the wireframe is now archived in `_drafts/[slug]/wireframe.md` and the calling skill picks it up.

### Step 5 — Optional: AI mockup workflow

If `mockup mode` = `ai-mockup`:

1. Pause and ask the user to drop a hand-sketch (photo) into `_drafts/[slug]/sketch.{jpg,png}`.
2. Wait for the file.
3. Recommend the user run the sketch through their preferred AI design tool (Midjourney, DALL·E, Galileo, Lovable, or similar) with a prompt like: *"Convert this hand-drawn wireframe into a high-fidelity webpage mockup matching [brand colors / typography from `site-info.md`]."*
4. The user drops the AI-generated mockup into `_drafts/[slug]/mockup.{png,jpg}`.
5. The wireframe doc is updated to reference both files.

Toolkit doesn't generate the visual mockup itself — it sequences the workflow.

If `mockup mode` = `drawio`:

Output a stub draw.io XML file at `_drafts/[slug]/wireframe.drawio` with placeholder zones the user can open in the draw.io app or [draw.io's web app](https://app.diagrams.net) and refine.

## Output

A markdown wireframe doc at `sites/[site]/_drafts/[slug]/wireframe.md`. The page-generating skill (`/blog` or `/service`) reads this file as input.

## Refusal conditions

- Site folder doesn't exist or `site-info.md` missing.
- Page type isn't recognized.
- Catalog footprint without `architecture.md` (must run `/architecture` first or hand-create the file — refer user to `SEO_GUIDE.md` Section 2.6).

## Routine versioning + idempotency contract

This skill inherits cron mode from its caller (`/blog` or `/service`) — it's not directly cron-scheduled. When the caller is in `--cron` mode, this skill MUST:

1. **Stamp `routine_version`** in the wireframe doc frontmatter and the audit log line written via `scripts/lib/audit-log.mjs`. Current `routine_version`: **1.0**.

2. **Idempotency:** this skill MUST be safe to run twice in a row on the same slug. Implementation: check whether `_drafts/{slug}/wireframe.md` already exists; if so, do not overwrite — return the existing wireframe and let the calling skill decide whether to proceed.

Reference: `docs/specs/2026-05-16-agents-cruise-control-design.md` § Operational hardening O3.

## Why mandatory

`CLAUDE.md` rule: writing content first and re-engineering the page around it produces inconsistent internal linking, weak heading hierarchy, and forgotten conversion elements. The wireframe step removes ~80% of structural issues before they happen.
