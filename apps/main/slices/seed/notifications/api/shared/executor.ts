/**
 * Write-context types. Queueing is transactional — the fact, its delivery
 * rows, and the outbox enqueue commit together or not at all — so repository
 * methods that take part in that transaction accept an executor rather than
 * reaching for a connection of their own.
 *
 * Only repositories touch tables; services receive `runInTransaction`, built
 * at mount from the app's db handle, and never see the handle itself.
 */

import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export type NotificationsDb = NodePgDatabase<Record<string, unknown>>;

export type NotificationsTx = Parameters<
  Parameters<NotificationsDb["transaction"]>[0]
>[0];

/** A db handle or an open transaction — anything that can run a statement. */
export type Executor = NotificationsDb | NotificationsTx;

export type RunInTransaction = <T>(
  run: (tx: Executor) => Promise<T>,
) => Promise<T>;
