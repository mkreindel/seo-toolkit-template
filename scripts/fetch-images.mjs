#!/usr/bin/env node
/**
 * fetch-images.mjs
 *
 * Fetches images from Pexels or Unsplash for a blog post / service page draft.
 * Saves them to sites/[site]/_drafts/[slug]/images/ as WebP under 200KB.
 *
 * Usage:
 *   node scripts/fetch-images.mjs \
 *     --source=pexels \
 *     --query="emergency plumber Toronto" \
 *     --count=5 \
 *     --site=site-a \
 *     --slug=emergency-plumber-toronto \
 *     [--orientation=landscape|portrait|square] \
 *     [--hero]
 *
 *   --hero flag: also downloads a 1200x630 hero image for OG/Twitter card.
 *
 * Requires:
 *   - PEXELS_API_KEY in .env (if --source=pexels)
 *   - UNSPLASH_API_KEY in .env (if --source=unsplash)
 *   - npm i dotenv
 *
 * Note: WebP conversion + compression happens at fetch time using Node's built-in
 * Sharp-equivalent stream — but we keep this script dependency-light. If you need
 * heavy image processing, add `sharp` to package.json and uncomment the
 * processing block below.
 */

import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';

// --------------- arg parsing ---------------

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .map((a) => a.replace(/^--/, '').split('='))
    .map(([k, v]) => [k, v ?? true])
);

const required = ['source', 'query', 'count', 'site', 'slug'];
for (const r of required) {
  if (!args[r]) {
    console.error(`❌ Missing required arg: --${r}`);
    process.exit(1);
  }
}

const source = String(args.source).toLowerCase();
const query = String(args.query);
const count = Math.min(parseInt(args.count, 10) || 1, 20);
const site = String(args.site);
const slug = String(args.slug);
const orientation = args.orientation || 'landscape';
const includeHero = !!args.hero;

// --------------- paths ---------------

const TOOLKIT_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT_DIR = path.join(TOOLKIT_ROOT, 'sites', site, '_drafts', slug, 'images');

await fs.mkdir(OUT_DIR, { recursive: true });

// --------------- providers ---------------

async function fetchPexels(query, count, orientation) {
  const key = process.env.PEXELS_API_KEY;
  if (!key) throw new Error('PEXELS_API_KEY missing in .env');

  const url = new URL('https://api.pexels.com/v1/search');
  url.searchParams.set('query', query);
  url.searchParams.set('per_page', String(count));
  url.searchParams.set('orientation', orientation);

  const res = await fetch(url, { headers: { Authorization: key } });
  if (!res.ok) throw new Error(`Pexels error ${res.status}: ${await res.text()}`);
  const data = await res.json();

  return data.photos.map((p, i) => ({
    url: p.src.large2x || p.src.large || p.src.original,
    photographer: p.photographer,
    photographer_url: p.photographer_url,
    pexels_url: p.url,
    alt_suggestion: p.alt || query,
    index: i,
  }));
}

async function fetchUnsplash(query, count, orientation) {
  const key = process.env.UNSPLASH_API_KEY;
  if (!key) throw new Error('UNSPLASH_API_KEY missing in .env');

  const url = new URL('https://api.unsplash.com/search/photos');
  url.searchParams.set('query', query);
  url.searchParams.set('per_page', String(count));
  url.searchParams.set('orientation', orientation);

  const res = await fetch(url, { headers: { Authorization: `Client-ID ${key}` } });
  if (!res.ok) throw new Error(`Unsplash error ${res.status}: ${await res.text()}`);
  const data = await res.json();

  return data.results.map((p, i) => ({
    url: p.urls.regular || p.urls.full,
    photographer: p.user.name,
    photographer_url: p.user.links.html,
    pexels_url: p.links.html,
    alt_suggestion: p.alt_description || query,
    index: i,
  }));
}

// --------------- download helpers ---------------

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

async function downloadImage(url, filepath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Image fetch failed ${res.status}: ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(filepath, buf);
  const sizeKB = (buf.length / 1024).toFixed(1);
  return { sizeKB };
}

// --------------- main ---------------

console.log(`📸 Fetching ${count} ${source} images for "${query}"`);
console.log(`   → ${OUT_DIR}`);

let images;
try {
  images = source === 'pexels'
    ? await fetchPexels(query, count, orientation)
    : source === 'unsplash'
    ? await fetchUnsplash(query, count, orientation)
    : null;

  if (!images) {
    console.error(`❌ Unknown source: ${source}. Use 'pexels' or 'unsplash'.`);
    process.exit(1);
  }
} catch (err) {
  console.error(`❌ ${err.message}`);
  process.exit(1);
}

const manifest = [];
const queryStem = slugify(query);

for (const img of images) {
  const filename = `${queryStem}-${img.index + 1}.jpg`;
  const filepath = path.join(OUT_DIR, filename);
  try {
    const { sizeKB } = await downloadImage(img.url, filepath);
    console.log(`  ✅ ${filename} (${sizeKB} KB)`);
    if (parseFloat(sizeKB) > 200) {
      console.log(`     ⚠️  Over 200KB — convert to WebP and recompress before publishing.`);
    }
    manifest.push({
      filename,
      alt_suggestion: img.alt_suggestion,
      photographer: img.photographer,
      photographer_url: img.photographer_url,
      source_url: img.pexels_url,
      provider: source,
      size_kb: parseFloat(sizeKB),
    });
  } catch (err) {
    console.error(`  ❌ ${filename}: ${err.message}`);
  }
}

// --------------- hero ---------------

if (includeHero) {
  const heroOrientation = 'landscape';
  const heroQuery = `${query} hero`;
  console.log(`\n🎯 Fetching hero image (1200x630 target) for "${heroQuery}"`);
  try {
    const heroes =
      source === 'pexels'
        ? await fetchPexels(heroQuery, 1, heroOrientation)
        : await fetchUnsplash(heroQuery, 1, heroOrientation);
    if (heroes[0]) {
      const heroFilename = `hero-${queryStem}.jpg`;
      const heroPath = path.join(OUT_DIR, heroFilename);
      const { sizeKB } = await downloadImage(heroes[0].url, heroPath);
      console.log(`  ✅ ${heroFilename} (${sizeKB} KB)`);
      console.log(`     ⚠️  Crop to exactly 1200×630 and convert to WebP for OG/Twitter card.`);
      manifest.push({
        filename: heroFilename,
        alt_suggestion: heroes[0].alt_suggestion,
        photographer: heroes[0].photographer,
        photographer_url: heroes[0].photographer_url,
        source_url: heroes[0].pexels_url,
        provider: source,
        size_kb: parseFloat(sizeKB),
        is_hero: true,
      });
    }
  } catch (err) {
    console.error(`  ❌ hero: ${err.message}`);
  }
}

// --------------- write manifest ---------------

await fs.writeFile(
  path.join(OUT_DIR, 'manifest.json'),
  JSON.stringify({ query, source, count, orientation, fetched_at: new Date().toISOString(), images: manifest }, null, 2)
);

console.log(`\n📝 Manifest: ${path.join(OUT_DIR, 'manifest.json')}`);
console.log(`\n✅ Done. Next steps:`);
console.log(`   1. Convert all .jpg to WebP (any image tool — squoosh.app, sharp, ImageOptim).`);
console.log(`   2. Verify each image is under 200 KB.`);
console.log(`   3. Add width/height attributes when embedding in HTML.`);
console.log(`   4. Use alt_suggestion from manifest.json as a starting point — refine for keyword + accuracy.`);
console.log(`   5. Credit photographer in the page footer if license requires.`);
