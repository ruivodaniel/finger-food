/**
 * mountCreditsApi — the slice's single assembly point: repositories →
 * services → routers → the surface the app mounts. Nothing in here reaches
 * for app internals; everything the slice needs arrives in the options.
 */

import { Hono } from "hono";
import { DrizzleCreditAccountRepository } from "./repositories/credit-account.repository";
import { DrizzleCreditLedgerRepository } from "./repositories/credit-ledger.repository";
import { DrizzleCreditLotRepository } from "./repositories/credit-lot.repository";
import { DrizzleMemberAllowanceRepository } from "./repositories/member-allowance.repository";
import { createCreditsRouter } from "./routes/create-credits-router";
import { createGrantsRouter } from "./routes/create-grants-router";
import { AllowanceService } from "./services/allowance.service";
import { CreditAccountService } from "./services/credit-account.service";
import { CreditGrantsService } from "./services/credit-grants.service";
import { LedgerService } from "./services/ledger.service";
import type { RunInTransaction } from "./shared/executor";
import type { MountCreditsApiOptions, MountCreditsApiResult } from "./mount-types";
import type { CreditsEnv } from "./types";

export function mountCreditsApi(options: MountCreditsApiOptions): MountCreditsApiResult {
  const accountRepo = new DrizzleCreditAccountRepository();
  const lotRepo = new DrizzleCreditLotRepository();
  const ledgerRepo = new DrizzleCreditLedgerRepository();
  const allowanceRepo = new DrizzleMemberAllowanceRepository();

  // Services get `db` for single statements and `runInTransaction` for the
  // multi-statement writes; the repositories are the only ones that query.
  const db = options.db;
  const runInTransaction: RunInTransaction = (run) => options.db.transaction((tx) => run(tx));

  const allowances = new AllowanceService({ allowanceRepo, ledgerRepo, createId: options.createId });
  const ledger = new LedgerService({
    accountRepo, lotRepo, ledgerRepo, allowances, catalog: options.catalog, db, runInTransaction, createId: options.createId, logger: options.logger,
  });
  const people = options.people;
  const accounts = new CreditAccountService({
    accountRepo, lotRepo, ledgerRepo, ledger, allowances, catalog: options.catalog, engine: options.engine, db, runInTransaction,
    createId: options.createId, errors: options.errors, people,
  });
  const grants = new CreditGrantsService({
    engine: options.engine, ledger, lotRepo, catalog: options.catalog, db, runInTransaction, errors: options.errors, people,
  });

  const router = new Hono<CreditsEnv>()
    .route("/", createCreditsRouter({ accounts, errors: options.errors }))
    .route("/", createGrantsRouter({ grants, errors: options.errors }));

  return {
    router,
    metering: {
      quote: (owner, input) => ledger.quote(owner, input),
      charge: (owner, input) => ledger.charge(owner, input),
      refund: (input) => ledger.refund(input),
    },
    welcome: {
      user: (userId) => accounts.welcomeUser(userId),
      organization: (organizationId) => accounts.welcomeOrganization(organizationId),
    },
    services: { ledger, accounts, allowances, grants },
  };
}
