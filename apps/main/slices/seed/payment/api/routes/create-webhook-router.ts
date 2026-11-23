/**
 * Webhook router — the two endpoints Stripe posts to, on a router the slice
 * owns and the app mounts BEFORE its session middleware (a Stripe event has
 * no session, and no JSON middleware may touch the raw body).
 *
 *   POST /          the platform's own events (plans, bundles)
 *   POST /connect   events on connected accounts (sales, refunds, account status)
 *
 * 400 when the signature does not verify; 200 for ignored, duplicate and
 * processed; a throwing handler surfaces as the app's 500, so Stripe retries.
 */

import { Hono } from "hono";
import type { WebhookService } from "../services/webhook.service";
import { ProviderSignatureError, type WebhookEndpoint } from "../stripe/provider";
import type { PaymentEnv } from "../types";

export function createWebhookRouter(options: { webhook: WebhookService }) {
  const receive = (endpoint: WebhookEndpoint) => async (c: import("hono").Context<PaymentEnv>) => {
    const signature = c.req.header("stripe-signature") ?? "";
    const rawBody = await c.req.text();
    try {
      const outcome = await options.webhook.handle(endpoint, rawBody, signature);
      return c.json({ received: true, ...outcome });
    } catch (error) {
      if (error instanceof ProviderSignatureError) return c.json({ error: error.message }, 400);
      throw error;
    }
  };
  return new Hono<PaymentEnv>().post("/", receive("platform")).post("/connect", receive("connect"));
}
