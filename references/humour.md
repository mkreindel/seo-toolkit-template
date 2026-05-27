# Humour — Universal Rules (Toolkit Root)

These rules govern when humor is allowed and what shape it takes — independent of any specific voice.

> **The actual humor style for each site (dry, warm, deadpan, absurdist, none) lives in `sites/[site-name]/references/humour.md`.** Each site MUST have its own.

---

## Resolution rule

1. **First**, the toolkit reads this file — universal humor rules below.
2. **Then**, it reads `sites/[site-name]/references/humour.md` — the humor style for that site.
3. **Both apply.** Per-site can be MORE restrictive (e.g., "this site has zero humor — it's a hospital site"). It cannot relax the universal hard bans below.
4. **If `sites/[site-name]/references/humour.md` is missing, the skill assumes "no humor"** and ships content with zero humor for that site. (No refusal — humor is optional, unlike voice.)

---

## Universal hard bans (every site, every voice)

### Puns
**Banned everywhere.** No exceptions.
- No "site-seeing tour of SEO."
- No "let's get to the root cause of your tree-mendous problem."
- Per-site files cannot un-ban this.

### Sarcasm aimed at the reader
**Banned everywhere.**
- Never mock the reader for not knowing things.
- "If you're still doing X, congratulations, you're a decade behind" — never.

### Forced cleverness
**Banned everywhere.**
- No elaborate setups for a one-line payoff.
- If a sentence is funny, it's funny. If it has to be set up over three paragraphs, cut it.

### Pop culture references
**Banned everywhere.**
- They date the post within months.
- "It's like the Mandalorian, but for spreadsheets" — never.
- Per-site can add narrow exceptions if the audience is specifically a subculture.

### Insider jokes
**Banned everywhere unless the audience is verifiably specialist.**
- A joke requiring the reader to know who Matt Cutts is loses 80% of the audience.
- Industry references should land for someone 6 months in the field, not 6 years.

---

## Universal contexts where humor is ALWAYS zero

Regardless of per-site humor style:

- **Service pages** — conversion-focused, stays straight.
- **Pricing pages** — people deciding to spend money are not here to laugh.
- **Compliance / legal / medical / financial topics** — clarity only.
- **Crisis content** (incident response, security breach, refund policy, outage notices) — zero humor.
- **Testimonials and customer stories** — zero humor at the customer's expense.
- **Cold email** — at best, very dry. Never "joke-y."

Per-site humor files can NEVER override these — these are hard zeros across the toolkit.

---

## Universal frequency cap

Even on sites that allow humor:

- **Maximum one humorous moment per 800 words.**
- A blog post with two punchlines reads as a comedy attempt, not a useful resource.
- Per-site can be MORE restrictive (e.g., "max one per 1500 words" for a serious B2B brand). Cannot be less restrictive.

---

## The universal "is this humor working?" test

Before keeping any humorous line, regardless of which site:

> Would the smartest, most senior person in the reader's industry roll their eyes at this?

- Eyes rolled → cut the line.
- Small "ha, true" nod → keep it.

---

## What goes in the per-site `humour.md` (NOT here)

Each site's `sites/[site-name]/references/humour.md` defines:

- **Style:** dry / deadpan / warm / self-deprecating / absurdist / none.
- **Brand-specific patterns:** what kinds of observations land for this brand's audience.
- **Examples:** 2–3 lines that hit the right note for this voice.
- **Frequency override:** if this brand wants stricter than 1-per-800 (e.g., none, or 1-per-1500).
- **Brand-specific bans:** words/topics that are off-limits for this client (e.g., a healthcare brand may ban any joke about death; a finance brand may ban any joke about money loss).

---

> Last updated: 2026-04-30
