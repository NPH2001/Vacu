import { describe, it, expect } from 'vitest';
import { isSafeHref, safeHrefField } from '@/lib/safe-url';

describe('isSafeHref', () => {
  it('rejects script-executing schemes (any casing / whitespace)', () => {
    for (const bad of ['javascript:alert(1)', 'JavaScript:x', '  javascript:x', 'data:text/html,x', 'vbscript:x']) {
      expect(isSafeHref(bad)).toBe(false);
    }
  });
  it('allows normal links', () => {
    for (const ok of ['/products', 'https://x.com', 'mailto:a@b.com', 'tel:123', '#top', '']) {
      expect(isSafeHref(ok)).toBe(true);
    }
  });
});

describe('safeHrefField', () => {
  const f = safeHrefField();
  it('blanks a dangerous href and passes a safe one', () => {
    expect(f.parse('javascript:alert(1)')).toBe('');
    expect(f.parse('/farmers')).toBe('/farmers');
    expect(f.parse(undefined)).toBe(''); // default
  });
});
