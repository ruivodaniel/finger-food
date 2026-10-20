/**
 * Runs workflow intents in this process — the transport half of the nudge,
 * without a queue. Outbox mode: the row is durable (written in the mutation's
 * transaction), the nudge runs it right after commit under a small
 * concurrency cap, and the reconciler (a scheduled m2m call) picks up whatever
 * a crash or a backoff left behind. Inline mode exports no runner and the
 * notifications module delivers in-process itself.
 */

import type { WorkflowKind } from "@libs/workflows";
import { db } from "@/db";
import { Env } from "@/env";
import { logger } from "@/shared/logger";
import { reconcileIntents, type ReconcileIntentsResult } from "@/workflow-intents/reconcile-intents";
import { runWorkflowIntent } from "@/workflow-intents/run-workflow-intent";
import { getWorkerId } from "@/workflow-intents/worker-identity";
// Side-effect import: every processor registers before the first dispatch.
import "@/wiring/notifications/dispatch-processor";

let inFlight = 0;
const waiting: Array<() => void> = [];

function acquire(): Promise<void> {
  if (inFlight < Env.WORKFLOW_INTENT_CONCURRENCY) {
    inFlight += 1;
    return Promise.resolve();
  }
  return new Promise((resolve) => waiting.push(resolve));
}
function release(): void {
  const next = waiting.shift();
  if (next) next();
  else inFlight -= 1;
}

async function runOne(intentId: string): Promise<void> {
  await acquire();
  try {
    await runWorkflowIntent({ db, workerId: getWorkerId() }, { intentId });
  } catch (error) {
    logger.warn({ intentId, errorCode: error instanceof Error ? error.name : "unknown" }, "workflow intent run crashed");
  } finally {
    release();
  }
}

/** The nudge: fire and forget, after the commit. Absent in inline mode. */
export const enqueueWorkflowIntentJob =
  Env.QUEUE_MODE === "outbox"
    ? async (input: { intentId: string; kind: WorkflowKind }): Promise<void> => {
        setImmediate(() => void runOne(input.intentId));
      }
    : undefined;

/** One reconciler pass; what the m2m route runs on the orchestrator's schedule. */
export async function reconcileWorkflowIntents(): Promise<ReconcileIntentsResult> {
  return reconcileIntents({ db, enqueueIntent: async (row) => void runOne(row.id) });
}
