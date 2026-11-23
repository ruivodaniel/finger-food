/**
 * The user's chats and each chat's messages. Reads are query options, a page
 * at a time; commands update the cache in place, so no page is read again:
 *
 * - A started chat, a sent message, or an answer moves its chat to the top of
 *   the first page of the list.
 * - A sent message, and the stored answer a final or error event carries, are
 *   added to the end of the newest page of the chat's messages.
 *
 * The chat events arrive here, on the app's real-time connection: the stored
 * answer goes into the cache, what the pending answer is doing into the store.
 */

import { infiniteQueryOptions, queryOptions, type InfiniteData } from "@tanstack/react-query";
import type { ChatEnvelope } from "@libs/chat-stream";
import type { Chat, ChatMessage, ChatPage, MessagePage } from "../../../shared/types";
import { chatsApi } from "../api/chats.api";
import { CHAT_CHANNEL, liveStateOf, readChatEvent } from "../../shared/helpers/live";
import { chatLive } from "../../store/chat-live.store";
import { mounted, type ChatbotRealtime } from "./mount";

const keys = {
  chats: ["chatbot", "chats"] as const,
  chat: (chatId: string) => ["chatbot", "chat", chatId] as const,
  messages: (chatId: string) => ["chatbot", "chat", chatId, "messages"] as const,
};

type ChatsData = InfiniteData<ChatPage, string | undefined>;
type MessagesData = InfiniteData<MessagePage, string | undefined>;

const cache = () => mounted().queryClient;

/** Puts a chat at the top of the first page and takes it out of the page it was on, so it never shows twice. */
function moveChatToTop(chat: Chat): void {
  cache().setQueryData<ChatsData>(keys.chats, (data) => {
    if (!data) return data;
    const pages = data.pages.map((page) => ({ ...page, chats: page.chats.filter((c) => c.id !== chat.id) }));
    pages[0] = { ...pages[0], chats: [chat, ...pages[0].chats] };
    return { ...data, pages };
  });
}

/** Moves a chat already in the cache to the top, as updated at `updatedAt`. */
function touchChat(chatId: string, updatedAt: string): void {
  const chat = cache().getQueryData<Chat>(keys.chat(chatId));
  if (chat) moveChatToTop({ ...chat, updatedAt });
}

/** Adds a message to the end of the newest page, once. */
function appendMessage(chatId: string, message: ChatMessage): void {
  cache().setQueryData<MessagesData>(keys.messages(chatId), (data) => {
    if (!data) return data;
    if (data.pages.some((page) => page.messages.some((m) => m.id === message.id))) return data;
    const pages = [...data.pages];
    pages[0] = { ...pages[0], messages: [...pages[0].messages, message] };
    return { ...data, pages };
  });
}

/** The chats open on screen now, by how many show each: read again after a reconnect. */
const openChats = new Map<string, number>();

export const chatsService = {
  /** The user's chats, most recent first. */
  getChats: () =>
    infiniteQueryOptions({
      queryKey: keys.chats,
      queryFn: ({ pageParam }) => chatsApi.listChats(pageParam),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    }),

  getChat: (chatId: string) =>
    queryOptions({ queryKey: keys.chat(chatId), queryFn: () => chatsApi.getChat(chatId), retry: false }),

  /** A chat's messages; pages[0] is the newest page, and each page is oldest first. */
  getMessages: (chatId: string) =>
    infiniteQueryOptions({
      queryKey: keys.messages(chatId),
      queryFn: ({ pageParam }) => chatsApi.getMessages(chatId, pageParam),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    }),

  /** Starts a chat with its first message, and puts both in the cache. */
  startChat: async (content: string): Promise<Chat> => {
    const { chat, message } = await chatsApi.startChat(content);
    cache().setQueryData(keys.chat(chat.id), chat);
    cache().setQueryData<MessagesData>(keys.messages(chat.id), {
      pages: [{ messages: [message], nextCursor: null }],
      pageParams: [undefined],
    });
    moveChatToTop(chat);
    return chat;
  },

  sendMessage: async (chatId: string, content: string): Promise<void> => {
    const { message } = await chatsApi.sendMessage(chatId, content);
    appendMessage(chatId, message);
    touchChat(chatId, message.createdAt);
  },

  /** Adds the stored answer a final or error event carries. */
  receiveAnswer: (envelope: ChatEnvelope): void => {
    const event = envelope.event;
    if (event.type !== "final" && event.type !== "error") return;

    const question = cache()
      .getQueryData<MessagesData>(keys.messages(envelope.chatId))
      ?.pages.flatMap((page) => page.messages)
      .find((m) => m.id === envelope.messageId);
    const now = new Date().toISOString();

    appendMessage(envelope.chatId, {
      id: event.messageId,
      chatId: envelope.chatId,
      role: "assistant",
      content: event.type === "final" ? event.content : event.message,
      status: event.type === "final" ? "complete" : "error",
      question: question ? { id: question.id, content: question.content } : null,
      createdAt: now,
    });
    touchChat(envelope.chatId, now);
  },

  /** Reads the newest page of messages again, dropping the older pages loaded so far. */
  readNewestPageAgain: (chatId: string): void => {
    void cache().resetQueries({ queryKey: keys.messages(chatId) });
  },

  /** After a failed start or send: the server stores the message with an error answer, so read again. */
  refreshAfterFailure: (chatId?: string): void => {
    void cache().invalidateQueries({ queryKey: keys.chats });
    if (chatId) void cache().invalidateQueries({ queryKey: keys.messages(chatId) });
  },

  /** A chat is on screen until the returned function runs: its pending answer starts over, and a reconnect reads it again. */
  openChat: (chatId: string): (() => void) => {
    if (!openChats.has(chatId)) chatLive.clear(chatId);
    openChats.set(chatId, (openChats.get(chatId) ?? 0) + 1);
    return () => {
      const left = (openChats.get(chatId) ?? 1) - 1;
      if (left > 0) openChats.set(chatId, left);
      else openChats.delete(chatId);
    };
  },
};

/**
 * At mount: every chat event of the user, from the moment the app starts, so
 * that an answer stored while a chat's messages are being read still reaches
 * it. A resync for a chat, or a reconnect, reads the newest page again: the
 * events of the gap are not replayed, the stored answer is.
 */
export function listenToChats(realtime: ChatbotRealtime): void {
  realtime.subscribe(CHAT_CHANNEL, (realtimeEvent) => {
    const event = readChatEvent(realtimeEvent);
    if (!event) return;
    if (event.kind === "resync") {
      if (openChats.has(event.chatId)) chatsService.readNewestPageAgain(event.chatId);
      return;
    }
    const { chatId, event: chatEvent } = event.envelope;
    if (chatEvent.type === "final" || chatEvent.type === "error") {
      chatsService.receiveAnswer(event.envelope);
      chatLive.clear(chatId);
      return;
    }
    const state = liveStateOf(chatEvent);
    if (state) chatLive.set(chatId, state);
  });

  // the first connection misses nothing: what is on screen was read after it was asked for
  let connectedBefore = false;
  realtime.onConnected(() => {
    if (connectedBefore) for (const chatId of openChats.keys()) chatsService.readNewestPageAgain(chatId);
    connectedBefore = true;
  });
}
