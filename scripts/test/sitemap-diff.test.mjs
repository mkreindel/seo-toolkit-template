import { describe, it, expect } from 'vitest';
import { parseSitemap, diffSitemaps } from '../lib/sitemap.mjs';

describe('parseSitemap', () => {
  it('extracts URLs from a basic sitemap', async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url><loc>https://example.com/</loc></url>
        <url><loc>https://example.com/about</loc></url>
      </urlset>`;
    const urls = await parseSitemap(xml);
    expect(urls).toEqual(['https://example.com/', 'https://example.com/about']);
  });

  it('returns empty array on empty sitemap', async () => {
    const xml = `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;
    const urls = await parseSitemap(xml);
    expect(urls).toEqual([]);
  });

  it('handles single-URL sitemaps (xml2js array unwrapping)', async () => {
    const xml = `<?xml version="1.0"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url><loc>https://only.example.com/</loc></url>
      </urlset>`;
    const urls = await parseSitemap(xml);
    expect(urls).toEqual(['https://only.example.com/']);
  });
});

describe('diffSitemaps', () => {
  it('detects added URLs', () => {
    const baseline = ['/a', '/b'];
    const current = ['/a', '/b', '/c'];
    const diff = diffSitemaps(baseline, current);
    expect(diff.added).toEqual(['/c']);
    expect(diff.removed).toEqual([]);
  });

  it('detects removed URLs', () => {
    const baseline = ['/a', '/b', '/c'];
    const current = ['/a', '/c'];
    const diff = diffSitemaps(baseline, current);
    expect(diff.added).toEqual([]);
    expect(diff.removed).toEqual(['/b']);
  });

  it('detects both added and removed', () => {
    const baseline = ['/a', '/b'];
    const current = ['/a', '/c'];
    const diff = diffSitemaps(baseline, current);
    expect(diff.added).toEqual(['/c']);
    expect(diff.removed).toEqual(['/b']);
  });

  it('returns empty diff when sitemaps match', () => {
    const same = ['/a', '/b'];
    const diff = diffSitemaps(same, same);
    expect(diff.added).toEqual([]);
    expect(diff.removed).toEqual([]);
  });
});
