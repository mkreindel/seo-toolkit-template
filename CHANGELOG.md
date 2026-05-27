# Changelog

All notable changes to this toolkit are recorded here. Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows [SemVer](https://semver.org/spec/v2.0.0.html) once the toolkit reaches 1.0.0.

Cadence:
- **MAJOR** bump when a skill's input/output contract changes in a way that breaks existing site folders or scripts
- **MINOR** bump when new skills, scripts, or templates are added that don't change existing contracts
- **PATCH** bump for bug fixes, doc edits, or non-functional script refactors

Before 1.0.0, MINOR may include breaking changes (per SemVer 0.x.y convention).

## [0.1.2] — Repo hygiene + community files

### Added

- `SECURITY.md` — responsible-disclosure policy pointing to GitHub's private vulnerability reporting form.
- `CONTRIBUTING.md` — clarifies the fork-vs-contribute distinction. Most users fork and customize; methodology improvements via PR are welcome.
- `CODE_OF_CONDUCT.md` — Contributor Covenant v2.1 (canonical text).
- `.github/ISSUE_TEMPLATE/bug_report.md` + `feature_request.md` + `config.yml` — structured issue forms, with contact links to the canonical docs.
- `.github/workflows/test.yml` — GitHub Actions CI workflow running `npm test` (vitest) on push to `main` + PRs, on Node 20 and 22. Uses least-privilege token scope and concurrency-cancellation.
- `.github/dependabot.yml` — weekly version-update PRs for npm + GitHub Actions. Groups minor + patch updates into one PR per ecosystem to reduce noise.

### Changed

- (none — purely additive)

## [0.1.1] — Dual-license under MIT OR Apache 2.0

### Changed

- License changed from MIT-only to **MIT OR Apache 2.0** (dual-licensed). Downstream users may pick either license at their option.
- `LICENSE` removed; canonical license texts now live at `LICENSE-MIT` and `LICENSE-APACHE`.
- `package.json` SPDX expression updated to `(MIT OR Apache-2.0)`.
- README License section updated.

Both MIT and Apache 2.0 are permissive licenses. Companies whose legal teams require explicit patent grants prefer Apache 2.0. Code already redistributed under MIT-only (v0.1.0) retains those rights — this is an additive change, not a license downgrade.

## [0.1.0] — Initial template release

First public release. All personal/specific data stripped. Folder examples use placeholder slugs `site-a`, `site-b`, `site-c`.

### Included skills (20+)

**Content generation:** `/blog`, `/service`, `/refresh`, `/comparison`, `/alternative`, `/case-study`, `/pricing`, `/integrations`, `/glossary`, `/cluster`, `/programmatic-batch`

**Auditing + measurement:** `/audit`, `/triage`, `/wireframe`, `/serp-features`, `/semrush-baseline`

**Off-page + outreach:** `/haro`, `/broken-backlinks`, `/competitor-backlinks`

**Deploy automation:** `/lovable-deploy`

### Included cron-fired routines (scripts/)

Daily, weekly, monthly, and quarterly routines for: keyword discovery, AI search visibility polling, Lighthouse perf polling, CrUX field-data polling, GSC coverage tracking, GBP reviews polling, GA4 anomaly detection, SEMrush ranking polling, orphan-page / broken-link detection, hreflang reciprocity validation, schema validation, sitemap regression, SERP feature gap tracking, daily digest aggregation, secrets-rotation reminder, credentials health checking, secret leak scanning.

### Documentation included

- `README.md` — entry point and quick start
- `CLAUDE.md` — rules every skill follows
- `SEO_GUIDE.md` — canonical playbook
- `WORKFLOWS.md` — cross-site platform patterns (Lovable, GSC, Vercel, Chrome MCP, API credentials)
- `on-page-seo.md` — 80+ on-page SEO signal checklist
- `templates/new-site/README.md` — onboarding checklist for adding new managed sites

### Not included in the template

- Real site data, API keys, business secrets
- Internal design specs / implementation plans (`docs/specs/` and `docs/plans/` from the original toolkit)
- Per-site `references/` voice files (you write these for your own sites)
- `architecture.md` for service-business sites with > 3 commercial keywords (template provided, content is per-site)

### Add your own

The toolkit is built to evolve. After you've onboarded 3+ sites and stabilized your own workflow:
- Add site-specific skills under `.claude/skills/`
- Add custom polling scripts under `scripts/`
- Track new arc patterns in `WORKFLOWS.md`
- Bump the version in `package.json` and add an entry here
