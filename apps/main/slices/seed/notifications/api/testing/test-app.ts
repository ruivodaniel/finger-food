/**
 * A one-route Hono app for router tests: it plays the part the host app's
 * session middleware plays (setting `user`) and turns the test error
 * constructors' `"<status>:<message>"` messages back into HTTP responses, the
 * way the app's error handler does.
 */

import { Hono } from "hono";
import type { NotificationsEnv } from "../types";

export function createTestApp(
  router: Hono<NotificationsEnv>,
  user: { id: string } | null,
) {
  const app = new Hono<NotificationsEnv>();
  app.use("*", async (c, next) => {
    c.set("user", user);
    await next();
  });
  app.route("/", router);
  app.onError((error, c) => {
    const match = /^(\d{3}):(.*)$/s.exec(error.message);
    if (!match) throw error;
    return c.json({ error: match[2] }, Number(match[1]) as 400);
  });
  return app;
}
