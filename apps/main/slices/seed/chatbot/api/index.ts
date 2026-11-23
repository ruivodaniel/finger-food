// Public API surface — what a consuming app imports. The open API builds
// ChatService and ChatRepository itself, on the main database, to store answers.

export { mountChatbotApi } from "./mount";
export type { MountChatbotApiOptions } from "./mount";
export { ChatRepository } from "./repositories/chat.repository";
export type { ChatbotDb } from "./repositories/chat.repository";
export { ChatService, FAILED_ANSWER_TEXT } from "./services/chat.service";
export type { StartRun } from "./services/chat.service";
export { StreamHub, CHAT_CHANNEL } from "./shared/stream-hub";
export type { ModuleErrors, ModuleLogger } from "./shared/module-errors";
export type { ChatbotEnv, ChatbotContextVariables } from "./types";
