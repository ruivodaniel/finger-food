import { describe, expect, it } from "vitest";
import { LIVE_STATUSES, PAYMENT_KIND_LABELS, formatDate, money, parseMoney, settledLabel, signedMoney, statusBadge } from "./format";

describe("format", () => {
  it("shows cents as money, signs a delta and dashes a missing date", () => {
    expect(money(2000, "eur", "en-IE")).toBe("€20.00");
    expect(signedMoney(500, "eur", "en-IE")).toBe("+€5.00");
    expect(signedMoney(-15, "eur", "en-IE")).toBe("−€0.15");
    expect(signedMoney(0, "eur", "en-IE")).toBe("€0.00");
    expect(formatDate(null)).toBe("—");
    expect(formatDate("2026-03-12T00:00:00.000Z", "en-GB")).toBe("12 Mar 2026");
  });

  it("reads a typed amount as cents and refuses what is not a positive amount", () => {
    expect(parseMoney("5")).toBe(500);
    expect(parseMoney("5.5")).toBe(550);
    expect(parseMoney(" 0,15 ")).toBe(15);
    expect(parseMoney("0")).toBeNull();
    expect(parseMoney("5.555")).toBeNull();
    expect(parseMoney("five")).toBeNull();
  });

  it("says what was given back on a purchase, in money, in credits or both", () => {
    const p = { amountTotal: 4900, currency: "eur" };
    expect(settledLabel({ ...p, refundedAmount: 0, creditsRefunded: 0 })).toBeNull();
    expect(settledLabel({ ...p, refundedAmount: 4900, creditsRefunded: 0 })).toBe("in full");
    expect(settledLabel({ ...p, refundedAmount: 0, creditsRefunded: 2000 })).toMatch(/^€20.00 in credits$/);
    expect(settledLabel({ ...p, refundedAmount: 900, creditsRefunded: 4000 })).toBe("in full, part in credits");
  });

  it("has a word for every kind of movement of money", () => {
    expect(PAYMENT_KIND_LABELS.bundle).toBe("Credits");
    expect(PAYMENT_KIND_LABELS.chargeback_reversal).toBe("Chargeback reversed");
  });

  it("gives every Stripe status a word and a tone, and knows which ones still hold the plan", () => {
    expect(statusBadge("active")).toEqual({ label: "active", tone: "success" });
    expect(statusBadge("past_due")).toEqual({ label: "past due", tone: "warning" });
    expect(statusBadge("canceled")).toEqual({ label: "ended", tone: "neutral" });
    expect(statusBadge(null)).toEqual({ label: "free", tone: "neutral" });
    expect(statusBadge("incomplete")).toEqual({ label: "incomplete", tone: "neutral" });
    expect(LIVE_STATUSES.has("active")).toBe(true);
    expect(LIVE_STATUSES.has("canceled")).toBe(false);
  });
});
