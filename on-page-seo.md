# On-Page SEO Checklist

**17 categories · 90+ items · the complete on-page SEO spec for blog posts, service pages, category pages, and product pages.**

> Every page-generation skill (`/blog`, `/service`, `/refresh`) reads this file before generating any page.
> **Pre-page step (mandatory):** the `/wireframe` skill runs first and produces a wireframe doc that maps every applicable item below to a layout zone. Per `CLAUDE.md` "Wireframe before content" rule. The wireframe is the single artifact the page-generation skills consume — it's where on-page items get planned, not retrofitted.
> Technical SEO (sitemaps, robots.txt, Core Web Vitals) is covered separately in `CLAUDE.md` and `SEO_GUIDE.md` Section 6.
> Multilingual rules live in `CLAUDE.md` → "Multilingual sites" and `SEO_GUIDE.md` Section 4.5. Category 16 below (hreflang) is conditional — only applies to sites with `Multilingual: true` in `site-info.md`.
> Catalog / e-commerce sites also pull in Section 4.1.1 (hierarchical URLs), 9.1 (catalog schemas), and the catalog-specific patterns in 7.1.

## 1. Head & Metadata — What Google Indexes First
- [ ] **Title tag** — 50–60 chars, primary keyword near the start.
- [ ] **Meta description** — 150–160 chars, keyword + benefit + soft CTA.
- [ ] **Canonical URL** set to prevent duplicates.
- [ ] **Open Graph** — `og:title`, `og:description`, `og:image` (1200×630), `og:url`, `og:type`.
- [ ] **Twitter Card** — `summary_large_image`, title, description, image.
- [ ] **Language** attribute on `<html>` (e.g. `lang="en"`). On multilingual sites, must match the served language exactly.
- [ ] **Hreflang link cluster** *(multilingual sites only)* — see Category 16.
- [ ] **Viewport meta** tag for responsive rendering.
- [ ] **Favicon** + `apple-touch-icon`.
- [ ] **Charset meta** — `<meta charset="utf-8">`.

## 2. URL Structure — Clean, Readable, Keyword-Forward
- [ ] **Short slug** — under 60 chars.
- [ ] **Primary keyword** in the slug.
- [ ] **Hyphens** only — never underscores.
- [ ] **Lowercase** only.
- [ ] **No stop words** ("the", "a", "of") unless necessary.
- [ ] **Logical hierarchy** matches site footprint:
  - `single-location` / `national-online` → flat: `/services/[slug]`, `/blog/[slug]`
  - `multi-location` → `/locations/[city]/[service]` (or `/services/[service]/[city]`)
  - `service-area` → `/services/[service]-[city]`
  - `catalog` → hierarchical: `/[category]/[subcategory]/[product-or-page]/` per `SEO_GUIDE.md` Section 4.1.1. Slugs at every level contain that level's primary keyword.
- [ ] **Trailing slash convention is consistent** — either every URL has one or none does. Don't mix; mixing causes canonical conflicts.
- [ ] **No query strings as canonical paths** — filters, sorts, pagination should use clean URLs or be canonicalized to the parameter-free version.
- [ ] **Hierarchy mirrors `architecture.md`** (catalog footprint only) — every catalog row's URL exactly matches its position in the architecture tree. Renaming requires a 301 redirect.

## 3. Headings — Structure for Skimmers & Bots
- [ ] **Exactly one H1** per page, contains primary keyword.
- [ ] **Logical H2 → H3** hierarchy — never skip levels.
- [ ] **H2s** use supporting keywords + questions from the cluster.
- [ ] **No keyword stuffing** — write naturally.

### 3.1 Heading hierarchy by page type

The keyword-tier framing differs by what the page is doing:

