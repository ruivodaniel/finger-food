/**
 * Display helpers — the words and shapes the credits screens put on screen.
 * Credits are shown as plain credits, never as money; dates arrive as ISO
 * strings.
 */

import type { AllocationPeriod, LedgerReason, LotReason, UnspentMode } from "../../../shared/types";

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "error";

/** 2000 → `2,000 credits` in the viewer's locale; 1 → `1 credit`. */
export function credits(amount: number, locale?: string): string {
  return `${new Intl.NumberFormat(locale).format(amount)} ${amount === 1 ? "credit" : "credits"}`;
}

/** A ledger delta reads with its sign: `+500`, `−15`. */
export function signedCredits(amount: number, locale?: string): string {
  const number = new Intl.NumberFormat(locale).format(Math.abs(amount));
  return amount === 0 ? number : `${amount > 0 ? "+" : "−"}${number}`;
}

/** What the person typed (`5`, `1,000`, `1 000`) → a whole number of credits; null when it is not a positive one. */
export function parseCredits(input: string): number | null {
  const normalized = input.trim().replace(/[,\s]/g, "");
  if (!/^\d+$/.test(normalized)) return null;
  const amount = Number(normalized);
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
}

/** `2026-03-12T00:00:00.000Z` → `12 Mar 2026` in the viewer's locale; null → an em dash. */
export function formatDate(iso: string | null | undefined, locale?: string): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(iso));
}

export const PERIOD_LABELS: Record<AllocationPeriod, string> = { day: "per day", week: "per week", month: "per month" };
export const UNSPENT_LABELS: Record<UnspentMode, string> = { top_up: "adds up", replace: "resets" };

/** A list of services in words: null is everything. */
export function servicesLabel(services: string[] | null, nameOf: (key: string) => string): string {
  return services ? services.map(nameOf).join(", ") : "everything";
}

/** What a lot is called on screen, by what issued it. */
export const LOT_LABELS: Record<LotReason, string> = {
  plan: "Plan credits",
  top_up: "Bundle",
  welcome: "Welcome credits",
  admin_grant: "Grant from the platform",
  allocation: "Member allocation",
  vendor_refund: "Credit refund",
  promotion: "Promotion",
};

/** The kind badge of a lot: gifts, the plan, bought credits, a vendor's. */
export function lotKind(reason: LotReason): { label: string; tone: BadgeTone } {
  switch (reason) {
    case "welcome":
    case "admin_grant":
    case "allocation":
      return { label: "gift", tone: "success" };
    case "plan":
      return { label: "plan", tone: "info" };
    case "top_up":
      return { label: "top-up", tone: "neutral" };
    default:
      return { label: "vendor", tone: "warning" };
  }
}

export const LEDGER_REASON_LABELS: Record<LedgerReason, string> = {
  grant: "granted",
  charge: "charge",
  refund: "refund",
  expire: "expired",
  take_back: "taken back",
};
