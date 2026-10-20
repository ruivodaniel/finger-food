/**
 * The notifications contract — what callers hand in, what they get back, and
 * the ports the app implements.
 *
 * Inert types only: configs, wiring, the api layer and the web layer all read
 * this file, so nothing here may touch io, db, or module runtime.
 */

import type {
  ArgSpec,
  ArgsOf,
  EmailTemplateRef,
  InAppTemplateRef,
  SmsTemplateRef,
} from "./templates";

export const NOTIFICATION_CHANNELS = ["in_app", "email", "sms"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

/**
 * Who a message is for. `userId` is REQUIRED — it is what the delivery row
 * records and what preferences are keyed by. An address-only send (an invitee
 * has no account yet) is transactional and bypasses the queue: wiring renders
 * the template and calls the transport directly.
 */
export interface Recipient {
  userId: string;
  email?: string;
  phone?: string;
}

export interface QueueInput<T> {
  template: T;
  /** The template's declared args — compile-checked against the copy. */
  args: ArgsOf<T>;
  /** One delivery row per recipient. */
  to: Recipient[];
  /**
   * Idempotency on every channel; in-app it also supersedes, so a recipient
   * keeps exactly one active row per (template, dedupeKey).
   */
  dedupeKey?: string;
}

// The arg spec stays generic so `args` is checked against THIS template's
// declared args, not against "some record of strings".
export type QueueEmailInput<S extends ArgSpec = ArgSpec> = QueueInput<
  EmailTemplateRef<S>
>;
export type QueueSmsInput<S extends ArgSpec = ArgSpec> = QueueInput<
  SmsTemplateRef<S>
>;
export type QueueInAppInput<S extends ArgSpec = ArgSpec> = QueueInput<
  InAppTemplateRef<S>
>;

export interface QueueReceipt {
  notificationId: string;
  /** Delivery rows this call created and handed downstream. */
  queued: number;
  /** Recipients who had opted out — suppression is visible, not silent. */
  suppressedByPref: number;
}

/** The preference rule that applied when the row was written (audit). */
export interface PreferenceSnapshot {
  messageType: string;
  channel: NotificationChannel;
  enabled: boolean;
  /** `policy` = the type is not user-preferable; `default` = no row yet. */
  source: "user" | "default" | "policy";
}

// ── transports ──────────────────────────────────────────────────────────────

/** Failure is returned, never swallowed — the queue has to record it. */
export type TransportResult =
  | { ok: true; providerMessageId?: string }
  | { ok: false; errorCode: string };

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface SmsMessage {
  to: string;
  body: string;
  /** Non-PHI label for logs (`auth`, `invitation`, a template name). */
  label?: string;
}

export interface EmailTransport {
  send(message: EmailMessage): Promise<TransportResult>;
}

export interface SmsTransport {
  send(message: SmsMessage): Promise<TransportResult>;
}

export interface NotificationTransports {
  email: EmailTransport;
  sms: SmsTransport;
}

// ── durable delivery ────────────────────────────────────────────────────────

/** A pending email/sms delivery handed to the outbox inside the queue's tx. */
export interface DeliveryOutboxItem {
  deliveryId: string;
  channel: Exclude<NotificationChannel, "in_app">;
  /** Denormalized for the outbox's own dedupe key; the module never reads it. */
  dedupeKey: string | null;
}

/** The wiring's reference to enqueued work — opaque to the module. */
export interface DeliveryHandle {
  deliveryId: string;
  ref?: string;
}

/**
 * The durability seam. `enqueue` runs inside the queue's transaction, so a
 * rolled-back mutation enqueues nothing; `nudge` runs after commit and is
 * fire-and-forget — losing it costs latency, not delivery, because whatever
 * backs the outbox reconciles.
 */
export interface DeliveryOutbox {
  enqueue(tx: unknown, items: DeliveryOutboxItem[]): Promise<DeliveryHandle[]>;
  nudge(handles: DeliveryHandle[]): Promise<void>;
}

// ── wire views (api ↔ web) ──────────────────────────────────────────────────

export type InboxItemStatus = "pending" | "sent" | "delivered" | "seen";

export interface NotificationInboxItem {
  /** The delivery row's id — what seen/dismiss act on. */
  id: string;
  template: string;
  messageType: string;
  title: string;
  body: string;
  status: InboxItemStatus;
  seenAt: string | null;
  createdAt: string;
}

export interface NotificationInboxPage {
  items: NotificationInboxItem[];
  /** Pass back as `cursor` for the next page; null at the end. */
  nextCursor: string | null;
  /** Rows the bell counts — delivered but not yet seen. */
  unseenCount: number;
}

export interface NotificationPreferenceView {
  messageType: string;
  channel: NotificationChannel;
  enabled: boolean;
  /** False for rows the product pins (`userPref: false`). */
  editable: boolean;
}

export interface SetNotificationPreferenceInput {
  messageType: string;
  channel: NotificationChannel;
  enabled: boolean;
}
