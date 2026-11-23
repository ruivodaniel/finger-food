/**
 * In-memory repository implementations — test doubles for docker-free unit
 * tests. They honor the repository interfaces exactly, including what the
 * real tables enforce (one account per owner; one lot per source and one
 * welcome lot per account; charge once and refund once per reference and lot;
 * one allowance per member), the spend order and the conditional updates on
 * `remaining`, because those ARE the ledger's semantics.
 */

import type { Ac } from "@libs/gated-scoped-ac";
import type { CreditAccountSelect } from "../models/credit-account.model";
import type { CreditLotSelect } from "../models/credit-lot.model";
import type { CreditLedgerSelect } from "../models/credit-ledger.model";
import type { MemberAllowanceSelect } from "../models/member-allowance.model";
import type { CreditAccountRepository } from "../repositories/credit-account.repository";
import type { CreditLotRepository, LotPage, LotRow, VendorCreditsTotals } from "../repositories/credit-lot.repository";
import type { CreditLedgerRepository, LedgerPage, LedgerRow } from "../repositories/credit-ledger.repository";
import type { AllowancePatch, AllowanceRow, MemberAllowanceRepository } from "../repositories/member-allowance.repository";
import type { CreditOwner, LedgerReason, LotReason } from "../../shared/types";
import type { Executor, RunInTransaction } from "../shared/executor";
import type { ModuleErrors, ModuleLogger } from "../shared/module-errors";
import type { People } from "../shared/owner-names";

let seq = 0;
export const nextId = (prefix = "id") => `${prefix}_${++seq}`;

/** Tests run "in a transaction" by passing a marker no fake ever reads. */
export const FAKE_TX = {} as Executor;
export const runInFakeTransaction: RunInTransaction = (run) => run(FAKE_TX);

/** Plain errors whose message names the kind — tests match on it. */
export const testErrors: ModuleErrors = {
  notFound: (m) => new Error(`not found: ${m ?? ""}`),
  badRequest: (m) => new Error(`bad request: ${m ?? ""}`),
  unauthorized: (m) => new Error(`unauthorized: ${m ?? ""}`),
  forbidden: (m) => new Error(`forbidden: ${m ?? ""}`),
  internalError: (m) => new Error(`internal: ${m ?? ""}`),
};

export const silentLogger: ModuleLogger = { info() {}, warn() {}, error() {} };

/** The ungated paths never touch the engine; the gated ones are proven on PGlite with the real one. */
export const NO_ENGINE = {
  resolveRead: () => { throw new Error("the engine is not part of this test"); },
  allowUpdate: () => { throw new Error("the engine is not part of this test"); },
  allowCreate: () => { throw new Error("the engine is not part of this test"); },
} as unknown as Pick<Ac, "resolveRead" | "allowUpdate" | "allowCreate">;

/**
 * The user-organization slice's naming services. Without a map every id
 * exists, named by itself; with one, only the ids in it do.
 */
export function fakePeople(known?: { organizations?: Record<string, string>; people?: Record<string, string> }): People {
  const lookUp = (names: Record<string, string> | undefined) => async (_visibility: unknown, ids: string[]) =>
    new Map(ids.flatMap((id): [string, string][] => (!names ? [[id, id]] : id in names ? [[id, names[id]]] : [])));
  const matching = (names: Record<string, string> = {}, search: string) =>
    Object.entries(names).filter(([, name]) => name.toLowerCase().includes(search.toLowerCase()));
  const organizations = known ? known.organizations ?? {} : undefined;
  const people = known ? known.people ?? {} : undefined;
  return {
    organization: { namesByIds: lookUp(organizations), searchByName: async (_ac, _v, search) => matching(organizations, search).map(([id, name]) => ({ id, name })) },
    userProfile: { namesByIds: lookUp(people), searchByName: async (_ac, _v, search) => matching(people, search).map(([userId, name]) => ({ userId, name })) },
  };
}

/** Reads hand back copies, as a database would: a later write never changes a row a service already holds. */
const snapshot = <T extends object>(row: T | undefined): T | null => (row ? { ...row } : null);

export class InMemoryCreditAccountRepository implements CreditAccountRepository {
  rows: CreditAccountSelect[] = [];

  private matches(row: CreditAccountSelect, owner: CreditOwner) {
    return owner.organizationId != null ? row.organizationId === owner.organizationId : row.userId === owner.userId;
  }

