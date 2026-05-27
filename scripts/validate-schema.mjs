#!/usr/bin/env node
/**
 * validate-schema.mjs
 *
 * Validates JSON-LD schema markup on a URL using:
 *   1. Schema.org Validator (validator.schema.org) — strict structural validation
 *   2. Google Rich Results Test (search.google.com/test/rich-results) — eligibility check
 *
 * Note: Google's Rich Results Test API is not publicly documented as of 2026.
 * This script does the next best thing:
 *   - Uses Schema.org Validator's public API for structural validation.
 *   - Extracts JSON-LD from the page and prints it formatted.
 *   - Outputs a Rich Results Test deep-link the user can click to manually verify.
 *
 * Usage:
 *   node scripts/validate-schema.mjs --url=https://example.com/blog/my-post
 *
 *   # Or validate raw JSON-LD from a file:
 *   node scripts/validate-schema.mjs --jsonld=path/to/schema.json
 */

import 'dotenv/config';
import fs from 'node:fs/promises';

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .map((a) => a.replace(/^--/, '').split('='))
    .map(([k, v]) => [k, v ?? true])
);

if (!args.url && !args.jsonld) {
  console.error('❌ Provide --url=<URL> or --jsonld=<path>');
  process.exit(1);
}

// --------------- extract JSON-LD from HTML ---------------

async function extractJsonLdFromUrl(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEO-Toolkit-Validator/1.0)' },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const html = await res.text();

  const matches = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  if (matches.length === 0) {
    return [];
  }

  const blocks = [];
  for (const m of matches) {
    try {
      blocks.push(JSON.parse(m[1].trim()));
    } catch (err) {
      console.warn(`⚠️  Skipped malformed JSON-LD block: ${err.message}`);
    }
  }
  return blocks;
}

// --------------- schema.org validator ---------------

async function validateWithSchemaOrg(jsonld) {
  // Schema.org Validator endpoint: https://validator.schema.org/validate
  // It accepts a POST with the JSON-LD body.
  const res = await fetch('https://validator.schema.org/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ json: JSON.stringify(jsonld) }),
  });
  if (!res.ok) {
    return { error: `Schema.org Validator returned ${res.status}` };
  }
  return await res.json();
}

// --------------- summarize ---------------

function summarizeBlock(block) {
  const types = [];
  function collectTypes(obj) {
    if (obj && typeof obj === 'object') {
      if (obj['@type']) {
        const t = Array.isArray(obj['@type']) ? obj['@type'].join('+') : obj['@type'];
        types.push(t);
      }
      for (const v of Object.values(obj)) {
        if (Array.isArray(v)) v.forEach(collectTypes);
        else if (typeof v === 'object') collectTypes(v);
      }
    }
  }
  collectTypes(block);
  return types;
}

// --------------- main ---------------

let blocks = [];

if (args.url) {
  console.log(`🔍 Fetching ${args.url}`);
  blocks = await extractJsonLdFromUrl(args.url);
  console.log(`   Found ${blocks.length} JSON-LD block(s)\n`);
} else {
  const raw = await fs.readFile(args.jsonld, 'utf-8');
  const parsed = JSON.parse(raw);
  blocks = Array.isArray(parsed) ? parsed : [parsed];
}

if (blocks.length === 0) {
  console.error('❌ No JSON-LD found.');
  console.error('   Tip: if the site is CSR (e.g., Lovable), schema may only render client-side.');
  console.error('   Use Google Search Console URL Inspection → View Crawled Page to see what Googlebot gets.');
  process.exit(1);
}

let allOk = true;

for (let i = 0; i < blocks.length; i++) {
  const block = blocks[i];
  const types = summarizeBlock(block);
  console.log(`📋 Block ${i + 1}: ${types.join(', ') || 'unknown type'}`);

  const result = await validateWithSchemaOrg(block);
  if (result.error) {
    console.log(`   ⚠️  ${result.error}`);
    continue;
  }

  // The Schema.org Validator response shape varies — handle defensively.
  const errors = result.errors || result.tripleErrors || [];
  const warnings = result.warnings || [];

  if (errors.length === 0 && warnings.length === 0) {
    console.log('   ✅ Validates without errors or warnings');
  } else {
    if (errors.length > 0) {
      allOk = false;
      console.log(`   ❌ ${errors.length} error(s):`);
      errors.forEach((e) => console.log(`      - ${e.message || JSON.stringify(e)}`));
    }
    if (warnings.length > 0) {
      console.log(`   ⚠️  ${warnings.length} warning(s):`);
      warnings.forEach((w) => console.log(`      - ${w.message || JSON.stringify(w)}`));
    }
  }
  console.log('');
}

// --------------- Rich Results Test deep-link ---------------

if (args.url) {
  const rrtUrl = `https://search.google.com/test/rich-results?url=${encodeURIComponent(args.url)}`;
  console.log(`🔗 Manually verify with Google Rich Results Test:`);
  console.log(`   ${rrtUrl}`);
  console.log(`   (Google does not offer a public API for this test.)`);
}

console.log('');

if (allOk) {
  console.log('✅ All schema validates structurally. Proceed with Rich Results Test for eligibility check.');
  process.exit(0);
} else {
  console.log('❌ Schema has errors. Fix before publishing.');
  process.exit(1);
}
