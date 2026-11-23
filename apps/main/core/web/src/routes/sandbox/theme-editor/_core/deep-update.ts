/**
 * Deep clone any serializable object.
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Immutable deep set — returns a new object with the value at `path` replaced.
 * Does NOT mutate the original. Each level along the path is shallow-cloned.
 *
 * Preserves arrays vs plain objects: when the current node at a path level is
 * an array, the clone is an array (`.slice()`) and `head` is treated as a
 * numeric index. Without this, writing to e.g. `theme.rules[0].tokens.…`
 * silently converts `theme.rules` from `[…]` to `{ "0": … }`.
 */
export function deepSetImmutable<T>(obj: T, path: string[], value: unknown): T {
  if (path.length === 0) return value as T;

  const [head, ...rest] = path;

  if (Array.isArray(obj)) {
    const idx = Number(head);
    const child = idx < obj.length ? obj[idx] : undefined;
    const updated = deepSetImmutable(child ?? {}, rest, value);
    const copy = obj.slice();
    copy[idx] = updated;
    return copy as unknown as T;
  }

  const current = obj as Record<string, unknown>;
  const child = current[head!] ?? {};
  const updated = deepSetImmutable(child, rest, value);
  return { ...current, [head!]: updated } as T;
}
