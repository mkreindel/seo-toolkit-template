#!/usr/bin/env node
/**
 * semrush.mjs
 *
 * Thin wrapper over the SEMrush v3 + Analytics APIs. Loads SEMRUSH_API_KEY
 * from .env so the key never appears on the command line.
 *
 * Usage:
 *   node scripts/semrush.mjs units
 *   node scripts/semrush.mjs domain --domain=example.com [--database=us]
 *   node scripts/semrush.mjs backlinks --domain=example.com
 *   node scripts/semrush.mjs keyword --phrase="ai consultant for small business" [--database=us]
 *   node scripts/semrush.mjs competitors --domain=example.com [--database=us] [--limit=10]
 *   node scripts/semrush.mjs gap --domain=example.com --vs=comp1.com,comp2.com [--database=us] [--limit=50]
 *
 * Each subcommand prints JSON to stdout. Pipe to `jq` or redirect to a file.
 *
 * Docs:
 *   https://developer.semrush.com/api/
 */

import 'dotenv/config';

const KEY = process.env.SEMRUSH_API_KEY;
if (!KEY) {
  console.error('❌ SEMRUSH_API_KEY missing from .env');
  process.exit(1);
}

const args = Object.fromEntries(
  process.argv
    .slice(3)
    .map((a) => a.replace(/^--/, '').split('='))
    .map(([k, v]) => [k, v ?? true])
);
const cmd = process.argv[2];

const V3_BASE = 'https://api.semrush.com/';
const ANALYTICS_BASE = 'https://api.semrush.com/analytics/v1/';

function parseCsv(text) {
  const lines = text.replace(/\r/g, '').trim().split('\n').filter(Boolean);
  if (!lines.length) return [];
  const header = lines[0].split(';');
  return lines.slice(1).map((row) => {
    const cells = row.split(';');
    return Object.fromEntries(header.map((h, i) => [h, cells[i]]));
  });
}

async function call(base, params) {
  const url = new URL(base);
  for (const [k, v] of Object.entries({ key: KEY, ...params })) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url);
  const text = await res.text();
  if (text.includes('NOTHING FOUND')) return '';
  if (!res.ok || text.startsWith('ERROR')) {
    throw new Error(`SEMrush ${res.status}: ${text.slice(0, 300)}`);
  }
  return text;
}

async function units() {
  const url = new URL('https://www.semrush.com/users/countapiunits.html');
  url.searchParams.set('key', KEY);
  const res = await fetch(url);
  const text = (await res.text()).trim();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
  return { api_units_remaining: Number(text) };
}

async function domain(d, database = 'us') {
  const text = await call(V3_BASE, {
    type: 'domain_ranks',
    domain: d,
    database,
    export_columns: 'Db,Dn,Rk,Or,Ot,Oc,Ad,At,Ac,Sh,Sv',
  });
  const rows = parseCsv(text);
  // Authority Score lives in a separate endpoint (backlinks API)
  let authority_score = null;
  try {
    const asText = await call(ANALYTICS_BASE, {
      type: 'backlinks_overview',
      target: d,
      target_type: 'root_domain',
      export_columns: 'ascore,domains_num,urls_num,backlinks_num,ips_num,follows_num,nofollows_num',
    });
    const asRows = parseCsv(asText);
    if (asRows[0]) authority_score = Number(asRows[0].ascore);
  } catch (e) {
    authority_score = `error: ${e.message}`;
  }
  return { rows, authority_score };
}

async function backlinks(d) {
  const text = await call(ANALYTICS_BASE, {
    type: 'backlinks_overview',
    target: d,
    target_type: 'root_domain',
    export_columns: 'ascore,domains_num,urls_num,backlinks_num,ips_num,follows_num,nofollows_num,texts_num,images_num,forms_num,frames_num',
  });
  return parseCsv(text);
}

async function referringDomainsList(d, limit = 25) {
  const text = await call(ANALYTICS_BASE, {
    type: 'backlinks_refdomains',
    target: d,
    target_type: 'root_domain',
    display_limit: String(limit),
    export_columns: 'domain_ascore,domain,backlinks_num,ip',
  });
  return parseCsv(text);
}

