// The PURE engine — interprets config + roles + bag and produces a branded
// `Scope` (for read/update/delete) or a verdict (for create). It is pure: it
// builds SQL *fragments* and *descriptors* (drizzle's `sql`/`eq` + the injected
// schema), but NEVER touches a db connection — the gate (gate.ts) assembles the
// sub-queries and executes. Ported from pilot part 04 + `theo/ac-engine.ts`.
//
// The brand symbol is declared here and NEVER exported, so ONLY this module can
// mint a `Scope`. No db import lives here.

import { and, eq, or, sql, type SQL } from "drizzle-orm";

import type {
  AccessRule,
  Action,
  Condition,
  PermissionMap,
  Role,
  RoleNode,
} from "./dsl";

// ── injected schema shape ──────────────────────────────────────────────────
// The app injects its drizzle tables keyed by entity name. The engine and the
// gate share this map; `EntityName` is derived from its keys, so a `Scope`'s
// entity brand is exactly one of the configured entities.
export type AnyTable = Record<string, any>;
export type SchemaTables = Record<string, AnyTable>;

// ── the brand: declared here, NEVER exported → only this module mints a Scope ─
declare const scopeBrand: unique symbol;

// an "entity.id IN (sub-query)" the GATE assembles (visibility unions + traversals).
// The engine only *describes* it — it never builds or runs the sub-query.
export type IdSubquery<E extends string = string> = {
  from: E; // table the sub-query reads ids from
  idColumn: string; // id/fk column to collect ("id", "noteId", …)
  joinTo?: { table: E; on: SQL }; // optional join (for traversals)
  where: SQL;
};

// Branded by entity AND action: a read scope can't be passed where an update one
// is required, and a note_share scope can't be passed where a note one is.
export type Scope<E extends string, A extends Action> = {
  readonly base: SQL; // direct-condition WHERE (default-deny = FALSE)
  readonly idSubqueries: IdSubquery<E>[]; // OR-ed with `base` by the gate
  readonly fields?: readonly string[]; // resolved column allowlist; undefined = all
  readonly [scopeBrand]: { entity: E; action: A };
};

// "at least one row of `from` satisfies `where`" — the whole condition, key
// match included. Unlike IdSubquery this correlates with nothing: a payload
// traversal's subject is a single value out of the bag, so the engine can build
// the entire fragment and the gate only has to ask whether a row comes back.
export type ExistsProbe<E extends string = string> = {
  from: E;
  where: SQL;
};

// `requires` is OR-ed and must be satisfied before the write lands. `allow` is
// the in-memory verdict; a caller that reads only `allow` gets exactly today's
// answer for every rule that carries no payload. `gateDb.create` enforces both.
export type Verdict<E extends string = string> = {
  allow: boolean;
  reason?: string;
  requires?: ExistsProbe<E>[];
};

// Fallback only — real consumers inject `orgTypePath` (see AcConfig).
const DEFAULT_ORG_TYPE_PATH = "$session.organization.type";

// ── nested-path subject resolution (D3) ─────────────────────────────────────
// Subjects are nested under the session object; rule operands reference dotted
// paths like `$session.user.id`. A leading `$` is stripped; the path is walked.
function resolvePath(bag: unknown, path: string): unknown {
  const clean = path.startsWith("$") ? path.slice(1) : path;
  let cur: any = bag;
  for (const key of clean.split(".")) {
    if (cur == null) return undefined;
    cur = cur[key];
  }
  return cur;
}

// ── resolvePermissions — ported from `theo/ac-engine.ts` (pure) ─────────────
function findRole(roleName: Role, forest: RoleNode[]): RoleNode | null {
  for (const node of forest) {
    if (node.role === roleName) return node;
    const found = node.children && findRole(roleName, node.children);
    if (found) return found;
  }
  return null;
}

function collectPermissions(
  roleName: Role,
  forest: RoleNode[],
  acc: Set<string>,
) {
  const node = findRole(roleName, forest);
  if (!node) return;
  for (const permName of node.permissions ?? []) acc.add(permName);
  for (const child of node.children ?? []) {
    collectPermissions(child.role, forest, acc);
  }
}

function resolvePermissions(roles: Role[], forest: RoleNode[]): Set<string> {
  const collected = new Set<string>();
  for (const role of roles) collectPermissions(role, forest, collected);
  return collected;
}

