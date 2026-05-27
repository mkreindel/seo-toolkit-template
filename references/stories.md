# Stories — Universal Rules (Toolkit Root)

How the toolkit handles anecdotes / case studies in content.

> **The actual stories for each site live in `sites/[site-name]/references/stories.md`.** Each site MUST have its own.

---

## Resolution rule

1. The toolkit reads this file — procedural rules below.
2. The toolkit reads `sites/[site-name]/references/stories.md` — the actual anecdotes.
3. **If a post would benefit from a story but no fitting one exists in the site's `stories.md`, the skill ASKS the user.** It never invents.
4. **If `sites/[site-name]/references/stories.md` is missing or empty, the skill ships content with zero stories** for that site — it doesn't refuse, but flags that the content reads more generic without them.

---

## Universal hard rules

### Never invent
- Every detail in a story must be real, even if names are anonymized.
- The skill cannot "make up a plausible story" to add color. If no real story fits, the post goes without one.

### Anonymize when unsure
- Default to "a client in [industry]" or "a customer in [city]" unless explicit consent exists to name them.
- The site's `stories.md` should mark each story with a "named OK" or "anonymize" flag.

### One story per post maximum
- A blog post with two stories starts to feel like a memoir.
- Hard cap, regardless of post length.
- Per-site can be MORE restrictive ("zero stories on this brand"). Cannot be less restrictive.

### Service pages: zero stories
- Service pages use **testimonials** instead — different format, different schema.
- Stories are for blog posts and refresh content only.

### Don't recycle within a tight window
- If a story appeared in a post in the last 30 days on the same site, don't reuse it. The reader thinks "didn't I just read this?"
- Track via the site's `used-keywords.md` notes column or a separate tracker.

### Get consent before naming clients publicly
- Any time a real customer/client is named in published content, the user must confirm consent exists.
- If consent is unclear, the skill anonymizes by default.

---

## Required structure for site-level `stories.md`

Each story in the site's file should include:

```markdown
## Story title (internal label, not the post headline)

- **Year:** YYYY
- **Setup:** 1–2 sentences of what was going on.
- **What happened:** the moment itself, with real numbers and names where possible.
- **Takeaway:** what the reader can learn.
- **Fits in posts about:** [list of topics this story is relevant to]
- **Naming consent:** named OK / anonymize
- **Last used:** YYYY-MM-DD on [URL] (skill updates this when the story ships in a post)
```

---

## Categories of stories worth collecting (when populating a site's file)

When sitting down to fill out a site's `stories.md`, brainstorm in these buckets:

1. **The "we got it wrong" story** — admitting failure builds trust.
2. **The unexpected win** — client who succeeded for reasons you didn't predict.
3. **The "weird industry truth" story** — niche specifics outsiders don't know.
4. **The decision that saved time** — process A vs. process B paid off.
5. **The client who wasn't a fit** — turning someone away or ending an engagement, and why. (Critical for the "when NOT to use us" universal rule from `voice.md`.)
6. **The technical surprise** — something that didn't work as documented; how you debugged.
7. **The "first time we used [tool/method]" story** — origin moments.

Aim for **5–10 real stories per site**. Less than 3 = not enough variety; the same story keeps appearing.

---

> Last updated: 2026-04-30