  async ensure(_e: Executor, id: string, owner: CreditOwner): Promise<CreditAccountSelect> {
    const found = this.rows.find((r) => this.matches(r, owner));
    if (found) return { ...found };
    const row: CreditAccountSelect = {
      id, organizationId: owner.organizationId ?? null, userId: owner.userId ?? null, priceList: null, createdAt: new Date(), updatedAt: new Date(),
    };
    this.rows.push(row);
    return { ...row };
  }
  async findByOwner(_e: Executor, owner: CreditOwner) { return snapshot(this.rows.find((r) => this.matches(r, owner))); }
  async lockForUpdate(_e: Executor, id: string) { return snapshot(this.rows.find((r) => r.id === id)); }
  async setPriceList(_e: Executor, id: string, priceList: string | null) {
    const row = this.rows.find((r) => r.id === id);
    if (row) Object.assign(row, { priceList, updatedAt: new Date() });
  }
}

const isLive = (lot: CreditLotSelect, now: Date) => lot.remaining > 0 && (lot.expiresAt == null || lot.expiresAt > now);
/** priority, then lots limited to some services, then soonest expiry (none last), then oldest */
const spendOrder = (a: CreditLotSelect, b: CreditLotSelect) =>
  a.priority - b.priority ||
  Number(a.serviceKeys == null) - Number(b.serviceKeys == null) ||
  (a.expiresAt?.getTime() ?? Infinity) - (b.expiresAt?.getTime() ?? Infinity) ||
  a.createdAt.getTime() - b.createdAt.getTime() ||
  a.id.localeCompare(b.id);

export class InMemoryCreditLotRepository implements CreditLotRepository {
  rows: CreditLotSelect[] = [];

  async insert(_e: Executor, row: LotRow): Promise<CreditLotSelect | null> {
    if (row.sourceRef != null && this.rows.some((r) => r.sourceRef === row.sourceRef)) return null;
    if (row.reason === "welcome" && this.rows.some((r) => r.accountId === row.accountId && r.reason === "welcome")) return null;
    const full: CreditLotSelect = {
      ...row, vendorOrganizationId: row.vendorOrganizationId ?? null, serviceKeys: row.serviceKeys ?? null, remaining: row.amount, expiresAt: row.expiresAt ?? null,
      sourceRef: row.sourceRef ?? null, issuedByUserId: row.issuedByUserId ?? null, note: row.note ?? null, createdAt: new Date(),
    };
    this.rows.push(full);
    return { ...full };
  }
  async findBySource(_e: Executor, sourceRef: string) { return snapshot(this.rows.find((r) => r.sourceRef === sourceRef)); }
  async spendable(_e: Executor, accountId: string, vendorOrganizationId: string | null, now: Date, service?: string) {
    return this.rows
      .filter((r) => r.accountId === accountId && r.vendorOrganizationId === vendorOrganizationId && isLive(r, now) && (service == null || r.serviceKeys == null || r.serviceKeys.includes(service)))
      .sort(spendOrder)
      .map((r) => ({ ...r }));
  }
  async expiredWithRemaining(_e: Executor, accountId: string, now: Date) {
    return this.rows.filter((r) => r.accountId === accountId && r.remaining > 0 && r.expiresAt != null && r.expiresAt <= now).map((r) => ({ ...r }));
  }
  async liveByReason(_e: Executor, accountId: string, reason: LotReason, now: Date) {
    return this.rows.filter((r) => r.accountId === accountId && r.reason === reason && isLive(r, now)).map((r) => ({ ...r }));
  }
  async take(_e: Executor, lotId: string, amount: number) {
    const row = this.rows.find((r) => r.id === lotId);
    if (!row || row.remaining < amount) return null;
    row.remaining -= amount;
    return row.remaining;
  }
  async give(_e: Executor, lotId: string, amount: number) {
    const row = this.rows.find((r) => r.id === lotId);
    if (!row || row.remaining + amount > row.amount) return null;
    row.remaining += amount;
    return row.remaining;
  }
  async balances(_e: Executor, accountId: string, now: Date) {
    const sums = new Map<string, { vendorOrganizationId: string | null; serviceKeys: string[] | null; amount: number }>();
    for (const r of this.rows) {
      if (r.accountId !== accountId || !isLive(r, now)) continue;
      const key = JSON.stringify([r.vendorOrganizationId, r.serviceKeys]);
      const sum = sums.get(key) ?? { vendorOrganizationId: r.vendorOrganizationId, serviceKeys: r.serviceKeys, amount: 0 };
      sum.amount += r.remaining;
      sums.set(key, sum);
    }
    return [...sums.values()];
  }
  async listForAccount(_e: Executor, accountId: string, page: { page: number; pageSize: number }): Promise<LotPage> {
    const all = this.rows.filter((r) => r.accountId === accountId).reverse();
    return { rows: all.slice((page.page - 1) * page.pageSize, page.page * page.pageSize).map((r) => ({ ...r })), total: all.length };
  }
  /** the accounts the holder join reads from — set by the test that needs vendor credits */
  accounts?: InMemoryCreditAccountRepository;
  async vendorCredits(_e: Executor, vendor: string, now: Date): Promise<VendorCreditsTotals> {
    const own = this.rows.filter((r) => r.vendorOrganizationId === vendor);
    const byAccount = new Map<string, CreditLotSelect[]>();
    for (const lot of own.filter((r) => isLive(r, now))) byAccount.set(lot.accountId, [...(byAccount.get(lot.accountId) ?? []), lot]);
    const holders = [...byAccount].map(([accountId, lots]) => {
      const account = this.accounts?.rows.find((a) => a.id === accountId);
      const expiries = lots.flatMap((l) => (l.expiresAt ? [l.expiresAt.getTime()] : []));
      return {
        organizationId: account?.organizationId ?? null, userId: account?.userId ?? null,
        remaining: lots.reduce((sum, l) => sum + l.remaining, 0), soonestExpiry: expiries.length ? new Date(Math.min(...expiries)) : null,
      };
    });
    return { issued: own.reduce((sum, l) => sum + l.amount, 0), holders };
  }
  async listGrants(_e: Executor, page: { page: number; pageSize: number }) {
    const all = this.rows.filter((r) => r.reason === "admin_grant").reverse().map((lot) => {
      const account = this.accounts?.rows.find((a) => a.id === lot.accountId);
      return { ...lot, ownerOrganizationId: account?.organizationId ?? null, ownerUserId: account?.userId ?? null };
    });
    return { rows: all.slice((page.page - 1) * page.pageSize, page.page * page.pageSize), total: all.length };
  }
}

