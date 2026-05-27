# `templates/new-site/` — Skeleton for a new managed site

## How to use

```bash
cp -r templates/new-site sites/{site-name}
cd sites/{site-name}
```

Replace every `{TODO}` marker. Suggested order:

1. **`site-info.md`** — basics first (URL, platform, footprint, NAP) → SEO baseline (GSC, GA4, GTM, GBP verification) → keywords/competitors/conversion/content/stakeholders. Most TODOs fillable by visiting the live site + GSC + GA4 + SEMrush in one ~30-min walkthrough.

2. **`goals.md`** — define the current quarter's primary objective + max 3 sub-objectives + non-goals + success metrics. Without this, the monthly triage routine has nothing to anchor recommendations to.

3. **`keywords.csv`** + **`service-keywords.csv`** — populate with ≥5 rows each from SEMrush Position Tracking, GSC top-queries, or a manual seed-keyword list.

4. **`used-keywords.md`** — empty until the first post ships; `/blog` skill writes to it after a draft is shipped.

5. **`notes.md`** — leave the "Current state" scaffold; cron routines populate via `notes.md` audit entries.

6. **`tech-debt.md`** — populate as audits surface issues.

## Verify the folder is complete

```bash
ls sites/{site-name}/
```

You should see:

```
_archive/
_baselines/
_drafts/
_inbox/
goals.md
keywords.csv
notes.md
service-keywords.csv
site-info.md
tech-debt.md
used-keywords.md
```

12 files (11 above + `_inbox/README.md`).

## After resolving the TODOs — register for cruise control

Add 3 cron entries to `.claude/schedules.yml`:

```yaml
- id: {site-name}-drafter
  cron: "{cron-spec-per-site-cadence}"   # e.g., "0 9 * * 5" for Fri 9am weekly
  tz: America/Chicago
  prompt: "/blog {site-name} --cron"

- id: {site-name}-quarterly-audit
  cron: "0 8 1 1,4,7,10 *"               # Q-start day 1, 8am
  tz: America/Chicago
  prompt: "/audit {site-name} --cron"

- id: {site-name}-quarterly-semrush-baseline
  cron: "0 9 1 1,4,7,10 *"               # Q-start day 1, 9am (after audit)
  tz: America/Chicago
  prompt: "/semrush-baseline {site-name} --cron"
```

Run `node scripts/sync-schedules.mjs` to push the YAML changes to the actual `/schedule` cron entries.

Portfolio routines (triage, rankings, sitemap-regression, GSC coverage, CrUX, schema validation, hreflang reciprocity, AI search, orphans+broken-links, GBP reviews, GA4 anomaly) automatically pick up the new site by walking `sites/*`. No additional cron configuration needed for those.

## When NOT to use this template

- If the site doesn't have a real publishing cadence yet, skip the drafter cron registration. The skill will exit cleanly (per spec § Per-site cadence rules) until cadence is declared in `site-info.md`.
- If the site doesn't have SEMrush configured, skip the quarterly-semrush-baseline cron entry.
- If the site is multilingual, set `Multilingual: true` in `site-info.md` and declare per-language voice file paths. The toolkit's content skills will fan out content to every declared language.
