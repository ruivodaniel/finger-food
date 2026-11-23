/**
 * Shared pieces of the credits integration tier: the slice's own migration
 * applied as shipped, a catalog, uom's names stood in for, and inert
 * errors/logging.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { PGlite } from "@electric-sql/pglite";
import type { CreditsCatalog } from "@modules/credits/shared";

/** The migration that creates the credits tables, found by what it declares (numbers shift as others land), statement by statement. */
export async function applyCreditsMigration(client: PGlite) {
  const dir = join(__dirname, "../../../drizzle");
  const sql = readdirSync(dir)
    .filter((f) => /^\d{4}_.*\.sql$/.test(f))
    .map((f) => readFileSync(join(dir, f), "utf8"))
    .find((text) => text.includes('CREATE TABLE "credit_account"'));
  if (!sql) throw new Error("the credits migration was not found");
  for (const statement of sql.split("--> statement-breakpoint")) {
    if (statement.trim()) await client.exec(statement);
  }
}

export const catalog: CreditsCatalog = {
  currency: "eur",
  services: [{ key: "assistant", name: "Ask the assistant", unit: "question" }],
  defaultPriceList: "free",
  priceLists: { free: { assistant: 10 }, starter: { assistant: 5 } },
  welcome: { user: 500, organization: 500, expiresInDays: 180 },
};

export const silent = { info() {}, warn() {}, error() {} };

/** Stands in for uom's organization and user-profile services: this tier seeds no uom rows, so every id exists, named by itself. */
const namedByItself = async (_visibility: unknown, ids: string[]) => new Map(ids.map((id) => [id, id]));
export const people = {
  organization: { namesByIds: namedByItself, searchByName: async () => [] },
  userProfile: { namesByIds: namedByItself, searchByName: async () => [] },
};

/** Plain errors whose message names the kind — tests match on it. */
export const errors = {
  notFound: (m?: string) => new Error(`not found: ${m ?? ""}`),
  badRequest: (m?: string) => new Error(`bad request: ${m ?? ""}`),
  unauthorized: (m?: string) => new Error(`unauthorized: ${m ?? ""}`),
  forbidden: (m?: string) => new Error(`forbidden: ${m ?? ""}`),
  internalError: (m?: string) => new Error(`internal: ${m ?? ""}`),
};
