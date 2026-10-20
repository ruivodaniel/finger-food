// =============================================================================
// UNIT TESTS: Types and getReasonKey
// =============================================================================

import { describe, it, expect } from "vitest";
import { getReasonKey } from "../../src/core/types";
import type { Reason } from "../../src/core/types";

describe("getReasonKey", () => {
  it("should generate key from code and source", () => {
    const reason: Reason = {
      code: "not_authorized",
      source: "scope",
    };

    const key = getReasonKey(reason);

    expect(key).toBe("not_authorized:scope:");
  });

  it("should include sorted param keys in the key", () => {
    const reason: Reason = {
      code: "not_authorized",
      source: "scope",
      params: { required: ["admin"], missing: ["admin"] },
    };

    const key = getReasonKey(reason);

    // Keys are sorted alphabetically
    expect(key).toBe("not_authorized:scope:missing,required");
  });

  it("should generate consistent keys regardless of param order", () => {
    const reason1: Reason = {
      code: "in_progress",
      source: "ui_state",
      params: { operation: "loading", target: "data" },
    };

    const reason2: Reason = {
      code: "in_progress",
      source: "ui_state",
      params: { target: "data", operation: "loading" },
    };

    expect(getReasonKey(reason1)).toBe(getReasonKey(reason2));
  });

  it("should differentiate reasons with different codes", () => {
    const reason1: Reason = { code: "not_authorized", source: "scope" };
    const reason2: Reason = { code: "in_progress", source: "scope" };

    expect(getReasonKey(reason1)).not.toBe(getReasonKey(reason2));
  });

  it("should differentiate reasons with different sources", () => {
    const reason1: Reason = { code: "in_progress", source: "ui_state" };
    const reason2: Reason = { code: "in_progress", source: "api" };

    expect(getReasonKey(reason1)).not.toBe(getReasonKey(reason2));
  });
});

