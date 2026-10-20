/**
 * In-memory repository implementations — test doubles for docker-free unit
 * tests. They honor the repository interfaces exactly, including the two
 * partial-unique indexes the real table enforces (supersede for in-app,
 * idempotency for email/SMS), because those ARE the queue's semantics.
 */

import type {
  DeliveryStatus,
  NotificationDeliverySelect,
  NotificationPreferenceSelect,
  NotificationSelect,
} from "../models/notification.model";
import { ACTIVE_IN_APP_STATUSES } from "../models/notification.model";
import type {
  CreateDeliveryRecord,
  DeliveryRepository,
  DeliveryStatusPatch,
  DeliveryWithFact,
  ListInboxQuery,
} from "../repositories/delivery.repository";
import type {
  CreateNotificationRecord,
  NotificationRepository,
} from "../repositories/notification.repository";
import type {
  PreferenceRepository,
  UpsertPreferenceRecord,
} from "../repositories/preference.repository";
import type { NotificationChannel } from "../../shared/types";
import type { Executor, RunInTransaction } from "../shared/executor";

let seq = 0;
export const nextId = (prefix: string) => `${prefix}_${++seq}`;

/** Tests run "in a transaction" by passing a marker no fake ever reads. */
export const FAKE_TX = {} as Executor;
export const runInFakeTransaction: RunInTransaction = (run) => run(FAKE_TX);

export class InMemoryNotificationRepository implements NotificationRepository {
  notifications = new Map<string, NotificationSelect>();

  async insert(
    _executor: Executor,
    input: CreateNotificationRecord,
  ): Promise<NotificationSelect> {
    const row: NotificationSelect = {
      id: nextId("notification"),
      template: input.template,
      messageType: input.messageType,
      args: input.args,
      dedupeKey: input.dedupeKey,
      createdAt: new Date(),
    };
    this.notifications.set(row.id, row);
    return row;
  }

  async findByIds(ids: string[]): Promise<NotificationSelect[]> {
    return ids
      .map((id) => this.notifications.get(id))
      .filter((row): row is NotificationSelect => row !== undefined);
  }
}

export class InMemoryDeliveryRepository implements DeliveryRepository {
  deliveries: NotificationDeliverySelect[] = [];
  /** Wire the fact repo in tests that read the inbox or deliver a row. */
  notifications: InMemoryNotificationRepository | null = null;

