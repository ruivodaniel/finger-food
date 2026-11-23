import { describe, expect, it } from "vitest";

import { liveStateOf, liveText, readChatEvent } from "./live";

const envelope = (event: unknown) => ({ userId: "alice", chatId: "chat-1", messageId: "msg-1", seq: 0, event });
const realtime = (event: string, data: unknown) => ({ channel: "chat", event, data, timestamp: "t" });

describe("readChatEvent", () => {
  it("reads a valid chat event", () => {
    const event = readChatEvent(realtime("status", envelope({ type: "status", state: "thinking" })));
    expect(event).toEqual({ kind: "chat", envelope: envelope({ type: "status", state: "thinking" }) });
  });

  it("reads a resync for a chat", () => {
    expect(readChatEvent(realtime("resync", { chatId: "chat-1" }))).toEqual({ kind: "resync", chatId: "chat-1" });
  });

  it("drops anything that is not a valid chat event", () => {
    expect(readChatEvent(realtime("status", envelope({ type: "status", state: "sleeping" })))).toBeNull();
    expect(readChatEvent(realtime("resync", {}))).toBeNull();
  });
});

describe("liveStateOf and liveText", () => {
  it("shows thinking, and thinking while the answer is written", () => {
    expect(liveText(liveStateOf({ type: "status", state: "thinking" })!)).toBe("Thinking…");
    expect(liveText(liveStateOf({ type: "status", state: "answering" })!)).toBe("Thinking…");
  });

  it("names the data being read in the user's words, once each", () => {
    const live = liveStateOf({
      type: "status",
      state: "calling_tools",
      tools: ["list_accessible_organizations", "list_organization_members", "list_organization_members"],
    });
    expect(liveText(live!)).toBe("Reading the organizations you have access to, the members…");
  });

  it("falls back to 'your data' for a function it does not know", () => {
    expect(liveText(liveStateOf({ type: "status", state: "calling_tools", tools: ["something_new"] })!)).toBe(
      "Reading your data…",
    );
  });

  it("is null for an event that is not a status", () => {
    expect(liveStateOf({ type: "token", text: "Hi" })).toBeNull();
  });
});
