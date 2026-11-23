/**
 * ChatLayout — the slice layout of the Assistant: "Assistant" in the title band, the caller's chats in the page left sidebar,
 * the chat page in main. The page fills main itself, so its composer can stay at the bottom while the thread scrolls: the
 * primitives are composed here, not the double-sidebar pattern (whose main container is the reading measure).
 */
import { Outlet, useParams } from "@tanstack/react-router";
import { createElement, type ComponentType } from "react";
import { Main, Page, PageBody, PageHeader, PageLeftSidebar } from "@libs/web-layouts";
import { TitleHeader } from "@modules/shared/web";
import { ChatList } from "../components/ChatList";

// boundary: TanStack
const RouterOutlet = Outlet as ComponentType;

export function ChatLayout() {
  const { chatId } = useParams({ strict: false }) as { chatId?: string };
  return (
    <Page>
      <PageHeader>
        <TitleHeader icon="bot" title="Assistant" />
      </PageHeader>
      <PageBody>
        <PageLeftSidebar>
          <ChatList selectedChatId={chatId} />
        </PageLeftSidebar>
        <Main>{createElement(RouterOutlet)}</Main>
      </PageBody>
    </Page>
  );
}