| Page type | H1 | H2 | H3 |
|---|---|---|---|
| **Blog post** | Primary keyword (informational) | Cluster's secondary keywords + relevant questions | Cluster tertiary keywords, FAQ questions |
| **Service page** | Primary keyword (commercial) | Sub-aspects of the service (what's included, who it's for, pricing, FAQ) | Specific items inside each H2 |
| **Category landing (catalog site)** | Highest-traffic keyword for the category's intent | Supporting keywords from the same intent that complement the H1 | Each product or item card name |
| **Subcategory landing** | Subcategory's primary keyword (more specific than parent) | Filters or sub-aspects | Individual product cards |
| **Product / leaf page** | The product/service name (specific) | Aspects of the offering | Specs, features, related items |
| **Homepage** | Brand-level positioning + primary intent term | Each commercial pillar (what we do / who we work with / how) | Specific services, locations, or differentiators |

**Worked example — category landing page on a catalog site:**

```
H1: Casetas para perros grandes  ← highest-traffic keyword for "large dog house" intent
  H2: Modelos más vendidos       ← supporting keyword from same intent ("best-selling models")
    H3: Caseta clásica          ← actual product card
    H3: Caseta premium
    H3: Caseta económica
  H2: Por qué elegir una caseta grande  ← second supporting H2 from same intent
    H3: Espacio recomendado
    H3: Materiales recomendados
```

The category H1 isn't the brand or "Welcome to Casetas Co." — it's the search query users typed.

## 4. Copy & Body — Answer the Query, Fast
- [ ] **Primary keyword** in the first 100 words.
- [ ] **Direct answer** to the query in the first paragraph.
- [ ] **Length** matches SERP average (within 20% of top-3).
- [ ] **Short paragraphs** (1–4 sentences).
- [ ] **Readability** — 8th–10th grade level.
- [ ] **Active voice** preferred.
- [ ] **Bold key phrases** — sparingly.
- [ ] **Bullets & numbered lists** where appropriate.
- [ ] **Comparison tables** when relevant — AI search engines extract tables disproportionately (per `SEO_GUIDE.md` Section 3.6). Include at least one for commercial pages where comparison is natural.
- [ ] **Body content visible in raw HTML** — H1/H2/H3 + paragraphs render in server-fetched HTML, not only after JS hydrates. Verify via the bot-UA curl test (see Section 17). Critical for AI search bots that don't execute JavaScript. CSR sites must prerender, server-render, or inject body content per `SEO_GUIDE.md` Section 1.3.

## 5. FAQ Section — Every Blog Post
- [ ] **4–8 questions** from your keyword tool's Questions view + Google's "People Also Ask".
- [ ] **Direct answers** — 2–4 sentences each.
- [ ] **FAQ schema** (JSON-LD) applied.

## 6. Images — Every Image Is a Ranking Signal
- [ ] **Alt text** describes image + keyword where natural.
- [ ] **Filenames** — descriptive, hyphens, e.g. `emergency-plumber-toronto.webp`.
- [ ] **WebP**, compressed under 200 KB.
- [ ] **Width/height** attributes specified — prevents CLS.
- [ ] **Lazy loading** (`loading="lazy"`) for below-fold images.
- [ ] **Responsive srcset** where needed.
- [ ] **Featured/hero image** for social sharing.

## 7. Internal Links — Pass Authority Across the Site
- [ ] **3–5 internal links** per post.
- [ ] Link to **related blog posts** & **relevant service pages**.
- [ ] **Descriptive anchor text** — never "click here" or "read more".
- [ ] **Contextually placed** in body copy.
- [ ] **Breadcrumbs** on every page.

### 7.1 The seven internal-linking patterns (full catalog in `SEO_GUIDE.md` Section 5.1)

A complete site uses these seven patterns, not just the three from above. `/audit` checks for each pattern on the right page types.

- [ ] **Pattern 1 — Header dropdown / category menu.** Visible on every page. Anchors are Level-1 categories from the architecture.
- [ ] **Pattern 2 — Featured / "Destacados" section** on the home. Editorial, points to highest-priority commercial pages.
- [ ] **Pattern 3 — Footer link block.** Overflow categories + legal links. Every page.
- [ ] **Pattern 4 — Breadcrumbs.** Top of every non-home page. Hierarchical anchors. Pairs with `BreadcrumbList` schema.
- [ ] **Pattern 5 — Category → subcategory / product links.** Inside category pages, in body. Lets bots crawl down the tree.
- [ ] **Pattern 6 — Related products / related services links.** Bottom of leaf pages. Sibling page anchors.
- [ ] **Pattern 7 — Blog → transactional bridge.** Within blog post body, contextually placed. Routes informational traffic to commercial pages.

