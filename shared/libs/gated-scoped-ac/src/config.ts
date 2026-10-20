// Config loader + validators. Ported from `theo/ac-engine.ts`'s
// `registerPermissions` and `theo/ac-config.ts`'s shape, plus `registerForests`
// (globally-unique role names, per pilot part 03). Pure — no db import.
//
// This file is the source of truth for role + org-type VALUES. The engine treats
// both as opaque strings; the validators below enforce structure. Keeping the
// validators here (not in engine.ts) means engine.ts imports no config — no cycle.
//
// The SEMANTIC rules (duplicate names, create-with-target) live here as plain
// code. The SHAPE check is optional and comes through the validation port — pass
// an adapter (e.g. `zodConfigValidator()` from "@libs/gated-scoped-ac/zod") when
// the config isn't already TypeScript-checked.

import type {
  Condition,
  LoosePermissionDef,
  Permission,
  PermissionDefs,
  PermissionMap,
  RoleNode,
} from "./dsl";
import { assertNoIssues, type ConfigValidator } from "./validate";

// A slot compiles to EITHER one traversal OR a list of direct conditions, never
// both: the engine takes the first traversal it finds and drops everything else
// in that slot. Conditions in a slot are AND-ed, so a dropped condition is a
// SILENT GRANT — the rule reads as two constraints and enforces one. Refuse the
// config instead of narrowing it wrongly at request time.
// Each slot reads from exactly one place: `target` from the rows being filtered
// (`field:`), `payload` from the access context (`bag:`). Mixing them is refused
// rather than crashing later with "Unknown column: undefined".
function assertSlotSubjects(
  permission: string,
  slot: "target" | "payload",
  conditions: readonly Condition[],
): void {
  const subject = slot === "target" ? "field" : "bag";
  for (const cond of conditions) {
    if (subject in cond) continue;
    throw new Error(
      slot === "target"
        ? `Permission "${permission}": a target condition must name a column ` +
          `(\`field: "note.authorUserId"\`), not a context path.`
        : `Permission "${permission}": a payload condition must read the access context ` +
          `(e.g. \`bag: "$requestBody.songId"\`). A \`field:\` subject names a column of ` +
          `the row being created, which does not exist yet.`,
    );
  }
}

function assertNoMixedTraversal(
  permission: string,
  slot: string,
  conditions: readonly Condition[],
): void {
  const traversals = conditions.filter((c) => "join" in c).length;
  if (traversals === 0 || conditions.length === 1) return;
  throw new Error(
    `Permission "${permission}": a ${slot} that joins must hold exactly that one ` +
      `condition — found ${conditions.length} conditions (${traversals} traversal` +
      `${traversals > 1 ? "s" : ""}). Conditions in a slot are AND-ed, but only the ` +
      `first traversal is compiled, so the rest would be dropped silently. Split ` +
      `them across rules (OR) or fold them into the traversal's \`where\` (AND).`,
  );
}

// Typed builder: each entry is checked against PermissionDef<A> so a `create`
// action carrying a target is a compile error (HasCreate → CreateRule).
export function definePermissions<const T extends readonly LoosePermissionDef[]>(
  defs: T & PermissionDefs<T>,
): Permission[] {
  return defs as unknown as Permission[];
}

// `payload` is create-only for now. Anywhere else the engine would ignore it, so
// the rule would LOOK gated and not be — refuse it loudly instead.
function assertPayloadIsValid(
  def: Permission,
  payload: readonly Condition[],
): void {
  if (!def.actions.includes("create") || def.actions.length > 1) {
    throw new Error(
      `Permission "${def.name}" carries a payload on actions [${def.actions.join(", ")}] — ` +
        `payload is create-only today, and the engine would ignore it anywhere else. ` +
        `Split the create into its own permission.`,
    );
  }
  assertSlotSubjects(def.name, "payload", payload);
  assertNoMixedTraversal(def.name, "payload", payload);
}

// Name-indexed map; throws on a duplicate name or a create-with-target.
export function registerPermissions(
  configs: Permission[][],
  validator?: ConfigValidator,
): PermissionMap {
  const map: PermissionMap = {};
  for (const config of configs) {
    for (const def of config) {
      if (validator) {
        assertNoIssues(`permission "${def?.name}"`, validator.permission(def));
      }
      if (map[def.name]) {
        throw new Error(`Duplicate permission name: "${def.name}"`);
      }
      if (
        def.actions.includes("create") &&
        def.rules.some((r) => r.target.length > 0)
      ) {
        throw new Error(
          `Permission "${def.name}" has a target on a create action — create is context-only.`,
        );
      }
      for (const rule of def.rules) {
        assertSlotSubjects(def.name, "target", rule.target);
        assertNoMixedTraversal(def.name, "target", rule.target);
        if (rule.payload?.length) assertPayloadIsValid(def, rule.payload);
      }
      map[def.name] = def;
    }
  }
  return map;
}

// Role names are globally unique across the account baseline and every org-type
// forest; throws on any duplicate. If a role needs different permissions per
// org-type, give it a distinct name (no reuse).
export function registerForests(
  config: {
    accountBaseline: RoleNode[];
    forests: Record<string, RoleNode[]>;
  },
  validator?: ConfigValidator,
): { roles: string[] } {
  const seen = new Set<string>();
  const walk = (nodes: RoleNode[]) => {
    for (const n of nodes) {
      if (validator) {
        assertNoIssues(`role "${n?.role}"`, validator.roleNode(n));
      }
      if (seen.has(n.role)) {
        throw new Error(
          `Duplicate role: "${n.role}" (role names are globally unique)`,
        );
      }
      seen.add(n.role);
      if (n.children) walk(n.children);
    }
  };
  walk(config.accountBaseline);
  for (const forest of Object.values(config.forests)) walk(forest);
  return { roles: [...seen] };
}

// The roles holding `assigned` implies: each assigned role plus every role
// beneath it in its forest — the same subtree the engine collects permissions
// from (a role's own, then its descendants'). For callers that gate on roles
// rather than verdicts (e.g. nav visibility); unknown roles expand to themselves.
export function impliedRoles(
  assigned: readonly string[],
  forests: Record<string, RoleNode[]>,
): string[] {
  const out = new Set<string>();
  const addSubtree = (node: RoleNode) => {
    out.add(node.role);
    for (const child of node.children ?? []) addSubtree(child);
  };
  const find = (role: string, nodes: RoleNode[]): RoleNode | null => {
    for (const n of nodes) {
      if (n.role === role) return n;
      const hit = n.children ? find(role, n.children) : null;
      if (hit) return hit;
    }
    return null;
  };
  for (const role of assigned) {
    out.add(role);
    for (const forest of Object.values(forests)) {
      const node = find(role, forest);
      if (node) {
        addSubtree(node);
        break; // role names are globally unique (registerForests)
      }
    }
  }
  return [...out];
}
