import { describe, expect, it } from "vitest";
import { LEDGER_REASON_LABELS, credits, formatDate, lotKind, parseCredits, servicesLabel, signedCredits } from "./format";

describe("format", () => {
  it("shows plain credits, signs a delta and dashes a missing date", () => {
    expect(credits(2000, "en-IE")).toBe("2,000 credits");
    expect(credits(1, "en-IE")).toBe("1 credit");
    expect(signedCredits(500, "en-IE")).toBe("+500");
    expect(signedCredits(-15, "en-IE")).toBe("−15");
    expect(signedCredits(0, "en-IE")).toBe("0");
    expect(formatDate(null)).toBe("—");
    expect(formatDate("2026-03-12T00:00:00.000Z", "en-GB")).toBe("12 Mar 2026");
  });

  it("reads a typed amount as whole credits and refuses anything else", () => {
    expect(parseCredits("5")).toBe(5);
    expect(parseCredits(" 1,000 ")).toBe(1000);
    expect(parseCredits("1 000")).toBe(1000);
    expect(parseCredits("0")).toBeNull();
    expect(parseCredits("5.5")).toBeNull();
    expect(parseCredits("five")).toBeNull();
  });

  it("names a list of services, or everything", () => {
    expect(servicesLabel(null, (k) => k)).toBe("everything");
    expect(servicesLabel(["chat", "meteor"], (k) => k.toUpperCase())).toBe("CHAT, METEOR");
  });

  it("names a lot's kind by what issued it", () => {
    expect(lotKind("admin_grant")).toEqual({ label: "gift", tone: "success" });
    expect(lotKind("allocation")).toEqual({ label: "gift", tone: "success" });
    expect(lotKind("plan")).toEqual({ label: "plan", tone: "info" });
    expect(lotKind("vendor_refund")).toEqual({ label: "vendor", tone: "warning" });
  });

  it("has a word for credits taken back after a refund", () => {
    expect(LEDGER_REASON_LABELS.take_back).toBe("taken back");
  });
});
