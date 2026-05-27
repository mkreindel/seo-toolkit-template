# Transactional SEO Architecture — [site-name]

> Stub template. Copy to `sites/[site-name]/architecture.md` and fill in. Required for any service-business site with > 3 rows in `service-keywords.csv` (`SEO_GUIDE.md` Section 2.6 + `CLAUDE.md` Keyword research rules).
>
> **What this is:** the planned hierarchy of every commercial-intent page on the site. Three levels: Homepage (broadest intent) → Categories (one intent each) → Subcategories (more specific terms). Each row carries its monthly volume from `service-keywords.csv`. The whole document freezes URL structure for commercial pages.
>
> **Build sequence:**
> 1. Run the SERP-comparison test (Section 2.4) on every neighboring pair of keywords before committing them to two rows. If their SERPs overlap (≥ 4 of top 10), merge into one page (cluster). If not, separate rows.
> 2. Volumes pulled from the `volume` column in `service-keywords.csv`.
> 3. Sum at the end of each level to visualize where demand actually lives.
> 4. URLs commit on entry — renaming requires redirects.

## Level 0 — Homepage

Broadest commercial intent. The terms a user types when they don't yet know which sub-category they need.

| Keyword | Monthly volume | SERP-test notes |
|---------|----------------|-----------------|
| [primary homepage keyword] | [vol] | [e.g. "shares 6/10 with sibling at L1 → kept on homepage"] |
| [secondary homepage keyword] | [vol] | |
| **Total Level 0** | **[sum]** | |

## Level 1 — Categories (one page each)

One page per category, one search intent each. SERP-test must show < 4 shared URLs against any other Level-1 row, otherwise merge.

| URL | Primary keyword | Monthly volume | Parent | SERP-test notes |
|-----|-----------------|----------------|--------|-----------------|
| /services/[slug] | [keyword] | [vol] | Homepage | [e.g. "1/10 shared with /services/[other] → distinct"] |
| /services/[slug] | [keyword] | [vol] | Homepage | |
| /services/[slug] | [keyword] | [vol] | Homepage | |
| **Total Level 1** | | **[sum]** | | |

## Level 2 — Subcategories (one page each, only where SERP-test passes)

Subcategories exist only when the SERP-comparison test against the parent shows < 4 shared URLs (otherwise the keyword belongs in the parent's cluster, not a separate page).

| URL | Primary keyword | Monthly volume | Parent | SERP-test notes |
|-----|-----------------|----------------|--------|-----------------|
| /services/[parent-slug]/[child-slug] | [keyword] | [vol] | [parent URL] | [e.g. "0/10 shared with parent → separate page"] |
| /services/[parent-slug]/[child-slug] | [keyword] | [vol] | [parent URL] | |
| **Total Level 2** | | **[sum]** | | |

---

## Off-architecture / parked

Keywords from `service-keywords.csv` that exist but don't justify a page yet (low volume, weak commercial intent, or SERP-tested into an existing parent's cluster).

| Keyword | Monthly volume | Reason parked | Re-evaluate on |
|---------|----------------|---------------|----------------|
| [keyword] | [vol] | [e.g. "covered by /services/[X] cluster — SERP-test 5/10 shared on 2026-XX-XX"] | [trigger: e.g. "if volume > 500/mo"] |

---

## Maintenance

- **Adding a new commercial keyword to `service-keywords.csv`** → re-run SERP-comparison against the closest existing row → either fold into existing page (cluster), add as a sibling row, or split an existing row in two (parent + children). Update this file before the next `/service` run.
- **Quarterly review:** re-run SERP-comparison on borderline rows (the 2–3 shared ones from the original test). SERPs drift; what was borderline last quarter may now be clearly one or the other.
- **`/triage` flags this file as missing** when the site has > 3 commercial keywords without it. Creating it satisfies the gate.

## Source-of-truth references

- Methodology: `SEO_GUIDE.md` Section 2.6
- SERP-comparison test: `SEO_GUIDE.md` Section 2.4
- One-page-one-intent rule: `CLAUDE.md` → Keyword research
- Volumes pulled from: `sites/[site-name]/service-keywords.csv`
