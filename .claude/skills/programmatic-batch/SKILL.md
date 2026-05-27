---
name: programmatic-batch
description: Generate N service pages from a matrix CSV (e.g., services × cities, services × industries, services × company-size). Each output cell is a unique service page passing all six anti-doorway-page rules from SEO_GUIDE Section 4.1. Refuses to ship any cell that can't satisfy uniqueness. Enforces footprint volume caps from Section 4.2 (service-area: 30 max initial; multi-location: 50 cap). Produces drafts to `_drafts/programmatic-{matrix-name}/` with one draft per cell. Use when the user types `/programmatic-batch` or asks to scale service-page production via templates.
---

# `/programmatic-batch` — Matrix-driven service page generator

Programmatic SEO done right: generate N pages from a structured variable matrix while enforcing the anti-doorway-page rules that distinguish legitimate scaled content from spam. The skill REFUSES to ship any cell that can't be filled with genuine local data — that refusal is the feature, not the bug. Programmatic SEO without this guardrail is the fastest way to trigger a Google manual action.

This skill is the natural pair to `/cluster` (informational scale, low risk) — `/programmatic-batch` is commercial scale, high risk if mishandled.

## Inputs

Required (asked at start if not given):
- **Site** — must match a folder under `sites/[name]/` with `service-business: true`. Skill refuses on non-commercial sites.
- **Matrix file** — path to a CSV in the site folder (default: `sites/[site]/matrix.csv`). Schema documented below.

Optional (per-run overrides):
- **`--max-batch=N`** — caps how many cells to ship in this run. Default: derived from footprint per `SEO_GUIDE.md` Section 4.2 (service-area: 5/week max; multi-location: 5/week max; single-location/national-online: full matrix). The skill enforces pacing — exceeding the cap requires explicit `--override-pacing` flag.
- **`--cell-filter`** — comma-separated cell IDs to ship (e.g., `tapas-houston,tapas-katy`). Useful for re-running specific cells after fixing local-data gaps.
- **`--dry-run`** — output the matrix expansion + uniqueness audit only; don't generate full drafts. Use for matrix validation before committing to a full batch.
- **Keyword tool** — overrides the site's default. Used for SERP analysis per cell.

## The matrix CSV schema

The matrix CSV is the source-of-truth for what pages get generated. Required columns:

```csv
cell_id,axis_1_value,axis_2_value,primary_keyword,local_data_file,status
tapas-houston,Tapas Catering,Houston,tapas catering houston,_local-data/tapas-houston.md,ready
tapas-katy,Tapas Catering,Katy,tapas catering katy,_local-data/tapas-katy.md,draft
paella-houston,Paella Catering,Houston,paella catering houston,_local-data/paella-houston.md,ready
...
```

- **`cell_id`** — unique identifier (kebab-case). Used as slug source.
- **`axis_1_value` / `axis_2_value`** — the two dimensions. For most matrices, axis 1 = service, axis 2 = city. The skill is agnostic to dimension semantics but reads from `site-info.md` → "Matrix axes" for naming.
- **`primary_keyword`** — the target keyword for this cell. Must be unique across the matrix (no two cells targeting the same keyword).
- **`local_data_file`** — path (relative to the site folder) to the unique local-data file for this cell. **REQUIRED**. The skill refuses any cell with this field empty.
- **`status`** — `ready` (skill will process) | `draft` (still gathering local data — skill skips with a flag) | `published` (skill skips silently) | `skipped` (manually excluded with reason in notes.md).

Optional columns:
- **`hero_image`** — path to a unique hero image for this cell.
- **`volume`** — keyword volume from research (used for prioritization).
- **`peak_months`** — seasonality marker.

## The local-data file schema

Each cell has its own `_local-data/{cell_id}.md` file. **This is the file that makes the cell pass anti-doorway rules.** Required fields:

```markdown
---
cell_id: tapas-houston
unique_opening_words: 247  # MUST be ≥ 200 per anti-doorway rule 1
landmarks:
  - "Discovery Green"
  - "Memorial Park"
  - "the Heights neighborhood"
local_faqs:
  - q: "Do you cater tapas events in [specific Houston suburb]?"
    a: "[answer]"
  - q: "What's the typical guest count for a [Houston-context] tapas event?"
    a: "[answer]"
nap:
  phone: "555-555-0100"
  area_code_matches_city: true
  address: "[real address]"
testimonials:
  - name: "Maria L."
    neighborhood: "Montrose"
    quote: "[verbatim, dated, consented]"
    consent_date: "2025-11-12"
hero_image: "/images/tapas-houston-hero.jpg"
hero_image_unique: true  # MUST be true — not shared with another cell
intervention_hours: 12   # how many hours of real local-data gathering went into this cell
---

# Unique opening (≥ 200 words)

[Case study OR neighborhood reference OR real customer quote OR local stat — must be city-specific, not boilerplate-with-city-name-swap]

# City-specific details

[Anything else uniquely local — Houston-specific dietary preferences, common Houston event venues, regional pricing context]
```

