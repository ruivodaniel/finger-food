# API Reference

All exported symbols from `@prowd/list-query`, `@prowd/list-query/server`, and `@prowd/list-query/client`.

## `@prowd/list-query` (isomorphic)

### Types

#### `SortDirection`
```ts
type SortDirection = "asc" | "desc";
```

#### `SortSpec`
```ts
interface SortSpec {
  field: string;
  direction: SortDirection;
}
```

One parsed sort field with its direction.

#### `ListQueryBase`
```ts
interface ListQueryBase {
  page: number;
  pageSize: number;
  sort: SortSpec[];
  search?: string;
}
```

The base shape every list endpoint's validated query extends after zod parsing.

#### `ListResponse<T>`
```ts
interface ListResponse<T> {
  rows: T[];
  total: number;
}
```

The uniform response envelope every list endpoint returns.

### Constants

#### `DEFAULT_PAGE`
`1` — the lib baseline default page.

#### `DEFAULT_PAGE_SIZE`
`25` — the lib baseline default page size.

#### `MAX_PAGE_SIZE`
`100` — the lib baseline hard ceiling.

#### `LIST_QUERY_BASELINE`
```ts
const LIST_QUERY_BASELINE: ListQueryDefaults = {
  page: 1,
  pageSize: 25,
  maxPageSize: 100,
};
```

#### `ListQueryDefaults`
```ts
interface ListQueryDefaults {
  page: number;
  pageSize: number;
  maxPageSize: number;
}
```

### Functions

#### `parseSortString(input, opts): ParseSortResult`
```ts
parseSortString(
  input: string | undefined,
  opts: { sortable: readonly string[]; defaultSort: string },
): ParseSortResult
```

Parses a `sort` query-param string into `SortSpec[]`. Never throws — returns a discriminated result.

**Rules:**
- Empty, `undefined`, or whitespace-only input uses `defaultSort`.
- Comma-separated fields, leading `-` = desc.
- Each field must be in `sortable` (else `unknown_field`).
- Duplicates rejected (`duplicate_field`).
- Empty tokens (leading/trailing commas) rejected (`empty_token`).
- Non-identifier characters rejected (`invalid_character`).

Used internally by `createListQuerySchema`. Rarely needed directly.

---

## `@prowd/list-query/server`

### `createListQuerySchema(opts)`
```ts
createListQuerySchema(opts: {
  sortable: readonly string[];
  defaultSort: string;
  searchable?: boolean;
  defaults?: ListQueryDefaults;
}): ZodObject
```

Returns a strict ZodObject ready to be `.merge()`'d with endpoint-specific filters. Output type:

```ts
{
  page: number;            // default from opts.defaults.page
  pageSize: number;        // default from opts.defaults.pageSize
  sort: SortSpec[];        // default parsed from opts.defaultSort
  search?: string;          // only present when searchable: true
}
```

Rejects with 400: `page < 1`, `pageSize > max`, unknown sort field, duplicate sort field, `search` on non-searchable endpoint, any unknown key.

### `buildOrderBy(sort, columnMap, tiebreaker): SQL[]`
```ts
buildOrderBy(
  sort: SortSpec[],
  columnMap: Readonly<Record<string, Column>>,
  tiebreaker: Column,
): SQL[]
```

Translates `SortSpec[]` into a Drizzle orderBy expression list with the tiebreaker auto-appended (as `asc`) unless already present by column identity.

**Throws:** if `sort` references a field absent from `columnMap` (programmer error — the zod factory already rejected unknown fields).

### `applyPagination(qb, page, pageSize): T`
```ts
applyPagination<T extends PaginatableQueryBuilder<T>>(
  qb: T,
  page: number,
  pageSize: number,
): T
```

Applies `.limit(pageSize).offset((page - 1) * pageSize)` to a Drizzle query builder, preserving its type chain.

### `ColumnMap`
```ts
type ColumnMap = Readonly<Record<string, Column>>;
```

### `PaginatableQueryBuilder<Self>`
```ts
interface PaginatableQueryBuilder<Self> {
  limit(n: number): Self;
  offset(n: number): Self;
}
```

### `CreateListQuerySchemaOptions`
Options object accepted by `createListQuerySchema`.

---

## `@prowd/list-query/client`

### `serializeListQuery(input): URLSearchParams`
```ts
serializeListQuery(input: SerializeListQueryInput): URLSearchParams
```

Serializes a list-query options object into `URLSearchParams`. `sort` may be a canonical string or a `SortSpec[]` (re-stringified). `undefined`/`null` values omitted. `false`/`0` preserved.

### `SerializeListQueryInput`
```ts
interface SerializeListQueryInput {
  page?: number | string;
  pageSize?: number | string;
  sort?: string | SortSpec[];
  search?: string;
  [filterKey: string]: string | number | boolean | undefined | null | SortSpec[];
}
```
