/**
 * Chat router — the signed-in user's chats.
 *
 * Routes:
 *   GET  /chats                     a page of the user's chats
 *   POST /chats                     starts a chat with its first message
 *   GET  /chats/:chatId             one chat, without its messages
 *   POST /chats/:chatId/messages    sends a message; the answer arrives on the chat's stream
 *   GET  /chats/:chatId/messages    a page of a chat's messages
 *
 * Mounted behind the app's session and scoped access middlewares: the user
 * always comes from the session, never from the request.
 */

import { zValidator } from "@hono/zod-validator";
import { Hono, type Context } from "hono";
import { z } from "zod";

import { MESSAGE_MAX_LENGTH, type RunBag } from "../../shared/types";
import type { ChatService } from "../services/chat.service";
import type { ModuleErrors } from "../shared/module-errors";
import type { ChatbotEnv } from "../types";

const ChatPageQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(30),
});

const MessagePageQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

const MessageBody = z.object({
  content: z.string().trim().min(1).max(MESSAGE_MAX_LENGTH),
});

export function createChatRouter({ chatService, errors }: { chatService: ChatService; errors: ModuleErrors }) {
  const router = new Hono<ChatbotEnv>();

  /** The user from the session, with their active organization and roles: whom a run acts for. */
  const requireBag = (c: Context<ChatbotEnv>): RunBag => {
    const user = c.get("user");
    if (!user) throw errors.unauthorized("authentication required");
    const scopedAc = c.get("scopedAc");
    return {
      userId: user.id,
      activeOrganizationId: scopedAc?.bag.session.organization?.id ?? null,
      roles: scopedAc?.roles ?? [],
    };
  };

  router.get("/chats", zValidator("query", ChatPageQuery), async (c) => {
    const { userId } = requireBag(c);
    return c.json(await chatService.list(userId, c.req.valid("query")));
  });

  router.post("/chats", zValidator("json", MessageBody), async (c) => {
    const bag = requireBag(c);
    return c.json(await chatService.start(bag, c.req.valid("json").content), 201);
  });

  router.get("/chats/:chatId", async (c) => {
    const { userId } = requireBag(c);
    return c.json(await chatService.get(userId, c.req.param("chatId")));
  });

  router.post("/chats/:chatId/messages", zValidator("json", MessageBody), async (c) => {
    const bag = requireBag(c);
    return c.json(await chatService.send(bag, c.req.param("chatId"), c.req.valid("json").content), 202);
  });

  router.get("/chats/:chatId/messages", zValidator("query", MessagePageQuery), async (c) => {
    const { userId } = requireBag(c);
    return c.json(await chatService.messages(userId, c.req.param("chatId"), c.req.valid("query")));
  });

  return router;
}