export class InMemoryCreditLedgerRepository implements CreditLedgerRepository {
  rows: CreditLedgerSelect[] = [];
  /** the lots the join reads the lot's reason from */
  private readonly lots: InMemoryCreditLotRepository;

  constructor(lots: InMemoryCreditLotRepository) {
    this.lots = lots;
  }

  async append(_e: Executor, row: LedgerRow): Promise<CreditLedgerSelect | null> {
    if (row.ref != null && this.rows.some((r) => r.ref === row.ref && r.reason === row.reason && r.lotId === row.lotId)) return null;
    const full: CreditLedgerSelect = {
      ...row, serviceKey: row.serviceKey ?? null, userId: row.userId ?? null, ref: row.ref ?? null, sourceEventId: row.sourceEventId ?? null, createdAt: new Date(),
    };
    this.rows.push(full);
    return full;
  }
  async listForAccount(_e: Executor, accountId: string, page: { page: number; pageSize: number }): Promise<LedgerPage> {
    const all = this.rows.filter((r) => r.accountId === accountId).reverse();
    const withLot = all.map((r) => ({ ...r, lotReason: this.lots.rows.find((l) => l.id === r.lotId)!.reason }));
    return { rows: withLot.slice((page.page - 1) * page.pageSize, page.page * page.pageSize), total: all.length };
  }
  async findByRef(_e: Executor, ref: string, reason: LedgerReason) { return this.rows.filter((r) => r.ref === ref && r.reason === reason); }
  async spentByMemberSince(_e: Executor, accountId: string, userId: string, since: Date) {
    const net = this.rows
      .filter((r) => r.accountId === accountId && r.userId === userId && (r.reason === "charge" || r.reason === "refund") && r.serviceKey != null && r.createdAt >= since)
      .reduce((a, r) => a + r.delta, 0);
    return 0 - net; // never -0
  }
}

export class InMemoryMemberAllowanceRepository implements MemberAllowanceRepository {
  rows: MemberAllowanceSelect[] = [];

  async findByMember(_e: Executor, accountId: string, userId: string) {
    return snapshot(this.rows.find((r) => r.accountId === accountId && r.userId === userId));
  }
  async findDefault(_e: Executor, accountId: string) { return snapshot(this.rows.find((r) => r.accountId === accountId && r.userId == null)); }
  async listForAccount(_e: Executor, accountId: string) { return this.rows.filter((r) => r.accountId === accountId).map((r) => ({ ...r })); }
  async insert(_e: Executor, row: AllowanceRow) {
    if (this.rows.some((r) => r.accountId === row.accountId && r.userId === row.userId)) throw new Error("member_allowance unique violation");
    const full: MemberAllowanceSelect = { ...row, createdAt: new Date(), updatedAt: new Date() };
    this.rows.push(full);
    return { ...full };
  }
  async patch(_e: Executor, id: string, patch: AllowancePatch) {
    const row = this.rows.find((r) => r.id === id)!;
    Object.assign(row, patch, { updatedAt: new Date() });
    return { ...row };
  }
  async remove(_e: Executor, id: string) {
    const before = this.rows.length;
    this.rows = this.rows.filter((r) => r.id !== id);
    return this.rows.length < before;
  }
  async removeInherited(_e: Executor, accountId: string) {
    this.rows = this.rows.filter((r) => !(r.accountId === accountId && r.inherited));
  }
}
