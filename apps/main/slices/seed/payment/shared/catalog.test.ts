import { describe, expect, it } from "vitest";
import { definePaymentCatalog, platformFeeFor, priceEnvName, validatePaymentCatalog, type PaymentCatalog } from "./catalog";

const sound: PaymentCatalog = {
  plans: [
    { key: "starter", name: "Starter", credits: 2000 },
    { key: "pro", name: "Pro", credits: 6000 },
  ],
  bundles: [{ key: "small", name: "Small bundle", credits: 1000 }],
  marketplace: { platformFeePercent: 10, sellerOrgTypes: ["company"], sellerCountry: "pt", currencies: ["eur"] },
  vendorCredits: { refundExpiresInDays: 180 },
};

describe("definePaymentCatalog", () => {
  it("accepts a sound catalog and returns it", () => {
    expect(definePaymentCatalog(sound)).toBe(sound);
  });

  it("refuses a key used by a plan and a bundle", () => {
    const c = { ...sound, bundles: [{ key: "starter", name: "Clash", credits: 10 }] };
    expect(validatePaymentCatalog(c)).toContain('key "starter" is used twice');
  });

  it("lets a plan grant no credits, but refuses negative credits and a missing bundle", () => {
    expect(validatePaymentCatalog({ ...sound, plans: [{ key: "seats", name: "Seats", credits: 0 }] })).toEqual([]);
    const c = { ...sound, plans: [{ key: "free", name: "Free", credits: -1 }], bundles: [] };
    const problems = validatePaymentCatalog(c);
    expect(problems).toContain('plan "free" credits must be a non-negative integer');
    expect(problems).toContain("at least one bundle is required");
  });

  it("refuses a fee outside 0–100 and currencies that are not ISO codes", () => {
    const c = { ...sound, marketplace: { platformFeePercent: 120, sellerOrgTypes: ["company"], sellerCountry: "PRT", currencies: ["EURO"] } };
    const problems = validatePaymentCatalog(c);
    expect(problems).toContain("marketplace.platformFeePercent must be between 0 and 100");
    expect(problems).toContain('seller country "PRT" must be a lower-case ISO-3166 alpha-2 code');
    expect(problems).toContain('currency "EURO" must be a lower-case ISO-4217 code');
  });

  it("throws with every problem at once", () => {
    expect(() => definePaymentCatalog({ ...sound, bundles: [], vendorCredits: { refundExpiresInDays: 0 } })).toThrow(
      /at least one bundle.*refundExpiresInDays/,
    );
  });
});

describe("helpers", () => {
  it("names the env var of a key and rounds the fee to the nearest unit", () => {
    expect(priceEnvName("starter")).toBe("STRIPE_PRICE_STARTER");
    expect(platformFeeFor(4900, 10)).toBe(490);
    expect(platformFeeFor(1234, 12.5)).toBe(154);
  });
});
