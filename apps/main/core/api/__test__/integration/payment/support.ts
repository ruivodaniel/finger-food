/**
 * Shared pieces of the payment integration tier: the payment and credits
 * migrations applied as shipped, both slices mounted the way the app mounts
 * them, a catalog, and inert errors/logging.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { PGlite } from "@electric-sql/pglite";
import { createId } from "@paralleldrive/cuid2";
import { mountCreditsApi } from "@modules/credits/api";
import { mountPaymentApi, type PaymentProvider } from "@modules/payment/api";
import type { PaymentCatalog } from "@modules/payment/shared";
import { applyCreditsMigration, catalog as creditsCatalog, people } from "../credits/support";
import type { Engine, TestDb } from "../access-control/harness";

/** The migration that creates the payment tables, found by what it declares (numbers shift as others land), statement by statement. */
async function applyPaymentMigration(client: PGlite) {
  const dir = join(__dirname, "../../../drizzle");
  const sql = readdirSync(dir)
    .filter((f) => /^\d{4}_.*\.sql$/.test(f))
    .map((f) => readFileSync(join(dir, f), "utf8"))
    .find((text) => text.includes('CREATE TABLE "payment_account"'));
  if (!sql) throw new Error("the payment migration was not found");
  for (const statement of sql.split("--> statement-breakpoint")) {
    if (statement.trim()) await client.exec(statement);
  }
}

export async function applyMigrations(client: PGlite) {
  await applyCreditsMigration(client);
  await applyPaymentMigration(client);
}

export const catalog: PaymentCatalog = {
  plans: [{ key: "starter", name: "Starter", credits: 2000 }],
  bundles: [{ key: "small", name: "Small", credits: 1000 }],
  marketplace: { platformFeePercent: 10, sellerOrgTypes: ["company"], sellerCountry: "pt", currencies: ["eur"] },
  vendorCredits: { refundExpiresInDays: 180 },
};

export const priceIds = { starter: "price_starter", small: "price_small" };

export const silent = { info() {}, warn() {}, error() {} };

/** Plain errors whose message names the kind — tests match on it. */
export const errors = {
  notFound: (m?: string) => new Error(`not found: ${m ?? ""}`),
  badRequest: (m?: string) => new Error(`bad request: ${m ?? ""}`),
  unauthorized: (m?: string) => new Error(`unauthorized: ${m ?? ""}`),
  forbidden: (m?: string) => new Error(`forbidden: ${m ?? ""}`),
  internalError: (m?: string) => new Error(`internal: ${m ?? ""}`),
  unavailable: (m?: string) => new Error(`unavailable: ${m ?? ""}`),
};

/** Credits, then payment on top of it, as the app's `mounts.ts` does. */
export function mountBoth(db: TestDb, engine: Engine, provider?: PaymentProvider) {
  const credits = mountCreditsApi({ db, createId, catalog: creditsCatalog, engine, people, logger: silent, errors });
  const payment = mountPaymentApi({
    db, createId, catalog, engine, credits: credits.services.ledger, webAppUrl: "https://app.test", provider, priceIds: provider ? priceIds : undefined, people, logger: silent, errors,
  });
  return { credits, payment };
}
