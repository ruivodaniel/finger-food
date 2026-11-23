/**
 * Webhook service — one path for every payment event, on either endpoint:
 *
 *   verify → (ignored ⇒ 200) → tx { claim the event id → the kind's handler } → 200
 *
 * A signature that does not verify is a 400 before anything else. A known
 * event id answers 200 and writes nothing. A throwing handler rolls the claim
 * back and surfaces as a 500, so the provider retries. Handlers run inside the
 * claim's transaction and write only through this slice's repositories.
 */

import type { ProviderEvent, ProviderEventKind, PaymentProvider, WebhookEndpoint } from "../stripe/provider";
import type { StripeEventRepository } from "../repositories/stripe-event.repository";
import type { Executor, RunInTransaction } from "../shared/executor";
import type { ModuleLogger } from "../shared/module-errors";

export type EventHandler<K extends ProviderEventKind = ProviderEventKind> = (
  tx: Executor,
  event: Extract<ProviderEvent, { kind: K }>,
) => Promise<void>;

export type EventHandlers = { [K in ProviderEventKind]?: EventHandler<K> };

export type WebhookOutcome = { status: "ignored" } | { status: "duplicate" } | { status: "processed"; kind: ProviderEventKind };

export interface WebhookServiceDeps {
  provider: Pick<PaymentProvider, "parseWebhook">;
  eventRepo: StripeEventRepository;
  handlers: EventHandlers;
  runInTransaction: RunInTransaction;
  logger: ModuleLogger;
}

export class WebhookService {
  private readonly deps: WebhookServiceDeps;

  constructor(deps: WebhookServiceDeps) {
    this.deps = deps;
  }

  /** Throws ProviderSignatureError on a bad signature; rethrows a handler's failure after the rollback. */
  async handle(endpoint: WebhookEndpoint, rawBody: string, signature: string): Promise<WebhookOutcome> {
    const event = this.deps.provider.parseWebhook(rawBody, signature, endpoint);
    if (event.kind === "ignored") return { status: "ignored" };
    return this.deps.runInTransaction(async (tx) => {
      const first = await this.deps.eventRepo.claim(tx, { id: event.id, type: event.type });
      if (!first) return { status: "duplicate" };
      const handler = this.deps.handlers[event.kind] as EventHandler | undefined;
      if (handler) await handler(tx, event);
      else this.deps.logger.info("payment event without a handler", { type: event.type, kind: event.kind });
      return { status: "processed", kind: event.kind };
    });
  }
}
