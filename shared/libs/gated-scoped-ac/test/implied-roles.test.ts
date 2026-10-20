// impliedRoles — a role implies its whole subtree (the engine's permission
// inheritance), across forests; unknown roles expand to themselves.

import { describe, expect, test } from "vitest";

import { impliedRoles } from "../src/config";
import type { RoleNode } from "../src/dsl";

const forests: Record<string, RoleNode[]> = {
  company: [
    {
      role: "owner",
      children: [{ role: "manager", children: [{ role: "standard" }] }],
    },
  ],
  platform: [
    {
      role: "platform_owner",
      children: [{ role: "manage_platform" }, { role: "manage_legal_docs" }],
    },
  ],
};

describe("impliedRoles", () => {
  test("a role implies every role beneath it", () => {
    expect(impliedRoles(["owner"], forests).sort()).toEqual(
      ["manager", "owner", "standard"].sort(),
    );
    expect(impliedRoles(["platform_owner"], forests)).toContain("manage_legal_docs");
  });

  test("a leaf implies only itself; nothing above it", () => {
    expect(impliedRoles(["manager"], forests).sort()).toEqual(["manager", "standard"]);
    expect(impliedRoles(["manage_legal_docs"], forests)).toEqual(["manage_legal_docs"]);
  });

  test("unknown roles pass through; no roles imply none", () => {
    expect(impliedRoles(["ghost"], forests)).toEqual(["ghost"]);
    expect(impliedRoles([], forests)).toEqual([]);
  });
});
