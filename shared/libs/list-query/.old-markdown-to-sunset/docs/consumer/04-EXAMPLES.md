# Examples

Full walkthrough of wiring a list endpoint end-to-end. This mirrors the structure used by `user-organization-mgmt`.

## Goal

Ship `GET /organizations` returning paginated, sorted organizations with optional search, status, and type filters.

## 1. Validator — `configs/user-organization-mgmt/api/organization.api.ts`

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

export type GetOrganizationsQuery = z.infer<typeof GetOrganizationsQuerySchema>;
```

Output type of `GetOrganizationsQuery`:

```ts
{
  page: number;           // default 1
  pageSize: number;       // default 25
  sort: SortSpec[];       // default [{ field: "name", direction: "asc" }]
  search?: string;
  status?: "active" | "inactive";
  type?:   "system_admin" | "platform_admin" | "organization";
}
```

## 2. Router — `shared/modules/user-organization-mgmt/api/routes/create-organization-router.ts`

```ts
.get(
  "/",
  zValidator("query", validationSchemas.GetOrganizationsQuery),
  async (c) => {
    const query = c.req.valid("query");
    const accessContext = getAccessContext(c);
    const result = await orgService.getAll(accessContext, query);
    return c.json(result); // already { rows, total }
  },
)
```

No param parsing, no envelope building, no fallback values. The validator applied everything.

## 3. Service — `shared/modules/user-organization-mgmt/api/services/organization.service.ts`

```ts
async getAll(accessContext: AccessContext, query: GetOrganizationsQuery) {
  return this.repo.findAll(accessContext, query);
}
```

Pure passthrough. The service exists so future business logic has a home, but for a read-only paginated list there's nothing to do.

## 4. Repository — `shared/modules/user-organization-mgmt/api/repositories/organization.repository.ts`

```ts
import { applyPagination, buildOrderBy } from "@prowd/list-query/server";
import type { ListResponse } from "@prowd/list-query";
import { and, count, eq, ilike, sql } from "drizzle-orm";
import * as schema from "../models";

async findAll(
  accessContext: AccessContext,
  query: GetOrganizationsQuery,
): Promise<ListResponse<OrganizationListRow>> {
  const orgVerdict = this.engine.resolveForReadUpdate(
    accessContext.effectiveRoles, "organization", "read", accessContext.subjects,
  );
  const org = this.scopeFilterBuilder.compile("organization", orgVerdict);
  // Enrichment view: caller-owned join, no engine call.
  const summary = { where: undefined, select: { /* extra columns from orgSummaryView */ } };

  const whereExpr = and(
    org.where,
    summary.where,
    query.search
      ? ilike(schema.organization.name, `%${query.search}%`)
      : undefined,
    query.status
      ? sql`(${schema.organization.metadata})::jsonb->>'status' = ${query.status}`
      : undefined,
    query.type
      ? eq(schema.organization.type, query.type)
      : undefined,
  );

  const orderBy = buildOrderBy(
    query.sort,
    {
      name:      schema.organization.name,
      createdAt: schema.organization.createdAt,
    },
    schema.organization.id,
  );

  const base = this.db
    .select({ ...org.select, ...summary.select })
    .from(schema.organization)
    .leftJoin(
      schema.orgSummaryView,
      eq(schema.organization.id, schema.orgSummaryView.organizationId),
    )
    .where(whereExpr);

  const listQ = applyPagination(
    base.orderBy(...orderBy),
    query.page,
    query.pageSize,
  );

  const countQ = this.db
    .select({ c: count() })
    .from(schema.organization)
    .leftJoin(
      schema.orgSummaryView,
      eq(schema.organization.id, schema.orgSummaryView.organizationId),
    )
    .where(whereExpr); // same whereExpr — never diverge

  const [rows, [{ c }]] = await Promise.all([listQ, countQ]);
  return { rows, total: Number(c) };
}
```

Notice:
- `whereExpr` is **one** variable used in **two** queries. That's the enforcement mechanism for "scoped count uses the exact same where."
- The `leftJoin` is present on both the list and the count, matching the filter semantics.
- `scopeFilterBuilder.compile(...).where` is inside `whereExpr`, so the count respects access control identically.

## 5. Frontend type — `shared/modules/user-organization-mgmt/web/types.ts`

```ts
import type { ListResponse } from "@prowd/list-query";

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

## 6. Frontend adapter — `apps/web-main/src/lib/api/user-org-mgmt-api-client.ts`

```ts
import { serializeListQuery } from "@prowd/list-query/client";

organizationList: {
  $get: async (opts) => {
    const params = serializeListQuery(opts?.query ?? {});
    const response = await request(`/organizations?${params}`);
    return { ok: response.ok, json: () => response.json() };
  },
},
```

## 7. Frontend call site

```ts
const res = await apiClient.organizationList.$get({
  query: { page: 1, pageSize: 25, sort: "name", search: searchTerm },
});
const { rows, total } = await res.json();

setOrganizations(rows.map(/* ... */));
setTotal(total);
```

That's the full loop.
