---
name: semrush-baseline
description: Refresh a site's SEMrush snapshot — domain authority, organic traffic, keyword count, top keywords, top competitors, backlink snapshot — and append the result as a dated baseline file in the site folder. Use when the user types `/semrush-baseline {site}` or when the quarterly cron fires.
---

# `/semrush-baseline` — SEMrush quarterly snapshot

Pulls a refreshed SEMrush snapshot for a given site and writes it as `sites/{site}/semrush-baseline-YYYY-MM-DD.md` for trend comparison over time. The 7th skill in the toolkit — targeted by the 3 quarterly-semrush-baseline cron entries in `.claude/schedules.yml`.

## Inputs

Required (asked at start if not given):
- **Site** — must match a folder under `sites/[name]/`. The skill reads its `site-info.md` Keyword tool default + SEMrush Position Tracking campaign ID.

Optional:
- `--cron` flag — cron mode (no AskUserQuestion; escalate to `_inbox/` on errors).

## Workflow

### Step 0 — Cron-mode detection (if invoked with `--cron`)

If the invocation contains `--cron`, this skill runs in cron mode (no user available). Required behavior:

1. **Idempotency check:** if `sites/{site}/semrush-baseline-YYYY-MM-DD.md` for today already exists, exit cleanly with `exit: "idempotent-skip"`.
2. **Escalation contract:** any decision that would normally prompt the user (missing site-info, SEMrush API errors that persist, missing API key) MUST be escalated by writing an item to `sites/{site}/_inbox/` via `scripts/lib/cron-mode.mjs` `writeInboxItem(...)` and exiting with `exit: "escalated"`. Do NOT use `AskUserQuestion` in cron mode.
3. **Defaults:** when a choice would normally be asked, default to `site-info.md` values. If site-info is silent, escalate per (2).
4. **Audit log:** ALWAYS write one line to the audit log on exit — success (`shipped`), escalation (`escalated`), idempotent skip (`idempotent-skip`), or failure (`failed`).
5. **Backoff:** at the start of every cron-mode run, call `checkBackoff({ routine })` from `scripts/lib/audit-log.mjs`. If true, the routine has hit the 3-strike threshold — write `_inbox/routine-disabled-{site}-quarterly-semrush-baseline.md`, run `scripts/sync-schedules.mjs --pause-routine={site}-quarterly-semrush-baseline`, and exit.

### Step 1 — Read context

1. `CLAUDE.md`
2. `sites/{site}/site-info.md` — Keyword tool + SEMrush Position Tracking campaign ID
3. `sites/{site}/notes.md` Current state
4. Previous baseline (if any) — most recent `sites/{site}/semrush-baseline-*.md` for comparison

If `site-info.md` `Keyword tool (default)` is not `SEMrush` (case-insensitive), skip with `exit: "idempotent-skip"` and audit log entry "site not configured for SEMrush."

If `SEMRUSH_API_KEY` is not set in `.env`, escalate to `_inbox/` and exit.

### Step 2 — Pull SEMrush data

Via `scripts/semrush.mjs` helper (if exists) or direct SEMrush API:

- **Domain overview** (`domain_ranks` endpoint): Authority Score (AS), organic traffic, organic keywords count, paid traffic, total backlinks
- **Top 10 organic keywords** (`domain_organic` endpoint): sorted by position × volume
- **Top 5 organic competitors** (`domain_organic_organic` endpoint)
- **Position Tracking campaign delta** (if campaign ID present in site-info): current rankings vs. previous fetch

### Step 3 — Write baseline file

Save to `sites/{site}/semrush-baseline-YYYY-MM-DD.md`:

```markdown
# SEMrush baseline — {site} — YYYY-MM-DD

routine_version: 1.0
Generated: YYYY-MM-DDThh:mm:ssZ

## Overview

| Metric | Current | vs. previous baseline |
|---|---|---|
| Authority Score | N | ±N |
| Organic traffic / mo | N | ±N% |
| Organic keywords | N | ±N |
| Backlinks (total) | N | ±N |
| Referring domains | N | ±N |

## Top 10 organic keywords

| Rank | Keyword | Volume | Position | URL |
| ... |

## Top 5 organic competitors

| Domain | Common kws | Competition % | AS |
| ... |

## Position Tracking campaign delta

(if campaign ID present in site-info.md)

| Keyword | Position now | Position last quarter | Δ |
| ... |

## Notable changes vs. previous baseline

- {one-line summary of biggest moves, e.g., "AS 0 → 5 (+5)"}
- {ranking moves >5 positions}
- {keyword count delta}

## Notes

Cron next fire: {next Q-start date from schedules.yml}
```

### Step 4 — Update site-info.md Backlinks section

In cron mode: append a one-line note to the `## Backlinks (snapshot)` section with the new date + AS + RD count. Do NOT overwrite existing content; this is an append-only audit trail.

### Step 5 — Audit log

Call `appendRun({ routine: "{site}-quarterly-semrush-baseline", routineVersion: "1.0", site, durationSec, exit: "shipped", filesTouched: [baseline-file-path, "sites/{site}/site-info.md"], escalations: [] })`.

Call `recordSuccess({ routine: "{site}-quarterly-semrush-baseline" })`.

## Routine versioning + idempotency contract

This skill participates in cruise-control via `--cron` mode. When invoked by cron:

1. **Stamp `routine_version`** in every output (`semrush-baseline-YYYY-MM-DD.md` frontmatter line + audit log line + `_inbox/` item frontmatter if escalating). Current `routine_version`: **1.0**.

2. **Idempotency:** safe to run twice on the same day — if today's `semrush-baseline-YYYY-MM-DD.md` exists, exit with `idempotent-skip`. SEMrush API costs apply per call, so this matters.

Reference: `docs/specs/2026-05-16-agents-cruise-control-design.md` § Operational hardening O3.

## Refusal conditions

- Site folder doesn't exist
- `site-info.md` missing
- `Keyword tool` in site-info is not `SEMrush`
- `SEMRUSH_API_KEY` missing in `.env`
- (Cron mode only) backoff threshold reached — auto-pause + exit per Step 0
