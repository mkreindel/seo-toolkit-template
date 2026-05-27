---
name: lovable-deploy
description: Drive a Lovable round-trip via Chrome DevTools MCP. Reads a prepared prompt from the site's _drafts/ folder, navigates the user's local Chrome to the right Lovable project, pastes the prompt atomically (DataTransfer-based, bypassing Cmd+V UTF-8 mangling), waits for Lovable to finish building, captures the diff, runs heuristic verification, and either queues for human approval (default mode) or clicks Publish → Update directly (--auto-approve, subject to eligibility rules). After publish, runs curl-based verification on the live URL. Interactive-only — requires a local Claude session with Chrome MCP connected. Use when the user types `/lovable-deploy` or asks to ship a queued Lovable deploy.
---

# `/lovable-deploy` — Lovable round-trip driver

## Usage

```
/lovable-deploy {site-slug} {prompt-source} [--auto-approve]
```

| Argument | Required | Description |
|----------|----------|-------------|
| `{site-slug}` | yes | Site folder name under `sites/` (e.g., `site-a`, `site-b`). Must have `Lovable project ID` field in `site-info.md`. |
| `{prompt-source}` | yes | Either (a) a slug resolving to `sites/{site}/_drafts/{slug}/lovable-prompt.md`, or (b) an absolute path to any prompt file. |
| `--auto-approve` | no | Opt-in. When set, skill clicks Publish → Update after build succeeds. Subject to eligibility rules — see "Auto-approve eligibility" below. |

**Examples:**

```
/lovable-deploy site-a 2026-05-22-blog-quick-wins-q3
/lovable-deploy site-b services-tapas-priced-menus --auto-approve
/lovable-deploy site-a /absolute/path/to/prompt.md
```

## Why this skill exists

The weekly drafter cron writes Lovable-ready prompts to `_drafts/` but cannot drive the user's local Chrome to publish them (remote sessions don't have access to local MCP servers). Manually pasting each draft into Lovable, waiting for the build, reviewing the diff, and clicking Publish takes 15-20 minutes of attention. This skill collapses that to 2-4 minutes of Claude-driven work that the user can supervise while doing other things.

When Anthropic ships cross-session MCP support, this skill becomes fully autonomous (cron fires it directly). For now, the cron queues `_inbox/lovable-deploy-pending-*.md` items; the user runs the skill from their local session to ship them.

## Preconditions (verify before any action)

Run these checks before touching the browser or filesystem. If any fail, abort with a clear error message.

1. **Local Claude session.** This skill requires Chrome DevTools MCP. Confirm by calling `mcp__plugin_chrome-devtools-mcp_chrome-devtools__list_pages`. If the tool errors or returns no pages, you are likely in a remote session — abort with "lovable-deploy requires a local Claude session with Chrome MCP connected."

2. **Site folder exists.** `sites/{site-slug}/` must exist on disk. If not, abort with "Site {site-slug} not found in sites/."

3. **Lovable project ID present.** Parse `sites/{site-slug}/site-info.md`, find the line matching `**Lovable project ID:** \`([a-f0-9-]+)\``. If absent or empty, abort with "Site {site-slug} has no Lovable project ID set in site-info.md. Add it before running /lovable-deploy."

4. **Prompt file resolves.** If `{prompt-source}` is an absolute path, check it exists. Otherwise resolve to `sites/{site-slug}/_drafts/{prompt-source}/lovable-prompt.md` and check that exists. If neither path resolves, abort with "Prompt file not found at {expected path}."

5. **Prompt size.** Read the prompt file and check character count. If > 49,500 chars, abort with "Prompt exceeds Lovable's 49,950 char cap (with safety margin). Split into multiple prompts."

6. **3-strike check.** If `_audit-log/runs.jsonl` has 3 consecutive `red` entries for `lovable-deploy.{site-slug}` in the most recent runs, abort with "Site {site} has 3 consecutive failed lovable-deploy runs. Investigate before proceeding. See _audit-log/failures.json."

