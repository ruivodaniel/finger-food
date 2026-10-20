import { describe, it, expect } from "vitest";
import { describeObligation, summarizeObligations } from "./obligations";

describe("obligation descriptions", () => {
  it("labels a TOTP obligation", () => {
    const hint = describeObligation({
      require: "factor_session_verified",
      factorMethod: "totp",
    });
    expect(hint.label).toBe("Verify with two-factor authentication");
  });

  it("labels a verify-email obligation", () => {
    const hint = describeObligation({
      require: "identifier_verified",
      identityTypes: ["email"],
    });
    expect(hint.label).toContain("Verify your email");
  });

  it("names a profile-data field", () => {
    const hint = describeObligation({
      require: "profile_data_provided",
      dataField: "age",
    });
    expect(hint.label).toContain("age");
  });

  it("summarizes one obligation as an actionable sentence", () => {
    expect(
      summarizeObligations([
        { require: "factor_session_verified", factorMethod: "totp" },
      ]),
    ).toBe("Verify with two-factor authentication to continue.");
  });

  it("summarizes several obligations", () => {
    const msg = summarizeObligations([
      { require: "factor_session_verified", factorMethod: "totp" },
      { require: "legal_consent_granted" },
    ]);
    expect(msg).toContain("Verify with two-factor authentication");
    expect(msg).toContain("Accept the latest terms");
  });
});
