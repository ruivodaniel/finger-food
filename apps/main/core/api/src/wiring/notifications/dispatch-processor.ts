/**
 * `notification.dispatch` — deliver one `notification_delivery` row.
 *
 * The processor is thin on purpose: the intent payload is an id, and every
 * decision (is this row still deliverable, does the recipient still want it,
 * what does the copy say) belongs to the notifications module's delivery
 * service. This file only translates the module's outcome into the intent
 * lifecycle.
 */

import {
  workflowKinds,
  type SafeError,
  type WorkflowIntentPayload,
} from "@libs/workflows";
import type {
  DeliverPendingOptions,
  DeliverPendingResult,
} from "@modules/notifications/api";
import {
  registerWorkflowProcessor,
  type WorkflowProcessor,
} from "@/workflow-intents/processor-registry";

export interface NotificationDispatchProcessorDeps {
  deliverPending: (
    deliveryId: string,
    options?: DeliverPendingOptions,
  ) => Promise<DeliverPendingResult>;
}

export function createNotificationDispatchProcessor(
  deps: NotificationDispatchProcessorDeps,
): WorkflowProcessor<typeof workflowKinds.notificationDispatch> {
  return async (
    payload: WorkflowIntentPayload<typeof workflowKinds.notificationDispatch>,
    context,
  ) => {
    const result = await deps.deliverPending(payload.deliveryId, {
      // A first attempt never resurrects a row the module marked failed; a
      // reclaimed attempt may try the transport again.
      retryFailed: context.attemptCount > 1,
    });

    switch (result.outcome) {
      case "sent":
        return { type: "completed" };
      case "suppressed":
        // The recipient opted out between queue and send. Correct outcome, not
        // a failure — the module recorded it on the row.
        return { type: "completed", completionCode: "suppressed_by_pref" };
      case "skipped":
        // Already resolved: delivered by an earlier attempt, or terminal.
        return { type: "obsolete", completionCode: "already_resolved" };
      case "not_found":
        return { type: "obsolete", completionCode: "delivery_missing" };
      case "failed": {
        // Already a safe pair — `runSafely` passes it through, so the
        // transport's own error code lands on the intent row.
        const safe: SafeError = {
          code: result.errorCode ?? "delivery_failed",
          safeMessage: "notification delivery failed",
        };
        throw safe;
      }
    }
  };
}

export const notificationDispatchProcessor =
  createNotificationDispatchProcessor({
    // Lazy on purpose: mounts.ts imports the outbox that imports this runner,
    // so the mount is looked up at dispatch time, never at import time.
    deliverPending: async (deliveryId, options) =>
      (await import("@/mounts")).notifications.services.delivery.deliverPending(deliveryId, options),
  });

registerWorkflowProcessor(
  workflowKinds.notificationDispatch,
  notificationDispatchProcessor,
);
