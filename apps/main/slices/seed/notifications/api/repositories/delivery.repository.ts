/**
 * Delivery repository — data access for `notification_delivery`, the row that
 * carries a message's whole lifecycle for one recipient on one channel.
 *
 * Two rules the table's indexes depend on live here: supersede runs BEFORE the
 * insert (so the partial-unique index accepts the new active row), and every
 * status write may declare `onlyFromStatuses` — a late provider webhook never
 * regresses a row the reader has already seen, and a double-claimed delivery
 * is a no-op rather than a second send.
 */

import { and, desc, eq, inArray, lt, sql } from "drizzle-orm";
import {
  ACTIVE_IN_APP_STATUSES,
  notification,
  notificationDelivery,
  type DeliveryStatus,
  type NotificationDeliverySelect,
  type NotificationSelect,
} from "../models/notification.model";
import type {
  NotificationChannel,
  PreferenceSnapshot,
} from "../../shared/types";
import type { Executor, NotificationsDb } from "../shared/executor";

export interface CreateDeliveryRecord {
  id: string;
  notificationId: string;
  recipientUserId: string;
  channel: NotificationChannel;
  status: DeliveryStatus;
  template: string;
  dedupeKey: string | null;
  address: string | null;
  preferenceSnapshot: PreferenceSnapshot;
  /** Set at birth only for a row that can never be attempted (no address). */
  lastErrorCode: string | null;
  deliveredAt: Date | null;
}

export interface DeliveryStatusPatch {
  status: DeliveryStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  seenAt?: Date;
  dismissedAt?: Date;
  lastErrorCode?: string | null;
  incrementAttempt?: boolean;
  /** Guard — the write applies only from these statuses. */
  onlyFromStatuses?: readonly DeliveryStatus[];
}

/** A delivery row with the fact it belongs to — what rendering needs. */
export interface DeliveryWithFact {
  delivery: NotificationDeliverySelect;
  notification: NotificationSelect;
}

export interface ListInboxQuery {
  recipientUserId: string;
  limit: number;
  /** Rows strictly older than this instant. */
  cursor?: Date;
}

export interface DeliveryRepository {
  /** Runs inside the queue's transaction. Rows that hit an idempotency index
   * are skipped, so the return value is what this call actually created. */
  bulkInsert(
    executor: Executor,
    rows: CreateDeliveryRecord[],
  ): Promise<NotificationDeliverySelect[]>;
  /** Retire the recipient's active in-app row for this (template, dedupeKey). */
  supersedeBy(
    executor: Executor,
    input: { recipientUserId: string; template: string; dedupeKey: string },
  ): Promise<void>;
  /** True when a row actually moved — false means the guard rejected it. */
  updateStatus(id: string, patch: DeliveryStatusPatch): Promise<boolean>;
  getById(id: string): Promise<NotificationDeliverySelect | null>;
  getWithFact(id: string): Promise<DeliveryWithFact | null>;
  listInbox(query: ListInboxQuery): Promise<DeliveryWithFact[]>;
  countUnseen(recipientUserId: string): Promise<number>;
}

export interface DrizzleDeliveryRepositoryDeps {
  db: NotificationsDb;
}

/** Delivered but not yet read — what the bell counts. */
const UNSEEN_STATUSES = [
  "pending",
  "sent",
  "delivered",
] as const satisfies readonly DeliveryStatus[];

export class DrizzleDeliveryRepository implements DeliveryRepository {
  constructor(private readonly deps: DrizzleDeliveryRepositoryDeps) {}

  async bulkInsert(
    executor: Executor,
    rows: CreateDeliveryRecord[],
  ): Promise<NotificationDeliverySelect[]> {
    if (rows.length === 0) return [];
    const now = new Date();
    return executor
      .insert(notificationDelivery)
      .values(
        rows.map((row) => ({
          ...row,
          attemptCount: 0,
          sentAt: null,
          seenAt: null,
          dismissedAt: null,
          createdAt: now,
          updatedAt: now,
        })),
      )
      .onConflictDoNothing()
      .returning();
  }

  async supersedeBy(
    executor: Executor,
    input: { recipientUserId: string; template: string; dedupeKey: string },
  ): Promise<void> {
    await executor
      .update(notificationDelivery)
      .set({ status: "superseded", updatedAt: new Date() })
      .where(
        and(
          eq(notificationDelivery.recipientUserId, input.recipientUserId),
          eq(notificationDelivery.template, input.template),
          eq(notificationDelivery.dedupeKey, input.dedupeKey),
          eq(notificationDelivery.channel, "in_app"),
          inArray(notificationDelivery.status, [...ACTIVE_IN_APP_STATUSES]),
        ),
      );
  }

  async updateStatus(id: string, patch: DeliveryStatusPatch): Promise<boolean> {
    const moved = await this.deps.db
      .update(notificationDelivery)
      .set({
        status: patch.status,
        updatedAt: new Date(),
        ...(patch.sentAt ? { sentAt: patch.sentAt } : {}),
        ...(patch.deliveredAt ? { deliveredAt: patch.deliveredAt } : {}),
        ...(patch.seenAt ? { seenAt: patch.seenAt } : {}),
        ...(patch.dismissedAt ? { dismissedAt: patch.dismissedAt } : {}),
        ...(patch.lastErrorCode !== undefined
          ? { lastErrorCode: patch.lastErrorCode }
          : {}),
        ...(patch.incrementAttempt
          ? { attemptCount: sql`${notificationDelivery.attemptCount} + 1` }
          : {}),
      })
      .where(
        and(
          eq(notificationDelivery.id, id),
          ...(patch.onlyFromStatuses?.length
            ? [inArray(notificationDelivery.status, [...patch.onlyFromStatuses])]
            : []),
        ),
      )
      .returning({ id: notificationDelivery.id });
    return moved.length > 0;
  }

  async getById(id: string): Promise<NotificationDeliverySelect | null> {
    const rows = await this.deps.db
      .select()
      .from(notificationDelivery)
      .where(eq(notificationDelivery.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async getWithFact(id: string): Promise<DeliveryWithFact | null> {
    const rows = await this.deps.db
      .select({ delivery: notificationDelivery, notification })
      .from(notificationDelivery)
      .innerJoin(
        notification,
        eq(notification.id, notificationDelivery.notificationId),
      )
      .where(eq(notificationDelivery.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async listInbox(query: ListInboxQuery): Promise<DeliveryWithFact[]> {
    return this.deps.db
      .select({ delivery: notificationDelivery, notification })
      .from(notificationDelivery)
      .innerJoin(
        notification,
        eq(notification.id, notificationDelivery.notificationId),
      )
      .where(
        and(
          eq(notificationDelivery.recipientUserId, query.recipientUserId),
          eq(notificationDelivery.channel, "in_app"),
          inArray(notificationDelivery.status, [...ACTIVE_IN_APP_STATUSES]),
          ...(query.cursor
            ? [lt(notificationDelivery.createdAt, query.cursor)]
            : []),
        ),
      )
      .orderBy(desc(notificationDelivery.createdAt))
      .limit(query.limit);
  }

  async countUnseen(recipientUserId: string): Promise<number> {
    const [counted] = await this.deps.db
      .select({ value: sql<number>`count(*)::int` })
      .from(notificationDelivery)
      .where(
        and(
          eq(notificationDelivery.recipientUserId, recipientUserId),
          eq(notificationDelivery.channel, "in_app"),
          inArray(notificationDelivery.status, [...UNSEEN_STATUSES]),
        ),
      );
    return counted?.value ?? 0;
  }
}
