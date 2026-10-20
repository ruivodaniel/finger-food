export const DEFAULT_MAX_ATTEMPTS = 10;
export const DEFAULT_BACKOFF_BASE_MS = 30_000;
export const DEFAULT_BACKOFF_CAP_MS = 60 * 60 * 1000;

/**
 * ±10% jitter range, per spec § "Retry budget".
 * multiplier ∈ [1 - JITTER_RATIO, 1 + JITTER_RATIO].
 */
export const BACKOFF_JITTER_RATIO = 0.1;

export interface BackoffConfig {
  baseMs?: number;
  capMs?: number;
  /** Injectable 0..1 source for deterministic tests. Defaults to Math.random. */
  random?: () => number;
}

export function calculateBackoffMs(
  attemptCount: number,
  config: BackoffConfig = {}
): number {
  const baseMs = config.baseMs ?? DEFAULT_BACKOFF_BASE_MS;
  const capMs = config.capMs ?? DEFAULT_BACKOFF_CAP_MS;
  const random = config.random ?? Math.random;

  const safeAttempt = attemptCount >= 1 ? attemptCount : 1;
  const exponent = safeAttempt - 1;
  const exponential = baseMs * 2 ** exponent;

  // multiplier ∈ [1 - JITTER_RATIO, 1 + JITTER_RATIO]
  const multiplier = 1 - BACKOFF_JITTER_RATIO + random() * (2 * BACKOFF_JITTER_RATIO);
  const jittered = exponential * multiplier;

  return Math.round(Math.min(capMs, jittered));
}

export function nextAvailableAt(
  now: Date,
  attemptCount: number,
  config: BackoffConfig = {}
): Date {
  return new Date(now.getTime() + calculateBackoffMs(attemptCount, config));
}

export function shouldFailInsteadOfReclaim(
  attemptCount: number,
  maxAttempts: number = DEFAULT_MAX_ATTEMPTS
): boolean {
  return attemptCount >= maxAttempts;
}
