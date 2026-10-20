/**
 * Queue service — the one way a message enters the system.
 *
 * `queueEmail` / `queueSms` / `queueInApp` share a skeleton: resolve the
 * template's message type, read every recipient's preference in ONE query,
 * partition into deliverable and suppressed, then commit the fact, its
 * delivery rows, and the outbox enqueue in a single transaction. The nudge is
 * the only thing that happens after commit, and losing it costs latency, not
 * delivery.
 *
 * Statuses are decided here, once: an in-app row is born `delivered` (the
 * committed row IS the delivery), email/sms are born `pending` and ride the
 * outbox, an opted-out recipient gets `suppressed_by_pref`, and a recipient
 * with no address for the channel gets `failed` — nothing is dropped silently.
 */

import type {
  DeliveryOutbox,
  DeliveryOutboxItem,
  NotificationChannel,
  QueueEmailInput,
  QueueInAppInput,
  QueueInput,
  QueueReceipt,
  QueueSmsInput,
  Recipient,
} from "../../shared/types";
import type { AnyTemplateRef, ArgSpec } from "../../shared/templates";
import type { DeliveryStatus } from "../models/notification.model";
import type {
  CreateDeliveryRecord,
  DeliveryRepository,
} from "../repositories/delivery.repository";
import type { NotificationRepository } from "../repositories/notification.repository";
import type { RunInTransaction } from "../shared/executor";
import type { ModuleErrors, ModuleLogger } from "../shared/module-errors";
import type { TemplateCatalog } from "../shared/template-catalog";
import type { PreferenceService } from "./preference.service";

export interface QueueServiceDeps {
  notificationRepo: NotificationRepository;
  deliveryRepo: Pick<DeliveryRepository, "bulkInsert" | "supersedeBy">;
  preferences: Pick<PreferenceService, "rulesFor">;
  catalog: TemplateCatalog;
  deliveryOutbox: DeliveryOutbox;
  runInTransaction: RunInTransaction;
  createId: () => string;
  errors: ModuleErrors;
  logger: ModuleLogger;
}

/** Per-recipient verdict, decided before the transaction opens. */
interface PlannedDelivery {
  recipientUserId: string;
  status: DeliveryStatus;
  address: string | null;
  lastErrorCode: string | null;
  preferenceSnapshot: CreateDeliveryRecord["preferenceSnapshot"];
}

export class QueueService {
  constructor(private readonly deps: QueueServiceDeps) {}

  queueEmail<S extends ArgSpec>(input: QueueEmailInput<S>): Promise<QueueReceipt> {
    return this.queue("email", input as QueueInput<AnyTemplateRef>);
  }

  queueSms<S extends ArgSpec>(input: QueueSmsInput<S>): Promise<QueueReceipt> {
    return this.queue("sms", input as QueueInput<AnyTemplateRef>);
  }

  queueInApp<S extends ArgSpec>(input: QueueInAppInput<S>): Promise<QueueReceipt> {
    return this.queue("in_app", input as QueueInput<AnyTemplateRef>);
  }

