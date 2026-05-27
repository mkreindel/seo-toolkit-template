# Tech debt register — {site-name}

> Items here are known imperfections that don't block any current work, but will cause real problems if left unattended for 3+ months. Each item lists the symptom, the root cause, the fix, and the trigger that should escalate it.

---

(none yet — items accumulate as the site grows. Quarterly `/audit` runs surface new items into this register.)

---

## How to use this file

1. **Before any significant edit** to relevant code — read TD items first.
2. **During quarterly /audit runs** — review escalation triggers.
3. **When adding new tech debt** — copy this structure:

   ```markdown
   ## TD-NNN — {one-line symptom}

   **Discovered:** YYYY-MM-DD
   **Symptom:** {what's broken or suboptimal}
   **Why it's broken (but currently harmless):** {root cause + why it doesn't block right now}
   **Why it matters anyway:** {what it costs over time}
   **Likely fix:** {what would resolve it}
   **Effort:** {time estimate}
   **Escalation trigger:** {what condition should escalate this from "deferred" to "act now"}
   ```

Tech debt that's RESOLVED gets a strike-through entry that stays in the file as historical record. Don't delete completed items.