// ── config the factory receives ─────────────────────────────────────────────
export type AcConfig<S extends SchemaTables> = {
  tables: S;
  permissions: PermissionMap;
  forests: Record<string, RoleNode[]>;
  accountBaseline: RoleNode[];
  // the declared visibility union per entity (e.g. note ∪ note_share) — emitted
  // as IdSubquery descriptors the gate assembles. Ported from `theo`'s readJoins.
  visibilityJoins?: Partial<
    Record<keyof S & string, { via: keyof S & string; fk: string }[]>
  >;
  // Where the caller's org-type lives in the bag. INJECTED, because the library
  // must carry zero application knowledge (AC37) — it has no business knowing
  // that an app calls this "session.organization.type".
  orgTypePath?: string;
};

export function createAc<S extends SchemaTables>(config: AcConfig<S>) {
  type EntityName = keyof S & string;
  const orgTypePath = config.orgTypePath ?? DEFAULT_ORG_TYPE_PATH;

  const TRUE: SQL = sql`true`;
  const FALSE: SQL = sql`false`;

  const tableOf = (entity: string): AnyTable => {
    const t = config.tables[entity];
    if (!t) throw new Error(`Unknown entity: "${entity}"`);
    return t;
  };
  const columnOf = (field: string): SQL => {
    const [entity, col] = field.split(".");
    const column = tableOf(entity)[col];
    if (!column) throw new Error(`Unknown column: "${field}"`);
    return column;
  };
  // The FAR side of a traversal: the column the join lands on over there. `"id"`
  // is only the common case — a table keyed by its parent (a share table on
  // `noteId`) declares its own, and without that the join is silently wrong.
  const joinColumnOf = (entity: string, col?: string): SQL => {
    const name = col ?? "id";
    const column = tableOf(entity)[name];
    if (!column) throw new Error(`Unknown column: "${entity}.${name}"`);
    return column;
  };

  // RHS operand → a concrete value (literal or a nested bag path, D3).
  const operandValue = (
    op: { bag: string } | { value: unknown },
    subjects: unknown,
  ): unknown => ("value" in op ? op.value : resolvePath(subjects, op.bag));

  // ── the four operators (dsl.ts carries the why) ───────────────────────────
  const OPERATORS = ["is", "isNot", "has", "hasNot"] as const;
  type Operator = (typeof OPERATORS)[number];

  const operatorOf = (
    cond: Record<string, unknown>,
  ): { op: Operator; operand: any } => {
    for (const op of OPERATORS) if (op in cond) return { op, operand: cond[op] };
    throw new Error(
      `Condition has no operator (${OPERATORS.join(" | ")}): ${JSON.stringify(cond)}`,
    );
  };

  // drizzle's own classification. "array" and "json" are the two collection
  // shapes; everything else holds a single value.
  const shapeOf = (column: any): "array" | "json" | "scalar" =>
    column?.dataType === "array"
      ? "array"
      : column?.dataType === "json"
        ? "json"
        : "scalar";

  const compareSql = (column: any, op: Operator, value: unknown): SQL => {
    const shape = shapeOf(column);
    if (op === "is" || op === "isNot") {
      // guarded at boot too; kept here because a scope can be resolved against
      // a column the boot walk could not see (an entity outside `tables`).
      if (shape !== "scalar") {
        throw new Error(
          `\`${op}\` needs a single-value column, got a ${shape} column. Use \`has\`.`,
        );
      }
      return op === "is"
        ? eq(column, value)
        : sql`${column} IS DISTINCT FROM ${value}`;
    }
    const present =
      shape === "array"
        ? sql`${value} = ANY(${column})`
        : shape === "json"
          ? sql`${column} @> ${JSON.stringify(value)}::jsonb`
          : eq(column, value);
    // null-inclusive: a row whose column is NULL does not contain the value, so
    // it must satisfy `hasNot` — SQL's bare NOT would drop it.
    return op === "has"
      ? present
      : sql`(${column} IS NULL OR NOT (${present}))`;
  };

  // the in-memory twin, for context conditions (and, later, direct payload ones)
  const compareValues = (
    subject: unknown,
    op: Operator,
    value: unknown,
  ): boolean => {
    const present = Array.isArray(subject)
      ? subject.includes(value)
      : subject === value;
    if (op === "is") return subject === value;
    if (op === "isNot") return subject !== value;
    return op === "has" ? present : !present;
  };

  // `context` gates whole rules in-memory: a context condition is always a
  // bag-vs-value check (`$session.organization.type is "company"`).
  const contextPasses = (conds: Condition[], subjects: unknown): boolean =>
    conds.every((cond) => {
      if (!("bag" in cond)) return false;
      const { op, operand } = operatorOf(cond as any);
      return compareValues(
        resolvePath(subjects, cond.bag),
        op,
        operandValue(operand, subjects),
      );
    });

  // A rule's target is either all direct conditions (→ a SQL where) or a single
  // traversal (→ an IdSubquery descriptor). The pilot's rules never mix the two.
  function compileRule(
    target: Condition[],
    entity: EntityName,
    subjects: unknown,
  ): { where?: SQL; idSubquery?: IdSubquery<EntityName> } {
    const traversal = target.find((cond) => "join" in cond) as
      | (Condition & { join: string; where: { field: string } & { has: any } })
      | undefined;
    if (traversal) {
      const join = traversal.join as EntityName;
      // `where` is one condition or a LIST of them, AND-ed (a target may need
      // several). Normalise to an array, then AND.
      const conds = (Array.isArray(traversal.where)
        ? traversal.where
        : [traversal.where]) as { field: string; has: any }[];
      return {
        idSubquery: {
          from: entity,
          idColumn: "id",
          joinTo: {
            table: join,
            on: eq(
              columnOf((traversal as any).field),
              joinColumnOf(join, (traversal as any).on),
            ),
          },
          where: and(
            ...conds.map((c) => {
              const { op, operand } = operatorOf(c as any);
              return compareSql(
                columnOf(c.field),
                op,
                operandValue(operand, subjects),
              );
            }),
          )!,
        },
      };
    }
    if (target.length === 0) return { where: TRUE }; // empty target = all rows
    return {
      where: and(
        ...target.map((cond) => {
          const { op, operand } = operatorOf(cond as any);
          return compareSql(
            columnOf((cond as any).field),
            op,
            operandValue(operand, subjects),
          );
        }),
      )!,
    };
  }

  // ── PAYLOAD — conditions on the row being written ─────────────────────────
  // Subjects come out of the access context (`$requestBody.songId`), which the
  // consumer's middleware puts there. Direct conditions settle in memory; a
  // traversal becomes one probe the gate runs before it inserts.
  //
  // `ok: false` means this rule denies — either a direct condition failed, or
  // the value the traversal needs is absent. A missing value must NEVER compile
  // to an unconstrained query.
  function compilePayload(
    conds: Condition[],
    subjects: unknown,
  ): { ok: boolean; probe?: ExistsProbe<EntityName> } {
    let probe: ExistsProbe<EntityName> | undefined;
    for (const cond of conds) {
      const path = (cond as { bag: string }).bag;
      if ("join" in cond) {
        const value = resolvePath(subjects, path);
        if (value === undefined || value === null) return { ok: false };
        const join = (cond as any).join as EntityName;
        const wheres = (
          Array.isArray((cond as any).where)
            ? (cond as any).where
            : [(cond as any).where]
        ) as { field: string }[];
        probe = {
          from: join,
          where: and(
            eq(joinColumnOf(join, (cond as any).on), value),
            ...wheres.map((w) => {
              const { op, operand } = operatorOf(w as any);
              return compareSql(
                columnOf(w.field),
                op,
                operandValue(operand, subjects),
              );
            }),
          )!,
        };
      } else {
        const { op, operand } = operatorOf(cond as any);
        const passes = compareValues(
          resolvePath(subjects, path),
          op,
          operandValue(operand, subjects),
        );
        if (!passes) return { ok: false };
      }
    }
    return { ok: true, probe };
  }

  type EntityScope = {
    base: SQL;
    idSubqueries: IdSubquery<EntityName>[];
    fields?: readonly string[];
  };

  // ── STAGE 1 — THE CONTEXT GATE ────────────────────────────────────────────
  // The explicit first step of every resolver and every allow*. Pure memory,
  // never a query: it compares the rules' `context` against the bag and keeps
  // only the permissions/rules that survive. Cheap, so it runs before anything
  // touches SQL — and it is kept even when the target check would subsume it
  // (free defence in depth).
  type Applicable = { def: PermissionMap[string]; rules: AccessRule[] };
  function contextGate(
    permissions: Iterable<string>,
    entity: string,
    action: Action,
    subjects: unknown,
  ): Applicable[] {
    const applicable: Applicable[] = [];
    for (const name of permissions) {
      const def = config.permissions[name];
      if (!def || def.entity !== entity || !def.actions.includes(action)) {
        continue;
      }
      const rules = def.rules.filter((rule) =>
        contextPasses(rule.context, subjects),
      );
      if (rules.length) applicable.push({ def, rules });
    }
    return applicable;
  }

  // ── STAGE 2 — TARGET COMPILATION ──────────────────────────────────────────
  // OR across the rules that survived the context gate; default-deny = FALSE;
  // the `fields` allowlist is unioned (any all-columns rule ⇒ all = undefined).
  function entityScope(
    permissions: Iterable<string>,
    entity: EntityName,
    action: Action,
    subjects: unknown,
  ): EntityScope {
    const wheres: SQL[] = [];
    const idSubqueries: IdSubquery<EntityName>[] = [];
    const fieldSets: (readonly string[] | undefined)[] = [];
    let allRows = false;

    for (const { def, rules } of contextGate(permissions, entity, action, subjects)) {
      for (const rule of rules) {
        const compiled = compileRule(rule.target, entity, subjects);
        if (compiled.where === TRUE) allRows = true;
        else if (compiled.where) wheres.push(compiled.where);
        else if (compiled.idSubquery) idSubqueries.push(compiled.idSubquery);
        // a contributing rule's fields (undefined = all columns)
        fieldSets.push(def.fields && def.fields.length ? def.fields : undefined);
      }
    }

    const base = allRows
      ? TRUE
      : wheres.length
        ? or(...wheres)!
        : FALSE; // default-deny
    // No contributing rule, or any all-columns rule → all columns (undefined).
    // Only an explicit, non-empty allowlist narrows the projection.
    const fields =
      fieldSets.length === 0 || fieldSets.includes(undefined)
        ? undefined
        : [...new Set(fieldSets.flat() as string[])];
    return { base, idSubqueries, fields };
  }

  // Which forests apply. `accountBaseline` is the USER-role forest (always
  // searchable); `forests[orgType]` is the MEMBERSHIP-role forest for the org
  // the caller is acting in. Neither GRANTS anything on its own — a permission
  // is only collected if the caller actually holds the role that carries it.
  const forestFor = (subjects: any): RoleNode[] => {
    const orgType = resolvePath(subjects, orgTypePath) as
      | string
      | undefined
      | null;
    return [
      ...config.accountBaseline,
      ...(orgType ? (config.forests[orgType] ?? []) : []),
    ];
  };

  function scopeFor<E extends EntityName, A extends Action>(
    permissions: Iterable<string>,
    entity: E,
    action: A,
    subjects: unknown,
  ): Scope<E, A> {
    const perms = permissions;
    const own = entityScope(perms, entity, action, subjects);
    const idSubqueries: IdSubquery<EntityName>[] = [...own.idSubqueries];

    if (action === "read") {
      for (const joinSpec of config.visibilityJoins?.[entity] ?? []) {
        const via = entityScope(perms, joinSpec.via, "read", subjects);
        idSubqueries.push({
          from: joinSpec.via,
          idColumn: joinSpec.fk,
          where: via.base,
        });
      }
    }

    // The brand is a type-only marker (`declare const ... : unique symbol`), so it
    // has no runtime value — we never write the key. The cast is the mint: only
    // this module can produce a value the gate accepts as a Scope.
    return {
      base: own.base,
      idSubqueries: idSubqueries as IdSubquery<E>[],
      fields: own.fields,
    } as unknown as Scope<E, A>;
  }

  // ── BOOT CHECK — `is` may not point at a collection column ────────────────
  // config.ts is pure and has no schema, so this is the earliest point the
  // mismatch can be caught: engine construction, once, not per request. An
  // entity outside `tables` is skipped — it stays the request-time error it is
  // today rather than becoming a new reason a partial mount fails to boot.
  for (const def of Object.values(config.permissions)) {
    for (const rule of def.rules) {
      for (const cond of rule.target) {
        const carriers: any[] = "join" in cond
          ? Array.isArray((cond as any).where)
            ? (cond as any).where
            : [(cond as any).where]
          : [cond];
        for (const c of carriers) {
          if (!c || !("field" in c)) continue;
          const [ent, col] = String(c.field).split(".");
          const column = config.tables[ent]?.[col];
          if (!column) continue;
          const { op } = operatorOf(c);
          if ((op === "is" || op === "isNot") && shapeOf(column) !== "scalar") {
            throw new Error(
              `Permission "${def.name}": \`${op}\` on "${c.field}" — that column holds a ` +
                `${shapeOf(column)}. Use \`has\`, which matches whether a column holds one value or many.`,
            );
          }
        }
      }
    }
  }

  return {
    // ── HYDRATION STEP — role → permission, run ONCE per request ────────────
    // Deliberately separate from the resolve*/allow* surface: permissions can't
    // change mid-request, so the consumer calls this once in middleware and
    // puts the result in the bag. Every method below then takes PERMISSIONS,
    // not roles — the engine itself knows nothing about roles at request time.
    resolveEffectivePermissions(roles: Role[], subjects: unknown): string[] {
      return [...resolvePermissions(roles, forestFor(subjects as any))];
    },

    resolveRead: <E extends EntityName>(
      permissions: Iterable<string>,
      entity: E,
      subjects: unknown,
    ): Scope<E, "read"> => scopeFor(permissions, entity, "read", subjects),
    resolveUpdate: <E extends EntityName>(
      permissions: Iterable<string>,
      entity: E,
      subjects: unknown,
    ): Scope<E, "update"> => scopeFor(permissions, entity, "update", subjects),
    resolveDelete: <E extends EntityName>(
      permissions: Iterable<string>,
      entity: E,
      subjects: unknown,
    ): Scope<E, "delete"> => scopeFor(permissions, entity, "delete", subjects),

    // ── THE COLUMN GATE — update's first gate ──────────────────────────────
    // Pure memory, no query: "may you write THESE fields?", checked against the
    // permission's field list (the same list that projects on read — it is
    // `fieldsForReadUpdate`: read AND update, never create or delete).
    // Runs BEFORE the row gate because it is free. An unset/empty list means
    // all columns, so it never defaults to deny.
    allowUpdate(
      permissions: Iterable<string>,
      entity: EntityName,
      body: Record<string, unknown>,
      subjects: unknown,
    ): Verdict {
      const applicable = contextGate(permissions, entity, "update", subjects);
      if (!applicable.length) {
        return { allow: false, reason: `update ${entity} denied` };
      }
      // any contributing permission with no field list ⇒ all columns allowed
      const unrestricted = applicable.some(
        ({ def }) => !def.fields || def.fields.length === 0,
      );
      if (unrestricted) return { allow: true };

      const allowed = new Set(applicable.flatMap(({ def }) => def.fields!));
      const denied = Object.keys(body).filter((k) => !allowed.has(k));
      return denied.length
        ? {
            allow: false,
            reason: `update ${entity} denied on field(s): ${denied.join(", ")}`,
          }
        : { allow: true };
    },

    // create has no row to constrain, so it yields a verdict rather than a
    // scope. Context settles in memory; a rule's `payload` may additionally
    // demand that the parent it points at admits the caller, and that comes back
    // as probes for the gate to run — the engine still never touches a
    // connection. The incoming row is read from the bag (`$requestBody.*`), put
    // there by the consumer's middleware, not from `_candidate`.
    allowCreate(
      permissions: Iterable<string>,
      entity: EntityName,
      subjects: unknown,
      _candidate?: Record<string, unknown>,
    ): Verdict<EntityName> {
      const applicable = contextGate(permissions, entity, "create", subjects);
      if (!applicable.length) {
        return { allow: false, reason: `create ${entity} denied` };
      }

      const requires: ExistsProbe<EntityName>[] = [];
      let unconditional = false;
      for (const { rules } of applicable) {
        for (const rule of rules) {
          const payload = rule.payload;
          if (!payload?.length) {
            unconditional = true; // context alone grants it
            continue;
          }
          const compiled = compilePayload(payload, subjects);
          if (!compiled.ok) continue; // this rule denies; another may not
          if (compiled.probe) requires.push(compiled.probe);
          else unconditional = true; // in-memory payload conditions all passed
        }
      }

      if (unconditional) return { allow: true };
      if (requires.length) return { allow: true, requires };
      return { allow: false, reason: `create ${entity} denied` };
    },
  };
}

export type Ac<S extends SchemaTables = SchemaTables> = ReturnType<
  typeof createAc<S>
>;
