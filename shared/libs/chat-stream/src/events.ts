import { z } from "zod";

/**
 * The events of a chat reply, as every hop relays them: the orchestrator sends
 * them to the open API, the open API to the main API, the main API to the
 * browser. Every hop parses them with these schemas and forwards nothing it
 * did not validate.
 */

/** The longest answer or token a hop accepts. */
export const MAX_CONTENT_LENGTH = 100_000;

/** What the reply is doing now: thinking, reading data (with the functions called), or writing the answer. */
export const statusEvent = z.object({
  type: z.literal("status"),
  state: z.enum(["thinking", "calling_tools", "answering"]),
  tools: z.array(z.string().max(100)).max(20).optional(),
});

/** A piece of the answer's text, as the model writes it. */
export const tokenEvent = z.object({
  type: z.literal("token"),
  text: z.string().max(MAX_CONTENT_LENGTH),
});

/** The stored answer; messageId is the assistant message's id. */
export const finalEvent = z.object({
  type: z.literal("final"),
  messageId: z.string().min(1),
  content: z.string().max(MAX_CONTENT_LENGTH),
});

/** The reply failed; messageId is the stored error message's id. */
export const errorEvent = z.object({
  type: z.literal("error"),
  messageId: z.string().min(1),
  message: z.string().max(1_000),
});

export const chatEvent = z.discriminatedUnion("type", [statusEvent, tokenEvent, finalEvent, errorEvent]);

/** What the orchestrator may send while a reply is being written: never the answer itself. */
export const replyUpdate = z.discriminatedUnion("type", [statusEvent, tokenEvent]);

/** One update of a reply, numbered from 0 so a hop can drop the ones it has already seen. */
export const replyFrame = z.object({
  seq: z.number().int().min(0),
  event: replyUpdate,
});

/** The end of a reply, as the orchestrator saves it: the answer, or a failure. */
export const replyAnswer = z.discriminatedUnion("status", [
  z.object({ status: z.literal("complete"), content: z.string().max(MAX_CONTENT_LENGTH) }),
  z.object({ status: z.literal("error") }),
]);

/** A chat event addressed to the user, chat and user message the reply is for. */
export const chatEnvelope = z.object({
  userId: z.string().min(1),
  chatId: z.string().min(1),
  messageId: z.string().min(1),
  seq: z.number().int().min(0),
  event: chatEvent,
});

export type StatusEvent = z.infer<typeof statusEvent>;
export type TokenEvent = z.infer<typeof tokenEvent>;
export type FinalEvent = z.infer<typeof finalEvent>;
export type ErrorEvent = z.infer<typeof errorEvent>;
export type ChatEvent = z.infer<typeof chatEvent>;
export type ReplyUpdate = z.infer<typeof replyUpdate>;
export type ReplyFrame = z.infer<typeof replyFrame>;
export type ReplyAnswer = z.infer<typeof replyAnswer>;
export type ChatEnvelope = z.infer<typeof chatEnvelope>;
