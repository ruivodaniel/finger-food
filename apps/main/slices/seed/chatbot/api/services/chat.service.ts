/**
 * Chat service — a user's chats, sending a message to a run, and storing the
 * answer to a message. The only layer that throws.
 *
 * A chat of another user answers like a chat that does not exist (404), so
 * chat ids stay unguessable.
 */

import type { ReplyAnswer } from "@libs/chat-stream";

import type {
  ChatPage,
  Chat,
  HistoryMessage,
  MessagePage,
  ChatMessage,
  RunBag,
} from "../../shared/types";
import type { ChatMessageSelect, ChatSelect } from "../models/chat.model";
import type { ChatRepository, MessageWithQuestion, PageCursor } from "../repositories/chat.repository";
import type { ModuleErrors, ModuleLogger } from "../shared/module-errors";

/** How many of the chat's last messages a run receives as history. */
const HISTORY_LENGTH = 20;
/** A user message without an answer blocks the next one for this long: it is still being answered. */
const ANSWER_WINDOW_MS = 5 * 60_000;
const TITLE_LENGTH = 60;
/** What the user reads when a reply fails; the cause stays in the logs. */
export const FAILED_ANSWER_TEXT = "Sorry, I couldn't answer this message. Please try again.";

/** Starts the run that answers a user message; the main app wires it to the orchestrator. */
export type StartRun = (input: {
  chatId: string;
  messageId: string;
  prompt: string;
  history: HistoryMessage[];
  bag: RunBag;
}) => Promise<{ runId: string }>;

export interface ChatServiceDeps {
  /** The repository's public methods, so a test can pass an in-memory one. */
  chatRepo: Pick<ChatRepository, keyof ChatRepository>;
  startRun: StartRun;
  errors: ModuleErrors;
  logger: ModuleLogger;
}

export class ChatService {
  constructor(private readonly deps: ChatServiceDeps) {}

  /** One page of the user's chats, most recent first. */
  async list(userId: string, query: { cursor?: string; limit: number }): Promise<ChatPage> {
    const cursor = this.decodeCursor(query.cursor);
    // One extra row answers "is there another page?" without a count.
    const rows = await this.deps.chatRepo.findChatsByUserId(userId, cursor, query.limit + 1);
    const page = rows.slice(0, query.limit);
    const last = page.at(-1);
    return {
      chats: page.map(toChat),
      nextCursor: rows.length > query.limit && last ? encodeCursor(last.updatedAt, last.id) : null,
    };
  }

  async get(userId: string, chatId: string): Promise<Chat> {
    return toChat(await this.assertOwnChat(userId, chatId));
  }

  async assertOwnChat(userId: string, chatId: string): Promise<ChatSelect> {
    const chat = await this.deps.chatRepo.findChat(chatId);
    if (!chat || chat.userId !== userId) throw this.deps.errors.notFound("chat not found");
    return chat;
  }

  /** A user message of one of the user's chats. */
  async assertOwnMessage(userId: string, chatId: string, messageId: string): Promise<ChatMessageSelect> {
    await this.assertOwnChat(userId, chatId);
    const message = await this.deps.chatRepo.findMessage(chatId, messageId);
    if (!message || message.role !== "user") throw this.deps.errors.notFound("message not found");
    return message;
  }

  /** Starts a chat with its first message, titled after the message. */
  async start(bag: RunBag, content: string): Promise<{ chat: Chat; message: ChatMessage }> {
    const chat = await this.deps.chatRepo.insertChat({
      userId: bag.userId,
      organizationId: bag.activeOrganizationId,
      title: content.trim().slice(0, TITLE_LENGTH),
    });
    const { message } = await this.sendTo(chat, bag, content, []);
    return { chat: toChat(chat), message };
  }

  /** Sends a message in one of the user's chats. Refused while the last message is still being answered. */
  async send(bag: RunBag, chatId: string, content: string): Promise<{ message: ChatMessage }> {
    const chat = await this.assertOwnChat(bag.userId, chatId);
    const lastMessages = await this.deps.chatRepo.findLastMessages(chatId, HISTORY_LENGTH);

    const last = lastMessages.at(-1);
    if (last?.role === "user" && Date.now() - last.createdAt.getTime() < ANSWER_WINDOW_MS) {
      throw this.deps.errors.conflict("the last message is still being answered");
    }

    const history = lastMessages
      .filter((message) => message.status === "complete")
      .map((message) => ({ role: message.role, content: message.content }));
    return this.sendTo(chat, bag, content, history);
  }

