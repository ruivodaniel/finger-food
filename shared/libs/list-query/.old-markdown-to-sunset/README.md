# @libs/list-query

Reusable list-query contract for Prowd: pagination + sort + search, uniform across every list endpoint (backend and frontend).

## Contract (locked)

```
Query params (optional, standardized across every list endpoint):
  page       int, min 1, default 1
  pageSize   int, min 1, max 100, default 25
  sort       comma-separated field list; leading "-" = desc
             e.g. sort=type,-name,createdAt
             each field whitelisted per endpoint → unknown → 400
             every endpoint declares a MANDATORY default stable sort
  search     string; only on endpoints that declare it
             unsupported search → 400 (never silent-ignore)
  (+ endpoint-specific filters like status, type, isActive)

Response (uniform, always):
  { rows: T[], total: number }
```

See the full contract in `docs/consumer/01-GETTING-STARTED.md`.

## Public entry points

| Entry | Use from | What you get |
|---|---|---|
| `@libs/list-query` | BE + FE | Types (`SortSpec`, `ListResponse`, `ListQueryBase`), sort-string parser, baseline constants |
| `@libs/list-query/server` | BE only | `createListQuerySchema` (zod factory), `buildOrderBy`, `applyPagination` |
| `@libs/list-query/client` | FE only | `serializeListQuery` (URLSearchParams builder) |

Deep imports (`@libs/list-query/src/...`) are forbidden — only the three roots.

## Quick links

- **Consumer docs** — `docs/consumer/`
  - `01-GETTING-STARTED.md` — the contract in one page
  - `02-BACKEND-USAGE.md` — zod factory, Drizzle helpers, "same where" rule
  - `03-FRONTEND-USAGE.md` — URLSearchParams serializer + API adapter pattern
  - `04-EXAMPLES.md` — full walkthrough of a list endpoint
  - `API-REFERENCE.md` — every exported symbol
- **Contributor docs** — `docs/contributor/`
  - `ARCHITECTURE.md` — design decisions
  - `SORT-SYNTAX.md` — grammar of the sort string
  - `TESTING.md` — how to add helpers and their tests

## Peer dependencies

- `zod` — optional; required only when importing from `/server`
- `drizzle-orm` — optional; required only when importing from `/server`

The root and `/client` entries have no runtime dependencies.
