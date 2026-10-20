// Public API of @libs/gated-scoped-ac. The brand symbol is NOT exported — only
// the engine can mint a Scope (gate.ts requires one, so skipping AC is a compile
// error, not a convention).

// ── the engine (the only Scope minter) + the gate (the only db consumer) ──
export { createAc } from "./engine";
export { createGatedDb } from "./gate";

// ── public types ──
export type {
  Ac,
  AcConfig,
  AnyTable,
  ExistsProbe,
  IdSubquery,
  Scope, // the branded type (constructible only inside engine.ts)
  SchemaTables,
  Verdict,
} from "./engine";
export type { GateDeps, GatedDb } from "./gate";

// ── the visibility token (public/private) ──
export { isPrivate, PRIVATE, PUBLIC } from "./visibility";
export type { Private, Public } from "./visibility";

// ── the validation PORT (adapters live in src/adapters/, never imported here) ──
export type { ConfigValidator, Issue } from "./validate";

// ── the DSL + config loader/validators ──
export {
  definePermissions,
  impliedRoles,
  registerForests,
  registerPermissions,
} from "./config";
export type {
  AccessRule,
  Action,
  Compare,
  Condition,
  CreateRule,
  DirectCondition,
  JoinWhere,
  LoosePermissionDef,
  Operand,
  OrgType,
  Permission,
  PermissionDef,
  PermissionDefs,
  PermissionMap,
  Role,
  RoleNode,
  Traversal,
} from "./dsl";