async function keyword(phrase, database = 'us') {
  const text = await call(V3_BASE, {
    type: 'phrase_this',
    phrase,
    database,
    export_columns: 'Ph,Nq,Cp,Co,Nr,Td',
  });
  return parseCsv(text);
}

async function keywordKd(phrase, database = 'us') {
  // KD lives in phrase_kdi
  try {
    const text = await call(V3_BASE, {
      type: 'phrase_kdi',
      phrase,
      database,
      export_columns: 'Ph,Kd',
    });
    return parseCsv(text);
  } catch (e) {
    return [{ Ph: phrase, Kd: `error: ${e.message}` }];
  }
}

async function domainOrganic(d, database = 'us', limit = 30) {
  const text = await call(V3_BASE, {
    type: 'domain_organic',
    domain: d,
    database,
    display_limit: String(limit),
    display_sort: 'tr_desc',
    export_columns: 'Ph,Po,Nq,Cp,Co,Tr,Ur',
  });
  return parseCsv(text);
}

async function serp(phrase, database = 'us', limit = 20) {
  const text = await call(V3_BASE, {
    type: 'phrase_organic',
    phrase,
    database,
    display_limit: String(limit),
    export_columns: 'Dn,Ur',
  });
  return parseCsv(text);
}

async function competitors(d, database = 'us', limit = 10) {
  const text = await call(V3_BASE, {
    type: 'domain_organic_organic',
    domain: d,
    database,
    display_limit: String(limit),
    export_columns: 'Dn,Cr,Np,Or,Ot,Oc,At,Ad',
  });
  return parseCsv(text);
}

async function gap(d, vsDomains, database = 'us', limit = 50) {
  // Format: domains=<sign>|<type>|<domain>|...
  // Sign: * = MUST rank for; - = MUST NOT rank for. Type: or = root organic.
  // We want: competitors rank for it AND site-a does NOT.
  const domainsList = vsDomains.split(',');
  const theirs = domainsList.map((c) => `*|or|${c.trim()}`).join('|');
  const ours = `-|or|${d}`;
  const text = await call(V3_BASE, {
    type: 'domain_domains',
    domains: `${theirs}|${ours}`,
    database,
    display_limit: String(limit),
    export_columns: 'Ph,P0,P1,P2,Nq,Cp,Co,Nr',
  });
  return parseCsv(text);
}

try {
  let result;
  switch (cmd) {
    case 'units':
      result = await units();
      break;
    case 'domain':
      if (!args.domain) throw new Error('--domain required');
      result = await domain(args.domain, args.database);
      break;
    case 'backlinks':
      if (!args.domain) throw new Error('--domain required');
      result = {
        overview: await backlinks(args.domain),
        top_referring_domains: await referringDomainsList(args.domain, Number(args.limit) || 25),
      };
      break;
    case 'keyword':
      if (!args.phrase) throw new Error('--phrase required');
      result = {
        overview: await keyword(args.phrase, args.database),
        difficulty: await keywordKd(args.phrase, args.database),
      };
      break;
    case 'competitors':
      if (!args.domain) throw new Error('--domain required');
      result = await competitors(args.domain, args.database, Number(args.limit) || 10);
      break;
    case 'serp':
      if (!args.phrase) throw new Error('--phrase required');
      result = await serp(args.phrase, args.database, Number(args.limit) || 20);
      break;
    case 'organic':
      if (!args.domain) throw new Error('--domain required');
      result = await domainOrganic(args.domain, args.database, Number(args.limit) || 30);
      break;
    case 'gap':
      if (!args.domain || !args.vs) throw new Error('--domain and --vs (comma-list) required');
      result = await gap(args.domain, args.vs, args.database, Number(args.limit) || 50);
      break;
    default:
      console.error(`Unknown subcommand: ${cmd || '(none)'}\nSee header for usage.`);
      process.exit(1);
  }
  console.log(JSON.stringify(result, null, 2));
} catch (e) {
  console.error(`❌ ${e.message}`);
  process.exit(1);
}
