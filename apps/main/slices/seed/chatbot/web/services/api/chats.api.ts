import type { Chat, ChatMessage, ChatPage, MessagePage } from "../../../shared/types";
import { clientUrl, http } from "./http";

const withCursor = (path: string, cursor?: string) => (cursor ? `${path}?cursor=${encodeURIComponent(cursor)}` : path);

const chatPath = (chatId: string) => `/chats/${encodeURIComponent(chatId)}`;

export const chatsApi = {
  listChats: (cursor?: string): Promise<ChatPage> => http().request(clientUrl(withCursor("/chats", cursor))),

  getChat: (chatId: string): Promise<Chat> => http().request(clientUrl(chatPath(chatId))),

  startChat: (content: string): Promise<{ chat: Chat; message: ChatMessage }> =>
    http().request(clientUrl("/chats"), { method: "POST", body: JSON.stringify({ content }) }),

  sendMessage: (chatId: string, content: string): Promise<{ message: ChatMessage }> =>
    http().request(clientUrl(`${chatPath(chatId)}/messages`), { method: "POST", body: JSON.stringify({ content }) }),

  getMessages: (chatId: string, cursor?: string): Promise<MessagePage> =>
    http().request(clientUrl(withCursor(`${chatPath(chatId)}/messages`, cursor))),
};
