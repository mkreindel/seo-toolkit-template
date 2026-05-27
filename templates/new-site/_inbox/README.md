# `_inbox/` — Decisions That Need a Human

Files here are items a cron routine could not handle autonomously. The escalation contract is documented in `docs/specs/2026-05-16-agents-cruise-control-design.md` § "Escalation contract."

## How to drain

1. Open each `YYYY-MM-DD-{routine}-{topic}.md` file.
2. Read the `## What I tried` and `## What I need from you` sections.
3. Make the decision; then either:
   - Edit the routine's defaults so it can handle this case next time, OR
   - Run the skill manually with your decision as input, OR
   - Mark the item resolved with a note explaining why no action was needed.
4. Change `**Status:** OPEN` → `**Status:** RESOLVED YYYY-MM-DD`.
5. Resolved items stay here for 30 days; then auto-archive to `_inbox/_archive/`.

If `_inbox/` accumulates faster than you drain, the escalation contract is over-firing — flag in monthly triage.
