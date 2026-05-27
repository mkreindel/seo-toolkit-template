# Contributor recruitment outreach template

Drafted by `/outreach --type=contributor-recruitment --site={site}` when a site needs to recruit a named author for EEAT-driven byline mode (e.g., site-a's P2.5 partial-Option-A path).

Different audience and tone from the other outreach templates — this is a RECRUITMENT pitch (offering compensation for work), not a LINK pitch (asking for inclusion).

---

## Target profile (current default for site-a)

Per the P2.5 decision (2026-05-17), site-a's target contributor profile:

- **Role:** ML engineer / technical lead at a known SMB-tech company
- **Tenure:** 5+ years building production ML systems
- **Verifiable credentials:** LinkedIn-discoverable, public conference talks or technical writing preferred
- **Industry credibility:** has shipped ML in production at a recognizable company; not a "thought leader who's never deployed"
- **COI clearance:** their employer permits side-channel writing OR they're independent

Sourcing channels:
1. **LinkedIn search** — filter on title, tenure, company list (mid-stage SaaS, vertical SaaS, AI infra)
2. **Conference speaker lists** — past speakers at MLOps World, AI Engineer Summit, Data Engineering Show
3. **Public technical blog authors** — engineers actively publishing on Substack, dev.to, company engineering blogs
4. **Warm intro** — first-degree network preferred (3-5× higher response rate than cold)

## Subject line

`{specific-recognition-of-their-work} — possible writing contributor role at Site A`

Examples:
- `Loved your MLOps talk at AIES 2025 — possible contributor role at Site A`
- `Your post on SMB AI deployment metrics — possible contributor role at Site A`
- `Your work at {company} on {project} — interested in a contributor role?`

DO NOT use:
- ❌ Generic "Contributor opportunity"
- ❌ "Sponsored content opportunity" — different category, different audience
- ❌ "Quick question" — feels manipulative for a hiring pitch
- ❌ "Are you open to opportunities?" — recruiter-spam pattern

## Body (200–300 words)

```
Subject: {specific-recognition-of-their-work} — possible writing contributor role at Site A

Hi {first_name},

I {came across / was forwarded} {specific work — their conference talk, blog
post, GitHub project, Twitter thread — be specific, link not needed in cold
pitch but mention the title}. The {specific angle that resonated — naming the
take they made that you actually agreed with or learned from} was particularly
sharp.

I run Site A ({site-domain}), an advisory practice helping small and
medium businesses operationalize AI beyond the 90-day pilot stage. I'm
recruiting a named contributor to byline a portion of our published content —
specifically the {COI-blocked-categories from coi-categories.md, named
honestly — e.g., "enterprise integration work" or "the deeper technical pieces"}
where my own byline isn't a fit due to existing employment constraints.

What that looks like in practice:

- {N} pieces per month (typically blog posts, occasionally service pages)
- You'd {review + endorse + lightly edit / write yourself / co-author with our team}
  — flexible based on your bandwidth
- Your name + bio + Person schema appears on every piece bylined to you
- Topics are SMB AI deployment, MLOps, AI ROI methodology — adjacent to your
  current work but separate from your day job
- {Compensation placeholder — FILL AT SEND: "$X per published piece" OR
  "$Y/mo retainer" OR "equity advisor share"}

Why this might be interesting:

- Your byline + Person schema on site-a strengthens BOTH our content's
  EEAT signal AND your own personal-brand surface area
- We ship one piece a week consistently — predictable cadence, not surge work
- Editorial control stays with you on anything bylined to you

If the role is interesting, I'd love to set up a 30-minute conversation to
talk through scope, compensation, and how your day-job COI shakes out. If
it's not a fit, no follow-up from me.

{first_name from byline policy — Your Name for recruitment pitches}
{role}
{phone}
{site-domain}
```

## Variables resolved by `/outreach` at draft time

| Variable | Source |
|----------|--------|
| `{first_name}` | LinkedIn / about page of the recruitment target |
| `{specific work}` | Manual research — the specific piece of their work you reference |
| `{specific angle}` | Manual — the actual take you appreciated. If you can't name one, you haven't done enough research yet — don't pitch |
| `{COI-blocked-categories}` | `sites/{site}/coi-categories.md` → coi_adjacent list (in plain English, not the raw category names) |
| `{Compensation placeholder}` | Filled at send by Your Name per the compensation posture (per-post / retainer / equity / hybrid) |

## What NOT to include

- ❌ The site-a URL inside the pitch body. Contributors verify it from the signature.
- ❌ Specific compensation numbers in the cold pitch (placeholder only — discussed on the call). Avoids price-anchoring before they evaluate the role qualitatively.
- ❌ Equity numbers in the cold pitch (same reason).
- ❌ "Influencer" / "thought leader" framing — credible contributors react badly. Use "writing contributor" or "named expert author."
- ❌ "We're early-stage and growing fast" boilerplate — say something specific about site-a if you mention it at all.
- ❌ Multiple pitch angles in the same email. One ask — the writing role. Not "writing OR advising OR speaking."
- ❌ Recruitment-platform language ("opportunity," "synergy," "passionate team"). This isn't a job posting; it's a peer-to-peer ask.

## Follow-up cadence

- **+10 days, no response:** Follow-up #1. Recruitment outreach gets a SHORTER cadence than backlink outreach (10 days, not 14) because the contributor's decision window is smaller; if they didn't reply in 10 days they're either uninterested or buried.
  > "Hi {first_name}, bumping this once. If now's not the right time for a writing contributor role, no follow-up from my end. If you'd want to discuss informally on a 30-min call, my Calendly is {CALENDLY-URL}."

- **+21 days, no response:** Mark `status: abandoned` in `backlinks.md` → "Outreach pipeline" with reason `contributor-recruitment-no-response`. Re-eligible in 12 months (recruitment is more sensitive to "stop emailing me" than link outreach).

## When they reply

- **"Interested — let's talk"** → schedule a 30-min call. Send a Calendly link or 2-3 specific time options. Prepare for the call: clear compensation numbers, sample pieces (3-5 best-current site-a posts), the byline policy (link to `sites/{site}/site-info.md` "Public byline policy" section), the COI categorization (link to `coi-categories.md`).
- **"What's the compensation?"** → reply with the SPECIFIC numbers per the chosen compensation posture. Don't dodge or escalate to call-first — they need the number to evaluate before committing time.
- **"Tell me more about site-a"** → reply with a short paragraph + the 3 best-current posts as examples. Keep it under 200 words.
- **"Not interested"** → mark `status: declined`. Send a one-line "thanks, all the best" reply. Do NOT pitch again unless their situation changes (different employer, different role).
- **Out-of-office / vague no** → mark `status: abandoned`. Re-eligible in 6 months.

## When they accept

The contributor onboarding workflow (a separate skill or process):

1. Send the contributor agreement (template at `templates/legal/contributor-agreement.md` — to be created when first needed).
2. Get LinkedIn URL + headshot + bio paragraph + credentials list.
3. Create `sites/{site}/author-{contributor-slug}.md` from `sites/site-a/author-{your-slug}.md` as the template.
4. Build the `/about/{contributor-slug}` page in the Lovable project.
5. Update `MEMORY.md` `site-a-byline-policy` entry with the activation date + contributor identity.
6. Send a Slack channel / shared doc for editorial coordination.
7. Ship the first contributor-bylined post via `/blog` or `/service` — verify Person schema renders, bio block matches, byline appears on-page.

## Per-site adaptation

This template is parameterized per-site via `sites/{site}/coi-categories.md` + `sites/{site}/site-info.md`. Other sites (site-b, site-c) don't use this template because their byline policies are different:
- **site-b:** co-byline of real founders, no contributor needed
- **site-c:** real founder + medical-credentialed author, no contributor needed

If a future site needs contributor recruitment, copy this template + adapt to the site's `coi-categories.md`.
