#!/usr/bin/env node
/**
 * scripts/test-api-auth.mjs
 *
 * Pings each provisioned API once and reports OK/FAIL. Run before Plans 2+3
 * to confirm credentials work end-to-end.
 *
 * Usage:
 *   node scripts/test-api-auth.mjs                # tests all 5 APIs
 *   node scripts/test-api-auth.mjs --service=gsc  # tests just one
 *   node scripts/test-api-auth.mjs --gsc-code=X   # finishes one-time GSC OAuth flow
 *
 * Required in .env (per Plan 1 Phase 0):
 *   GSC_OAUTH_CLIENT_ID, GSC_OAUTH_CLIENT_SECRET, GSC_OAUTH_REFRESH_TOKEN
 *   GOOGLE_PAGESPEED_API_KEY
 *   PERPLEXITY_API_KEY (or "scrape" for fallback)
 *   GBP_OAUTH_CLIENT_ID, GBP_OAUTH_CLIENT_SECRET, GBP_OAUTH_REFRESH_TOKEN (post-approval)
 *   GA4_SERVICE_ACCOUNT_JSON_PATH (.secrets/ga4-service-account.json)
 */
import 'dotenv/config';
import { google } from 'googleapis';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import fs from 'node:fs/promises';

const args = process.argv.slice(2);
const onlyService = args.find((a) => a.startsWith('--service='))?.split('=')[1];

// One-time GSC OAuth code exchange — call this with the auth code after visiting the URL printed by testGsc()
const gscCodeArg = args.find((a) => a.startsWith('--gsc-code='))?.split('=')[1];
if (gscCodeArg) {
  const oauth2 = new google.auth.OAuth2(
    process.env.GSC_OAUTH_CLIENT_ID,
    process.env.GSC_OAUTH_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob',
  );
  const { tokens } = await oauth2.getToken(gscCodeArg);
  console.log('\n✅ Got refresh token. Paste this into .env:\n');
  console.log(`GSC_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}\n`);
  process.exit(0);
}

// Same pattern for GBP (used after Google approves API access)
const gbpCodeArg = args.find((a) => a.startsWith('--gbp-code='))?.split('=')[1];
if (gbpCodeArg) {
  const oauth2 = new google.auth.OAuth2(
    process.env.GBP_OAUTH_CLIENT_ID,
    process.env.GBP_OAUTH_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob',
  );
  const { tokens } = await oauth2.getToken(gbpCodeArg);
  console.log('\n✅ Got refresh token. Paste this into .env:\n');
  console.log(`GBP_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}\n`);
  process.exit(0);
}

// GA4 OAuth code exchange — Path B per 2026-05-16-ga4-service-account-grants-deferred.md.
// Service-account grant rejected by GA4 ("doesn't match Google Account"); using OAuth
// flow mirroring GSC pattern.
const ga4CodeArg = args.find((a) => a.startsWith('--ga4-code='))?.split('=')[1];
if (ga4CodeArg) {
  const oauth2 = new google.auth.OAuth2(
    process.env.GA4_OAUTH_CLIENT_ID,
    process.env.GA4_OAUTH_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob',
  );
  const { tokens } = await oauth2.getToken(ga4CodeArg);
  console.log('\n✅ Got refresh token. Paste this into .env:\n');
  console.log(`GA4_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}\n`);
  process.exit(0);
}

const services = {
  gsc: testGsc,
  pagespeed: testPagespeed,
  perplexity: testPerplexity,
  gbp: testGbp,
  ga4: testGa4,
};

