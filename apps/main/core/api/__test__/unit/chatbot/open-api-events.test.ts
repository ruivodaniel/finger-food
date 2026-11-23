// What main does with the open API's chat events before pushing them to the
// browser: invalid events are dropped, and so are duplicates from the overlap
// of a planned connection replacement.
import { describe, expect, it, vi } from "vitest";
import { createChatEventFilter } from "@/wiring/chatbot/open-api-events";

const thinking = (seq: number, messageId = "msg-1") => ({
  userId: "alice",
  chatId: "chat-1",
  messageId,
  seq,
  event: { type: "status", state: "thinking" },
});

describe("createChatEventFilter", () => {
  it("passes on a valid event", () => {
    const onEvent = vi.fn();
    createChatEventFilter(onEvent)(thinking(0));

    expect(onEvent).toHaveBeenCalledWith(thinking(0));
  });

  it("drops an event that does not match the chat envelope", () => {
    const onEvent = vi.fn();
    const filter = createChatEventFilter(onEvent);

    filter({ ...thinking(0), event: { type: "status", state: "sleeping" } });
    filter({ ...thinking(0), userId: undefined });
    filter("not an object");

    expect(onEvent).not.toHaveBeenCalled();
  });

  it("drops an event whose message and seq were already passed on", () => {
    const onEvent = vi.fn();
    const filter = createChatEventFilter(onEvent);

    filter(thinking(0));
    filter(thinking(1));
    filter(thinking(0)); // the same event from the other connection
    filter(thinking(0, "msg-2")); // the same seq of another message is new

    expect(onEvent.mock.calls.map(([e]) => `${e.messageId}:${e.seq}`)).toEqual(["msg-1:0", "msg-1:1", "msg-2:0"]);
  });

  it("forgets what it has seen after 15 minutes", () => {
    vi.useFakeTimers();
    const onEvent = vi.fn();
    const filter = createChatEventFilter(onEvent);

    filter(thinking(0));
    vi.advanceTimersByTime(15 * 60_000);
    filter(thinking(0));

    expect(onEvent).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
