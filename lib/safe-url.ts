import { z } from 'zod';

// Schemes that can execute script when placed in an href.
const DANGEROUS_SCHEME = /^\s*(javascript|data|vbscript):/i;

/** True if a URL string is safe to use as an href (no script-executing scheme). */
export function isSafeHref(v: string): boolean {
  return !DANGEROUS_SCHEME.test(v);
}

/**
 * A max-500 URL field that blanks any `javascript:`/`data:`/`vbscript:` value.
 * Used for every admin-authored href so an editor can't plant a clickable XSS
 * that runs for every visitor. Applied via .transform so it also cleans values
 * re-validated on read.
 */
export const safeHrefField = () =>
  z.string().max(500).default('').transform((v) => (isSafeHref(v) ? v : ''));
