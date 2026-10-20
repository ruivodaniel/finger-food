// The zod adapter is one implementation of the validation port. These tests
// exercise it through `registerPermissions` / `registerForests` — i.e. through
// the port, not against zod — so a different adapter must satisfy the same
// expectations.

import { describe, expect, test } from "vitest";

import { registerForests, registerPermissions } from "../src/index";
import { zodConfigValidator } from "../src/adapters/zod";
import { accountBaseline, forests } from "./fixture/config";
import type { Permission } from "../src/index";

const v = zodConfigValidator();

const ok: Permission = {
  name: "read_own_note",
  entity: "note",
  actions: ["read"],
  fields: ["id", "title"],
  rules: [
    {
      context: [{ bag: "$session.organization.type", has: { value: "company" } }],
      target: [{ field: "note.authorUserId", has: { bag: "$session.user.id" } }],
    },
  ],
};

describe("zod adapter — accepts valid config", () => {
  test("a well-formed permission passes", () => {
    expect(v.permission(ok)).toEqual([]);
    expect(registerPermissions([[ok]], v)).toHaveProperty("read_own_note");
  });

  test("a traversal target passes, with `where` as one condition or a list", () => {
    const one = { ...ok, name: "t1", rules: [{ context: [], target: [
      { field: "note.organizationId", join: "organization",
        where: { field: "organization.type", has: { value: "company" } } },
    ] }] } as Permission;
    const many = { ...one, name: "t2", rules: [{ context: [], target: [
      { field: "note.organizationId", join: "organization", where: [
        { field: "organization.type", has: { value: "company" } },
        { field: "organization.id", has: { bag: "$session.organization.id" } },
      ] },
    ] }] } as Permission;
    expect(v.permission(one)).toEqual([]);
    expect(v.permission(many)).toEqual([]);
  });

  test("the whole fixture config passes the shape check", () => {
    expect(() => registerForests({ accountBaseline, forests }, v)).not.toThrow();
  });
});

describe("zod adapter — rejects malformed config", () => {
  test("an unknown action", () => {
    const bad = { ...ok, actions: ["publish"] } as unknown as Permission;
    expect(() => registerPermissions([[bad]], v)).toThrow(/actions/);
  });

  test("a condition with no operator (`has` is the only one)", () => {
    const bad = {
      ...ok,
      rules: [{ context: [], target: [{ field: "note.id", equals: "x" }] }],
    } as unknown as Permission;
    expect(() => registerPermissions([[bad]], v)).toThrow(/rules/);
  });

  test("an empty actions list", () => {
    const bad = { ...ok, actions: [] } as unknown as Permission;
    expect(() => registerPermissions([[bad]], v)).toThrow(/Invalid permission/);
  });

  test("a role node with no role name", () => {
    expect(() =>
      registerForests(
        { accountBaseline: [{ permissions: ["p"] } as never], forests: {} },
        v,
      ),
    ).toThrow(/Invalid role/);
  });

  test("a malformed nested child is caught", () => {
    expect(() =>
      registerForests(
        {
          accountBaseline: [
            { role: "top", children: [{ role: "", permissions: [] }] },
          ],
          forests: {},
        },
        v,
      ),
    ).toThrow(/Invalid role/);
  });
});

describe("the validator is optional — the core never needs it", () => {
  test("registerPermissions without a validator still enforces the semantic rules", () => {
    expect(() => registerPermissions([[ok, ok]])).toThrow(/Duplicate permission/);
    // create is context-only — `ok` carries a target, so this is rejected
    expect(() =>
      registerPermissions([
        [{ ...ok, name: "c", actions: ["create"] } as Permission],
      ]),
    ).toThrow(/create is context-only/);
  });
});
