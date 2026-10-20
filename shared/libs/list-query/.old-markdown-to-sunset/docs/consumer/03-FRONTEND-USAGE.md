# Frontend Usage

Everything in this doc lives under `@prowd/list-query/client`. The root entry (`@prowd/list-query`) exposes types the FE also uses (`SortSpec`, `ListResponse<T>`).

## `serializeListQuery`

Turns a list-query options object into `URLSearchParams` the FE can drop into a URL.

```ts
import { serializeListQuery } from "@prowd/list-query/client";

const params = serializeListQuery({
  page: 2,
  pageSize: 25,
  sort: "-createdAt",
  search: "alice",
  status: "active",
});
// → page=2&pageSize=25&sort=-createdAt&search=alice&status=active
```

### Accepted input shape

```ts
{
  page?:     number | string;
  pageSize?: number | string;
  sort?:     string | SortSpec[];
  search?:   string;
  [filterKey: string]: string | number | boolean | undefined | null | SortSpec[];
}
```

- `sort` may be already-canonical (`"type,-name,createdAt"`) or a `SortSpec[]`. Arrays are re-stringified into the canonical form.
- `undefined` and `null` values are omitted. `false` and `0` are preserved.
- Extra filter keys flow through verbatim as `String(value)`.

## Adapter pattern

The FE adapter wraps every list endpoint call with `serializeListQuery`:

```ts
// apps/web-main/src/lib/api/user-org-mgmt-api-client.ts
import { serializeListQuery } from "@prowd/list-query/client";

organizationList: {
  $get: async (opts) => {
    const params = serializeListQuery(opts?.query ?? {});
    const response = await request(`/organizations?${params}`);
    return { ok: response.ok, json: () => response.json() };
  },
},
```

## Reading the response

Every list endpoint's `json()` resolves to `{ rows: T[]; total: number }`:

```ts
const response = await apiClient.organizationList.$get({
  query: { page: 1, pageSize: 25, sort: "name" },
});
const { rows, total } = await response.json();
```

Past-end requests return `{ rows: [], total: <real> }`, not a 404. Call sites render an empty state — no special case for "page doesn't exist."

## Typing the client contract

In the module's `web/types.ts`, declare the endpoint's query shape and response shape using the lib's types:

```ts
import type { ListResponse } from "@prowd/list-query";

interface OrganizationListRow {
  id: string;
  name: string;
  // ...
}

organizationList: {
  $get: (opts?: {
    query?: {
      page?: string | number;
      pageSize?: string | number;
      sort?: string;
      search?: string;
      status?: string;
      type?: string;
    };
  }) => Promise<{
    ok: boolean;
    json: () => Promise<ListResponse<OrganizationListRow>>;
  }>;
};
```

The stringly-typed query params match the fact that URL params are strings; the zod factory on the backend coerces them to numbers and `SortSpec[]`.
