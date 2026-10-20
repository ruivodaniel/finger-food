// =============================================================================
// UNIT TESTS: formatReason and formatReasons
// =============================================================================

import { describe, it, expect } from "vitest";
import { formatReason, formatReasons } from "../../src/format/format-reason";
import type { Reason } from "../../src/core/types";

describe("formatReason", () => {
  describe("not_authorized", () => {
    it("should format with required roles", () => {
      const reason: Reason = {
        code: "not_authorized",
        source: "scope",
        params: { required: ["manage_org", "owner"] },
      };

      const message = formatReason(reason);

      expect(message).toBe("Not authorized. Requires: manage_org, owner");
    });

    it("should format without required roles", () => {
      const reason: Reason = {
        code: "not_authorized",
        source: "scope",
      };

      const message = formatReason(reason);

      expect(message).toBe("Not authorized");
    });
  });

  describe("not_available", () => {
    it("should format with feature name", () => {
      const reason: Reason = {
        code: "not_available",
        source: "business_rule",
        params: { feature: "Export to PDF" },
      };

      const message = formatReason(reason);

      expect(message).toBe("Export to PDF is not available");
    });

    it("should format without feature name", () => {
      const reason: Reason = {
        code: "not_available",
        source: "business_rule",
      };

      const message = formatReason(reason);

      expect(message).toBe("Not available");
    });
  });

  describe("invalid_input", () => {
    it("should format with field and message", () => {
      const reason: Reason = {
        code: "invalid_input",
        source: "validation",
        params: { field: "email", message: "Invalid email format" },
      };

      const message = formatReason(reason);

      expect(message).toBe("email: Invalid email format");
    });

    it("should format with message only", () => {
      const reason: Reason = {
        code: "invalid_input",
        source: "validation",
        params: { message: "Form is invalid" },
      };

      const message = formatReason(reason);

      expect(message).toBe("Form is invalid");
    });

    it("should format without any params", () => {
      const reason: Reason = {
        code: "invalid_input",
        source: "validation",
      };

      const message = formatReason(reason);

      expect(message).toBe("Invalid input");
    });
  });

  describe("in_progress", () => {
    it("should format with operation name", () => {
      const reason: Reason = {
        code: "in_progress",
        source: "ui_state",
        params: { operation: "saving" },
      };

      const message = formatReason(reason);

      expect(message).toBe("Saving in progress");
    });

    it("should capitalize operation", () => {
      const reason: Reason = {
        code: "in_progress",
        source: "ui_state",
        params: { operation: "loading" },
      };

      const message = formatReason(reason);

      expect(message).toBe("Loading in progress");
    });

    it("should format without operation", () => {
      const reason: Reason = {
        code: "in_progress",
        source: "ui_state",
      };

      const message = formatReason(reason);

      expect(message).toBe("Operation in progress");
    });
  });

  describe("precondition_missing", () => {
    it("should use custom message if provided", () => {
      const reason: Reason = {
        code: "precondition_missing",
        source: "ui_state",
        params: { message: "Please select an organization first" },
      };

      const message = formatReason(reason);

      expect(message).toBe("Please select an organization first");
    });

    it("should format with missing item", () => {
      const reason: Reason = {
        code: "precondition_missing",
        source: "ui_state",
        params: { missing: "organization" },
      };

      const message = formatReason(reason);

      expect(message).toBe("Requires: organization");
    });

    it("should format without params", () => {
      const reason: Reason = {
        code: "precondition_missing",
        source: "ui_state",
      };

      const message = formatReason(reason);

      expect(message).toBe("Prerequisite not met");
    });
  });

  describe("conflict", () => {
    it("should use custom message if provided", () => {
      const reason: Reason = {
        code: "conflict",
        source: "business_rule",
        params: { message: "Cannot edit archived organization" },
      };

      const message = formatReason(reason);

      expect(message).toBe("Cannot edit archived organization");
    });

    it("should format with state", () => {
      const reason: Reason = {
        code: "conflict",
        source: "business_rule",
        params: { state: "archived" },
      };

      const message = formatReason(reason);

      expect(message).toBe("Cannot proceed: archived");
    });

    it("should format without params", () => {
      const reason: Reason = {
        code: "conflict",
        source: "business_rule",
      };

      const message = formatReason(reason);

      expect(message).toBe("Action not allowed in current state");
    });
  });

  describe("unknown codes", () => {
    it("should use message param if available", () => {
      const reason: Reason = {
        code: "custom_error",
        source: "api",
        params: { message: "Something went wrong" },
      };

      const message = formatReason(reason);

      expect(message).toBe("Something went wrong");
    });

    it("should format code as fallback", () => {
      const reason: Reason = {
        code: "custom_error_code",
        source: "api",
      };

      const message = formatReason(reason);

      expect(message).toBe("custom error code");
    });
  });

  describe("custom dictionary", () => {
    it("should use custom dictionary entries", () => {
      const reason: Reason = {
        code: "not_authorized",
        source: "scope",
      };

      const customDict = {
        not_authorized: "Acceso denegado",
      };

      const message = formatReason(reason, customDict);

      expect(message).toBe("Acceso denegado");
    });

    it("should use custom dictionary function", () => {
      const reason: Reason = {
        code: "not_authorized",
        source: "scope",
        params: { required: ["admin"] },
      };

      const customDict = {
        not_authorized: (params?: Record<string, unknown>) => {
          const roles = params?.required;
          return Array.isArray(roles) ? `Necesita: ${roles.join(", ")}` : "Sin permiso";
        },
      };

      const message = formatReason(reason, customDict);

      expect(message).toBe("Necesita: admin");
    });
  });
});

describe("formatReasons", () => {
  it("should format multiple reasons", () => {
    const reasons: Reason[] = [
      { code: "not_authorized", source: "scope", params: { required: ["admin"] } },
      { code: "in_progress", source: "ui_state", params: { operation: "saving" } },
    ];

    const messages = formatReasons(reasons);

    expect(messages).toHaveLength(2);
    expect(messages[0]).toBe("Not authorized. Requires: admin");
    expect(messages[1]).toBe("Saving in progress");
  });

  it("should return empty array for no reasons", () => {
    const messages = formatReasons([]);

    expect(messages).toEqual([]);
  });
});

