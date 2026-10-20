/**
 * The nudge — "there is work, look now" — sent AFTER the enqueueing
 * transaction commits.
 *
 * Losing it costs latency, not delivery: the row is already durable, and the
 * reconciler picks up anything claimable on its next tick. So every failure
 * here is a log line, never an exception into the caller's response path.
 */

import {
  pickSafeLogFields,
  sanitizeError,
  type WorkflowKind,
} from "@libs/workflows";

export interface WorkflowIntentDispatchHandle {
  intentId: string;
  kind: WorkflowKind;
  shouldNudge: boolean;
}

export interface DispatchAfterCommitLogger {
  warn(fields: Record<string, unknown>, message: string): void;
}

export interface DispatchAfterCommitDeps {
  logger: DispatchAfterCommitLogger;
  /**
   * Puts the intent's job on the queue. Absent in inline mode and in tests —
   * then the nudge reports `skipped` and the reconciler is the whole safety
   * net.
   */
  enqueueIntent?: (input: {
    intentId: string;
    kind: WorkflowKind;
  }) => Promise<void>;
}

export async function dispatchAfterCommit(
  handle: WorkflowIntentDispatchHandle,
  deps: DispatchAfterCommitDeps,
): Promise<{ status: "skipped" | "triggered" | "failed" }> {
  if (!handle.shouldNudge) return { status: "skipped" };

  // Without a queue producer there is nothing to nudge, so report `skipped`
  // rather than pretending — the reconciler is the whole safety net in that
  // configuration (and in local runs with no worker attached).
  if (!deps.enqueueIntent) {
    deps.logger.warn(
      pickSafeLogFields({
        intentId: handle.intentId,
        kind: handle.kind,
        errorCode: "queue_not_configured",
      }),
      "Queue not configured — workflow intent will be reconciled",
    );
    return { status: "skipped" };
  }

  try {
    await deps.enqueueIntent({ intentId: handle.intentId, kind: handle.kind });
    return { status: "triggered" };
  } catch (error) {
    const safe = sanitizeError(error, {
      code: "queue_nudge_failed",
      safeMessage: "workflow intent queue nudge failed",
    });

    deps.logger.warn(
      pickSafeLogFields({
        intentId: handle.intentId,
        kind: handle.kind,
        errorCode: safe.code,
      }),
      safe.safeMessage,
    );

    return { status: "failed" };
  }
}
