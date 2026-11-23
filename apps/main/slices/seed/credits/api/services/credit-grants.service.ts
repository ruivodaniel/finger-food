/**
 * Credit grants service — a platform owner gives a credit owner platform
 * credits without payment: one `admin_grant` lot with the amount, the expiry
 * (none never expires), the priority (gifts by default, spent before the
 * plan's credits) and a note, and its grant row.
 *
 * Standing on the platform's grant permission (`grant_credits_platform`, held
 * by the Platform Owner): the engine's create verdict. Holding it is also
 * what lets the grants made so far and the owner search be read — a person
 * who may grant sees what was granted.
 */

import type { Ac, ScopedAcRequestContext } from "@libs/gated-scoped-ac";
import type { CreditsCatalog } from "../../shared/catalog";
import type { CreditGrantView, CreditOwner, OwnerOption } from "../../shared/types";
import type { CreditGrant } from "../models/credits.schemas";
import type { CreditLotRepository } from "../repositories/credit-lot.repository";
import type { Executor, RunInTransaction } from "../shared/executor";
import type { ModuleErrors } from "../shared/module-errors";
import { lookUpNames, ownerExists, searchOwners, type People } from "../shared/owner-names";
import type { LedgerService } from "./ledger.service";

export interface CreditGrantsServiceDeps {
  engine: Pick<Ac, "allowCreate">;
  ledger: Pick<LedgerService, "grant">;
  lotRepo: Pick<CreditLotRepository, "listGrants">;
  catalog: Pick<CreditsCatalog, "services">;
  db: Executor;
  runInTransaction: RunInTransaction;
  errors: ModuleErrors;
  /** names the owners and the granters, and finds owners by name */
  people: People;
}

export class CreditGrantsService {
  private readonly deps: CreditGrantsServiceDeps;

  constructor(deps: CreditGrantsServiceDeps) {
    this.deps = deps;
  }

  private requireGranter(ac: ScopedAcRequestContext): void {
    const verdict = this.deps.engine.allowCreate(ac.permissions, "credit_lot", ac.bag);
    if (!verdict.allow) throw this.deps.errors.forbidden(verdict.reason ?? "only a platform owner can grant credits");
  }

  async grant(ac: ScopedAcRequestContext, input: CreditGrant): Promise<{ lotId: string }> {
    this.requireGranter(ac);
    const { errors } = this.deps;
    if (input.expiresAt && input.expiresAt <= new Date()) throw errors.badRequest("the expiry must be in the future");
    if (!(await ownerExists(this.deps.people, input.owner))) throw errors.badRequest("no such credit owner");
    const known = new Set(this.deps.catalog.services.map((s) => s.key));
    const unknown = (input.services ?? []).filter((s) => !known.has(s));
    if (unknown.length) throw errors.badRequest(`unknown services: ${unknown.join(", ")}`);
    return this.deps.runInTransaction(async (tx) => {
      const lot = await this.deps.ledger.grant(tx, {
        owner: input.owner as CreditOwner, reason: "admin_grant", amount: input.amount, serviceKeys: input.services ? [...new Set(input.services)] : null, expiresAt: input.expiresAt, priority: input.priority,
        issuedByUserId: ac.bag.session.user.id, note: input.note || null,
      });
      return { lotId: lot!.id };
    });
  }

  async list(ac: ScopedAcRequestContext, page: { page: number; pageSize: number }): Promise<{ rows: CreditGrantView[]; total: number }> {
    this.requireGranter(ac);
    const result = await this.deps.lotRepo.listGrants(this.deps.db, page);
    const nameOf = await lookUpNames(this.deps.people, {
      organizationIds: result.rows.flatMap((r) => (r.ownerOrganizationId ? [r.ownerOrganizationId] : [])),
      userIds: result.rows.flatMap((r) => [...(r.ownerUserId ? [r.ownerUserId] : []), ...(r.issuedByUserId ? [r.issuedByUserId] : [])]),
    });
    const now = new Date();
    return {
      rows: result.rows.map((r) => {
        const owner: CreditOwner = r.ownerOrganizationId ? { organizationId: r.ownerOrganizationId } : { userId: r.ownerUserId as string };
        return {
          id: r.id, owner, ownerName: nameOf(r.ownerOrganizationId ?? (r.ownerUserId as string)), amount: r.amount, remaining: r.remaining, services: r.serviceKeys,
          priority: r.priority, expiresAt: r.expiresAt ? r.expiresAt.toISOString() : null, expired: r.expiresAt != null && r.expiresAt <= now,
          note: r.note, issuedByName: r.issuedByUserId ? nameOf(r.issuedByUserId) : null, createdAt: r.createdAt.toISOString(),
        };
      }),
      total: result.total,
    };
  }

  async searchOwners(ac: ScopedAcRequestContext, search: string): Promise<OwnerOption[]> {
    this.requireGranter(ac);
    return searchOwners(this.deps.people, ac, search);
  }
}
