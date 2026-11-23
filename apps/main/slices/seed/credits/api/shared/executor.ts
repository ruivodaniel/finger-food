/**
 * Write-context types. Every balance movement is one transaction — the lock,
 * the conditional update and the ledger rows commit together or not at all —
 * so repository methods that take part accept an executor rather than reaching
 * for a connection of their own.
 *
 * Only repositories touch tables; services receive `runInTransaction`, built
 * at mount from the app's db handle, and never see the handle itself. The db
 * type is the generic Postgres driver shape so the same code runs on
 * node-postgres in the app and on PGlite in the integration tests.
 */

import type { PgDatabase, PgQueryResultHKT, PgTransaction } from "drizzle-orm/pg-core";

export type CreditsDb = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;

export type CreditsTx = PgTransaction<PgQueryResultHKT, Record<string, unknown>>;

/** A db handle or an open transaction — anything that can run a statement. */
export type Executor = CreditsDb | CreditsTx;

export type RunInTransaction = <T>(run: (tx: Executor) => Promise<T>) => Promise<T>;
