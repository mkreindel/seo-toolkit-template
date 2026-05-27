# Opinions — Universal Rules (Toolkit Root)

How the toolkit handles strong opinions / hot takes in content.

> **The actual opinions for each site live in `sites/[site-name]/references/opinions.md`.** Each site MUST have its own.

---

## Resolution rule

1. The toolkit reads this file — procedural rules below.
2. The toolkit reads `sites/[site-name]/references/opinions.md` — the actual opinions.
3. **If a post would benefit from an opinion but none fits, the skill ASKS the user.** It never invents.
4. **If `sites/[site-name]/references/opinions.md` is missing or empty, the skill ships content with zero opinions** for that site — content goes safer but more generic.

---

## Universal hard rules

### Always back with a number or story
- Opinion alone is just LinkedIn noise.
- Every published opinion must reference a number from the site's `stats.md` OR a story from `stories.md`.
- "This is wrong because [number]" is the format. Not "This is wrong because I feel strongly about it."

### One strong opinion per post maximum
- A post with two strong opinions becomes a rant.
- Hard cap, regardless of post length.
- Per-site can be MORE restrictive ("zero opinions, this is a corporate brand"). Cannot be less restrictive.

### Service pages: zero opinions
- Service pages stay focused on conversion. Opinions go in blog posts.

### Be willing to lose readers
- A safe opinion converts no one.
- If an opinion would offend exactly nobody, it's not strong enough.
- The toolkit favors opinions that segment the audience — those who agree become fans, those who disagree filter themselves out (saves both parties time).

### Tied to identifiable evidence
- Vague gripes don't make the cut. "The industry is broken" — too vague.
- "67% of [thing] in [time period] do [bad pattern]" — concrete enough.
- The site's `stats.md` provides the evidence; opinions reference it.

### Update when views evolve
- Don't let a stale take ship six months after you stopped believing it.
- The skill prompts the user to **review the site's `opinions.md` quarterly**.

### Service pages: zero opinions
- Already stated above; restated because it's the most-violated rule. Opinions belong in blog posts only.

---

## Required structure for each opinion in the site's file

```markdown
## Opinion N: [the opinion in one sentence, no hedging]

- **The number / story behind it:** what makes this credible (must reference site's `stats.md` or `stories.md`).
- **The nuance:** when this opinion *doesn't* apply.
- **Fits in posts about:** [topics where this opinion belongs]
- **Last used:** YYYY-MM-DD on [URL]
```

---

## Categories of opinion worth collecting (when populating a site's file)

When filling out a site's `opinions.md`, brainstorm in these buckets:

1. **Tools / vendors** — what's overhyped, what's underrated, what you've stopped using.
2. **Pricing** — what you charge, what consultants under-charge for, what clients should walk away from.
3. **Process** — what most teams get wrong about [planning / meetings / documentation / delivery].
4. **Industry trends** — where the industry is going that other people aren't seeing yet.
5. **Hiring** — what a good [role] looks like, what credentials are signal vs. noise.
6. **Vendor evaluation** — what to look for, what to ignore, common mistakes.
7. **Client expectations** — what clients ask for they shouldn't, what they don't ask for they should.

Aim for **5–10 real opinions per site**. Each must pass: "If I publish this, who would push back? If the answer is nobody, it's not an opinion — it's a platitude."

---

> Last updated: 2026-04-30
