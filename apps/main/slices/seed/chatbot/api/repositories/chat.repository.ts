/**
 * Chat repository — data access for `chat` and `chat_message`. No logic, no
 * throwing: the service decides what a missing row means.
 *
 * Chats and messages are read a page at a time by keyset: a page starts after
 * the (time, id) pair of the last row of the page before, so rows written in
 * the meantime neither shift nor repeat a page.
 */

import { and, desc, eq, gt, lt, notExists, or } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { alias } from "drizzle-orm/pg-core";

import {
  chat,
  chatMessage,
  type ChatMessageSelect,
  type ChatSelect,
} from "../models/chat.model";

export type ChatbotDb = NodePgDatabase<Record<string, unknown>>;

/** Where a page starts: after the row with this time and id. */
export interface PageCursor {
  time: Date;
  id: string;
}

export interface NewMessage {
  chatId: string;
  role: "user" | "assistant";
  content: string;
  replyTo: string | null;
  runId: string | null;
  status: "complete" | "error";
}

/** A message, and on an answer the user message it replies to. */
export interface MessageWithQuestion {
  message: ChatMessageSelect;
  question: { id: string; content: string } | null;
}

export class ChatRepository {
  constructor(private readonly deps: { db: ChatbotDb; createId: () => string }) {}

  async insertChat(input: { userId: string; organizationId: string | null; title: string }): Promise<ChatSelect> {
    const now = new Date();
    const row: ChatSelect = {
      id: this.deps.createId(),
      userId: input.userId,
      organizationId: input.organizationId,
      title: input.title,
      createdAt: now,
      updatedAt: now,
    };
    await this.deps.db.insert(chat).values(row);
    return row;
  }

  async findChat(chatId: string): Promise<ChatSelect | undefined> {
    const [row] = await this.deps.db.select().from(chat).where(eq(chat.id, chatId));
    return row;
  }

  /** One page of a user's chats, most recently updated first. */
  findChatsByUserId(userId: string, cursor: PageCursor | undefined, limit: number): Promise<ChatSelect[]> {
    return this.deps.db
      .select()
      .from(chat)
      .where(
        and(
          eq(chat.userId, userId),
          cursor
            ? or(lt(chat.updatedAt, cursor.time), and(eq(chat.updatedAt, cursor.time), lt(chat.id, cursor.id)))
            : undefined,
        ),
      )
      .orderBy(desc(chat.updatedAt), desc(chat.id))
      .limit(limit);
  }

  /** One page of a chat's messages, newest first, each answer with the question it replies to. */
  async findMessages(chatId: string, cursor: PageCursor | undefined, limit: number): Promise<MessageWithQuestion[]> {
    const question = alias(chatMessage, "question");
    const rows = await this.deps.db
      .select({ message: chatMessage, questionId: question.id, questionContent: question.content })
      .from(chatMessage)
      .leftJoin(question, eq(question.id, chatMessage.replyTo))
      .where(
        and(
          eq(chatMessage.chatId, chatId),
          cursor
            ? or(
                lt(chatMessage.createdAt, cursor.time),
                and(eq(chatMessage.createdAt, cursor.time), lt(chatMessage.id, cursor.id)),
              )
            : undefined,
        ),
      )
      .orderBy(desc(chatMessage.createdAt), desc(chatMessage.id))
      .limit(limit);

    return rows.map((row) => ({
      message: row.message,
      question: row.questionId ? { id: row.questionId, content: row.questionContent ?? "" } : null,
    }));
  }

  async findMessage(chatId: string, messageId: string): Promise<ChatMessageSelect | undefined> {
    const [row] = await this.deps.db
      .select()
      .from(chatMessage)
      .where(and(eq(chatMessage.chatId, chatId), eq(chatMessage.id, messageId)));
    return row;
  }

  /** A chat's newest messages, returned oldest first. */
  async findLastMessages(chatId: string, limit: number): Promise<ChatMessageSelect[]> {
    const rows = await this.deps.db
      .select()
      .from(chatMessage)
      .where(eq(chatMessage.chatId, chatId))
      .orderBy(desc(chatMessage.createdAt), desc(chatMessage.id))
      .limit(limit);
    return rows.reverse();
  }

  /**
   * Inserts a message and moves the chat's updated time to it, in one
   * transaction. When the user message already has an answer, nothing is
   * inserted and the stored answer is returned.
   */
  insertMessage(input: NewMessage): Promise<ChatMessageSelect> {
    return this.deps.db.transaction(async (tx) => {
      const row: ChatMessageSelect = { id: this.deps.createId(), ...input, createdAt: new Date() };
      const [inserted] = await tx
        .insert(chatMessage)
        .values(row)
        .onConflictDoNothing({ target: chatMessage.replyTo })
        .returning();

      if (!inserted) {
        const [stored] = await tx.select().from(chatMessage).where(eq(chatMessage.replyTo, input.replyTo!));
        return stored;
      }

      await tx.update(chat).set({ updatedAt: inserted.createdAt }).where(eq(chat.id, input.chatId));
      return inserted;
    });
  }

  async setMessageRunId(messageId: string, runId: string): Promise<void> {
    await this.deps.db.update(chatMessage).set({ runId }).where(eq(chatMessage.id, messageId));
  }

  /** The chats with a user message newer than `since` that has no answer yet. */
  findPendingChats(since: Date): Promise<{ chatId: string; userId: string }[]> {
    const answer = alias(chatMessage, "answer");
    return this.deps.db
      .selectDistinct({ chatId: chat.id, userId: chat.userId })
      .from(chatMessage)
      .innerJoin(chat, eq(chat.id, chatMessage.chatId))
      .where(
        and(
          eq(chatMessage.role, "user"),
          gt(chatMessage.createdAt, since),
          notExists(this.deps.db.select().from(answer).where(eq(answer.replyTo, chatMessage.id))),
        ),
      );
  }
}
