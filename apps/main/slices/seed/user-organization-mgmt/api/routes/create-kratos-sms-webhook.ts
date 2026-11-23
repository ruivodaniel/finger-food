/**
 * Kratos courier SMS webhook factory — the provider delivers SMS through the
 * app's transport layer (it never holds SMS provider credentials). Guarded
 * by a shared-secret header; the mount rides it on the module's own auth
 * surface (/courier/sms, before the session middleware) so the app never
 * names the provider. kratos.yml's courier posts here.
 *
 * Routes:
 *   POST /   { to, body }  (X-Courier-Secret required)
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export interface CreateKratosSmsWebhookOptions {
  /** Shared secret the courier sends as X-Courier-Secret. */
  secret: string;
  sms: { send: (to: string, text: string) => void | Promise<void> };
}

export function createKratosSmsWebhook(options: CreateKratosSmsWebhookOptions) {
  const router = new Hono();

  router.post(
    "/",
    zValidator(
      "json",
      z.object({ to: z.string().min(1), body: z.string().min(1) }),
    ),
    async (c) => {
      if (c.req.header("x-courier-secret") !== options.secret) {
        return c.json({ error: "forbidden" }, 403);
      }
      const { to, body } = c.req.valid("json");
      await options.sms.send(to, body);
      return c.json({ ok: true });
    },
  );

  return router;
}
