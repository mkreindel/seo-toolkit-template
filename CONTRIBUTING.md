# Contributing

Two distinct ways people interact with this toolkit:

## Path A: Fork and customize (most users)

You're building your own SEO toolkit for your own portfolio. The expected workflow:

```bash
git clone https://github.com/mkreindel/seo-toolkit-template.git my-seo-toolkit
cd my-seo-toolkit
# Optional: remove the upstream remote so you don't accidentally push back
git remote remove origin
git remote add origin https://github.com/{your-username}/my-seo-toolkit.git
```

From there: customize `references/voice.md`, add sites under `sites/`, tune skills under `.claude/skills/` for your specific needs, add your own scripts to `scripts/`. **Most of these changes won't be relevant to upstream and aren't expected as PRs.** Your fork is yours.

If you periodically want upstream methodology improvements, add a second remote:

```bash
git remote add upstream https://github.com/mkreindel/seo-toolkit-template.git
git fetch upstream
git merge upstream/main         # or cherry-pick specific commits
```

## Path B: Contribute back (welcome — but specific)

The kinds of changes that ARE valuable to contribute upstream:

| Type | Example |
|---|---|
| **Methodology improvements** | Better prompt structure in a skill, a new on-page-seo signal added to the checklist, a bug-fix in `SEO_GUIDE.md` reasoning |
| **New skills with broad value** | A new slash command that solves a common SEO need across multiple platforms |
| **New platform support** | Adding Squarespace / Framer / Webflow / a new CMS to `WORKFLOWS.md` + relevant skill behavior |
| **Script bug fixes / improvements** | Fixing a script that fails on a real-world edge case, adding tests, improving error handling |
| **New templates** | A new outreach pattern, a new `templates/programmatic/` matrix shape |
| **Documentation** | Clarifying methodology, fixing typos, adding examples |
| **Dependency updates** | Especially security fixes |

The kinds of changes that are NOT a good fit for upstream:

| Type | Why |
|---|---|
| **Site-specific data** | `sites/your-business/...` files are part of YOUR fork, not the template |
| **Personal voice files** | `references/voice.md` overrides are per-fork |
| **Hardcoded API keys, project IDs, GA4 properties** | Those go in your fork's `.env`, not the template |
| **Aesthetic preferences without reasoning** | "I prefer X" — explain why first via an issue |

## Workflow for contributing

### 1. Open an issue first (for non-trivial changes)

If your change touches more than 50 lines OR adds a new skill OR changes a methodology rule, file an issue first to discuss. This avoids you doing significant work that won't be merged for structural reasons.

Small fixes (typos, doc clarifications, dep updates, single-script bug fixes) can go straight to PR without an issue.

### 2. Fork + branch

```bash
git clone https://github.com/{your-username}/seo-toolkit-template.git
cd seo-toolkit-template
git checkout -b {short-descriptive-branch-name}
```

### 3. Make the change

- **Keep the diff focused.** One PR = one concern. Mixed PRs (refactor + new feature + dep update) get rejected.
- **Test what you can.** If you change a script, ensure `npm test` still passes. If you change a skill, smoke-test it on a real site (your fork's `sites/` data).
- **Don't add dependencies casually.** New `dependencies:` in `package.json` need a stated reason.
- **Don't break the personal-data sanitization rule.** This template ships with placeholder slugs (`site-a`, `site-b`, `site-c`) and no real data. Your PR should preserve that — `git grep` for your business name / domain / personal name before pushing.

### 4. Commit message

Loose convention (not enforced):

```
<type>: <short summary>

<longer body if needed — what changed, why, any caveats>
```

`<type>` is one of: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `deps`. Helps with browsing history but no CI enforces it.

### 5. Open the PR

- Link to the issue you opened (if applicable)
- Describe what changed and why
- Note any testing you did
- Note any reviewer-relevant context (e.g., "this changes the voice anti-AI checklist — make sure the existing skills still pass")

### 6. License

By submitting a PR, you agree that your contribution is dual-licensed under MIT OR Apache 2.0, the same terms as the rest of the toolkit.

## Local development setup

```bash
npm install                        # one-time
cp .env.example .env               # configure API keys (most optional)
npm test                           # runs vitest suite
node scripts/test-api-auth.mjs     # smoke-test API credentials
```

To test a skill change end-to-end, you need a site folder under `sites/`. Use the included `templates/new-site/` skeleton or create a `sites/test-site/` with minimal `site-info.md` for smoke tests.

## Code style

- Markdown: GitHub-flavored, no emoji in body copy (this is one of the toolkit's voice rules — apply it to docs too)
- JavaScript: ES modules (`type: "module"` in `package.json`), no transpilation
- No CSS or HTML (the toolkit generates content, doesn't render UI)
- Comments: only where the WHY is non-obvious (constraints, workarounds, surprise behavior)

## Questions

- **Implementation question?** Open an issue with the `[question]` prefix
- **Security issue?** See `SECURITY.md` — do NOT file a public issue
- **Just want to discuss SEO methodology?** Open a discussion (if enabled) or an issue with `[discussion]`

Thanks for considering a contribution. Most users will fork and customize and that's the expected use — but methodology improvements via PR keep the upstream template sharp for everyone.
