// =============================================================================
// UNIT TESTS: resolveAvailability
// =============================================================================

import { describe, it, expect } from "vitest";
import { resolveAvailability } from "../../src/core/resolve";
import type { AvailabilityInput } from "../../src/core/types";

describe("resolveAvailability", () => {
  describe("when all inputs are available", () => {
    it("should return available: true with empty reasons", () => {
      const inputs: AvailabilityInput[] = [
        { available: true, reasons: [] },
        { available: true, reasons: [] },
      ];

      const result = resolveAvailability(inputs);

      expect(result.available).toBe(true);
      expect(result.reasons).toEqual([]);
    });

    it("should handle single available input", () => {
      const inputs: AvailabilityInput[] = [{ available: true, reasons: [] }];

      const result = resolveAvailability(inputs);

      expect(result.available).toBe(true);
      expect(result.reasons).toEqual([]);
    });

    it("should handle empty inputs array", () => {
      const result = resolveAvailability([]);

      expect(result.available).toBe(true);
      expect(result.reasons).toEqual([]);
    });
  });

  describe("when any input is unavailable", () => {
    it("should return available: false with the reason", () => {
      const inputs: AvailabilityInput[] = [
        { available: true, reasons: [] },
        {
          available: false,
          reasons: [{ code: "not_authorized", source: "scope" }],
        },
      ];

      const result = resolveAvailability(inputs);

      expect(result.available).toBe(false);
      expect(result.reasons).toHaveLength(1);
      expect(result.reasons[0].code).toBe("not_authorized");
    });

    it("should collect reasons from ALL failing inputs", () => {
      const inputs: AvailabilityInput[] = [
        {
          available: false,
          reasons: [{ code: "not_authorized", source: "scope" }],
        },
        {
          available: false,
          reasons: [{ code: "in_progress", source: "ui_state" }],
        },
        { available: true, reasons: [] },
      ];

      const result = resolveAvailability(inputs);

      expect(result.available).toBe(false);
      expect(result.reasons).toHaveLength(2);
      expect(result.reasons.map((r) => r.code)).toContain("not_authorized");
      expect(result.reasons.map((r) => r.code)).toContain("in_progress");
    });

    it("should preserve reason params", () => {
      const inputs: AvailabilityInput[] = [
        {
          available: false,
          reasons: [
            {
              code: "not_authorized",
              source: "scope",
              params: { required: ["manage_org"], missing: ["manage_org"] },
            },
          ],
        },
      ];

      const result = resolveAvailability(inputs);

      expect(result.reasons[0].params).toEqual({
        required: ["manage_org"],
        missing: ["manage_org"],
      });
    });
  });

  describe("when input has multiple reasons", () => {
    it("should collect all reasons from that input", () => {
      const inputs: AvailabilityInput[] = [
        {
          available: false,
          reasons: [
            {
              code: "invalid_input",
              source: "validation",
              params: { field: "email" },
            },
            {
              code: "invalid_input",
              source: "validation",
              params: { field: "name" },
            },
          ],
        },
      ];

      const result = resolveAvailability(inputs);

      expect(result.available).toBe(false);
      expect(result.reasons).toHaveLength(2);
    });
  });
});

