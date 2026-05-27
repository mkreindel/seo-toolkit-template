---
name: refresh
description: Upgrade an existing blog post — re-run SERP analysis against the current top 3, refresh stats from `stats.md`, fix any Tier 1 on-page SEO gaps, update internal links to recent content, refresh the `dateModified`. Preserves the original URL and primary keyword (no cannibalization). Use when the user types `/refresh` or asks to update an existing post.
---

# `/refresh` — Existing-post refresher

Upgrades an existing published blog post in place. Often higher-leverage than writing a new post — Google rewards freshness on existing-ranking content.

## Inputs

Required:
- **Site** — must match a folder under `sites/[name]/`.
- **Post URL** — the live URL of the post to refresh.

Optional:
- **Refresh scope** — `light` (stats + internal links + `dateModified` only), `medium` (light + Tier 1 fixes + image upgrades), `heavy` (medium + section rewrites + new SERP analysis). Default: `medium`.
- **Image source** — overrides default (only if scope includes image upgrades).

## Workflow

### Step 0 — Cron-mode detection (if invoked with `--cron`)

If the invocation contains `--cron`, this skill runs in cron mode (no user available). Required behavior:

1. **Idempotency check:** see this skill's "Routine versioning + idempotency contract" section. If today's output already exists, exit cleanly with `exit: "idempotent-skip"`. Write one line to the audit log via `scripts/lib/audit-log.mjs` `appendRun({ exit: "idempotent-skip", ... })`.

2. **Escalation contract:** any decision that would normally prompt the user (missing required file, voice anti-AI failure, schema validation failure, keyword cannibalization, etc.) MUST be escalated by writing an item to `sites/{site}/_inbox/` via `scripts/lib/cron-mode.mjs` `writeInboxItem(...)`. After writing, exit cleanly with `exit: "escalated"`. Do NOT use `AskUserQuestion` in cron mode.

3. **Defaults:** when a choice would normally be asked, default to `site-info.md` / `goals.md` values. If both are silent on the required choice, escalate per (2).

4. **Audit log:** ALWAYS write one line to the audit log on exit — success (`shipped`), escalation (`escalated`), idempotent skip (`idempotent-skip`), or failure (`failed`).

5. **Backoff:** at the start of every cron-mode run, call `checkBackoff({ routine })` from `scripts/lib/audit-log.mjs`. If true, the routine has hit the 3-strike threshold — write `_inbox/routine-disabled-{name}.md`, run `scripts/sync-schedules.mjs --pause-routine={name}`, and exit.

### Step 1 — Read context (Rule 1)

Same as `/blog` Step 1.

### Step 2 — Fetch the existing post

- For `repo-commit` sites: read the source file from the site's repo (markdown/MDX).
- For other publishing methods: scrape the live URL → extract title, meta, body, schema, image references.

Identify:
- Current primary keyword (from URL slug + title)
- Current cluster (inferred from H2s + body)
- Word count, image count, internal/external links, schema present
- Last published date + last modified date (if visible)

### Step 3 — Run audit on the post

Score current state:
- Tier 1 status (which of the 16 pass / fail)
- Schema status (validates? complete?)
- Voice status (anti-AI check on existing copy)
- Stats freshness (any numbers that look stale or rounded against `stats.md`?)
- Internal links (do they still point to live URLs? are there newer related posts to link to?)
- External links (still resolve? still authoritative?)
- Length vs. current SERP top-3 median (re-run SERP analysis fresh)

Present scorecard to user.

### Step 4 — Plan refresh + approval (Rule 2)

