# Workflows — Platform-Specific Patterns

Cross-site, cross-skill operational knowledge. Each section: **problem → recipe → why it matters**. Read the relevant section BEFORE acting on that platform.

This file is read both by Claude (every session) and by cron-fired routines (where applicable). Keep entries terse; bias toward actionable recipes.

**Sections:**
1. [Lovable](#lovable-ide-for-site-a--site-b--site-c) — IDE patterns
2. [GoDaddy DNS](#godaddy-dns) — DNS edits
3. [Google Search Console](#google-search-console) — GSC quirks
4. [Vercel](#vercel) — Hosting + Edge Middleware
5. [Chrome MCP / browser sessions](#chrome-mcp--browser-sessions)
6. [API credentials](#api-credentials) — Refresh + rotation
7. [Schema validation](#schema-validation)

---

## Lovable (IDE)

### Capa 0 (invisible-metadata changes) prompt pattern

For changes that affect ONLY metadata (title, canonical, hreflang, schema, OG/Twitter tags) and MUST NOT touch visible body copy: structure the Lovable prompt with explicit "DO NOT" block + scope-confirmation closure.

**Template:**

```
[Goal in 1 sentence]

DO NOT:
- Change any visible body text on any page
- Modify the React component tree (only edit lib/route-meta.ts entries)
- Change hreflang reciprocity (preserve existing alternates)
- Touch JSON-LD other than the entries listed below

DO:
- [specific files to modify]
- [specific entries to change]

After implementing: reply with a 1-line scope confirmation listing the files you touched. Do not deploy until I confirm.
```

**Why:** Lovable's natural behavior is to "improve" copy or restructure code when given vague prompts. Capa 0 prompts force scope discipline. Validated 2026-05-08 on site-b; reused across both bilingual sites.

### Atomic-send rule

Never `type` multi-line prompts into Lovable's chat. Newlines get interpreted as Enter keys, fragmenting the prompt into Queue items.

**Recipe:** always paste the whole prompt at once. Use Chrome MCP `fill` or DataTransfer paste, never `type`.

**Why:** Same-session Lovable chats have a queue model. Each Enter = a queued message. Multi-Enter prompts get scattered into multiple half-messages, each of which Lovable tries to act on. Outcome: 5 different broken edits instead of 1 coherent change.

### 49,950-character cap

Lovable chat input maxes around 49,950 characters. Atomic patches approaching this limit:

- Compress constraints list (single-line bullets)
- Minify JSON-LD schemas (no pretty-print)
- Collapse multi-line code blocks where possible

If still over the cap: split into 2 atomic patches with explicit "DO NOT deploy yet" closure on the first.

### Paste encoding workaround

Chrome MCP's Cmd+V mangles UTF-8 em-dashes and other extended characters.

**Recipe for safe paste:** serve content via a local CORS server, fetch the content as a Blob in page-context JS, construct File objects via DataTransfer, dispatch a `paste` event. Bypasses the native clipboard entirely.

Reference implementation (in any new MCP browser session):

```javascript
const blob = await fetch('http://localhost:8080/payload.txt').then(r => r.blob());
const file = new File([blob], 'payload.txt', { type: 'text/plain' });
const dt = new DataTransfer();
dt.items.add(file);
const event = new ClipboardEvent('paste', { clipboardData: dt });
document.querySelector('textarea[data-lovable-chat]').dispatchEvent(event);
```

### Lovable build cycle ≈ 2–6 min

Plan around: atomic prompt → click send → wait 2–6 min for build → verify in browser. If multiple atomic patches are needed in one session, queue them with explicit "DO NOT deploy yet" until the last one.

---

## GoDaddy DNS

### Passkey-per-edit constraint

**Problem:** every DNS change on GoDaddy (edit, add, delete) triggers a Touch ID / passkey prompt that cannot be scripted. One tap per record. Bypass is impossible.

**Recipe for bulk changes:**

1. Stage all edits in a single browser session before applying any.
2. Click into each record one at a time.
3. Tap Touch ID at each prompt.
4. Don't switch tabs/windows mid-session; passkey state resets and you'll re-authenticate.

**Why it matters:** budget time accordingly. A Vercel migration with 3 DNS changes = 3 passkey taps = ~5 min UI work even though each click is trivial. Don't promise "5-second DNS fix" without accounting for the passkey friction.

### Vercel-migration DNS pattern

When migrating a site from non-Vercel hosting to Vercel, on GoDaddy:

- **Edit** A `@` → `216.198.79.1` (Vercel anycast IP)
- **Delete** A `www` (if it exists with a non-Vercel IP)
- **Add** CNAME `www` → `[project-specific].vercel-dns-017.com.` (Vercel gives you the exact CNAME target)

Preserve everything else (MX, NS, all TXT for DKIM/DMARC/SPF/verification, other CNAMEs).

3 records changed = 3 passkey taps.

---

## Google Search Console

### Disavow tool applies on file upload, not on submit click

**Problem:** GSC's disavow tool seems to have an explicit "Submit" button — but the upload itself IS the commit step. Once the file lands, the rules apply.

**Recipe:**

1. Prepare the disavow file locally (one `domain:example.com` line per toxic domain, no comments mid-list).
2. Verify content + format (no trailing whitespace, UTF-8, LF line endings).
3. Upload via the dashboard — **this is the commit step**. There is no separate confirmation.

**Why it matters:** treat as high-blast-radius. If automating via Chrome MCP `file_upload`, confirm with the user explicitly before the upload click — even if general session authorization exists.

Validated 2026-05-11 on site-b (23-domain PBN disavow) and site-c (23-domain disavow same week).

### Duplicate property alerts

**Problem:** sites registered in GSC under BOTH a Domain property AND a URL-prefix property fire every alert twice. Some sites end up with both for legitimate reasons (e.g., SEMrush onboarding auto-adds URL-prefix).

**Recipe:** verify before deleting. If both properties show valid data and removing one would break a tool integration, keep both. Accept the duplicate alerts as noise.

**Why:** on site-b, the URL-prefix property was likely added by SEMrush during 2026-05-08 onboarding. Removing it blind could break SEMrush's integration.

### Stale-crawl alerts during Lovable arcs

**Problem:** when Lovable is mid-build (you've sent a prompt, Lovable is rebuilding), GSC may crawl the transient broken state and fire alerts about schema, hreflang, or indexability problems that don't exist in the final deploy.

**Recipe:** before acting on a GSC alert, run a live Rich Results Test against the current production URL. If the live URL is fine, the alert is a stale-crawl false positive; dismiss without action.

**Why:** prevents chasing already-resolved issues. Documented as `feedback_gsc_stale_crawl_during_lovable_arc` after multiple incidents on site-a + site-b.

---

## Vercel

### Don't flip apex config mid-migration

**Problem:** flipping Vercel's apex domain config between "Redirect to www" and "Connect to Production" multiple times during a migration leaves the Cloudflare edge stuck at HTTP 421 (Misdirected Request) indefinitely.

**Recipe:** pick ONE mode at the initial Vercel domain config step and leave it. For the standard pattern, that's "Redirect to www" with 308 Permanent.

**If you're already stuck at 421:** DO NOT flip again. The lockup is sticky in Cloudflare's edge. Path forward:

- Wait for Cloudflare edge cache to clear naturally (weeks to months — site-c cleared in ~5 days)
- OR migrate apex DNS to a different provider entirely as a hard reset

Documented as `feedback_vercel_apex_flip_stuck` after the site-c migration arc.

### Vite SPA legacy URLs need middleware 410, not vercel.json redirects

**Problem:** `vercel.json` can only return redirects (3xx). For textbook 410 Gone on legacy paths (e.g., WP-era URLs that should be permanently dead), a 308 → / is treated as a soft-404 by Google — bad signal.

**Recipe:** use `middleware.ts` at repo root to return a `Response` with status 410 for legacy paths:

```typescript
export default function middleware(req: Request) {
  const url = new URL(req.url);
  if (LEGACY_PATHS.includes(url.pathname)) {
    return new Response('Gone', { status: 410, headers: { 'Content-Type': 'text/plain' } });
  }
  // ... rest of middleware (metadata injection, etc.)
}
```

Validated 2026-05-11 on site-b; replaced earlier broken `vercel.json` 308 → / pattern.

### Edge middleware setup checklist

For SEO metadata injection on a Vite SPA hosted on Vercel:

1. Create `middleware.ts` at **repo root** (NOT inside `src/`). Vercel auto-detects.
2. Use framework-agnostic Web APIs (`Request`, `Response`, `fetch`). NO `next/server` import (this is a Vite app, not Next.js).
3. Set the matcher: `/((?!api|assets|.*\\..*).*)` to exclude API routes + static assets.
4. Read per-route metadata from `src/lib/route-meta.ts` (single source of truth — same file the React app's hooks consume).
5. Mutate `<head>` via **regex string replacement** on the static `index.html`. V8 isolate runtime does NOT support DOM parser libraries.
6. Return modified HTML with `Content-Language` response header per route.

Validated on site-a 2026-04-30, replicated on site-b 2026-05-06–07, and site-c before 2026-05-11.

---

## Chrome MCP / browser sessions

### Two Chrome browsers — pick the work profile

**Problem:** macOS has both the personal Chrome profile and the `work-email@example.com` profile available to Chrome MCP. They're separate Chrome instances with different saved sessions.

**Recipe:** for this toolkit, always pick the site-a (macOS) profile. NOT Personal Chrome.

**Why:** saved sessions for Lovable, GSC, GA4, GBP, SEMrush all live in the site-a profile. Personal Chrome would require re-authentication every action.

### MCP `file_upload` is the commit, not a stage

**Problem:** Chrome MCP `file_upload` immediately commits to wherever the file picker is wired. For GSC disavow, this means the disavow applies before the user gets a final confirmation.

**Recipe:** treat `file_upload` as high-blast-radius. Always confirm with the user before the upload call, even if general session authorization exists.

---

## API credentials

### Where credentials live

- **`.env`** at toolkit root (gitignored) — all environment variables for cron routines and scripts
- **`.secrets/`** at toolkit root (gitignored) — JSON files (service account keys, etc.)

Provisioning is documented in `docs/specs/2026-05-16-agents-cruise-control-design.md` Phase 0 + Plan 1 Tasks 0.1–0.7.

### Refresh checklist when credentials expire

| API | Symptom | Fix |
|---|---|---|
| GSC OAuth | "invalid_grant" or "Token has been expired or revoked" | Re-run `node scripts/test-api-auth.mjs --service=gsc`; complete the OAuth code-exchange to get fresh refresh token; paste back into `.env`. |
| PageSpeed API key | HTTP 429 (rate limit) | Wait 60s and retry. If persistent, check daily quota in GCP console. |
| Perplexity API | HTTP 402 (out of credit) | Top up prepaid balance at https://www.perplexity.ai/settings/api |
| GBP OAuth | "invalid_grant" | Same as GSC — re-run OAuth code-exchange flow via `--gbp-code=` |
| GA4 service account | "PERMISSION_DENIED" or code 7 | Verify service account email is in each GA4 property's Property Access Management list (Viewer role). UI sometimes rejects service-account emails with "doesn't match a Google Account" — wait + retry, or fall back to OAuth. |
| SEMrush API | "ERROR 50 :: NOTHING FOUND" or 429 | Check monthly API unit budget. Re-run with smaller query. |

### Rotation discipline

If a credential ever appears in chat (e.g., pasted in a message), treat as compromised:

1. Open GCP IAM (or service-specific dashboard) and **rotate the key immediately**.
2. Delete the old key from the dashboard.
3. Download new key.
4. Replace in `.env` (or `.secrets/`).
5. Re-run `node scripts/test-api-auth.mjs` to verify.

The whole rotation should take under 2 minutes. Don't treat credential leak as embarrassing — treat it as routine.

---

## Schema validation

### Two validators, both required at ship time

- **Google Rich Results Test:** https://search.google.com/test/rich-results
- **Schema.org Validator:** https://validator.schema.org

Every page MUST pass BOTH before shipping. Validators sometimes disagree on edge cases (Google is more lenient on optional fields; Schema.org is stricter on type hierarchies). When they disagree, prioritize Schema.org compliance — Google still indexes the page; Schema.org compliance ensures cross-platform discoverability.

### JSON-LD content must match visible page exactly

FAQ Q+A, breadcrumb labels, author bylines, prices, locations — every field that appears in JSON-LD must also appear verbatim on the visible page. Mismatches trigger Google's "deceptive content" classification.

### Schema in static HTML vs JS-rendered

Bots that don't execute JS (Perplexity, GPT, Claude, first-pass Googlebot) only see static HTML. For SPA architectures, schema MUST be injected pre-hydration via Edge Middleware (the site-a + site-b + site-c pattern) — NOT via React Helmet or similar client-side libraries.

Validated 2026-04-30 on site-a: pre-middleware, schema was JS-rendered → Perplexity didn't see Article schema; post-middleware, schema in static shell → Perplexity citation strength doubled within days.

---

**Last updated:** 2026-05-16 by Plan 1 Task A.8.

Add new sections as patterns emerge. Each entry: **problem → recipe → why**. Keep terse.