If ANY of these required fields is missing or boilerplate (the skill detects boilerplate via 90%+ similarity check across cells in axis_2), the cell is rejected.

## Workflow

### Step 0 — Cron-mode detection (if invoked with `--cron`)

Cron mode is supported but discouraged for this skill — programmatic batches benefit from human approval per-batch. If invoked with `--cron`, the skill defaults to `--dry-run` mode and writes the dry-run output to `_inbox/programmatic-dry-run-{date}.md` for human review. Idempotency key: `(site, matrix-name, date)`. Audit log per `scripts/lib/audit-log.mjs` conventions.

### Step 1 — Read context (Rule 1)

Load in order:
1. `CLAUDE.md` (toolkit root)
2. `SEO_GUIDE.md` — Section 4.1 (anti-doorway rules), Section 4.2 (volume + pacing), Section 4.3 (NAP by footprint)
3. `on-page-seo.md` (every cell satisfies Tier 1)
4. `sites/[site]/site-info.md` — Footprint, NAP, Architecture pointer, Matrix axes
5. `sites/[site]/architecture.md` (REQUIRED for service-business sites with > 3 keywords per `CLAUDE.md`)
6. Resolved `references/` (root + per-site overrides)
7. The matrix CSV
8. `sites/[site]/used-keywords.md`
9. `sites/[site]/notes.md`

If any required file is missing → refuse and report which.

### Step 2 — Footprint guard

Refuse if `site-info.md` declares any of:
- `footprint: national-online` AND matrix has city axis (no localization needed; programmatic is wasted effort)
- `footprint: single-location` AND matrix has > 1 location row (use `/service` per service instead)
- `service-business: false` (programmatic on non-commercial sites = doorway pages)

### Step 3 — Matrix audit (pre-flight)

For every row with `status: ready`:
1. **Local-data file exists?** If no → flag, skip cell, write to `_inbox/programmatic-missing-localdata-{cell_id}.md`.
2. **All 6 anti-doorway requirements satisfied?** Walk the local-data file:
   - Unique opening ≥ 200 words? (parse word count)
   - Landmarks list ≥ 3 entries? (parse YAML)
   - Local FAQs ≥ 2 entries with city-specific phrasing? (parse YAML + regex check for cell axis value)
   - NAP phone matches city area code? (parse + cross-check against axis_2 region map in site-info.md)
   - Testimonials ≥ 1 with neighborhood + consent date? (parse YAML)
   - Hero image marked `hero_image_unique: true`? (parse YAML)
3. **Boilerplate detection.** Compute pairwise Jaccard similarity of the "Unique opening" section across all `ready` cells. Any pair > 0.7 similarity → flag both, refuse to ship until rewritten.
4. **Keyword cannibalization check.** Cross-reference every `primary_keyword` against `used-keywords.md`. Already-published keywords → flag, refuse.
5. **Architecture consistency.** Every cell's URL must fit the site's `architecture.md` URL pattern (catalog: `/[category]/[subcategory]/[leaf]/`; non-catalog: per architecture.md decision).

### Step 4 — Volume cap + pacing

Apply `SEO_GUIDE.md` Section 4.2 hard rules:
- Service-area: max 30 cells initial total, max 5 new per week
- Multi-location: max 50 cells total, max 5 new per week
- Single-location/national-online: not applicable to programmatic (refused at Step 2)

If batch size exceeds weekly cap → split into multiple weekly waves. Report:
```
Matrix: tapas × Houston-suburbs (11 cells ready, 9 pass uniqueness)
Footprint: service-area → 5/week max
This batch ships: 5 cells. Remaining 4 cells queued for next week's run.
```

`--override-pacing` flag bypasses the cap. Skill warns explicitly: "Override pacing flag set. Shipping N cells in one batch. Recommended ramp is 5/week — exceeding this raises algorithmic risk per Section 4.2."

### Step 5 — Per-cell SERP analysis (only for cells that passed Step 3)

For each ready cell, in parallel where possible (skill batches into groups of 5 SERP queries):
1. Search Google (incognito, target region from `site-info.md`) for `primary_keyword`.
2. Identify top 3 organic results. Skip Reddit, Quora, forums, Wikipedia, brand directories.
3. Extract: median word count, H2 outline, FAQ count, image count.
4. Note one differentiation opportunity per cell (a section the top 3 omit but the local-data file supports).

