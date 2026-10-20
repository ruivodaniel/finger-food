// =============================================================================
// UNIT TESTS: fromZod adapter
// =============================================================================

import { describe, it, expect } from "vitest";
import { fromZod } from "../../src/adapters/from-zod";
import type { ZodErrorLike } from "../../src/adapters/from-zod";

describe("fromZod", () => {
  describe("when no error", () => {
    it("should return available when error is null", () => {
      const result = fromZod(null);

      expect(result.available).toBe(true);
      expect(result.reasons).toEqual([]);
    });

    it("should return available when error is undefined", () => {
      const result = fromZod(undefined);

      expect(result.available).toBe(true);
      expect(result.reasons).toEqual([]);
    });

    it("should return available when issues array is empty", () => {
      const error: ZodErrorLike = { issues: [] };
      const result = fromZod(error);

      expect(result.available).toBe(true);
      expect(result.reasons).toEqual([]);
    });
  });

  describe("when there are validation errors", () => {
    it("should return one reason per field", () => {
      const error: ZodErrorLike = {
        issues: [
          { path: ["email"], message: "Invalid email format", code: "invalid_string" },
          { path: ["name"], message: "Required", code: "too_small" },
        ],
      };

      const result = fromZod(error);

      expect(result.available).toBe(false);
      expect(result.reasons).toHaveLength(2);
    });

    it("should use 'validation' as source (not 'zod')", () => {
      const error: ZodErrorLike = {
        issues: [{ path: ["email"], message: "Invalid", code: "invalid_string" }],
      };

      const result = fromZod(error);

      expect(result.reasons[0].source).toBe("validation");
    });

    it("should use 'invalid_input' as code", () => {
      const error: ZodErrorLike = {
        issues: [{ path: ["email"], message: "Invalid", code: "invalid_string" }],
      };

      const result = fromZod(error);

      expect(result.reasons[0].code).toBe("invalid_input");
    });

    it("should include field, message, and zodCode in params", () => {
      const error: ZodErrorLike = {
        issues: [
          { path: ["user", "email"], message: "Invalid email", code: "invalid_string" },
        ],
      };

      const result = fromZod(error);

      expect(result.reasons[0].params).toEqual({
        field: "user.email",
        message: "Invalid email",
        zodCode: "invalid_string",
      });
    });

    it("should handle numeric path segments", () => {
      const error: ZodErrorLike = {
        issues: [{ path: ["items", 0, "name"], message: "Required", code: "too_small" }],
      };

      const result = fromZod(error);

      expect(result.reasons[0].params?.field).toBe("items.0.name");
    });
  });
});