7. **Chrome signed into Lovable.** Take a snapshot of `https://lovable.dev/` — if the snapshot shows a login form (text containing "Sign in" or "Log in" with email/password inputs), abort with "Chrome is not signed into Lovable. Sign in manually, then re-run /lovable-deploy."

## Step 1 — Resolve Lovable project URL

1. From site-info.md, extract the Lovable project ID (already loaded during precondition 3).
2. Construct: `https://lovable.dev/projects/{lovable-project-id}`
3. This URL is the navigation target for Step 2.

## Step 2 — Navigate Chrome to the Lovable project

1. Call `mcp__plugin_chrome-devtools-mcp_chrome-devtools__list_pages` to see open tabs.
2. If any open page's URL contains the Lovable project UUID, select it via `select_page` with `bringToFront: true`.
3. Otherwise, call `navigate_page` with `type: "url"`, `url: <constructed URL>`. Wait for navigation to complete (default timeout sufficient).
4. After navigation, call `list_pages` again to confirm the URL contains the expected project UUID. If not, abort with "Failed to navigate to Lovable project {url}."

## Step 3 — Paste prompt atomically into Lovable's chat input

The atomic-paste pattern bypasses two known Lovable quirks: (a) Cmd+V mangles UTF-8 em-dashes ([[lovable-paste-encoding-workaround]]); (b) multi-line input typed key-by-key fragments into the Queue via Enter ([[lovable-send-atomic]]).

1. Take a snapshot via `take_snapshot`. Save the result for selector matching.
2. Find the chat input element in the snapshot. Look for the **textbox role** at the bottom of the page, typically with a `name` or `placeholder` containing one of: `"Send a message"`, `"Message"`, `"Ask"`, `"Chat"`, `"Type"`. If multiple textboxes exist, pick the one visually at the bottom of the conversation panel (last in document order is a reasonable heuristic).
3. Record the chat input's `uid` from the snapshot.
4. If no chat input found, escalate: take a screenshot via `take_screenshot`, write it + the snapshot to `sites/{site}/_inbox/lovable-deploy-failed-{slug}-{date}.md` with explanation "could not locate Lovable chat input via accessibility tree", and abort.
5. Read the prompt file contents.
6. Use `evaluate_script` to dispatch a paste event on the chat input element. The args array passes the input's `uid` and the prompt text:

```javascript
async function paste(element) {
  const text = arguments[1];
  // Method 1: DataTransfer paste event (works for most textarea/contenteditable)
  const dt = new DataTransfer();
  dt.setData('text/plain', text);
  const pasteEvent = new ClipboardEvent('paste', {
    clipboardData: dt,
    bubbles: true,
    cancelable: true,
  });
  element.focus();
  const accepted = element.dispatchEvent(pasteEvent);
  // Method 2: fallback for inputs that didn't intercept paste
  if (accepted) {
    if (element.value !== undefined && element.value.length === 0) {
      element.value = text;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (element.isContentEditable && element.textContent.length === 0) {
      document.execCommand('insertText', false, text);
    }
  }
  return {
    pasted_length: text.length,
    element_value_length: element.value !== undefined ? element.value.length : element.textContent.length,
    focused: document.activeElement === element,
  };
}
```

7. Verify paste succeeded: take another snapshot, find the chat input, confirm it now contains text starting with the first ~80 chars of the prompt. If verification fails, retry once. If still failing after retry, escalate (Step 4 below) — DO NOT send.

## Step 4 — Send the prompt

1. The chat input has focus (from Step 3).
2. Use `press_key` with the chat input's `uid` and `key: "Enter"`.
3. Wait 3 seconds.
4. Take a snapshot. Find the most recent user-role message in the conversation log. Confirm its content matches the first ~80 chars of the prompt. If the prompt isn't in the conversation log, the send didn't work — escalate.

## Step 5 — Wait for Lovable to finish building

Lovable's build cycle ranges from 30 seconds to 15+ minutes depending on prompt size and complexity. Detect completion via these signals (in order of preference):

