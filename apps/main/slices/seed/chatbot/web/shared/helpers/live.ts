/**
 * The live side of a chat: reading a chat event off the tab's realtime stream,
 * and what the page shows while an answer is being written.
 */

import { chatEnvelope, type ChatEnvelope, type ChatEvent } from "@libs/chat-stream";
import type { RealtimeEvent } from "@libs/realtime";

/** The realtime channel the main API pushes chat events on. */
export const CHAT_CHANNEL = "chat";

/** A chat event, or main asking the page to read a chat again (after main lost its connection to the open API). */
export type ChatStreamEvent = { kind: "chat"; envelope: ChatEnvelope } | { kind: "resync"; chatId: string };

/** Reads an event of the chat channel; anything that is not a valid chat event is null. */
export function readChatEvent(event: RealtimeEvent): ChatStreamEvent | null {
  if (event.event === "resync") {
    const chatId = (event.data as { chatId?: unknown } | null)?.chatId;
    return typeof chatId === "string" ? { kind: "resync", chatId } : null;
  }
  const parsed = chatEnvelope.safeParse(event.data);
  return parsed.success ? { kind: "chat", envelope: parsed.data } : null;
}

/** What the answer being written is doing: thinking, or reading data (in the user's words). */
export type LiveState = { kind: "thinking" } | { kind: "reading"; what: string[] };

/** The live state a status event means; null for an event that is not a status. */
export function liveStateOf(event: ChatEvent): LiveState | null {
  if (event.type !== "status") return null;
  if (event.state === "calling_tools") {
    const what = [...new Set((event.tools ?? []).map(toolInWords))];
    return { kind: "reading", what: what.length ? what : [toolInWords("")] };
  }
  return { kind: "thinking" };
}

/** The line shown under "Assistant" while the answer is being written. */
export function liveText(live: LiveState): string {
  return live.kind === "reading" ? `Reading ${live.what.join(", ")}…` : "Thinking…";
}

/** The functions the model can call, in the user's words. */
const TOOL_WORDS: Record<string, string> = {
  list_accessible_organizations: "the organizations you have access to",
  list_my_organizations: "your memberships",
  get_organization: "an organization",
  list_organization_members: "the members",
};

export function toolInWords(name: string): string {
  return TOOL_WORDS[name] ?? "your data";
}
