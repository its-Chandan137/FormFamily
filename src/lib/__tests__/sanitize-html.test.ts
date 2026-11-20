import { describe, expect, it } from 'vitest';
import { sanitizeHtml } from '../sanitize-html';

describe('sanitizeHtml', () => {
  it('strips script tags', () => {
    const dirty = '<p>Hello</p><script>alert("xss")</script><p>World</p>';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain('<script');
    expect(clean).not.toContain('alert');
    expect(clean).toContain('<p>Hello</p>');
    expect(clean).toContain('<p>World</p>');
  });

  it('strips inline event handlers', () => {
    const dirty =
      '<p onclick="alert(1)" onmouseover="steal()">Click</p><img src="x" onerror="alert(2)" />';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toMatch(/on\w+\s*=/i);
    expect(clean).not.toContain('alert');
    expect(clean).toContain('Click');
  });

  it('preserves allowed rich text markup and safe links', () => {
    const clean = sanitizeHtml(
      '<h2>Title</h2><p><strong>Hi</strong> <a href="https://example.com">link</a></p><ul><li>One</li></ul>',
    );
    expect(clean).toContain('<h2>Title</h2>');
    expect(clean).toContain('<strong>Hi</strong>');
    expect(clean).toContain('href="https://example.com"');
    expect(clean).toContain('<ul><li>One</li></ul>');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeHtml('')).toBe('');
    expect(sanitizeHtml(null)).toBe('');
    expect(sanitizeHtml(undefined)).toBe('');
  });
});