1. **Chat input re-enabled.** While Lovable is processing, the chat input is typically disabled (`aria-disabled="true"` or `disabled` attribute). When done, it re-enables. Use `wait_for` with a 20-minute timeout, watching for the chat input's accessibility-tree disabled-state to flip back to enabled.

2. **Assistant message appears.** After Lovable's reply lands, the conversation log gains a new message with `role=article` or `role=group` containing assistant-attributable content (often a code block, diff, or "✅" sentinel).

Add a 5-second settle window after detecting either signal to let any streaming finish.

If the 20-minute timeout fires:
- Take a snapshot + screenshot for diagnosis
- Write `sites/{site}/_inbox/lovable-deploy-timeout-{slug}-{date}.md` with the snapshot + screenshot
- Append a `red` entry to `_audit-log/runs.jsonl`
- Abort. DO NOT click Publish.

## Step 6 — Capture Lovable's reply (the diff)

1. Take a snapshot.
2. Find the latest assistant message in the conversation log (typically the last message bubble after your user-role message).
3. Use `evaluate_script` with the message's `uid` to extract the full text content:

```javascript
function getMessageText(messageEl) {
  return messageEl.innerText || messageEl.textContent || '';
}
```

4. Save the captured text in a working variable. Do NOT persist to disk yet — Step 8's approval gate decides whether to keep it.

## Step 7 — Heuristic verification of the reply

Lovable's replies have a recognizable shape when builds succeed. Scan the captured text for these signals.

