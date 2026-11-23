/**
 * Meteor service — the public door (published meteors, for anyone) and the
 * company's operations. WHO may do what is the AC engine: allowCreate /
 * allowUpdate verdicts plus resolved read / update / delete Scopes. The
 * service applies what the engine returns and raises the errors.
 *
 * Creating a meteor spends the company's credits: the charge comes before the
 * insert, under the meteor's own id, so a refused charge writes nothing and a
 * failed insert gives the credits back. Deleting one gives them back only
 * within a minute of its creation: an undo, not a way to spend for free.
 */

import type { Ac, GatedDb, Private, Public, SchemaTables, ScopedAcRequestContext } from "@libs/gated-scoped-ac";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { MeteorSelect } from "../models/meteor.model";
import type { CreateMeteorInput, MeteorListQuery, UpdateMeteorInput } from "../models/meteor.schemas";
import type { MeteorRepository } from "../repositories/meteor.repository";
import type { MeteorChargeResult, MeteorCredits } from "../shared/credits-port";
import type { ModuleErrors, ModuleLogger } from "../shared/module-errors";
import type { MeteorView, PublicMeteor } from "../../shared/types";

/** The catalog service a meteor is charged as. */
const METEOR_SERVICE = "meteor";
const REFUND_WINDOW_MS = 60_000;

const REFUSALS: Record<Extract<MeteorChargeResult, { ok: false }>["reason"], string> = {
  entitlement: "creating meteors is not included in this organization's plan",
  balance: "not enough credits to create a meteor",
  allowance: "your credit allocation does not cover this",
};

export interface MeteorServiceDeps {
  meteorRepo: MeteorRepository;
  /** The config-bound engine (injected, never constructed here). */
  engine: Pick<Ac, "resolveRead" | "resolveUpdate" | "resolveDelete" | "allowCreate" | "allowUpdate">;
  /** The app's gated-db factory (injected): every gated read and write binds a
   * handle to the request's bag (a create to the bag that carries the request
   * body, the one the payload rule reads). The app decides what is under it:
   * for meteors, a db that makes every write a new version. */
  gatedDb: (bag: unknown) => GatedDb<SchemaTables>;
  /** Whether a meteor is locked: the app's answer. A locked meteor isn't changed, published or deleted. */
  isLocked: (meteorId: string) => Promise<boolean>;
  /** The ungated db, writing on behalf of a user: where a live meteor's checkpoint is stored. */
  writeAs: (userId: string) => NodePgDatabase<Record<string, unknown>>;
  createId: () => string;
  /** without it meteors are free */
  credits?: MeteorCredits;
  errors: ModuleErrors;
  logger: ModuleLogger;
  now?: () => Date;
}

/** A meteor as it is edited live: the fields a person types into. Status stays a button. */
export interface MeteorFields {
  name: string;
  description: string | null;
  diameterKm: string | null;
  discoveredAt: string | null;
}

export class MeteorService {
  constructor(private readonly deps: MeteorServiceDeps) {}

  private now(): Date {
    return (this.deps.now ?? (() => new Date()))();
  }

  /** A failed refund must not hide why it was attempted: it is logged, for the books. */
  private async refund(meteorId: string): Promise<void> {
    try {
      await this.deps.credits?.refund({ ref: meteorId });
    } catch (error) {
      this.deps.logger.error("meteor credit refund failed", { meteorId, error: error instanceof Error ? error.message : String(error) });
    }
  }

  // ── the public door ──────────────────────────────────────────────────

  async getPublished(visibility: Public, query: MeteorListQuery): Promise<{ rows: PublicMeteor[]; total: number }> {
    const { rows, total } = await this.deps.meteorRepo.findAllPublished(visibility, query);
    return { rows: rows.map((row) => this.toPublicView(row)), total };
  }

  async getPublishedById(visibility: Public, meteorId: string): Promise<PublicMeteor> {
    const [row] = await this.deps.meteorRepo.findPublishedByIds(visibility, [meteorId]);
    if (!row) throw this.deps.errors.notFound("meteor not found");
    return this.toPublicView(row);
  }

