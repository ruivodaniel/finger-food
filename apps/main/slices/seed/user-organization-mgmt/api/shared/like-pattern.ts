/**
 * A name search's ILIKE pattern — "contains `search`", where the user's own
 * `%`, `_` and `\` match themselves rather than acting as wildcards (a lone
 * `%` would otherwise match every row the scope admits).
 */

export function containing(search: string): string {
  return `%${search.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
}
