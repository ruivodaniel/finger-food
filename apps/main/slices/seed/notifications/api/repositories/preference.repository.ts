/**
 * Preference repository — data access for `notification_preference`.
 *
 * Reads are batched: one `inArray` query covers every recipient of a queue
 * call, whatever the fan-out.
 */

import { and, eq, inArray } from "drizzle-orm";
import {
  notificationPreference,
  type NotificationPreferenceSelect,
} from "../models/notification.model";
import type { NotificationChannel } from "../../shared/types";
import type { NotificationsDb } from "../shared/executor";

export interface UpsertPreferenceRecord {
  userId: string;
  messageType: string;
  channel: NotificationChannel;
  enabled: boolean;
}

export interface PreferenceRepository {
  /** Every recipient's rule for one message type, in a single query. */
  findAllByUserIds(
    userIds: string[],
    messageType: string,
  ): Promise<NotificationPreferenceSelect[]>;
  findAllByUserId(userId: string): Promise<NotificationPreferenceSelect[]>;
  findOne(
    userId: string,
    messageType: string,
    channel: NotificationChannel,
  ): Promise<NotificationPreferenceSelect | null>;
  upsert(input: UpsertPreferenceRecord): Promise<void>;
}

export interface DrizzlePreferenceRepositoryDeps {
  db: NotificationsDb;
  createId: () => string;
}

export class DrizzlePreferenceRepository implements PreferenceRepository {
  constructor(private readonly deps: DrizzlePreferenceRepositoryDeps) {}

  async findAllByUserIds(
    userIds: string[],
    messageType: string,
  ): Promise<NotificationPreferenceSelect[]> {
    if (userIds.length === 0) return [];
    return this.deps.db
      .select()
      .from(notificationPreference)
      .where(
        and(
          inArray(notificationPreference.userId, userIds),
          eq(notificationPreference.messageType, messageType),
        ),
      );
  }

  async findAllByUserId(
    userId: string,
  ): Promise<NotificationPreferenceSelect[]> {
    return this.deps.db
      .select()
      .from(notificationPreference)
      .where(eq(notificationPreference.userId, userId));
  }

  async findOne(
    userId: string,
    messageType: string,
    channel: NotificationChannel,
  ): Promise<NotificationPreferenceSelect | null> {
    const rows = await this.deps.db
      .select()
      .from(notificationPreference)
      .where(
        and(
          eq(notificationPreference.userId, userId),
          eq(notificationPreference.messageType, messageType),
          eq(notificationPreference.channel, channel),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  async upsert(input: UpsertPreferenceRecord): Promise<void> {
    const now = new Date();
    await this.deps.db
      .insert(notificationPreference)
      .values({
        id: this.deps.createId(),
        userId: input.userId,
        messageType: input.messageType,
        channel: input.channel,
        enabled: input.enabled,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [
          notificationPreference.userId,
          notificationPreference.messageType,
          notificationPreference.channel,
        ],
        set: { enabled: input.enabled, updatedAt: now },
      });
  }
}
