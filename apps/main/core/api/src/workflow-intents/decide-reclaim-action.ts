/**
 * What to do with an intent whose claim went stale: try it again later, or give
 * up. Pure decision, no io — the reclaimer applies it.
 */

import {
  DEFAULT_MAX_ATTEMPTS,
  nextAvailableAt,
  shouldFailInsteadOfReclaim,
} from "@libs/workflows";

export interface StaleIntentRow {
  id: string;
  attemptCount: number;
}

export interface ReclaimActionConfig {
  now: Date;
  maxAttempts?: number;
  /** Injectable 0..1 source for deterministic jitter in tests. */
  random?: () => number;
}

export type ReclaimAction =
  | {
      type: "reclaim";
      availableAt: Date;
      errorCode: "dispatch_visibility_timeout";
    }
  | {
      type: "fail";
      code: "max_retries_exceeded";
      safeMessage: string;
    };

export function decideReclaimAction(
  row: StaleIntentRow,
  config: ReclaimActionConfig,
): ReclaimAction {
  const maxAttempts = config.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;

  if (shouldFailInsteadOfReclaim(row.attemptCount, maxAttempts)) {
    return {
      type: "fail",
      code: "max_retries_exceeded",
      safeMessage: "Workflow intent exceeded the retry budget",
    };
  }

  // Backoff is 30s * 2^(attemptCount - 1), jittered. `claimIntent` already
  // incremented `attemptCount` for the attempt that timed out, so pass it
  // straight through — a +1 here would shift the whole schedule one step out.
  return {
    type: "reclaim",
    availableAt: nextAvailableAt(config.now, row.attemptCount, {
      random: config.random,
    }),
    errorCode: "dispatch_visibility_timeout",
  };
}
