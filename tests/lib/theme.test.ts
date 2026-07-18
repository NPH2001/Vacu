import { describe, it, expect } from 'vitest';
import { generateThemeCss, DEFAULT_THEME } from '@/lib/theme';

describe('generateThemeCss', () => {
  it('scopes to :root and overrides the green + amber ramps from the brand/accent', () => {
    const css = generateThemeCss(DEFAULT_THEME);
    expect(css.startsWith(':root{')).toBe(true);
    expect(css).toContain(`--brand:${DEFAULT_THEME.brandColor};`);
    expect(css).toContain(`--accent:${DEFAULT_THEME.accentColor};`);
    expect(css).toContain('--color-green-950:oklch(from var(--brand) 0.266 0.065 h);');
    expect(css).toContain('--color-amber-400:oklch(from var(--accent) 0.828 0.189 h);');
    // full ramps (the oklch definitions, not the admin-accent references)
    expect((css.match(/--color-green-\d+:oklch/g) ?? []).length).toBe(11);
    expect((css.match(/--color-amber-\d+:oklch/g) ?? []).length).toBe(11);
  });

  it('uses a scoped selector for the admin live preview', () => {
    expect(generateThemeCss(DEFAULT_THEME, '.theme-preview').startsWith('.theme-preview{')).toBe(true);
  });

  it('applies the radius scale and font variables', () => {
    const css = generateThemeCss({ ...DEFAULT_THEME, radiusScale: 0.5, fontBody: 'be-vietnam', fontHeading: 'playfair' });
    expect(css).toContain('--radius-2xl:calc(1rem * 0.5);');
    expect(css).toContain('--font-sans:var(--font-be-vietnam);');
    expect(css).toContain('--font-display:var(--font-playfair);');
  });

  it('maps the admin chrome accents onto the themed green ramp', () => {
    const css = generateThemeCss(DEFAULT_THEME);
    expect(css).toContain('--admin-accent:var(--color-green-700);');
  });

  it('falls back to safe defaults for an invalid colour and clamps radius', () => {
    const css = generateThemeCss({ ...DEFAULT_THEME, brandColor: 'not-a-color', radiusScale: 99 });
    expect(css).toContain(`--brand:${DEFAULT_THEME.brandColor};`);
    expect(css).toContain('--radius-2xl:calc(1rem * 1.8);'); // clamped to RADIUS_MAX
  });
});
