# Broken-link replacement pitch template

Drafted by `/outreach --type=broken-link --opportunity-id=BB-...` after `/broken-backlinks` surfaces an opportunity. Sent via email to the publisher's editor / content manager. Highest-conversion cold outreach type (8–15% reply, 4–8% link-won) because you're solving the publisher's problem.

---

## Subject line

`broken link on your {specific-page-title}`

Examples:
- `broken link on your "Best AI Tools for SMBs" guide`
- `broken link on your 2024 Spanish-restaurant Houston roundup`

Do NOT:
- ❌ Add `[Heads up]` or `[Quick note]` brackets — feels markety
- ❌ Use exclamation points
- ❌ Add the publisher's name in the subject ("Hi Sarah, broken link...") — it triggers spam filters that detect personalized-but-bulk patterns

## Body (90–150 words — short is better here)

```
Subject: broken link on your {specific-page-title}

Hi {first_name},

I was reading your guide on {specific-topic} and noticed the link to
{broken-target-url} returns a 404 — looks like {broken-target-domain} took
the page down sometime in {month, year per SEMrush "last seen" field}.

I run {site-domain}, and we published {a complementary resource / our take on
the same topic / an updated version of what they were covering — pick ONE,
match the broken-target's apparent intent} at {NOT INCLUDED in the cold pitch
— include in follow-up only}.

Happy to send the URL if it would help. Either way, thought you'd want the
heads up on the broken link.

{first_name from byline policy}
{role}
{phone}
{site-domain}
```

## Variables resolved by `/outreach` at draft time

| Variable | Source |
|----------|--------|
| `{first_name}` | Manual or scraped from source domain about-page |
| `{specific-page-title}` | `/broken-backlinks` opportunity record |
| `{specific-topic}` | Source page's H1 or meta title |
| `{broken-target-url}` | `/broken-backlinks` opportunity record |
| `{broken-target-domain}` | Parsed from broken-target-url |
| `{month, year}` | `/broken-backlinks` "last seen" field |
| `{complementary resource / our take / updated version}` | Determined by `/outreach` from match-strength field |
| `{site-domain}` | Site's primary domain |

## What NOT to include

- ❌ URL of your replacement. Include only in follow-up after they reply.
- ❌ "I think you should link to..." — that's the ask, the publisher's job is to decide. Stay informational on first contact.
- ❌ More than one broken link per email. If you found 3 broken links on the same page, mention only the most prominent in the first pitch; save the others for a possible follow-up.
- ❌ "How are you doing today?" / "Hope this finds you well" — small talk is a spam signal in 2026 outreach.
- ❌ Multi-page brokeness across the same domain. One pitch = one page = one broken link.

## Follow-up cadence

- **+14 days, no response:** Follow-up #1.
  > "Hi {first_name}, just bumping this — wanted to make sure you saw the broken link on your {page-title}. Happy to drop the replacement URL if helpful; otherwise no worries."

- **+21 days, no response:** Follow-up #2 (final).
  > "Last note from me on this — {page-title} still has the {broken-target-domain} 404. Thought you'd want it on your radar. If it's not the right time, no follow-up needed from your end."

- **+30 days, no response:** `/outreach` marks `status: abandoned` in `backlinks.md`.

## When the publisher replies

Common response patterns:
- **"Yes, please send the URL"** → reply with the URL + a 1-sentence pitch on why it fits their page's existing structure. NO secondary asks. NO "we'd also love to talk about X." Send the URL, thank them, wait.
- **"Already replaced it with another source"** → mark `status: declined` with notes "publisher replaced with non-us source". Don't push.
- **"Send me details, I'll consider it"** → reply with the URL + a 2-sentence pitch on what makes the replacement page a fit + offer to provide additional context (data, screenshots, expert quote) if needed.
- **"Not interested"** → mark `status: declined`. Move on. Do not argue.
- **Auto-reply / no human reply within 30 days** → mark `status: abandoned`. Re-eligible in 180 days for a different opportunity (different broken link, different page).
