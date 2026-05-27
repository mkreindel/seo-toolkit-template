---
name: triage
description: Score every site in `sites/` by SEO opportunity and recommend the top 3 to focus investment on. Considers revenue potential, current authority, technical health, content gap, and conversion potential. Outputs a ranked list with rationale. Use when the user types `/triage` or asks "which sites should I focus on."
---

# `/triage` — Portfolio prioritization

Helps the user pick which sites in their portfolio deserve SEO investment this quarter. With 20+ managed sites and limited time, this is the highest-leverage decision.

## Inputs

Optional:
- **Time horizon** — `quarter` (default), `month`, `year`. Adjusts how forward-looking opportunities are weighted.
- **Capacity** — number of sites the user can realistically focus on (default: 3).
- **Filter** — optionally limit to sites matching a tag in `notes.md` (e.g., "client-work", "personal", "high-revenue").

## Workflow

### Step 0 — Cron-mode detection (if invoked with `--cron`)

If the invocation contains `--cron`, this skill runs in cron mode (no user available). Required behavior:

1. **Idempotency check:** see this skill's "Routine versioning + idempotency contract" section. If today's output already exists, exit cleanly with `exit: "idempotent-skip"`. Write one line to the audit log via `scripts/lib/audit-log.mjs` `appendRun({ exit: "idempotent-skip", ... })`.

2. **Escalation contract:** any decision that would normally prompt the user (missing required file, voice anti-AI failure, schema validation failure, keyword cannibalization, etc.) MUST be escalated by writing an item to `sites/{site}/_inbox/` via `scripts/lib/cron-mode.mjs` `writeInboxItem(...)`. After writing, exit cleanly with `exit: "escalated"`. Do NOT use `AskUserQuestion` in cron mode.

3. **Defaults:** when a choice would normally be asked, default to `site-info.md` / `goals.md` values. If both are silent on the required choice, escalate per (2).

4. **Audit log:** ALWAYS write one line to the audit log on exit — success (`shipped`), escalation (`escalated`), idempotent skip (`idempotent-skip`), or failure (`failed`).

5. **Backoff:** at the start of every cron-mode run, call `checkBackoff({ routine })` from `scripts/lib/audit-log.mjs`. If true, the routine has hit the 3-strike threshold — write `_inbox/routine-disabled-{name}.md`, run `scripts/sync-schedules.mjs --pause-routine={name}`, and exit.

### Step 1 — Read context (Rule 1)

Load every `sites/[name]/site-info.md` and `notes.md`. If any site is missing required files, flag it but don't fail.

### Step 2 — Score each site on five dimensions

For each site, compute a score 0–10 on each dimension:

#### Dimension 1: Revenue potential (weight: 30%)
- 10 = real revenue source, money-keyword rankings would meaningfully grow income
- 7 = active business, ranking gains help but aren't transformative
- 4 = side project, lifestyle business, low monetization
- 1 = vanity site, internal tool, no revenue intent

Read from `site-info.md` → Business → "What they do" + Conversion → "What counts as a conversion" + recent revenue notes.

#### Dimension 2: Current authority (weight: 20%)
Score based on `site-info.md` SEO baseline:
- 10 = > 10K monthly organic visits, DR > 40, indexed > 500 pages
- 7 = 1K–10K visits, DR 20–40, indexed 100–500
- 4 = 100–1K visits, DR < 20, indexed 20–100
- 1 = new site, < 100 visits, < 20 pages indexed

Higher-authority sites compound faster — investment pays off sooner.

#### Dimension 3: Technical health (weight: 15%)
From most recent `/audit` results in `site-info.md`:
- 10 = all 8 non-negotiables pass, Lighthouse mobile ≥ 90, no Tier 1 gaps on top pages
- 7 = minor fixes needed (1–2 non-negotiables fail or floor < score < 90)
- 4 = significant gaps (CSR Lovable site without prerender, missing schema, Lighthouse < 70)
- 1 = fundamentally broken (no sitemap, blocked by robots, manual action, mostly thin content)

Critical filter: a site scoring 1 here **gets prioritized for technical fixes regardless of other dimensions**, because content investment is wasted on a broken foundation.

