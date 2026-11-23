/**
 * Stream hub — delivers a chat's events to its owner's open realtime streams
 * (one per browser tab), on the `chat` channel. The page ignores the events of
 * other chats.
 */

import type { ChatEnvelope } from "@libs/chat-stream";
import type { PushOptions } from "@libs/realtime";

import type { ChatRepository } from "../repositories/chat.repository";
import type { ModuleLogger } from "./module-errors";

export const CHAT_CHANNEL = "chat";
/** The same window in which a second message is refused: an answer may still arrive. */
const PENDING_WINDOW_MS = 5 * 60_000;

export interface StreamHubDeps {
  push: (userId: string, options: PushOptions) => Promise<void>;
  chatRepo: Pick<ChatRepository, "findPendingChats">;
  logger: ModuleLogger;
}

export class StreamHub {
  constructor(private readonly deps: StreamHubDeps) {}

  /** Pushes a chat event to every open realtime stream of the chat's owner, named after the event's type. */
  async publish(envelope: ChatEnvelope): Promise<void> {
    await this.deps.push(envelope.userId, {
      channel: CHAT_CHANNEL,
      event: envelope.event.type,
      data: envelope,
    });
  }

  /**
   * Tells the owners of chats with an answer still pending to read them
   * again. Runs after main's connection to the open API dropped: the events
   * of the gap are not replayed, but the answer is stored.
   */
  async resync(): Promise<void> {
    const pending = await this.deps.chatRepo.findPendingChats(new Date(Date.now() - PENDING_WINDOW_MS));
    this.deps.logger.info("chat resync", { chats: pending.length });
    for (const { chatId, userId } of pending) {
      await this.deps.push(userId, { channel: CHAT_CHANNEL, event: "resync", data: { chatId } });
    }
  }
}
