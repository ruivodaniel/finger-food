// =============================================================================
// UNIT TESTS: fromBoolean adapter
// =============================================================================

import { describe, it, expect } from "vitest";
import { fromBoolean } from "../../src/adapters/from-boolean";

describe("fromBoolean", () => {
  describe("when condition is true", () => {
    it("should return available with no reasons", () => {
      const result = fromBoolean(true, {
        code: "in_progress",
        source: "ui_state",
      });

      expect(result.available).toBe(true);
      expect(result.reasons).toEqual([]);
    });
  });

  describe("when condition is false", () => {
    it("should return unavailable with the provided reason", () => {
      const reason = {
        code: "in_progress" as const,
        source: "ui_state" as const,
        params: { operation: "saving" },
      };

      const result = fromBoolean(false, reason);

      expect(result.available).toBe(false);
      expect(result.reasons).toHaveLength(1);
      expect(result.reasons[0]).toEqual(reason);
    });
  });

  describe("common use cases", () => {
    it("should handle loading state check", () => {
      const isLoading = true;
      const result = fromBoolean(!isLoading, {
        code: "in_progress",
        source: "ui_state",
        params: { operation: "loading" },
      });

      expect(result.available).toBe(false);
      expect(result.reasons[0].params?.operation).toBe("loading");
    });

    it("should handle saving state check", () => {
      const isSaving = false;
      const result = fromBoolean(!isSaving, {
        code: "in_progress",
        source: "ui_state",
        params: { operation: "saving" },
      });

      expect(result.available).toBe(true);
    });

    it("should handle precondition check (org selected)", () => {
      const activeOrgId = null;
      const result = fromBoolean(!!activeOrgId, {
        code: "precondition_missing",
        source: "ui_state",
        params: { missing: "organization" },
      });

      expect(result.available).toBe(false);
      expect(result.reasons[0].code).toBe("precondition_missing");
    });

    it("should handle entity state conflict (archived)", () => {
      const org = { isArchived: true };
      const result = fromBoolean(!org.isArchived, {
        code: "conflict",
        source: "business_rule",
        params: { state: "archived" },
      });

      expect(result.available).toBe(false);
      expect(result.reasons[0].code).toBe("conflict");
    });
  });
});

