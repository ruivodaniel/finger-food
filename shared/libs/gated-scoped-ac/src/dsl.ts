// DSL types — the context/target rule shapes. Ported from `theo/types.ts`
// (object DSL, `has` is the single operator), with one deliberate divergence:
// subject references are NESTED dotted paths resolved against the session bag
// (D3, e.g. `$session.user.id`) instead of `theo`'s flat `{ bag: "userId" }`.
//
// The dotted path is carried in the same `{ bag: "..." }` operand slot; only the
// *string* changes (a path, not a flat key). The engine resolves it (engine.ts).

export type Action = "create" | "read" | "update" | "delete";

// Roles and org-types are CONFIG DATA, not library types: the engine treats them
// as opaque strings. config.ts is the source of truth (and validates them).
export type Role = string;
export type OrgType = string;

// ── a condition reads as:  <LHS> has <RHS> ──
// RHS: a nested bag path (`$session.user.id`) or a literal.
export type Operand = { bag: string } | { value: string | number | boolean };

// ── the four operators ──
// `has` is the one an author reaches for without knowing the model: it means
// "this value is in this column", the same whether the column holds one value or
// many. Turning a column from `text` into `text[]` therefore never touches a
// rule (AC32). `is` is the strict opt-in — a single value, refusing a collection
// outright rather than quietly widening.
//
// NEITHER EVER MEANS SUBSTRING. Containment on a string over-grants silently:
// under substring semantics `invitation.email has $session.user.email` lets a
// caller registered as "m@altar.io" match an invitation to "tim@altar.io".
//
// Negations are null-inclusive (IS DISTINCT FROM), not SQL's default, where a
// NULL row silently fails a `<>` test.
export type Compare =
  | { is: Operand }
  | { isNot: Operand }
  | { has: Operand }
  | { hasNot: Operand };
// LHS: a row column (`note.authorUserId`) or a context value (`$session.organization.type`).
export type DirectCondition = ({ field: string } | { bag: string }) & Compare;
// A JOIN: follow a foreign key into a related entity, then filter on that entity.
// `where` takes one condition or a LIST of them, AND-ed together — a target may
// need several ("your manager has the project, but it could be the director").
export type JoinWhere = { field: string } & Compare;
// A traversal's SUBJECT decides how it compiles:
//   { field: … }  a column on the rows being filtered — the value varies per
//                 row, so it compiles to a correlated id sub-query.
//   { bag: … }    a single value out of the access context (`$requestBody.songId`)
//                 — nothing to correlate, so it compiles to a standalone probe.
export type Traversal = ({ field: string } | { bag: string }) & {
  join: string;
  // The column joined against on the FAR side. Defaults to `"id"`, which is the
  // common case (`note.organizationId` → `organization.id`), but a table keyed
  // by its parent — a share table on `noteId`, not on `id` — must name it, or
  // the join silently lands on the wrong column.
  on?: string;
  where: JoinWhere | JoinWhere[];
};
export type Condition = DirectCondition | Traversal;

// `payload` gates on the row being WRITTEN, reached through the access context
// (`$requestBody.*`). Its conditions must carry a `bag:` subject — a `field:`
// there would name a column of a row that does not exist yet. A slot that
// queries cannot live in `context` (AC20 — context never triggers a query), and
// `target` is barred on a create, which is why it is its own slot.
//
// Create-only for now: config.ts throws if it appears on any other action, so a
// payload rule can never be a silent no-op. Lifted when a case needs it (AC35).
export type AccessRule = {
  context: Condition[];
  target: Condition[];
  payload?: Condition[];
};

export type Permission = {
  name: string;
  entity: string;
  actions: Action[];
  fields?: string[]; // column allowlist; empty/absent = all columns
  rules: AccessRule[];
};

export type PermissionMap = Record<string, Permission>;

// ── compile-time guard: a create action cannot carry a target ──
export type HasCreate<A extends readonly Action[]> =
  "create" extends A[number] ? true : false;

export type CreateRule = {
  context: Condition[];
  target: [];
  payload?: Condition[];
};

export type RulesFor<A extends readonly Action[]> =
  (HasCreate<A> extends true ? CreateRule : AccessRule)[];

export type PermissionDef<A extends readonly Action[] = readonly Action[]> = {
  name: string;
  entity: string;
  actions: A;
  fields?: string[];
  rules: RulesFor<A>;
};

// Loose bound for the builder generic; PermissionDefs does the per-entry check.
export type LoosePermissionDef = {
  name: string;
  entity: string;
  actions: readonly Action[];
  fields?: string[];
  rules: AccessRule[];
};

export type PermissionDefs<T extends readonly unknown[]> = {
  [K in keyof T]: T[K] extends { actions: infer A extends readonly Action[] }
    ? PermissionDef<A>
    : never;
};

// a node in a role forest. role names are plain strings, declared in config.
export type RoleNode = {
  role: string;
  permissions?: string[];
  children?: RoleNode[];
};
