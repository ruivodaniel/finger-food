// =============================================================================
// Reconciler tests — the tick's budget, its ordering, and the rows it hands to
// `enqueueIntent`. Each row travels with its CURRENT attempt count — the
// wiring keys the job id on it, or a reclaimed row can never be re-dispatched.
// =============================================================================

import { describe, expect, it, vi } from "vitest";
import {
  reconcileIntents,
  RECONCILE_WORKFLOW_INTENTS_BATCH_CAP,
  type ClaimableIntentRow,
} from "@/workflow-intents/reconcile-intents";

const noStale = async () => ({ reclaimed: 0, failed: 0 });
const db = {} as never;

function captureEnqueues(): {
  enqueued: ClaimableIntentRow[];
  enqueueIntent: (row: ClaimableIntentRow) => Promise<void>;
} {
  const enqueued: ClaimableIntentRow[] = [];
  return {
    enqueued,
    enqueueIntent: async (row) => {
      enqueued.push(row);
    },
  };
}

describe("reconcileIntents", () => {
  it("dispatches claimable rows with the attempt count it read", async () => {
    const { enqueued, enqueueIntent } = captureEnqueues();

    const result = await reconcileIntents({
      db,
      enqueueIntent,
      reclaimStale: noStale,
      findClaimablePending: async () => [
        { id: "intent_1", attemptCount: 0 },
        { id: "intent_2", attemptCount: 3 },
      ],
    });

    expect(result).toEqual({ reclaimed: 0, failed: 0, dispatched: 2 });
    expect(enqueued).toEqual([
      { id: "intent_1", attemptCount: 0 },
      { id: "intent_2", attemptCount: 3 },
    ]);
  });

  it("reclaims before dispatching, so a freed row goes out in the same tick", async () => {
    const calls: string[] = [];

    await reconcileIntents({
      db,
      enqueueIntent: async () => undefined,
      reclaimStale: async () => {
        calls.push("reclaim");
        return { reclaimed: 1, failed: 0 };
      },
      findClaimablePending: async () => {
        calls.push("find");
        return [{ id: "intent_1", attemptCount: 2 }];
      },
    });

    expect(calls).toEqual(["reclaim", "find"]);
  });

  it("spends one budget across reclaim and dispatch", async () => {
    const limits: number[] = [];

    await reconcileIntents({
      db,
      enqueueIntent: async () => undefined,
      batchCap: 10,
      reclaimStale: async () => ({ reclaimed: 4, failed: 2 }),
      findClaimablePending: async (limit) => {
        limits.push(limit);
        return [];
      },
    });

    expect(limits).toEqual([4]);
  });

  it("skips the dispatch query entirely when reclaim spent the tick", async () => {
    const findClaimablePending = vi.fn(async () => []);

    const result = await reconcileIntents({
      db,
      enqueueIntent: async () => undefined,
      batchCap: 10,
      reclaimStale: async () => ({ reclaimed: 10, failed: 0 }),
      findClaimablePending,
    });

    expect(findClaimablePending).not.toHaveBeenCalled();
    expect(result.dispatched).toBe(0);
  });

  it("passes the default batch cap through when the caller sets none", async () => {
    const limits: number[] = [];

    await reconcileIntents({
      db,
      enqueueIntent: async () => undefined,
      reclaimStale: async (limit) => {
        limits.push(limit);
        return { reclaimed: 0, failed: 0 };
      },
      findClaimablePending: async () => [],
    });

    expect(limits).toEqual([RECONCILE_WORKFLOW_INTENTS_BATCH_CAP]);
  });
});
