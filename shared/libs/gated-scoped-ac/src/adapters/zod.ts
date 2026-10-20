// THE ZOD ADAPTER — the only file in the library that knows zod exists.
//
// It implements the `ConfigValidator` port (src/validate.ts) with the small
// slice of zod scoped AC actually needs. Consumers opt in:
//
//   import { zodConfigValidator } from "@libs/gated-scoped-ac/zod";
//   registerPermissions([...], zodConfigValidator());
//
// Importing the library core never pulls zod in.

import { z } from "zod";

import type { ConfigValidator, Issue } from "../validate";

const operand = z.union([
  z.object({ bag: z.string().min(1) }),
  z.object({ value: z.union([z.string(), z.number(), z.boolean()]) }),
]);

// Four operators (see dsl.ts). A condition is a subject plus exactly one of
// them, so each subject shape expands into four accepted objects.
const withCompare = (subject: z.ZodRawShape) =>
  z.union([
    z.object({ ...subject, is: operand }),
    z.object({ ...subject, isNot: operand }),
    z.object({ ...subject, has: operand }),
    z.object({ ...subject, hasNot: operand }),
  ]);

const joinWhere = withCompare({ field: z.string().min(1) });

// traversal: follow a value into a related entity, then filter there. `where` is
// one condition or a non-empty list, AND-ed. `on` is the far-side column; absent
// means the conventional "id".
const traversal = (subject: z.ZodRawShape) =>
  z.object({
    ...subject,
    join: z.string().min(1),
    on: z.string().min(1).optional(),
    where: z.union([joinWhere, z.array(joinWhere).min(1)]),
  });

const condition = z.union([
  traversal({ field: z.string().min(1) }), // per row — correlated sub-query
  traversal({ bag: z.string().min(1) }), // one context value — a probe
  withCompare({ field: z.string().min(1) }), // row column
  withCompare({ bag: z.string().min(1) }), // context value
]);

const rule = z.object({
  context: z.array(condition),
  target: z.array(condition),
  // the row being written, reached through the access context
  payload: z.array(condition).optional(),
});

const permission = z.object({
  name: z.string().min(1),
  entity: z.string().min(1),
  actions: z.array(z.enum(["create", "read", "update", "delete"])).min(1),
  // one list, governing the read projection AND the updatable columns
  fields: z.array(z.string().min(1)).optional(),
  rules: z.array(rule),
});

const roleNode: z.ZodType = z.lazy(() =>
  z.object({
    role: z.string().min(1),
    permissions: z.array(z.string().min(1)).optional(),
    children: z.array(roleNode).optional(),
  }),
);

const issuesOf = (schema: z.ZodType, value: unknown): Issue[] => {
  const result = schema.safeParse(value);
  if (result.success) return [];
  return result.error.issues.map((i) => ({
    path: i.path.join("."),
    message: i.message,
  }));
};

export function zodConfigValidator(): ConfigValidator {
  return {
    permission: (def) => issuesOf(permission, def),
    roleNode: (node) => issuesOf(roleNode, node),
  };
}
