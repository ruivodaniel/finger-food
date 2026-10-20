import { describe, expect, it } from "vitest";
import { pickSafeLogFields } from "./index";

describe("pickSafeLogFields", () => {
  it("keeps only the documented safe worker log fields", () => {
    expect(
      pickSafeLogFields({
        intentId: "intent_123",
        kind: "smoke.run",
        attemptCount: 2,
        errorCode: "dispatch_visibility_timeout",
        phoneNumber: "+15555555555",
        medicationLabel: "Atorvastatin",
        providerPayload: { message: "unsafe" },
      })
    ).toEqual({
      intentId: "intent_123",
      kind: "smoke.run",
      attemptCount: 2,
      errorCode: "dispatch_visibility_timeout",
    });
  });

  it("drops nested values even when the key is otherwise safe", () => {
    expect(
      pickSafeLogFields({
        intentId: { nested: "unsafe" },
        claimedBy: "worker-a",
      })
    ).toEqual({
      claimedBy: "worker-a",
    });
  });
});
