# Expert-quote / editorial-mention pitch template

Drafted by `/outreach --type=expert-quote --opportunity-id=CB-...` when `/competitor-backlinks` flags a publisher who regularly publishes "experts say" / "according to" style content but hasn't quoted the site. The pitch offers a quotable angle on a topic the publisher is actively covering — not a request for inclusion.

---

## Subject line

`{specific-angle} — quotable data for your {publication or section name} coverage`

Examples:
- `Houston Spanish catering pricing — quotable data for your weddings coverage`
- `1-in-3 SMB AI engagement failure rate — quotable data for your AI ROI coverage`

## Body (150–200 words)

```
Subject: {specific-angle} — quotable data for your {publication} coverage

Hi {first_name},

I've been reading {publication}'s coverage of {topic-area}, and noticed
{specific recent article they wrote} included a lot of {what was strong about
it — vendor diversity, real numbers, contrarian angle}.

If you're working on more coverage in this area, here's data I haven't seen
referenced anywhere else: {one specific number from stats.md plus 1-sentence
context — e.g., "in 2025, exactly 1 in 3 of our AI engagements with SMBs
delivered positive ROI inside 90 days. The other 2/3 took 9 months or never
reached it."}.

The methodology: {2 sentences on how the number was collected — sample size,
time period, definition. Reporters can't quote numbers without methodology.}

If a quote like the above would be useful for a piece you're working on, I'm
{first_name from byline policy} at {site-domain} and happy to provide context,
attribution, or additional data. No expectation either way.

{first_name}
{role}
{phone}
{site-domain}
```

## Variables resolved by `/outreach` at draft time

| Variable | Source |
|----------|--------|
| `{first_name}` | Manual or scraped from publication's about-page |
| `{publication}` | `/competitor-backlinks` opportunity record (source domain) |
| `{topic-area}` | Site's primary expertise (`site-info.md` → "Authority" block) |
| `{specific recent article}` | `/outreach` fetches the publication's most recent article matching the site's topic via Chrome MCP — manual approval needed before send |
| `{what was strong about it}` | Reviewer note — must be specific, must reference real content |
| `{specific number + context}` | `stats.md` — real number with methodology |
| `{methodology}` | Site's notes on how stats.md numbers were collected |

## What NOT to include

- ❌ A URL to the site. Include only after they reply asking for more data.
- ❌ "I'm an expert in X" — let the data + methodology imply expertise.
- ❌ "Available for interviews / podcasts / quotes anytime" — feels like a press-release distribution-list signup, not a value offer.
- ❌ Generic "experts say" framing — the quote needs a NUMBER + methodology, not an opinion.
- ❌ More than one data point in the first pitch. One number, well-contextualized, beats five numbers crammed in.

## Follow-up cadence

- **+14 days, no response:** Follow-up #1.
  > "Hi {first_name}, bumping this in case the data on {topic} is useful for upcoming coverage. No expectation — wanted to make sure the methodology landed in your inbox."

- **+21 days, no response:** Follow-up #2 (final).
  > "Last note — if data on {specific-angle} is ever useful, I'm reachable at {phone}. Otherwise I'll stop pinging."

- **+30 days, no response:** `/outreach` marks `status: abandoned`. Domain eligible in 90 days for a different angle.

## When the publication replies

- **"Send more data"** → reply with the URL + 2-3 additional data points + methodology + offer to be quoted by name (or with the site's byline policy applied). This is the pivot to value-providing relationship.
- **"Quote attribution requirements?"** → respond with the byline format per site's policy. For site-a: "Site A" with no person name. For site-b / site-c: real founder names + role.
- **"Interview request"** → respond with availability windows. Schedule via the publication's calendar tool if offered; otherwise propose 2-3 time options.
- **Auto-reply / no reply** → mark `status: abandoned` per cadence above.

## Why this template type converts lower than broken-link

Publications have unlimited "expert" inboxes, so cold expert-quote pitches are heavily filtered. The signal that breaks through is **specific methodology behind a specific number** — reporters can't use vague claims, so a well-methodologized quote is rare enough to stand out. Sites without strong `stats.md` data shouldn't run this outreach type at all — refuse rather than send a weak pitch.

The skill enforces this: `/outreach --type=expert-quote` refuses to draft if `stats.md` doesn't contain at least one entry with `methodology:` populated.