Patterns expected per page type:

| Page type | Required patterns |
|---|---|
| Home | 1, 2, 3 |
| Category landing | 1, 3, 4, 5 |
| Subcategory | 1, 3, 4, 5, 6 |
| Product / service leaf | 1, 3, 4, 6 |
| Blog post | 1, 3, 4, 7 |

## 8. External Links — Cite Authority, Don't Hoard It
- [ ] **2–3 external links** to authoritative sources (.gov, .edu, major industry).
- [ ] **Relevant** to the topic.
- [ ] Open in **new tab** with `rel="noopener"`.
- [ ] **Link relationship attributes** — apply per current Google guidance:
  - `rel="sponsored"` for paid / affiliate / sponsored links.
  - `rel="ugc"` for user-generated content (comments, forum posts, guest contributions).
  - `rel="nofollow"` for general untrusted links or when none of the above apply.
  - Multiple values allowed (e.g., `rel="sponsored noopener"`).
  - For reference: `nofollow` alone still works as a catch-all, but Google now treats `sponsored` and `ugc` as more useful semantic hints.

## 9. Schema Markup — JSON-LD in `<head>`
- [ ] **Article schema** on blog posts — use the most specific subtype:
  - `BlogPosting` for typical blog content (default for `/blog/*` posts).
  - `NewsArticle` for time-sensitive news / press releases.
  - `TechArticle` for in-depth technical content (tutorials, documentation-style posts).
  - `Article` (generic) only as a fallback when none of the above fit.
  - Required properties: `headline`, `author` (with nested `Person` schema), `datePublished`, `dateModified`, `image`, `publisher` (with nested `Organization` schema).
- [ ] **LocalBusiness schema** — use the most specific subtype available on schema.org:
  - Examples: `Plumber`, `Dentist`, `Restaurant`, `Attorney`, `AutoRepair`, `HairSalon`, `Electrician`, `MedicalBusiness`, `ProfessionalService`.
  - **Required properties:**
    - `name` (legal or DBA — match site + GBP exactly)
    - `address` (full `PostalAddress` with `streetAddress`, `addressLocality`, `addressRegion`, `postalCode`, `addressCountry`)
    - `telephone` (E.164 format: `+1-416-555-1234`)
    - `url` (canonical homepage)
    - `image` (logo or storefront photo, 1200×630 or square)
    - `priceRange` (`$`, `$$`, `$$$`, `$$$$`)
    - `openingHoursSpecification` (per day; covers regular hours)
    - `geo` (`GeoCoordinates` with `latitude`/`longitude`) — improves Maps eligibility
  - **Footprint-specific:**
    - `multi-location` → one `LocalBusiness` schema per branch page; `Organization` schema site-wide.
    - `service-area` (mobile) → add `areaServed` (array of `City` / `AdministrativeArea`) and `serviceArea` properties; omit physical storefront photo.
    - `single-location` → one schema, used site-wide.
    - `national-online` → do NOT use `LocalBusiness`; use `Organization` instead.
  - **Optional but valuable:** `aggregateRating`, `review` array, `sameAs` (social profile URLs), `paymentAccepted`, `currenciesAccepted`.
