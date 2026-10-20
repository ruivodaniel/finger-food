# Sort Syntax

Canonical grammar for the `sort` query param.

## Grammar

```
sort     := field ("," field)*
field    := ["-"] identifier
identifier := [A-Za-z_][A-Za-z0-9_]*
```

- A leading `-` on a field means descending.
- No prefix means ascending.
- Fields are comma-separated.
- Whitespace around tokens is trimmed; whitespace inside an identifier is invalid.

## Examples

| Input | Parsed |
|---|---|
| `name` | `[{name, asc}]` |
| `-createdAt` | `[{createdAt, desc}]` |
| `type,-name,createdAt` | `[{type, asc}, {name, desc}, {createdAt, asc}]` |
| `  name  ` (trimmed) | `[{name, asc}]` |
| `type, -name , createdAt` (inner whitespace trimmed) | `[{type, asc}, {name, desc}, {createdAt, asc}]` |

## Rejections (all → 400 at the validator)

| Input | Reason |
|---|---|
| `bogus` (not in whitelist) | `unknown_field` |
| `name,-name` (same field twice) | `duplicate_field` |
| `name,` (trailing comma) | `empty_token` |
| `,name` (leading comma) | `empty_token` |
| `name$` (bad char) | `invalid_character` |
| `-` (bare minus, field becomes empty) | `invalid_character` |

## Why this grammar

- **Comma-separated** — widely used, easy to type in URLs, copy-pastable.
- **`-` prefix for desc** — convention in GitHub API, Stripe API, JSON:API, many others. Zero ceremony compared to `:asc` / `:desc` suffixes.
- **Duplicate fields rejected, not collapsed** — the client is stating a contradiction (`name` asc AND `name` desc). Silently collapsing would hide a bug.
- **Empty tokens rejected** — a trailing comma is almost always a bug in URL construction. Never silent.
- **Identifier-only fields** — the whitelist is the real guard, but rejecting weird characters early produces clearer errors and stops SQL injection attempts dead before they reach Drizzle.

## Parser behaviour

The parser (`parseSortString`) never throws. It returns a discriminated result:

```ts
type ParseSortResult =
  | { ok: true;  value: SortSpec[] }
  | { ok: false; errors: ParseSortError[] };
```

Multiple errors are collected in one parse — if the client sends `sort=nope,alsoNope`, both fields produce errors so the validator can report both at once.

## Adding a field to an endpoint's whitelist

1. Add it to `sortable` in the endpoint's `createListQuerySchema({...})` call.
2. Add its Drizzle column to the `columnMap` passed to `buildOrderBy` in the repository.
3. Add a test case asserting the new field sorts correctly.

The two lists (zod whitelist + repo column map) **must** stay in sync. A field in `sortable` but missing from `columnMap` is a runtime error (thrown by `buildOrderBy`). A column in the map but missing from `sortable` is dead code — the validator will reject it at 400 before it reaches the repo.

## Deliberately not supported

- `asc` / `desc` suffixes (e.g. `name:asc`) — use the `-` prefix.
- Per-field null ordering (`NULLS FIRST/LAST`) — PostgreSQL defaults only.
- Array parameter syntax (`sort[]=...`) — a single comma-separated `sort` field only.
- Nested field paths (`organization.name`) — flat identifiers only. Endpoints that join tables pick stable per-endpoint aliases and add them to `sortable`.
