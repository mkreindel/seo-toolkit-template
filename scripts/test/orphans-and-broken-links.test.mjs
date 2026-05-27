import { describe, it, expect } from 'vitest';
import { extractInternalLinks, findOrphans } from '../orphans-and-broken-links.mjs';

describe('extractInternalLinks', () => {
  it('extracts hrefs pointing to the same host (absolute + relative)', () => {
    const html = `<html><body>
      <a href="/about">About</a>
      <a href="https://example.com/contact">Contact</a>
      <a href="https://other.com/page">External</a>
      <a href="#anchor">Anchor</a>
      <a href="mailto:hello@example.com">Email</a>
      <a href="tel:+15551234567">Phone</a>
      <a href="javascript:void(0)">JS</a>
    </body></html>`;
    const links = extractInternalLinks(html, 'https://example.com');
    expect(links).toContain('https://example.com/about');
    expect(links).toContain('https://example.com/contact');
    expect(links).not.toContain('https://other.com/page');
  });

  it('strips fragment from URLs', () => {
    const html = `<a href="/page#section">Link</a>`;
    const links = extractInternalLinks(html, 'https://example.com');
    expect(links).toEqual(['https://example.com/page']);
  });

  it('returns empty array for HTML with no links', () => {
    expect(extractInternalLinks('<p>No links</p>', 'https://example.com')).toEqual([]);
  });
});

describe('findOrphans', () => {
  it('flags URLs in sitemap that have zero inbound internal links', () => {
    const sitemapUrls = ['/a', '/b', '/c', '/d'];
    const inboundLinks = new Map([
      ['/a', ['/b', '/c']],
      ['/b', ['/a']],
      ['/c', []],
      ['/d', []],
    ]);
    expect(findOrphans(sitemapUrls, inboundLinks)).toEqual(['/c', '/d']);
  });

  it('excludes homepage from orphan check', () => {
    const sitemapUrls = ['/', '/about'];
    const inboundLinks = new Map([
      ['/', []],
      ['/about', ['/']],
    ]);
    expect(findOrphans(sitemapUrls, inboundLinks)).toEqual([]);
  });

  it('handles missing entries in inboundLinks (treats as zero inbound)', () => {
    const sitemapUrls = ['/a', '/b'];
    const inboundLinks = new Map([['/a', ['/something']]]);
    expect(findOrphans(sitemapUrls, inboundLinks)).toEqual(['/b']);
  });
});
