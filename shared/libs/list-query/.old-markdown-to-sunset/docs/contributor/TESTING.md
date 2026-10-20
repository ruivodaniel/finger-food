# Testing

How to add and test helpers in `@prowd/list-query`.

## Running

```bash
pnpm --filter @prowd/list-query test:unit       # run once
pnpm --filter @prowd/list-query test:watch      # watch mode
pnpm --filter @prowd/list-query typecheck       # tsc --noEmit
```

## Conventions

- **Co-located tests.** `foo.ts` and `foo.test.ts` live side by side. Vitest is configured to pick up `src/**/*.test.ts`.
- **One test file per helper.** If `foo.ts` exports three functions, they all go in `foo.test.ts`. If the file grows past ~300 lines, that's a signal the helper itself needs splitting.
- **No integration tests in this lib.** The module's existing unit / integration tests cover the full wiring once the lib is adopted. The lib's own tests cover only the pure functions.
- **No real Drizzle in tests.** `build-order-by.test.ts` stubs `drizzle-orm` at the module level with `vi.mock`. `apply-pagination.test.ts` uses a fake query builder that records calls. Neither needs a database.
- **No real zod schemas outside the zod helper's own test file.** The factory test exercises `z.parse()` but the Drizzle helpers test stays ORM-agnostic and zod-free.

## Adding a new helper

1. Put the code in the appropriate folder:
   - isomorphic → `src/` (top level, or a new subfolder if it's meaningful)
   - BE-only → `src/server/...`
   - FE-only → `src/client/...`
2. Export it from that folder's `index.ts`.
3. If it's a BE helper, also export it from `src/server/index.ts`.
4. Write `foo.test.ts` co-located.
5. Document it in `docs/consumer/API-REFERENCE.md` and add a usage example to `02-BACKEND-USAGE.md` or `03-FRONTEND-USAGE.md` as appropriate.
6. Run `pnpm --filter @prowd/list-query test:unit && pnpm --filter @prowd/list-query typecheck` before committing.

## What to test

For every helper:
- The happy path with realistic input.
- Every branch / early return.
- Every error or rejection mode — with assertions on the specific reason, not just "it threw".
- Type preservation where relevant (e.g. `applyPagination` returns the same qb type).

Do not test:
- Zod internals (assume `.parse` works).
- Drizzle internals (assume `asc` / `desc` emit correct SQL — we stub them).
- Things the parser already rejects at an earlier layer (don't re-test `unknown_field` in `buildOrderBy.test.ts` — the factory already rejected it).

## Adding a sort syntax rule

If you change `parseSortString`:
1. Update the grammar block in `docs/contributor/SORT-SYNTAX.md`.
2. Add a test case to `parse-sort-string.test.ts`.
3. Re-verify `create-list-query-schema.test.ts` — the factory uses the parser, so schema behaviour may shift.