- [ ] **Service schema** on every service page:
  - **Required properties:**
    - `name` (the service — e.g., "Emergency Plumbing")
    - `serviceType` (category)
    - `provider` (nested `LocalBusiness` or `Organization` schema — the business offering it)
    - `description` (1–2 sentence summary of what's included)
    - `url` (canonical URL of the service page)
  - **Footprint-aware properties:**
    - `areaServed` (array of `City` / `AdministrativeArea` / `GeoCircle`) — required for service-area + multi-location.
    - `serviceArea` (alternative property; same intent).
  - **Conversion-supporting properties:**
    - `offers` (nested `Offer` with `price` or `priceSpecification` — even "Starting at $X" or "Free quote" is valuable).
    - `availableChannel` (`ServiceChannel` with `servicePhone` matching the page's click-to-call number).
    - `hoursAvailable` (if hours differ from main business hours, e.g., 24/7 emergency).
  - **Optional but valuable:** `aggregateRating` (if reviews specifically mention this service), `category`, `termsOfService`.
- [ ] **FAQPage schema** wherever an FAQ section exists on the visible page:
  - Use schema type `FAQPage` (not `QAPage` — different use case).
  - Each item is a `Question` with a nested `Answer` (type `Answer`).
  - **Critical: Q+A text in the schema must match the visible page content exactly.** Google penalizes mismatches and may strip rich-result eligibility.
  - **Eligibility note:** FAQ rich results are now restricted to authoritative government and health sites for most queries — most commercial sites won't get the rich result anymore. Still ship the schema regardless. It helps AI search engines parse the page.
  - **Don't use FAQPage schema for:** user-generated Q+A (use `QAPage` instead), marketing copy disguised as FAQs, single-question pages.
- [ ] **BreadcrumbList schema** on every page:
  - Schema type: `BreadcrumbList` with an array of `ListItem` entries.
  - Each `ListItem` has `position` (1-indexed), `name`, and `item` (the URL).
  - **Critical: schema breadcrumbs must match the visible breadcrumbs on the page exactly** — same labels, same order, same URLs.
  - **Common patterns:**
    - Blog post: Home → Blog → [Category] → [Post]
    - Service page: Home → Services → [Service]
    - Service+city page: Home → Services → [Service] → [City]
    - Location page: Home → Locations → [City]
- [ ] **Organization schema** site-wide (in `<head>` of every page, or at minimum the homepage):
  - Schema type: `Organization` (or more specific subtype).
  - **Required properties:**
    - `name` (legal or DBA — must match site + GBP exactly)
    - `url` (canonical homepage)
    - `logo` (full URL to logo image, ideally 600×60+ on a square or rectangular canvas)
    - `sameAs` (array of authoritative profile URLs: LinkedIn, X/Twitter, Facebook, Instagram, YouTube, Crunchbase, Wikipedia, Wikidata if applicable)
    - `contactPoint` (nested `ContactPoint` with `telephone`, `contactType`, `availableLanguage`, `areaServed` if relevant)
  - **Recommended:** `description`, `foundingDate`, `address` (`PostalAddress`), `email`, `numberOfEmployees`.
  - **Footprint note:** for `single-location` and `multi-location` sites, `LocalBusiness` schema (per location) **and** `Organization` schema (site-wide) coexist.
  - **Knowledge Panel impact:** strong `Organization` schema with `sameAs` is what feeds Google's Knowledge Panel.
- [ ] **Author/Person** schema for bylines.

### 9.1 E-commerce / catalog schemas

For sites with `catalog` footprint (Section 4.1), three additional schemas are mandatory:

- [ ] **OnlineStore schema** on the homepage:
  - Schema type: `OnlineStore` (subtype of `Organization`).
  - **Required:** `name`, `url`, `logo`, `image`, `description`, `currenciesAccepted`, `paymentAccepted`, `priceRange`.
  - **Recommended:** `sameAs`, `contactPoint`, `address`, `aggregateRating`.

- [ ] **ItemList schema** on every category and subcategory landing page:
  - Schema type: `ItemList`.
  - **Required:** `itemListElement` (array of `ListItem` with `position` + `url` for each item shown).
  - **Recommended:** `numberOfItems`, `itemListOrder`.
  - One `ListItem` per visible product/service card on the page.

- [ ] **Product schema** on every product / leaf page:
  - Schema type: `Product`.
  - **Required:** `name`, `image`, `description`, `sku` or `productID`, `offers` (nested `Offer` with `price`, `priceCurrency`, `availability`).
  - **Recommended:** `brand`, `aggregateRating`, `review` array, `gtin13` / `mpn` if applicable, `category`.
  - `offers.availability` values: `InStock`, `OutOfStock`, `PreOrder`, `Discontinued`.

### 9.2 Schema by page type — Mandatory vs Complementary

The toolkit treats some schemas as **mandatory** for a page type (the page is incomplete without them) and others as **complementary** (improve rich-result eligibility, recommended where applicable but not blockers).

| Page type | Mandatory | Complementary |
|---|---|---|
| **Home (general business)** | `Organization` (or `LocalBusiness` subtype if local), `WebSite` | — |
| **Home (catalog / e-commerce)** | `OnlineStore` + `WebSite` | — |
| **Category landing (catalog)** | `ItemList` + `BreadcrumbList` | — |
| **Subcategory landing** | `ItemList` + `BreadcrumbList` | — |
| **Product / leaf page** | `Product` + `BreadcrumbList` | `FAQPage` (if FAQ on page), `Review` |
| **Service page** | `Service` + `BreadcrumbList` | `FAQPage`, `LocalBusiness` (if location-tied), `Review` |
| **Blog post** | `BlogPosting` (or `Article` subtype) + `BreadcrumbList` + `Person` (author) | `FAQPage` (if FAQ section) |
| **Blog index** | `CollectionPage` + `BreadcrumbList` | — |
| **About / contact** | `Organization` (site-wide) | `LocalBusiness` (if local) |

**Rule:** if a page is missing a mandatory schema, `/audit` flags it as a Tier-1 fail. If missing a complementary schema, audit flags it as an opportunity, not a blocker.

**LLMs and structured data:** schema is for Google + Bing rich results. AI search crawlers don't extract JSON-LD as schema (per Section 3.6 in `SEO_GUIDE.md`). Schema doesn't help AI search citations directly — but the visible content the schema describes does, so the practice of writing rich, well-structured pages helps both channels.

## 10. E-E-A-T Signals — Experience · Expertise · Authority · Trust
- [ ] **Author byline** with name on every blog post.
- [ ] **Author bio** with credentials (years, qualifications).
- [ ] Link to **author's dedicated page**.
- [ ] **Published date** displayed.
- [ ] **"Last updated" date** when refreshed.
- [ ] **Real stories, numbers, opinions** from the business voice file.
- [ ] **Cite authoritative sources.**
- [ ] **About page** with full company credentials.
- [ ] **Contact page** — real address, phone, hours.

## 11. Accessibility — A11y Signals = SEO Signals
- [ ] **Semantic HTML5** — `<header>`, `<nav>`, `<main>`, `<article>`, `<footer>`.
- [ ] **ARIA labels** on interactive elements where needed.
- [ ] **Color contrast** meets WCAG 2.1 AA minimums:
  - **Body text (under 18px or under 14px bold):** 4.5:1 contrast against background.
  - **Large text (18px+ regular, or 14px+ bold):** 3:1 contrast against background.
  - **UI components and graphical objects** (form borders, icons, focus rings): 3:1 against adjacent colors.
  - **Aim for AAA (7:1 body, 4.5:1 large)** on accessibility-focused sites (legal, healthcare, government, education).
  - **Verify with:** Chrome DevTools → Lighthouse → Accessibility, or WebAIM Contrast Checker, or browser extension like axe DevTools.
  - **Common fail points:** light gray secondary text, brand colors on white backgrounds, placeholder text, disabled-state buttons, image-overlay text.
- [ ] **Focus indicators** visible on interactive elements.
- [ ] **Alt text** on all images (empty `alt=""` for decorative).
- [ ] **Descriptive link text**.
- [ ] **Skip-to-content** link for keyboard users.

## 12. Mobile & Responsive — Mobile-First Indexing
- [ ] **Responsive layout** — fluid across viewports (mobile, tablet, desktop). Most modern platforms (WordPress themes, Webflow, Lovable, Tailwind, Shopify themes) handle this by default; verify by resizing the browser window from 320px → 1920px.
- [ ] **Touch targets** minimum 48×48 px.
- [ ] **Body font** minimum 16 px.
- [ ] **No horizontal scroll** at any viewport.
- [ ] **No intrusive interstitials on mobile** (Google's penalty applies specifically to mobile):
  - **Penalized patterns:** popups covering main content on load, standalone interstitials the user must dismiss, above-the-fold layouts that look like a standalone interstitial, forced email/sign-up gates, forced "open in app" prompts.
  - **Allowed patterns:** legal interstitials (cookie consent, age verification — must be dismissable), login dialogs on legitimately gated content, banners using reasonable screen space and easily dismissed, exit-intent and scroll-triggered popups.
  - **Why it matters:** intrusive interstitials are a direct ranking penalty (algorithmic), not just a UX best practice.

## 13. Social Preview — Shareable Card
- [ ] **OG image** optimized — 1200×630, under 1 MB.
- [ ] **Twitter Card image** — 1200×600.
- [ ] **Compelling `og:description`** — different from meta if valuable.

## 14. Conversion Elements *(Service Pages Only)* — Capture the Lead

> Conversion-element placement is decided in the `/wireframe` step, not retrofitted after content is written. The wireframe doc at `_drafts/[slug]/wireframe.md` enumerates each item below with its zone position before any prose is generated.

- [ ] **Primary CTA** above the fold.
- [ ] **Sticky mobile CTA** persistent at viewport bottom on scroll.
- [ ] **Phone number** with click-to-call (`tel:`).
- [ ] **Multiple CTA placements** throughout the page (above-fold, mid-page, end-of-page minimum).
- [ ] **Trust signals strip** above the fold — reviews, ratings, licenses, years in business.
- [ ] **Testimonials** with names (photos where possible). For `service-area` zipper pages, testimonials must include neighborhood / city to satisfy anti-doorway-page rules.
- [ ] **Pricing transparency** — "Starting at $X", "Free quote", or actual price; even ranges beat silence on commercial intent.
- [ ] **Service-area coverage** listed.
- [ ] **Business hours** displayed.
- [ ] **Physical address & map** — applied per geographic footprint:
  - **Single-location** → real physical address + embedded Google Maps iframe (or static map image) showing the location. Required.
  - **Multi-location** → each branch's service page shows that branch's address + embedded map. Required per page.
  - **Service-area** (mobile, no public storefront) → omit physical address from public-facing pages; instead show a service-area map (highlighted region or list of cities served). The HQ address can appear in `LocalBusiness` schema even if not displayed publicly.
  - **National-online** → omit map entirely. Show "Serving [country/region] online" with no geographic targeting.
  - **Verification:** the address shown must match `LocalBusiness` schema, NAP in footer, and Google Business Profile exactly.

## 15. Long-Form Content *(1500+ Word Posts)*
- [ ] **Table of contents** with anchor links at the top.
- [ ] **Jump links** for each H2.
- [ ] **Back-to-top** button.

## 16. Hreflang & Language Targeting *(Multilingual Sites Only)* — Tier 1 #17

Conditional category. Only applies when `site-info.md` declares `Multilingual: true`. On monolingual sites, every item below is N/A.

- [ ] **Hreflang link cluster in `<head>`** — every page links to itself + every sibling language + `x-default`:
  ```html
  <link rel="alternate" hreflang="en"        href="https://example.com/page" />
  <link rel="alternate" hreflang="es"        href="https://example.com/es/page" />
  <link rel="alternate" hreflang="x-default" href="https://example.com/page" />
  ```
- [ ] **Self-reference required** — every page lists itself in the cluster with its own language code.
- [ ] **All sibling languages** — every other declared language gets a link.
- [ ] **`x-default` required** — points to the primary language version. Always present.
- [ ] **Reciprocal links** — if EN links to ES, ES must link back to EN. Asymmetric hreflang is invalid; Google ignores it.
- [ ] **`<html lang>` matches served language** — the lang attribute on `<html>` is the language code that was served. Do not serve EN content with `lang="es"`.
- [ ] **Schema `inLanguage` matches** — every JSON-LD root node (`Service`, `BlogPosting`, `FAQPage`, etc.) sets `"inLanguage": "[code]"` matching `<html lang>`.
- [ ] **Per-language URL pattern** matches the strategy declared in `site-info.md` (path-prefix / subdomain / country-tld). The toolkit does not pick the strategy — it reads it.
- [ ] **Sitemap with xhtml:link alternates** *(recommended)* — sitemap entries declare alternates per Google's spec. Optional but valuable.
- [ ] **Native rewrite per language, not auto-translation** — content is written using `voice.[lang].md`, with that language's banned words and sentence rhythm. Translated-from-English content is detectable as such and reads as AI slop in the target language.
- [ ] **Per-language navigation** — header/footer/dropdown entries exist in every language. The English nav lists English pages; the Spanish nav lists Spanish pages.

**Verification:** run `node scripts/validate-hreflang.mjs --site=[name]` after any multilingual change. Reciprocal failures are blockers, not opportunities.

## 17. Manual Audit Fundamentals — what to know without tools

Automated audit tools are a force multiplier, not a replacement for fundamentals. Every practitioner — and `/audit` substeps — should be able to do the following manually.

- [ ] **`site:` operator on Google** — `site:[domain.com]` shows what Google has indexed for the site. Use to:
  - Verify the indexed page count roughly matches the sitemap.
  - Spot accidentally-indexed staging URLs, parameter URLs, or duplicates.
  - Check whether titles and meta descriptions display as intended in SERPs.
  - Compare to the GSC Pages report — if `site:` shows pages GSC says are "not indexed," investigate.
- [ ] **View source / Ctrl+U / right-click → "View Page Source"** — shows the **server-rendered HTML** before JavaScript executes. Use to:
  - Verify `<title>`, `<meta description>`, canonical, OG, hreflang, JSON-LD are present in the raw HTML (not only after JS hydrates).
  - Confirm `<h1>` and `<h2>` tags are in the body (critical for AI search bots that don't run JS — see `SEO_GUIDE.md` Section 1.3).
  - Spot rendering problems: empty `<div id="root"></div>` is a CSR red flag.
- [ ] **Ctrl+F in source view** — quickly find specific elements (`<h1>`, schema type, hreflang, meta tags) without scanning the whole HTML.
- [ ] **DevTools → Disable JavaScript** — render the page as Googlebot's first pass + as AI search bots see it. If content vanishes, you have a rendering problem.
- [ ] **Bot-UA curl test** — fetch the page with a search-engine bot user agent and grep for headings. Catches CSR rendering problems on pages where the toolkit doesn't have direct browser access:
  ```bash
  # As PerplexityBot (representative AI search crawler)
  curl -s -A "Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)" \
    https://[domain]/[path] | grep -oE "<h[1-3][ >][^<]+</h[1-3]>" | head -5
  ```
  Expected: ≥ 1 `<h1>` and ≥ 4 total H1–H3 elements. Zero means the page is invisible to AI search.

### 17.1 Recommended Chrome extensions (manual audit)

| Extension | What it does | When to use |
|---|---|---|
| **SEO META in 1 CLICK** | One-click panel showing title, meta description, canonical, headings tree, schema, OG/Twitter, hreflang | Quick sanity check on any page |
| **Lighthouse** (built into DevTools) | Full performance / SEO / accessibility / best-practices audit | Pre-publish + post-publish spot-checks |
| **View Rendered Source** | Side-by-side comparison of pre-JS source vs rendered DOM | Diagnosing rendering / hydration mismatches |

These are extensions for the practitioner. The toolkit's `/audit` skill calls equivalent automated checks, but knowing the manual versions ensures the practitioner can interpret + override automated output when needed.

**Total: 120+ items across 17 categories.**

> The flow: `/wireframe` → `/blog` or `/service` → `/audit`. The wireframe maps every applicable item below to a layout zone before content gets written. The page-generation skill satisfies items inside the structure the wireframe set. `/audit` verifies post-publish.
>
> On multilingual sites, page-generation skills fan out across all declared languages by default.
> On `catalog` footprint sites, hierarchical URL + e-commerce schemas (Sections 2 + 9.1 + 9.2) apply on top of the rest.
