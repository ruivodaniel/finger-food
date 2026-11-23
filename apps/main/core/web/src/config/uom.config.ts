/**
 * user-organization-mgmt web wiring — the app's http client, query client,
 * router and toast, plus the product policy the module renders without owning
 * (the role catalog, the preferences policy). Paths use the module defaults
 * (/api/auth + /api/client).
 */

import { toast } from "@libs/web-components";
import { mountUserOrgMgmtWeb, type UserOrgMgmtHttp } from "@modules/user-organization-mgmt/web";
import { assignableRolesByOrgType } from "@configs/access-control";
import { PREFERENCES } from "@configs/product";
import type { QueryClient } from "@tanstack/react-query";
import type { AnyRouter } from "@tanstack/react-router";

export function mountUserOrgMgmt(deps: { http: UserOrgMgmtHttp; queryClient: QueryClient; router: AnyRouter }): void {
  mountUserOrgMgmtWeb({
    http: deps.http,
    queryClient: deps.queryClient,
    router: {
      navigate: async (opts) => {
        await deps.router.navigate(opts as never);
      },
      currentPath: () => {
        const loc = deps.router.state.location;
        return loc.pathname + (loc.searchStr ?? "");
      },
    },
    toast: {
      success: (msg) => toast.success(msg),
      error: (msg) => toast.error(msg),
    },
    // The app owns the AC config; the module stays AC-agnostic and renders
    // whatever catalog it's handed.
    roleCatalog: assignableRolesByOrgType,
    // Likewise the product's preferences policy (the same one the API mount gets).
    preferences: PREFERENCES,
  });
}
