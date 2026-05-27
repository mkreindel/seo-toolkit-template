# HARO / journalist-response pitch template

Drafted by `/haro` skill. User approves + sends via the source's response form (Featured.com, Source of Sources, Qwoted, etc.). NOT sent via email — every source has its own response submission form.

---

## Subject line (where applicable — Featured.com requires; Source of Sources is in-form only)

`{specific-angle-on-their-topic} — {brand or person name}`

Examples:
- `AI consulting ROI data from 17 SMB engagements — Site A` (matches a query about AI ROI in SMBs)
- `Houston Spanish-catering vendor — 47-event 2025 dataset — Site B`

## Body (100–200 words; match `word_count_requested` ± 20%)

```
[OPENING LINE — lead with a number from stats.md. No setup, no "Hi Jane", no
"I saw your query." The number IS the hook. Reporter will read another 20
words to see if it's real.]

[CONCRETE EXAMPLE — one anecdote from stories.md, anonymized unless consented.
1–2 sentences. Specific industry, specific outcome, specific timeframe.]

[CONTRARIAN OR SPECIFIC OPINION — backed by the number. This is what makes the
quote citable. Generic "AI is changing everything" is unusable; "We've seen
exactly 1 in 3 SMB engagements deliver positive ROI inside 90 days; the other
2 took 9 months or never reached it" is citable.]

[BYLINE LINE — per site's byline policy:
- site-a → "— Site A, advisor to {N} small businesses on AI deployment"
- site-b → "— Founder One + Founder Two, founders, Site B Spanish Catering Houston"
- site-c → "— Dr. {Name}, board-certified endocrinologist, Site C Houston"]

[CONTACT LINE — direct response method. Reporter prefers email reply > LinkedIn
DM > schedule a call. Include time zones + availability for the next 48 hours
in case the reporter needs a quick follow-up.]
```

## Variables resolved by `/haro` at draft time

| Variable | Source |
|----------|--------|
| `[OPENING LINE]` | `stats.md` — must be a real number, not rounded |
| `[CONCRETE EXAMPLE]` | `stories.md` — anonymized unless `consent: named-with-consent` |
| `[CONTRARIAN OR SPECIFIC OPINION]` | `opinions.md` — must be backed by the `[OPENING LINE]` number |
| `[BYLINE LINE]` | `site-info.md` → "Byline policy" + memory |
| `[CONTACT LINE]` | `site-info.md` → "Outreach contact" |

## What NOT to include (universal HARO killers)

- ❌ URLs in the body. Featured.com penalizes pitches with URLs. Add yours only if the reporter follows up requesting more context.
- ❌ "I think" / "I believe" / "in my opinion" — reporters need declarative statements they can quote as facts. Edge case: opinions are fine but must be marked as opinions ("Our view is...").
- ❌ Adjective stacking ("groundbreaking, revolutionary, world-class") — kills credibility instantly.
- ❌ Paragraphs longer than 3 sentences — reporters skim.
- ❌ "Happy to chat" / "Let me know if you'd like to discuss" — too soft. Be specific about availability: "Available for 15-min call Wed 2–4pm CDT; for written follow-up by EOD Thursday."

## Follow-up rules

Reporters DO NOT want HARO follow-ups. If the pitch wasn't used, the silence IS the response. Do not follow up on HARO pitches. Move on.

The skill marks status as `abandoned` 14 days post-send (shorter cadence than other outreach types because HARO has a deadline, not an open-ended response window).

## When the reporter quotes you

Update `backlinks.md` → "HARO / journalist responses" row from `status: sent` → `status: quoted` once the article publishes. Append the published article URL + the published quote (verbatim) so future drafts can reference what worked.
