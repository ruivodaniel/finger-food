/**
 * Stripe event repository — the claim. Inserting the event id inside the
 * handler's transaction is the whole idempotency mechanism: a duplicate
 * delivery fails the insert (false), a failed handler rolls the claim back.
 */

import { paymentStripeEvent } from "../models/stripe-event.model";
import type { Executor } from "../shared/executor";

export interface StripeEventRepository {
  /** True when this delivery is the first; false when the event was processed before. */
  claim(tx: Executor, event: { id: string; type: string }): Promise<boolean>;
}

export class DrizzleStripeEventRepository implements StripeEventRepository {
  async claim(tx: Executor, event: { id: string; type: string }): Promise<boolean> {
    const rows = await tx
      .insert(paymentStripeEvent)
      .values({ id: event.id, type: event.type, createdAt: new Date() })
      .onConflictDoNothing()
      .returning({ id: paymentStripeEvent.id });
    return rows.length > 0;
  }
}
