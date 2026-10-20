// =============================================================================
// Inbox router tests — the HTTP surface over the inbox service: the caller is
// the session's user, and a row that isn't theirs is a 404.
// =============================================================================

import { describe, it, expect, beforeEach } from "vitest";
import { createInboxRouter } from "./create-inbox-router";
import { makeNotificationsStack } from "../testing/test-stack";
import { createTestApp } from "../testing/test-app";
import { testErrors } from "../testing/in-memory-repos";
import { inviteAcceptedInApp } from "../testing/test-catalog";
import type { NotificationInboxPage } from "../../shared/types";

const OWNER = { id: "user_owner" };

async function seed() {
  const stack = makeNotificationsStack();
  await stack.queue.queueInApp({
    template: inviteAcceptedInApp,
    args: { accepterName: "Ada", orgName: "Acme" },
    to: [{ userId: OWNER.id }],
  });
  const router = createInboxRouter({
    inboxService: stack.inbox,
    errors: testErrors,
  });
  return {
    stack,
    deliveryId: stack.deliveryRepo.deliveries[0]!.id,
    asOwner: createTestApp(router, OWNER),
    asStranger: createTestApp(router, { id: "user_stranger" }),
    asAnonymous: createTestApp(router, null),
  };
}

describe("GET /notifications", () => {
  let app: Awaited<ReturnType<typeof seed>>;
  beforeEach(async () => {
    app = await seed();
  });

  it("returns the caller's rendered rows and the unseen count", async () => {
    const response = await app.asOwner.request("/notifications");

    expect(response.status).toBe(200);
    const body = (await response.json()) as NotificationInboxPage;
    expect(body.unseenCount).toBe(1);
    expect(body.items[0]).toMatchObject({
      id: app.deliveryId,
      title: "Invitation accepted",
      status: "delivered",
    });
  });

  it("401s an unauthenticated caller", async () => {
    expect((await app.asAnonymous.request("/notifications")).status).toBe(401);
  });

  it("400s an out-of-range limit", async () => {
    const response = await app.asOwner.request("/notifications?limit=500");
    expect(response.status).toBe(400);
  });
});

describe("POST /notifications/:deliveryId/seen", () => {
  let app: Awaited<ReturnType<typeof seed>>;
  beforeEach(async () => {
    app = await seed();
  });

  it("marks the caller's row seen", async () => {
    const response = await app.asOwner.request(
      `/notifications/${app.deliveryId}/seen`,
      { method: "POST" },
    );

    expect(response.status).toBe(200);
    expect(await app.stack.deliveryRepo.getById(app.deliveryId)).toMatchObject({
      status: "seen",
    });
  });

  it("404s another user's row without confirming it exists", async () => {
    const response = await app.asStranger.request(
      `/notifications/${app.deliveryId}/seen`,
      { method: "POST" },
    );

    expect(response.status).toBe(404);
    expect(await app.stack.deliveryRepo.getById(app.deliveryId)).toMatchObject({
      status: "delivered",
    });
  });
});

describe("POST /notifications/:deliveryId/dismiss", () => {
  it("clears the row out of the caller's inbox", async () => {
    const app = await seed();

    const response = await app.asOwner.request(
      `/notifications/${app.deliveryId}/dismiss`,
      { method: "POST" },
    );

    expect(response.status).toBe(200);
    const page = (await (
      await app.asOwner.request("/notifications")
    ).json()) as NotificationInboxPage;
    expect(page.items).toHaveLength(0);
  });
});
