# KPIs — [Site Name]

> Stub template per `SEO_GUIDE.md` Section 10.2. Copy to `sites/[site-name]/kpis.md` and fill during Phase 1 of the engagement. Archive at engagement close. Compare against actuals quarterly.

## Engagement basics

- **Engagement start date:** YYYY-MM-DD
- **Phase 1 end date (strategy delivered):** YYYY-MM-DD
- **Phase 2 monthly cadence:** N hours/month, N posts/month, N service pages/month
- **Engagement length committed:** [N months] / open-ended
- **Review cadence:** monthly progress + quarterly KPI comparison

## Baseline (90-day window ending [date])

| Metric | Value | Source |
|---|---|---|
| Organic clicks (90d) | | GSC Performance |
| Organic impressions (90d) | | GSC Performance |
| Average position | | GSC Performance |
| Indexed pages | | GSC Pages report |
| Non-branded query share | % | GSC Performance, branded queries excluded |
| Branded query share | % | GSC Performance, branded only |
| Conversion rate from organic | % | GA4 (or "not tracked yet" honestly) |
| Total conversions / month from organic | N | GA4 |
| Domain Rating (DR) | N | Ahrefs Webmaster Tools (free) |
| Referring domains | N | Ahrefs Webmaster Tools |
| Lighthouse Performance (mobile, homepage) | N | Lighthouse |
| Lighthouse SEO | N | Lighthouse |
| AI search citations (`/45-cell baseline matrix`) | N / 45 | Manual baseline matrix |

## Targets

| Horizon | Clicks | Impressions | DR | AI citations | Conversion goal |
|---|---|---|---|---|---|
| **90 days** | +50% | +100% | baseline + 2 | ≥ 1 | [conversion goal] |
| **180 days** | +100% | +200% | baseline + 5 | ≥ 5 | [conversion goal] |
| **365 days** | +200% | +400% | baseline + 10 | ≥ 15 | [conversion goal] |

Targets are conservative-realistic (the engagement can plausibly hit them), not aspirational. Adjust baseline + targets together if data shows the baseline number was wrong.

## Out of scope

Listed explicitly so scope creep is documented up front. The engagement does NOT include:

- Paid search / Google Ads
- Paid social
- Email marketing / newsletter
- Influencer marketing
- Conversion rate optimization beyond what flows from on-page SEO
- Site redesign / UX overhaul (separate engagement)
- Content production beyond [N posts / N service pages] per month
- [Other explicit exclusions]

## Conversion goal definition

**What counts as a conversion** for this engagement:
- [Concrete event — form submission / purchase / scheduled call / etc.]
- Tracked via: [GA4 event name / form provider / CRM integration]
- Validated against actuals via: [monthly review / weekly export / etc.]

## Risk factors that affect targets

Document anything that could blow the targets up or down:
- [E.g., site is on a CSR platform; rendering fixes may shift indexed-page count materially]
- [Seasonal business; targets adjusted per `peak_months` in `service-keywords.csv`]
- [Competitive landscape; named competitor recently launched aggressive SEO push]

## Quarterly comparison log

(Fill in at end of each quarter.)

| Quarter | Clicks (vs baseline) | Impressions (vs baseline) | DR | AI citations | Conversions | Notes |
|---|---|---|---|---|---|---|
| Q1 (90d) | | | | | | |
| Q2 (180d) | | | | | | |
| Q3 (270d) | | | | | | |
| Q4 (365d) | | | | | | |

## When KPIs miss

If targets are missed at a quarterly review:
1. Identify whether the cause is **execution** (we didn't ship the planned roadmap items) or **assumption** (the targets were wrong; baseline analysis missed something material).
2. If execution: re-plan the missed items into the next quarter, no fee adjustment.
3. If assumption: have a written conversation with the client about revising targets vs continuing as-is. Don't quietly let the original targets become aspirational — that's how engagements end with a bad taste.

## Source-of-truth references

- Pricing + engagement structure: `SEO_GUIDE.md` Section 10
- Baseline matrices: `sites/[site-name]/notes.md` (chronological log) + `ai-search-baseline-YYYY-MM-DD.md` (if AI search visibility tracked separately)
- Tooling: GSC, GA4, Ahrefs Webmaster Tools (free), Lighthouse
