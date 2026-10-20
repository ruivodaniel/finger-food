// =============================================================================
// Inbox service tests — read-time rendering, cursor paging, the unseen count,
// and the ownership + no-regress guards on read state. Docker-free.
// =============================================================================

import { describe, it, expect, beforeEach } from "vitest";
import { makeNotificationsStack } from "../testing/test-stack";
import { inviteAcceptedInApp } from "../testing/test-catalog";

const OWNER = "user_owner";
const STRANGER = "user_stranger";

function args(accepterName: string) {
  return { accepterName, orgName: "Acme" };
}

describe("list", () => {
  let stack: ReturnType<typeof makeNotificationsStack>;
  beforeEach(() => {
    stack = makeNotificationsStack();
  });

  it("renders copy at read time from the mounted catalog", async () => {
    await stack.queue.queueInApp({
      template: inviteAcceptedInApp,
      args: args("Ada"),
      to: [{ userId: OWNER }],
    });

    const page = await stack.inbox.list(OWNER, { limit: 20 });

    expect(page.items).toHaveLength(1);
    expect(page.items[0]).toMatchObject({
      template: "invitation_accepted",
      messageType: "organization",
      title: "Invitation accepted",
      body: "Ada joined Acme.",
      status: "delivered",
      seenAt: null,
    });
    expect(page.nextCursor).toBeNull();
    expect(page.unseenCount).toBe(1);
  });

  it("shows only the caller's own rows", async () => {
    await stack.queue.queueInApp({
      template: inviteAcceptedInApp,
      args: args("Ada"),
      to: [{ userId: OWNER }, { userId: STRANGER }],
    });

    expect((await stack.inbox.list(OWNER, { limit: 20 })).items).toHaveLength(1);
  });

  it("pages newest-first and hands back a cursor while more remain", async () => {
    for (const name of ["Ada", "Bo", "Cy"]) {
      await stack.queue.queueInApp({
        template: inviteAcceptedInApp,
        args: args(name),
        to: [{ userId: OWNER }],
      });
      // distinct createdAt values so the cursor has something to cut on
      const last = stack.deliveryRepo.deliveries.at(-1)!;
      last.createdAt = new Date(Date.now() + stack.deliveryRepo.deliveries.length * 1000);
    }

    const first = await stack.inbox.list(OWNER, { limit: 2 });
    expect(first.items.map((item) => item.body)).toEqual([
      "Cy joined Acme.",
      "Bo joined Acme.",
    ]);
    expect(first.nextCursor).not.toBeNull();

    const second = await stack.inbox.list(OWNER, {
      limit: 2,
      cursor: first.nextCursor!,
    });
    expect(second.items).toHaveLength(1);
    expect(second.nextCursor).toBeNull();
  });

  it("rejects a cursor that isn't a date", async () => {
    await expect(
      stack.inbox.list(OWNER, { limit: 20, cursor: "yesterday" }),
    ).rejects.toThrow(/400:invalid cursor/);
  });
});

describe("read state", () => {
  let stack: ReturnType<typeof makeNotificationsStack>;
  let deliveryId: string;

  beforeEach(async () => {
    stack = makeNotificationsStack();
    await stack.queue.queueInApp({
      template: inviteAcceptedInApp,
      args: args("Ada"),
      to: [{ userId: OWNER }],
    });
    deliveryId = stack.deliveryRepo.deliveries[0]!.id;
  });

  it("marks seen and drops the row out of the unseen count", async () => {
    await stack.inbox.markSeen(OWNER, deliveryId);

    const page = await stack.inbox.list(OWNER, { limit: 20 });
    expect(page.unseenCount).toBe(0);
    expect(page.items[0]?.status).toBe("seen");
    expect(page.items[0]?.seenAt).not.toBeNull();
  });

  it("dismisses a row out of the inbox for good", async () => {
    await stack.inbox.dismiss(OWNER, deliveryId);

    const page = await stack.inbox.list(OWNER, { limit: 20 });
    expect(page.items).toHaveLength(0);
    expect(page.unseenCount).toBe(0);
  });

  it("never walks a dismissed row back to seen", async () => {
    await stack.inbox.dismiss(OWNER, deliveryId);
    await stack.inbox.markSeen(OWNER, deliveryId);

    expect(await stack.deliveryRepo.getById(deliveryId)).toMatchObject({
      status: "dismissed",
    });
  });

  it("treats someone else's row as not found", async () => {
    await expect(stack.inbox.markSeen(STRANGER, deliveryId)).rejects.toThrow(
      /404:notification not found/,
    );
    await expect(stack.inbox.dismiss(STRANGER, deliveryId)).rejects.toThrow(
      /404:notification not found/,
    );
  });
});
