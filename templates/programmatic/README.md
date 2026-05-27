# Programmatic SEO scaffold

This template adds programmatic-batch capability to a site. Programmatic SEO scales service-page production via a CSV matrix (typically services × cities) — but ONLY if every cell satisfies the six anti-doorway-page rules from `SEO_GUIDE.md` Section 4.1.

The `/programmatic-batch` skill enforces those rules and refuses to ship cells that don't pass. That refusal is the feature.

## When to adopt programmatic batch

✅ **Adopt if:**
- Site is `service-business: true`.
- Footprint is `service-area` (with > 3 cities) OR `multi-location` (with > 3 locations).
- You have (or can gather) genuinely unique local data per cell: real testimonials, real local landmarks, real local phone numbers.
- You're willing to skip cells that lack local data rather than ship boilerplate.

❌ **Don't adopt if:**
- Footprint is `single-location` (use `/service` per service instead).
- Footprint is `national-online` (no localization needed — programmatic is wasted).
- You cannot gather unique local data per cell. Programmatic without unique data = doorway pages = manual action.
- You're tempted to ship 50 cells in week 1. Read `SEO_GUIDE.md` Section 4.2 first — the pacing caps are non-negotiable.

## Setup steps

1. **Copy this scaffold into your site:**
   ```bash
   cp -r templates/programmatic/ sites/[your-site]/programmatic/
   ```

2. **Update `site-info.md` Matrix axes section.** Add:
   ```markdown
   ## Matrix axes (for /programmatic-batch)

   - **Axis 1 (rows):** Service — pulled from `service-keywords.csv`
   - **Axis 2 (cols):** City — pulled from area-served list
   - **Cell count target (initial wave):** 5–10 cells
   - **Pacing:** 5/week max (per SEO_GUIDE 4.2 service-area cap)
   ```

3. **Build the matrix CSV.** Open `matrix.csv` in the scaffold and replace the example rows with your actual service × city combinations. One row per intended page. Each row needs:
   - `cell_id` — kebab-case identifier
   - `axis_1_value` (service) + `axis_2_value` (city)
   - `primary_keyword` — the keyword this cell targets (verify it's not in `used-keywords.md`)
   - `local_data_file` — path to that cell's unique-data file
   - `status` — start every row as `draft` until its local-data file is populated

4. **Populate per-cell local data.** For every cell in the matrix:
   - Copy `_local-data/example-cell.md` to `_local-data/{cell_id}.md`.
   - Fill in EVERY required field. Don't leave any blank — the skill refuses cells with missing fields.
   - The unique opening MUST be ≥ 200 words and city-specific. No copy-paste-with-city-name-swap.
   - Landmarks list MUST be real (verify on Google Maps).
   - Local FAQs MUST be city-specific phrasing (the city name appears in the question or answer naturally).
   - NAP phone area code should match the city (or its metro region).
   - Testimonials MUST be real, with neighborhood + dated consent.
   - Hero image MUST be different from other cells' heroes.
   - Once a cell's local-data file is complete, flip its `status` in matrix.csv from `draft` to `ready`.

5. **Dry-run the matrix first:**
   ```
   /programmatic-batch --dry-run
   ```
   Reviews the uniqueness audit + pacing report WITHOUT generating drafts. Fix any flagged cells before the real run.

6. **Run the first batch:**
   ```
   /programmatic-batch
   ```
   Ships up to weekly-cap cells. Reports flagged cells with reasons.

7. **Approve + publish.** Drafts land in `_drafts/programmatic-{matrix-name}/`. Review each, ship per your site's publishing method (`repo-commit` / `cms-paste` / `lovable-prompt`).

8. **Track lifecycle.** As cells publish, manually update `matrix.csv` status from `staged` to `published`.

## Quality bar (every cell, every time)

Per `SEO_GUIDE.md` Section 4.1, every cell MUST satisfy ALL six:
1. Unique opening ≥ 200 words, city-specific
2. Local landmarks/neighborhoods mentioned naturally (≥ 3)
3. City-specific FAQs (≥ 2)
4. Real local NAP (phone area code matches city)
5. Real testimonials from customers in that city (≥ 1, with neighborhood + consent)
6. Different hero image per cell

Plus per Section 4.2:
- 800+ words minimum per cell (city pages)
- Real conversion elements (CTA, phone, form, trust signals)
- Indexed in GSC within 14 days of publish
- Earns ≥ 1 impression in GSC within 30 days

Cells that fail to earn impressions in 90 days are de-indexed candidates. Audit at 90 days; consolidate or remove.

## Common failure modes (why cells get flagged)

| Flag | Cause | Fix |
|------|-------|-----|
| `missing-local-data` | local_data_file referenced but not found | Create the file from `_local-data/example-cell.md` and populate |
| `boilerplate-detected` | Unique opening > 70% similar to another cell's opening | Rewrite to add more city-specific content density |
| `keyword-collision` | primary_keyword already in `used-keywords.md` | Pick a different long-tail variant for this cell |
| `pacing-exceeded` | Batch size > weekly cap | Split into multiple weekly waves OR use `--override-pacing` (not recommended) |
| `nap-area-mismatch` | Phone area code doesn't match city's region | Use the regional number or skip the cell |
| `hero-not-unique` | hero_image shared with another cell | Source a different photo per cell |

## Cell lifecycle

```
status: draft     ← cell exists in matrix.csv but local-data file incomplete
       ↓
status: ready     ← local-data complete; eligible for next batch
       ↓
status: staged    ← skill generated draft in _drafts/; awaiting human publish
       ↓
status: published ← cell is live on site; do not regenerate (use /refresh)
```

Cells can also be marked `status: skipped` with a reason in `notes.md` (e.g., "Katy market too small for paid service-page investment in Q2").

## Multilingual sites

If the site is multilingual, the matrix CSV represents one canonical cell per axis pair, and each cell automatically fans out to all declared languages per `CLAUDE.md` Multilingual rules. Per-language local-data files use the suffix convention: `_local-data/{cell_id}.{lang}.md` (e.g., `_local-data/tapas-houston.en.md`, `_local-data/tapas-houston.es.md`).
