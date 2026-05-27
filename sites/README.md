# `sites/` — Your managed sites go here

This folder is intentionally empty. You'll create one subfolder per managed site.

## Quick start

```bash
cp -r ../templates/new-site sites/my-site-slug
cd sites/my-site-slug
```

Then fill in the `{TODO}` markers, starting with `site-info.md`. See [`../templates/new-site/README.md`](../templates/new-site/README.md) for the full onboarding checklist.

## Naming convention

Use lowercase, hyphenated slugs that match what you'd want as a URL prefix. Examples:
- `acme-bakery` (a single-location food business)
- `cloudwidget-saas` (a national-online B2B SaaS)
- `north-pdx-dental` (a service-area healthcare practice)

The slug becomes the folder name + the identifier all skills use to refer to the site (`/blog acme-bakery`, `/audit cloudwidget-saas`, etc.). Avoid spaces, underscores, or capitals — they break some scripts.

## How many sites the toolkit can handle

There's no hard cap. The portfolio routines (triage, rankings, sitemap regression, GSC coverage, etc.) walk `sites/*` automatically. Practical limits:

- **3–10 sites:** comfortable manual workflow. You can think about each one individually.
- **10–30 sites:** cruise-control cron routines become essential. Daily digest aggregates everything.
- **30+ sites:** you'll want to add tier-based prioritization (cost-tier flag in `site-info.md`) so triage doesn't recommend the same handful of high-opportunity sites every month.

## What stays out of git

The `.gitignore` at the toolkit root already excludes `sites/*/_drafts/` (working files), `sites/*/_research/` (raw data dumps), and any `.env` or `.secrets/` paths. Per-site `_inbox/` is committed — those are routine outputs you may want to track.
