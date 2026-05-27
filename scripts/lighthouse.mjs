#!/usr/bin/env node
/**
 * lighthouse.mjs
 *
 * Runs a mobile Lighthouse audit on a URL using Google's PageSpeed Insights API
 * (free, no install required).
 *
 * Usage:
 *   node scripts/lighthouse.mjs --url=https://example.com [--strategy=mobile|desktop] [--out=path/to/report.json]
 *
 * Defaults: strategy=mobile (matches Google's mobile-first ranking).
 *
 * Requires:
 *   - GOOGLE_PAGESPEED_API_KEY in .env
 *     Get one free: https://console.cloud.google.com/apis/credentials
 *     Enable: PageSpeed Insights API
 *
 * Output: prints summary to stdout; optionally writes full JSON report to --out.
 */

import 'dotenv/config';
import fs from 'node:fs/promises';

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .map((a) => a.replace(/^--/, '').split('='))
    .map(([k, v]) => [k, v ?? true])
);

if (!args.url) {
  console.error('❌ --url=<URL> required');
  process.exit(1);
}

const url = args.url;
const strategy = args.strategy || 'mobile';
const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;

if (!apiKey) {
  console.error('❌ GOOGLE_PAGESPEED_API_KEY missing in .env');
  console.error('   Get one free: https://console.cloud.google.com/apis/credentials');
  process.exit(1);
}

// --------------- thresholds (from SEO_GUIDE.md Section 6.2) ---------------

const FLOORS = {
  performance: 70,
  accessibility: 90,
  'best-practices': 95,
  seo: 95,
};

const STRETCH = 100;

const CWV = {
  lcp: { good: 2500, poor: 4000 },           // ms
  inp: { good: 200, poor: 500 },             // ms
  cls: { good: 0.1, poor: 0.25 },            // unitless
};

// --------------- run ---------------

const apiUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
apiUrl.searchParams.set('url', url);
apiUrl.searchParams.set('strategy', strategy);
apiUrl.searchParams.set('key', apiKey);
['performance', 'accessibility', 'best-practices', 'seo'].forEach((c) => apiUrl.searchParams.append('category', c));

console.log(`⏱️  Running Lighthouse (${strategy}) on ${url}`);
console.log(`   This typically takes 30–60 seconds...`);

const res = await fetch(apiUrl);
if (!res.ok) {
  console.error(`❌ PageSpeed API error ${res.status}: ${await res.text()}`);
  process.exit(1);
}
const data = await res.json();

if (data.error) {
  console.error(`❌ ${data.error.message}`);
  process.exit(1);
}

// --------------- extract scores ---------------

const categories = data.lighthouseResult?.categories || {};
const audits = data.lighthouseResult?.audits || {};

const scores = Object.fromEntries(
  Object.entries(categories).map(([k, v]) => [k, Math.round((v.score || 0) * 100)])
);

// --------------- Core Web Vitals (lab) ---------------

const lab = {
  lcp: audits['largest-contentful-paint']?.numericValue,
  cls: audits['cumulative-layout-shift']?.numericValue,
  inp: audits['interaction-to-next-paint']?.numericValue,
  tbt: audits['total-blocking-time']?.numericValue,
  fcp: audits['first-contentful-paint']?.numericValue,
  speedIndex: audits['speed-index']?.numericValue,
};

// --------------- Core Web Vitals (field, from CrUX) ---------------

const field = data.loadingExperience?.metrics || {};
const fieldVitals = {
  lcp: field.LARGEST_CONTENTFUL_PAINT_MS?.percentile,
  inp: field.INTERACTION_TO_NEXT_PAINT?.percentile,
  cls: (field.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile || 0) / 100, // CrUX returns CLS × 100
};

// --------------- print ---------------

function fmt(score, category) {
  const floor = FLOORS[category];
  const status = score >= STRETCH ? '🏆 PERFECT' : score >= 90 ? '✅ EXCELLENT' : score >= floor ? '✅ ABOVE FLOOR' : '❌ BELOW FLOOR';
  return `${score.toString().padStart(3)} / 100   ${status}`;
}

