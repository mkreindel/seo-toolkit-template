# Stats — Universal Rules (Toolkit Root)

How the toolkit handles real numbers in content.

> **The actual numbers (pricing, response times, customer counts, etc.) for each site live in `sites/[site-name]/references/stats.md`.** Each site MUST have its own.

---

## Resolution rule

1. The toolkit reads this file — procedural rules below.
2. The toolkit reads `sites/[site-name]/references/stats.md` — the actual numbers.
3. **If a stat the post needs isn't in the site's `stats.md`, the skill ASKS the user.** It never fabricates.
4. **If `sites/[site-name]/references/stats.md` is missing or empty, the skill refuses to publish any content that would benefit from a real number.** Generic content without numbers reads as AI slop.

---

## Universal hard rules

### Never round
- "23 minutes" — yes
- "around 20 minutes" — no
- "$4,712" — yes
- "about $5K" — no
- "47 of 60 surveyed" — yes
- "most of those surveyed" — no

If the real number is imprecise ("varies by client", "we don't track this"), log that honestly in the site's `stats.md` and the skill will write around the topic instead of inventing.

### Never fabricate
- Every number that appears in published content must trace back to:
  - The site's `stats.md`, OR
  - An external authoritative source cited in the post (with link + date)
- If neither exists, the skill asks the user to provide the real number or removes the claim.

### Never recycle
- If the same stat appears in 5 recent posts, it starts to read like a marketing slogan, not a real fact. Vary which stats get cited across content.

### Always cite external stats
- Any number from outside the site's `stats.md` must include source + date in the prose:
  - Good: "67% of B2B buyers research a vendor's content before contacting sales (Demand Gen Report, 2024)."
  - Bad: "Most B2B buyers research before contacting sales."

### Update cadence
- The skill prompts the user to **review the site's `stats.md` quarterly**.
- When a stat changes (price, customer count, response time), update the site's `stats.md` first; the skill won't use stale numbers if the file is current.

---

## Required structure for site-level `stats.md`

Each site's `stats.md` should follow this structure (the skill expects these sections):

```markdown
# Stats — [Business Name]

## Business basics
- Founded, location, team size, languages, industries served

## Engagement / customer numbers
- Total customers, active customers, retention rate

## Engagement structure
- Average engagement length, typical size (USD), conversion rates, time-to-close

## Pricing
- Hourly rate / project minimums / retainer minimums / consultation length

## Results / performance numbers
- Outcomes the business has delivered (with consent for any named customer)

## Operational
- Response times, calls per week, posts per week, tools used

## Industry stats cited often (with source + date)
- External benchmarks the business references repeatedly

## "We don't track this" honest disclosures
- Things the business genuinely doesn't measure — admitting these is more credible than inventing
```

The skill checks for these sections. Missing sections trigger a prompt asking the user to fill them in or explicitly mark "N/A."

---

> Last updated: 2026-04-30
