import { describe, it, expect } from "vitest";
import { orgSectionPath } from "./org-paths";

describe("orgSectionPath", () => {
  it("spells the active org as current", () => {
    expect(orgSectionPath("/organizations", "org-1", "org-1", "info")).toBe(
      "/organizations/current/info",
    );
  });

  it("spells a non-active org by id", () => {
    expect(orgSectionPath("/organizations", "org-2", "org-1", "members")).toBe(
      "/organizations/org-2/members",
    );
  });

  it("uses the id when nothing is active", () => {
    expect(orgSectionPath("/organizations", "org-2", null, "info")).toBe(
      "/organizations/org-2/info",
    );
  });
});
