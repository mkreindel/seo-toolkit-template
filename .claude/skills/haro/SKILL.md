---
name: haro
description: Pull today's journalist-query digest from the site's configured source (Featured.com, Source of Sources, Qwoted, Help a B2B Writer, or HARO if revived), match queries to the site's documented expertise (per `site-info.md` + `stats.md` + `stories.md`), auto-draft pitch responses for high-match queries, and queue them for user approval in `_inbox/`. Runs daily as a cron. Highest-velocity backlink-acquisition channel — journalist queries move on 4–24 hour windows, so daily cadence is mandatory. Use when the user types `/haro` or when the daily cron fires.
---

# `/haro` — Daily journalist-query response generator

Captures the highest-velocity backlink-acquisition opportunity: journalists actively requesting sources for stories that will publish in the next 3–14 days. A single response landing in a Forbes / WSJ / industry-outlet quote earns one DA-80+ editorial backlink — equivalent to ~6 months of organic-link attrition for a small site.

**Important context:** the original "HARO" (Help A Reporter Out) was shut down by Cision in December 2024 after a brief rebrand to "Connectively". The skill name `/haro` is retained per the v2 spec (familiar shorthand for the category), but the underlying source is configurable per site. As of 2026, the active sources are:

| Source | URL | Format | Notes |
|--------|-----|--------|-------|
| **Featured.com** (ex-Terkel) | featured.com | Web UI + daily digest email | Most popular post-HARO; ~50–150 queries/day across categories |
| **Source of Sources** | sourceofsources.com | Daily email digest | Peter Shankman's relaunch (HARO's original founder) |
| **Qwoted** | qwoted.com | Web UI | Paid (~$99/mo); journalist-vetted only |
| **Help a B2B Writer** | helpab2bwriter.com | Web UI + weekly digest | B2B-focused, lower volume |

Each site picks 1–3 sources via `site-info.md` → "Journalist sources" block.

## Inputs

Required (asked at start if not given):
- **Site** — must match a folder under `sites/[name]/`.

Optional (per-run overrides):
- **`--source=X`** — pull from only one source this run (default: all configured).
- **`--min-match-score=N`** — minimum match score to draft a response (default: 70 out of 100).
- **`--max-drafts=N`** — cap responses per run (default: 5).

## Workflow

### Step 0 — Cron-mode detection (if invoked with `--cron`)

Cron mode is the DEFAULT pattern for this skill — it's designed for daily firing. Required behavior:

1. **Idempotency check:** if `sites/{site}/_inbox/haro-responses-{date}.md` exists for today, exit with `idempotent-skip`.
2. **Escalation:** any error pulling a source (API down, auth expired, rate-limit, source ToS change) → write `_inbox/haro-source-error-{source}-{date}.md` with full error context, continue with remaining sources.
3. **Audit log:** standard `appendRun({ exit, ... })` per `scripts/lib/audit-log.mjs`.
4. **Backoff:** at start, `checkBackoff({ routine: 'haro-daily' })`. If true → pause + escalate per standard contract.

### Step 1 — Read context (Rule 1)

Load in order:
1. `CLAUDE.md`
2. `sites/{site}/site-info.md` — especially "Journalist sources" block, "Authority" block (what site is on-the-record about), "Person profile" if applicable
3. `sites/{site}/references/stats.md` — for the numbers that make a quote citable
4. `sites/{site}/references/stories.md` — for relevant anecdotes
5. `sites/{site}/references/voice.md` — for tone consistency
6. `sites/{site}/backlinks.md` — for "Banned outreach targets" + outreach history

If any required file is missing → escalate per cron contract.

### Step 2 — Source authentication check

For each source listed in `site-info.md` → "Journalist sources":
- Verify the corresponding API key / session cookie is present in `.env` (cron) or available via auth flow (interactive).
- If missing → escalate to `_inbox/haro-auth-missing-{source}.md` with setup instructions. Skip that source for this run.

Supported auth methods:
- **Featured.com:** API key in `.env` as `FEATURED_API_KEY`. Get from featured.com → Settings → API.
- **Source of Sources:** email-digest parsing (forward to `[site-specific]+sos@yourforwarder.com`; cron polls IMAP).
- **Qwoted:** session cookie scraped via Chrome MCP (Qwoted blocks API access on lower tiers).
- **Help a B2B Writer:** email-digest parsing (same pattern as Source of Sources).

### Step 3 — Pull today's queries

For each authenticated source, fetch queries submitted in the last 24 hours. Normalize to a common schema:

```yaml
- query_id: featured-2026-05-17-abc123
  source: featured
  outlet: Forbes
  reporter: jane.doe@forbes.com
  reporter_handle: "@jane_doe"
  category: "Business / AI"
  topic: "Examples of AI ROI in SMBs"
  query_body: "[full text of the journalist's request]"
  word_count_requested: 150
  deadline: 2026-05-19T17:00:00Z
  embargo: null
  preferred_credentials: "founders, AI consultants, SMB ops leaders"
  pull_time: 2026-05-17T09:00:00Z
```

### Step 4 — Match-score each query against site expertise

For each query, compute a 0–100 match score from:

| Signal | Weight |
|--------|--------|
| Topic overlap with site's "Authority" block (semantic similarity of query topic to site's documented expertise areas) | 35 |
| Preferred-credentials match (does the byline / Person profile match what the reporter wants?) | 25 |
| Available stat in `stats.md` that directly answers the query | 20 |
| Available story in `stories.md` that anecdotally answers the query | 10 |
| Outlet authority (DA 80+ = 10, DA 50–79 = 6, DA < 50 = 3) | 10 |

Threshold (default `--min-match-score=70`): only queries scoring ≥ 70 generate a draft response. Lower-scoring queries are logged in the daily summary but no draft is generated.

### Step 5 — Draft response for high-match queries

For each query above threshold, generate a draft pitch:

**Format:** 100–200 words (or `word_count_requested` ± 20%), structured as:
1. **Lead with a number** from `stats.md` — never round, never invent.
2. **One concrete example** from `stories.md` (anonymized unless consented) — 1–2 sentences.
3. **One contrarian or specific opinion** backed by the stat — the unique angle that makes the quote citable.
4. **Byline** matching the site's documented byline policy (per memory: site-a → "Site A", site-b → co-byline OK, site-c → real founder name).
5. **Contact line** with the reporter's preferred contact method.

**Voice constraints:** universal rules from `references/voice.md` apply — banned words, no exclamation marks, no AI tells. Pitch must read like a real expert wrote it, not like an AI. Run the anti-AI checklist before saving.

**No links in the pitch itself** — reporters explicitly reject pitches containing URLs as spam. The link gets included only IF the reporter follows up requesting more context.

### Step 6 — Quality refusals

Refuse to draft a pitch when:
- Query asks for credentials the site doesn't have (e.g., reporter wants "PhD in computational biology" and site has no such person).
- Query requires fabrication (the answer can't be sourced from `stats.md` or `stories.md`).
- Outlet is in `backlinks.md` "Banned outreach targets" list.
- Reporter has previously declined a pitch from this site (cross-check `backlinks.md` "Outreach response tracking").
- Query embargo or deadline already passed.

Refused queries are logged with reason in the daily summary; no draft generated.

### Step 7 — Output

Write to `sites/{site}/_inbox/haro-responses-{date}.md`:

```markdown
# HARO daily responses — {site} — {date}

Pulled {N} queries across {M} sources. Generated {K} drafts ({K2} refused).

## Drafts awaiting your approval

### 1. Forbes — Jane Doe — "Examples of AI ROI in SMBs"
**Match score:** 82
**Deadline:** 2026-05-19 17:00 UTC (48h)
**Outlet DA:** 95
**Source:** Featured.com

**Draft pitch:**
> [pitch body, 150 words]

**To send:** copy the draft into Featured.com query response field. Reply to this inbox item with `sent` to log the outreach. The skill will create the outreach pipeline row in `backlinks.md`.

---

### 2. ...

## Queries refused (logged for transparency)

- "Topic X" — Forbes — refused: no PhD-qualified author available (matching skipped)
- "Topic Y" — Outlet Z — refused: outlet in banned-list (notes.md: prior bad-faith interaction 2025-09-04)

## Queries below match threshold (≥ 50, < 70)

(no draft generated; listed for transparency)

- "Topic A" — Outlet B — score 64 (`stats.md` has no number to anchor a 150-word pitch)
- ...
```

### Step 8 — Update outreach pipeline (on user approval — separate skill)

The cron only DRAFTS. When user replies `sent` to an inbox item, a follow-up skill (`/outreach-log`) appends a row to `backlinks.md` → "Outreach pipeline" with status `sent` and the 14-day follow-up trigger.

### Step 9 — Audit log

Standard `appendRun({ exit: 'shipped' | 'idempotent-skip' | 'escalated', metadata: { queries_pulled: N, drafts_generated: K, refusals: K2 } })`.

## Refusal conditions

This skill refuses to run if:
- Site has no "Journalist sources" block in `site-info.md`.
- Site has no `references/stats.md` or `references/stories.md` (no anchor for citable pitches).
- All configured sources are unauthenticated.

## Setup checklist (one-time per site)

Before this skill can run on a new site:
1. Add to `site-info.md`:
   ```markdown
   ## Journalist sources

   - **Featured.com:** {profile_url}, API key in .env as FEATURED_API_KEY_{SITE}
   - **Source of Sources:** subscribed to digest at {forwarder_email}
   - **Authority block:** [3–5 areas this site is on-the-record about]
   - **Preferred byline format:** {per byline policy memory}
   ```
2. Add `_inbox/` to site folder if not present.
3. Add cron entry to `.claude/schedules.yml` (`portfolio-daily-haro`).
4. Add API keys to `.env` + trigger prompt (per `remote-cron-no-dotenv-access` memory — cron secrets must be in trigger prompt, not `.env`).

## Routine versioning + idempotency contract

Idempotency key: `(site, date)`. The skill runs once per site per day. Re-running on the same date skips with `idempotent-skip` and logs the score snapshot.

Routine version: `1.0.0` (2026-05-17). Increment on schema changes to `haro-responses-{date}.md` output format.
