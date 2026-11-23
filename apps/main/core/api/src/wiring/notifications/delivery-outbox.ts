/**
 * The notifications module's durability port, implemented over the app's
 * workflow-intent outbox.
 *
 * The module owns the transaction here — it is already inside the one that wrote
 * the delivery rows — so this is the two halves of `withWorkflowIntent` used
 * separately: `enqueueWorkflowIntent` on the caller's tx, `dispatchAfterCommit`
 * once it has committed. A rolled-back queue call therefore enqueues nothing,
 * and a lost nudge costs latency rather than the message, because the
 * reconciler picks up anything claimable.
 */

import { workflowKinds } from "@libs/workflows";
import type {
  DeliveryHandle,
  DeliveryOutbox,
} from "@modules/notifications/shared";
import { logger } from "@/shared/logger";
import { enqueueWorkflowIntentJob } from "@/wiring/intent-runner";
import { dispatchAfterCommit } from "@/workflow-intents/dispatch-after-commit";
import { enqueueWorkflowIntent } from "@/workflow-intents/workflow-intents.service";
import type { WorkflowIntentExecutor } from "@/workflow-intents/workflow-intents.repository";

/** pino is (meta, message); the dispatcher's logger is the other way round. */
const dispatchLogger = {
  warn: (fields: Record<string, unknown>, message: string) =>
    logger.warn(fields, message),
};

export const notificationDeliveryOutbox: DeliveryOutbox = {
  async enqueue(tx, items): Promise<DeliveryHandle[]> {
    const handles: DeliveryHandle[] = [];
    for (const item of items) {
      // The delivery row id keys the intent: the module already made that row
      // idempotent, so a second enqueue for it is a no-op rather than a
      // second send.
      const handle = await enqueueWorkflowIntent(tx as WorkflowIntentExecutor, {
        kind: workflowKinds.notificationDispatch,
        payload: { deliveryId: item.deliveryId },
        dedupeKey: `notification-delivery:${item.deliveryId}`,
      });
      handles.push({ deliveryId: item.deliveryId, ref: handle.intentId });
    }
    return handles;
  },

  async nudge(handles): Promise<void> {
    for (const handle of handles) {
      if (!handle.ref) continue;
      await dispatchAfterCommit(
        {
          intentId: handle.ref,
          kind: workflowKinds.notificationDispatch,
          shouldNudge: true,
        },
        { logger: dispatchLogger, enqueueIntent: enqueueWorkflowIntentJob },
      );
    }
  },
};
