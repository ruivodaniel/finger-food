// =============================================================================
// UserPreferencesService — the injected policy decides what may change and
// what the effective view is. AC is out of the way (`testEngine`); own-row
// enforcement is proven over HTTP in the API's integration tests.
// =============================================================================

import { describe, expect, it } from "vitest";
import { UserPreferencesService } from "./user-preferences.service";
import {
  InMemoryUserPreferencesRepository,
  testAc,
  testEngine,
  testErrors,
} from "../testing/in-memory-repos";
import type { PreferencesPolicy } from "../../shared/types/preferences";

/** A product where locale is a short list without system-follow, timezone
 * follows the system by default, currency is overridable and country isn't. */
const policy: PreferencesPolicy = {
  locale: { default: "en", userOverridable: true, allowSystemBinding: false, supported: ["en", "pt"] },
  timezone: { default: "UTC", userOverridable: true, allowSystemBinding: true, supported: "all" },
  currency: { default: "EUR", userOverridable: true, allowSystemBinding: false, supported: ["EUR", "GBP"] },
  country: { default: "PT", userOverridable: false, allowSystemBinding: false, supported: "all" },
};

function makeService(p: PreferencesPolicy = policy) {
  const repo = new InMemoryUserPreferencesRepository();
  const service = new UserPreferencesService({
    userPreferencesRepo: repo,
    engine: testEngine,
    policy: p,
    errors: testErrors,
  });
  return { repo, service };
}

const ac = testAc("u1");

describe("UserPreferencesService", () => {
  it("answers the policy's default binding before any choice", async () => {
    const { service } = makeService();
    expect(await service.getOwn(ac, "u1")).toEqual({
      locale: { source: "explicit", value: "en" }, // no system binding offered
      timezone: { source: "system", value: null },
      currency: "EUR",
      country: "PT",
    });
  });

  it("stores the first save as a new row, later saves update it", async () => {
    const { repo, service } = makeService();
    await service.updateOwn(ac, "u1", { locale: { source: "explicit", value: "pt" } });
    const view = await service.updateOwn(ac, "u1", { currency: "GBP" });
    expect(view).toMatchObject({ locale: { source: "explicit", value: "pt" }, currency: "GBP" });
    expect(repo.rows.size).toBe(1);
    // null clears an override back to the default
    expect((await service.updateOwn(ac, "u1", { currency: null })).currency).toBe("EUR");
  });

  it("refuses what the policy doesn't allow", async () => {
    const { repo, service } = makeService();
    await expect(
      service.updateOwn(ac, "u1", { locale: { source: "system" } }),
    ).rejects.toThrow("400:locale can't follow the system");
    await expect(
      service.updateOwn(ac, "u1", { locale: { source: "explicit", value: "es" } }),
    ).rejects.toThrow('400:locale "es" isn\'t supported');
    await expect(
      service.updateOwn(ac, "u1", { timezone: { source: "explicit", value: "Mars/Base" } }),
    ).rejects.toThrow("400:");
    await expect(service.updateOwn(ac, "u1", { country: "ES" })).rejects.toThrow(
      "400:country is set by the product",
    );
    expect(repo.rows.size).toBe(0); // nothing was written
  });

  it("reads stored choices through the CURRENT policy", async () => {
    const { repo, service } = makeService();
    await service.updateOwn(ac, "u1", {
      locale: { source: "explicit", value: "pt" },
      timezone: { source: "system" },
      currency: "GBP",
    });
    // The product later narrows: pt dropped, no system timezone, currency locked.
    const narrowed = new UserPreferencesService({
      userPreferencesRepo: repo,
      engine: testEngine,
      errors: testErrors,
      policy: {
        ...policy,
        locale: { ...policy.locale, supported: ["en"] },
        timezone: { ...policy.timezone, allowSystemBinding: false },
        currency: { ...policy.currency, userOverridable: false },
      },
    });
    expect(await narrowed.getOwn(ac, "u1")).toEqual({
      locale: { source: "explicit", value: "en" },
      timezone: { source: "explicit", value: "UTC" },
      currency: "EUR",
      country: "PT",
    });
  });
});
