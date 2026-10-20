// =============================================================================
// UNIT TESTS: fromScope adapter (createFromScope factory)
// =============================================================================

import { describe, it, expect } from "vitest";
import { createFromScope } from "../../src/adapters/from-scope";
import type { FromScopeRoleDefinitions } from "../../src/adapters/from-scope";

// Minimal role definitions for testing — only `title` is read by the adapter.
const testScopedRoles: FromScopeRoleDefinitions = {
  view_org: { title: "View Organization" },
  manage_org: { title: "Manage Organization" },
  owner: { title: "Owner" },
};

describe("createFromScope", () => {
  const fromScope = createFromScope(testScopedRoles);

  describe("when user has required role", () => {
    it("should return available", () => {
      const result = fromScope(["view_org"], ["view_org"]);

      expect(result.available).toBe(true);
      expect(result.reasons).toEqual([]);
    });

    it("should return available when user has ANY of required roles", () => {
      const result = fromScope(["view_org"], ["view_org", "manage_org"]);

      expect(result.available).toBe(true);
    });
  });

  describe("when user lacks required role", () => {
    it("should return unavailable with reason", () => {
      const result = fromScope(["view_org"], ["manage_org"]);

      expect(result.available).toBe(false);
      expect(result.reasons).toHaveLength(1);
    });

    it("should use 'not_authorized' as code", () => {
      const result = fromScope(["view_org"], ["manage_org"]);

      expect(result.reasons[0].code).toBe("not_authorized");
    });

    it("should use 'scope' as source", () => {
      const result = fromScope(["view_org"], ["manage_org"]);

      expect(result.reasons[0].source).toBe("scope");
    });

    it("should include required and missing roles in params", () => {
      const result = fromScope(["view_org"], ["manage_org"]);

      // Adapter resolves to the role's UI title when available.
      expect(result.reasons[0].params?.required).toEqual(["Manage Organization"]);
      expect(result.reasons[0].params?.missing).toBeDefined();
    });
  });

  describe("edge cases", () => {
    it("should return available when no roles are required", () => {
      const result = fromScope(["view_org"], []);

      expect(result.available).toBe(true);
    });

    it("should return unavailable when user has no roles", () => {
      const result = fromScope([], ["view_org"]);

      expect(result.available).toBe(false);
    });
  });
});