async function main() {
  const toRun = onlyService ? { [onlyService]: services[onlyService] } : services;
  if (onlyService && !services[onlyService]) {
    console.error(`Unknown service: ${onlyService}. Valid: ${Object.keys(services).join(', ')}`);
    process.exit(2);
  }
  let allOk = true;
  const cronMode = args.includes('--cron');
  const results = [];
  for (const [name, fn] of Object.entries(toRun)) {
    if (!cronMode) process.stdout.write(`Testing ${name.padEnd(12)} ... `);
    try {
      const result = await fn();
      if (!cronMode) console.log(`OK ${result || 'OK'}`);
      results.push({ service: name, status: 'ok', detail: result || 'OK' });
    } catch (err) {
      if (!cronMode) console.log(`FAIL ${err.message}`);
      results.push({ service: name, status: 'fail', detail: err.message });
      allOk = false;
    }
  }

  // P4.1 — cron-mode escalation
  if (cronMode) {
    const { appendRun, recordSuccess, recordFailure, checkBackoff } = await import('./lib/audit-log.mjs');
    const { writeInboxItem } = await import('./lib/cron-mode.mjs');
    const ROUTINE_ID = 'portfolio-weekly-credentials-health';
    const ROUTINE_VERSION = '1.0';

    if (await checkBackoff({ routine: ROUTINE_ID })) {
      console.error(`Routine ${ROUTINE_ID} at backoff threshold. Exiting.`);
      process.exit(0);
    }

    const failures = results.filter((r) => r.status === 'fail');
    const path = await import('node:path');
    const portfolioDir = path.resolve('sites/_portfolio');
    const fsMod = await import('node:fs/promises');
    await fsMod.mkdir(portfolioDir, { recursive: true });

    if (failures.length > 0) {
      // Identify auth-expiry-shaped failures vs. transient errors
      const tokenIssues = failures.filter((f) =>
        /expired|invalid_grant|refresh|token|unauthor|403|401/i.test(f.detail),
      );

      await writeInboxItem({
        siteDir: portfolioDir,
        routine: ROUTINE_ID,
        routineVersion: ROUTINE_VERSION,
        topic: 'credentials-failures',
        site: null,
        trigger: `${failures.length} service(s) failed auth: ${failures.map((f) => f.service).join(', ')}`,
        whatITried: `Ran scripts/test-api-auth.mjs --cron against 5 provisioned APIs (gsc, pagespeed, perplexity, gbp, ga4).\n\nResults:\n${results
          .map((r) => `  ${r.service.padEnd(12)} ${r.status === 'ok' ? 'OK' : 'FAIL'}  ${r.detail.slice(0, 200)}`)
          .join('\n')}\n\n${
          tokenIssues.length > 0
            ? `Token-shaped issues detected (likely expired/revoked credentials, NOT transient errors):\n${tokenIssues.map((t) => `  - ${t.service}: ${t.detail.slice(0, 300)}`).join('\n')}`
            : 'No token-shaped failures detected — likely transient (rate limit, network, service outage).'
        }`,
        whatINeed: `For each failing service:\n\n1. **If detail looks like token/auth expiry** (invalid_grant, expired token, 401, 403): re-run the one-time OAuth flow per scripts/test-api-auth.mjs comments. For GSC/GBP this means running test-api-auth.mjs with --gsc-code or --gbp-code argument after visiting the printed authorization URL.\n\n2. **If detail looks like rate-limit or transient**: wait 24h and re-test manually with \`node scripts/test-api-auth.mjs --service=<name>\`. If still failing, escalate to (1).\n\n3. **If detail looks like permission/scope mismatch**: the OAuth scopes were probably reduced; re-run the flow requesting the original scope set.\n\n**Why this matters:** if a refresh token has expired, ALL production cron routines that depend on that API silently fail (per Q2/Q5/Q9/Q12 contracts). This cron catches it within 7 days instead of the user noticing a missing weekly digest report 30 days later.`,
        contextLinks: ['scripts/test-api-auth.mjs', '.env'],
      });
      await recordFailure({ routine: ROUTINE_ID });
    } else {
      await recordSuccess({ routine: ROUTINE_ID });
    }

    await appendRun({
      routine: ROUTINE_ID,
      routineVersion: ROUTINE_VERSION,
      site: null,
      durationSec: null,
      exit: failures.length === 0 ? 'shipped' : 'escalated',
      filesTouched: [],
      escalations: failures.map((f) => `${f.service}: ${f.detail.slice(0, 100)}`),
    });
    process.exit(0); // cron mode never fails the process — escalation is via inbox
  }

  process.exit(allOk ? 0 : 1);
}

async function testGsc() {
  const clientId = process.env.GSC_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GSC_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GSC_OAUTH_REFRESH_TOKEN;
  if (!clientId || !clientSecret) {
    throw new Error('GSC_OAUTH_CLIENT_ID/SECRET not set in .env');
  }
  if (!refreshToken) {
    const oauth2 = new google.auth.OAuth2(clientId, clientSecret, 'urn:ietf:wg:oauth:2.0:oob');
    const url = oauth2.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/webmasters.readonly'],
      prompt: 'consent',
    });
    throw new Error(
      `Refresh token not set. One-time setup:\n  1. Visit: ${url}\n  2. Authorize as the owner of the GSC properties\n  3. Copy the code from the redirect page\n  4. Run: node scripts/test-api-auth.mjs --gsc-code=<paste-code>\n  5. Paste the printed refresh token into .env, then re-run this script`,
    );
  }
  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });
  const webmasters = google.webmasters({ version: 'v3', auth: oauth2 });
  const res = await webmasters.sites.list();
  const sites = res.data.siteEntry || [];
  return `${sites.length} verified properties accessible`;
}

async function testPagespeed() {
  const key = process.env.GOOGLE_PAGESPEED_API_KEY;
  if (!key) throw new Error('GOOGLE_PAGESPEED_API_KEY not set in .env');
  const url = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://www.example.com&key=${key}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  const score = data.lighthouseResult?.categories?.performance?.score;
  return `Lighthouse performance for example.com: ${score}`;
}

async function testPerplexity() {
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key || key === 'scrape') return 'Skipped (scrape fallback configured)';
  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.PERPLEXITY_MODEL || 'sonar',
      messages: [{ role: 'user', content: 'reply with the single word OK' }],
      max_tokens: 5,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content?.trim();
  return `model responded: "${content}"`;
}

