# Voice — Universal Rules (Toolkit Root)

These rules apply to **every site** the toolkit operates on, regardless of which client/business owns it. They define what makes content read as "human and credible" vs. "AI slop" — independent of any specific persona.

> **Persona-specific voice (sentence rhythm, sample writing, banned brand-specific words, target audience, etc.) lives in `sites/[site-name]/references/voice.md`.** Each site MUST have its own.

---

## Resolution rule (how the toolkit reads voice)

When generating content for `[site-name]`:

1. **First**, the toolkit reads `references/voice.md` (this file) — universal rules below.
2. **Then**, it reads `sites/[site-name]/references/voice.md` — the persona-specific voice for that site.
3. **Both apply.** The site-specific file CANNOT relax the universal rules below — it can only add to them. (E.g., a site can add more banned words, but cannot un-ban "leverage".)
4. **If `sites/[site-name]/references/voice.md` is missing or incomplete, the skill refuses to run.** No fallback. Ask the user to create the per-site voice file first.

---

## Universal rules (apply to every voice)

### Banned words and phrases (auto-strip in pre-ship check)

These are **never** appropriate for any site, regardless of voice:

- unlock
- leverage
- seamless
- world-class
- cutting-edge
- revolutionary
- in today's fast-paced world
- delve
- navigate the complexities of
- elevate (as in "elevate your brand")
- empower (as in "empower your team")
- streamline
- harness
- robust
- comprehensive (standalone adjective; OK in "comprehensive checklist" if literally true)
- exclamation marks (zero, in any context)
- emojis (zero in body copy. Icons OK in UI per `CLAUDE.md` Design section.)

Phrase patterns banned everywhere:
- "It's worth noting that..."
- "In conclusion..."
- "At the end of the day..."
- "Hope this helps."
- "Let's dive in."
- "Without further ado..."
- "Whether you're a [X] or a [Y]..."
- "In today's [adjective] world..."

> Per-site files can ADD to this list (e.g., a site can additionally ban "synergy"). They cannot REMOVE items from it.

### Universal structure rules

- **Open with the answer, not the setup.** First paragraph delivers, not introduces.
- **Real numbers only.** Pulled from the site's `stats.md`. Never round. Never fabricate. If a needed stat doesn't exist, ask before writing around it.
- **One story per post maximum.** Pulled from the site's `stories.md`. Never invent.
- **One strong opinion per post maximum.** Pulled from the site's `opinions.md`. Must be backed by a number from `stats.md`.
- **At least one "when NOT to use / hire us"** moment per post. Biggest single anti-AI tell.
- **No throat-clearing intros.** Cut "It's important to note that...", "In this article we'll explore...", "Let's dive in."
- **One thought per sentence.** Compound sentences only when both halves carry their own weight.
- **Bold sparingly.** 2–3 bold phrases per section maximum, not every other sentence.
- **Italics rarely.** Only genuine emphasis or first use of a technical term.
- **Oxford comma: yes** (default). Per-site can override if the brand has a specific style guide preference.

### Universal heading rules