  // ── the company's ────────────────────────────────────────────────────

  /** Adds a meteor to the caller's active company, as a draft. */
  async create(ac: ScopedAcRequestContext, visibility: Private, input: CreateMeteorInput): Promise<MeteorView> {
    const organization = ac.bag.session.organization;
    if (!organization) throw this.deps.errors.forbidden("an active organization is required");
    // The payload rule reads the row about to be written off the bag
    // ($requestBody.organizationId), so the bag this create is judged by
    // carries it — for the cheap verdict here and for the gate's own.
    const bag = { ...ac.bag, requestBody: { organizationId: organization.id } };
    // Cheap in-memory verdict first: an early forbidden. The gate runs the
    // verdict again, with its payload probes, before the insert.
    const verdict = this.deps.engine.allowCreate(ac.permissions, "meteor", bag);
    if (!verdict.allow) {
      throw this.deps.errors.forbidden(verdict.reason ?? "cannot create meteor");
    }
    const id = this.deps.createId();
    if (this.deps.credits) {
      const charged = await this.deps.credits.charge(
        { organizationId: organization.id },
        { service: METEOR_SERVICE, units: 1, ref: id, userId: ac.bag.session.user.id },
      );
      if (!charged.ok) throw this.deps.errors.paymentRequired(REFUSALS[charged.reason]);
    }
    const gateDb = this.deps.gatedDb(bag);
    let row: MeteorSelect | null;
    try {
      row = await this.deps.meteorRepo.create(
        visibility,
        {
          id,
          organizationId: organization.id,
          createdBy: ac.bag.session.user.id,
          name: input.name,
          description: input.description,
          diameterKm: input.diameterKm,
          discoveredAt: input.discoveredAt,
          status: "draft",
        },
        ac.permissions,
        gateDb,
      );
    } catch (error) {
      await this.refund(id);
      throw error;
    }
    // null ⇒ the gate refused the write.
    if (!row) {
      await this.refund(id);
      throw this.deps.errors.forbidden("cannot create meteor");
    }
    return this.toView(row);
  }

  async getById(ac: ScopedAcRequestContext, visibility: Private, meteorId: string): Promise<MeteorView> {
    // Read is a pass-through: the engine resolves the read Scope, the repo
    // executes it. No row admitted ⇒ 404-shaped miss (existence + access fused).
    const scope = this.deps.engine.resolveRead(ac.permissions, "meteor", ac.bag);
    const [row] = await this.deps.meteorRepo.findByIdsScoped(visibility, [meteorId], scope, this.deps.gatedDb(ac.bag));
    if (!row) throw this.deps.errors.notFound("meteor not found");
    return this.toView(row);
  }

  async getAll(ac: ScopedAcRequestContext, visibility: Private, query: MeteorListQuery): Promise<{ rows: MeteorView[]; total: number }> {
    const scope = this.deps.engine.resolveRead(ac.permissions, "meteor", ac.bag);
    const { rows, total } = await this.deps.meteorRepo.findAll(visibility, query, scope, this.deps.gatedDb(ac.bag));
    return { rows: rows.map((row) => this.toView(row)), total };
  }

  /** Changes a meteor, draft ↔ published included. */
  async update(ac: ScopedAcRequestContext, visibility: Private, meteorId: string, patch: UpdateMeteorInput): Promise<MeteorView> {
    // Cheap in-memory column verdict first, then the scoped row write.
    const verdict = this.deps.engine.allowUpdate(ac.permissions, "meteor", patch, ac.bag);
    if (!verdict.allow) {
      throw this.deps.errors.forbidden(verdict.reason ?? "cannot update meteor");
    }
    if (await this.deps.isLocked(meteorId)) throw this.deps.errors.conflict("this meteor is locked");
    const scope = this.deps.engine.resolveUpdate(ac.permissions, "meteor", ac.bag);
    const updated = await this.deps.meteorRepo.update(visibility, meteorId, patch, scope, this.deps.gatedDb(ac.bag));
    // null ⇒ the Scope admitted no such row (denied).
    if (!updated) throw this.deps.errors.forbidden("cannot update meteor");
    return this.toView(updated);
  }

