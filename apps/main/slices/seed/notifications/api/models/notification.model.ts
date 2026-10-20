/**
 * Notification schema — the fact, its deliveries, and per-user preferences.
 *
 * Two tables by design: `notification` is what happened, written once per
 * queue call; `notification_delivery` is one row per recipient × channel and
 * carries the whole lifecycle — preference verdict, attempts, send result, and
 * the reader's own state (seen/dismissed). In-app rows are born `delivered`:
 * the committed row IS the delivery. Email and SMS rows are born `pending` and
 * ride the outbox.
 *
 * Copy is NOT stored. `args` lives on the fact and renders against the
 * injected template catalog — in-app at read time (so copy edits and i18n
 * reach rows already written), email/sms at send time.
 */

import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { PreferenceSnapshot } from "../../shared/types";
import { NOTIFICATION_CHANNELS } from "../../shared/types";

export const notificationChannelEnum = pgEnum(
  "notification_channel",
  NOTIFICATION_CHANNELS,
);

/**
 * `pending → sent → delivered → seen → dismissed` is the happy path; the rest
 * are terminal verdicts. `suppressed_by_pref` records a recipient who opted
 * out, `superseded` an in-app row replaced by a newer one for the same
 * dedupeKey, `failed` a transport that returned an error.
 */
export const DELIVERY_STATUSES = [
  "pending",
  "sent",
  "delivered",
  "seen",
  "dismissed",
  "failed",
  "suppressed_by_pref",
  "superseded",
] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];
export const notificationDeliveryStatusEnum = pgEnum(
  "notification_delivery_status",
  DELIVERY_STATUSES,
);

/** Statuses an in-app row occupies while it still belongs in the inbox. */
export const ACTIVE_IN_APP_STATUSES = [
  "pending",
  "sent",
  "delivered",
  "seen",
] as const satisfies readonly DeliveryStatus[];

export const notification = pgTable("notification", {
  id: text("id").primaryKey(),
  /** Template name — resolved against the injected catalog with `channel`. */
  template: text("template").notNull(),
  /** Denormalized from the template so the preference rule is auditable. */
  messageType: text("message_type").notNull(),
  args: jsonb("args").$type<Record<string, string>>().notNull().default({}),
  dedupeKey: text("dedupe_key"),
  createdAt: timestamp("created_at").notNull(),
});
export type NotificationSelect = typeof notification.$inferSelect;
export type NotificationInsert = typeof notification.$inferInsert;

export const notificationDelivery = pgTable(
  "notification_delivery",
  {
    id: text("id").primaryKey(),
    notificationId: text("notification_id")
      .notNull()
      .references(() => notification.id, { onDelete: "restrict" }),
    recipientUserId: text("recipient_user_id").notNull(),
    channel: notificationChannelEnum("channel").notNull(),
    status: notificationDeliveryStatusEnum("status").notNull(),
    /** Denormalized from the fact so supersede and idempotency are one
     * statement, no join. */
    template: text("template").notNull(),
    dedupeKey: text("dedupe_key"),
    /** The email/phone actually used — audit; null for in-app. */
    address: text("address"),
    preferenceSnapshot: jsonb("preference_snapshot")
      .$type<PreferenceSnapshot>()
      .notNull(),
    attemptCount: integer("attempt_count").notNull().default(0),
    lastErrorCode: text("last_error_code"),
    sentAt: timestamp("sent_at"),
    deliveredAt: timestamp("delivered_at"),
    seenAt: timestamp("seen_at"),
    dismissedAt: timestamp("dismissed_at"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("notification_delivery_inbox_idx").on(
      table.recipientUserId,
      table.channel,
      table.status,
      table.createdAt.desc(),
    ),
    index("notification_delivery_notification_idx").on(table.notificationId),
    /** One ACTIVE in-app row per (recipient, template, dedupeKey) — the queue
     * supersedes the old row before inserting, so the index accepts the new
     * one and the inbox never shows the same thing twice. */
    uniqueIndex("notification_delivery_supersede_uniq")
      .on(table.recipientUserId, table.template, table.dedupeKey)
      .where(
        sql`dedupe_key is not null and channel = 'in_app'
            and status in ('pending','sent','delivered','seen')`,
      ),
    /** Email/SMS idempotency — a retried queue call re-sends nothing. Failed
     * rows are excluded so a retry after a hard failure is still possible. */
    uniqueIndex("notification_delivery_idempotency_uniq")
      .on(table.recipientUserId, table.channel, table.template, table.dedupeKey)
      .where(sql`dedupe_key is not null and channel <> 'in_app' and status <> 'failed'`),
  ],
);
export type NotificationDeliverySelect =
  typeof notificationDelivery.$inferSelect;
export type NotificationDeliveryInsert =
  typeof notificationDelivery.$inferInsert;

export const notificationPreference = pgTable(
  "notification_preference",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    messageType: text("message_type").notNull(),
    channel: notificationChannelEnum("channel").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("notification_preference_user_type_channel_uniq").on(
      table.userId,
      table.messageType,
      table.channel,
    ),
  ],
);
export type NotificationPreferenceSelect =
  typeof notificationPreference.$inferSelect;
