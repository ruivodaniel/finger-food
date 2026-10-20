// =============================================================================
// Preference service tests — defaults, what a user may change, and the two
// narrow accessors the queue and the delivery path read through. Docker-free.
// =============================================================================

import { describe, it, expect, beforeEach } from "vitest";
import { makeNotificationsStack } from "../testing/test-stack";

const USER = "user_1";

describe("list", () => {
  let stack: ReturnType<typeof makeNotificationsStack>;
  beforeEach(() => {
    stack = makeNotificationsStack();
  });

  it("defaults every switch on and marks the pinned type read-only", async () => {
    const items = await stack.preferences.list(USER);

    expect(items).toHaveLength(6); // 2 types × 3 channels
    expect(items.filter((item) => !item.enabled)).toHaveLength(0);
    expect(
      items
        .filter((item) => item.messageType === "system")
        .every((item) => !item.editable),
    ).toBe(true);
    expect(
      items
        .filter((item) => item.messageType === "organization")
        .every((item) => item.editable),
    ).toBe(true);
  });

  it("reflects what the user turned off", async () => {
    await stack.preferences.set(USER, {
      messageType: "organization",
      channel: "email",
      enabled: false,
    });

    const items = await stack.preferences.list(USER);
    expect(
      items.find(
        (item) => item.messageType === "organization" && item.channel === "email",
      ),
    ).toMatchObject({ enabled: false, editable: true });
    expect(
      items.find(
        (item) => item.messageType === "organization" && item.channel === "sms",
      ),
    ).toMatchObject({ enabled: true });
  });
});

describe("set", () => {
  let stack: ReturnType<typeof makeNotificationsStack>;
  beforeEach(() => {
    stack = makeNotificationsStack();
  });

  it("refuses a message type that isn't in the registry", async () => {
    await expect(
      stack.preferences.set(USER, {
        messageType: "marketing",
        channel: "email",
        enabled: false,
      }),
    ).rejects.toThrow(/400:unknown message type "marketing"/);
  });

  it("refuses to silence a type the product pins", async () => {
    await expect(
      stack.preferences.set(USER, {
        messageType: "system",
        channel: "sms",
        enabled: false,
      }),
    ).rejects.toThrow(/can't be turned off/);
    expect(stack.preferenceRepo.preferences).toHaveLength(0);
  });

  it("is idempotent — setting the same switch twice keeps one row", async () => {
    await stack.preferences.set(USER, {
      messageType: "organization",
      channel: "email",
      enabled: false,
    });
    await stack.preferences.set(USER, {
      messageType: "organization",
      channel: "email",
      enabled: true,
    });

    expect(stack.preferenceRepo.preferences).toHaveLength(1);
    expect(stack.preferenceRepo.preferences[0]?.enabled).toBe(true);
  });
});

describe("narrow accessors", () => {
  it("reads every recipient's rule for a queue call in one pass", async () => {
    const stack = makeNotificationsStack();
    await stack.preferences.set("b", {
      messageType: "organization",
      channel: "in_app",
      enabled: false,
    });

    const rules = await stack.preferences.rulesFor({
      userIds: ["a", "b"],
      messageType: "organization",
      channel: "in_app",
    });

    expect(rules.get("a")).toEqual({ enabled: true, source: "default" });
    expect(rules.get("b")).toEqual({ enabled: false, source: "user" });
  });

  it("answers `policy` for a type users can't silence, whatever is stored", async () => {
    const stack = makeNotificationsStack();
    await stack.preferenceRepo.upsert({
      userId: USER,
      messageType: "system",
      channel: "email",
      enabled: false,
    });

    expect(
      await stack.preferences.ruleFor({
        userId: USER,
        messageType: "system",
        channel: "email",
      }),
    ).toEqual({ enabled: true, source: "policy" });
  });

  it("ignores a row set on another channel", async () => {
    const stack = makeNotificationsStack();
    await stack.preferences.set(USER, {
      messageType: "organization",
      channel: "sms",
      enabled: false,
    });

    expect(
      await stack.preferences.ruleFor({
        userId: USER,
        messageType: "organization",
        channel: "email",
      }),
    ).toEqual({ enabled: true, source: "default" });
  });
});
