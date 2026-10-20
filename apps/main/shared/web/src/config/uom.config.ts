/**
 * user-organization-mgmt web config — where the module's client finds its
 * API surfaces. Paths use the module defaults (/api/auth + /api/client).
 */

import { Env } from "@/env";
import type { UserOrgMgmtWebConfig } from "@modules/user-organization-mgmt/web";
import { assignableRolesByOrgType } from "@configs/access-control";
import { PREFERENCES } from "@configs/product";

export const uomWebConfig: UserOrgMgmtWebConfig = {
  apiBaseUrl: Env.VITE_API_URL,
  // The app owns the AC config; the module stays AC-agnostic and renders
  // whatever catalog it's handed.
  roleCatalog: assignableRolesByOrgType,
  // Likewise the product's preferences policy (the same one the API mount gets).
  preferences: PREFERENCES,
};
