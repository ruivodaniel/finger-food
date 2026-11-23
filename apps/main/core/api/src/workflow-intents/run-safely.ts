/**
 * Run a processor and guarantee whatever comes out of it is safe to write to a
 * column and a dashboard: an already-sanitized `{ code, safeMessage }` passes
 * through, anything else (an Error, a string, an object with a message) is
 * replaced by the fallback pair.
 */

import { safeErrorSchema, sanitizeError, type SafeError } from "@libs/workflows";

export async function runSafely<T>(
  fn: () => Promise<T>,
  fallback?: Partial<SafeError>,
): Promise<T> {
  try {
    return await fn();
  } catch (raw) {
    const parsed = safeErrorSchema.safeParse(raw);

    if (parsed.success) throw parsed.data;

    throw sanitizeError(raw, fallback);
  }
}
