# Backend Usage

Everything in this doc lives under `@prowd/list-query/server`. The root entry (`@prowd/list-query`) exposes only isomorphic types and the sort parser.

## `createListQuerySchema`

Produces the validator every list endpoint composes with its own filters.

```ts
import { z } from "zod";
import { createListQuerySchema } from "@prowd/list-query/server";
import { LIST_QUERY_DEFAULTS } from "@configs/list-query";

export const GetOrganizationsQuerySchema = createListQuerySchema({
  defaults: LIST_QUERY_DEFAULTS,
  sortable: ["name", "createdAt"] as const,
  defaultSort: "name",
  searchable: true,
}).extend({
  status: z.enum(["active", "inactive"]).optional(),
  type:   z.enum(["system_admin", "platform_admin", "organization"]).optional(),
});
```

> **Use `.extend()`, not `.merge()`.** Zod's `.merge()` takes unknown-keys mode from the right-hand side (default: strip), silently losing the strict mode the factory applied. `.extend()` preserves it. This is the single most important gotcha of the factory.

### What you pass

- **`sortable`** — tuple of allowed sort field names. Any token in the client's `sort` param that isn't in this list is a 400.
- **`defaultSort`** — mandatory default. Used when the client sends no `sort`. Same grammar as the `sort` param (`"name"`, `"-createdAt"`, `"type,-name"`). The default itself must parse against `sortable`.
- **`searchable`** — if `true`, the schema accepts an optional `search` string. If `false` (or omitted), sending `search` is a 400. No silent ignoring.
- **`defaults`** — the three numeric defaults (`page`, `pageSize`, `maxPageSize`). Typically `LIST_QUERY_DEFAULTS` from `@configs/list-query`. Omit for the lib baseline (1 / 25 / 100).

### What you get

A strict ZodObject whose output type is:

```ts
{
  page: number;
  pageSize: number;
  sort: SortSpec[];      // always non-empty — default injected if absent
  search?: string;        // only present if searchable: true
}
```

Strict means any unknown key is a 400. After `.extend({...})` the extended schema stays strict.

### Validator rejections (all → 400)

| Input | Reason |
|---|---|
| `page=0`, `page=-1`, `page=1.5`, `page=abc` | `page` must be positive int |
| `pageSize=101` (with default max) | exceeds `maxPageSize` |
| `sort=bogus` | unknown field (not in `sortable`) |
| `sort=name,-name` | duplicate field |
| `sort=name,` | empty token (trailing comma) |
| `search=...` on non-searchable endpoint | unknown key via strict |
| any other extra key | unknown key via strict |

## `buildOrderBy`

Translates `SortSpec[]` into a Drizzle `SQL[]` with the tiebreaker auto-appended.

```ts
import { buildOrderBy } from "@prowd/list-query/server";
import * as schema from "../models";

const orderBy = buildOrderBy(
  query.sort,
  {
    name:      schema.organization.name,
    createdAt: schema.organization.createdAt,
  },
  schema.organization.id, // tiebreaker
);
```

The column map must cover every entry in the zod `sortable` whitelist for the same endpoint — the two stay in sync by convention. A runtime mismatch throws (it's a programmer bug, not a user bug).

The tiebreaker is appended as `asc(...)` unless the caller already sorted by the same column identity, in which case the declared direction wins and no duplicate is added.

Null ordering follows PostgreSQL defaults — we don't emit `NULLS FIRST/LAST`.

## `applyPagination`

```ts
import { applyPagination } from "@prowd/list-query/server";

const listQ = applyPagination(
  base.orderBy(...orderBy),
  query.page,
  query.pageSize,
);
```

Equivalent to `.limit(pageSize).offset((page - 1) * pageSize)`. The helper exists so every list endpoint computes the offset identically and the intent stays visible at the call site.

## The "same where" rule

This is the single most important backend invariant:

> The count query MUST use the exact same `where` expression as the list query. Never diverge.

The lib doesn't enforce this — it can't, the two queries are built separately. Your code enforces it by building one `whereExpr` variable and passing it to both:

```ts
const whereExpr = and(
  org.where,
  query.search ? ilike(schema.organization.name, `%${query.search}%`) : undefined,
  query.status ? sql`(${schema.organization.metadata})::jsonb->>'status' = ${query.status}` : undefined,
);

const base = this.db
  .select({ ...org.select } as SelectedFields)
  .from(schema.organization)
  .where(whereExpr);                       // <-- same whereExpr

const listQ  = applyPagination(base.orderBy(...orderBy), query.page, query.pageSize);
const countQ = this.db
  .select({ c: count() })
  .from(schema.organization)
  .where(whereExpr);                       // <-- same whereExpr

const [rows, [{ c }]] = await Promise.all([listQ, countQ]);
return { rows, total: Number(c) };
```

One named variable, used twice. A diff that touches one `where` without the other is obvious during code review. That's the enforcement mechanism.

### Scoped count

When `engine.resolveForReadUpdate(...)` + `scopeFilterBuilder.compile(...)` is used, its `where` output must flow into `whereExpr` too. The count then respects the exact same scope filter as the list — unauthorised users see `total: 0` without ever hitting a 403.
