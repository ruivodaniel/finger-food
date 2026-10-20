import { describe, it, expect } from "vitest";
import { validateAuthConfig, validateOrgLifecycle } from "./validate";
import { fixtureAuthConfig } from "./__fixtures__/auth.fixture.config";
import type {
  AuthAndRegistrationConfig,
  OrgLifecycleEntry,
  Rule,
  FactorOutcome,
} from "./types";

const withFactors = (
  factors: Rule<FactorOutcome>[],
): AuthAndRegistrationConfig => ({
  ...fixtureAuthConfig,
  factors,
});

describe("validateAuthConfig", () => {
  it("accepts the fixture config", () => {
    expect(() => validateAuthConfig(fixtureAuthConfig)).not.toThrow();
  });

  it("rejects deviceOtp — catalogued but not supported by the runtime", () => {
    const config = withFactors([
      {
        condition: { when: [{ intent: "authentication", identifier: "phone" }] },
        outcome: {
          require: "factor_session_verified",
          factor: { method: "deviceOtp" },
        },
      },
    ]);
    expect(() => validateAuthConfig(config)).toThrow(/deviceOtp/);
  });

  it("rejects an authentication factor with canBeUsedToAuth=false", () => {
    const config = withFactors([
      {
        condition: { when: [{ intent: "authentication", identifier: "email" }] },
        outcome: {
          require: "factor_session_verified",
          factor: { method: "totp" }, // totp: canBeUsedToAuth=false
        },
      },
    ]);
    expect(() => validateAuthConfig(config)).toThrow(/canBeUsedToAuth/);
  });

  it("rejects an otp factor without deliveredVia", () => {
    const config = withFactors([
      {
        condition: { when: [{ intent: "authentication", identifier: "email" }] },
        outcome: {
          require: "factor_session_verified",
          factor: { method: "otp" },
        },
      },
    ]);
    expect(() => validateAuthConfig(config)).toThrow(/deliveredVia/);
  });

  it("rejects otp delivered via an identifier with allowOtp=false", () => {
    const config = withFactors([
      {
        condition: { when: [{ intent: "authentication", identifier: "email" }] },
        outcome: {
          require: "factor_session_verified",
          factor: { method: "otp", deliveredVia: "google" },
        },
      },
    ]);
    expect(() => validateAuthConfig(config)).toThrow(/allowOtp=false/);
  });

  it("rejects a password factor below the provider's floor (or without a policy)", () => {
    const below = withFactors([
      {
        condition: { when: [{ intent: "registration", identifier: "email" }] },
        outcome: {
          require: "factor_session_verified",
          factor: { method: "password", config: { minLength: 6 } },
        },
      },
    ]);
    expect(() => validateAuthConfig(below)).toThrow(/minLength/);

    const bare = withFactors([
      {
        condition: { when: [{ intent: "registration", identifier: "email" }] },
        outcome: {
          require: "factor_session_verified",
          factor: { method: "password" },
        },
      },
    ]);
    expect(() => validateAuthConfig(bare)).toThrow(/minLength/);
  });

  it("rejects a registrable identifier that has no way to be born", () => {
    // Every catalogued identifier today is code-deliverable (email, phone)
    // or delegated (google, apple), so this guards the catalog's future: a
    // `username`-style identifier can't register — the cast simulates one.
    const config = {
      ...fixtureAuthConfig,
      identifiers: {
        ...fixtureAuthConfig.identifiers,
        username: {},
      },
    } as unknown as AuthAndRegistrationConfig;
    expect(() => validateAuthConfig(config)).toThrow(/no way to be born/);
  });

  it("accepts a code-incapable identifier scoped away from registration", () => {
    const config = {
      ...fixtureAuthConfig,
      identifiers: {
        ...fixtureAuthConfig.identifiers,
        username: { condition: { when: [{ intent: "authentication" }] } },
      },
    } as unknown as AuthAndRegistrationConfig;
    expect(() => validateAuthConfig(config)).not.toThrow();
  });
});

describe("validateOrgLifecycle", () => {
  const base: OrgLifecycleEntry = {
    orgType: "company",
    label: "Company",
    isSingleInstance: false,
    creation: {
      actor: "user",
      ownership: { mode: ["creator"], membershipOwnerRole: "company_owner" },
    },
    join: {
      invitation: { allow: true, strictEmailMatch: false, strictPhoneMatch: false },
      spontaneous: { allow: false },
    },
  };

  it("accepts a well-formed entry", () => {
    expect(() => validateOrgLifecycle([base])).not.toThrow();
  });

  it("rejects duplicate orgType entries", () => {
    expect(() => validateOrgLifecycle([base, base])).toThrow(/duplicate/);
  });

  it("rejects a user-creatable org type without ownership", () => {
    const entry: OrgLifecycleEntry = {
      ...base,
      creation: { actor: "user" },
    };
    expect(() => validateOrgLifecycle([entry])).toThrow(/ownership/);
  });

  it("rejects an ownership block with an empty mode list", () => {
    const entry: OrgLifecycleEntry = {
      ...base,
      creation: {
        actor: "user",
        ownership: { mode: [], membershipOwnerRole: "company_owner" },
      },
    };
    expect(() => validateOrgLifecycle([entry])).toThrow(/empty mode/);
  });

  it("accepts a positive invitation expiresInSeconds", () => {
    const entry: OrgLifecycleEntry = {
      ...base,
      join: {
        invitation: {
          allow: true,
          strictEmailMatch: false,
          strictPhoneMatch: false,
          expiresInSeconds: 3600,
        },
        spontaneous: { allow: false },
      },
    };
    expect(() => validateOrgLifecycle([entry])).not.toThrow();
  });

  it("rejects a non-positive invitation expiresInSeconds", () => {
    for (const expiresInSeconds of [0, -3600, Number.NaN]) {
      const entry: OrgLifecycleEntry = {
        ...base,
        join: {
          invitation: {
            allow: true,
            strictEmailMatch: false,
            strictPhoneMatch: false,
            expiresInSeconds,
          },
          spontaneous: { allow: false },
        },
      };
      expect(() => validateOrgLifecycle([entry])).toThrow(/expiresInSeconds/);
    }
  });
});
