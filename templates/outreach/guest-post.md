# Guest-post pitch template

Drafted by `/outreach --type=guest-post --opportunity-id=CB-...` when `/competitor-backlinks` flags a publisher that accepts guest contributions (the source domain has a `/write-for-us`, `/contribute`, `/guest-post-guidelines`, or similar URL). Lowest-volume highest-quality of the 5 outreach types — a single guest post on a DA 70+ industry publication is worth ~10 normal backlinks.

---

## Subject line

`Guest post pitch: {specific-article-title}`

Examples:
- `Guest post pitch: Why most SMB AI deployments stall at the 90-day mark`
- `Guest post pitch: The pricing transparency problem in Houston catering`

DO NOT use:
- ❌ "Guest post for {site}" — generic, instant decline
- ❌ Three article ideas in the subject line — pick one
- ❌ "Following up on..." (unless this is literally a follow-up)
- ❌ "Featured contribution" / "Sponsored content" framing — different category, different inboxes

## Body (180–250 words — longer than other outreach types because the publisher needs the angle + qualification)

```
Subject: Guest post pitch: {specific-article-title}

Hi {first_name},

Read your guidelines and your recent coverage of {topic-area} — particularly
{specific recent article}. Pitching one piece I think fits your editorial
direction.

**Article:** "{proposed-article-title}"

**Angle (50 words):** {Sharp, specific angle. NOT "an overview of X" or "how
to do X." A specific argument, a specific data set, a specific contrarian
take. Example: "Most SMB AI deployments stall because the vendor stops at
implementation. The 1-in-3 we've seen succeed share one thing: a 90-day
operating-rhythm review built into the contract."}

**Why I'm the right person to write this:** {2 sentences on credibility.
Reference site's stats, time-in-industry, specific engagement count, etc.
Cite the number. Don't say "I'm an expert" — show one piece of evidence.}

**Outline (5 bullets):**
- {Section 1 — specific, with a data point or example}
- {Section 2}
- {Section 3}
- {Section 4}
- {Section 5}

**Word count:** {match publication's typical post length — usually 1200–2500}

**Drafts I've published elsewhere that show the writing style:** {2 specific
URLs of prior published work — NOT the site's own content; ideally prior
guest posts or quotes in other industry publications}

If the angle works, I can deliver a first draft within 14 days. If a different
angle on the same topic fits better, I'm open to pivoting.

{first_name}
{role}
{phone}
{site-domain}
```

## Variables resolved by `/outreach` at draft time

| Variable | Source |
|----------|--------|
| `{first_name}` | Scraped from publication's masthead or contributor page |
| `{topic-area}` | Site's primary expertise from site-info.md |
| `{specific recent article}` | `/outreach` reads publication's recent posts via Chrome MCP |
| `{proposed-article-title}` | DRAFTED, not auto-generated. The skill produces 3 title options; user picks 1 |
| `{angle}` | DRAFTED from opinions.md + stats.md — user reviews before send |
| `{credibility evidence}` | site-info.md + stats.md + memory (byline policy) |
| `{outline}` | DRAFTED — 5 bullets, each tied to a stats.md datapoint where possible |
| `{prior published work}` | site-info.md → "Prior bylines" or `notes.md` — REQUIRED. If empty, this outreach type refuses. |

## What NOT to include

- ❌ Multiple article ideas in one pitch. Editors flagged this as the #1 turnoff in every guest-post-guidelines page surveyed: "Pitch one idea per email."
- ❌ A draft attached to the first pitch. Editors do not read unsolicited drafts; they vet the angle first, then ask for a draft.
- ❌ URL to your site or to your previous content within site-domain. Prior bylines should be on OTHER publications, not the site doing the outreach.
- ❌ "I'll write whatever you want" — flexibility on the wrong topic is desperation; pitch the SPECIFIC angle you're actually qualified to write.
- ❌ References to your "SEO needs" / "backlink strategy" / "link building" — even oblique. Editors immediately decline pitches that hint at SEO motivation.
- ❌ Boilerplate: "I've written for many top publications" — name them with URLs if true; if not, omit.

## Follow-up cadence

- **+14 days, no response:** Follow-up #1.
  > "Hi {first_name}, bumping this once. If the angle isn't a fit, happy to suggest a different one — or move on if guest contributions aren't open right now."

- **+21 days, no response:** Follow-up #2 (final).
  > "Last note — if a different angle on {topic-area} would fit better, I'm at {phone}. Otherwise no follow-up from my end."

- **+30 days, no response:** `/outreach` marks `status: abandoned`. The DOMAIN goes into 180-day cooldown — guest-post editors are slow but they do remember (re-pitching within 6 months reads as desperate).

## When the publisher replies

- **"Angle works — send draft"** → write the post. Match their voice + house style. Submit by the date you committed to. Don't pad. The byline includes the site URL by their standard practice; you don't ask for it.
- **"Pitch doesn't work — try X angle"** → respond within 48 hours with the new angle as a fresh pitch using the same template structure. Most "doesn't work" responses are openings for a better-aligned pitch.
- **"We're not taking guests right now"** → mark `status: declined`. Domain re-eligible in 180 days.
- **"Submit via the form"** → use their form. Don't continue via email after the redirect.

## When the post goes live

- Append to `backlinks.md` → "Won links" with full metadata (date, source domain, DA, target page, anchor text, outreach ID).
- The URL of the published guest post counts as a "Prior published work" entry for future guest-post pitches on OTHER publications.
- DO NOT immediately pitch the same publication for a second guest post — minimum 6 months between guest contributions to the same domain (with the exception of explicit invitation from the editor).

## Refusal conditions

This template type's `/outreach` refusal contract:
- Site has no prior published bylines on other publications listed in `site-info.md` → "Prior bylines" (editors require evidence of writing capability).
- Site's `stats.md` has no entries with `methodology:` populated (guest posts need defensible data — without it, the angle isn't credible).
- The proposed angle conflicts with the site's `notes.md` → "Topics we won't write publicly about" list.
- The publisher's guest-post guidelines explicitly require unique content (most do) AND the proposed angle has been published anywhere by this site or the byline author already.
