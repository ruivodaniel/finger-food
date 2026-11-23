/**
 * One chat: its messages a page at a time, the live state of its pending
 * answer, and sending.
 *
 * - The chat's events are heard by the chats service, on the app's real-time
 *   connection: the stored answer arrives in the cache, what the pending answer
 *   is doing in the store. This hook reads both.
 * - A chat whose last message is the user's (and recent) shows as thinking.
 * - While the chat is on screen, a resync for it or a reconnect reads its
 *   newest page again.
 * - Without a chat, sending starts one and opens it.
 */

import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { chatsService } from "../../../services/application/chats.service";
import { mounted } from "../../../services/application/mount";
import { isApiError } from "../../../shared/helpers/api-error";
import { useChatLive } from "../../../store/chat-live.store";
import type { LiveState } from "../../../shared/helpers/live";

/** The same window in which the server refuses a second message: the last one is still being answered. */
const ANSWER_WINDOW_MS = 5 * 60_000;

const START_ERROR = "The assistant is unavailable right now. Try again in a moment.";
const SEND_ERROR =
  "The previous message is still being answered, or the assistant is unavailable. Try again in a moment.";

export function useChat(chatId: string | undefined) {
  const liveStatus = useChatLive((store) => (chatId ? store.byChat[chatId] : undefined)) ?? null;
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatQuery = useQuery({ ...chatsService.getChat(chatId ?? ""), enabled: !!chatId });
  const messagesQuery = useInfiniteQuery({ ...chatsService.getMessages(chatId ?? ""), enabled: !!chatId });

  // pages[0] is the newest page, and each page is oldest first.
  const messages = useMemo(
    () => [...(messagesQuery.data?.pages ?? [])].reverse().flatMap((page) => page.messages),
    [messagesQuery.data],
  );

  const last = messages.at(-1);
  const awaitingAnswer = last?.role === "user" && Date.now() - Date.parse(last.createdAt) < ANSWER_WINDOW_MS;
  const live: LiveState | null = awaitingAnswer ? (liveStatus ?? { kind: "thinking" }) : null;

  useEffect(() => (chatId ? chatsService.openChat(chatId) : undefined), [chatId]);

  async function send(content: string) {
    setError(null);
    setSending(true);
    try {
      if (!chatId) {
        const chat = await chatsService.startChat(content);
        void mounted().router?.navigate({ to: `/chat/${chat.id}` });
      } else {
        await chatsService.sendMessage(chatId, content);
      }
    } catch {
      setError(chatId ? SEND_ERROR : START_ERROR);
      chatsService.refreshAfterFailure(chatId);
    } finally {
      setSending(false);
    }
  }

  return {
    chat: chatQuery.data,
    notFound: isApiError(chatQuery.error) && chatQuery.error.status === 404,
    messages,
    hasOlder: messagesQuery.hasNextPage,
    loadOlder: () => void messagesQuery.fetchNextPage(),
    live,
    send,
    sending,
    error,
  };
}
