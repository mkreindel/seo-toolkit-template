# Security Policy

## Supported versions

This toolkit is a template designed to be forked and customized. Security fixes target the `main` branch and the latest tagged release.

| Version | Supported |
|---------|-----------|
| `main` + latest tag (0.1.x) | ✅ |
| Older tags | ❌ — please update |

## Reporting a vulnerability

**Please do not file a public issue for security vulnerabilities.** Public disclosure before a fix is ready can put downstream users at risk.

Use GitHub's private vulnerability reporting:

🔒 [https://github.com/mkreindel/seo-toolkit-template/security/advisories/new](https://github.com/mkreindel/seo-toolkit-template/security/advisories/new)

Include:

- A clear description of the vulnerability
- Steps to reproduce (or a proof-of-concept)
- Which part of the toolkit is affected (which skill, script, or template)
- Your assessment of the impact
- Optional: a suggested fix

You should receive an acknowledgment within 7 days. Fix timelines depend on severity.

## What counts as a vulnerability

The toolkit is mostly markdown methodology + small Node helper scripts — there's no server, no user authentication, no persistent data store. The realistic vulnerability surface:

| Category | Examples |
|---|---|
| **Supply chain** | A dependency in `package.json` has a known CVE that affects script execution |
| **Secret leakage** | A script logs or transmits an API key, OAuth token, or service-account JSON to an unintended destination |
| **Prompt injection / output manipulation** | A skill's prompt structure allows an attacker-controlled site (e.g., a competitor URL fetched for SERP analysis) to inject instructions that override the skill's behavior |
| **Filesystem traversal** | A script reads or writes files outside the expected paths based on user-controllable input (e.g., site slug) |
| **Credential mishandling** | The toolkit accidentally commits a real `.env`, `.secrets/`, or service-account file due to a `.gitignore` gap |
| **MCP server exposure** | A misconfigured MCP server in `.mcp.json` exposes filesystem or credentials to remote agents |

If you find any of the above, report privately first.

## What does NOT count

- **Configuration mistakes by the user** (e.g., committing their own `.env` file) — those are user errors, not toolkit vulnerabilities. We can improve the `.gitignore` defensively, but a user pushing secrets to their own fork is on them.
- **AI-generated content quality** (e.g., a generated blog post is factually wrong) — quality issues belong in regular issues, not security reports.
- **SEO methodology disagreements** (e.g., "schema validation is too strict") — open a regular issue or PR.

## Disclosure timeline

After a fix ships:

1. The fix is committed to `main` and tagged in the next patch release.
2. A `SECURITY.md`-linked advisory is published with a CVE if applicable.
3. The reporter is credited in the advisory unless they request otherwise.

## Dependency vulnerabilities

We rely on Dependabot for automatic alerts and security updates on npm dependencies. If a dep has a CVE, the fix usually lands within 24-72h via an auto-PR. You can subscribe to security alerts for your own fork at [https://github.com/{your-username}/seo-toolkit-template/security](https://github.com/{your-username}/seo-toolkit-template/security).
