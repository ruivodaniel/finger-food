/**
 * Delivery service — the single code path that turns a `pending` email/SMS row
 * into a send. The Trigger.dev processor calls it; so does the inline outbox
 * below, which is what module tests and worker-less products run on.
 *
 * Three guarantees make it safe to call from anywhere, any number of times:
 *
 * 1. **Current-check at delivery, snapshot for audit.** A `userPref` type
 *    re-reads the recipient's preference first. Someone who opted out between
 *    queue and send gets `suppressed_by_pref` and no message, while the row's
 *    `preferenceSnapshot` still shows the queue-time rule — the audit shows the
 *    change rather than hiding it.
 * 2. **Guarded transitions.** Every write names the statuses it may move from,
 *    so a second claim of the same delivery moves nothing.
 * 3. **Failure is recorded, not thrown.** The transport returns an error code;
 *    the row lands on `failed` with `attemptCount` incremented.
 *
 * `retryFailed` is what lets an outbox with a retry budget mean something: a
 * FRESH attempt only ever picks up a `pending` row, so a hard failure stays
 * terminal and nothing re-sends by accident; a RETRIED attempt may pick a
 * `failed` row back up and try the transport again. `attemptCount` counts every
 * try either way.
 */

import type {
  DeliveryHandle,
  DeliveryOutbox,
  NotificationTransports,
} from "../../shared/types";
import {
  renderEmailTemplate,
  renderSmsTemplate,
  type EmailTemplateRef,
  type SmsTemplateRef,
} from "../../shared/templates";
import type { DeliveryStatus } from "../models/notification.model";
import type { DeliveryRepository } from "../repositories/delivery.repository";
import type { ModuleLogger } from "../shared/module-errors";
import type { TemplateCatalog } from "../shared/template-catalog";
import type { PreferenceService } from "./preference.service";

export type DeliverOutcome =
  | "sent"
  | "failed"
  | "suppressed"
  | "skipped"
  | "not_found";

export interface DeliverPendingResult {
  outcome: DeliverOutcome;
  errorCode?: string;
}

export interface DeliverPendingOptions {
  /**
   * Let a row that already `failed` be attempted again. Pass this only from a
   * retried unit of work — a first attempt must never resurrect a terminal row.
   */
  retryFailed?: boolean;
}

/** A fresh attempt: only `pending` rows are still waiting to be delivered. */
const DELIVERABLE = ["pending"] as const;
/** A retried attempt: the last try's failure is allowed to be re-attempted. */
const DELIVERABLE_ON_RETRY = ["pending", "failed"] as const;

export interface DeliveryServiceDeps {
  deliveryRepo: Pick<DeliveryRepository, "getWithFact" | "updateStatus">;
  preferences: Pick<PreferenceService, "ruleFor">;
  catalog: TemplateCatalog;
  transports: NotificationTransports;
  logger: ModuleLogger;
}

export class DeliveryService {
  constructor(private readonly deps: DeliveryServiceDeps) {}

  async deliverPending(
    deliveryId: string,
    options: DeliverPendingOptions = {},
  ): Promise<DeliverPendingResult> {
    const deliverable = options.retryFailed
      ? DELIVERABLE_ON_RETRY
      : DELIVERABLE;

    const found = await this.deps.deliveryRepo.getWithFact(deliveryId);
    if (!found) {
      this.deps.logger.warn("notification delivery not found", { deliveryId });
      return { outcome: "not_found" };
    }
    const { delivery, notification } = found;

    // In-app rows never ride the outbox — the committed row IS the delivery.
    if (delivery.channel === "in_app") return { outcome: "skipped" };
    if (!(deliverable as readonly string[]).includes(delivery.status)) {
      return { outcome: "skipped" };
    }

    const rule = await this.deps.preferences.ruleFor({
      userId: delivery.recipientUserId,
      messageType: notification.messageType,
      channel: delivery.channel,
    });
    if (!rule.enabled) {
      await this.deps.deliveryRepo.updateStatus(deliveryId, {
        status: "suppressed_by_pref",
        onlyFromStatuses: deliverable,
      });
      return { outcome: "suppressed" };
    }

    if (!delivery.address) {
      return this.fail(deliveryId, "missing_address", deliverable);
    }

    const template = this.deps.catalog.find(delivery.channel, delivery.template);
    if (!template) {
      this.deps.logger.error("notification template left the catalog", {
        deliveryId,
        template: delivery.template,
        channel: delivery.channel,
      });
      return this.fail(deliveryId, "unknown_template", deliverable);
    }

    const result =
      delivery.channel === "email"
        ? await this.deps.transports.email.send({
            to: delivery.address,
            ...renderEmailTemplate(
              template as EmailTemplateRef,
              notification.args,
            ),
          })
        : await this.deps.transports.sms.send({
            to: delivery.address,
            label: delivery.template,
            ...renderSmsTemplate(template as SmsTemplateRef, notification.args),
          });

    if (!result.ok) {
      return this.fail(deliveryId, result.errorCode, deliverable);
    }

    await this.deps.deliveryRepo.updateStatus(deliveryId, {
      status: "sent",
      sentAt: new Date(),
      incrementAttempt: true,
      onlyFromStatuses: deliverable,
    });
    return { outcome: "sent" };
  }

  private async fail(
    deliveryId: string,
    errorCode: string,
    deliverable: readonly DeliveryStatus[],
  ): Promise<DeliverPendingResult> {
    await this.deps.deliveryRepo.updateStatus(deliveryId, {
      status: "failed",
      lastErrorCode: errorCode,
      incrementAttempt: true,
      onlyFromStatuses: deliverable,
    });
    return { outcome: "failed", errorCode };
  }
}

/**
 * The outbox a product runs without a worker: enqueue collects, nudge delivers
 * in-process right after the queue's transaction commits. Same code path as
 * the durable one — only the gap between commit and send differs.
 */
export function createInlineDeliveryOutbox(deps: {
  delivery: Pick<DeliveryService, "deliverPending">;
}): DeliveryOutbox {
  return {
    async enqueue(_tx, items): Promise<DeliveryHandle[]> {
      return items.map((item) => ({ deliveryId: item.deliveryId }));
    },
    async nudge(handles): Promise<void> {
      for (const handle of handles) {
        await deps.delivery.deliverPending(handle.deliveryId);
      }
    },
  };
}