**Success signals (need at least one):**
- The literal string `✅`
- The string `successfully` (case-insensitive)
- The string `complete` (case-insensitive)
- A `dist/` listing (Lovable typically shows the build output)
- The string `awaiting` or `ready for approval` (Lovable's standard closing)
- The string `build` followed by `green` or `passed` or `success`

**Failure signals (any one means STOP):**
- The literal string `❌`
- The string `error` prominently (count: more than 2 occurrences indicates real errors, not just mentions)
- Stack traces (regex: `at .+\.(ts|tsx|js|jsx):\d+`)
- The string `failed to build` or `build failed`
- The string `could not` or `unable to` describing the requested change

**Decision matrix:**

| Success signal? | Failure signal? | Action |
|-----------------|-----------------|--------|
| yes | no | proceed to Step 8 |
| yes | yes | escalate — ambiguous reply, do NOT auto-publish |
| no | yes | escalate — clear failure |
| no | no | escalate — atypical reply, manual review needed |

When escalating, write `sites/{site}/_inbox/lovable-deploy-failed-{slug}-{date}.md` with the full captured reply + a header describing which signals were found.

## Step 8 — Approval gate

### Mode A: Default (no `--auto-approve` flag)

1. Construct paths:
   - `slug = derive from prompt-source filename, sanitize (lowercase, hyphens only)`
   - `today = YYYY-MM-DD in user's timezone`
   - `inbox_path = sites/{site}/_inbox/lovable-deploy-pending-{slug}-{today}.md`
2. Write `inbox_path` with this structure:

```markdown
# Lovable deploy pending — {site} — {slug}

**Date:** {YYYY-MM-DD HH:MM TZ}
**Prompt source:** {resolved-path-to-prompt}
**Lovable project:** {lovable-project-url}
**Build verification:** {success signals matched, e.g., "✅ + dist/ listing + awaiting"}
**Status:** Awaiting human review.

## Lovable's reply (full diff + build output)

{captured reply text, verbatim, fenced as a markdown code block}

## To ship this deploy

**Option 1 — Autonomous (after review):**
```
/lovable-deploy {site} {slug} --auto-approve
```
This re-runs the skill in auto-approve mode. Eligibility is re-checked.

**Option 2 — Manual:**
1. Open the Lovable project: {lovable-project-url}
2. Click `Publish → Update` in the UI
3. After deploy confirms, optionally run post-deploy verification manually

## To reject this deploy

Delete this inbox file AND the corresponding `_drafts/{slug}/` folder.
```

3. Append a `pending` entry to `_audit-log/runs.jsonl` via the audit-log helper:

```javascript
import { recordSuccess } from '../scripts/lib/audit-log.mjs';
recordSuccess('lovable-deploy', { site, slug, status: 'pending', inbox_path });
```

4. Report the inbox path to the user:

```
✅ Lovable deploy queued for human review:
   sites/{site}/_inbox/lovable-deploy-pending-{slug}-{date}.md

To ship: re-run with --auto-approve OR click Publish in Lovable manually.
```

5. Skill ends. The Chrome tab remains open for the user's convenience.

### Mode B: `--auto-approve` mode

Pre-check eligibility BEFORE clicking anything. If any rule fails, fall back to Mode A with a note explaining which rule failed.

**Eligibility rules — all must pass:**

1. **Prompt size:** prompt length < 30,000 chars (more aggressive cap than the absolute 49,500 limit — auto-approve only for small changes).
2. **Site green-run floor:** site has 4+ consecutive `green` entries in `_audit-log/runs.jsonl` for `lovable-deploy.{site}`, counting back from the most recent. Check via the audit-log helper.
3. **Content-type safety:**
   - Prompt MUST NOT contain literal references to: `middleware.ts`, `vercel.json` (config changes are dangerous to auto-approve)
   - Prompt MUST NOT contain `schema` or `JSON-LD` modification instructions
4. **Site Bsf-specific:** if `site == "site-b"`, the prompt MUST NOT modify any user-visible text (per [[site-b-founder-voice-constraint]] memory). Heuristic check: scan prompt for words like `replace`, `change`, `rewrite`, `update` paired with `<h1>`, `<p>`, `text`, `copy`, `headline`. If any match, fail eligibility.

**If eligibility passes, execute the publish flow:**

1. Take a snapshot of the current Lovable page.
2. Find the `Publish` button. Search the snapshot for `role=button` whose `name` (case-insensitive) starts with "Publish" or equals "Publish". Record its `uid`.
   - If not found: escalate. Lovable's UI may have shifted; do NOT guess at other buttons.
3. Click via `mcp__plugin_chrome-devtools-mcp_chrome-devtools__click` with the button's `uid`.
4. Wait 2 seconds for the publish panel to render. Take a snapshot.
5. Find the `Update` button within the publish panel. Search for `role=button` whose `name` starts with "Update" (handles "Update", "Update production", "Update Production", etc.).
   - If not found: escalate.
6. Click it.
7. Poll for deploy confirmation. Every 10 seconds, take a snapshot and check for:
   - Text containing "Published" or "Live" or "Deployed"
   - A timestamp adjacent to a published/deployed status
   - The publish button reverting from "Publishing..." or "Updating..." to "Publish"
   
   Timeout: 3 minutes. If timeout, escalate — Vercel deploy may still be in progress, but we won't auto-verify.
8. If success detected, proceed to Step 9 (post-deploy verification).
9. After Step 9 succeeds, write `sites/{site}/_inbox/lovable-deploy-shipped-{slug}-{date}.md` (see template in Step 9).

**If eligibility FAILS, write to inbox with explanation:**

Same as Mode A's `inbox_path`, but with an additional section:

```markdown
## Auto-approve declined

`--auto-approve` was requested but failed eligibility:
- {failed rule 1, e.g., "Site site-a has 2 prior green runs, needs 4 for auto-approve"}
- {failed rule 2, if applicable}

Default-safe mode kicked in. Review the diff above; re-run with `--auto-approve` once eligibility is met, OR proceed manually.
```

## Step 9 — Post-deploy verification (curl-based + interactivity click-test)

After deploy confirmation in Lovable's UI (Mode B), or as an optional check in Mode A (only if the user already clicked Publish manually):

### 9a — Content verification (curl-based)

1. Determine the live URL pattern from the prompt. Most prompts include the target URL explicitly. If not, derive from the prompt slug + the site's `Live URL pattern for blog posts` or `Live URL pattern for service pages` (from site-info.md).
2. Wait 60 seconds for Vercel's edge propagation.
3. `curl -sL <live_url>` — capture response status + body.
4. Verify:
   - HTTP 200 (or HTTP 308 followed to 200 — curl `-L` handles redirects)
   - Body contains the expected `<h1>` text (extract from prompt; if absent, skip this check with a warning)
   - Body contains the expected `<title>` text (extract from prompt; if absent, skip)
5. For bilingual sites (site-a, site-b): also curl the sister-language URL and confirm 200 + correct language-specific content. The sister URL is derived from the prompt's hreflang declaration or the site's URL pattern.

### 9b — Interactivity click-test (CRITICAL — added 2026-05-17 after P0.1.1 postmortem)

**Curl-based content checks are NOT sufficient on SSG sites.** A site can have correct SSG-rendered HTML (passes all curl checks) but completely broken hydration (no event handlers attached, all interactive elements inert). This happened on example.com 2026-05-17: the P0.1 SSG migration introduced a circular dependency between `vendor` and `ui` chunks, throwing `React.forwardRef undefined` on hydration. The page rendered, PSI scored 91-95, all content checks passed — but every button, link, and form was dead. Bug shipped at 4pm and wasn't discovered until 8pm when a human tried to click something.

**This Step 9b is the missing safety net.** Run it on EVERY post-deploy verification for SSG sites (site-a, site-b, and any future SSG site):

1. Navigate to the deployed URL via Chrome MCP `navigate_page`.
2. Wait 4-5 seconds (let hydration complete fully — measured against a hydration-completion signal like the chat widget loading, or simply a fixed `wait_for` with a benign visible text).
3. Take an accessibility snapshot via `take_snapshot`.
4. Use `evaluate_script` to check for React fiber attachment:

```javascript
() => {
  const button = document.querySelector('button');
  if (!button) return { status: 'no-buttons-on-page', reactFiber: null };
  const fiberKeys = Object.keys(button).filter(k => k.startsWith('__react'));
  return {
    status: 'ok',
    reactFiberAttached: fiberKeys.length > 0,
    fiberKeys,
    hasClickHandler: typeof button.onclick === 'function',
    consoleErrorCount: 0  // populated by list_console_messages separately
  };
}
```

5. Run `list_console_messages` with `types: ["error"]` — assert zero errors.
6. If hydration looks healthy (fiberKeys non-empty, no console errors), do an actual interaction click as final proof:
   - Find a low-risk reversible interactive element via snapshot. Good candidates: theme toggle (dark/light mode), language toggle (EN/ES), accordion expand, cookie consent dismiss.
   - Click it via `mcp__plugin_chrome-devtools-mcp_chrome-devtools__click`.
   - Wait 1 second, then `evaluate_script` to verify a state change happened:
     - For theme toggle: check `document.documentElement.className` flipped between empty and "dark"
     - For language toggle: check `<html lang>` attribute changed
     - For accordion: check that the previously-collapsed section is now visible
   - If state change confirmed → hydration confirmed working.

**If 9b fails** (no fiber attached, console errors, OR click produces no state change):
- Write `sites/{site}/_inbox/lovable-deploy-postcheck-hydration-failed-{slug}-{date}.md` with the snapshot, console errors, and the specific assertion that failed.
- Mark this as a P0 site-level outage. The deploy DID happen but the site is broken for real users.
- Append a `red` entry to the audit log.
- Recommend the user revert the deploy in Lovable OR draft a hotfix prompt addressing the hydration issue.

**Why this matters more than 9a:** content rendering is a SOLVED problem in SSG — Vite + vite-react-ssg + middleware injection produce correct HTML reliably. The hydration step is where novel bugs (chunk-splitting, lazy-load races, hydration mismatches, etc.) hide. 9a catches "did the build produce the right HTML?" 9b catches "is the site actually usable?" Both are required.
6. If verification passes, write `sites/{site}/_inbox/lovable-deploy-shipped-{slug}-{date}.md`:

```markdown
# Lovable deploy shipped — {site} — {slug}

**Date:** {YYYY-MM-DD HH:MM TZ}
**Live URLs:**
- {primary URL}
- {sister URL if bilingual}
**Deploy duration (from /lovable-deploy start to verification):** {elapsed minutes}
**Verification:**
- HTTP {status} ✅
- H1 match ✅
- Title match ✅
- {sister URL HTTP status} ✅ (if bilingual)

## Lovable's diff (captured at submit)

{full captured reply, fenced}
```

7. Append `green` entry to `_audit-log/runs.jsonl`.
8. Report success to the user with the live URL(s).

If verification FAILS:
- Write `sites/{site}/_inbox/lovable-deploy-postcheck-failed-{slug}-{date}.md` with details
- Append `red` entry to `_audit-log/runs.jsonl`
- Report failure with diagnostic info — the deploy DID happen, but the verification didn't pass. User needs to investigate.

## Selector strategy: accessibility-tree, not CSS

This skill uses **accessibility-tree snapshots** (via `take_snapshot`) to find UI elements via ARIA roles + names. It does NOT use CSS selectors via `evaluate_script`'s `document.querySelector`.

**Why:** Lovable's CSS classes (Tailwind utility classes, generated UUIDs) change with every Lovable redesign. Their ARIA roles + accessible names are intentionally exposed for assistive tech and rarely change. Accessibility-tree selectors survive UI redesigns; CSS selectors don't.

**One exception:** the atomic-paste step (Step 3) uses `evaluate_script` to dispatch a paste event on the chat input. This is a single DOM-direct operation, scoped to the element already located via the accessibility tree. The `uid` from the snapshot resolves to the actual DOM element inside `evaluate_script`'s `args` — so we're still semantic-first, not CSS-first.

**Fallback heuristics (in priority order, only if accessibility tree doesn't find a target):**
1. Snapshot text-content scanning (look for the element by visible label, not CSS class)
2. Take a screenshot + take a full snapshot, persist both to `_inbox/lovable-deploy-failed-*.md`, escalate to human

DO NOT write CSS selectors targeting Lovable internals (`.message-text`, `#chat-input`, etc.). They will break.

## Audit log integration

Every `/lovable-deploy` invocation writes a row to `_audit-log/runs.jsonl` via `scripts/lib/audit-log.mjs`:

| Status | When written |
|--------|--------------|
| `pending` | Default mode: after the diff is captured and inbox file is written. |
| `green` | After successful auto-publish + verification. |
| `red` | Any escalation: precondition fail, paste fail, send fail, build timeout, heuristic verification fail, click fail, post-deploy verification fail. |

Fields recorded: `timestamp`, `skill: "lovable-deploy"`, `site`, `slug`, `status`, `elapsed_ms`, `inbox_path` (if applicable), `live_url` (if shipped), `error` (if red).

The 3-strike contract (precondition 6) reads from this log.

## Related memory entries

- [[lovable-paste-encoding-workaround]] — why DataTransfer paste, not Cmd+V
- [[lovable-send-atomic]] — why one-shot paste, never multi-line type
- [[lovable-prompt-size-limit]] — the 49,950 char cap and how to trim
- [[chrome-browser-pick]] — use the site-a Chrome browser, not Personal Chrome
- [[lovable-capa0-prompt-pattern]] — invisible-metadata patches that may auto-approve safely
- [[site-b-founder-voice-constraint]] — why site-b visible-text changes never auto-approve
- [[html-comment-tag-footgun]] — preflight check for migration-class patches (verify no literal tag names in HTML comments)

## Out of scope for v1

- Driving non-Lovable platforms (Webflow, Squarespace, Shopify) — different code paths per platform; future siblings like `/webflow-deploy` would follow the same contract.
- Pre-build TypeScript / linter checks — Lovable does these internally and reports in chat; this skill just reads the report.
- Verifying that Lovable's diff actually matches the prompt intent (semantic diff) — out of scope; default mode's human review catches this.
- Multi-prompt patches that span > 49,500 chars total — user must split manually.
