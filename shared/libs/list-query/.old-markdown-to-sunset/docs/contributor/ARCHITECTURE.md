# Architecture

Design decisions for `@prowd/list-query`. Read this before changing the public surface.

## Scope

The lib owns the mechanism of the pagination + sort + search contract end-to-end:
- Types shared BE ↔ FE
- Sort-string grammar + parser
- Zod schema factory (BE)
- Drizzle orderBy + pagination helpers (BE)
- URLSearchParams serializer (FE)

It does **not** own:
- HTTP error rendering (the app's existing zod → 400 path handles it)
- Caching or query-key helpers for TanStack Query
- Cursor pagination
- SQL-level `NULLS FIRST/LAST` customisation (we use PostgreSQL defaults)
- Translation of filter objects beyond the pagination/sort/search triplet plus flat key-value extras

## Dependency direction

```
consumer validators (configs/<module>/api/*.api.ts)
        │
        ├──→ @configs/list-query           (product defaults)
        │         │
        │         └──→ @prowd/list-query   (lib types)
        │
        └──→ @prowd/list-query             (createListQuerySchema, types)

consumer repositories ──→ @prowd/list-query/server  (drizzle helpers)
consumer FE adapter   ──→ @prowd/list-query/client  (URL serializer)
```

**The lib never imports from configs, modules, or apps.** It ships baseline constants so it's standalone and fully unit-testable in isolation. The config is thin — it re-exports those baselines as the product-tunable values and adds nothing else today.

**The config imports lib types only.** Per the architecture rule (*configs → module public types, and lib types only when not module-mediated*). Pagination defaults are not module-mediated — the module doesn't wrap the lib.

**Module validators** import from both and pass defaults explicitly. This keeps the factory pure (no ambient config lookup) and makes the defaults visible at every call site.

## Three-tier default fallback

```
LIST_QUERY_BASELINE (lib)
    → LIST_QUERY_DEFAULTS (product config, typical)
         → per-call-site override (rare, justified)
```

Call sites normally pass `LIST_QUERY_DEFAULTS`. Overriding on a specific endpoint is permitted when there's a genuine reason (e.g. a heavy join page where 25 rows is too many) but should come with a comment explaining why.

## Two entry points, not three

Splits:
- `.`        — isomorphic (types, sort parser, constants)
- `./server` — BE only (zod factory, Drizzle helpers)
- `./client` — FE only (URL serializer)

Finer splits (`./zod`, `./drizzle`) were considered and rejected. A BE file already knows it can use both zod and drizzle; pushing users to import from `/zod` and `/drizzle` separately adds ceremony without catching any realistic mistake. `/server` + `/client` is the coarsest split that still prevents the one mistake worth preventing: a FE bundle accidentally pulling in drizzle.

## No envelope executor

An early design considered `executeListQuery({ db, list, count })` that would take two query builders and enforce "same where" at the type level. We dropped it:

- The helper can't actually enforce the invariant — the two queries are built separately and the helper only receives the result of each builder chain. It would be enforcement theatre.
- The 2-line `Promise.all([listQ, countQ])` is not worth wrapping.
- The code-review rule ("one named `whereExpr` variable, passed to both queries") is more visible in the diff than a helper that hides the shape.

The primitive helpers (`buildOrderBy`, `applyPagination`) plus disciplined review are cleaner than an executor pretending to guarantee something it can't.

## Sort grammar choice

Comma-separated, `-` prefix for descending:

```
sort=type,-name,createdAt
```

Rejected alternatives:
- `sort=type:asc,name:desc` — more verbose, no real advantage
- `sort[]=type&sort[]=-name` — spec says a single `sort` field, not array params
- JSON in query string — hideous in URLs, hostile to URL-building tools

The `-` prefix is conventional (GitHub, Stripe, many REST APIs) and the resulting strings are compact and easy to read.

## Tiebreaker behaviour

The tiebreaker is auto-appended by `buildOrderBy` so call sites can't forget it. When a caller's declared sort already includes the tiebreaker column (by column reference identity), we honour their declared direction and don't duplicate the column in the ORDER BY. This matters for endpoints like "sort by id desc to show newest first" — the caller explicitly wants desc and should get it.

Ties on a secondary column still exist beyond the tiebreaker, but they're impossible to observe if the tiebreaker is a primary key. Total ordering is guaranteed.

## Null ordering

PostgreSQL defaults: nulls last on ASC, nulls first on DESC. We don't emit `NULLS FIRST/LAST` because:
- It matches PostgreSQL's built-in behaviour
- Overriding would force every call site to think about it
- The contract promises "PostgreSQL defaults" — explicit, documented, predictable

If a future endpoint needs different null ordering, add it to `buildOrderBy` as an option at that time. Not before.

## Why co-located tests

Matches `availability-check`'s style. Architecture §12 permits either co-located `*.test.ts` or a `__test__/` folder; co-located makes atomic refactors (moving a helper + its test in one diff) straightforward and keeps the test physically next to the code it covers. `scoped-ac` uses `__test__/` for historical reasons and a different module structure; neither is wrong.

## Why a thin config package

`configs/libs/list-query/` today exports only `LIST_QUERY_DEFAULTS`. It's not overbuilt because pagination defaults are the only product tunable. If future pagination policy ever needs more (e.g. per-endpoint override maps, per-product maximum), it lives in this same folder — the structure is already there.