### Step 6 — Wireframe per cell (delegated to `/wireframe` per cell)

Each cell gets its own wireframe per `CLAUDE.md` Rule "wireframe before content." The skill batch-invokes `/wireframe` with the cell's parameters. Wireframes share a SKELETON template (consistent zone structure across cells) but each gets unique CONTENT slots filled from the local-data file.

### Step 7 — Per-cell content generation

For each cell, the skill follows the same Step 7+ flow as `/service`, with these batch-specific differences:

- **Voice resolution** is shared across the batch (one resolution pass), but cells in multilingual sites generate per-language fan-out per cell.
- **Internal linking** — each cell links to:
  - The parent service page (from architecture.md)
  - 2–3 sibling cells (lateral links — pillar pattern at the cell level)
  - 1–2 informational blog posts that match the cell's intent
- **Schema** — each cell's `LocalBusiness` schema uses the cell's NAP from local-data file; `areaServed` lists the specific city.
- **Unique content enforcement** — after generating each cell's body, the skill RE-RUNS the boilerplate check (Step 3 item 3) on the GENERATED CONTENT, not just the local-data file. Any cell with > 0.6 Jaccard similarity to a sibling cell's body → rejected, regenerated with explicit "increase city-specific content density" instruction.

### Step 8 — Pre-ship batch audit

Before any cell ships, validate batch-wide:
- Every cell passes Tier 1 (16 items each).
- Schema validates on every cell (Google Rich Results + Schema.org Validator).
- Voice anti-AI check passes on every cell (universal rules from `references/voice.md`).
- No keyword cannibalization within the batch (every cell's primary keyword is distinct AND distinct from `used-keywords.md`).
- Cadence check: this batch + previous 7-day publish count ≤ footprint's weekly cap.

If ANY batch-level check fails, the skill refuses to ship ANY cell. Single-cell failure flags that cell but other cells can still ship.

### Step 9 — Output

Drafts land in: `sites/[site]/_drafts/programmatic-{matrix-name}/{cell_id}/` per cell, with:
- `meta.json` — slug, primary keyword, axis values, local-data source pointer
- `wireframe.md`
- `content.md` (markdown body) or `prompt.md` (Lovable-format) depending on publishing method
- `schema.jsonld`
- Plus per-language subfolders if multilingual

Top-level batch summary at `sites/[site]/_drafts/programmatic-{matrix-name}/BATCH-SUMMARY.md`:
- Cells shipped this batch (count + IDs)
- Cells flagged + reason per cell
- Pacing report (this batch / weekly cap / cumulative this month)
- Next-batch recommendation

### Step 10 — Update trackers

- Append every shipped cell's primary keyword to `used-keywords.md` with status `draft-staged`.
- Append batch summary to `notes.md` under "Programmatic batches" heading.
- Do NOT mark cells as `status: published` in the CSV — that happens after human approval + publish. The skill marks them `staged`.

### Step 11 — Report

```
✅ Programmatic batch complete: {matrix-name}
   Site:        {site}
   Cells ready: N
   Cells passed uniqueness: M
   Cells shipped this batch: K (pacing cap applied)
   Cells flagged: P (reasons in BATCH-SUMMARY.md)
   Pacing this week: K/{cap}
   Next batch eligible: {date}
   Output: sites/{site}/_drafts/programmatic-{matrix-name}/
```

## Refusal conditions

This skill refuses to ship if:
- Site is not `service-business: true`.
- Site is `national-online` and matrix has city axis.
- Site is `single-location` and matrix has > 1 location.
- `architecture.md` missing on a service-business site with > 3 service-keywords.
- Any cell's local-data file missing any required field.
- Boilerplate similarity > 0.7 between any pair of cells.
- Keyword cannibalization detected (any matrix keyword already in `used-keywords.md`).
- Batch size exceeds weekly cap AND `--override-pacing` not set.

## Routine versioning + idempotency contract

Idempotency key per cell: `(site, cell_id, language)`. Skip cells where `_drafts/programmatic-{matrix-name}/{cell_id}/meta.json` exists with `status: staged` or `status: published` AND today's date.

The matrix CSV itself is the routine's state: a cell flips from `ready` → `staged` → `published` over its lifecycle. The skill never edits cells with `status: published` (those are live; use `/refresh` instead).

## Templates

Scaffold templates live at `templates/programmatic/`:
- `matrix.csv` — schema-correct example matrix (10 rows, partly populated)
- `_local-data/example-cell.md` — schema-correct example local-data file
- `README.md` — user-facing setup instructions for adopting programmatic batch on a new site

Run `cp -r templates/programmatic/ sites/[site]/programmatic/` to scaffold.