Based on scope + audit:
- `light` → list of stat updates + internal link updates + `dateModified` bump.
- `medium` → light + specific Tier 1 fixes + image upgrades for any failing 6.4 (width/height) or 6.3 (WebP under 200KB).
- `heavy` → medium + rewritten sections (specifically: opening if it doesn't pass voice, FAQ if missing or schema-mismatched, any H2 sections that the new SERP analysis suggests are missing or off-target).

Present plan. Wait for approval.

For multilingual sites, the plan also lists which language counterparts are being refreshed. Default: refresh ALL language versions of the page in lockstep — translation drift is real and the toolkit prevents it.

### Step 4.5 — Resolve language fan-out (multilingual sites only)

Read `site-info.md` Languages section.

- **`Multilingual: false`** → skip; continue to Step 5 as a single-language refresh.
- **`Multilingual: true`**:
  1. For the post being refreshed, locate every language counterpart (use the URL pattern table from `site-info.md`). If a counterpart is missing, FLAG it as a coverage gap and refuse to refresh until either (a) the missing version is created, or (b) user explicitly confirms partial-coverage opt-in.
  2. Apply the SAME refresh scope to every language version. If only the EN version had a stat-staleness issue, still bump the ES version's `dateModified` and re-resolve its voice/anti-AI checks against the current `voice.[lang].md` rules.
  3. Drift detection: compare structural shape (H2 count, FAQ count, schema entities) between language versions. If they've drifted (one has 6 FAQs, the other has 4), surface as a refresh item.
  4. Hreflang verification: confirm reciprocal hreflang link cluster is still correct after the refresh. The slug is unchanged (per Rule preservation), so hreflang URLs should remain stable — but verify.

The refresh produces N updated drafts (one per language), each in its own `_drafts/[slug]/[lang]/` subfolder. Ship them together.

### Step 5 — Apply refresh

Critical preservation rules:
- ✅ **Same URL slug** — never change.
- ✅ **Same canonical** — preserved.
- ✅ **Same primary keyword** — never swap (cannibalization risk).
- ✅ **`datePublished` unchanged**; **`dateModified` set to today**.
- ✅ **Author byline preserved** unless explicitly asked to change.

Apply changes per scope.

**AI-search optimization retrofit (apply during refresh — `references/voice.md` Universal AI-search optimization rules):**
- If the post predates the AI-search rules (most posts shipped before 2026-05-17), assess and apply:
  - Convert 3-5 H2/H3s to explicit question form where natural (Q+A density)
  - Split paragraphs longer than 3 sentences (citation-friendly chunking)
  - Remove "as mentioned above" / "see below" references — restate context inline (self-contained facts)
  - Add inline source links to any unsourced statistics; drop unsourceable numbers (verifiable claims)
- These are **upgrade**, not preservation — explicitly tag in the refresh plan (Step 4) so the user reviews before applying. Do NOT silently rewrite a post's voice; the original voice stays.

### Step 6 — Validate (Rule 4)

Same as `/blog` Step 8, with one addition:
- ✅ **No URL change** — verify slug unchanged.
- ✅ **No primary keyword swap** — verify primary keyword unchanged.

### Step 7 — Ship per publishing method

Same as `/blog` Step 9, but as an UPDATE to existing content:
- `repo-commit` → commit to `refresh/[slug]` branch, open PR (or update directly).
- `cms-paste` → output is the updated body + meta + image replacements; user updates the existing CMS entry.
- `lovable-prompt` → output is a Lovable-ready prompt to update the existing page.
- `headless-api` → updates the existing CMS entry via API (preserves the entry ID, updates fields).

### Step 8 — Update tracker

In `used-keywords.md`, **don't append** a new row — instead, find the existing row for that primary keyword and append a "Last refreshed: YYYY-MM-DD" note. If the row doesn't exist (e.g., the post pre-dates the toolkit), add it with both dates.

### Step 9 — Report

Print:
- What changed (light / medium / heavy summary)
- Specific Tier 1 fixes applied
- New internal links added
- Stats refreshed (with old → new values)
- Lighthouse delta if checked
- Reminder: request indexing in GSC after the live update propagates.

## Routine versioning + idempotency contract

This skill participates in cruise-control via `--cron` mode. When invoked by cron:

1. **Stamp `routine_version`** in every output produced (the `notes.md` audit entry header, `_inbox/` item frontmatter, refreshed-draft folder metadata, audit log line via `scripts/lib/audit-log.mjs`). Current `routine_version`: **1.0**.

2. **Idempotency:** this skill MUST be safe to run twice on the same target URL on the same day without producing duplicate work. Implementation: check whether `notes.md` already records a refresh of this URL today; if so, exit cleanly with `exit: "idempotent-skip"`.

Reference: `docs/specs/2026-05-16-agents-cruise-control-design.md` § Operational hardening O3.

## Refusal conditions

- Post URL doesn't resolve.
- Refresh would change the primary keyword (refer user to `/blog` for new content instead).
- Refresh would change the URL slug (would create a redirect chain — user must explicitly opt in via "I accept the redirect" flag).
