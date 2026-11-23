/**
 * ChatList — the user's chats in the section's left panel: New chat, then the
 * chats, most recent first, with the open chat selected. Older chats load as
 * the list scrolls to its end.
 */

import { useInfiniteQuery } from "@tanstack/react-query";
import { Stack } from "@libs/web-layouts";
import { Icon } from "@libs/web-components";

import { chatsService } from "../../services/application/chats.service";
import { mounted } from "../../services/application/mount";
import { useWhenVisible } from "../hooks/use-when-visible";

export interface ChatListProps {
  /** The open chat; none on a new chat. */
  selectedChatId?: string;
}

export function ChatList({ selectedChatId }: ChatListProps) {
  const { data, isLoading, hasNextPage, fetchNextPage } = useInfiniteQuery(chatsService.getChats());
  const chats = data?.pages.flatMap((page) => page.chats) ?? [];
  const endRef = useWhenVisible(() => void fetchNextPage(), hasNextPage);

  const open = (to: string) => (event: React.MouseEvent) => {
    event.preventDefault();
    void mounted().router?.navigate({ to });
  };

  return (
    <nav element="control-group--sidebar" data-testid="chat-list">
      <Stack dir="col" scale="lg">
        <a
          href="/chat"
          element="control--sidebar-item"
          state={selectedChatId ? undefined : "selected"}
          data-testid="chat-list-new-link"
          onClick={open("/chat")}
        >
          <Icon name="add" scale="sm" />
          <span>New chat</span>
        </a>

        <Stack dir="col" scale="2xs">
          <span element="type--body-extra-small" emphasis="quiet">
            Chats
          </span>
          {chats.map((chat) => {
            const selected = chat.id === selectedChatId;
            return (
              <a
                key={chat.id}
                href={`/chat/${chat.id}`}
                element="control--sidebar-item"
                state={selected ? "selected" : undefined}
                aria-current={selected ? "page" : undefined}
                data-testid={`chat-list-item-${chat.id}-link`}
                onClick={open(`/chat/${chat.id}`)}
              >
                <Icon name="message" scale="sm" />
                <span>{chat.title}</span>
              </a>
            );
          })}
          {!isLoading && chats.length === 0 && (
            <span element="type--body-small" emphasis="quiet">
              No chats yet. Ask a question to start one.
            </span>
          )}
          <div ref={endRef} />
        </Stack>
      </Stack>
    </nav>
  );
}
