/**
 * Mount types — the options an app supplies and the surface it receives.
 */

import type { Ac } from "@libs/gated-scoped-ac";
import type { Hono } from "hono";
import type { CreditsCatalog } from "../shared/catalog";
import type { CreditOwner } from "../shared/types";
import type { AllowanceService } from "./services/allowance.service";
import type { CreditAccountService } from "./services/credit-account.service";
import type { CreditGrantsService } from "./services/credit-grants.service";
import type { ChargeResult, LedgerService, Quote } from "./services/ledger.service";
import type { CreditsDb } from "./shared/executor";
import type { ModuleErrors, ModuleLogger } from "./shared/module-errors";
import type { People } from "./shared/owner-names";
import type { CreditsEnv } from "./types";

export interface MountCreditsApiOptions {
  /** Drizzle database instance (the app's — the slice's tables flow in via ./models). */
  db: CreditsDb;
  /** Id factory for domain rows (cuid2 in the seed). */
  createId: () => string;
  /** The product's catalog (`@configs/credits`), validated at import. */
  catalog: CreditsCatalog;
  /** The scoped-AC engine (createAc) — the app's config-bound singleton; the slice never builds one. */
  engine: Ac;
  /** The user-organization slice's organization and user-profile services: they name owners and find them by name. */
  people: People;
  logger: ModuleLogger;
  errors: ModuleErrors;
}

/**
 * What a consumer of credits calls. It names a catalog service and a number
 * of units; the slice decides whether the owner's price list includes the
 * service and what it costs. `quote` before showing the action, `charge`
 * before it runs, `refund` when it failed or was undone.
 */
export interface MeteringCapability {
  quote(owner: CreditOwner, input: { service: string; units: number }): Promise<Quote>;
  charge(owner: CreditOwner, input: { service: string; units: number; ref: string; userId: string }): Promise<ChargeResult>;
  refund(input: { ref: string }): Promise<{ refunded: boolean }>;
}

/** What the lifecycle hooks of the people and organizations slice call. */
export interface WelcomeCapability {
  user(userId: string): Promise<boolean>;
  organization(organizationId: string): Promise<boolean>;
}

export interface MountCreditsApiResult {
  /** The gated routes, for the app's `/api/client` (after its session and access-control middleware). */
  router: Hono<CreditsEnv>;
  metering: MeteringCapability;
  welcome: WelcomeCapability;
  /** Server-side service handles for other slices' ports, seeds and tests. */
  services: {
    ledger: LedgerService;
    accounts: CreditAccountService;
    allowances: AllowanceService;
    grants: CreditGrantsService;
  };
}
