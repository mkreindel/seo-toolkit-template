# Backlinks — {site-name}

Per-site backlink state file. Read + written by the P2.1 backlink-acquisition skill family (`/haro`, `/broken-backlinks`, `/competitor-backlinks`, `/outreach`). Replaces ad-hoc tracking with one append-only ledger.

This file is **append-only for the cron** but **editable by the user** (e.g., to mark an outreach as failed, add a manual link, or correct a domain).

---

## Snapshot (refreshed monthly)

- **Last refreshed:** {YYYY-MM-DD}
- **Authority score (SEMrush):** {N}
- **Total referring domains:** {N}
- **Followed referring domains:** {N}
- **Total backlinks:** {N}
- **New referring domains this month:** {N}
- **Lost referring domains this month:** {N}

## Top 10 referring domains (by authority)

| Domain | DA | Type | Target page | Anchor text | First seen |
|--------|-----|------|-------------|-------------|------------|
| {example.com} | {N} | {editorial / resource / guest / mention} | {/path} | {anchor} | {YYYY-MM-DD} |

---

## Outreach pipeline

Active pitches awaiting response or follow-up. Skill appends new rows; user updates `status` as responses come in.

| ID | Type | Target | Contact | Pitch sent | Status | Follow-up due | Notes |
|----|------|--------|---------|------------|--------|---------------|-------|
| {OR-2026-001} | {haro/broken-link/resource-page/guest-post/expert-quote} | {target-domain.com} | {first.last@domain.com} | {YYYY-MM-DD} | {sent / replied / scheduled / declined / won / abandoned} | {YYYY-MM-DD} | {free text} |

**Status legend:**
- `sent` — pitch delivered, awaiting response (default for 14 days)
- `replied` — they responded, needs your action (next message, info request)
- `scheduled` — agreed to publish, awaiting their content live
- `declined` — explicit no — mark and move on (no follow-up)
- `won` — link is live, log under "Won links" below
- `abandoned` — 30 days no response, no follow-up planned — closed
- `dead` — domain/contact no longer reachable

**Cron behaviour:**
- 14 days post-`sent` with no status change → cron drafts follow-up #1 to `_inbox/outreach-followup-{ID}.md`
- 21 days post-`sent` (and no status change since follow-up #1) → cron drafts follow-up #2 (the "final" attempt)
- 30 days post-`sent` with no response → cron flips to `abandoned` and audit-logs the close

---

## Won links (ledger)

Append-only — every backlink confirmed live. Used for monthly-progress reporting (per `SEO_GUIDE.md` Section 10.3).

| Date won | Source domain | DA | Type | Target page | Anchor text | Outreach ID |
|----------|---------------|-----|------|-------------|-------------|-------------|
| {YYYY-MM-DD} | {example.com} | {N} | {editorial / resource / guest / mention} | {/path} | {anchor} | {OR-...} |

---

## Lost links

Append-only — links Google reported as removed/broken. Used to detect deliberate removal (e.g., competitor noticed your inclusion and pressured the publisher) vs. attrition.

| Date lost | Source domain | Reason | Last seen |
|-----------|---------------|--------|-----------|
| {YYYY-MM-DD} | {example.com} | {404 / removed / nofollowed / redirected} | {YYYY-MM-DD} |

---

## Banned outreach targets

User-maintained — domains you've explicitly decided NOT to pitch. Cron reads this list before drafting any outreach. Common reasons:
- Competitor-adjacent ethics conflict
- Past bad-faith interaction
- PBN / link-farm domain
- Out-of-scope vertical

| Domain | Reason | Added |
|--------|--------|-------|
| {example.com} | {free text} | {YYYY-MM-DD} |

---

## Outreach response tracking

Per-domain response history — used by the cron to deprioritize previously-failed targets and prioritize warm domains.

| Domain | Last outreach | Last outcome | Total outreach attempts | Next eligible date |
|--------|---------------|--------------|-------------------------|--------------------|
| {example.com} | {YYYY-MM-DD} | {declined / abandoned / won} | {N} | {YYYY-MM-DD — 90 days post-last for declined, never for banned, immediate for won-and-want-more} |

---

## HARO / journalist responses (last 30 days)

Append-only by the daily HARO cron. User reviews + approves in `_inbox/`; this table tracks what was approved + sent.

| Date sent | Outlet | Reporter | Topic | Pitch text (link) | Status |
|-----------|--------|----------|-------|-------------------|--------|
| {YYYY-MM-DD} | {Forbes} | {jane.doe@forbes.com} | {AI in SMB ops} | `_drafts/haro/2026-05-17-forbes-ai-smb.md` | {sent / quoted / declined} |

---

## Competitor backlink intel (refreshed monthly)

Top referring domains pointing to top-3 ranking competitors that are NOT yet pointing to your site. Sorted by acquisition probability (= number of competitors linking from that domain).

| Domain | DA | Linking to N competitors | Type | Outreach status |
|--------|-----|--------------------------|------|-----------------|
| {example.com} | {N} | {N of M competitors} | {resource / editorial / directory / guest} | {not-pitched / pitched / declined / won / banned} |

---

## Broken-link reclamation queue

Pages that link to defunct competitor URLs where your content could replace the broken link. Refreshed monthly.

| Source domain | Source URL | Broken target | Your replacement | Outreach status |
|---------------|------------|---------------|------------------|-----------------|
| {example.com} | {/path} | {competitor.com/dead-url} | {/your-page} | {not-pitched / pitched / replied / won} |

---

## Resource-page / "best of" inclusion queue

Ranking listicles that should include your site but don't. Refreshed monthly.

| Source domain | Source URL | Listicle topic | Your page to nominate | Outreach status |
|---------------|------------|----------------|------------------------|-----------------|
| {example.com} | {/best-X-tools} | {best X tools 2026} | {/your-page} | {not-pitched / pitched / replied / won} |

---

## Notes

Free-text section for site-specific outreach context: vertical-specific norms, founder relationships that affect outreach, embargoed topics, etc.
