// Public web surface — what a consuming app imports. Pages travel inside the
// route declaration; everything else under web/ is slice-internal.

export { mountChatbotWeb } from "./services/application/mount";
export type { MountChatbotWebOptions, ChatbotHttp, ChatbotRealtime, RouterAdapter } from "./services/application/mount";
export { ChatList } from "./shared/components/ChatList";
export type { ChatListProps } from "./shared/components/ChatList";
export { getChatbotRoutes } from "./routes/get-routes";
