/** document_lock — a document frozen until someone allowed unlocks it. One per document: while it exists, nobody changes
 * the document, live or not. Unlocking deletes it. Who may lock and unlock is the app's access rules, on this entity. */
import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const documentLock = pgTable(
  "document_lock",
  {
    id: text("id").primaryKey(),
    /** the kind of document, as a slice plugged it in: meteor */
    kind: text("kind").notNull(),
    /** the document's identity in its kind */
    documentId: text("document_id").notNull(),
    /** who locked it */
    lockedBy: text("locked_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex("one_lock_per_document").on(table.kind, table.documentId)],
);

export type DocumentLockSelect = typeof documentLock.$inferSelect;
