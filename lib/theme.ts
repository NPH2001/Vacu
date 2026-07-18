/**
 * Theme tokens and the CSS they generate. This file is deliberately free of any
 * server-only / database import so the admin form can import `generateThemeCss`
 * for a live preview exactly as the server renders it.
 *
 * How the recolouring works: Tailwind v4 compiles `bg-green-800` to
 * `var(--color-green-800)`, so overriding the green/amber ramps at `:root`
 * repaints the whole site with no component changes. Each shade keeps Tailwind's
 * default lightness + chroma and borrows only the *hue* of the admin's colour,
 * using CSS relative-colour syntax — `oklch(from var(--brand) L C h)` — so no
 * colour-space maths is needed here.
 */

export type ThemeConfig = {
  brandColor: string;
  accentColor: string;
  radiusScale: number;
  fontBody: string;
  fontHeading: string;
};

export const DEFAULT_THEME: ThemeConfig = {
  brandColor: '#16a34a',
  accentColor: '#f59e0b',
  radiusScale: 1,
  fontBody: 'inter',
  fontHeading: 'fraunces',
};

/** Font families the root layout loads; the theme picks by key. */
export const FONT_VARS: Record<string, string> = {
  inter: '--font-inter',
  'be-vietnam': '--font-be-vietnam',
  fraunces: '--font-fraunces',
  playfair: '--font-playfair',
};

export const BODY_FONTS: { key: string; label: string }[] = [
  { key: 'inter', label: 'Inter — gọn, hiện đại' },
  { key: 'be-vietnam', label: 'Be Vietnam Pro — thuần Việt' },
];

export const HEADING_FONTS: { key: string; label: string }[] = [
  { key: 'fraunces', label: 'Fraunces — serif mềm mại' },
  { key: 'playfair', label: 'Playfair Display — serif cổ điển' },
  { key: 'be-vietnam', label: 'Be Vietnam Pro — sans gọn' },
];

// [shade, lightness, chroma] from Tailwind v4's default green/amber ramps.
const GREEN_RAMP: [number, number, number][] = [
  [50, 0.982, 0.018], [100, 0.962, 0.044], [200, 0.925, 0.084], [300, 0.871, 0.150],
  [400, 0.792, 0.209], [500, 0.723, 0.219], [600, 0.627, 0.194], [700, 0.527, 0.154],
  [800, 0.448, 0.119], [900, 0.393, 0.095], [950, 0.266, 0.065],
];
const AMBER_RAMP: [number, number, number][] = [
  [50, 0.987, 0.022], [100, 0.962, 0.059], [200, 0.924, 0.120], [300, 0.879, 0.169],
  [400, 0.828, 0.189], [500, 0.769, 0.188], [600, 0.666, 0.179], [700, 0.555, 0.163],
  [800, 0.473, 0.137], [900, 0.414, 0.112], [950, 0.279, 0.077],
];
// Tailwind v4 default radius scale, in rem.
const RADIUS_BASE: [string, number][] = [
  ['xs', 0.125], ['sm', 0.25], ['md', 0.375], ['lg', 0.5],
  ['xl', 0.75], ['2xl', 1], ['3xl', 1.5], ['4xl', 2],
];

export const RADIUS_MIN = 0;
export const RADIUS_MAX = 1.8;

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

/** A conservative hex guard — anything odd falls back to the default. */
function safeColor(input: string, fallback: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(input.trim()) ? input.trim() : fallback;
}

/**
 * The CSS variable overrides for a theme. `selector` is `:root` for the live
 * site and a scoped class for the admin preview.
 */
export function generateThemeCss(t: ThemeConfig, selector = ':root'): string {
  const brand = safeColor(t.brandColor, DEFAULT_THEME.brandColor);
  const accent = safeColor(t.accentColor, DEFAULT_THEME.accentColor);
  const scale = clamp(Number.isFinite(t.radiusScale) ? t.radiusScale : 1, RADIUS_MIN, RADIUS_MAX);
  const bodyVar = FONT_VARS[t.fontBody] ?? FONT_VARS.inter;
  const headVar = FONT_VARS[t.fontHeading] ?? FONT_VARS.fraunces;

  const out: string[] = [`--brand:${brand};`, `--accent:${accent};`];
  for (const [s, L, C] of GREEN_RAMP) out.push(`--color-green-${s}:oklch(from var(--brand) ${L} ${C} h);`);
  for (const [s, L, C] of AMBER_RAMP) out.push(`--color-amber-${s}:oklch(from var(--accent) ${L} ${C} h);`);
  for (const [k, base] of RADIUS_BASE) out.push(`--radius-${k}:calc(${base}rem * ${scale});`);
  out.push(`--font-sans:var(${bodyVar});`);
  out.push(`--font-display:var(${headVar});`);
  // Admin chrome follows the brand so the console matches the site.
  out.push('--admin-accent:var(--color-green-700);');
  out.push('--admin-accent-soft:var(--color-green-100);');
  out.push('--admin-nav-accent:var(--color-green-300);');

  return `${selector}{${out.join('')}}`;
}