  /** Whether the caller may read, or change, one of the company's meteors: the same Scopes getById and update apply. What
   * the versioning slice asks before it shows or changes a meteor's history. */
  async canAccess(ac: ScopedAcRequestContext, visibility: Private, meteorId: string, action: "read" | "write"): Promise<boolean> {
    const gateDb = this.deps.gatedDb(ac.bag);
    if (action === "read") {
      const scope = this.deps.engine.resolveRead(ac.permissions, "meteor", ac.bag);
      return (await this.deps.meteorRepo.findByIdsScoped(visibility, [meteorId], scope, gateDb)).length > 0;
    }
    const scope = this.deps.engine.resolveUpdate(ac.permissions, "meteor", ac.bag);
    return (await this.deps.meteorRepo.findByIdsWhereCanUpdate(visibility, [meteorId], scope, gateDb)).length > 0;
  }

  async remove(ac: ScopedAcRequestContext, visibility: Private, meteorId: string): Promise<void> {
    // The engine resolves the delete Scope; the gated handle fuses it into the
    // statement. null ⇒ the Scope admitted no such row (denied).
    if (await this.deps.isLocked(meteorId)) throw this.deps.errors.conflict("this meteor is locked");
    const scope = this.deps.engine.resolveDelete(ac.permissions, "meteor", ac.bag);
    const removed = await this.deps.meteorRepo.delete(visibility, meteorId, scope, this.deps.gatedDb(ac.bag));
    if (!removed) throw this.deps.errors.forbidden("cannot remove this meteor");
    if (this.now().getTime() - removed.createdAt.getTime() < REFUND_WINDOW_MS) await this.refund(meteorId);
  }

  // ── a meteor edited live ───────────────────────────────────────────────

  /** A meteor's fields as stored, and its head: its last change's time, which every stored change moves. */
  async getLiveDocument(visibility: Private, meteorId: string): Promise<{ document: MeteorFields; head: string }> {
    const [row] = await this.deps.meteorRepo.findByIds(visibility, [meteorId]);
    if (!row) throw this.deps.errors.notFound("meteor not found");
    return { document: { name: row.name, description: row.description, diameterKm: row.diameterKm, discoveredAt: row.discoveredAt }, head: row.updatedAt.toISOString() };
  }

  /** A live meteor's checkpoint: its fields, stored on behalf of its last editor. Answers the new head. */
  async saveLiveDocument(visibility: Private, meteorId: string, fields: MeteorFields, editorId: string): Promise<string> {
    const saved = await this.deps.meteorRepo.updateUngated(visibility, meteorId, fields, this.deps.writeAs(editorId));
    if (!saved) throw this.deps.errors.notFound("meteor not found");
    return saved.updatedAt.toISOString();
  }

  /** Meteors' names, by id: how they're titled where they're listed apart from the meteors pages. */
  async getTitles(visibility: Private, meteorIds: string[]): Promise<Map<string, string>> {
    return new Map((await this.deps.meteorRepo.findByIds(visibility, meteorIds)).map((row) => [row.id, row.name]));
  }

  private toView(row: MeteorSelect): MeteorView {
    return {
      id: row.id,
      organizationId: row.organizationId,
      createdBy: row.createdBy,
      name: row.name,
      description: row.description,
      diameterKm: row.diameterKm,
      discoveredAt: row.discoveredAt,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    } satisfies MeteorView;
  }

  private toPublicView(row: MeteorSelect): PublicMeteor {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      diameterKm: row.diameterKm,
      discoveredAt: row.discoveredAt,
    } satisfies PublicMeteor;
  }
}
