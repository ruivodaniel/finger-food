/**
 * One bounded budget per reconciler tick, spent across reclaiming stale rows,
 * failing exhausted ones, and dispatching claimable ones — so a backlog can't
 * turn a single tick into an unbounded flood of dispatches.
 */

export interface PendingDispatchLimitInput {
  batchCap: number;
  reclaimedCount: number;
  failedCount: number;
}

export function calculatePendingDispatchLimit(
  input: PendingDispatchLimitInput,
): number {
  const spent = input.reclaimedCount + input.failedCount;

  return Math.max(0, input.batchCap - spent);
}
