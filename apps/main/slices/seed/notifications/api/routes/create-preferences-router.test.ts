// =============================================================================
// Preferences router tests — the caller reads and sets their own switches, and
// the pinned message type is refused at the edge as well as in the service.
// =============================================================================

import { describe, it, expect, beforeEach } from "vitest";
import { createPreferencesRouter } from "./create-preferences-router";
import { makeNotificationsStack } from "../testing/test-stack";
import { createTestApp } from "../testing/test-app";
import { testErrors } from "../testing/in-memory-repos";
import type { NotificationPreferenceView } from "../../shared/types";

const USER = { id: "user_1" };

function seed() {
  const stack = makeNotificationsStack();
  const router = createPreferencesRouter({
    preferenceService: stack.preferences,
    errors: testErrors,
  });
  return {
    stack,
    asUser: createTestApp(router, USER),
    asAnonymous: createTestApp(router, null),
  };
}

const put = (body: unknown) => ({
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

describe("GET /notification-preferences", () => {
  let app: ReturnType<typeof seed>;
  beforeEach(() => {
    app = seed();
  });

  it("lists every type × channel switch", async () => {
    const response = await app.asUser.request("/notification-preferences");

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      items: NotificationPreferenceView[];
    };
    expect(body.items).toHaveLength(6);
    expect(
      body.items.filter((item) => item.messageType === "system"),
    ).toSatisfy((items: NotificationPreferenceView[]) =>
      items.every((item) => !item.editable),
    );
  });

  it("401s an unauthenticated caller", async () => {
    expect(
      (await app.asAnonymous.request("/notification-preferences")).status,
    ).toBe(401);
  });
});

describe("PUT /notification-preferences", () => {
  let app: ReturnType<typeof seed>;
  beforeEach(() => {
    app = seed();
  });

  it("stores the switch and returns the whole list back", async () => {
    const response = await app.asUser.request(
      "/notification-preferences",
      put({ messageType: "organization", channel: "email", enabled: false }),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      items: NotificationPreferenceView[];
    };
    expect(
      body.items.find(
        (item) =>
          item.messageType === "organization" && item.channel === "email",
      ),
    ).toMatchObject({ enabled: false });
  });

  it("400s a channel the module doesn't have", async () => {
    const response = await app.asUser.request(
      "/notification-preferences",
      put({ messageType: "organization", channel: "carrier_pigeon", enabled: false }),
    );
    expect(response.status).toBe(400);
  });

  it("400s a type the product pins", async () => {
    const response = await app.asUser.request(
      "/notification-preferences",
      put({ messageType: "system", channel: "email", enabled: false }),
    );

    expect(response.status).toBe(400);
    expect(app.stack.preferenceRepo.preferences).toHaveLength(0);
  });
});
