/**
 * Inbox service — the recipient's own in-app rows.
 *
 * Copy renders at READ time from the mounted catalog, so a wording fix (and,
 * later, a translation) reaches rows written months ago. Read state lives on
 * the delivery row: `seen` when the recipient opened it, `dismissed` when they
 * cleared it, both guarded so a stale request never walks a row backwards.
 *
 * Every method takes the caller's own userId — a row that isn't theirs is a
 * 404, never a 403, so ids stay unguessable.
 */

import { renderInAppTemplate, type InAppTemplateRef } from "../../shared/templates";
import type {
  InboxItemStatus,
  NotificationInboxItem,
  NotificationInboxPage,
} from "../../shared/types";
import type { DeliveryStatus } from "../models/notification.model";
import type {
  DeliveryRepository,
  DeliveryWithFact,
} from "../repositories/delivery.repository";
import type { ModuleErrors, ModuleLogger } from "../shared/module-errors";
import type { TemplateCatalog } from "../shared/template-catalog";

const SEEABLE = [
  "pending",
  "sent",
  "delivered",
] as const satisfies readonly DeliveryStatus[];

const DISMISSABLE = [
  "pending",
  "sent",
  "delivered",
  "seen",
] as const satisfies readonly DeliveryStatus[];

export interface InboxServiceDeps {
  deliveryRepo: Pick<
    DeliveryRepository,
    "listInbox" | "countUnseen" | "getById" | "updateStatus"
  >;
  catalog: TemplateCatalog;
  errors: ModuleErrors;
  logger: ModuleLogger;
}

export class InboxService {
  constructor(private readonly deps: InboxServiceDeps) {}

  async list(
    userId: string,
    query: { limit: number; cursor?: string },
  ): Promise<NotificationInboxPage> {
    const cursor = query.cursor ? new Date(query.cursor) : undefined;
    if (cursor && Number.isNaN(cursor.getTime())) {
      throw this.deps.errors.badRequest("invalid cursor");
    }
    // One extra row answers "is there another page?" without a count.
    const rows = await this.deps.deliveryRepo.listInbox({
      recipientUserId: userId,
      limit: query.limit + 1,
      cursor,
    });
    const page = rows.slice(0, query.limit);
    const items = page
      .map((row) => this.render(row))
      .filter((item): item is NotificationInboxItem => item !== null);

    return {
      items,
      nextCursor:
        rows.length > query.limit
          ? (page.at(-1)?.delivery.createdAt.toISOString() ?? null)
          : null,
      unseenCount: await this.deps.deliveryRepo.countUnseen(userId),
    };
  }

  async markSeen(userId: string, deliveryId: string): Promise<void> {
    await this.own(userId, deliveryId);
    await this.deps.deliveryRepo.updateStatus(deliveryId, {
      status: "seen",
      seenAt: new Date(),
      onlyFromStatuses: SEEABLE,
    });
  }

  async dismiss(userId: string, deliveryId: string): Promise<void> {
    await this.own(userId, deliveryId);
    await this.deps.deliveryRepo.updateStatus(deliveryId, {
      status: "dismissed",
      dismissedAt: new Date(),
      onlyFromStatuses: DISMISSABLE,
    });
  }

  // ── internals ──────────────────────────────────────────────────────────────

  /** The row must be the caller's own in-app row — anything else is a 404. */
  private async own(userId: string, deliveryId: string): Promise<void> {
    const delivery = await this.deps.deliveryRepo.getById(deliveryId);
    if (
      !delivery ||
      delivery.recipientUserId !== userId ||
      delivery.channel !== "in_app"
    ) {
      throw this.deps.errors.notFound("notification not found");
    }
  }

  /** A row whose template left the catalog is dropped, loudly. */
  private render(row: DeliveryWithFact): NotificationInboxItem | null {
    const template = this.deps.catalog.find("in_app", row.delivery.template);
    if (!template) {
      this.deps.logger.error("notification template left the catalog", {
        deliveryId: row.delivery.id,
        template: row.delivery.template,
      });
      return null;
    }
    return {
      id: row.delivery.id,
      template: row.delivery.template,
      messageType: row.notification.messageType,
      ...renderInAppTemplate(
        template as InAppTemplateRef,
        row.notification.args,
      ),
      status: row.delivery.status as InboxItemStatus,
      seenAt: row.delivery.seenAt?.toISOString() ?? null,
      createdAt: row.delivery.createdAt.toISOString(),
    };
  }
}