function fmtMs(ms, threshold, label) {
  if (ms == null) return `   (no data)`;
  const status = ms <= threshold.good ? '✅ Good' : ms <= threshold.poor ? '⚠️  Needs improvement' : '❌ Poor';
  return `${Math.round(ms).toString().padStart(5)} ms   ${status}`;
}

function fmtUnit(v, threshold) {
  if (v == null) return `   (no data)`;
  const status = v <= threshold.good ? '✅ Good' : v <= threshold.poor ? '⚠️  Needs improvement' : '❌ Poor';
  return `${v.toFixed(3).padStart(7)}     ${status}`;
}

console.log('\n📊 LIGHTHOUSE SCORES');
console.log('─────────────────────────────────────────────');
console.log(`   Performance       ${fmt(scores.performance, 'performance')}`);
console.log(`   Accessibility     ${fmt(scores.accessibility, 'accessibility')}`);
console.log(`   Best Practices    ${fmt(scores['best-practices'], 'best-practices')}`);
console.log(`   SEO               ${fmt(scores.seo, 'seo')}`);

console.log('\n⚡ CORE WEB VITALS (lab — synthetic test)');
console.log('─────────────────────────────────────────────');
console.log(`   LCP   ${fmtMs(lab.lcp, CWV.lcp, 'LCP')}`);
console.log(`   INP   ${fmtMs(lab.inp, CWV.inp, 'INP')}`);
console.log(`   CLS   ${fmtUnit(lab.cls, CWV.cls)}`);
console.log(`   FCP   ${fmtMs(lab.fcp, { good: 1800, poor: 3000 }, 'FCP')}`);
console.log(`   TBT   ${fmtMs(lab.tbt, { good: 200, poor: 600 }, 'TBT')}`);

if (Object.values(fieldVitals).some((v) => v != null)) {
  console.log('\n📡 CORE WEB VITALS (field — real users, last 28 days)');
  console.log('   Note: field data is what Google ranks on. Lab is just a proxy.');
  console.log('─────────────────────────────────────────────');
  console.log(`   LCP   ${fmtMs(fieldVitals.lcp, CWV.lcp, 'LCP')}`);
  console.log(`   INP   ${fmtMs(fieldVitals.inp, CWV.inp, 'INP')}`);
  console.log(`   CLS   ${fmtUnit(fieldVitals.cls, CWV.cls)}`);
} else {
  console.log('\n📡 CORE WEB VITALS (field): not enough real-user data.');
  console.log('   This means the page hasn\'t had enough traffic for Chrome User Experience Report.');
  console.log('   Optimize on lab data; field data will populate once traffic builds.');
}

// --------------- top opportunities ---------------

const opportunities = Object.values(audits)
  .filter((a) => a.details?.type === 'opportunity' && a.numericValue > 0)
  .sort((a, b) => (b.numericValue || 0) - (a.numericValue || 0))
  .slice(0, 5);

if (opportunities.length > 0) {
  console.log('\n🎯 TOP 5 OPPORTUNITIES (estimated time savings)');
  console.log('─────────────────────────────────────────────');
  for (const op of opportunities) {
    const savings = (op.numericValue / 1000).toFixed(2);
    console.log(`   ${savings.padStart(5)}s   ${op.title}`);
  }
}

// --------------- pass/fail summary ---------------

const failingScores = Object.entries(scores).filter(([cat, sc]) => sc < FLOORS[cat]);
console.log('\n─────────────────────────────────────────────');
if (failingScores.length === 0) {
  console.log('✅ All scores at or above floor. Ship it.');
} else {
  console.log(`❌ ${failingScores.length} score(s) below floor:`);
  failingScores.forEach(([cat, sc]) => console.log(`   - ${cat}: ${sc} (floor: ${FLOORS[cat]})`));
  console.log('\n   Fix before publishing or marking as done.');
}

// --------------- save full report ---------------

if (args.out) {
  await fs.writeFile(args.out, JSON.stringify(data, null, 2));
  console.log(`\n📝 Full Lighthouse report: ${args.out}`);
}

process.exit(failingScores.length > 0 ? 1 : 0);
