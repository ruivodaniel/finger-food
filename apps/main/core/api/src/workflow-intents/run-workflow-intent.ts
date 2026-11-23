/**
 * One pass at one intent: claim it, run its processor, close the row.
 *
 * Every step is guarded, so running this twice for the same intent is safe —
 * which happens routinely, because an api nudge and a reconciler tick can both
 * point at the same row.
 *
 * How a failure ends depends on whether trying again could ever help:
 *
 * - **Unknown kind, invalid payload** — terminal `failed`. No amount of retrying
 *   turns an unparseable row into work, so it must not burn retry budget.
 * - **Processor threw, budget left** — back to `pending` with backoff. The
 *   attempt is recorded on the row along with the sanitized reason.
 * - **Processor threw, budget spent** — terminal `failed`.
 *
 * The database row is the authority on attempts: `attempt_count` is incremented
 * by the claim, and `available_at` is what defers the next try. The queue's
 * own retry stays off for this work (`attempts: 1` on every job) so there is
 * exactly one such authority.
 */

import {
  assertWorkflowKind,
  parseWorkflowIntentPayload,
  pickSafeLogFields,
  sanitizeError,
  shouldFailInsteadOfReclaim,
} from "@libs/workflows";
import { logger } from "@/shared/logger";
import { claimIntent, completeIntent, failIntent, retryIntent } from "./intent-lifecycle.repository";
import { getWorkflowProcessor, hasWorkflowProcessor } from "./processor-registry";
import { runSafely } from "./run-safely";
import type { WorkflowIntentExecutor } from "./workflow-intents.repository";

export interface RunWorkflowIntentDeps {
  db: WorkflowIntentExecutor;
  workerId: string;
  /** Retry ceiling; defaults to the shared budget in @libs/workflows. */
  maxAttempts?: number;
  /** Injectable 0..1 source for deterministic backoff jitter in tests. */
  random?: () => number;
}

export type RunWorkflowIntentOutcome =
  | { type: "lost_claim"; intentId: string }
  | { type: "failed_unknown_kind"; intentId: string }
  | { type: "failed_invalid_payload"; intentId: string }
  | { type: "failed_processor"; intentId: string }
  | { type: "retry_scheduled"; intentId: string; availableAt: Date }
  | { type: "completed_skipped_guard"; intentId: string }
  | { type: "completed_obsolete"; intentId: string; completionCode: string }
  | { type: "completed"; intentId: string; completionCode?: string };

export async function runWorkflowIntent(
  deps: RunWorkflowIntentDeps,
  payload: { intentId: string },
): Promise<RunWorkflowIntentOutcome> {
  const { db } = deps;

  const claimed = await claimIntent(db, {
    intentId: payload.intentId,
    workerId: deps.workerId,
  });

  if (!claimed) {
    // Someone else got there first, or the row isn't claimable yet. Both are
    // ordinary — the winner is doing the work.
    logger.info(
      { intentId: payload.intentId, workerId: deps.workerId },
      "workflow_intent claim lost — no-op",
    );
    return { type: "lost_claim", intentId: payload.intentId };
  }

  if (!hasWorkflowProcessor(claimed.kind)) {
    await failIntent(db, {
      intentId: claimed.id,
      code: "unknown_kind",
      safeMessage: "No processor registered for this workflow kind",
    });
    logger.warn(
      { intentId: claimed.id, kind: claimed.kind, errorCode: "unknown_kind" },
      "workflow_intent failed: unknown kind",
    );
    return { type: "failed_unknown_kind", intentId: claimed.id };
  }

  const kind = assertWorkflowKind(claimed.kind);

  let validatedPayload: ReturnType<
    typeof parseWorkflowIntentPayload<typeof kind>
  >;
  try {
    validatedPayload = parseWorkflowIntentPayload(kind, claimed.payload);
  } catch {
    await failIntent(db, {
      intentId: claimed.id,
      code: "payload_schema_validation",
      safeMessage: "Workflow intent payload failed schema validation",
    });
    logger.warn(
      { intentId: claimed.id, kind, errorCode: "payload_schema_validation" },
      "workflow_intent failed: payload schema validation",
    );
    return { type: "failed_invalid_payload", intentId: claimed.id };
  }

  const processor = getWorkflowProcessor(kind);

  let result: Awaited<ReturnType<typeof processor>>;
  try {
    result = await runSafely(
      () =>
        processor(validatedPayload as never, {
          intentId: claimed.id,
          attemptCount: claimed.attemptCount,
        }),
      {
        code: "processor_failure",
        safeMessage: "Workflow processor execution failed",
      },
    );
  } catch (error) {
    const safe = sanitizeError(error, {
      code: "processor_failure",
      safeMessage: "Workflow processor execution failed",
    });

    // `claimIntent` already counted this attempt, so the count passed here — to
    // the budget check and to the backoff — is the attempt that just failed.
    if (
      shouldFailInsteadOfReclaim(claimed.attemptCount, deps.maxAttempts)
    ) {
      await failIntent(db, {
        intentId: claimed.id,
        code: safe.code,
        safeMessage: safe.safeMessage,
      });
      logger.warn(
        pickSafeLogFields({
          intentId: claimed.id,
          kind,
          attemptCount: claimed.attemptCount,
          errorCode: safe.code,
        }),
        "workflow_intent failed: retry budget spent",
      );
      return { type: "failed_processor", intentId: claimed.id };
    }

    const retry = await retryIntent(db, {
      intentId: claimed.id,
      attemptCount: claimed.attemptCount,
      code: safe.code,
      safeMessage: safe.safeMessage,
      random: deps.random,
    });
    logger.warn(
      pickSafeLogFields({
        intentId: claimed.id,
        kind,
        attemptCount: claimed.attemptCount,
        errorCode: safe.code,
        availableAt: retry.availableAt,
      }),
      "workflow_intent deferred after processor failure",
    );
    return {
      type: "retry_scheduled",
      intentId: claimed.id,
      availableAt: retry.availableAt,
    };
  }

  const completion = await completeIntent(db, { intentId: claimed.id });

  if (!completion.updated) {
    // A reconciler reclaim moved the row off `processing` before we could close
    // it. Not a correctness break — the reclaimed row waits for its
    // `availableAt` — but worth surfacing.
    logger.warn(
      {
        intentId: claimed.id,
        kind,
        attemptCount: claimed.attemptCount,
        errorCode: "complete_guard_missed",
      },
      "workflow_intent completion skipped: row no longer processing",
    );
    return { type: "completed_skipped_guard", intentId: claimed.id };
  }

  if (result.type === "obsolete") {
    logger.info(
      {
        intentId: claimed.id,
        kind,
        attemptCount: claimed.attemptCount,
        completionCode: result.completionCode,
      },
      "workflow_intent completed obsolete",
    );
    return {
      type: "completed_obsolete",
      intentId: claimed.id,
      completionCode: result.completionCode,
    };
  }

  logger.info(
    {
      intentId: claimed.id,
      kind,
      attemptCount: claimed.attemptCount,
      ...(result.completionCode
        ? { completionCode: result.completionCode }
        : {}),
    },
    "workflow_intent completed",
  );

  return {
    type: "completed",
    intentId: claimed.id,
    ...(result.completionCode ? { completionCode: result.completionCode } : {}),
  };
}
