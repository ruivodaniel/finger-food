/**
 * `workflow_intent` — the app's durable outbox.
 *
 * A row is a unit of work committed in the same transaction as the mutation
 * that asked for it, so nothing is queued for something that rolled back. The
 * worker claims a row with an atomic compare-and-set, runs its processor, and
 * flips the row terminal; a reconciler reclaims rows whose claim went stale.
 *
 * App-owned infrastructure, not a domain table: modules never see it. They
 * receive a port (the notifications module's `DeliveryOutbox`) that wiring
 * implements over these rows.
 */

import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const WORKFLOW_INTENT_STATUSES = [
  "pending",
  "processing",
  "completed",
  "failed",
] as const;
export type WorkflowIntentStatus = (typeof WORKFLOW_INTENT_STATUSES)[number];

export const workflowIntentStatusEnum = pgEnum(
  "workflow_intent_status",
  WORKFLOW_INTENT_STATUSES,
);

export const workflowIntent = pgTable(
  "workflow_intent",
  {
    id: text("id").primaryKey(),
    /** A `@libs/workflows` kind — picks the processor and the payload schema. */
    kind: text("kind").notNull(),
    status: workflowIntentStatusEnum("status").notNull().default("pending"),
    /** Ids only. Whatever the work needs is looked up by the processor. */
    payload: jsonb("payload").notNull(),
    dedupeKey: text("dedupe_key"),
    /** Earliest the row may be claimed — retry backoff pushes it forward. */
    availableAt: timestamp("available_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    claimedAt: timestamp("claimed_at", { withTimezone: true, mode: "date" }),
    claimedBy: text("claimed_by"),
    attemptCount: integer("attempt_count").notNull().default(0),
    lastErrorCode: text("last_error_code"),
    lastErrorMessage: text("last_error_message"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", {
      withTimezone: true,
      mode: "date",
    }),
  },
  (table) => [
    /** Claimable scan: status = 'pending' AND available_at <= now(). */
    index("workflow_intent_status_available_at_idx").on(
      table.status,
      table.availableAt,
    ),
    /** Reclaim scan: status = 'processing' AND claimed_at < now() - timeout. */
    index("workflow_intent_status_claimed_at_idx").on(
      table.status,
      table.claimedAt,
    ),
    /** One live intent per (kind, dedupeKey) — a repeated enqueue is a no-op. */
    uniqueIndex("workflow_intent_kind_dedupe_active_idx")
      .on(table.kind, table.dedupeKey)
      .where(
        sql`dedupe_key is not null and status in ('pending', 'processing')`,
      ),
  ],
);

export type WorkflowIntentSelect = typeof workflowIntent.$inferSelect;
export type WorkflowIntentInsert = typeof workflowIntent.$inferInsert;