- **Sentence case headings**, not Title Case. (Per-site can override if brand requires Title Case.)
- One H1 per page (Tier 1 #3 — non-negotiable).
- Logical H2 → H3 hierarchy, never skip levels.

### Universal CTA rules

- **One direct CTA per blog post**, near the end. Service pages get multiple per `on-page-seo.md` Category 14.
- **Soft CTAs allowed in body copy** ("Here's how it works"), but only one direct ask per piece.
- **Banned closing phrases:** "In conclusion," "At the end of the day," "Hope this helps," "Let me know if you have questions."

### Universal AI-search optimization rules

These rules complement the anti-AI checklist below. Anti-AI says "don't write like AI generated this"; AI-search optimization says "structure so AI engines (Perplexity, ChatGPT, Google AI Overview, Claude.ai) cite the page well." Both matter — AI search is now ~25% of informational query volume and growing.

The 4 rules apply to **every page** the toolkit generates (blog posts, service pages, refreshed content, programmatic outputs):

1. **Q+A density.** Structure 3-5+ in-body sections (beyond the dedicated FAQ block) as explicit question→answer pairs — the heading IS a question; the paragraph below IS the answer in the first sentence. LLMs preferentially cite passages that stand alone as direct answers to questions. Prefer `## What does an AI consultant actually do?` over `## The role of AI consultants`.

2. **Citation-friendly chunking.** Paragraphs max 3 sentences. Lead each paragraph with the topic sentence — the main claim or answer. Front-load named entities (brands, places, products, people) in the sentence rather than burying them in subordinate clauses. LLMs preferentially cite paragraphs that read as standalone units.

3. **Self-contained facts.** Every paragraph must stand on its own. NO "as mentioned above," "as discussed earlier," "see the previous section," "we'll cover this later." LLMs lose context between paragraphs — write as if each paragraph is the only one cited. Restate key entities and context within the paragraph rather than referencing prior copy.

4. **Verifiable claims.** Every statistic, percentage, or numeric claim either (a) cites an external source via inline link (McKinsey, Zapier, BLS, Google's own data, public industry reports), OR (b) is internally verifiable for the site (e.g., a service page can claim "23 clients served in 2024" if the business actually has internal records — Stripe, GBP reviews, etc.). Bare unsourced numbers read as fabricated to both readers AND LLM citation engines.

These rules also help traditional Google ranking — Q+A formats trigger PAA and featured-snippet eligibility; topic-sentence chunking improves featured-snippet pull rate; verifiable claims improve E-E-A-T signals.

### Universal anti-AI checklist (run on every draft before ship)

Scan each draft. Delete or rewrite anything matching:

- [ ] Sentence starts with "In today's..."
- [ ] Paragraph opens with a rhetorical question to the reader ("Have you ever wondered...?")
- [ ] Three-item lists where one item is filler ("efficiency, scalability, and success")
- [ ] "Whether you're [persona A] or [persona B]" framing
- [ ] Conclusion paragraph that says "in conclusion" or summarizes everything just said
- [ ] No specific numbers (zero stats from site's `stats.md`, zero years, zero percentages)
- [ ] No reference to a real person, company, or place by name
- [ ] Every sentence is the same length
- [ ] No contractions (uses "do not" instead of "don't") *(unless site-specific voice mandates formal tone)*
- [ ] Reads like it could apply to any company in any industry
- [ ] Uses any banned word/phrase from the universal list above
- [ ] Has emoji or exclamation marks
- [ ] Closes with "Hope this helps" or "Let me know if you have questions"
- [ ] Tries to flatter the reader ("Great question!", "I love that you're thinking about this")
- [ ] Hedges every claim ("It might be worth considering that perhaps...")
- [ ] Pads short answers with restated context ("As I mentioned earlier..." three paragraphs in)
- [ ] No moment of "this isn't for you / we don't do this"

If any match → draft is not done. Fix or refuse to ship.

---

## What goes in the per-site `voice.md` (NOT here)

Each site's `sites/[site-name]/references/voice.md` defines:

- **Who is the voice?** — Founder name, business name, location, languages, professional background, target audience, positioning.
- **Sentence rhythm specific to this voice** — short and punchy? long and discursive? mix?
- **Vocabulary specific to this voice** — industry jargon allowed, plain English preferred, brand-specific terms.
- **Additional banned words** — beyond the universal list above (e.g., a competitor's brand name, a phrase the client hates).
- **Tone calibration** — confident vs. humble, dry vs. warm, direct vs. diplomatic.
- **Sample paragraphs** — 2–3 examples of writing that genuinely sounds like this voice.
- **"When NOT to recommend us" cues** — voice-specific honesty lines that fit this brand.

---

> Last updated: 2026-04-30
