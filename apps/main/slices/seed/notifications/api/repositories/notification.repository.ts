/**
 * Notification repository — data access for `notification`, the fact written
 * once per queue call.
 */

import { inArray } from "drizzle-orm";
import {
  notification,
  type NotificationSelect,
} from "../models/notification.model";
import type { Executor, NotificationsDb } from "../shared/executor";

export interface CreateNotificationRecord {
  template: string;
  messageType: string;
  args: Record<string, string>;
  dedupeKey: string | null;
}

export interface NotificationRepository {
  /** Runs inside the queue's transaction — the fact and its deliveries commit together. */
  insert(
    executor: Executor,
    input: CreateNotificationRecord,
  ): Promise<NotificationSelect>;
  /** Bulk lookup — want one? pass `[id]` and read the first row. */
  findByIds(ids: string[]): Promise<NotificationSelect[]>;
}

export interface DrizzleNotificationRepositoryDeps {
  db: NotificationsDb;
  createId: () => string;
}

export class DrizzleNotificationRepository implements NotificationRepository {
  constructor(private readonly deps: DrizzleNotificationRepositoryDeps) {}

  async insert(
    executor: Executor,
    input: CreateNotificationRecord,
  ): Promise<NotificationSelect> {
    const row: NotificationSelect = {
      id: this.deps.createId(),
      template: input.template,
      messageType: input.messageType,
      args: input.args,
      dedupeKey: input.dedupeKey,
      createdAt: new Date(),
    };
    await executor.insert(notification).values(row);
    return row;
  }

  async findByIds(ids: string[]): Promise<NotificationSelect[]> {
    if (ids.length === 0) return [];
    return this.deps.db
      .select()
      .from(notification)
      .where(inArray(notification.id, ids));
  }
}
