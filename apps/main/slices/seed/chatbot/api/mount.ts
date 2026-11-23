/**
 * mountChatbotApi — the module's single assembly point.
 *
 * Builds the chat repository, service, stream hub and router from the app's
 * database, its function that starts a run, and its realtime push. The app
 * mounts what it receives; nothing in here reaches for app internals.
 */

import type { PushOptions } from "@libs/realtime";

import { ChatRepository, type ChatbotDb } from "./repositories/chat.repository";
import { createChatRouter } from "./routes/create-chat-router";
import { ChatService, type StartRun } from "./services/chat.service";
import type { ModuleErrors, ModuleLogger } from "./shared/module-errors";
import { StreamHub } from "./shared/stream-hub";

export interface MountChatbotApiOptions {
  /** Drizzle database instance (the app's — module tables flow in via ./models). */
  db: ChatbotDb;
  /** Id factory for chats and messages (cuid2 in the seed). */
  createId: () => string;
  /** Starts the run that answers a user message (the orchestrator, in the seed). */
  startRun: StartRun;
  /** Sends an event to every open realtime stream of a user (@libs/realtime). */
  push: (userId: string, options: PushOptions) => Promise<void>;
  errors: ModuleErrors;
  logger: ModuleLogger;
}

export function mountChatbotApi(options: MountChatbotApiOptions) {
  const chatRepo = new ChatRepository({ db: options.db, createId: options.createId });
  const chatService = new ChatService({
    chatRepo,
    startRun: options.startRun,
    errors: options.errors,
    logger: options.logger,
  });
  const streamHub = new StreamHub({ push: options.push, chatRepo, logger: options.logger });

  return {
    /** The user's chats — mount inside the app's authenticated client router. */
    router: createChatRouter({ chatService, errors: options.errors }),
    services: { chat: chatService },
    /** Where the chat events from the open API are pushed to their owners. */
    streamHub,
  };
}
