# Site Info — {Site Name}

> **Onboarded YYYY-MM-DD.** Items marked ✅ verified live; `[TODO]` need owner walkthrough.

## Basics

- **Site name:** {TODO}
- **Brand:** {TODO}
- **URL:** {TODO — https://www.example.com}
- **Platform / IDE:** {TODO — WordPress / Lovable / Webflow / Next.js / Shopify / custom}
- **Rendering:** {TODO — SSG / SSR / CSR / Hybrid}
- **CMS / dashboard URL:** {TODO}
- **Credentials location:** {TODO — Apple Passwords / 1Password / etc.}
- **Hosting:** {TODO}
- **Repo:** {TODO — GitHub URL or "no repo"}
- **Languages:** see Languages section below
- **Publishing method:** {TODO — repo-commit / cms-paste / lovable-prompt / headless-api}
- **Lovable project ID:** {TODO — UUID from your Lovable project URL, e.g., `<your-lovable-project-uuid>`. ONLY include this field if the site is on Lovable (IDE), regardless of Publishing method. Omit entirely for non-Lovable sites. Parsed by the `/lovable-deploy` skill.}
- **Publishing target details:**
  - **Live URL pattern for blog posts:** {TODO}
  - **Live URL pattern for service pages:** {TODO}
  - **Currently published pages:** {TODO — fetch from sitemap.xml}
- **Last updated:** YYYY-MM-DD

## Languages

- **Multilingual:** {TODO — true/false}
- **Primary language:** {TODO — en/es/etc.}
- **Declared languages:** (only if multilingual)

  | Code | Primary | URL pattern    | Hreflang code | Voice file              |
  |------|---------|----------------|---------------|-------------------------|
  | en   | yes     | `/[slug]`      | en            | `references/voice.en.md`|

- **x-default language:** {TODO}
- **Hreflang strategy:** {TODO — path-prefix / subdomain / country-tld}
- **Translation philosophy:** native rewrite (per CLAUDE.md multilingual rule)

## Business

- **What they do:** {TODO}
- **Target audience:** {TODO}
- **Service business:** {TODO — true/false}
- **Geographic footprint:** {TODO — single-location / multi-location / service-area / national-online / catalog}
- **Locations / service areas:** {TODO}
- **Primary services / products:** {TODO}
- **NAP:**
  - **Name:** {TODO}
  - **Address:** {TODO}
  - **Phone:** {TODO}
  - **Email:** {TODO}
- **Hours of operation:** {TODO}

## SEO baseline

- **Google Search Console:** {TODO — verified ✅/❌, property URL}
- **GSC property type:** {TODO — Domain / URL prefix}
- **Google Analytics 4:** {TODO — property ID + measurement ID}
- **Linked to GSC:** {TODO}
- **GTM container ID:** {TODO — GTM-XXXXX or "gtag.js direct"}
- **Google Business Profile:** {TODO — link, claimed ✅/❌}
- **GBP setting:** {TODO — Storefront / Service-Area / Hybrid}
- **Bing Webmaster Tools:** {TODO}
- **IndexNow enabled:** {TODO}
- **Sitemap URL:** /sitemap.xml — {TODO auto/manual/missing}
- **robots.txt:** /robots.txt — {TODO present ✅/❌}
- **Schema markup in place:** {TODO — Organization / LocalBusiness / Article / Service / FAQPage / etc.}
- **Canonical strategy:** {TODO — self-referencing / cross-domain / issues}
- **Indexed pages (latest GSC count):** {TODO}
- **Average position (last 28 days):** {TODO}
- **Top organic landing pages:** {TODO}
- **Last technical SEO audit:** {TODO — YYYY-MM-DD}
- **Keyword tool (default):** {TODO — SEMrush / Ahrefs / GSC / etc.}
- **SEMrush Position Tracking campaign:** {TODO — campaign_id if applicable}

## Keywords & competitors

- **Primary money keywords:** {TODO}
- **Top 3–5 competitors (organic):** {TODO}
- **Known keyword gaps:** {TODO}

## Backlinks (snapshot — YYYY-MM-DD)

- **Domain Authority Score:** {TODO}
- **Referring domains:** {TODO}
- **Notable backlinks:** {TODO}
- **Toxic / disavowed links:** {TODO}

## Conversion

- **What counts as a conversion:** {TODO — form fill / call / purchase / booking}
- **Conversion tracking setup:** {TODO}
- **Current conversion rate:** {TODO}
- **Primary CTAs on the site:** {TODO}

## Content

- **Publishing cadence (current):** {TODO}
- **Stage:** {TODO — new / growing / established / mature}
- **Blog cadence (target):** {TODO — e.g., "1 post per week"}
- **Service-page cadence:** {TODO}
- **Summer cadence:** {TODO — full speed / half-velocity / pause}
- **Hard pause:** {TODO — none / specific month}
- **Last 30-day publish count:** {TODO}
- **Voice override:** {TODO — root references/ (inherited) OR site-specific references/}
- **Default image source:** {TODO — Pexels / Unsplash / client-supplied / etc.}
- **Brand assets location:** {TODO — logo, colors, image library path}
- **Content owner / approver:** {TODO}

## Stakeholders

- **Client / owner contact:** {TODO}
- **Decision-maker:** {TODO}
- **Technical contact (developer):** {TODO}

## Known issues & technical debt

See [`tech-debt.md`](tech-debt.md) for the open tech debt register.

## Notes

- Folder created YYYY-MM-DD from `templates/new-site/`. Drain `[TODO]` markers before P1 drafter cron activates. See `goals.md` for current-quarter focus.