  private async queue(
    channel: NotificationChannel,
    input: QueueInput<AnyTemplateRef>,
  ): Promise<QueueReceipt> {
    const template = this.resolveTemplate(channel, input.template);
    const messageType = template.type;
    const dedupeKey = input.dedupeKey ?? null;
    const args = input.args as Record<string, string>;
    const recipients = dedupeRecipients(input.to);

    const rules = await this.deps.preferences.rulesFor({
      userIds: recipients.map((recipient) => recipient.userId),
      messageType,
      channel,
    });

    const planned: PlannedDelivery[] = recipients.map((recipient) => {
      const rule = rules.get(recipient.userId) ?? {
        enabled: true,
        source: "default" as const,
      };
      const address = addressFor(channel, recipient);
      const status = !rule.enabled
        ? "suppressed_by_pref"
        : channel === "in_app"
          ? "delivered"
          : address
            ? "pending"
            : "failed";
      return {
        recipientUserId: recipient.userId,
        status,
        address,
        lastErrorCode: status === "failed" ? "missing_address" : null,
        preferenceSnapshot: { messageType, channel, ...rule },
      };
    });

    const unaddressed = planned.filter(
      (row) => row.lastErrorCode === "missing_address",
    );
    if (unaddressed.length > 0) {
      this.deps.logger.warn("notification recipients have no address", {
        template: template.name,
        channel,
        count: unaddressed.length,
      });
    }

    const now = new Date();
    const { receipt, handles } = await this.deps.runInTransaction(
      async (tx) => {
        // Supersede BEFORE the insert so the partial-unique index accepts the
        // new active row — one live in-app row per (recipient, template, key).
        if (channel === "in_app" && dedupeKey) {
          for (const recipient of recipients) {
            await this.deps.deliveryRepo.supersedeBy(tx, {
              recipientUserId: recipient.userId,
              template: template.name,
              dedupeKey,
            });
          }
        }

        const fact = await this.deps.notificationRepo.insert(tx, {
          template: template.name,
          messageType,
          args,
          dedupeKey,
        });

        const inserted = await this.deps.deliveryRepo.bulkInsert(
          tx,
          planned.map((row) => ({
            id: this.deps.createId(),
            notificationId: fact.id,
            recipientUserId: row.recipientUserId,
            channel,
            status: row.status,
            template: template.name,
            dedupeKey,
            address: row.address,
            preferenceSnapshot: row.preferenceSnapshot,
            lastErrorCode: row.lastErrorCode,
            deliveredAt: row.status === "delivered" ? now : null,
          })),
        );

        const items: DeliveryOutboxItem[] = inserted
          .filter((row) => row.status === "pending" && row.channel !== "in_app")
          .map((row) => ({
            deliveryId: row.id,
            channel: row.channel as Exclude<NotificationChannel, "in_app">,
            dedupeKey: row.dedupeKey,
          }));
        const handles = items.length
          ? await this.deps.deliveryOutbox.enqueue(tx, items)
          : [];

        // Counted here, not after the nudge: the receipt describes what this
        // transaction wrote, whatever delivery does to the rows next.
        return {
          handles,
          receipt: {
            notificationId: fact.id,
            queued: inserted.filter(
              (row) => row.status === "pending" || row.status === "delivered",
            ).length,
            suppressedByPref: inserted.filter(
              (row) => row.status === "suppressed_by_pref",
            ).length,
          },
        };
      },
    );

    if (handles.length > 0) {
      // Fire-and-forget: whatever backs the outbox reconciles a lost nudge.
      await this.deps.deliveryOutbox.nudge(handles).catch((error: unknown) => {
        this.deps.logger.error("notification outbox nudge failed", {
          notificationId: receipt.notificationId,
          template: template.name,
          error,
        });
      });
    }

    return receipt;
  }

  /** The template must be the mounted one — a stored row has to render later. */
  private resolveTemplate(
    channel: NotificationChannel,
    template: AnyTemplateRef,
  ): AnyTemplateRef {
    if (template.channel !== channel) {
      throw this.deps.errors.internalError(
        `template "${template.name}" is a ${template.channel} template, not ${channel}`,
      );
    }
    const registered = this.deps.catalog.require(channel, template.name);
    if (!this.deps.catalog.specFor(registered.type)) {
      throw this.deps.errors.internalError(
        `template "${template.name}" declares unknown message type "${registered.type}"`,
      );
    }
    return registered;
  }
}

function addressFor(
  channel: NotificationChannel,
  recipient: Recipient,
): string | null {
  if (channel === "email") return recipient.email ?? null;
  if (channel === "sms") return recipient.phone ?? null;
  return null;
}

/** One delivery row per recipient — a repeated userId is the same person. */
function dedupeRecipients(to: Recipient[]): Recipient[] {
  const byUserId = new Map<string, Recipient>();
  for (const recipient of to) {
    const existing = byUserId.get(recipient.userId);
    byUserId.set(
      recipient.userId,
      existing ? { ...existing, ...recipient } : recipient,
    );
  }
  return [...byUserId.values()];
}