#### Dimension 4: Content gap / opportunity (weight: 20%)
- 10 = strong keyword research done (high-value keywords identified), competitors rank for terms this site doesn't, clear content path forward
- 7 = some opportunity, partial keyword research
- 4 = saturated niche or thin opportunity
- 1 = no opportunity (already #1 for everything relevant, or topic is dead)

Read from `keywords.csv` row count + competitor analysis in `notes.md` if present.

#### Dimension 5: Conversion potential (weight: 15%)
- 10 = clear conversion path documented (CTAs, form, booking system) + tracking working
- 7 = partial setup, conversions counted but not optimized
- 4 = weak CTAs, no tracking, no clear path
- 1 = no conversion infrastructure (rankings would generate traffic but no revenue capture)

Read from `site-info.md` → Conversion section.

### Step 3 — Compute weighted score

`Total = (Revenue × 0.30) + (Authority × 0.20) + (Technical × 0.15) + (ContentGap × 0.20) + (Conversion × 0.15)`

Score range: 1.0 to 10.0.

### Step 4 — Apply filters and special rules

- **Critical technical issue (Dimension 3 = 1):** site jumps to top of "fix first" list, separate from main ranking.
- **Hard pause flag** in `site-info.md`: site removed from ranking entirely.
- **Filter argument:** restrict ranking to sites matching the tag.
- **Architecture gap (`SEO_GUIDE.md` Section 2.6):** any site with `service-business: true` AND > 3 rows in `service-keywords.csv` AND no `architecture.md` gets an inline flag in its rationale: `⚠️ Missing transactional architecture — required before next /service run.` This doesn't change the score but surfaces the planning blocker so it's visible at the recommendation stage.

### Step 4.5 — Compute goal-progress per site (T2-J)

For each site in `sites/*`:

1. Read `sites/{site}/goals.md`. Parse the `## Success metrics` section into a list of `{metric, target}` pairs.
2. For each metric, attempt to measure the current value:
   - **"Blog count: N+ new posts"** → count entries in `used-keywords.md` shipped since quarter-start (parse the "Shipped — blog posts" section).
   - **"Primary keyword rank: top-N for X"** → if SEMrush API configured, query Position Tracking; otherwise mark `cannot-measure-automatically`.
   - **"Backlinks: ≥N total in Referring Domains"** → if SEMrush API configured, query backlinks endpoint.
   - **"GSC indexed pages: ≥N"** → query GSC API coverage endpoint (uses GSC_OAUTH_REFRESH_TOKEN).
   - **"Sitemap grows from N → M URLs"** → diff live sitemap.xml count against the target.
   - **Free-text metrics** (e.g., "GBP reviews: ≥5 by end of month") → mark `cannot-measure-automatically`; user fills in monthly.
3. Compute "% to target" where possible: `current / target * 100`, clamped to 100% for the "exceeded" case.
4. Assign visual indicator:
   - ✅ on track (>= 80%)
   - ⚠️ behind (50–79%)
   - ⏸️ off-track (< 50%)
   - 🔵 exceeded (> 100%)
   - ❓ cannot-measure-automatically (free-text or API unavailable)

### Step 5 — Generate ranked list + rationale

Output format:

```markdown
# Portfolio triage — [date]

**Capacity:** [N] sites | **Horizon:** [quarter/month/year]

## Fix-first (technical issues blocking content investment)

| Site | Score | Critical issue |
|------|-------|---------------|
| [name] | 1.0 (Dim 3) | [e.g., CSR Lovable site, no sitemap] |

## Top [N] for SEO investment this [horizon]

### 1. [site-name] — total score: [X.X]
- **Revenue potential:** [score]/10 — [one sentence rationale]
- **Authority:** [score]/10 — [details]
- **Technical:** [score]/10 — [recent audit summary]
- **Content gap:** [score]/10 — [keyword opportunity summary]
- **Conversion:** [score]/10 — [conversion infrastructure status]
- **Recommended next 3 actions:** [bulleted, specific — if `Architecture gap` flag is present, "Create `architecture.md` from `templates/architecture.md`" is action #1]

### 2. [site-name] — total score: [X.X]
[same structure]

### 3. [site-name] — total score: [X.X]
[same structure]

## Park (don't invest this [horizon])

[remaining sites, listed with one-sentence reason]

## Suggested cadence across the top 3

- **Site 1 (highest score):** [N posts/week + service pages + off-page actions]
- **Site 2:** [allocation]
- **Site 3:** [allocation]

Aggregate publishing across the 3 should fit the user's realistic weekly capacity.

## Goal-progress per site (T2-J)

For each site, list each goals.md success metric with current value and indicator:

### [site-name]

- ✅ Blog count: 5 / 8 posts (63%)
- ⚠️ Primary keyword rank: SEMrush API rate-limited this run (recheck next cycle)
- ⏸️ Backlinks: 3 / 7 (43%) — accelerate before quarter-end
- 🔵 GSC indexed pages: 18 / 17 (106% — exceeded)
- ❓ GBP reviews: 2 / 5 (free-text metric; manual verification)
```

### Step 6 — Save results

Write to `triage-[YYYY-MM-DD].md` at the toolkit root (gitignored if user prefers). Don't overwrite previous triages — keep a history for trend analysis.

### Step 7 — Quarterly re-run reminder

If most recent triage was > 90 days ago, flag this. If ≤ 90 days, note "Last triage: [date] — re-run only if portfolio composition changed."

## Routine versioning + idempotency contract

This skill participates in cruise-control via `--cron` mode. When invoked by cron:

1. **Stamp `routine_version`** in every output (the `_triage/YYYY-MM.md` cross-site summary frontmatter, per-site `notes.md` triage-rank entry, the audit log line via `scripts/lib/audit-log.mjs`). Current `routine_version`: **1.0**.

2. **Idempotency:** this skill MUST be safe to run twice in the same month without producing duplicate work. Implementation: check whether `_triage/{YYYY-MM}.md` already exists for the current month; if so, exit cleanly with `exit: "idempotent-skip"`. The monthly summary is meant to be generated once on the 1st of the month.

3. **Goal-progress computation** (T2-J from spec): the cron-mode run reads each site's `goals.md` and computes "% to target" per success metric, integrated into the per-site recommendation in the triage output.

Reference: `docs/specs/2026-05-16-agents-cruise-control-design.md` § Operational hardening O3 + § T2-J.

## Refusal conditions

- `sites/` folder is empty (no managed sites).
- All sites have `hard pause` flag (nothing to rank).
