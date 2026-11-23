/**
 * A credits ledger in memory, behind the port this slice declares — so the
 * billing and marketplace tests prove what this slice asks for, without the
 * slice that answers it. It keeps the promises the port makes: one lot per
 * source, a charge at a vendor is all or nothing, a take-back never goes below
 * zero. The real ledger is proven in its own slice and on PGlite.
 */

import type { CreditGrantRequest, CreditsPort, VendorCreditsIssued } from "../shared/credits-port";
import type { PaymentOwner } from "../../shared/types";
import type { Executor } from "../shared/executor";

export interface FakeLot extends CreditGrantRequest {
  id: string;
  remaining: number;
}

export interface FakeMove {
  lot: FakeLot;
  reason: "grant" | "charge" | "expire" | "take_back";
  delta: number;
  purchaseId?: string;
  userId?: string;
  sourceEventId?: string;
}

const sameOwner = (a: PaymentOwner, b: PaymentOwner) => (a.organizationId != null ? a.organizationId === b.organizationId : a.userId === b.userId);

export class FakeCredits implements CreditsPort {
  readonly currency = "eur";
  lots: FakeLot[] = [];
  moves: FakeMove[] = [];
  /** owner id → the price list it pays by; absent is none assigned */
  priceLists = new Map<string, string | null>();
  /** a list of the plans to know; every key is known without it */
  knownLists?: string[];
  private seq = 0;

  private isLive(lot: FakeLot, now: Date) {
    return lot.remaining > 0 && (lot.expiresAt == null || lot.expiresAt > now);
  }

  hasPriceList(key: string) {
    return this.knownLists ? this.knownLists.includes(key) : true;
  }
  async setPriceList(_tx: Executor, owner: PaymentOwner, key: string | null) {
    this.priceLists.set(owner.organizationId ?? owner.userId, key);
  }
  async grant(_tx: Executor, input: CreditGrantRequest) {
    if (input.sourceRef != null && this.lots.some((l) => l.sourceRef === input.sourceRef)) return null;
    const lot: FakeLot = { ...input, id: `lot_${++this.seq}`, remaining: input.amount };
    if (input.amount <= 0) return null;
    this.lots.push(lot);
    this.moves.push({ lot, reason: "grant", delta: input.amount, sourceEventId: input.sourceEventId ?? undefined });
    return { id: lot.id };
  }
  async endLots(_tx: Executor, owner: PaymentOwner, reason: "plan", meta: { sourceEventId?: string } = {}) {
    for (const lot of this.lots.filter((l) => sameOwner(l.owner, owner) && l.reason === reason && l.remaining > 0)) {
      this.moves.push({ lot, reason: "expire", delta: -lot.remaining, sourceEventId: meta.sourceEventId });
      lot.remaining = 0;
    }
  }
  async takeBack(_tx: Executor, owner: PaymentOwner, input: { sourceRef: string; upTo: number; sourceEventId: string }) {
    const lot = this.lots.find((l) => l.sourceRef === input.sourceRef && sameOwner(l.owner, owner));
    const part = lot ? Math.min(lot.remaining, input.upTo) : 0;
    if (!lot || part <= 0) return 0;
    lot.remaining -= part;
    this.moves.push({ lot, reason: "take_back", delta: -part, sourceEventId: input.sourceEventId });
    return part;
  }
  async chargeVendor(_tx: Executor, input: { owner: PaymentOwner; vendorOrganizationId: string; amount: number; purchaseId: string; userId: string }) {
    const lots = this.lots.filter((l) => sameOwner(l.owner, input.owner) && l.vendorOrganizationId === input.vendorOrganizationId && l.remaining > 0);
    const balance = lots.reduce((sum, l) => sum + l.remaining, 0);
    if (input.amount > balance) return { ok: false as const, balance };
    let left = input.amount;
    for (const lot of lots) {
      if (left === 0) break;
      const part = Math.min(lot.remaining, left);
      lot.remaining -= part;
      left -= part;
      this.moves.push({ lot, reason: "charge", delta: -part, purchaseId: input.purchaseId, userId: input.userId });
    }
    return { ok: true as const };
  }
  async issuedBy(_e: Executor, vendor: string): Promise<VendorCreditsIssued> {
    const own = this.lots.filter((l) => l.vendorOrganizationId === vendor);
    const holders = new Map<string, FakeLot[]>();
    for (const lot of own.filter((l) => l.remaining > 0)) {
      const key = lot.owner.organizationId ?? lot.owner.userId;
      holders.set(key, [...(holders.get(key) ?? []), lot]);
    }
    return {
      issued: own.reduce((sum, l) => sum + l.amount, 0),
      holders: [...holders.values()].map((lots) => {
        const expiries = lots.flatMap((l) => (l.expiresAt ? [l.expiresAt.getTime()] : []));
        return {
          organizationId: lots[0].owner.organizationId ?? null, userId: lots[0].owner.userId ?? null,
          remaining: lots.reduce((sum, l) => sum + l.remaining, 0), soonestExpiry: expiries.length ? new Date(Math.min(...expiries)) : null,
        };
      }),
    };
  }

  /** What remains in an owner's unexpired platform lots at `now`. */
  balance(owner: PaymentOwner, now: Date) {
    return this.lots.filter((l) => sameOwner(l.owner, owner) && l.vendorOrganizationId == null && this.isLive(l, now)).reduce((sum, l) => sum + l.remaining, 0);
  }
  /** A spend, as the metering side would draw it. */
  spend(lotId: string, amount: number) {
    const lot = this.lots.find((l) => l.id === lotId)!;
    lot.remaining -= amount;
    this.moves.push({ lot, reason: "charge", delta: -amount });
  }
}
