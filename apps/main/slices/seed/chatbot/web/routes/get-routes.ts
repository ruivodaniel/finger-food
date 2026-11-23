/**
 * The route declaration — this slice's pages as a tree of nodes, as data (@libs/web-routing). The Assistant section: its layout
 * (title band, chat list) with the chat page inside, with and without a chat id.
 */
import type { RouteContext, RouteNode } from "@libs/web-routing";
import { ChatPage } from "../pages/chat/ChatPage";
import { ChatLayout } from "../shared/layouts/ChatLayout";

export function getChatbotRoutes(): RouteNode[] {
  return [
    {
      access: "gated",
      path: "/chat",
      layout: ChatLayout,
      children: [
        { path: "/", page: ChatPage, makeProps: () => ({}) },
        { path: "$chatId", page: ChatPage, makeProps: (ctx: RouteContext) => ({ chatId: ctx.params.chatId }) },
      ],
    },
  ];
}
