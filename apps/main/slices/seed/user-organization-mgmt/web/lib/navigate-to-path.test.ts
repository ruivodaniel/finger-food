// =============================================================================
// navigate-to-path tests — query-string splitting and in-app sanitization.
// Pure deps, node env.
// =============================================================================

import { describe, it, expect, vi } from "vitest";
import { navigateToPath, sanitizeInAppPath } from "./navigate-to-path";

describe("sanitizeInAppPath", () => {
  it("passes in-app absolute paths through", () => {
    expect(sanitizeInAppPath("/dashboard")).toBe("/dashboard");
    expect(sanitizeInAppPath("/resolve?intention=%2Fx")).toBe(
      "/resolve?intention=%2Fx",
    );
  });

  it("rejects protocol-relative, absolute, relative and empty values", () => {
    expect(sanitizeInAppPath("//evil.example/phish")).toBeUndefined();
    expect(sanitizeInAppPath("https://evil.example")).toBeUndefined();
    expect(sanitizeInAppPath("dashboard")).toBeUndefined();
    expect(sanitizeInAppPath("")).toBeUndefined();
    expect(sanitizeInAppPath(undefined)).toBeUndefined();
    expect(sanitizeInAppPath(null)).toBeUndefined();
  });
});

describe("navigateToPath", () => {
  it("navigates plain paths as-is", () => {
    const navigate = vi.fn();
    void navigateToPath({ navigate }, "/dashboard");
    expect(navigate).toHaveBeenCalledWith({ to: "/dashboard" });
  });

  it("splits a query string into search pairs", () => {
    const navigate = vi.fn();
    void navigateToPath({ navigate }, "/accept-invitation?id=inv_1");
    expect(navigate).toHaveBeenCalledWith({
      to: "/accept-invitation",
      search: { id: "inv_1" },
    });
  });

  it("decodes nested intentions", () => {
    const navigate = vi.fn();
    void navigateToPath({ navigate }, "/resolve?intention=%2Fdashboard%3Fa%3D1");
    expect(navigate).toHaveBeenCalledWith({
      to: "/resolve",
      search: { intention: "/dashboard?a=1" },
    });
  });

  it("tolerates a missing router", () => {
    expect(() => void navigateToPath(undefined, "/x?y=1")).not.toThrow();
  });
});