  /**
   * Stores the user's message, then starts the run that answers it and records
   * the run's id on the message. The run's id never leaves main: the browser
   * follows the answer by the message's id. When the run cannot start, an
   * error answer is stored and the call fails.
   */
  private async sendTo(
    chat: ChatSelect,
    bag: RunBag,
    content: string,
    history: HistoryMessage[],
  ): Promise<{ message: ChatMessage }> {
    const message = await this.deps.chatRepo.insertMessage({
      chatId: chat.id,
      role: "user",
      content,
      replyTo: null,
      runId: null,
      status: "complete",
    });

    let runId: string;
    try {
      ({ runId } = await this.deps.startRun({ chatId: chat.id, messageId: message.id, prompt: content, history, bag }));
    } catch (err) {
      this.deps.logger.error("chat run could not start", { chatId: chat.id, messageId: message.id, err: String(err) });
      await this.deps.chatRepo.insertMessage({
        chatId: chat.id,
        role: "assistant",
        content: FAILED_ANSWER_TEXT,
        replyTo: message.id,
        runId: null,
        status: "error",
      });
      throw this.deps.errors.internalError("the assistant could not start answering");
    }

    await this.deps.chatRepo.setMessageRunId(message.id, runId);
    return { message: toChatMessage({ message, question: null }) };
  }

  /**
   * Stores the answer to a user message, or its failure. A second answer to
   * the same message gets the stored one back. Called by the open API, which
   * receives the answer from the orchestrator.
   */
  async complete(userId: string, chatId: string, messageId: string, answer: ReplyAnswer): Promise<ChatMessage> {
    const question = await this.assertOwnMessage(userId, chatId, messageId);
    const stored = await this.deps.chatRepo.insertMessage({
      chatId,
      role: "assistant",
      content: answer.status === "complete" ? answer.content : FAILED_ANSWER_TEXT,
      replyTo: messageId,
      runId: null,
      status: answer.status,
    });
    return toChatMessage({ message: stored, question: { id: question.id, content: question.content } });
  }

  /** One page of a chat's messages, from the newest back; oldest first within the page. */
  async messages(userId: string, chatId: string, query: { cursor?: string; limit: number }): Promise<MessagePage> {
    await this.assertOwnChat(userId, chatId);
    const cursor = this.decodeCursor(query.cursor);
    const rows = await this.deps.chatRepo.findMessages(chatId, cursor, query.limit + 1);
    const page = rows.slice(0, query.limit);
    const oldest = page.at(-1)?.message;
    return {
      messages: page.reverse().map(toChatMessage),
      nextCursor: rows.length > query.limit && oldest ? encodeCursor(oldest.createdAt, oldest.id) : null,
    };
  }

  private decodeCursor(cursor: string | undefined): PageCursor | undefined {
    if (!cursor) return undefined;
    const [iso, ...idParts] = Buffer.from(cursor, "base64url").toString("utf8").split("|");
    const time = new Date(iso);
    const id = idParts.join("|");
    if (Number.isNaN(time.getTime()) || !id) throw this.deps.errors.badRequest("invalid cursor");
    return { time, id };
  }
}

/** The cursor is opaque to the browser: the last row's time and id. */
function encodeCursor(time: Date, id: string): string {
  return Buffer.from(`${time.toISOString()}|${id}`, "utf8").toString("base64url");
}

function toChat(chat: ChatSelect): Chat {
  return {
    id: chat.id,
    title: chat.title,
    organizationId: chat.organizationId,
    createdAt: chat.createdAt.toISOString(),
    updatedAt: chat.updatedAt.toISOString(),
  };
}

function toChatMessage({ message, question }: MessageWithQuestion): ChatMessage {
  return {
    id: message.id,
    chatId: message.chatId,
    role: message.role,
    content: message.content,
    status: message.status,
    question,
    createdAt: message.createdAt.toISOString(),
  };
}
