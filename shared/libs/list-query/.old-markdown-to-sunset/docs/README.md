# list-query

**What.** Standardised list endpoint contract — pagination, sort, multi-field ordering, search flag, scoped count, plus the React hook that drives URL-backed list state.
**How.** One Zod factory composes the standard query params; one envelope helper shapes the `{ rows, total }` response; one hook (`useListQueryState`) syncs filters/page/sort to URL search params.
**Why.** Every list endpoint has the same plumbing. Centralising it eliminates drift, keeps the count query in sync with the list query (preventing leaks), and gives the frontend a single source of truth for list state.

---

## For consumers

Building a list endpoint or a list page? Start in [`consumer/`](./consumer/).

## For contributors

Changing the lib itself? Start in [`contributor/`](./contributor/).
