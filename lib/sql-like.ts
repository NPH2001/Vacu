/**
 * Escapes the LIKE/ILIKE metacharacters `\` `%` `_` so a user's search term is
 * matched literally — otherwise `%` matches everything and `_` matches any char.
 */
export function escapeLike(v: string): string {
  return v.replace(/[\\%_]/g, (c) => `\\${c}`);
}
