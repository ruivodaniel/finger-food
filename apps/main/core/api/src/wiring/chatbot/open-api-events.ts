// The chatbot's part of main's connection to the open API: each valid chat
// event is handed to the chatbot's stream hub, which pushes it to the chat's
// owner.
import { chatEnvelope, type ChatEnvelope } from "@libs/chat-stream";
import type { RealtimeClient } from "@libs/realtime/client";
import { CHAT_CHANNEL, type StreamHub } from "@modules/chatbot/api";
import { logger } from "@/shared/logger";

/** How long an event's (messageId, seq) is remembered, to drop a duplicate. */
const SEEN_FOR_MS = 15 * 60_000;

/**
 * Listens to the chat channel of the open API's connection. During a planned
 * replacement both connections deliver for a moment, so an event already
 * seen, by (messageId, seq), is dropped.
 */
export function subscribeToChatEvents(
  openApiEvents: RealtimeClient,
  streamHub: StreamHub,
): void {
  const forwardNewEvent = createChatEventFilter((envelope) => {
    streamHub
      .publish(envelope)
      .catch((err) => logger.error({ err }, "chat event push failed"));
  });
  openApiEvents.subscribe(CHAT_CHANNEL, (event) => forwardNewEvent(event.data));
}

/**
 * Validates a chat event and passes it on, once: an invalid event is logged and
 * dropped, and so is one whose (messageId, seq) was already passed on.
 */
export function createChatEventFilter(
  onEvent: (envelope: ChatEnvelope) => void,
) {
  /** messageId:seq → when it was first seen */
  const seen = new Map<string, number>();

  return (data: unknown) => {
    const parsed = chatEnvelope.safeParse(data);
    if (!parsed.success) {
      logger.warn(
        { issues: parsed.error.issues.slice(0, 3) },
        "invalid chat event from the open API dropped",
      );
      return;
    }

    // stops the duplicate filter's memory from growing forever
    const now = Date.now();
    for (const [key, at] of seen) {
      if (now - at < SEEN_FOR_MS) break; // entries are in insertion order: the rest are newer
      seen.delete(key);
    }

    const key = `${parsed.data.messageId}:${parsed.data.seq}`;
    if (seen.has(key)) return;
    seen.set(key, now);
    onEvent(parsed.data);
  };
}
