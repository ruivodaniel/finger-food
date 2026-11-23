/**
 * The chatbot's tables: a user's chats and their messages.
 *
 * An assistant message replies to exactly one user message (`reply_to`,
 * unique), so a message is answered once. A user message records the run
 * started for it (`run_id`), which never leaves the main API.
 */

import { sql } from "drizzle-orm";
import { index, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const chatMessageRoleEnum = pgEnum("chat_message_role", ["user", "assistant"]);
export const chatMessageStatusEnum = pgEnum("chat_message_status", ["complete", "error"]);

export const chat = pgTable(
  "chat",
  {
    id: text("id").primaryKey(),
    /** The owner of the chat. */
    userId: text("user_id").notNull(),
    /** The organization active when the chat started; null without one. */
    organizationId: text("organization_id"),
    /** The first 60 characters of the first message. */
    title: text("title").notNull(),
    createdAt: timestamp("created_at").notNull(),
    /** The time of the last message: the order of the chat list. */
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    // The chat list, a page at a time: keyset on (updated_at, id).
    index("chat_user_updated_idx").on(table.userId, table.updatedAt, table.id),
  ],
);
export type ChatSelect = typeof chat.$inferSelect;

export const chatMessage = pgTable(
  "chat_message",
  {
    id: text("id").primaryKey(),
    chatId: text("chat_id")
      .notNull()
      .references(() => chat.id, { onDelete: "cascade" }),
    role: chatMessageRoleEnum("role").notNull(),
    content: text("content").notNull(),
    /** On an answer, the user message it replies to; null on a user message. */
    replyTo: text("reply_to").unique(),
    /** On a user message, the run started for it; null on an answer. */
    runId: text("run_id"),
    status: chatMessageStatusEnum("status").notNull().default("complete"),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    // A chat's messages, a page at a time: keyset on (created_at, id).
    index("chat_message_chat_created_idx").on(table.chatId, table.createdAt, table.id),
    // The resync finds the unanswered user messages of the last minutes without scanning the table.
    index("chat_message_user_created_idx").on(table.createdAt).where(sql`${table.role} = 'user'`),
  ],
);
export type ChatMessageSelect = typeof chatMessage.$inferSelect;