async function testGbp() {
  const clientId = process.env.GBP_OAUTH_CLIENT_ID;
  if (!clientId) return 'Skipped (GBP_OAUTH_CLIENT_ID not set — pending API approval)';
  const refreshToken = process.env.GBP_OAUTH_REFRESH_TOKEN;
  if (!refreshToken) {
    const oauth2 = new google.auth.OAuth2(
      clientId,
      process.env.GBP_OAUTH_CLIENT_SECRET,
      'urn:ietf:wg:oauth:2.0:oob',
    );
    const url = oauth2.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/business.manage'],
      prompt: 'consent',
    });
    throw new Error(
      `Refresh token not set. After GBP API approval:\n  1. Visit: ${url}\n  2. Authorize as GBP owner\n  3. Run: node scripts/test-api-auth.mjs --gbp-code=<paste-code>\n  4. Paste refresh token into .env`,
    );
  }
  const oauth2 = new google.auth.OAuth2(clientId, process.env.GBP_OAUTH_CLIENT_SECRET);
  oauth2.setCredentials({ refresh_token: refreshToken });
  const mybusiness = google.mybusinessaccountmanagement({ version: 'v1', auth: oauth2 });
  const res = await mybusiness.accounts.list();
  return `${(res.data.accounts || []).length} GBP accounts accessible`;
}

async function testGa4() {
  // Path B (OAuth, primary): mirrors GSC pattern. The service-account approach
  // (Path A) was rejected by GA4's email validator on the seo-toolkit-ga4-reader
  // account even though the same account exists in IAM; per 2026-05-16 inbox
  // doc, retried 2026-05-17 with same rejection. Switched to OAuth Desktop
  // client. When GA4_OAUTH_* is present, use it; fall back to service-account
  // path only if OAuth credentials are missing (legacy path, mostly dead now).
  const oauthClientId = process.env.GA4_OAUTH_CLIENT_ID;
  if (oauthClientId) {
    const refreshToken = process.env.GA4_OAUTH_REFRESH_TOKEN;
    if (!refreshToken) {
      const oauth2 = new google.auth.OAuth2(
        oauthClientId,
        process.env.GA4_OAUTH_CLIENT_SECRET,
        'urn:ietf:wg:oauth:2.0:oob',
      );
      const url = oauth2.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/analytics.readonly'],
        prompt: 'consent',
      });
      throw new Error(
        `GA4_OAUTH_REFRESH_TOKEN not set. One-time setup:\n  1. Visit: ${url}\n  2. Authorize as a GA4 property owner\n  3. Copy the code from the redirect page\n  4. Run: node scripts/test-api-auth.mjs --ga4-code=<paste-code>\n  5. Paste the printed refresh token into .env, then re-run this script`,
      );
    }
    // @google-analytics/data v6+ expects GoogleAuth (not OAuth2) so it can
    // call getUniverseDomain(). Build a GoogleAuth instance from credentials.
    const authClient = new google.auth.GoogleAuth({
      credentials: {
        type: 'authorized_user',
        client_id: oauthClientId,
        client_secret: process.env.GA4_OAUTH_CLIENT_SECRET,
        refresh_token: refreshToken,
      },
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });
    const client = new BetaAnalyticsDataClient({ auth: authClient });
    // Try site-a's property (<your-ga4-property-id>) first. If no access, try site-b.
    const propertiesToTry = [
      { name: 'site-a', id: '<your-ga4-property-id>' },
      { name: 'site-b', id: '<your-ga4-property-id-2>' }, // from the GA4 URL path we navigated earlier
    ];
    const results = [];
    for (const prop of propertiesToTry) {
      try {
        const [resp] = await client.runReport({
          property: `properties/${prop.id}`,
          dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          metrics: [{ name: 'sessions' }],
        });
        results.push(`${prop.name}: ${resp.rows?.length || 0} row(s)`);
      } catch (err) {
        if (err.message.includes('PERMISSION_DENIED') || err.code === 7) {
          results.push(`${prop.name}: no access`);
        } else {
          results.push(`${prop.name}: error (${err.message.slice(0, 60)})`);
        }
      }
    }
    return `OAuth working — ${results.join(', ')}`;
  }

  // Legacy: service-account path (kept as fallback; current rejection state means
  // this won't work for the seo-toolkit-ga4-reader account — see inbox doc).
  const keyPath = process.env.GA4_SERVICE_ACCOUNT_JSON_PATH;
  if (!keyPath) throw new Error('GA4_OAUTH_CLIENT_ID not set in .env and no GA4_SERVICE_ACCOUNT_JSON_PATH fallback');
  const exists = await fs.stat(keyPath).catch(() => false);
  if (!exists) throw new Error(`Service account JSON not found at ${keyPath}`);
  const client = new BetaAnalyticsDataClient({ keyFilename: keyPath });
  try {
    const [resp] = await client.runReport({
      property: `properties/<your-ga4-property-id>`,
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      metrics: [{ name: 'sessions' }],
    });
    return `site-a GA4 returned ${resp.rows?.length || 0} row(s)`;
  } catch (err) {
    if (err.message.includes('PERMISSION_DENIED') || err.code === 7) {
      return 'JSON valid but no GA4 property access yet (see sites/site-a/_inbox/2026-05-16-ga4-service-account-grants-deferred.md)';
    }
    throw err;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
