/**
 * One reconciler pass.
 *
 * Two jobs: return rows whose claim went stale to `pending` (a worker died
 * mid-run), and dispatch anything claimable that nobody nudged (a nudge lost to
 * a crash, a restart, a deploy — or a row deferred after a failed attempt, now
 * due again). Between them, no committed intent stays stuck, which is why the
 * nudge on the write path is allowed to be fire-and-forget.
 *
 * Stale rows are reclaimed FIRST so they can be dispatched in the same pass, and
 * one bounded budget is spent across both jobs so a backlog can't turn a single
 * tick into an unbounded flood of dispatches.
 */

import { logger } from "@/shared/logger";
import {
  findClaimablePendingIntents,
  reclaimStaleIntents,
  type ClaimableIntentRow,
  type ReclaimStaleIntentsResult,
} from "./intent-lifecycle.repository";
import { calculatePendingDispatchLimit } from "./reconcile-budget";
import type { WorkflowIntentExecutor } from "./workflow-intents.repository";

export type { ClaimableIntentRow } from "./intent-lifecycle.repository";

export const RECONCILE_WORKFLOW_INTENTS_BATCH_CAP = 200;

export interface ReconcileIntentsDeps {
  db: WorkflowIntentExecutor;
  /** Runs (or queues) one claimable row; the wiring owns how. */
  enqueueIntent: (row: ClaimableIntentRow) => Promise<void>;
  now?: Date;
  batchCap?: number;
  /** Seams for tests; production uses the queue itself. */
  reclaimStale?: (
    limit: number,
    now: Date,
  ) => Promise<ReclaimStaleIntentsResult>;
  findClaimablePending?: (
    limit: number,
    now: Date,
  ) => Promise<ClaimableIntentRow[]>;
}

export interface ReconcileIntentsResult {
  reclaimed: number;
  failed: number;
  dispatched: number;
}

export async function reconcileIntents(
  deps: ReconcileIntentsDeps,
): Promise<ReconcileIntentsResult> {
  const now = deps.now ?? new Date();
  const batchCap = deps.batchCap ?? RECONCILE_WORKFLOW_INTENTS_BATCH_CAP;

  const reclaimStale =
    deps.reclaimStale ??
    ((limit, at) => reclaimStaleIntents(deps.db, { now: at, limit }));
  const findClaimablePending =
    deps.findClaimablePending ??
    ((limit, at) => findClaimablePendingIntents(deps.db, { now: at, limit }));

  const reclaimed = await reclaimStale(batchCap, now);

  const pendingDispatchLimit = calculatePendingDispatchLimit({
    batchCap,
    reclaimedCount: reclaimed.reclaimed,
    failedCount: reclaimed.failed,
  });

  const claimable =
    pendingDispatchLimit > 0
      ? await findClaimablePending(pendingDispatchLimit, now)
      : [];

  for (const row of claimable) {
    await deps.enqueueIntent(row);
  }

  logger.info(
    {
      reclaimedCount: reclaimed.reclaimed,
      failedCount: reclaimed.failed,
      dispatchedCount: claimable.length,
    },
    "workflow_intent reconciler tick",
  );

  return {
    reclaimed: reclaimed.reclaimed,
    failed: reclaimed.failed,
    dispatched: claimable.length,
  };
}
