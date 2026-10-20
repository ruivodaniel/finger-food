# Getting Started

`@prowd/list-query` is the single source of truth for the pagination + sort + search contract used by every list endpoint in Prowd. This doc gives you everything you need to wire one up.

## The contract (locked)

```
Query params (all optional):
  page       int, min 1, default 1
  pageSize   int, min 1, max 100, default 25
  sort       comma-separated field list, leading "-" = desc
             example: sort=type,-name,createdAt
             unknown field → 400
             every endpoint declares a MANDATORY default sort
  search     string; allowed only on endpoints that declare it
             unsupported search → 400 (never silently ignored)
  (+ endpoint-specific filters like status, type, isActive)

Response shape (uniform, always):
  { rows: T[], total: number }
```

### Behaviour

- Always paginated. Defaults always apply.
- Omit both → `page=1, pageSize=25`
- Provide only `page` → use it; `pageSize` defaults to 25
- Provide only `pageSize` → use it; `page` defaults to 1
- `rows` = the sliced window; `total` = full scoped count
- `sort` is multi-field, hierarchical. Single field is the 1-field case.
- The tiebreaker column (usually `id`) is appended automatically as the final sort field.
- Null ordering follows PostgreSQL defaults (nulls last on ASC, nulls first on DESC).
- The count query runs with the exact same `where` clauses as the list query (never diverge).
- Past-end requests: `{ rows: [], total: <real> }`, never 404.
- Router parses → service passes through → repository applies limit/offset/count.
- One unified query object flows router → service → repository.

## Layer-by-layer checklist

Adding a new list endpoint? Touch these four spots:

1. **Validator** (in `configs/<module>/api/*.api.ts`)
   Compose `createListQuerySchema` + endpoint-specific filters via `.extend({...})` (NOT `.merge()` — `.merge()` silently loses strict mode). Declare `sortable`, `defaultSort`, `searchable`.
2. **Router** (in `shared/modules/<module>/api/routes/*.ts`)
   `zValidator("query", schema)` → pass validated query through → return `{ rows, total }`.
3. **Service** (in `shared/modules/<module>/api/services/*.ts`)
   Pure pass-through of the query object. No new logic.
4. **Repository** (in `shared/modules/<module>/api/repositories/*.ts`)
   Build `whereExpr` once, use it in both the list and count queries, apply `buildOrderBy` + `applyPagination`, return `{ rows, total }`.

Full code walkthrough: see `04-EXAMPLES.md`.

## Frontend checklist

1. **Module type contract** (in `<module>/web/types.ts`)
   The API client interface: add `page?`, `pageSize?`, `sort?` (and `search?` if applicable) to the endpoint's `query`, and change the resolved `json()` return type to `{ rows: T[], total: number }`.
2. **Adapter** (in `apps/web-main/src/lib/api/*.ts`)
   Use `serializeListQuery` to build the URL.
3. **Call sites**
   Read `.rows` and `.total` from the response instead of treating the payload as an array.

## Next

- `02-BACKEND-USAGE.md` — full details on each backend helper
- `03-FRONTEND-USAGE.md` — full details on the URL serializer
- `04-EXAMPLES.md` — real endpoint walkthrough
- `API-REFERENCE.md` — every exported symbol
