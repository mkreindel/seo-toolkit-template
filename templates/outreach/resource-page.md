# Resource-page inclusion pitch template

Drafted by `/outreach --type=resource-page --opportunity-id=CB-...` when `/competitor-backlinks` flags a "best [X]" listicle that links to multiple competitors but not to the site. Hardest of the 5 templates because the publisher made the editorial decision once and is rarely eager to reopen it — pitches succeed when they offer a clear angle the existing list misses.

---

## Subject line

`{specific-angle-the-list-misses} — possible addition to your {listicle-title}`

Examples:
- `Houston-specific Spanish catering — possible addition to your "Best Catering for Houston Weddings" list`
- `Vertical-specialist AI consulting — possible addition to your "Best AI Consultants for SMBs"`

Do NOT use:
- ❌ "Adding my company to your list"
- ❌ "Backlink request"
- ❌ Generic "Possible inclusion"

## Body (130–180 words)

```
Subject: {specific-angle-the-list-misses} — possible addition to your {listicle-title}

Hi {first_name},

Saw your roundup on {listicle-title} — particularly liked the way you
{specific-detail about the list's structure / a specific entry that was
well-written}. Solid resource.

Thought I'd flag {site-domain} as a possible candidate for inclusion if you
update the list. We're different from {N existing entries on the list — name
1 or 2} in that we {specific differentiator — must be testable, not a value
claim — e.g., "we operate exclusively in the Houston metro" or "we work only
with bootstrapped SMBs under $5M ARR"}.

The {one specific number from stats.md} is what I'd point at if you wanted to
evaluate whether we're the right fit.

If it's not the right time or fit, no follow-up needed. Happy to provide more
detail (screenshots, customer reference, data) if you want to dig in.

{first_name}
{role}
{phone}
{site-domain}
```

## Variables resolved by `/outreach` at draft time

| Variable | Source |
|----------|--------|
| `{first_name}` | Scraped from listicle's about-page or article byline |
| `{listicle-title}` | `/competitor-backlinks` opportunity record (source page title) |
| `{specific-detail}` | `/outreach` reads the listicle URL via Chrome MCP and surfaces one specific detail — manual approval needed before send |
| `{N existing entries}` | `/competitor-backlinks` cross-domain frequency map (which competitors are in this list) |
| `{specific differentiator}` | `site-info.md` → "Positioning" + voice.md |
| `{one specific number}` | `stats.md` — must be a real, citable number |
| `{site-domain}` | Site's primary domain |

## What NOT to include

- ❌ URL of your page. Even more critical than broken-link templates — resource-page editors get 30+ pitches per week and a URL in the first email is the fastest tell.
- ❌ "Better than {competitor X}" framing. The publisher already endorsed those competitors. Trashing their existing picks burns the relationship.
- ❌ Vague differentiators ("we focus on quality", "we deliver results"). The differentiator must be testable in 1 sentence — geography, vertical, methodology, pricing model.
- ❌ Mass-template tells: "I noticed your page", "I love your content", "your blog is amazing." The publisher hears these every day.
- ❌ "Quick question..." / "Wondering if..." soft openers — feels like setup for a longer ask.
- ❌ Pitching to more than 2 resource pages on the same domain in any 90-day window.

## Follow-up cadence

- **+14 days, no response:** Follow-up #1.
  > "Hi {first_name}, just bumping this once in case it got buried. No worries if not a fit — wanted to make sure the candidate landed on your radar."

- **+21 days, no response:** Follow-up #2 (final).
  > "Last note from me on this — happy to provide more detail on {differentiator} if helpful, otherwise I'll assume it's not the right time. Thanks for considering."

- **+30 days, no response:** `/outreach` marks `status: abandoned`. The DOMAIN goes into 180-day cooldown — but a different listicle on the same domain becomes eligible after 90 days (resource-page editors are often different people from other editors).

## When the publisher replies

- **"Send the details"** → reply with the URL + a 100-word fit note structured around the specific differentiator. Include 1 specific reference (a client testimonial / a data point) they can verify.
- **"What makes you different from {existing entry X}"** → answer the specific question in 50 words. Don't expand the pitch — they asked one question; answer one question.
- **"List is closed / not updating"** → mark `status: declined`. Domain eligible again in 180 days when they typically refresh the listicle.
- **"Submit via our form"** → use the form. Don't try to pitch via email after they redirected.

## Conversion-improving tactics

Things that move the needle on this template type:
- **A specific number in the subject line.** "47 events in 2025" beats "Houston Spanish catering."
- **Citing a SPECIFIC line from the listicle.** "Liked the bit about pricing transparency — that's rare in this space" beats "your article is great."
- **Offering something the publisher needs:** "I'd be happy to provide updated 2026 pricing if you're refreshing pricing data on these entries" — gives the publisher a reason to engage beyond your inclusion.
- **Naming a SPECIFIC competitor weakness in the list** — but only by saying what YOU do differently, not by attacking the competitor.
