// In-memory doubles for docker-free unit tests. Scope + gated handle are inert
// here (no runnable SQL): the test engine allows, and the repo answers by the
// rows it holds — the service's logic is what is under test.

import type { Ac, GatedDb, Private, Public, Scope, SchemaTables, ScopedAcBag, ScopedAcRequestContext } from "@libs/gated-scoped-ac";
import type { MeteorSelect } from "../models/meteor.model";
import type { MeteorListQuery } from "../models/meteor.schemas";
import type { CreateMeteorRecord, MeteorPatch, MeteorRepository } from "../repositories/meteor.repository";
import type { ModuleErrors, ModuleLogger } from "../shared/module-errors";

export class InMemoryMeteorRepository implements MeteorRepository {
  rows: MeteorSelect[] = [];
  /** What the (inert) scopes admit: every row, unless a test narrows it. */
  admits: (row: MeteorSelect) => boolean = () => true;
  /** The clock rows are stamped with; a test moves it. */
  now: () => Date = () => new Date();

  async findPublishedByIds(_v: Public, ids: string[]) {
    return this.rows.filter((r) => ids.includes(r.id) && r.status === "published");
  }
  async findAllPublished(_v: Public, query: MeteorListQuery) {
    return this.page(this.rows.filter((r) => r.status === "published"), query);
  }
  async create(_v: Private, input: CreateMeteorRecord, _p: Iterable<string>, _g: GatedDb<SchemaTables>): Promise<MeteorSelect | null> {
    const now = this.now();
    const row: MeteorSelect = {
      id: input.id,
      organizationId: input.organizationId,
      createdBy: input.createdBy,
      name: input.name,
      description: input.description ?? null,
      diameterKm: input.diameterKm ?? null,
      discoveredAt: input.discoveredAt ?? null,
      status: input.status,
      createdAt: now,
      updatedAt: now,
    };
    this.rows.push(row);
    return row;
  }
  async findByIds(_v: Private, ids: string[]) {
    return this.rows.filter((r) => ids.includes(r.id));
  }
  async updateUngated(_v: Private, id: string, patch: MeteorPatch, _db: unknown) {
    const row = this.rows.find((r) => r.id === id);
    if (!row) return null;
    Object.assign(row, Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)), { updatedAt: new Date() });
    return row;
  }
  async findByIdsScoped(_v: Private, ids: string[], _s: Scope<"meteor", "read">, _g: GatedDb<SchemaTables>) {
    return this.rows.filter((r) => ids.includes(r.id) && this.admits(r));
  }
  async findAll(_v: Private, query: MeteorListQuery, _s: Scope<"meteor", "read">, _g: GatedDb<SchemaTables>) {
    return this.page(this.rows.filter((r) => this.admits(r)), query);
  }
  async findByIdsWhereCanUpdate(_v: Private, ids: string[], _s: Scope<"meteor", "update">, _g: GatedDb<SchemaTables>) {
    return this.rows.filter((r) => ids.includes(r.id) && this.admits(r));
  }
  async update(_v: Private, id: string, patch: MeteorPatch, _s: Scope<"meteor", "update">, _g: GatedDb<SchemaTables>) {
    const row = this.rows.find((r) => r.id === id);
    if (!row || !this.admits(row)) return null;
    Object.assign(row, Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)), { updatedAt: new Date() });
    return row;
  }
  async delete(_v: Private, id: string, _s: Scope<"meteor", "delete">, _g: GatedDb<SchemaTables>) {
    const i = this.rows.findIndex((r) => r.id === id);
    if (i < 0 || !this.admits(this.rows[i]!)) return null;
    return this.rows.splice(i, 1)[0]!;
  }
  private page(all: MeteorSelect[], query: MeteorListQuery) {
    const q = query.search?.toLowerCase();
    const hits = all.filter((r) => !q || r.name.toLowerCase().includes(q)).sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
    const start = (query.page - 1) * query.pageSize;
    return { rows: hits.slice(start, start + query.pageSize), total: hits.length };
  }
}

export const testEngine = {
  resolveRead: () => ({}) as never,
  resolveUpdate: () => ({}) as never,
  resolveDelete: () => ({}) as never,
  allowUpdate: () => ({ allow: true as const }),
  allowCreate: () => ({ allow: true as const }),
} as unknown as Ac;

/** A bag-bound handle, inert: the in-memory repo never touches it. */
export const testGatedDb = (_bag: unknown) => ({}) as unknown as GatedDb<SchemaTables>;

export function testAc(userId: string, org: { id: string; type: string } | null = null): ScopedAcRequestContext {
  const bag: ScopedAcBag = { session: { user: { id: userId }, organization: org } };
  return { bag, roles: [], permissions: [], gateDb: {} as unknown as GatedDb<SchemaTables> };
}

class TestError extends Error {
  constructor(public readonly kind: keyof ModuleErrors, message?: string) {
    super(message ?? kind);
  }
}
export const testErrors: ModuleErrors = {
  notFound: (m) => new TestError("notFound", m),
  badRequest: (m) => new TestError("badRequest", m),
  unauthorized: (m) => new TestError("unauthorized", m),
  forbidden: (m) => new TestError("forbidden", m),
  conflict: (m) => new TestError("conflict", m),
  internalError: (m) => new TestError("internalError", m),
  paymentRequired: (m) => new TestError("paymentRequired", m),
};
export const testLogger: ModuleLogger = { info: () => {}, warn: () => {}, error: () => {} };
