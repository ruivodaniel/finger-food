/**
 * Display helpers — the words and shapes the billing pages put on screen.
 * Amounts are minor units of a currency and are always shown as money; dates
 * arrive as ISO strings; a subscription status is Stripe's word and gets a
 * badge here.
 */

import type { PaymentKind, PurchaseView, RefundPolicy } from "../../shared/types";

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "error";

/** 2000 cents of eur → `€20.00` in the viewer's locale. */
export function money(cents: number, currency: string, locale?: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

/** Credits are never shown as money: 2000 → `2,000 credits`. */
export function plainCredits(amount: number, locale?: string): string {
  return `${new Intl.NumberFormat(locale).format(amount)} ${amount === 1 ? "credit" : "credits"}`;
}

/** A movement reads with its sign: `+€20.00`, `−€0.15`. */
export function signedMoney(cents: number, currency: string, locale?: string): string {
  if (cents === 0) return money(0, currency, locale);
  return `${cents > 0 ? "+" : "−"}${money(Math.abs(cents), currency, locale)}`;
}

/** What the person typed in the currency's units (`5`, `5.00`, `5,5`) → cents; null when it is not a positive amount. */
export function parseMoney(input: string): number | null {
  const normalized = input.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const cents = Math.round(Number(normalized) * 100);
  return cents > 0 ? cents : null;
}

/** `2026-03-12T00:00:00.000Z` → `12 Mar 2026` in the viewer's locale; null → an em dash. */
export function formatDate(iso: string | null | undefined, locale?: string): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(iso));
}

/** What a line of the payments list is called. */
export const PAYMENT_KIND_LABELS: Record<PaymentKind, string> = {
  subscription: "Subscription",
  bundle: "Credits",
  purchase: "Purchase",
  invoice: "Invoice",
  refund: "Refund",
  chargeback: "Chargeback",
  chargeback_reversal: "Chargeback reversed",
};

/** How a vendor may settle a purchase of a product, in a few words. */
export const REFUND_POLICY_LABELS: Record<RefundPolicy, string> = {
  money: "money back",
  credits: "vendor credits",
  either: "money or credits",
};

/** What was given back on a purchase, or null when nothing was: "in full", "€20.00", "€20.00 in credits". */
export function settledLabel(p: Pick<PurchaseView, "amountTotal" | "refundedAmount" | "creditsRefunded" | "currency">): string | null {
  const settled = p.refundedAmount + p.creditsRefunded;
  if (settled === 0) return null;
  const amount = settled >= p.amountTotal ? "in full" : money(settled, p.currency);
  if (p.creditsRefunded === 0) return amount;
  return p.refundedAmount === 0 ? `${amount} in credits` : `${amount}, part in credits`;
}

/** Stripe's subscription status → the word and the tone the plan card shows. */
export function statusBadge(status: string | null): { label: string; tone: BadgeTone } {
  switch (status) {
    case "active":
      return { label: "active", tone: "success" };
    case "trialing":
      return { label: "trial", tone: "info" };
    case "past_due":
    case "unpaid":
      return { label: "past due", tone: "warning" };
    case "paused":
      return { label: "paused", tone: "warning" };
    case "canceled":
    case "incomplete_expired":
      return { label: "ended", tone: "neutral" };
    case null:
      return { label: "free", tone: "neutral" };
    default:
      return { label: status.replace(/_/g, " "), tone: "neutral" };
  }
}

/** The plan is the owner's standing: the portal, not a new checkout, changes it. */
export const LIVE_STATUSES: ReadonlySet<string> = new Set(["trialing", "active", "past_due", "unpaid", "paused"]);