  async bulkInsert(
    _executor: Executor,
    rows: CreateDeliveryRecord[],
  ): Promise<NotificationDeliverySelect[]> {
    const now = new Date();
    const inserted: NotificationDeliverySelect[] = [];
    for (const row of rows) {
      if (this.conflicts(row)) continue;
      const stored: NotificationDeliverySelect = {
        ...row,
        attemptCount: 0,
        sentAt: null,
        seenAt: null,
        dismissedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      this.deliveries.push(stored);
      inserted.push(stored);
    }
    return inserted;
  }

  async supersedeBy(
    _executor: Executor,
    input: { recipientUserId: string; template: string; dedupeKey: string },
  ): Promise<void> {
    for (const row of this.deliveries) {
      if (
        row.recipientUserId === input.recipientUserId &&
        row.template === input.template &&
        row.dedupeKey === input.dedupeKey &&
        row.channel === "in_app" &&
        (ACTIVE_IN_APP_STATUSES as readonly DeliveryStatus[]).includes(row.status)
      ) {
        row.status = "superseded";
        row.updatedAt = new Date();
      }
    }
  }

  async updateStatus(id: string, patch: DeliveryStatusPatch): Promise<boolean> {
    const row = this.deliveries.find((delivery) => delivery.id === id);
    if (!row) return false;
    if (patch.onlyFromStatuses && !patch.onlyFromStatuses.includes(row.status)) {
      return false;
    }
    row.status = patch.status;
    row.updatedAt = new Date();
    if (patch.sentAt) row.sentAt = patch.sentAt;
    if (patch.deliveredAt) row.deliveredAt = patch.deliveredAt;
    if (patch.seenAt) row.seenAt = patch.seenAt;
    if (patch.dismissedAt) row.dismissedAt = patch.dismissedAt;
    if (patch.lastErrorCode !== undefined) row.lastErrorCode = patch.lastErrorCode;
    if (patch.incrementAttempt) row.attemptCount += 1;
    return true;
  }

  async getById(id: string): Promise<NotificationDeliverySelect | null> {
    return this.deliveries.find((row) => row.id === id) ?? null;
  }

  async getWithFact(id: string): Promise<DeliveryWithFact | null> {
    const delivery = await this.getById(id);
    if (!delivery) return null;
    const notification = this.notifications?.notifications.get(
      delivery.notificationId,
    );
    return notification ? { delivery, notification } : null;
  }

  async listInbox(query: ListInboxQuery): Promise<DeliveryWithFact[]> {
    return this.deliveries
      .filter(
        (row) =>
          row.recipientUserId === query.recipientUserId &&
          row.channel === "in_app" &&
          (ACTIVE_IN_APP_STATUSES as readonly DeliveryStatus[]).includes(
            row.status,
          ) &&
          (!query.cursor || row.createdAt.getTime() < query.cursor.getTime()),
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, query.limit)
      .flatMap((delivery) => {
        const notification = this.notifications?.notifications.get(
          delivery.notificationId,
        );
        return notification ? [{ delivery, notification }] : [];
      });
  }

  async countUnseen(recipientUserId: string): Promise<number> {
    return this.deliveries.filter(
      (row) =>
        row.recipientUserId === recipientUserId &&
        row.channel === "in_app" &&
        ["pending", "sent", "delivered"].includes(row.status),
    ).length;
  }

  /** The two partial-unique indexes, in the same order the table applies them. */
  private conflicts(row: CreateDeliveryRecord): boolean {
    if (row.dedupeKey === null) return false;
    if (row.channel === "in_app") {
      return this.deliveries.some(
        (existing) =>
          existing.recipientUserId === row.recipientUserId &&
          existing.template === row.template &&
          existing.dedupeKey === row.dedupeKey &&
          existing.channel === "in_app" &&
          (ACTIVE_IN_APP_STATUSES as readonly DeliveryStatus[]).includes(
            existing.status,
          ),
      );
    }
    return this.deliveries.some(
      (existing) =>
        existing.recipientUserId === row.recipientUserId &&
        existing.channel === row.channel &&
        existing.template === row.template &&
        existing.dedupeKey === row.dedupeKey &&
        existing.status !== "failed",
    );
  }
}

export class InMemoryPreferenceRepository implements PreferenceRepository {
  preferences: NotificationPreferenceSelect[] = [];

  async findAllByUserIds(
    userIds: string[],
    messageType: string,
  ): Promise<NotificationPreferenceSelect[]> {
    return this.preferences.filter(
      (row) => userIds.includes(row.userId) && row.messageType === messageType,
    );
  }

  async findAllByUserId(
    userId: string,
  ): Promise<NotificationPreferenceSelect[]> {
    return this.preferences.filter((row) => row.userId === userId);
  }

  async findOne(
    userId: string,
    messageType: string,
    channel: NotificationChannel,
  ): Promise<NotificationPreferenceSelect | null> {
    return (
      this.preferences.find(
        (row) =>
          row.userId === userId &&
          row.messageType === messageType &&
          row.channel === channel,
      ) ?? null
    );
  }

  async upsert(input: UpsertPreferenceRecord): Promise<void> {
    const existing = await this.findOne(
      input.userId,
      input.messageType,
      input.channel,
    );
    if (existing) {
      existing.enabled = input.enabled;
      existing.updatedAt = new Date();
      return;
    }
    this.preferences.push({
      id: nextId("preference"),
      userId: input.userId,
      messageType: input.messageType,
      channel: input.channel,
      enabled: input.enabled,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

export const testErrors = {
  notFound: (m?: string) => new Error(`404:${m}`),
  badRequest: (m?: string) => new Error(`400:${m}`),
  unauthorized: (m?: string) => new Error(`401:${m}`),
  forbidden: (m?: string) => new Error(`403:${m}`),
  internalError: (m?: string) => new Error(`500:${m}`),
};

export const testLogger = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};
